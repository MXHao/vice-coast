/* R44 offline player gait. Pure presentation; never mutates controller, clock, sound or storage. */
((global) => {
  "use strict";
  const weightsFor = ["idle", "walk", "jog", "sprint"];
  const stride = [0, 0.93 * 80 / 60, 4 * 56 / 60, 7.90 * 40 / 60];
  // Frozen R43 outsole evidence: first persistent foot contact, not midpoint of a step.
  // Source frame 1 is phase zero. Walk: f78 left / f38 right; Jog: f1.5 / f29.5;
  // Sprint: f1 already planted / f21.5. A tiny asymmetric warp pins both markers.
  const markers = [[0, .5], [77 / 80, 37 / 80], [.5 / 56, 28.5 / 56], [0, 20.5 / 40]];
  const jumpDuration = 2 * 4.5 / 14; // Mirrors native arc timing; the edge still comes from the controller.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const unit = v => clamp(v, 0, 1);
  const fract = v => v - Math.floor(v);
  const smooth = (start, end, value) => { const x = unit((value - start) / (end - start)); return x*x*(3-2*x); };
  const mix = (a,b,x) => a + x * (b-a);
  function sampleGait(index, canonical) {
    if (!index) return fract(canonical);
    const [left, right] = markers[index];
    const a = fract(canonical), b = fract(right - left);
    return fract(left + (a < .5 ? 2*a*b : b + (2*a-1)*(1-b)));
  }
  function create() {
    let phase, idlePhase, filtered, airTime, landTime, prevGround, wasActive, pose, landingMix, lastFoot, secondsSinceFoot, visual, lastOffset;
    function reset() {
      phase = .88; idlePhase = 0; filtered = 0;
      airTime = 0; landTime = Infinity; prevGround = true; wasActive = false;
      pose = []; visual = [1,0,0,0]; lastOffset = 0; landingMix = 0; lastFoot = null; secondsSinceFoot = Infinity;
    }
    reset();
    function emit(samples, state, events, visualYOffset = 0) {
      pose = samples.filter(k => k.weight > 1e-6);
      lastOffset = visualYOffset;
      const total = pose.reduce((sum,k) => sum + k.weight, 0);
      pose.forEach(k => { k.weight /= total; });
      return {state, clips: pose, footfalls: events, visualYOffset};
    }
    const item = (name, phase, weight) => ({name, phase, weight});
    function step({dt, speed, grounded, inactive = false, reset: cut = false} = {}) {
      if (cut || inactive || dt > .25 || speed > 11) reset();
      if (inactive) return emit([item("idle", 0, 1)], "inactive", []);
      if (!Number.isFinite(dt) || dt <= 0 || !Number.isFinite(speed) || typeof grounded !== "boolean") {
        return {state:"hold", clips:pose.length ? pose : [item("idle", 0, 1)], footfalls:[], visualYOffset:lastOffset};
      }
      // Native updates at <=50ms. Ignore any giant reposition rather than reporting
      // rapid phantom heel strikes from correction, resume or scene teleport.
      if (dt > .25 || speed > 11) return emit([item("idle", 0, 1)],"idle",[]);
      dt = Math.min(dt, .1);
      speed = clamp(speed,0,8);
      const events = [];
      secondsSinceFoot += dt;
      const justLanded = wasActive && !prevGround && grounded;
      const justJumped = !grounded && prevGround;
      prevGround = grounded;
      wasActive = true;
      idlePhase = fract(idlePhase+dt/2.5);
      filtered = mix(filtered,speed,-Math.expm1(-dt/(speed>filtered?.059:.076)));
      const walkAmount = smooth(.07,.73,filtered);
      const jogAmount = smooth(1.27,2.95,filtered);
      const sprintAmount = smooth(3.62,5.82,filtered);
      const weight = [1-walkAmount,walkAmount*(1-jogAmount),walkAmount*jogAmount*(1-sprintAmount),walkAmount*jogAmount*sprintAmount];
      // Damping selector weights separately caps body-pose velocity during
      // the native sprint acceleration/deceleration, even when the speed
      // passes through an entire blend band in only a few frames.
      visual = visual.map((w,i) => mix(w,weight[i],-Math.expm1(-dt/.095)));
      if (visual.every((w,i)=>Math.abs(w-weight[i])<1e-3)) visual=weight;
      const baseState = weightsFor[visual.indexOf(Math.max(...visual))];
      if (justJumped) { airTime = 0; landTime = Infinity; }
      if (justLanded) {
        landTime = 0;
        landingMix = smooth(.45,3.12,speed);
        lastFoot = null;
        secondsSinceFoot = 0;
        events.push({foot:"both",kind:"land"});
      }
      const previous = phase;
      const cyclesPerM = (1-jogAmount)/stride[1]+jogAmount*((1-sprintAmount)/stride[2]+sprintAmount/stride[3]);
      if (grounded && speed > .045) phase += dt * speed * cyclesPerM;
      const base = visual.map((w,i)=>item(weightsFor[i],i ? sampleGait(i,phase) : idlePhase,w));
      if (!grounded) {
        airTime += dt;
        const takeWeight = 1-smooth(.092,.205,airTime);
        const groundWeight = 1-smooth(0,.084,airTime);
        const arrival = smooth(jumpDuration-.108,jumpDuration-.006,airTime);
        const fly = (1-groundWeight)*(1-takeWeight)*(1-arrival);
        const touch = (1-groundWeight)*(1-takeWeight)*arrival;
        const start = (1-groundWeight)*takeWeight;
        const p = [...base.map(k=>item(k.name,k.phase,k.weight*groundWeight)),
          item("takeoff", .052 + .131*smooth(0,.205,airTime), start),
          item("air", fract(.02 + airTime/2.5), fly),
          item("land", 0, touch)];
        // Visual root only: the air-pose artwork carries an extra 16cm of
        // baseline elevation; preserve tuck but avoid adding the entire baseline.
        return emit(p,airTime<.13?"takeoff":"air",events,-.14*fly);
      }
      let landWeight = 0, landPhase = 0;
      if (Number.isFinite(landTime)) {
        const end = mix(.435,.245,landingMix);
        landWeight = 1-smooth(mix(.15,.075,landingMix),end,landTime);
        landPhase = smooth(0,end,landTime)*mix(.78,.46,landingMix);
        if (landTime >= end) landTime = Infinity;
        else landTime += dt;
      }
      // Cross aligned contacts, not legacy clock edges. Keep counting distance
      // under low visual weight but suppress sound until the corresponding mesh
      // is actually planted and on camera. Only one channel can trigger a step.
      if (!justLanded && speed > .18 && phase > previous && (1-visual[0])*(1-landWeight) >= .54) {
        for (let half = Math.floor(previous*2)+1;half <= Math.floor(phase*2);half++) {
          const foot = half%2===0 ? "left" : "right";
          if (foot===lastFoot || secondsSinceFoot<.086) continue;
          events.push({foot,kind:sprintAmount>.35 || (jogAmount>.72 && speed>3.10)?"runstep":"step"});
          lastFoot = foot; secondsSinceFoot = 0;
        }
      }
      phase = filtered < .055 && visual[0] > .999 && speed < .045 ? .88 : fract(phase);
      if (landWeight>1e-6) base.push(item("land", landPhase, landWeight));
      if (landWeight) base.forEach(k=>{ if(k.name!=="land") k.weight *= 1-landWeight; });
      return emit(base,landWeight>.5?"land":baseState,events);
    }
    return Object.freeze({step,reset});
  }
  global.VCGaitR44 = Object.freeze({create});
})(globalThis);

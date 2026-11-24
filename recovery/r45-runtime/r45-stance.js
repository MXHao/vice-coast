// Read-only presentation clocks. Uses accepted *native displacement*, not requested speed.
// Contact markers/stride come from the separately verified, same-skeleton artwork.
const __vcR45Stance=(()=>{
  const unit=x=>Math.max(0,Math.min(1,x)),fract=x=>x-Math.floor(x),smooth=x=>{x=unit(x);return x*x*(3-2*x);};
  function create(meta){
    const {left,right}=meta.contacts, half=fract(right-left), cycle=meta.strideM;
    const atPhase=u=>fract(left+(u<.5?2*u*half:half+(2*u-1)*(1-half)));
    const idleDuration=meta.durations.crouch_idle;
    let phase,idlePhase,walkMix,weight,quiet,resting;
    function reset(){phase=0;idlePhase=0;walkMix=0;weight=0;quiet=0;resting=true;}
    reset();
    function step(base,{dt,speed,crouched,grounded,alreadyMale,warp,nativeFoley},clock){
      if(!grounded||warp||dt>.25){reset();return base;}
      // We already showed native crouch while the optional addon was pending.
      // Hand directly to its finished crouched counterpart rather than briefly standing up.
      if(crouched&&!alreadyMale&&weight===0){weight=1;quiet=.15;}
      const was=weight;
      weight=unit(weight+(crouched?dt/.32:-dt/.32));
      if(!weight&&!was)return base;
      const w=smooth(weight);
      if((!was&&weight)||(!weight&&was))quiet=Math.max(quiet,.085);
      quiet=Math.max(0,quiet-dt);
      idlePhase=fract(idlePhase+dt/idleDuration);
      // No re-timing on frame-rate changes; separate breathing and distance phases.
      // Near rest only, ease between the breathing and stepping artworks.
      const target=smooth((speed-.035)/.20);
      walkMix+=(target-walkMix)*-Math.expm1(-dt/(target>walkMix?.065:.075));
      if(Math.abs(target-walkMix)<.001)walkMix=target;
      // Both clip families must transfer on the SAME supporting foot. When
      // coming from upright, start at its observed aligned contact rather than
      // spuriously restarting the cycle. Blend the two distance-to-phase rates
      // over the transition, then keep R44's inactive clock aligned for rising.
      const inherited=clock?.readPhase();
      if(crouched&&!was&&alreadyMale&&speed>.16&&Number.isFinite(inherited))phase=inherited;
      const prev=phase;
      if(speed>.03){
        const localRate=dt*(w===1?speed:Math.min(speed,1.45))/cycle;
        const ordinary=Number.isFinite(inherited)?fract(inherited-prev):localRate;
        const delta=ordinary>.34?localRate:ordinary*(1-w)+localRate*w;
        phase+=delta;resting=false;
        clock?.alignPhase(phase);
      }
      const footfalls=[];
      if(!nativeFoley&&quiet===0){
        if(w>=.5){
          if(w*walkMix>=.50&&speed>.16){
            const edge=Math.floor(phase*2);
            if(edge>Math.floor(prev*2))footfalls.push({foot:edge%2?'right':'left',kind:'step'});
          }
        }else for(const f of base.footfalls)if(f.kind==='step'||f.kind==='runstep')footfalls.push(f);
      }
      if(footfalls.length)quiet=.15;
      phase=fract(phase);
      if(speed<.03&&walkMix===0&&!resting){resting=true;phase=0;}
      const ground=base.clips.filter(c=>c.name!=='land'&&c.name!=='air'&&c.name!=='takeoff');
      // Never cross-dissolve airborne/landing art with authored grounded crouch.
      const from=ground.length?ground:[{name:'idle',phase:0,weight:1}];
      const sum=from.reduce((n,c)=>n+c.weight,0);
      const clips=[...from.map(c=>({name:c.name,phase:c.name==='idle'||!clock?c.phase:clock.locomotionPhase(c.name,phase),weight:c.weight*(1-w)/sum})),
        {name:'crouch_idle',phase:idlePhase,weight:w*(1-walkMix)},
        {name:'crouch_walk',phase:atPhase(phase),weight:w*walkMix}].filter(c=>c.weight>1e-7);
      if(!weight){reset();return {...base,footfalls};}
      return {state:w>=.5?(walkMix>.5?'crouch_walk':'crouch_idle'):base.state,clips,footfalls,visualYOffset:0};
    }
    return Object.freeze({reset,step});
  }
  return Object.freeze({create});
})();

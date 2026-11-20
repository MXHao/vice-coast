// Title-original virtual balance for the final seven choices. No imported
// timing, clock scheduling, action generation, traffic or story behavior.
export const TITLE_ADAPTATION_NOTES=Object.freeze({
 awma:'长恢复 · 轻型置换',
 barrett:'最慢恢复 · 高支出重型',
 kar98:'长恢复 · 简洁巡游',
 awm:'长恢复 · 小容量',
 vector:'短间隔下限 · 单次确认',
 mg3silver:'中段容量 · 稳定节奏',
 gatling:'有限容量 · 准备指示；每次需主动触发'
});
export const TITLE_LONG_TOTAL=Object.freeze({awma:1.73,barrett:2.24,kar98:1.47,awm:1.94});
const titleRotaryWait=.62,titleStepLimit=.12,titleTimeEpsilon=1e-8;
const titleStep=(dt,active)=>active&&Number.isFinite(dt)&&dt>0?Math.min(titleStepLimit,dt):0;
export function createTitleDelayLedger(){
 const pending=new Map();
 return {
  pending:()=>pending.size>0,
  remaining:id=>pending.get(id)??0,
  noteAccepted(id){
   if(!Object.hasOwn(TITLE_LONG_TOTAL,id)||pending.has(id))return false;
   pending.set(id,TITLE_LONG_TOTAL[id]);return true;
  },
  tick(dt,active){
   const step=titleStep(dt,active);if(!step)return;
   for(const [id,t] of pending){const next=t-step;if(next<titleTimeEpsilon)pending.delete(id);else pending.set(id,next);}
  }
 };
}
export function createTitleRotaryMeter(){
 let t=0;
 return {
  reset(){t=0;},
  tick(dt,active){const n=t+titleStep(dt,active);t=(n+titleTimeEpsilon>=titleRotaryWait)?titleRotaryWait:n;},
  ready:()=>t===titleRotaryWait,
  remaining:()=>titleRotaryWait-t,
  progress:()=>t/titleRotaryWait
 };
}

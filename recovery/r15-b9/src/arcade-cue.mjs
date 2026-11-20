// Vice Coast original arcade-foley study. No recordings, external assets, or runtime side effects.
const P = Object.freeze({
  glint: Object.freeze([.115,1260,420,0.77,.21,0.28,.34,1.0]),
  comet: Object.freeze([.235,610,115,1.35,.41,.49,.40,.54]),
  ripple:Object.freeze([.315,300,205,0.55,.22,.72,.49,.28]),
  prism: Object.freeze([.180,720,490,1.78,.27,.36,.50,.83])
});
export const arcadeCueIds=Object.freeze(Object.keys(P));
export function arcadeCue(id, rate=24000, variation=0) {
  if(!Object.hasOwn(P,id)||!Number.isInteger(rate)||rate<8000||rate>96000||!Number.isInteger(variation)||variation<0||variation>3) throw new RangeError("Invalid arcade cue inputs");
  const [time,f0,f1,fm,air,depth,peak,bright]=P[id], n=Math.round(rate*time);
  const output=new Float32Array(n), tau=2*Math.PI, bend=1+.024*(variation-1.5);
  let state=(0x49ac17f3+((arcadeCueIds.indexOf(id)+1)*0x32813683)+variation*0x941533b)|0;
  let phase=0, mod=0, fast=0, slow=0, eMax=0, sub=0;
  const alpha=1-Math.exp(-tau*(400+bright*2200)/rate), beta=1-Math.exp(-tau*270/rate);
  for(let i=0;i<n;i++){
    const t=i/rate, u=i/(n-1), hit=(1-Math.exp(-t/.0017))*(1-u)**2, fade=1-Math.min(1,Math.max(0,(u-.78)/.22))**2;
    state^=state<<13;state^=state>>>17;state^=state<<5;
    const white=(state>>>0)/2147483648-1;
    fast+=alpha*(white-fast);slow+=beta*(white-slow);
    const f=(f1+(f0-f1)*Math.exp(-t/(time*.20)))*bend;
    phase+=tau*f/rate;mod+=tau*(f*.713+89)/rate;sub+=tau*(60+f*.18)/rate;
    const sign=Math.sin(phase+fm*(1-u)*Math.sin(mod));
    const grain=(fast-slow)*Math.exp(-t/(time*.29));
    const low=Math.sin(sub)*Math.exp(-t/(time*.46));
    const sparkle=Math.sin(phase*1.37+Math.sin(mod*.63))*Math.exp(-t/(time*.16));
    output[i]=hit*fade*(.59*sign*Math.exp(-t/(time*.60))+air*grain+depth*.48*low+.25*bright*sparkle);
    if(id==="ripple") output[i]*=.73+.27*Math.cos(tau*(16*t+18*t*t));
    if(id==="prism"&&i>rate*.011) output[i]+=.13*fade*output[i-Math.round(rate*.011)];
    eMax=Math.max(eMax,Math.abs(output[i]));
  }
  for(let i=0;i<n;i++)output[i]*=peak/eMax;
  output[0]=0; output[n-1]=0;
  return output;
}
export function makeArcadeAudioBuffer(context,id,variation=0){
  const samples=arcadeCue(id,context.sampleRate,variation);
  const target=context.createBuffer(1,samples.length,context.sampleRate);
  target.copyToChannel(samples,0);
  return target; // Caller decides if/when to attach and play.
}


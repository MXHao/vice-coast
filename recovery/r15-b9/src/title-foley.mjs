import {arcadeCue} from './arcade-cue.mjs';
// Original abstract audio identities. All time, contour, color, and component
// choices below are authored for this game; no recording or reference is used.
// Each component is [prototype, variation, onset, length, level, color].
const voices=Object.freeze({
 spas12:{signature:'split crystal',parts:[['prism',1,0,.112,.78,.65],['comet',2,.168,.078,1,.65],['prism',2,.225,.063,.32,.55]]},
 xm1014:{signature:'opal dip',parts:[['glint',1,0,.072,.32,.20],['ripple',3,.094,.185,1,-.27]]},
 nova:{signature:'cobalt graze',parts:[['comet',3,0,.264,1,.60],['ripple',1,.198,.136,.20,.18]]},
 m37:{signature:'clay rhythm',parts:[['ripple',2,0,.130,.76,.40],['glint',0,.032,.075,.68,-.55],['comet',1,.187,.109,.43,.56]]},
 m14ebr:{signature:'violet notch',parts:[['glint',2,0,.119,.76,.75],['prism',3,.103,.146,1,.54],['glint',1,.221,.102,.35,.66]]},
 awma:{signature:'pendant chime',parts:[['glint',1,0,.081,.54,.72],['prism',2,.197,.116,1,.40],['glint',0,.209,.084,.41,.70]]},
 barrett:{signature:'brass cavern',parts:[['prism',1,0,.077,.48,-.62],['ripple',3,.094,.214,1,-.52],['comet',2,.208,.122,.36,-.58]]},
 kar98:{signature:'grainwood patter',parts:[['comet',2,0,.112,1,-.68],['ripple',0,.051,.202,.40,.25],['prism',3,.183,.082,.28,.08]]},
 awm:{signature:'blue bridge',parts:[['comet',0,0,.111,.88,.29],['glint',3,.085,.092,1,.25],['ripple',2,.217,.113,.44,-.16]]},
 vector:{signature:'needle flash',parts:[['prism',0,0,.059,.62,.86],['glint',3,.025,.119,1,.72],['glint',1,.092,.048,.35,.81]]},
 mg3silver:{signature:'silver facets',parts:[['ripple',1,0,.080,.43,.35],['prism',1,.044,.112,1,.76],['glint',2,.165,.075,.58,.73],['prism',3,.247,.079,.32,.52]]},
 gatling:{signature:'rotor jewel',parts:[['prism',2,0,.120,.75,-.25],['ripple',0,.059,.208,1,.75],['glint',1,.216,.121,.57,.72]]}
});
export const ORIGINAL_CUE_IDS=Object.freeze(Object.keys(voices));
export const TITLE_CUE_RATE=22050;
export const ORIGINAL_SIGNATURES=Object.freeze(Object.fromEntries(ORIGINAL_CUE_IDS.map(id=>[id,voices[id].signature])));
export function renderTitleCue(id,{neutralVariation=false}={}){
 if(!Object.hasOwn(voices,id))throw RangeError('No title-original cue for this item');
 const rate=TITLE_CUE_RATE, parts=voices[id].parts, n=Math.ceil(rate*Math.max(...parts.map(p=>p[2]+p[3])));
 if(n<800||n>8500)throw RangeError('Title cue exceeds the audio budget');
 const out=new Float32Array(n),targetRms=.065,window=rate*.34,peakMax=.57;
 for(const [kind,variation,onset,span,level,color] of parts){
  const source=arcadeCue(kind,rate,neutralVariation?0:variation);
  const start=Math.floor(rate*onset), count=Math.min(n-start,Math.floor(rate*span));
  let slow=0;
  for(let i=0;i<count;i++){
   const j=i*(source.length-1)/(count-1),f=j-Math.floor(j),k=Math.floor(j);
   const x=source[k]*(1-f)+(source[Math.min(source.length-1,k+1)]??0)*f;
   slow+=.19*(x-slow);
   const filtered=color<0?x*(1+.86*color)-.88*color*slow:x*(1-.35*color)+.93*color*(x-slow);
   out[start+i]+=level*filtered;
  }
 }
 out[0]=0;out[n-1]=0;
 let peak=0,sum=0;
 for(const x of out){peak=Math.max(peak,Math.abs(x));sum+=x*x;}
 if(!Number.isFinite(sum)||sum<=0||peak<=0)throw Error('Invalid title cue waveform');
 const gain=Math.min(peakMax/peak,targetRms/Math.sqrt(sum/window));
 for(let i=0;i<out.length;i++)out[i]*=gain;
 return out;
}

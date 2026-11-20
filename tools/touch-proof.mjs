// Private coordinate plate: measured layout model only, NOT a screenshot or device playtest.
import {writeFile,mkdir} from 'node:fs/promises';
import {createTouchLayout} from '../src/touch-layout.mjs';
const l=createTouchLayout();
const col={touchFire:'#8e435a',gasKey:'#36644e',moveStick:'#365266',touchCar:'#544353',brakeKey:'#4c5368'};
const en={moveStick:'MOVE',touchFire:'FIRE',touchCrouch:'CROUCH',touchReload:'RELOAD',touchGun:'EQUIP',touchCar:'CAR',interact:'INTERACT',miniButton:'MAP',pause:'II',gasKey:'GAS',brakeKey:'BRAKE / R',left:'LEFT',right:'RIGHT',touchBrake:'H-BRAKE'};
let parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1390" height="956" viewBox="0 0 1390 956"><rect width="1390" height="956" fill="#101a24"/><g font-family="DejaVu Sans, sans-serif" fill="#e9f5f3"><text x="32" y="34" font-size="22">Vice Coast · Touch HUD / R14</text><text x="32" y="59" fill="#a9c3c0" font-size="13">Safe-area coordinates, CSS pixels. Diagram of authored controls; not a device screenshot.</text>'];
function draw(mode,x,y,w,h,safe,caption,scale=1){
 const b=l.box(w,h,safe),r=l.solve(mode,b,l.empty());
 const wide=w>h;parts.push('<g transform="translate('+x+' '+y+') scale('+scale+')"><text y="-8" font-weight="600" font-size="16">'+caption+'</text><rect width="'+w+'" height="'+h+'" rx="16" fill="#263242" stroke="#70878b"/><rect x="'+b.l+'" y="'+b.t+'" width="'+b.w+'" height="'+b.h+'" fill="none" stroke="#789997" stroke-dasharray="7 5"/>');
 const lx=b.l+b.w*.545,ly=b.t+b.h*.28,ww=b.w*.35,hh=b.h*.20;
 parts.push('<rect x="'+lx+'" y="'+ly+'" width="'+ww+'" height="'+hh+'" rx="12" fill="#304544" stroke="#71918b" stroke-dasharray="4 4"/><text x="'+(lx+ww/2)+'" y="'+(ly+hh/2+3)+'" text-anchor="middle" fill="#a7cfc6" font-size="12">FREE LOOK</text>');
 for(const [id,p] of Object.entries(r)){
  const cx=b.l+p.x,cy=b.t+p.y;
  parts.push('<rect x="'+(cx-p.w/2)+'" y="'+(cy-p.h/2)+'" width="'+p.w+'" height="'+p.h+'" rx="'+(p.h*(id==='interact'||id==='left'||id==='right'||id==='gasKey'||id==='brakeKey'?.23:.48))+'" fill="'+(col[id]||'#41485d')+'" stroke="#b7c7cb"/><text x="'+cx+'" y="'+(cy+4)+'" font-weight="600" text-anchor="middle" font-size="'+(id==='brakeKey'?9:10)+'">'+en[id]+'</text>');
 }
 const m=r[mode==='walk'?'touchFire':'gasKey'];const right=(b.w-m.x-m.w/2).toFixed(),bottom=(b.h-m.y-m.h/2).toFixed();
 parts.push('<text x="'+(b.l+8)+'" y="'+(h-5)+'" font-size="10" fill="#a4b4ba">Primary rim from safe edges · R '+right+' / B '+bottom+' px</text></g>');
}
draw('walk',30,102,844,390,{left:47,right:47,bottom:21},'01    WALK / EQUIPPED      844 × 390');
draw('drive',30,547,844,390,{left:47,right:47,bottom:21},'02    DRIVE      844 × 390');
draw('walk',925,102,390,844,{top:47,bottom:34},'03    WALK      390 × 844');
parts.push('</g></svg>');const d=new URL('../out/touch/',import.meta.url);await mkdir(d,{recursive:true});await writeFile(new URL('hud-proof.svg',d),parts.join('\n'));

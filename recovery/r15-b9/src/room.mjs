import { createArmoryProp } from './wave1-forms.mjs';
import { moveShop, COUNTER } from './session.mjs';
// A self-contained, disposable boutique room. Coordinates are scenery units in the
// separate interior only; none enter the original road, actor or physics scenes.
export function createShowroom(T, studioFactory=null){
  const scene=new T.Scene();scene.background=new T.Color(0x242830);
  const camera=new T.PerspectiveCamera(61,1,.045,38), materials=new Set(), geometries=new Set();
  const mat=(color,roughness=.68,metalness=0,emissive)=>{const a=new T.MeshStandardMaterial({color,roughness,metalness,...(emissive==null?{}:{emissive,emissiveIntensity:.32})});materials.add(a);return a;};
  const size=new Map(), geo=(x,y,z)=>{const k=[x,y,z].join('/');if(!size.has(k)){const g=new T.BoxGeometry(x,y,z);size.set(k,g);geometries.add(g);}return size.get(k);};
  const box=(p,x,y,z,w,h,d,a)=>{const mesh=new T.Mesh(geo(w,h,d),a);mesh.position.set(x,y,z);p.add(mesh);return mesh;};
  const plaster=mat(0x303d41),dark=mat(0x191f24),edge=mat(0x515d5b,.43,.45),
    floor=mat(0x4f4b46,.64),grout=mat(0x302e2d),wood=mat(0x6e4732,.53),
    ribs=mat(0x896043,.57),linen=mat(0x626456),glow=mat(0xfad8a2,.38,0,0xffb66e),turq=mat(0x3c6863,.52,0,0x369994),
    backing=mat(0x3a4a48,.91),trim=mat(0xb48b62,.44,.29);
  box(scene,0,-.13,0,10.3,.25,11.85,floor);
  for(let x=-4.45;x<5;x+=.89)box(scene,x,.001,0,.009,.011,11.83,grout);
  for(let z=-5.45;z<6;z+=.91)box(scene,0,.001,z,10.25,.011,.013,grout);
  box(scene,0,1.71,-5.99,10.4,3.42,.18,plaster);
  box(scene,0,1.71,5.99,10.4,3.42,.18,plaster);
  for(const x of [-5.23,5.23]){box(scene,x,1.71,0,.17,3.42,12.15,plaster);box(scene,x*.975,.11,0,.071,.22,12.05,dark);}
  for(const x of [-5.105,5.105]){
    box(scene,x,.78,1.3,.038,1.28,6.76,backing);
    box(scene,x*.996,1.418,1.3,.023,.048,6.76,trim);
    for(const z of [-.9,1.6,4.05])box(scene,x*.997,.8,z,.032,1.23,.046,dark);
  }
  box(scene,0,3.51,0,10.5,.2,12.2,dark);
  // Warm wall bays and a painted fascia above the service island.
  box(scene,0,1.94,-5.84,9.52,2.72,.12,dark);
  box(scene,0,1.27,-5.72,9.22,1.14,.10,backing);
  box(scene,0,2.72,-5.66,9.17,.5,.14,wood);
  box(scene,0,2.49,-5.56,9.12,.038,.054,glow);
  for(let i=0;i<25;i++)box(scene,-4.24+i*.35,2.73,-5.56,.047,.42,.06,ribs);
  box(scene,0,.32,-5.59,9.25,.58,.44,wood);
  box(scene,0,1.04,-5.56,9.26,.043,.06,trim);
  for(const x of [-4.54,-1.53,1.53,4.54])box(scene,x,1.59,-5.57,.085,1.89,.18,trim);
  // Service counter: shallow overhang, softly lit slatted front and insert pad.
  box(scene,.26,.48,-2.75,7.43,.91,1.32,wood);
  box(scene,.26,.97,-2.75,7.62,.114,1.51,linen);
  for(let i=0;i<27;i++)box(scene,-3.28+i*.27,.5,-2.075,.081,.77,.052,ribs);
  box(scene,.26,.11,-2.03,7.32,.10,.079,edge);
  box(scene,.25,.9,-2.03,7.18,.022,.038,glow);
  box(scene,.24,1.048,-2.7,1.7,.03,.68,dark);
  box(scene,-2.33,1.075,-2.68,.49,.09,.31,edge);
  box(scene,2.88,1.135,-2.93,.49,.25,.33,dark);
  // Side cabinet and the in-world return door identify the room as a place.
  box(scene,4.13,.6,2.30,1.95,1.19,2.57,wood);
  box(scene,4.13,1.21,2.30,2.04,.08,2.67,linen);
  for(let i=0;i<7;i++)box(scene,3.15,.57,1.24+i*.355,.04,.94,.063,ribs);
  box(scene,-4.5,1.21,-2.97,1.05,2.42,2.05,dark);
  for(const y of [.63,1.3,1.92])box(scene,-3.98,y,-2.97,.13,.048,1.92,trim);
  box(scene,-1.95,1.16,5.82,1.38,2.32,.21,wood);box(scene,-1.95,1.16,5.67,1.12,2.23,.09,dark);
  box(scene,-2.33,1.16,5.59,.06,.38,.065,trim);
  box(scene,-1.95,2.55,5.65,.8,.17,.085,turq);
  for(const x of [-3.4,3.4]){
    box(scene,x,3.35,-.75,.29,.13,6.8,dark);box(scene,x,3.259,-.75,.088,.018,6.72,glow);
  }
  scene.add(new T.HemisphereLight(0xffe7c9,0x4d555b,1.65));
  const key=new T.DirectionalLight(0xffdcaa,1.8);key.position.set(-3,5,4);scene.add(key);
  const bounce=new T.PointLight(0xb4dfec,10.0,12,2);bounce.position.set(2,2.8,-3.5);scene.add(bounce);
  const inspectKey=new T.PointLight(0xffe1ab,8.0,8,2);inspectKey.position.set(-1.2,2.8,-1.5);scene.add(inspectKey);
  let p={x:.46,z:4.82},yaw=.018,pitch=-.02,choice=null,shown=null,rotation=0,dead=false,studio=null,studioBoots=0;
  const legacy=new Set(['p92','m416','p90','m870']);
  const shelves=[];
  function disposeProp(g){if(!g)return;g.removeFromParent();const gs=new Set(),ms=new Set();g.traverse(v=>{if(v.geometry)gs.add(v.geometry);if(v.material)for(const m of Array.isArray(v.material)?v.material:[v.material])ms.add(m);});for(const x of gs)x.dispose();for(const x of ms)x.dispose();}
  function place(id,target,targetSize,angle,maker=createArmoryProp,height=null){
    const obj=maker(T,id);if(!obj)return null;
    const a=new T.Box3().setFromObject(obj),lo=a.min,hi=a.max,span=Math.max(hi.x-lo.x,hi.z-lo.z);
    const group=new T.Group();group.add(obj);scene.add(group);group.rotation.y=angle;
    if(!Number.isFinite(span)||span<1e-4){disposeProp(group);return null;}
    const k=Math.min(targetSize/span,height===null?Infinity:height/Math.max(.0001,hi.y-lo.y));
    obj.scale.setScalar(k);obj.position.set(-(lo.x+hi.x)*k/2,-lo.y*k,-(lo.z+hi.z)*k/2);
    group.position.set(...target);return group;
  }
  for(const [id,x] of [['m416',-3.07],['p90',0],['m870',3.04]]){
    box(scene,x,1.176,-5.11,2.38,.07,.71,linen);
    const model=place(id,[x,1.211,-5.16],2.04,Math.PI*.488);if(model)shelves.push(model);
  }
  function show(id){
    if(choice===id)return id===null||!!shown;
    disposeProp(shown);choice=null;shown=null;rotation=0;
    if(id===null)return true;
    try{
      let make=createArmoryProp;
      if(!legacy.has(id)){
        if(!studioFactory)return false;
        if(!studio){studio=studioFactory();studioBoots++;}
        make=studio;
      }
      const old=legacy.has(id);
      shown=place(id,[.24,1.063,-2.68],id==='p92'?.82:old?1.29:1.17,Math.PI*.46,make,old?null:.49);
      if(!shown)return false;
      shown.name='VICE COAST R15 | selected preview '+id;
      choice=id;return true;
    }catch{return false;}
  }
  function turnInspect(step){rotation+=step;if(shown)shown.rotation.y=Math.PI*.46+rotation;}
  function turn(dx,dy){yaw+=dx;pitch=Math.max(-.75,Math.min(.75,pitch+dy));}
  function move(ax,az,dt){const step=Math.min(.05,Math.max(dt,0))*2.75/Math.max(1,Math.hypot(ax,az));p=moveShop(p,(ax*Math.cos(yaw)-az*Math.sin(yaw))*step,(-ax*Math.sin(yaw)-az*Math.cos(yaw))*step);}
  function render(renderer,panel){
    if(dead)return;
    const canvas=renderer.domElement,w=canvas.clientWidth||canvas.width||1,h=canvas.clientHeight||canvas.height||1;
    if(camera.aspect!==w/h){camera.aspect=w/h;camera.updateProjectionMatrix();}
    if(panel){
      // Only the shop camera moves. Reserve image space above the stock sheet
      // in portrait, keeping the original landscape shoulder composition.
      const pull=Math.min(2.25,Math.max(1,.86/camera.aspect));
      if(pull===1){
        camera.position.set(-.82,1.73,-.99);
        const compactWide=h<=470&&w>=h;
        camera.lookAt(compactWide?.612:.24,1.23,compactWide?-2.435:-2.67);
      }
      else {camera.position.set(.24-1.06*pull,1.23+.50*pull,-2.67+1.68*pull);camera.lookAt(.24,1.23-.29*pull,-2.67);}
    }
    else{camera.position.set(p.x,1.64,p.z);camera.lookAt(p.x-Math.sin(yaw),1.64+Math.tan(pitch),p.z-Math.cos(yaw));}
    renderer.render(scene,camera);
  }
  return {move,turn,render,show,turnInspect,position:()=>({...p}),stats:()=>({shelf:shelves.length,selected:shown?1:0}),inspect:()=>({id:choice,studioBoots}),
   dispose(){if(dead)return;dead=true;disposeProp(shown);shown=null;studio=null;for(const x of shelves)disposeProp(x);shelves.length=0;for(const x of geometries)x.dispose();for(const x of materials)x.dispose();scene.clear();}};
}

import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { planToWorld } from './data.js';
import { buildLoadingGantry } from './gantry.js';
import { buildPumpHouse } from './pump-house.js';
import { createTankBuilder } from './tank.js';
import { buildUndergroundVessel } from './underground-vessel.js';
import { buildRailGantry } from './rail-gantry.js';

const UP = new THREE.Vector3(0,1,0);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createScene(host, data) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8eee1');
  const renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // The terminal is stationary. Reuse its shadows and redraw only when the
  // camera, lights or visible facilities change, keeping large rakes usable.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  let renderRequested = true;
  function requestRender(shadows=false){renderRequested=true;if(shadows)renderer.shadowMap.needsUpdate=true;}
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  host.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(36,1,1,4000);
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.addEventListener('change',()=>requestRender());
  controls.enableDamping = true;
  controls.dampingFactor = .07;
  controls.minDistance = 22;
  controls.maxDistance = 1700;
  controls.maxPolarAngle = Math.PI * .485;
  controls.autoRotateSpeed = .38;
  const ambient = new THREE.HemisphereLight('#fffdf0','#81956c',1.7);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff5df',2.6);
  sun.position.set(-160,380,190);sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-420,right:420,top:340,bottom:-340,near:1,far:1100});
  sun.shadow.bias = -.00025;sun.shadow.normalBias=.5;sun.shadow.radius=3;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#d9e7ff',1.15);fill.position.set(260,130,-180);scene.add(fill);

  const model = new THREE.Group();model.name = 'Panchgram conceptual terminal';
  model.userData = {project:data.project,coordinateSystem:data.coordinateSystem,accuracy:'Manual raster trace. Illustrative structures. Not for construction or safety decisions.'};
  scene.add(model);
  const environment = new THREE.Group();environment.name='Site infrastructure';model.add(environment);
  const world = px => planToWorld(px,data.coordinateSystem);
  const categories = new Map(data.categories.map(c => [c.id,c]));
  const materials = new Map();
  function mat(color,roughness=.8,metalness=0) {
    const key = `${color}/${roughness}/${metalness}`;
    if (!materials.has(key)) materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));
    return materials.get(key);
  }
  const dark = mat('#506057',.7), concrete = mat('#c4c8ba'), roof = mat('#7d8b7b',.6), silver = mat('#e6e7dd',.42,.18);
  function mesh(parent,geometry,material,x=0,y=0,z=0) {
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  const unitBox = new THREE.BoxGeometry(1,1,1);
  const unitCylinder = new THREE.CylinderGeometry(1,1,1,32);
  function box(parent,w,h,d,material,x=0,y=h/2,z=0) {const m=mesh(parent,unitBox,material,x,y,z);m.scale.set(w,h,d);return m;}
  function cylinder(parent,r,h,material,x=0,y=h/2,z=0) {const m=mesh(parent,unitCylinder,material,x,y,z);m.scale.set(r,h,r);return m;}
  function segment(parent,a,b,width,height,material) {
    const dx=b[0]-a[0],dz=b[1]-a[1];
    const m=box(parent,Math.hypot(dx,dz),height,width,material,(a[0]+b[0])/2,height/2,(a[1]+b[1])/2);m.rotation.y=-Math.atan2(dz,dx);return m;
  }
  function shape(points,material,height=.06,parent=environment) {
    const outline = new THREE.Shape(points.map(p=>new THREE.Vector2(p[0],-p[1])));
    const geo = new THREE.ExtrudeGeometry(outline,{depth:height,bevelEnabled:false});
    const m=mesh(parent,geo,material);m.rotation.x=-Math.PI/2;return m;
  }
  // The model's local grade is zero. This is not the drawing's surveyed reduced level.
  const boundary=data.boundaryPx.map(world);
  const base=shape(boundary,mat('#d5ddc8'),2.5);base.position.y=-2.5;
  const surround=box(scene,2600,1,2000,mat('#e7edde'),0,-8,0);surround.castShadow=false;
  const roads = new THREE.Group();roads.name='Traced schematic roads';environment.add(roads);
  for(const route of data.roadsPx) {
    const points=route.map(world);
    for(let i=1;i<points.length;i++) {
      segment(roads,points[i-1],points[i],7,.13,mat('#a5aca0'));
      const mid=points[i-1],end=points[i];
      const length=Math.hypot(end[0]-mid[0],end[1]-mid[1]);
      for(let d=5;d<length;d+=13){const t=d/length;const m=box(roads,3,.02,.16,mat('#d9dece'),mid[0]+(end[0]-mid[0])*t,.16,mid[1]+(end[1]-mid[1])*t);m.rotation.y=-Math.atan2(end[1]-mid[1],end[0]-mid[0]);m.castShadow=false;}
    }
  }
  for(let i=0;i<boundary.length;i++) {
    const a=boundary[i],b=boundary[(i+1)%boundary.length];
    // Leave the south emergency exit and east entrance visibly open.
    if(i===5) {const t=.35;segment(environment,a,[a[0],a[1]+(b[1]-a[1])*t],.65,2.3,mat('#a4b098'));segment(environment,[b[0],a[1]+(b[1]-a[1])*.52],b,.65,2.3,mat('#a4b098'));}
    else if(i!==6)segment(environment,a,b,.65,2.3,mat('#a4b098'));
    else {const l=[a[0]+(b[0]-a[0])*.19,a[1]+(b[1]-a[1])*.19],r=[a[0]+(b[0]-a[0])*.24,a[1]+(b[1]-a[1])*.24];segment(environment,a,l,.65,2.3,mat('#a4b098'));segment(environment,r,b,.65,2.3,mat('#a4b098'));}
  }
  const railway=new THREE.Group();railway.name='Traced rail corridor';environment.add(railway);
  const railAsset=data.assets.find(a=>a.kind==='railShed');
  railway.userData.localShedAlignment='Illustrative track adjustment within scheduled footprint; source traces retained in register';
  for(const [routeIndex,route] of data.railLinesPx.entries()) {
    let pts=route.map(world);
    if(routeIndex===0&&railAsset){
      // The image trace and shed axis differ slightly. Align the covered track
      // to the illustrative shed so wheels rest on rails, without changing data.
      const [rx,rz]=world(railAsset.planPositionPx),theta=THREE.MathUtils.degToRad(railAsset.rotationDeg||0);
      const local=(x,z)=>[rx+x*Math.cos(theta)+z*Math.sin(theta),rz-x*Math.sin(theta)+z*Math.cos(theta)];
      pts=[local(-railAsset.widthM/2,railAsset.railDetails.trackOffsetM),local(railAsset.widthM/2,railAsset.railDetails.trackOffsetM),...pts.slice(1)];
    }
    for(let i=1;i<pts.length;i++) {
      const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
      segment(railway,a,b,4,.16,mat('#b4b7a8'));
      for(const off of [-.8,.8])segment(railway,[a[0]+nx*off,a[1]+nz*off],[b[0]+nx*off,b[1]+nz*off],.12,.32,dark);
      for(let d=0;d<len;d+=3.6){const sleeper=box(railway,.45,.12,2.8,mat('#747b6c'),a[0]+dx*d/len,.25,a[1]+dz*d/len);sleeper.rotation.y=-Math.atan2(dz,dx);sleeper.castShadow=false;}
    }
  }
  for(const bund of data.bunds) {
    const [x,z]=world(bund.positionPx),w=bund.widthM,d=bund.depthM;
    box(environment,w,.15,d,mat('#e2dfce'),x,.18,z);
    for(const offset of [-1,1]){box(environment,w,1.5,.5,concrete,x,.9,z+offset*d/2);box(environment,.5,1.5,d,concrete,x+offset*w/2,.9,z);}
  }
  const pipes=new THREE.Group();pipes.name='Schematic pipe corridors (illustrative)';environment.add(pipes);
  for(const route of data.pipeRoutesPx) {
    const pts=route.map(world);
    for(let i=1;i<pts.length;i++){
      for(const off of [-.6,0,.6]){const m=segment(pipes,[pts[i-1][0],pts[i-1][1]+off],[pts[i][0],pts[i][1]+off],.22,.2,mat('#667966',.45,.2));m.position.y=1.25;}
    }
  }
  const trees=new THREE.Group();trees.name='Illustrative green belt';environment.add(trees);
  const leaf=mat('#82986a'),trunk=mat('#8c8f72');
  for(const polygon of data.greenBeltPx) {
    const pts=polygon.map(world);shape(pts,mat('#becda8'),.18);
    const xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]);
    for(let x=Math.min(...xs)+6;x<Math.max(...xs)-4;x+=13)for(let z=Math.min(...zs)+7;z<Math.max(...zs)-5;z+=16){cylinder(trees,.45,2.5,trunk,x,1.4,z);mesh(trees,new THREE.IcosahedronGeometry(3.8,0),leaf,x,4.7,z);}
  }
  const underlay=mesh(environment,new THREE.PlaneGeometry(data.coordinateSystem.imageWidthPx*data.coordinateSystem.metresPerPixel,data.coordinateSystem.imageHeightPx*data.coordinateSystem.metresPerPixel),new THREE.MeshBasicMaterial({transparent:true,opacity:.65,depthWrite:false}));
  underlay.name='Source drawing underlay';underlay.rotation.x=-Math.PI/2;underlay.position.set(0,.4,(data.coordinateSystem.imageHeightPx/2-data.coordinateSystem.originPx[1])*data.coordinateSystem.metresPerPixel);underlay.visible=false;underlay.castShadow=false;
  new THREE.TextureLoader().load('assets/site-plan.webp',texture=>{texture.colorSpace=THREE.SRGBColorSpace;underlay.material.map=texture;underlay.material.needsUpdate=true;},undefined,()=>{});

  const tanks=createTankBuilder({box,cylinder,mesh,mat});
  function vehicle(parent,x,z,rotation=0) {
    const g=new THREE.Group();g.position.set(x,.1,z);g.rotation.y=rotation;parent.add(g);
    box(g,2.8,1.6,9,mat('#707a6e'),0,1.15,0);box(g,2.8,2.7,2.5,mat('#dde4d3'),0,1.65,4.7);
    const tank=mesh(g,new THREE.CylinderGeometry(1.2,1.2,7.3,12),silver,0,2.6,-.2);tank.rotation.x=Math.PI/2;
    for(const side of [-1,1])for(const wz of [-3,2.5,4.6]){const w=mesh(g,new THREE.CylinderGeometry(.6,.6,.3,8),dark,side*1.45,.7,wz);w.rotation.z=Math.PI/2;}
  }
  const assetGroups=new Map(), labelAnchors=new Map(),gantryParts=new Map(),pumpHouseParts=new Map(),vesselParts=new Map(),railParts=new Map();
  for(const asset of data.assets) {
    const group=new THREE.Group();const [x,z]=world(asset.planPositionPx);group.position.set(x,0,z);group.rotation.y=THREE.MathUtils.degToRad(asset.rotationDeg||0);group.name=asset.name;group.userData={...asset};model.add(group);assetGroups.set(asset.id,group);
    const color=categories.get(asset.category).color,accent=mat(color,.55,.05),w=asset.widthM,d=asset.depthM,h=asset.heightM;
    labelAnchors.set(asset.id,new THREE.Vector3(x,h+3,z));
    if(asset.kind==='tank'){
      tanks.build(group,asset,accent);
    }else if(asset.kind==='underground'){
      group.visible=false;
      const parts=buildUndergroundVessel(group,asset,{box,cylinder,mesh,mat});
      vesselParts.set(asset.id,parts);labelAnchors.get(asset.id).y=parts.labelY;
    }else if(asset.kind==='pumpHouse'){
      pumpHouseParts.set(asset.id,buildPumpHouse(group,asset,{box,cylinder,mesh,mat}));
    }else if(asset.kind==='building'){
      box(group,w+.9,.35,d+.9,concrete,0,.2);box(group,w,h,d,mat('#e5e5d8'),0,h/2+.35);box(group,w+.6,.3,d+.6,roof,0,h+.5);
      box(group,w,.65,d+.03,accent,0,h*.8);
      for(let bx=-w/2+2;bx<w/2-1;bx+=5)for(const side of [-1,1])box(group,1.7,1.3,.07,mat('#829b98',.4),bx,h*.52,side*(d/2+.04));
      for(let bz=-d/2+2;bz<d/2-1;bz+=6)box(group,.08,1.3,2,mat('#829b98',.4),w/2+.04,h*.52,bz);
      box(group,1.8,2.5,.12,dark,0,1.5,d/2+.1);
    }else if(asset.kind==='gantry'){
      gantryParts.set(asset.id,buildLoadingGantry(group,asset,{box,cylinder,mesh,mat}));
    }else if(asset.kind==='railShed'){
      railParts.set(asset.id,buildRailGantry(group,asset,{box,cylinder,mesh,mat},data));
    }else if(asset.kind==='shed'){
      box(group,w,.25,d,concrete,0,.17);
      const spacing=8;
      for(let px=-w/2+1;px<=w/2;px+=spacing)for(const side of [-1,1])box(group,.25,h,.25,dark,px,h/2,side*(d/2-.5));
      box(group,w+1,.35,d+1,accent,0,h);
    }else if(asset.kind==='basin'){
      box(group,w,.35,d,concrete,0,.25);
      for(const side of [-1,1]){box(group,w,h,.35,concrete,0,h/2+.2,side*d/2);box(group,.35,h,d,concrete,side*w/2,h/2+.2);}
      box(group,w-.5,.12,d-.5,mat('#78a6a0',.25,.15),0,h*.65);
    }else if(asset.kind==='equipment'){
      box(group,w,.3,d,concrete,0,.2);
      for(let px=-w/2+2;px<w/2;px+=7)for(let pz=-d/2+2;pz<d/2;pz+=8){box(group,2.6,1.5,3,accent,px,1.1,pz);cylinder(group,.8,h-1,silver,px,h/2+.6,pz);}
    }else if(asset.kind==='future'){
      box(group,w,.08,d,mat('#c1cba5'),0,.19);
      const line=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,.1,d)),new THREE.LineBasicMaterial({color:'#8c9b64'}));line.position.y=.25;group.add(line);
    }else if(asset.kind==='parking'){
      box(group,w,.1,d,mat('#b0b7a8'),0,.2);
      if(asset.id.startsWith('TRUCK'))for(let px=-w/2+5;px<w/2-3;px+=12)for(let pz=-d/2+7;pz<d/2-4;pz+=18)vehicle(group,px,pz,-.55);
      else for(let px=-w/2+3;px<w/2;px+=5){box(group,1.8,1,3.5,mat('#d2daca'),px,.9);box(group,1.6,.8,1.8,mat('#a2b1a1'),px,1.5);}
    }else{box(group,w,h,d,concrete);}
    group.traverse(object=>{if(object.isMesh)object.userData.assetId=asset.id;});
  }
  const intactGradeGeometry=base.geometry;
  base.userData.inspectionCutaways=[];
  let cutawayGradeGeometry=null,cutawayKey='';
  function syncVesselCutaways(){
    requestRender(true);
    const visible=[...vesselParts.keys()].filter(id=>assetGroups.get(id).visible),key=visible.join(',');
    if(key===cutawayKey)return;
    const previous=cutawayGradeGeometry;cutawayGradeGeometry=null;
    if(visible.length){
      const outline=new THREE.Shape(boundary.map(p=>new THREE.Vector2(p[0],-p[1])));
      for(const id of visible){
        const {pitWidth,pitLength}=vesselParts.get(id),group=assetGroups.get(id);
        // Remove only the currently visible inspection pits from the grade slab.
        const corners=[[-pitWidth/2,-pitLength/2],[pitWidth/2,-pitLength/2],[pitWidth/2,pitLength/2],[-pitWidth/2,pitLength/2]];
        const points=corners.map(([x,z])=>group.localToWorld(new THREE.Vector3(x,0,z)));
        const hole=new THREE.Path(points.map(p=>new THREE.Vector2(p.x,-p.z)));hole.closePath();outline.holes.push(hole);
      }
      cutawayGradeGeometry=new THREE.ExtrudeGeometry(outline,{depth:2.5,bevelEnabled:false});
    }
    base.geometry=cutawayGradeGeometry||intactGradeGeometry;cutawayKey=key;previous?.dispose();
    base.userData.inspectionCutaways=visible;
  }
  const selection=new THREE.BoxHelper(new THREE.Object3D(), '#497044');selection.visible=false;scene.add(selection);
  // A ground ring highlights tanks without a wire box obscuring their details.
  const tankSelection=mesh(scene,new THREE.RingGeometry(1,1.009,96),new THREE.MeshBasicMaterial({color:'#497044',side:THREE.DoubleSide}),0,.32,0);
  tankSelection.rotation.x=-Math.PI/2;tankSelection.visible=false;tankSelection.castShadow=false;
  const measures=new THREE.Group();scene.add(measures);
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
  const views={
    overview:{position:[380,460,580],target:[-15,0,5]},
    top:{position:[0,730,5],target:[0,0,0]},
    storage:{position:[170,175,265],target:[-38,0,61]},
    rail:{position:[60,280,420],target:[-15,0,-77]}
  };
  const productTanks=data.assets.filter(a=>a.kind==='tank'&&a.category==='storage');
  if(productTanks.length){
    const bounds=productTanks.map(a=>{const [x,z]=world(a.planPositionPx),r=a.diameterM/2;return [x-r,x+r,z-r,z+r];});
    const minX=Math.min(...bounds.map(b=>b[0])),maxX=Math.max(...bounds.map(b=>b[1]));
    const minZ=Math.min(...bounds.map(b=>b[2])),maxZ=Math.max(...bounds.map(b=>b[3]));
    const x=(minX+maxX)/2,z=(minZ+maxZ)/2,size=Math.max(maxX-minX,maxZ-minZ)*1.2;
    views.storage={position:[x+size*.82,size*.9,z+size*1.02],target:[x,4,z]};
  }
  const gantryAsset=data.assets.find(a=>a.kind==='gantry');
  if(railAsset){
    const group=assetGroups.get(railAsset.id),bounds=new THREE.Box3().setFromObject(group),target=bounds.getCenter(new THREE.Vector3());target.y=3;
    const size=bounds.getSize(new THREE.Vector3()),length=Math.max(size.x,size.z);
    const offset=new THREE.Vector3(length*.18,length*.34,length*.85).applyAxisAngle(UP,group.rotation.y);
    views.rail={position:target.clone().add(offset).toArray(),target:target.toArray()};
  }
  if(gantryAsset){const [gx,gz]=world(gantryAsset.planPositionPx);const centre=gz-gantryAsset.depthM/4;views.gantry={position:[gx-29,12,centre+17],target:[gx,3.2,centre]};views.gantryInspection={position:[gx-25,22,centre+15],target:[gx,3.2,centre]};}
  let animation=null,selectedId=null;
  function fly(position,target){animation={start:performance.now(),from:camera.position.clone(),to:new THREE.Vector3(...position),fromTarget:controls.target.clone(),target:new THREE.Vector3(...target)};if(reducedMotion){camera.position.copy(animation.to);controls.target.copy(animation.target);animation=null;}controls.update();}
  function setView(key,instant=false){
    controls.minDistance=22;
    pipes.visible=true;
    const inspection=key==='gantry'&&gantryAsset&&!gantryParts.get(gantryAsset.id).canopy.visible;
    const v=views[inspection?'gantryInspection':key]||views.overview;
    // A long terminal needs more camera distance when its viewport becomes narrow.
    const factor=Math.max(1,1.65/camera.aspect);
    const target=new THREE.Vector3(...v.target),position=new THREE.Vector3(...v.position).sub(target).multiplyScalar(factor).add(target);
    if(instant){camera.position.copy(position);controls.target.copy(target);controls.update();}else fly(position.toArray(),v.target);
  }
  function focus(id){
    const a=data.assets.find(a=>a.id===id);if(!a)return;
    controls.minDistance=22;
    pipes.visible=true;
    if(a.kind==='gantry'){setView('gantry');return;}
    if(a.kind==='railShed'){setView('rail');return;}
    const [x,z]=world(a.planPositionPx);
    if(a.kind==='tank'){
      const size=Math.max(a.diameterM,a.heightM),targetY=a.heightM*.45;
      const offset=new THREE.Vector3(size*.85,size*.9,size*1.35).multiplyScalar(Math.max(1,1.65/camera.aspect));
      fly([x+offset.x,targetY+offset.y,z+offset.z],[x,targetY,z]);return;
    }
    if(a.kind==='underground'){
      controls.minDistance=7;pipes.visible=false;
      const group=assetGroups.get(id),offset=new THREE.Vector3(9,12,11);
      offset.applyAxisAngle(UP,group.rotation.y).multiplyScalar(Math.max(1,1.45/camera.aspect));
      fly([x+offset.x,offset.y-1,z+offset.z],[x,-1,z]);return;
    }
    if(a.kind==='pumpHouse'){
      // Schematic site corridors must not obscure the detailed local pipework.
      pipes.visible=false;
      const parts=pumpHouseParts.get(id), group=assetGroups.get(id);
      const roofVisible=parts.canopy.visible;
      const offset=new THREE.Vector3(parts.length*.36,roofVisible?a.heightM+9:a.heightM+20,Math.max(29,parts.length*.95));
      offset.applyAxisAngle(UP,group.rotation.y+parts.axisRotation);
      offset.multiplyScalar(Math.max(1,1.65/camera.aspect));
      fly([x+offset.x,offset.y+1.6,z+offset.z],[x,1.6,z]);return;
    }
    const size=Math.max(a.widthM,a.depthM,a.heightM),distance=Math.max(62,size*2.7);
    fly([x+distance*.55,distance*.8,z+distance],[x,a.heightM*.25,z]);
  }
  function focusPumpEquipment(id){
    const parts=pumpHouseParts.get(id);if(!parts)return;
    const group=assetGroups.get(id),[x,z]=[group.position.x,group.position.z];
    controls.minDistance=6;
    pipes.visible=false;
    const offset=new THREE.Vector3(parts.span*.55,5.2,13);
    offset.applyAxisAngle(UP,group.rotation.y+parts.axisRotation);
    offset.multiplyScalar(Math.max(1,1.1/camera.aspect));
    fly([x+offset.x,1.3+offset.y,z+offset.z],[x,1.3,z]);
  }
  function focusRailEquipment(id){
    const parts=railParts.get(id),group=assetGroups.get(id);if(!parts)return;
    const asset=data.assets.find(a=>a.id===id);
    controls.minDistance=9;pipes.visible=false;
    const centreX=asset.railDetails.wagonCount%2?0:-asset.railDetails.wagonPitchM/2;
    const target=group.localToWorld(new THREE.Vector3(centreX,2.6,0));
    const offset=new THREE.Vector3(13,11,-24);
    offset.applyAxisAngle(UP,group.rotation.y).multiplyScalar(Math.max(1,1.25/camera.aspect));
    fly(target.clone().add(offset).toArray(),target.toArray());
  }
  function focusRailSupport(id){
    const parts=railParts.get(id),group=assetGroups.get(id);if(!parts)return;
    const row=parts.supports.layout.filter(s=>s.row===1),support=row[Math.floor(row.length/2)];
    controls.minDistance=7;pipes.visible=false;
    const target=group.localToWorld(new THREE.Vector3(support.column[0],3.6,support.column[1]));
    // Inspect from outside the first track so the wagon does not hide the base.
    const offset=new THREE.Vector3(7,4,15).applyAxisAngle(UP,group.rotation.y).multiplyScalar(Math.max(1,1.2/camera.aspect));
    fly(target.clone().add(offset).toArray(),target.toArray());
  }
  function select(id){
    requestRender();
    selectedId=id;const group=assetGroups.get(id),asset=data.assets.find(a=>a.id===id);
    const visible=Boolean(group?.visible);tankSelection.visible=visible&&asset?.kind==='tank';
    selection.visible=visible&&!tankSelection.visible&&!['underground','railShed'].includes(asset?.kind);
    if(tankSelection.visible){tankSelection.position.set(group.position.x,.32,group.position.z);tankSelection.scale.setScalar(asset.diameterM/2+1.8);}
    if(selection.visible){selection.setFromObject(group);selection.update();}
  }
  function pick(event,ground=false){
    const rect=renderer.domElement.getBoundingClientRect();mouse.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(mouse,camera);
    if(ground){const point=new THREE.Vector3();return raycaster.ray.intersectPlane(new THREE.Plane(UP,0),point);}
    const objects=[...assetGroups.values()].filter(g=>g.visible);
    return raycaster.intersectObjects(objects,true).find(hit=>hit.object.userData.assetId)?.object.userData.assetId||null;
  }
  function setMeasurement(points){
    requestRender();
    for(const c of [...measures.children]){c.geometry?.dispose();c.material?.dispose();measures.remove(c);}
    for(const p of points){const dot=mesh(measures,new THREE.SphereGeometry(1.6,12,8),new THREE.MeshBasicMaterial({color:'#df9145'}),p.x,2.2,p.z);dot.castShadow=false;}
    if(points.length===2){const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p.x,2.2,p.z)));measures.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:'#c87825'})));}
  }
  function night(enabled){scene.background.set(enabled?'#142630':'#e8eee1');ambient.intensity=enabled?.7:1.7;sun.intensity=enabled?.7:2.6;sun.color.set(enabled?'#ffcb91':'#fff5df');fill.intensity=enabled?.35:1.15;renderer.toneMappingExposure=enabled?1:.95;tanks.setNight(enabled);requestRender();}
  function resize(){const {width,height}=host.getBoundingClientRect();if(width>0&&height>0){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();requestRender();}}
  new ResizeObserver(resize).observe(host);resize();setView('overview',true);
  controls.addEventListener('start',()=>{animation=null;});
  let lastTime=performance.now();
  function frame(now){const elapsed=Math.min((now-lastTime)/1000,.1);lastTime=now;
    if(animation){const t=Math.min((now-animation.start)/850,1),smooth=t*t*(3-2*t);camera.position.lerpVectors(animation.from,animation.to,smooth);controls.target.lerpVectors(animation.fromTarget,animation.target,smooth);if(t===1)animation=null;}
    controls.update(elapsed);
    if(!renderRequested){api.onFrame?.(camera,renderer,controls);return;}
    renderRequested=false;
    if(selectedId && selection.visible)selection.update();
    renderer.render(scene,camera);
    api.onFrame?.(camera,renderer,controls);
  }
  const api={scene,model,camera,renderer,controls,assetGroups,labelAnchors,select,focus,focusPumpEquipment,focusRailEquipment,focusRailSupport,setView,pick,setMeasurement,night,resize,syncVesselCutaways,onFrame:null,
    setUnderlay: enabled=>{underlay.visible=enabled;requestRender();},
    setFuture: enabled=>{for(const a of data.assets.filter(a=>a.category==='future'))assetGroups.get(a.id).visible=enabled;select(selectedId);requestRender(true);},
    setCutaway: enabled=>{for(const a of data.assets.filter(a=>a.underground))assetGroups.get(a.id).visible=enabled;syncVesselCutaways();select(selectedId);},
    setOrbit: enabled=>{controls.autoRotate=enabled;requestRender();},
    setGantryRoof: visible=>{for(const parts of gantryParts.values())parts.canopy.visible=visible;if(gantryParts.has(selectedId))setView('gantry');requestRender(true);},
    setPumpHouseRoof: (id,visible)=>{const parts=pumpHouseParts.get(id);if(parts){parts.canopy.visible=visible;if(selectedId===id)focus(id);requestRender(true);}},
    resetPumpHouseRoofs: ()=>{for(const parts of pumpHouseParts.values())parts.canopy.visible=true;requestRender(true);},
    screenshot:()=>{renderer.render(scene,camera);return renderer.domElement;}
  };
  renderer.setAnimationLoop(frame);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();host.dispatchEvent(new CustomEvent('rendering-lost'));});
  return api;
}

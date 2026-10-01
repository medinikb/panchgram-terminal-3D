import * as THREE from 'three';

// This is original illustrative geometry inspired by industrial gantry features.
// The reference image is not used as a texture; product assignments are not inferred.
export function buildLoadingGantry(parent, asset, helpers) {
  const {box, cylinder, mesh, mat} = helpers;
  const {activeBays, futureBays, platformHeightM, referenceBasis} = asset.gantryDetails;
  const width = asset.widthM, length = asset.depthM, height = asset.heightM;
  const bayPitch = length / (activeBays + futureBays);
  const activeLength = activeBays * bayPitch;
  const startZ = -length / 2, endZ = startZ + activeLength;
  const centreZ = (startZ + endZ) / 2;
  const steel = mat('#667b80', .48, .32);
  const navy = mat('#244d58', .5, .2);
  const silver = mat('#d9e1df', .4, .25);
  const yellow = mat('#d8a938', .55, .1);
  const dark = mat('#2f3c40', .7);
  const concrete = mat('#bfc7c3');
  parent.userData.visualReferenceBasis = referenceBasis;

  function part(name) {const group = new THREE.Group(); group.name = name; parent.add(group); return group;}
  function tube(group, points, radius, material, curved = false) {
    const vectors = points.map(p => new THREE.Vector3(...p));
    const curve = curved ? new THREE.CatmullRomCurve3(vectors) : new THREE.CurvePath();
    if (!curved) for (let i = 1; i < vectors.length; i++) curve.add(new THREE.LineCurve3(vectors[i-1], vectors[i]));
    return mesh(group, new THREE.TubeGeometry(curve, curved ? 24 : Math.max(4, points.length * 3), radius, 6, false), material);
  }
  function beam(group, a, b, thickness, material) {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), direction = to.clone().sub(from);
    const m = box(group, thickness, direction.length(), thickness, material, ...from.clone().add(to).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize()); return m;
  }
  function sign(group, text, subtext, position, widthM, heightM, rotationY = -Math.PI/2) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 160;
    const context = canvas.getContext('2d');
    context.fillStyle = '#214c56'; context.fillRect(0,0,512,160);
    context.fillStyle = '#e5ba50'; context.fillRect(0,0,8,160);
    context.fillStyle = '#f6f8ef'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.font = '600 38px Segoe UI, Arial'; context.fillText(text,256,subtext ? 58 : 83,480);
    if (subtext) {context.font = '22px Segoe UI, Arial'; context.fillStyle = '#c8dedd'; context.fillText(subtext,256,112,475);}
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
    const panel = mesh(group,new THREE.PlaneGeometry(widthM,heightM),material,...position);
    panel.rotation.y = rotationY; panel.castShadow = false; return panel;
  }

  const slab = part('Scheduled 12 × 52 m gantry footprint');
  box(slab,width,.25,length,concrete,0,.18,0);
  const frame = part('Illustrative active-bay steel frame');
  const edgeX = width/2-.8;
  for (let i = 0; i <= activeBays; i++) {
    const z = startZ + i*bayPitch;
    for (const side of [-1,1]) {
      box(frame,.85,.3,.85,concrete,side*edgeX,.4,z);
      box(frame,.3,height-.8,.3,steel,side*edgeX,(height-.8)/2+.5,z);
      box(frame,.12,height-.8,.52,steel,side*edgeX,(height-.8)/2+.5,z);
      beam(frame,[side*edgeX,height-2.1,z],[side*(edgeX-1.5),height-.8,z],.12,steel);
    }
    box(frame,width-.8,.32,.22,steel,0,height-.9,z);
  }
  for(const side of [-1,1]) {
    box(frame,.23,.35,activeLength+.4,steel,side*edgeX,height-.9,centreZ);
    beam(frame,[side*edgeX,.65,startZ],[side*edgeX,height-1.2,startZ+bayPitch],.11,steel);
  }

  const canopy = part('Original shallow pitched canopy over four active bays');
  const roofRise = .55, halfWidth = (width+.6)/2;
  for(const side of [-1,1]) {
    const panel=box(canopy,Math.hypot(halfWidth,roofRise),.11,activeLength+.65,mat('#64828a',.65,.15),side*halfWidth/2,height-roofRise/2,centreZ);
    panel.rotation.z = -side*Math.atan2(roofRise,halfWidth);
    box(canopy,.16,.44,activeLength+.65,navy,side*halfWidth,height-.65,centreZ);
  }
  for(let z=startZ;z<=endZ;z+=1.25)box(canopy,width,.035,.055,steel,0,height-.68,z);
  tube(canopy,[[0,height+.025,startZ-.3],[0,height+.025,endZ+.3]],.075,steel);
  sign(canopy,'PANCHGRAM / ROAD LOADING','FOUR ACTIVE BAYS · CONCEPT MODEL',[-halfWidth-.09,height-.63,centreZ],12,.95);

  const walkway = part('Elevated operator walkway and original access stairs');
  const deckX=-2.95, deckWidth=1.6, deckTop=platformHeightM;
  box(walkway,deckWidth,.22,activeLength-.6,steel,deckX,deckTop-.11,centreZ);
  for(let z=startZ+.4;z<endZ;z+=.65)box(walkway,deckWidth,.025,.025,dark,deckX,deckTop+.025,z);
  for(const side of [-1,1]) {
    const x=deckX+side*deckWidth/2;
    for(let z=startZ+.6;z<endZ;z+=2.1)box(walkway,.07,1.05,.07,yellow,x,deckTop+.53,z);
    tube(walkway,[[x,deckTop+1.05,startZ+.5],[x,deckTop+1.05,endZ-.5]],.045,yellow);
    tube(walkway,[[x,deckTop+.52,startZ+.5],[x,deckTop+.52,endZ-.5]],.035,yellow);
    box(walkway,.07,.12,activeLength-.7,yellow,x,deckTop+.08,centreZ);
  }
  // Stair flights run across the width, staying inside the scheduled footprint.
  const stairWidth=1.05, stairStartX=4.3, stairEndX=deckX, steps=21;
  for(const z of [startZ+.9,endZ-.9]) {
    for(let step=0;step<steps;step++) {
      const t=(step+.5)/steps, x=THREE.MathUtils.lerp(stairStartX,stairEndX,t), y=.3+(deckTop-.3)*t;
      box(walkway,(stairStartX-stairEndX)/steps+.05,.095,stairWidth,steel,x,y,z);
    }
    for(const side of [-1,1]) {
      const railZ=z+side*stairWidth/2;
      beam(walkway,[stairStartX,.2,railZ],[stairEndX,deckTop-.1,railZ],.12,steel);
      tube(walkway,[[stairStartX,1.3,railZ],[stairEndX,deckTop+1.05,railZ]],.055,yellow);
      for(let step=0;step<=steps;step+=4){const t=step/steps;box(walkway,.055,1,.055,yellow,THREE.MathUtils.lerp(stairStartX,stairEndX,t),.75+(deckTop-.3)*t,railZ);}
    }
  }

  const services = part('Illustrative manifold, loading arms and flexible hoses');
  for(const offset of [0,.24,.48])tube(services,[[-4.5,deckTop+.4+offset,startZ+.7],[-4.5,deckTop+.4+offset,endZ-.7]],.08,silver);
  const markings=part('Four active tanker lanes and four future reservations');
  const trucks=part('Illustrative tankers positioned side by side');
  for(let i=0;i<activeBays+futureBays;i++) {
    const laneZ=startZ+(i+.5)*bayPitch;
    for(const side of [-1,1])box(markings,width-1.1,.015,.1,i<activeBays?yellow:mat('#a2aa92'),0,.32,laneZ+side*bayPitch*.42);
    if(i>=activeBays) {
      for(let x=-width/2+.8;x<width/2-.6;x+=1.3)box(markings,.6,.02,.12,mat('#929f86'),x,.33,laneZ);
      const futureSign=sign(markings,`FUTURE BAY ${String(i+1).padStart(2,'0')}`,'RESERVED · NO EQUIPMENT',[0,.35,laneZ],4,1.25,0);futureSign.rotation.x=-Math.PI/2;
      continue;
    }
    const equipment=new THREE.Group();equipment.name=`Illustrative loading assembly · bay ${i+1}`;services.add(equipment);
    cylinder(equipment,.12,2,steel,-1.7,deckTop+1,laneZ);
    tube(equipment,[[-4.5,deckTop+.6,laneZ],[-2.15,deckTop+.6,laneZ],[-1.7,deckTop+1.5,laneZ]],.08,silver);
    tube(equipment,[[-1.7,deckTop+1.5,laneZ],[-.45,deckTop+1.95,laneZ],[.8,deckTop+1.1,laneZ]],.12,navy);
    for(const [x,y] of [[-1.7,deckTop+1.5],[-.45,deckTop+1.95],[.8,deckTop+1.1]])cylinder(equipment,.2,.3,silver,x,y,laneZ);
    tube(equipment,[[.8,deckTop+1.1,laneZ],[1.1,3.6,laneZ],[.25,2.3,laneZ-.3],[-1.2,1.05,laneZ-.15],[-2.6,1.3,laneZ]],.09,dark,true);
    box(equipment,.28,.95,.55,navy,-4.05,deckTop+.65,laneZ);
    box(equipment,.045,.28,.3,mat('#80b8b4',.3),-4.22,deckTop+.79,laneZ);
    cylinder(equipment,.2,.65,silver,-4.2,deckTop+.55,laneZ+1);
    const wheel=mesh(equipment,new THREE.TorusGeometry(.22,.035,5,12),yellow,-4.38,deckTop+.95,laneZ+1);wheel.rotation.y=Math.PI/2;
    for(const side of [-1,1]) {const z=laneZ+side*2.25;cylinder(markings,.13,.85,yellow,-4.95,.73,z);cylinder(markings,.14,.23,dark,-4.95,.58,z);}
    sign(frame,`BAY ${String(i+1).padStart(2,'0')}`,'ILLUSTRATIVE LOADING',[-edgeX-.25,height-1.75,laneZ],3.4,.85);
    const truck=new THREE.Group();truck.name=`Illustrative tanker · bay ${i+1}`;truck.position.set(.25,.32,laneZ);trucks.add(truck);
    box(truck,9.5,.5,2.3,dark,0,.9,0);
    box(truck,1.75,2.15,2.3,i%2?mat('#c5d6d1'):mat('#e0dfcc'),4.15,1.95,0);
    box(truck,.07,.7,1.85,mat('#76949b',.3,.15),5.06,2.35,0);
    box(truck,1,.55,2.1,mat('#8da6aa',.35),4,2.3,0);
    const tankRadius=1.05,tankLength=6.65;
    const body=mesh(truck,new THREE.CylinderGeometry(tankRadius,tankRadius,tankLength,24),silver,-.5,2.35,0);body.rotation.z=Math.PI/2;
    for(const side of [-1,1]) {const cap=mesh(truck,new THREE.SphereGeometry(tankRadius,16,10),silver,-.5+side*tankLength/2,2.35,0);cap.scale.x=.25;}
    for(const side of [-1,1])box(truck,6.6,.18,.03,navy,-.5,2.1,side*1.05);
    for(const side of [-1,1])for(const wheelX of [-3.2,-2,3.75]) {const wheel=mesh(truck,new THREE.CylinderGeometry(.55,.55,.24,12),dark,wheelX,.65,side*1.2);wheel.rotation.x=Math.PI/2;const hub=mesh(truck,new THREE.CylinderGeometry(.25,.25,.27,10),steel,wheelX,.65,side*1.2);hub.rotation.x=Math.PI/2;}
    box(truck,.12,.22,2.45,yellow,-4.85,.95,0);
    for(const z of [-.85,.85])box(truck,.09,.14,.3,mat('#b65d48'),-4.95,1.18,z);
    cylinder(truck,.3,.16,steel,-.5,3.46,0);
  }
  for(let i=0;i<activeBays;i++) {
    const z=startZ+(i+.5)*bayPitch;
    box(frame,.12,.6,.12,steel,0,height-1.3,z);
    box(frame,.5,.08,.2,mat('#e4dab7'),0,height-1.61,z);
  }
  return {canopy};
}

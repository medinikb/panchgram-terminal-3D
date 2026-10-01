import * as THREE from 'three';

// The photos inform the shed's character, not equipment specifications or routing.
// Work along a common long axis, then rotate to fit each scheduled footprint.
export function buildPumpHouse(parent, asset, helpers) {
  const {box, cylinder, mesh, mat} = helpers;
  const detail = asset.pumpHouseDetails;
  const length = Math.max(asset.widthM, asset.depthM);
  const span = Math.min(asset.widthM, asset.depthM);
  const axisRotation = asset.depthM > asset.widthM ? Math.PI / 2 : 0;
  const assembly = new THREE.Group(); assembly.name = 'Original open pump-house assembly';
  assembly.rotation.y = axisRotation; parent.add(assembly);
  const steel = mat('#829498', .48, .32), green = mat('#356758', .64, .18);
  const silver = mat('#d9e3e2', .34, .5), blue = mat('#345c9b', .48, .22);
  const dark = mat('#2d4148', .62, .15), concrete = mat('#c8ceca');
  const red = mat('#b65042', .5, .2), yellow = mat('#e0b343', .65);
  const fireWater = detail.service === 'fireWater';
  const pipeMaterial = fireWater ? red : silver;
  const eaveY = asset.heightM - .7, roofRise = .7, slabTop = .3;
  parent.userData.visualReferenceBasis = detail.referenceBasis;

  function part(name, owner = assembly) {const g = new THREE.Group(); g.name = name; owner.add(g); return g;}
  function beam(g, a, b, width, material = steel) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const m = box(g,width,delta.length(),width,material,...start.clone().add(end).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); return m;
  }
  function pipe(g, points, radius, material = pipeMaterial, rounded = false) {
    const vectors = points.map(p=>new THREE.Vector3(...p));
    const curve = rounded ? new THREE.CatmullRomCurve3(vectors, false, 'centripetal') : new THREE.CurvePath();
    if (!rounded) for(let i=1;i<vectors.length;i++)curve.add(new THREE.LineCurve3(vectors[i-1],vectors[i]));
    return mesh(g,new THREE.TubeGeometry(curve,rounded ? 24 : Math.max(4,points.length*3),radius,8,false),material);
  }
  function axialCylinder(g,r,lengthM,material,position,axis) {
    const m=cylinder(g,r,lengthM,material,...position);
    if(axis==='x')m.rotation.z=Math.PI/2;
    if(axis==='z')m.rotation.x=Math.PI/2;
    return m;
  }
  function flange(g,position,axis,r=.18) {
    axialCylinder(g,r,.07,silver,position,axis);
    // Bolt heads make connections readable without using image textures.
    for(let i=0;i<6;i++) {
      const angle=i*Math.PI/3, a=Math.cos(angle)*r*.76, b=Math.sin(angle)*r*.76;
      const p=[...position];if(axis==='z'){p[0]+=a;p[1]+=b;}else{p[0]+=a;p[2]+=b;}
      axialCylinder(g,.025,.09,dark,p,axis);
    }
  }
  function wheel(g,x,y,z) {
    cylinder(g,.025,.24,steel,x,y-.12,z);
    const ring=mesh(g,new THREE.TorusGeometry(.16,.024,6,16),red,x,y,z);ring.rotation.x=Math.PI/2;
    beam(g,[x-.15,y,z],[x+.15,y,z],.022,red);beam(g,[x,y,z-.15],[x,y,z+.15],.022,red);
  }
  function sign(g,text,subtext,position,widthM,rotationY=0) {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#f1f3e9';ctx.fillRect(0,0,1024,192);
    ctx.fillStyle='#356758';ctx.fillRect(0,0,14,192);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 54px Segoe UI, Arial';ctx.fillStyle='#213c38';ctx.fillText(text,512,70,970);
    ctx.font='28px Segoe UI, Arial';ctx.fillStyle='#637872';ctx.fillText(subtext,512,140,970);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const panel=mesh(g,new THREE.PlaneGeometry(widthM,.86),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}),...position);
    panel.rotation.y=rotationY;panel.castShadow=false;
  }

  const slab=part('Scheduled pump-house slab');box(slab,length,.25,span,concrete,0,.175,0);
  for(const side of [-1,1])box(slab,length,.07,.09,yellow,0,slabTop+.04,side*(span/2-.18));

  const frame=part('Lattice columns, bracing and exposed roof trusses');
  const frameCount=Math.ceil(length/6), pitch=(length-.8)/frameCount, edgeZ=span/2-.35;
  for(let i=0;i<=frameCount;i++) {
    const x=-length/2+.4+i*pitch;
    for(const side of [-1,1]) {
      const z=side*edgeZ;
      box(frame,.68,.24,.68,concrete,x,.42,z);
      // Two chords and diagonal ties echo the open steel columns in the references.
      for(const off of [-.17,.17])box(frame,.11,eaveY-.55,.13,steel,x+off,(eaveY+.55)/2,z);
      for(let y=.7;y<eaveY-.25;y+=.58){box(frame,.43,.08,.16,steel,x,y,z);beam(frame,[x-.17,y,z],[x+.17,Math.min(y+.5,eaveY),z],.05);}
      box(frame,.66,.19,.66,dark,x,.57,z);
      box(frame,.3,.19,.67,yellow,x,.575,z);
      beam(frame,[x,eaveY-1,z],[x,eaveY,side*(edgeZ-.7)],.09);
    }
    beam(frame,[x,eaveY,-edgeZ],[x,eaveY,edgeZ],.1);
    beam(frame,[x,eaveY,-edgeZ],[x,asset.heightM,0],.1);
    beam(frame,[x,asset.heightM,0],[x,eaveY,edgeZ],.1);
    for(let j=0;j<6;j++) {
      const z=-edgeZ+j*(2*edgeZ/6), next=z+2*edgeZ/6;
      const topAt=v=>eaveY+roofRise*(1-Math.abs(v)/edgeZ);
      beam(frame,[x,eaveY,z],[x,topAt(next),next],.055);
      beam(frame,[x,eaveY,next],[x,topAt(next),next],.05);
    }
  }
  for(const side of [-1,1]) {
    box(frame,length,.14,.12,steel,0,eaveY,side*edgeZ);
    for(const end of [-1,1]) {
      const x=end*(length/2-.4), next=x-end*pitch;
      beam(frame,[x,.65,side*edgeZ],[next,eaveY-.2,side*edgeZ],.07);
      beam(frame,[next,.65,side*edgeZ],[x,eaveY-.2,side*edgeZ],.07);
    }
  }
  for(const z of [-edgeZ,-edgeZ*.5,0,edgeZ*.5,edgeZ])box(frame,length,.1,.09,steel,0,eaveY+roofRise*(1-Math.abs(z)/edgeZ)-.07,z);

  const canopy=part('Removable pitched roof and corrugated upper cladding');
  const halfSpan=span/2+.18, slope=Math.atan2(roofRise,halfSpan);
  for(const side of [-1,1]) {
    const panel=box(canopy,length+.3,.08,Math.hypot(halfSpan,roofRise),green,0,eaveY+roofRise/2,side*halfSpan/2);
    panel.rotation.x=side*slope;
    box(canopy,length+.3,.78,.06,green,0,eaveY-.35,side*halfSpan);
    for(let x=-length/2;x<=length/2;x+=.34) {
      box(canopy,.025,.78,.035,mat('#457769',.62,.2),x,eaveY-.35,side*(halfSpan+.035));
      const rib=box(canopy,.023,.025,Math.hypot(halfSpan,roofRise),steel,x,eaveY+roofRise/2+.055,side*halfSpan/2);rib.rotation.x=side*slope;
    }
    box(canopy,length+.3,.12,.16,dark,0,eaveY-.08,side*(halfSpan+.04));
    pipe(frame,[[length/2-.55,eaveY-.1,side*edgeZ],[length/2-.55,.4,side*edgeZ]],.06,steel);
  }
  // End faces follow the gable outline, leaving the working level open.
  for(const side of [-1,1]) {
    const shape=new THREE.Shape();shape.moveTo(-halfSpan,eaveY-.75);shape.lineTo(halfSpan,eaveY-.75);shape.lineTo(halfSpan,eaveY);shape.lineTo(0,asset.heightM);shape.lineTo(-halfSpan,eaveY);shape.closePath();
    const end=mesh(canopy,new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:'#356758',roughness:.65,metalness:.18,side:THREE.DoubleSide}),side*(length/2+.15),0,0);end.rotation.y=Math.PI/2;
  }
  const label=fireWater?'FIRE-WATER PUMP HOUSE':detail.service==='railReceipt'?'RAIL UNLOADING PUMP HOUSE':'TRUCK LOADING PUMP HOUSE';
  sign(canopy,label,'PANCHGRAM · CONCEPT VISUALISATION',[0,eaveY-.35,halfSpan+.075],Math.min(length*.58,14));

  const headers=part('Illustrative suction and discharge headers');
  const rearZ=-span/2+.75, frontZ=span/2-.85;
  for(const z of [rearZ,frontZ]) {
    pipe(headers,[[-length/2+.8,.85,z],[length/2-.8,.85,z]],.15);
    for(let x=-length/2+1;x<length/2;x+=4) {
      box(headers,.4,.45,.45,concrete,x,.52,z);
      const saddle=mesh(headers,new THREE.TorusGeometry(.19,.027,6,12),steel,x,.85,z);saddle.rotation.y=Math.PI/2;
    }
    flange(headers,[-length/2+1.35,.85,z],'x',.22);
    flange(headers,[length/2-1.35,.85,z],'x',.22);
  }
  const pitchPump=(length-5)/detail.illustrativePumpCount;
  for(let i=0;i<detail.illustrativePumpCount;i++) {
    const x=-length/2+2.5+(i+.5)*pitchPump;
    const pump=part(`Illustrative pump assembly · ${asset.id} · ${i+1}`);
    box(pump,2.5,.32,2.2,concrete,x,.48,0);
    box(pump,2.05,.12,1.8,blue,x,.7,0);
    for(const z of [-.4,.45])for(const off of [-.35,.35])box(pump,.18,.19,.22,dark,x+off,.85,z);
    // A blue motor, guarded coupling and rounded volute identify the pump train.
    axialCylinder(pump,.32,.95,blue,[x,1.16,.43],'z');
    for(let f=0;f<12;f++) {
      const angle=f*Math.PI/6;
      const fin=box(pump,.045,.08,.83,blue,x+Math.sin(angle)*.33,1.16+Math.cos(angle)*.33,.43);fin.rotation.z=-angle;
    }
    axialCylinder(pump,.34,.14,dark,[x,1.16,.97],'z');
    box(pump,.36,.18,.35,blue,x,1.54,.48);
    axialCylinder(pump,.18,.3,yellow,[x,1.16,-.21],'z');
    const volute=mesh(pump,new THREE.SphereGeometry(.4,16,10),blue,x,1.12,-.53);volute.scale.set(1,1,.73);
    axialCylinder(pump,.15,.3,silver,[x,1.12,-.88],'z');flange(pump,[x,1.12,-1],'z');
    pipe(pump,[[x,1.12,-1],[x,1.08,-1.22],[x,.85,rearZ]],.095,pipeMaterial,true);
    // Curved elevated discharge loop is inspired by the photographs.
    pipe(pump,[[x,1.43,-.5],[x,2.05,-.5],[x+.16,2.27,-.48],[x+.58,2.27,-.2],[x+.75,2.05,.05],[x+.75,1.4,.2],[x+.75,.85,frontZ]],.105,pipeMaterial,true);
    flange(pump,[x,1.74,-.5],'y');
    cylinder(pump,.15,.24,blue,x+.75,1.63,.14);wheel(pump,x+.75,1.95,.14);
    // Small gauge with a dark needle; no invented pressure or pump rating.
    const gauge=axialCylinder(pump,.105,.055,silver,[x+.88,1.8,.23],'z');
    axialCylinder(pump,.085,.012,mat('#f3f4e9'),[x+.88,1.8,.265],'z');
    beam(pump,[x+.88,1.8,.277],[x+.91,1.85,.277],.012,dark);gauge.name='Unscaled illustrative pressure gauge';
    if(fireWater&&i===detail.illustrativePumpCount-1) {
      box(pump,.55,.65,.75,dark,x+.68,1.17,.5);
      pipe(pump,[[x+.68,1.45,.5],[x+.68,2.15,.5],[x+.85,2.3,.5]],.045,steel,true);
    }
  }

  const access=part('Pipe crossover, stairs, rails and equipment cabinets');
  const crossoverX=-length/2+1.5, deckY=1.35;
  box(access,.95,.1,span-1.1,steel,crossoverX,deckY,0);
  for(let z=-span/2+.55;z<span/2-.5;z+=.18)box(access,.9,.022,.025,dark,crossoverX,deckY+.06,z);
  for(const side of [-1,1]) {
    const x=crossoverX+side*.48;
    pipe(access,[[x,deckY+1,-span/2+.6],[x,deckY+1,span/2-.6]],.035,red);
    pipe(access,[[x,deckY+.5,-span/2+.6],[x,deckY+.5,span/2-.6]],.025,red);
    for(const z of [-span/2+.6,0,span/2-.6])box(access,.055,1,.055,red,x,deckY+.5,z);
  }
  // Short access steps remain within the long end of the scheduled slab.
  for(let i=0;i<5;i++)box(access,.24,.07,.9,steel,crossoverX-1.15+i*.24,.42+i*.2,0);
  for(const side of [-1,1])pipe(access,[[crossoverX-1.3,1.35,side*.45],[crossoverX,deckY+1,side*.45]],.035,red);
  box(access,.62,1.35,.48,mat('#d2dcd7',.5,.15),length/2-1,1.02,span/2-1.1);
  box(access,.4,.55,.025,dark,length/2-1,1.25,span/2-.845);
  for(const off of [-.1,.1])cylinder(access,.04,.08,off<0?red:green,length/2-1+off,.9,span/2-.82).rotation.x=Math.PI/2;
  sign(access,'ILLUSTRATIVE EQUIPMENT','COUNTS & ROUTING NOT ENGINEERED',[length/2-3,1.8,span/2-.25],3);
  return {canopy, axisRotation, length, span};
}

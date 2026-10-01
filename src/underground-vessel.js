import * as THREE from 'three';

// Original photo-informed inspection geometry. The pit is a visual section of
// the ground; cover, heads, supports and fittings are illustrative settings.
export function buildUndergroundVessel(parent, asset, helpers) {
  const {box,cylinder,mesh,mat}=helpers,detail=asset.vesselDetails;
  const radius=asset.diameterM/2,length=asset.lengthM,headDepth=detail.headDepthM;
  const crownY=-detail.soilCoverM,centreY=crownY-radius;
  const floorY=centreY-radius-detail.floorClearanceM;
  const innerWidth=asset.diameterM+2*detail.pitClearanceM;
  const innerLength=length+2*detail.pitClearanceM;
  const pitWidth=innerWidth+2*detail.wallThicknessM,pitLength=innerLength+2*detail.wallThicknessM;
  const coating=mat('#8e4036',.7,.12),seam=mat('#aa5949',.7,.1);
  const steel=mat('#748783',.5,.3),concrete=mat('#b9bcb2');
  const dark=mat('#344447',.7),silver=mat('#d6dfd9',.42,.35);
  const part=name=>{const g=new THREE.Group();g.name=name;parent.add(g);return g;};
  parent.userData.visualReferenceBasis=detail.referenceBasis;
  parent.userData.inspection={mode:'Open underground pit cutaway',burialDepthSource:'illustrative',soilCoverM:detail.soilCoverM};

  const pit=part(`Illustrative concrete pit cutaway · ${asset.id}`);
  box(pit,pitWidth,.2,pitLength,concrete,0,floorY-.1,0);
  const wallTop=.16,wallHeight=wallTop-floorY;
  for(const side of [-1,1]) {
    box(pit,detail.wallThicknessM,wallHeight,pitLength,concrete,side*(innerWidth/2+detail.wallThicknessM/2),(wallTop+floorY)/2,0);
    box(pit,innerWidth,wallHeight,detail.wallThicknessM,concrete,0,(wallTop+floorY)/2,side*(innerLength/2+detail.wallThicknessM/2));
    box(pit,.3,.15,pitLength+.2,mat('#d1d1c4'),side*(pitWidth/2-.08),.15,0);
    box(pit,pitWidth+.2,.15,.3,mat('#d1d1c4'),0,.15,side*(pitLength/2-.08));
    // Horizontal construction joints are illustrative, not a masonry specification.
    for(let y=floorY+.8;y<0;y+=.8) {
      box(pit,.012,.016,innerLength,mat('#939b92'),side*(innerWidth/2-.005),y,0);
      box(pit,innerWidth,.016,.012,mat('#939b92'),0,y,side*(innerLength/2-.005));
    }
  }

  // One continuous lathed shell keeps diameter and total end-to-end length exact.
  // The central cylinder is shortened by the two illustrative rounded heads.
  const profile=[];
  for(let i=0;i<=16;i++) {
    const angle=i*Math.PI/32;
    profile.push(new THREE.Vector2(radius*Math.sin(angle),-length/2+headDepth*(1-Math.cos(angle))));
  }
  const barrelHalf=length/2-headDepth;
  profile.push(new THREE.Vector2(radius,barrelHalf));
  for(let i=1;i<=16;i++) {
    const angle=i*Math.PI/32;
    profile.push(new THREE.Vector2(radius*Math.cos(angle),barrelHalf+headDepth*Math.sin(angle)));
  }
  const geometry=new THREE.LatheGeometry(profile,64);geometry.rotateX(Math.PI/2);
  const shell=mesh(parent,geometry,coating,0,centreY,0);
  shell.name=`Scheduled underground vessel shell · ${asset.id}`;
  shell.userData={diameterM:asset.diameterM,totalLengthM:length,source:'drawing underground schedule'};
  const welds=part('Illustrative vessel courses and head welds');
  for(let z=-barrelHalf;z<=barrelHalf+.01;z+=.7) {
    const bead=mesh(welds,new THREE.TorusGeometry(radius+.025,.026,6,64),seam,0,centreY,z);
    bead.castShadow=false;bead.receiveShadow=false;
  }
  for(const z of [-barrelHalf,barrelHalf]) {
    const bead=mesh(welds,new THREE.TorusGeometry(radius+.022,.042,6,64),steel,0,centreY,z);bead.castShadow=false;
  }

  const supports=part('Illustrative saddle supports and anchoring');
  for(const z of [-length*.27,length*.27]) {
    box(supports,asset.diameterM+.25,detail.floorClearanceM*.75,.8,concrete,0,floorY+detail.floorClearanceM*.375,z);
    const saddle=mesh(supports,new THREE.TorusGeometry(radius+.045,.085,8,40,Math.PI),steel,0,centreY,z);saddle.rotation.z=Math.PI;
    for(const side of [-1,1]) {
      box(supports,.15,detail.floorClearanceM+.45,.7,steel,side*(radius*.74),floorY+(detail.floorClearanceM+.45)/2,z);
      cylinder(supports,.045,.13,silver,side*(radius+.2),floorY+detail.floorClearanceM*.75+.06,z);
    }
    const strap=mesh(supports,new THREE.TorusGeometry(radius+.065,.033,6,48),steel,0,centreY,z);strap.castShadow=false;
  }

  const fittings=part('Illustrative raised manways, flanges and small nozzles');
  const hollowMaterial=new THREE.MeshStandardMaterial({color:'#8e4036',roughness:.72,metalness:.12,side:THREE.DoubleSide});
  const manwayBottom=crownY-.08,manwayTop=manwayBottom+detail.manwayHeightM;
  for(let i=0;i<detail.manwayCount;i++) {
    const z=detail.manwayCount===1?0:(i/(detail.manwayCount-1)-.5)*length*.44;
    mesh(fittings,new THREE.CylinderGeometry(.38,.38,detail.manwayHeightM,48,1,true),hollowMaterial,0,(manwayTop+manwayBottom)/2,z);
    const flange=mesh(fittings,new THREE.RingGeometry(.35,.52,48),hollowMaterial,0,manwayTop+.02,z);flange.rotation.x=-Math.PI/2;
    const edge=mesh(fittings,new THREE.TorusGeometry(.47,.04,8,48),coating,0,manwayTop,z);edge.rotation.x=Math.PI/2;
    // Dark recess explains an open inspection neck without fabricating a liquid level.
    const recess=mesh(fittings,new THREE.CircleGeometry(.355,48),dark,0,crownY+.11,z);recess.rotation.x=-Math.PI/2;
    for(let bolt=0;bolt<12;bolt++) {
      const theta=bolt*Math.PI/6;
      cylinder(fittings,.027,.07,silver,Math.cos(theta)*.46,manwayTop+.055,z+Math.sin(theta)*.46);
    }
    cylinder(fittings,.47,.09,coating,0,crownY+.04,z);
  }
  for(const z of [-length*.35,length*.35]) {
    cylinder(fittings,.085,.6,coating,.63,crownY+.2,z);
    cylinder(fittings,.14,.06,silver,.63,crownY+.52,z);
    cylinder(fittings,.1,.16,steel,.63,crownY+.62,z);
  }

  const access=part('Illustrative pit access and identity sign');
  const ladderX=-innerWidth/2+.19,ladderZ=-innerLength/2+.6;
  for(const off of [-.25,.25])box(access,.055,.7-floorY,.055,steel,ladderX,(floorY+.7)/2,ladderZ+off);
  for(let y=floorY+.2;y<.65;y+=.3)box(access,.055,.04,.55,steel,ladderX,y,ladderZ);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f2f0e4';ctx.fillRect(0,0,768,256);
  ctx.fillStyle='#803e33';ctx.fillRect(0,0,14,256);ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#314642';ctx.font='700 62px Segoe UI, Arial';ctx.fillText(asset.id+' / '+asset.name.split(' underground')[0].toUpperCase(),384,70,710);
  ctx.font='34px Segoe UI, Arial';ctx.fillText(`${asset.diameterM} m Ø × ${asset.lengthM} m · ${asset.capacityM3} m³`,384,139,710);
  ctx.font='26px Segoe UI, Arial';ctx.fillStyle='#806957';ctx.fillText('INSPECTION CUTAWAY · DEPTH ILLUSTRATIVE',384,204,720);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  mesh(access,new THREE.PlaneGeometry(3,.9),new THREE.MeshStandardMaterial({map:texture,roughness:.8,side:THREE.DoubleSide}),0,.85,pitLength/2+.18);
  for(const x of [-1.2,1.2])box(access,.055,1.25,.055,steel,x,.575,pitLength/2+.15);
  return {pitWidth,pitLength,floorY,centreY,labelY:manwayTop+.65};
}

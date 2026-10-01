import * as THREE from 'three';
import {buildFallArresters} from './fall-arrester.js';
import {railWagonLayout} from './rail-wagons.js';
import {combineWagonDetails} from './wagon-geometry.js';

// Original geometry uses the photographs for visual cues only. The register
// controls the scheduled footprint; every vehicle and fitting is illustrative.
export function buildRailGantry(parent, asset, helpers, site) {
  const {box,cylinder,mesh,mat}=helpers;
  const {wagonLengthM, platformHeightM, trackOffsetM, referenceBasis}=asset.railDetails;
  const length=asset.widthM, span=asset.depthM;
  const steel=mat('#73868a',.48,.35), charcoal=mat('#34434a',.55,.25);
  const bodyPaint=mat('#43545a',.6,.22), silver=mat('#b7c6c6',.4,.45);
  const yellow=mat('#d9af48',.55,.1), concrete=mat('#b7c0b7');
  const rubber=mat('#293637',.85);
  parent.userData.visualReferenceBasis=referenceBasis;
  parent.userData.railConcept={structure:'inverted-L fall-arrester supports',spacingM:asset.railDetails.fallArresters.spacingM,equipmentSource:'illustrative',wagonCountSource:asset.railDetails.wagonCountSource,trackAlignmentSource:'illustrative within original source area'};
  function part(name, owner=parent){const g=new THREE.Group();g.name=name;owner.add(g);return g;}
  function tube(owner,points,radius,material=silver,curved=false){
    const vertices=points.map(p=>new THREE.Vector3(...p));
    const path=curved?new THREE.CatmullRomCurve3(vertices):new THREE.CurvePath();
    if(!curved)for(let i=1;i<vertices.length;i++)path.add(new THREE.LineCurve3(vertices[i-1],vertices[i]));
    return mesh(owner,new THREE.TubeGeometry(path,curved?16:Math.max(3,points.length*2),radius,6,false),material);
  }
  function panel(owner,text,subtext,x,y,z,width=6){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#254f59';ctx.fillRect(0,0,768,192);
    ctx.fillStyle='#ddb34c';ctx.fillRect(0,0,10,192);ctx.textAlign='center';
    ctx.fillStyle='#f7f5e8';ctx.font='600 43px Segoe UI, Arial';ctx.fillText(text,390,81,730);
    ctx.fillStyle='#d1dfd8';ctx.font='29px Segoe UI, Arial';ctx.fillText(subtext,390,139,730);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture});
    const sign=mesh(owner,new THREE.PlaneGeometry(width,width/4),material,x,y,z);
    const back=mesh(owner,new THREE.PlaneGeometry(width,width/4),material,x,y,z-.015);
    back.rotation.y=Math.PI;sign.castShadow=false;back.castShadow=false;return sign;
  }
  const footprint=box(parent,length,.13,span,concrete,0,.08,0);
  footprint.name='Original source rail area · 350 × 10 m';
  const supports=buildFallArresters(parent,asset,site,helpers);
  const platform=part('Raised operator platform, safety edge and end access steps');
  const deckZ=-2.55,deckWidth=3.05,deckTop=platformHeightM;
  box(platform,length-3,deckTop-.15,deckWidth,concrete,0,(deckTop+.15)/2,deckZ);
  box(platform,length-3,.035,.14,yellow,0,deckTop+.025,deckZ+deckWidth/2-.08);
  for(let x=-length/2+2;x<length/2-2;x+=8){
    box(platform,.055,1.05,.055,yellow,x,deckTop+.53,deckZ-deckWidth/2+.1);
    box(platform,1.2,.025,.12,yellow,x,deckTop+.025,deckZ+.7);
  }
  for(const y of [deckTop+.55,deckTop+1.05])tube(platform,[[-length/2+2,y,deckZ-deckWidth/2+.1],[length/2-2,y,deckZ-deckWidth/2+.1]],.035,yellow);
  for(const side of [-1,1])for(let step=0;step<5;step++){
    box(platform,.32,(step+1)*deckTop/5,1.2,concrete,side*(length/2-.4-step*.3),(step+1)*deckTop/10,deckZ);
  }
  const equipment=part('Illustrative parallel manifolds, meters, valves and unloading hoses');
  for(const offset of [0,.24,.48])tube(equipment,[[-length/2+3,1.38+offset,-3.4],[length/2-3,1.38+offset,-3.4]],.085);
  const layout=railWagonLayout(asset,site.coordinateSystem,site.railLinesPx);
  const rakes=new Map();
  for(let track=1;track<=asset.railDetails.wagonTrackCount;track++)rakes.set(track,part(`Illustrative rail rake · track ${track}`));
  let prototype=null;
  function placeWagon(wagon,location){
    const label=`track ${location.trackNumber} · wagon ${location.index}`;
    wagon.name=`Illustrative rail tank wagon · ${label}`;
    wagon.position.set(location.position[0],0,location.position[1]);
    wagon.rotation.y=-Math.atan2(location.direction[1],location.direction[0]);
    wagon.userData={trackNumber:location.trackNumber,wagonNumber:location.index,shellLengthM:wagonLengthM,pitchM:asset.railDetails.wagonPitchM,distanceAlongTrackM:location.distanceAlongTrackM};
    wagon.traverse(object=>{
      if(object.name.startsWith('Illustrative rail wagon shell'))object.name=`Illustrative rail wagon shell · ${label}`;
      if(object.name.startsWith('Illustrative rail bogie'))object.name=`Illustrative rail bogie · ${label} · ${object.position.x<0?'rear':'front'}`;
    });
  }
  for(const location of layout){
    // Cloning shares geometry and materials, keeping fifty detailed wagons light.
    if(prototype){const wagon=prototype.clone(true);rakes.get(location.trackNumber).add(wagon);placeWagon(wagon,location);continue;}
    const i=0,wagon=part('Wagon prototype',rakes.get(location.trackNumber));
    const radius=1.38,bodyY=2.96,headDepth=.55,barrelLength=wagonLengthM-2*headDepth;
    // Bring wheels and saddles inward with the shorter body; preserve their sizes.
    const bogieOffsetM=wagonLengthM*(6.1/19);
    box(wagon,wagonLengthM+.55,.32,2.25,charcoal,0,1.28,0);
    for(const side of [-1,1])box(wagon,wagonLengthM+.5,.23,.13,steel,0,1.18,side*1.1);
    const body=mesh(wagon,new THREE.CylinderGeometry(radius,radius,barrelLength,32),bodyPaint,0,bodyY,0);body.rotation.z=Math.PI/2;body.name=`Illustrative rail wagon shell · ${i+1}`;
    for(const side of [-1,1]){
      const cap=mesh(wagon,new THREE.SphereGeometry(radius,24,12),bodyPaint,side*barrelLength/2,bodyY,0);cap.scale.x=headDepth/radius;
      const saddle=mesh(wagon,new THREE.CylinderGeometry(1.46,1.46,.32,24,1,false,Math.PI,Math.PI),steel,side*bogieOffsetM,bodyY,0);saddle.rotation.z=Math.PI/2;
      box(wagon,1,.25,.35,charcoal,side*(wagonLengthM/2+.7),1.15,0);
      box(wagon,.35,.35,.55,steel,side*(wagonLengthM/2+1.2),1.15,0);
      box(wagon,.075,.9,.08,yellow,side*(wagonLengthM/2-1.1),2.65,1.34);
      const bogie=part(`Illustrative rail bogie · ${i+1} · ${side}`,wagon);bogie.position.x=side*bogieOffsetM;
      box(bogie,2.8,.32,1.7,charcoal,0,1.03,0);
      for(const axle of [-.85,.85]){
        const shaft=mesh(bogie,new THREE.CylinderGeometry(.09,.09,2.12,8),steel,axle,.82,0);shaft.rotation.x=Math.PI/2;
        for(const face of [-1,1]){
          const wheel=mesh(bogie,new THREE.CylinderGeometry(.48,.48,.17,16),charcoal,axle,.82,face*.88);wheel.rotation.x=Math.PI/2;
          const flange=mesh(bogie,new THREE.CylinderGeometry(.51,.51,.05,16),steel,axle,.82,face*.79);flange.rotation.x=Math.PI/2;
          const hub=mesh(bogie,new THREE.CylinderGeometry(.18,.18,.18,12),silver,axle,.82,face*.99);hub.rotation.x=Math.PI/2;
        }
      }
      for(const face of [-1,1])for(const springX of [-.25,.05,.35]){
        cylinder(bogie,.105,.29,steel,springX,1.23,face*.96);
        for(const y of [1.13,1.21,1.29]){const coil=mesh(bogie,new THREE.TorusGeometry(.1,.018,4,8),charcoal,springX,y,face*.96);coil.rotation.x=Math.PI/2;}
      }
    }
    // Side ladder leads to the hatch platform; no commercial wagon markings.
    const ladderZ=-1.42;
    for(const lx of [-.37,.37])tube(wagon,[[lx,1.08,ladderZ],[lx,3.7,ladderZ],[lx,4.4,-.6]],.035,silver);
    for(let y=1.2;y<=3.6;y+=.29)box(wagon,.76,.045,.065,silver,0,y,ladderZ);
    box(wagon,2.8,.08,1.1,steel,0,4.38,0);
    for(const side of [-1,1]){
      for(const px of [-1.35,1.35])box(wagon,.035,.9,.035,silver,px,4.85,side*.52);
      tube(wagon,[[-1.35,5.3,side*.52],[1.35,5.3,side*.52]],.03,silver);
      tube(wagon,[[-1.35,4.86,side*.52],[1.35,4.86,side*.52]],.025,silver);
    }
    cylinder(wagon,.31,.26,silver,0,4.58,0);cylinder(wagon,.36,.08,charcoal,0,4.75,0);
    tube(wagon,[[0,1.6,0],[0,1.18,0],[0,1.18,-1.48]],.12,steel);
    combineWagonDetails(wagon);
    placeWagon(wagon,location);prototype=wagon;
  }
  // Keep the twelve existing unloading stations within the original platform.
  for(let i=0;i<asset.railDetails.unloadingStationCount;i++){
    const x=(i-(asset.railDetails.unloadingStationCount-1)/2)*asset.railDetails.unloadingStationPitchM;
    const station=part(`Illustrative rail unloading station · ${i+1}`,equipment);
    cylinder(station,.15,.65,silver,x,1.25,-2.4);
    tube(station,[[x,1.4,-3.4],[x,1.4,-2.4],[x,1.28,-1.02]],.095,silver);
    const handwheel=mesh(station,new THREE.TorusGeometry(.23,.035,6,16),yellow,x,1.6,-2.4);handwheel.rotation.x=Math.PI/2;
    box(station,.4,.55,.4,charcoal,x,1.7,-3.06);
    box(station,.28,.25,.025,mat('#8db4ae',.3),x,1.8,-2.84);
    tube(station,[[x,1.28,-1.02],[x+.6,.8,-.45],[x+.5,.75,trackOffsetM-1.8],[x,1.18,trackOffsetM-1.48]],.075,rubber,true);
    // Parked articulated service arm, kept above the wagon's access platform.
    tube(station,[[x-2,1.45,-3.4],[x-2,5.65,-3.4],[x-.8,5.95,-1.7],[x,5.65,trackOffsetM]],.075,steel);
    for(const [px,py,pz] of [[x-2,5.65,-3.4],[x-.8,5.95,-1.7],[x,5.65,trackOffsetM]])cylinder(station,.14,.18,silver,px,py,pz);
    panel(station,`STATION ${String(i+1).padStart(2,'0')}`,'ILLUSTRATIVE EQUIPMENT',x,2.65,-3.6,2.3);
  }
  return {supports,trackOffsetM,wagonLayout:layout};
}

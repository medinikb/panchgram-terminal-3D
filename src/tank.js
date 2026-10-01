import * as THREE from 'three';

// Original tank-farm details informed by the supplied photo. The photograph is
// never embedded, used as a texture, or used to change scheduled dimensions.
export function createTankBuilder(helpers) {
  const {box,cylinder,mesh,mat} = helpers;
  const steel=mat('#8f9d9d',.48,.35), silver=mat('#d4dedb',.4,.38);
  const seam=mat('#c2c9c3',.68,.08), roofPaint=mat('#e0e5de',.58,.12);
  const handrail=mat('#a95743',.55,.12), dark=mat('#3d5054',.62,.12);
  const concrete=mat('#bac0b9'), yellow=mat('#d5b550',.62);
  const lamps=new THREE.MeshStandardMaterial({color:'#f8dfad',emissive:'#ffbf5b',emissiveIntensity:.03,roughness:.4});

  // Generate restrained paint variation from scratch, using a repeatable seed.
  const paint=document.createElement('canvas');paint.width=1024;paint.height=512;
  const context=paint.getContext('2d');context.fillStyle='#eeeee5';context.fillRect(0,0,1024,512);
  const shade=context.createLinearGradient(0,0,0,512);
  shade.addColorStop(0,'rgba(109,124,113,.09)');shade.addColorStop(.18,'rgba(140,148,135,0)');shade.addColorStop(1,'rgba(131,135,119,.055)');
  context.fillStyle=shade;context.fillRect(0,0,1024,512);
  let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<180;i++) {
    const x=12+random()*1000,y=random()*512;
    context.fillStyle=`rgba(129,139,129,${.015+random()*.04})`;
    context.fillRect(x,y,.5+random()*2,12+random()*130);
  }
  const paintTexture=new THREE.CanvasTexture(paint);paintTexture.colorSpace=THREE.SRGBColorSpace;
  const shellPaint=new THREE.MeshStandardMaterial({map:paintTexture,roughness:.63,metalness:.08});

  function ring(parent,r,y,radius,material) {
    const m=mesh(parent,new THREE.TorusGeometry(r,radius,6,96),material,0,y,0);m.rotation.x=Math.PI/2;return m;
  }
  function pipe(parent,points,radius,material,segments=24) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    return mesh(parent,new THREE.TubeGeometry(curve,segments,radius,6,false),material);
  }
  function beam(parent,a,b,width,material=steel) {
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);
    const m=box(parent,width,delta.length(),width,material,...from.clone().add(to).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
  }
  function radial(radius,angle,y) {return [Math.cos(angle)*radius,y,Math.sin(angle)*radius];}

  function build(parent,asset,accent) {
    const detail=asset.tankDetails, r=asset.diameterM/2,h=asset.heightM;
    const foundationTop=detail.foundationHeightM,top=foundationTop+h,rise=detail.roofRiseM;
    const group=name=>{const g=new THREE.Group();g.name=name;parent.add(g);return g;};
    parent.userData.visualReferenceBasis=detail.referenceBasis;

    const foundation=group('Illustrative concrete ring foundation');
    mesh(foundation,new THREE.CylinderGeometry(r+.55,r+.65,foundationTop,96),concrete,0,foundationTop/2,0);
    ring(foundation,r+.48,foundationTop-.08,.055,seam);
    const shell=mesh(parent,new THREE.CylinderGeometry(r,r,h,96),shellPaint,0,foundationTop+h/2,0);
    shell.name=`Scheduled tank shell · ${asset.id}`;
    shell.userData={diameterM:asset.diameterM,shellHeightM:h,source:'drawing tank schedule'};

    const panelSeams=group('Illustrative shell courses and restrained service bands');
    const courses=Math.ceil(h/2.5);
    for(let i=1;i<courses;i++)ring(panelSeams,r+.045,foundationTop+h*i/courses,.027,seam);
    const verticalSeams=Math.max(12,Math.round(asset.diameterM));
    for(let i=0;i<verticalSeams;i++) {
      const theta=i*2*Math.PI/verticalSeams;
      pipe(panelSeams,[radial(r+.035,theta,foundationTop+.08),radial(r+.035,theta,top-.08)],.016,seam,1);
    }
    // Service colours remain a navigation convention, not a tank paint schedule.
    mesh(panelSeams,new THREE.CylinderGeometry(r+.025,r+.025,.13,96),accent,0,foundationTop+.55,0);
    mesh(panelSeams,new THREE.CylinderGeometry(r+.025,r+.025,.1,96),accent,0,top-.28,0);
    ring(panelSeams,r+.025,top,.055,steel);
    // Tiny weld beads are visual cues; avoid shadow-map speckling on the shell.
    panelSeams.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=false;}});

    const roof=group(`Closed fixed outer roof · ${asset.roofType} · ${asset.id}`);
    // IFRVT retains a closed outer roof: the internal floating deck is unseen.
    // Roof slope is illustrative, while the tank schedule's type is preserved.
    mesh(roof,new THREE.ConeGeometry(r-.035,rise,96),roofPaint,0,top+rise/2,0);
    const roofY=radius=>top+rise*(1-radius/r)+.035;
    for(let i=0;i<16;i++) {
      const theta=i*Math.PI/8;
      const bead=pipe(roof,[radial(.38,theta,roofY(.38)),radial(r-.15,theta,roofY(r-.15))],.017,seam,1);bead.castShadow=false;bead.receiveShadow=false;
    }
    cylinder(roof,.36,.16,silver,0,top+rise+.08,0);
    cylinder(roof,.27,.28,dark,0,top+rise+.29,0);
    cylinder(roof,.45,.09,silver,0,top+rise+.47,0);
    const hatchAngle=-.5,hatchR=r*.48,hatchY=roofY(hatchR);
    cylinder(roof,.47,.1,steel,...radial(hatchR,hatchAngle,hatchY+.05));
    cylinder(roof,.43,.045,silver,...radial(hatchR,hatchAngle,hatchY+.125));
    const hatchPosition=radial(hatchR,hatchAngle,hatchY+.19);
    box(roof,.35,.055,.05,dark,...hatchPosition);
    for(const theta of [2,3.8]) {
      const vr=r*.64,y=roofY(vr);
      cylinder(roof,.15,.18,silver,...radial(vr,theta,y+.09));
      cylinder(roof,.25,.07,steel,...radial(vr,theta,y+.21));
    }

    const access=group('Illustrative curved external staircase and roof access');
    const stairInner=r+.14,stairOuter=r+1.18,stairMid=(stairInner+stairOuter)/2;
    const stepCount=Math.ceil(h/.22),startAngle=.04,arc=stepCount*.3/stairMid;
    const stairAngle=t=>startAngle+arc*t,stairY=t=>foundationTop+.08+h*t;
    for(let i=0;i<stepCount;i++) {
      const t=(i+.5)/stepCount,theta=stairAngle(t);
      const tread=box(access,1.04,.055,.32,steel,...radial(stairMid,theta,stairY(t)));tread.rotation.y=-theta;
      // Every fourth tread has a visible grating edge and occasional wall ties.
      if(i%4===0){const edge=box(access,1.04,.025,.027,silver,...radial(stairMid,theta,stairY(t)+.04));edge.rotation.y=-theta;}
      if(i%12===0){beam(access,radial(r,theta,stairY(t)-.45),radial(stairOuter,theta,stairY(t)-.1),.09);}
    }
    for(const radius of [stairInner,stairOuter]) {
      const points=[];
      for(let i=0;i<=stepCount;i++) {const t=i/stepCount;points.push(radial(radius,stairAngle(t),stairY(t)+1));}
      pipe(access,points,.036,handrail,stepCount*2);
      pipe(access,points.map(p=>[p[0],p[1]-.5,p[2]]),.025,steel,stepCount*2);
      pipe(access,points.map(p=>[p[0],p[1]-1.08,p[2]]),.06,steel,stepCount*2);
      for(let i=0;i<=stepCount;i+=5) {const t=i/stepCount;box(access,.055,1,.055,steel,...radial(radius,stairAngle(t),stairY(t)+.5));}
    }
    const landingAngle=stairAngle(1);
    const landing=box(access,1.65,.13,1.4,steel,...radial(r+.5,landingAngle,top+.06));landing.rotation.y=-landingAngle;
    const deck=mesh(access,new THREE.RingGeometry(r-.82,r-.09,96),steel,0,top+.14,0);deck.rotation.x=-Math.PI/2;
    const railRadius=r-.2,entryGap=.8/railRadius;
    // A short gap aligns the rim railing with the top staircase landing.
    const angles=Array.from({length:97},(_,i)=>landingAngle+entryGap+(2*Math.PI-2*entryGap)*i/96);
    for(const y of [top+.68,top+1.18])pipe(access,angles.map(theta=>radial(railRadius,theta,y)),.034,y>top+1?handrail:steel,96);
    const postCount=Math.ceil(2*Math.PI*r/1.8);
    for(let i=0;i<postCount;i++) {
      const theta=landingAngle+entryGap+(2*Math.PI-2*entryGap)*i/(postCount-1);
      box(access,.055,1.1,.055,steel,...radial(railRadius,theta,top+.63));
    }
    for(let i=0;i<32;i++) {
      const theta=i*Math.PI/16;
      const crossbar=box(access,.68,.025,.035,silver,...radial(r-.45,theta,top+.16));crossbar.rotation.y=-theta;
    }

    const fittings=group('Illustrative tank nozzles, isolation valve and access hatch');
    const pipeRadius=r+.7,angle=1.03;
    const radialEnd=radial(pipeRadius+1.1,angle,foundationTop+.85);
    pipe(fittings,[radial(r-.05,angle,foundationTop+.85),radial(pipeRadius,angle,foundationTop+.85),radial(pipeRadius+1.1,angle,foundationTop+.85)],.13,asset.id.startsWith('FW-')?handrail:silver,2);
    const valvePosition=radial(pipeRadius,angle,foundationTop+.9);
    cylinder(fittings,.19,.32,steel,...valvePosition);
    const wheel=mesh(fittings,new THREE.TorusGeometry(.25,.03,6,20),handrail,valvePosition[0],valvePosition[1]+.32,valvePosition[2]);wheel.rotation.x=Math.PI/2;
    box(fittings,.5,.04,.04,handrail,valvePosition[0],valvePosition[1]+.32,valvePosition[2]);
    box(fittings,.04,.04,.5,handrail,valvePosition[0],valvePosition[1]+.32,valvePosition[2]);
    box(fittings,.55,.4,.55,concrete,radialEnd[0],foundationTop+.2,radialEnd[2]);
    const manway=mesh(fittings,new THREE.CylinderGeometry(.45,.45,.13,24),silver,...radial(r+.07,2.5,foundationTop+1.05));
    manway.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.cos(2.5),0,Math.sin(2.5)));
    for(let i=0;i<8;i++) {
      const theta=i*Math.PI/4;
      const p=radial(r+.16,2.5,foundationTop+1.05+Math.sin(theta)*.34);
      p[0]+=-Math.sin(2.5)*Math.cos(theta)*.34;p[2]+=Math.cos(2.5)*Math.cos(theta)*.34;
      mesh(fittings,new THREE.SphereGeometry(.028,6,4),dark,...p);
    }

    const signs=group('Original tank identity panel from source register');
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#f2f2e8';ctx.fillRect(0,0,768,256);
    ctx.fillStyle='#243e40';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 92px Segoe UI, Arial';ctx.fillText(asset.sourceTag||asset.id,384,90,720);
    ctx.font='35px Segoe UI, Arial';ctx.fillStyle='#5d706a';ctx.fillText(asset.name.split(' · ')[0].toUpperCase(),384,182,720);
    const labelTexture=new THREE.CanvasTexture(canvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
    const label=mesh(signs,new THREE.PlaneGeometry(Math.min(4,r*.66),1.25),new THREE.MeshStandardMaterial({map:labelTexture,roughness:.8}),...radial(r+.045,1.03,foundationTop+h*.56));
    label.rotation.y=Math.PI/2-1.03;label.castShadow=false;

    const lighting=group('Illustrative warm service lights');
    for(let i=0;i<4;i++) {
      const theta=i*Math.PI/2+.4,position=radial(r-.19,theta,top+1.25);
      box(lighting,.28,.08,.15,dark,...position);
      mesh(lighting,new THREE.SphereGeometry(.11,8,6),lamps,position[0],position[1]+.065,position[2]);
    }
    const baseLight=radial(r+1.25,1.03,.5);
    box(lighting,.28,.6,.28,dark,...baseLight);
    box(lighting,.24,.08,.24,lamps,baseLight[0],.83,baseLight[2]);
    return {shell};
  }
  return {build,setNight:enabled=>{lamps.emissiveIntensity=enabled?2.2:.03;}};
}

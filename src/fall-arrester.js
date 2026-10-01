import * as THREE from 'three';
import {fallArresterLayout} from './rail-layout.js';

// This models the steel support shown in the user's detail. Cable, trolley,
// lanyard and anchorage ratings are absent from the detail and are not invented.
export function buildFallArresters(parent,asset,site,{box,cylinder,mat}){
  const detail=asset.railDetails.fallArresters,layout=fallArresterLayout(asset,site.coordinateSystem,site.railLinesPx);
  const steel=mat('#6d858d',.43,.45),edge=mat('#bac7c7',.45,.4),concrete=mat('#bfc5ba');
  const assembly=new THREE.Group();assembly.name='Inverted-L fall-arrester supports · user reference';parent.add(assembly);
  assembly.userData={...detail,count:layout.length,spacingDirection:'along track' };
  for(const location of layout){
    const support=new THREE.Group();support.name=`Fall-arrester support · row ${location.row} · ${location.index}`;
    support.position.set(location.column[0],0,location.column[1]);
    // The local +Z arm always points from the column towards its rail centre.
    const armDirection=location.normal.map(v=>-location.side*v);
    support.rotation.y=Math.atan2(armDirection[0],armDirection[1]);
    support.userData={row:location.row,index:location.index,pitchM:detail.spacingM,heightM:detail.heightM,armLengthM:detail.armLengthM,braceReachM:detail.braceReachM,basePlateM:detail.basePlateM,columnSection:detail.columnSection,armSection:detail.armSection,braceSection:detail.braceSection,baseElevationSource:'illustrative local grade'};
    assembly.add(support);
    // Pedestal elevation and boxed member widths are presentation assumptions.
    const baseY=asset.railDetails.platformHeightM+.07,plateThickness=.025;
    box(support,.78,baseY-.145,.78,concrete,0,(baseY+.145)/2,0);
    const plate=box(support,detail.basePlateM,plateThickness,detail.basePlateM,steel,0,baseY+plateThickness/2,0);plate.name='Reference 500 × 500 mm base plate';
    const columnBottom=baseY+plateThickness,columnTop=columnBottom+detail.heightM;
    const column=box(support,.18,detail.heightM-.2,.25,steel,0,columnBottom+(detail.heightM-.2)/2,0);column.name='ISMC 250 BOX · nominal depth';
    const arm=box(support,.16,.2,detail.armLengthM,steel,0,columnTop-.1,detail.armLengthM/2-.125);arm.name='Reference 3260 mm cantilever · ISMC 200 BOX';
    // Dimension 3260 starts at the outer column face, as in the section detail.
    const braceTopZ=detail.braceReachM-.125,braceTopY=columnTop-.2;
    const braceBottomZ=-.125,braceBottomY=braceTopY-detail.braceReachM;
    const from=new THREE.Vector3(0,braceBottomY,braceBottomZ),to=new THREE.Vector3(0,braceTopY,braceTopZ),delta=to.clone().sub(from);
    const brace=box(support,.12,delta.length(),.15,steel,...from.clone().add(to).multiplyScalar(.5).toArray());
    brace.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());brace.name='ISMC 150 brace · 1500 mm reference reach';
    for(const z of [-.175,.175])for(const x of [-.17,0,.17]){
      cylinder(support,.018,.1,edge,x,baseY+.055,z);
      cylinder(support,.036,.022,steel,x,baseY+.032,z);
    }
    box(support,.2,.015,.22,edge,0,columnTop+.007,0);
    box(support,.02,.19,.16,edge,0,columnTop-.1,detail.armLengthM-.125);
  }
  return {layout,count:layout.length};
}

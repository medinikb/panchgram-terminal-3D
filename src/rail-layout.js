import {planToWorld} from './data.js';

// Return column centres in the rail facility's local coordinates. Distance
// is measured along each track, so even an angled row has the requested pitch.
export function fallArresterLayout(asset, coordinates, routes) {
  const detail=asset.railDetails.fallArresters;
  const angle=(asset.rotationDeg||0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  const origin=planToWorld(asset.planPositionPx,coordinates);
  const local=p=>{const w=planToWorld(p,coordinates),x=w[0]-origin[0],z=w[1]-origin[1];return [x*cos-z*sin,x*sin+z*cos];};
  return Array.from({length:detail.rowCount},(_,row)=>{
    let centre=[0,asset.railDetails.trackOffsetM],direction=[1,0];
    if(row>0){
      const [a,b]=routes[row].slice(0,2).map(local),dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      direction=[dx/length,dz/length];centre=[0,a[1]-a[0]*dz/dx];
    }
    // Track 1 is the site's inner route; track 2 is the boundary-side route.
    // Put each column on the outer edge of the pair, leaving the gap clear.
    const normal=[-direction[1],direction[0]],side=row===0?1:-1;
    return Array.from({length:detail.supportsPerRow},(_,index)=>{
      const distance=(index-(detail.supportsPerRow-1)/2)*detail.spacingM;
      const track=[centre[0]+direction[0]*distance,centre[1]+direction[1]*distance];
      const column=[track[0]+side*normal[0]*detail.armLengthM,track[1]+side*normal[1]*detail.armLengthM];
      return {row:row+1,index:index+1,column,track,direction,normal,side};
    });
  }).flat();
}

// Fit both rows inside the scheduled rail-area length, centred beside the
// unloading platform. The 2.75 m allowance includes the visible end couplers.
export function railWagonLayout(asset,coordinates,routes){
  const detail=asset.railDetails,angle=(asset.rotationDeg||0)*Math.PI/180;
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const local=p=>{
    const x=(p[0]-asset.planPositionPx[0])*coordinates.metresPerPixel;
    const z=(p[1]-asset.planPositionPx[1])*coordinates.metresPerPixel;
    return [x*cos-z*sin,x*sin+z*cos];
  };
  const layout=[];
  for(let row=0;row<detail.wagonTrackCount;row++){
    const trace=routes[row].slice(0,2).map(local);
    const [a,b]=trace,dx=b[0]-a[0],dz=b[1]-a[1],traceLength=Math.hypot(dx,dz);
    // Track 1 follows the rendered platform alignment; track 2 retains its trace.
    const direction=row===0?[1,0]:[dx/traceLength,dz/traceLength];
    const centre=row===0?[0,detail.trackOffsetM]:[0,a[1]-a[0]*dz/dx];
    const available=Math.min(asset.widthM,traceLength);
    const envelope=detail.wagonLengthM+2.75;
    const rakeLength=(detail.wagonCount-1)*detail.wagonPitchM+envelope;
    if(rakeLength>available-2*detail.wagonEndMarginM+1e-8)throw new Error(`${asset.id}: ${detail.wagonCount} wagons do not fit track ${row+1} within the allocated rail area.`);
    for(let index=0;index<detail.wagonCount;index++){
      const centredDistance=(index-(detail.wagonCount-1)/2)*detail.wagonPitchM;
      const position=centre.map((v,axis)=>v+direction[axis]*centredDistance);
      layout.push({trackNumber:row+1,index:index+1,position,direction,distanceAlongTrackM:available/2+centredDistance,availableLengthM:available,rakeLengthM:rakeLength});
    }
  }
  return layout;
}

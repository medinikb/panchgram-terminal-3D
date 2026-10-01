import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateSite,storageTotals,planToWorld,filterAssets,horizontalDistanceM,registerCsv} from '../src/data.js';
import {fallArresterLayout} from '../src/rail-layout.js';
import {railWagonLayout} from '../src/rail-wagons.js';
const data=JSON.parse(await readFile(new URL('../data/site.json',import.meta.url),'utf8'));
test('drawing schedule separates product, fire-water and underground capacity',()=>{
  validateSite(data);assert.deepEqual(storageTotals(data.assets),{productM3:22200,fireWaterM3:7300,productTanks:7,fireWaterTanks:2});
  assert.equal(data.assets.filter(a=>a.underground).reduce((s,a)=>s+a.capacityM3,0),250);
  assert.equal(data.assets.filter(a=>a.underground).length,5);
});
test('malformed dimensions, capacity, ids and coordinates are rejected before rendering',()=>{
  for(const [key,value] of [['widthM',0],['depthM',-1],['heightM',null],['capacityM3',-1],['rotationDeg',Infinity],['category','unknown'],['kind','unknown'],['planPositionPx',[null,5]]]){const bad=structuredClone(data);bad.assets[0][key]=value;assert.throws(()=>validateSite(bad));}
  const duplicate=structuredClone(data);duplicate.assets.push(duplicate.assets[0]);assert.throws(()=>validateSite(duplicate),/unique/);
  const invalid=structuredClone(data);invalid.coordinateSystem.metresPerPixel=NaN;assert.throws(()=>validateSite(invalid),/positive/);
});
test('manual calibration maps the image origin to zero and 68 pixels to 24 metres',()=>{
  assert.deepEqual(planToWorld(data.coordinateSystem.originPx,data.coordinateSystem),[0,0]);
  assert.deepEqual(planToWorld([1068,560],data.coordinateSystem),[24,0]);
});
test('measurements are horizontal, including zero; invalid points are rejected',()=>{
  assert.equal(horizontalDistanceM({x:0,y:50,z:0},{x:3,y:-9,z:4}),5);
  assert.equal(horizontalDistanceM({x:1,z:1},{x:1,z:1}),0);
  assert.throws(()=>horizontalDistanceM({x:NaN,z:0},{x:0,z:0}));
});
test('search supports source tags and categories without inventing matches',()=>{
  assert.equal(filterAssets(data.assets,'t-02b')[0].id,'HSD-02');
  assert.equal(filterAssets(data.assets,'  Fire-water  ','utilities').length,3);
  assert.equal(filterAssets(data.assets,'no-such-facility').length,0);
});
test('CSV preserves unknown values, escaping and spreadsheet formula protection',()=>{
  const csv=registerCsv([{id:'TEST',name:'=SUM(1,2)',description:'a "quoted" room'}]);
  assert.ok(csv.includes('"\'=SUM(1,2)"'));assert.ok(csv.includes('"a ""quoted"" room"'));assert.ok(!csv.includes('undefined'));
});
test('gantry retains scheduled footprint and separates active equipment from future reservations',()=>{
  const gantry=data.assets.find(a=>a.id==='TLG-01');
  assert.equal(gantry.widthM,12);assert.equal(gantry.depthM,52);
  assert.equal(gantry.gantryDetails.activeBays,4);assert.equal(gantry.gantryDetails.futureBays,4);
  for(const [key,value] of [['activeBays',0],['activeBays',1.5],['futureBays',-1],['futureBays',null],['platformHeightM',NaN],['platformHeightM',gantry.heightM]]) {
    const bad=structuredClone(data);bad.assets.find(a=>a.id==='TLG-01').gantryDetails[key]=value;assert.throws(()=>validateSite(bad),/TLG-01/);
  }
});

test('pump-house reference detail preserves footprints and rejects unsuitable equipment layouts',()=>{
  for(const [id,width,depth] of [['FWPH-01',24,8],['TWPH-01',40,6],['TLPH-01',6,45]]){
    const house=data.assets.find(a=>a.id===id);
    assert.equal(house.widthM,width);assert.equal(house.depthM,depth);
    assert.equal(house.footprintSource,'drawing schedule');
    for(const [key,value] of [['illustrativePumpCount',0],['illustrativePumpCount',1.5],['illustrativePumpCount',null],['illustrativePumpCount',13],['service','crude'],['referenceBasis','']]){
      const bad=structuredClone(data);bad.assets.find(a=>a.id===id).pumpHouseDetails[key]=value;
      assert.throws(()=>validateSite(bad),new RegExp(id));
    }
  }
  const crowded=structuredClone(data);crowded.assets.find(a=>a.id==='FWPH-01').pumpHouseDetails.illustrativePumpCount=12;
  assert.throws(()=>validateSite(crowded),/fit the scheduled/);
});

test('tank visual details preserve the complete source schedule and reject invalid roof proportions',()=>{
  const tanks=data.assets.filter(a=>a.kind==='tank');
  assert.deepEqual(tanks.map(a=>[a.id,a.diameterM,a.heightM,a.capacityM3,a.roofType]),[
    ['MS-01',20,12.6,3000,'IFRVT'],['MS-02',20,12.6,3000,'IFRVT'],['ETH-01',10,9.7,600,'IFRVT'],
    ['HSD-01',24,12.5,5000,'CRVT'],['HSD-02',24,12.5,5000,'CRVT'],['HSD-03',24,12.5,5000,'CRVT'],
    ['BIO-01',9,9.7,600,'CRVT'],['FW-01',18,16,3650,'CRVT'],['FW-02',18,16,3650,'CRVT']
  ]);
  for(const [key,value] of [['foundationHeightM',0],['foundationHeightM',null],['foundationHeightM',Infinity],['roofRiseM',0],['roofRiseM',3],['roofRiseM',NaN],['referenceBasis','']]){
    const bad=structuredClone(data);bad.assets.find(a=>a.id==='MS-01').tankDetails[key]=value;
    assert.throws(()=>validateSite(bad),/MS-01/);
  }
  const roof=structuredClone(data);roof.assets.find(a=>a.id==='MS-01').roofType='openFloatingRoof';
  assert.throws(()=>validateSite(roof),/scheduled roof/);
});

test('underground cutaway settings preserve all five schedules and reject invalid vessel shapes',()=>{
  const vessels=data.assets.filter(a=>a.kind==='underground');
  assert.equal(vessels.length,5);
  for(const vessel of vessels){
    assert.deepEqual([vessel.diameterM,vessel.lengthM,vessel.capacityM3],[3.3,7.5,50]);
    assert.equal(vessel.underground,true);
    const detail=vessel.vesselDetails;
    assert.ok(vessel.lengthM-2*detail.headDepthM>0);
  }
  for(const [key,value] of [['headDepthM',0],['headDepthM',2],['headDepthM',null],['soilCoverM',-1],['soilCoverM',NaN],['pitClearanceM',0],['wallThicknessM',1],['floorClearanceM',null],['manwayCount',0],['manwayCount',1.5],['manwayHeightM',.2],['referenceBasis','']]){
    const bad=structuredClone(data);bad.assets.find(a=>a.id==='UG-01').vesselDetails[key]=value;
    assert.throws(()=>validateSite(bad),/UG-01/);
  }
  assert.equal(storageTotals(data.assets).productM3,22200);
});

test('rail refinement preserves the held schedule and rejects colliding or oversized illustrative rakes',()=>{
  const rail=data.assets.find(a=>a.id==='RAIL-01');
  assert.deepEqual([rail.widthM,rail.depthM,rail.heightM,rail.rotationDeg,rail.planPositionPx],[350,10,6.85,10,[641,392]]);
  assert.equal(rail.originalShedSchedule.status,'hold / see notes');
  assert.match(rail.description,/380 × 15/);
  assert.equal(rail.footprintSource,'drawing schedule');
  assert.equal(rail.railDetails.wagonCount,25);
  for(const [key,value] of [['wagonCount',0],['wagonCount',1.5],['wagonCount',27],['wagonPitchM',20],['wagonPitchM',NaN],['wagonLengthM',null],['trackOffsetM',0],['trackOffsetM',4],['platformHeightM',0],['referenceBasis','']]){
    const bad=structuredClone(data);bad.assets.find(a=>a.id==='RAIL-01').railDetails[key]=value;
    assert.throws(()=>validateSite(bad),/RAIL-01/);
  }
});

test('both 25-wagon rows fit the allocated 350 m area without overlapping couplers',()=>{
  const rail=data.assets.find(a=>a.id==='RAIL-01');
  const layout=railWagonLayout(rail,data.coordinateSystem,data.railLinesPx);
  assert.equal(layout.length,50);
  assert.equal(rail.railDetails.wagonLengthM,10.45);
  assert.equal(rail.railDetails.unloadingStationCount,12);
  for(const number of [1,2]){
    const row=layout.filter(w=>w.trackNumber===number);assert.equal(row.length,25);
    assert.deepEqual(row.map(w=>w.index),Array.from({length:25},(_,i)=>i+1));
    for(let i=1;i<row.length;i++)assert.ok(Math.abs(row[i].distanceAlongTrackM-row[i-1].distanceAlongTrackM-13.2)<1e-9);
    const halfEnvelope=(rail.railDetails.wagonLengthM+2.75)/2;
    assert.ok(row[0].distanceAlongTrackM-halfEnvelope>=10-1e-9);
    assert.ok(row.at(-1).distanceAlongTrackM+halfEnvelope<=rail.widthM-10+1e-9);
    assert.equal(row[0].availableLengthM,350);
    assert.ok(Math.abs(row[0].rakeLengthM-330)<1e-9);
    // Fit must be centred on the platform, rather than elsewhere on the long trace.
    assert.ok(Math.abs(row[12].position[0])<1e-9);
    for(const wagon of row)assert.ok(Math.abs(wagon.position[0])+halfEnvelope*Math.abs(wagon.direction[0])+1.5*Math.abs(wagon.direction[1])<rail.widthM/2);
    assert.ok(row.every(w=>w.position.every(Number.isFinite)&&Math.abs(Math.hypot(...w.direction)-1)<1e-9));
  }
  const crowded=structuredClone(rail);crowded.railDetails.wagonCount=30;
  assert.throws(()=>railWagonLayout(crowded,data.coordinateSystem,data.railLinesPx),/do not fit/);
  const former=structuredClone(data);Object.assign(former.assets.find(a=>a.id==='RAIL-01').railDetails,{wagonLengthM:19,wagonPitchM:22});
  assert.throws(()=>validateSite(former),/allocated rail-area/);
  const tooShort=structuredClone(data);tooShort.assets.find(a=>a.id==='RAIL-01').railDetails.wagonLengthM=7;
  assert.throws(()=>validateSite(tooShort),/wagon length/);
  for(const [key,value] of [['wagonTrackCount',0],['wagonTrackCount',3],['wagonEndMarginM',-1],['wagonEndMarginM',null],['unloadingStationCount',0],['unloadingStationPitchM',50]]){
    const bad=structuredClone(data);bad.assets.find(a=>a.id==='RAIL-01').railDetails[key]=value;
    assert.throws(()=>validateSite(bad),/RAIL-01/);
  }
});

test('fall-arrester pedestals stand outside both tracks, with arms reaching inward',()=>{
  const rail=data.assets.find(a=>a.id==='RAIL-01');
  const layout=fallArresterLayout(rail,data.coordinateSystem,data.railLinesPx);
  const trackRows=[1,2].map(row=>layout.find(s=>s.row===row));
  // Compare the whole pedestal against both ballast strips, not just its centre.
  const ballastHalfWidthM=2,pedestalHalfWidthM=.39;
  for(const support of layout){
    for(const route of trackRows){
      const [dx,dz]=support.column.map((v,i)=>v-route.track[i]);
      const signedDistance=dx*route.normal[0]+dz*route.normal[1];
      assert.ok(support.row===1?signedDistance>ballastHalfWidthM+pedestalHalfWidthM:signedDistance<-(ballastHalfWidthM+pedestalHalfWidthM),
        `Row ${support.row}, support ${support.index}: pedestal must be outside the pair of tracks`);
    }
    const inward=support.track.map((v,i)=>v-support.column[i]);
    const armDirection=support.normal.map(v=>-support.side*v);
    assert.ok(inward[0]*armDirection[0]+inward[1]*armDirection[1]>0,'Arm must point back towards its wagon track');
  }
});

test('fall-arrester rows retain reference dimensions and exact 12.42 m pitch along both tracks',()=>{
  const rail=data.assets.find(a=>a.id==='RAIL-01'),detail=rail.railDetails.fallArresters;
  assert.deepEqual([detail.heightM,detail.armLengthM,detail.braceReachM,detail.basePlateM],[6.85,3.26,1.5,.5]);
  const layout=fallArresterLayout(rail,data.coordinateSystem,data.railLinesPx);
  assert.equal(layout.length,54);
  for(const row of [1,2]){
    const supports=layout.filter(s=>s.row===row);assert.equal(supports.length,27);
    for(let i=1;i<supports.length;i++){
      const a=supports[i-1].column,b=supports[i].column;
      assert.ok(Math.abs(Math.hypot(b[0]-a[0],b[1]-a[1])-12.42)<1e-9);
    }
    for(const support of supports){
      assert.ok(Math.abs(support.column[0])+detail.basePlateM/2<rail.widthM/2);
      assert.ok(Math.abs(Math.hypot(support.track[0]-support.column[0],support.track[1]-support.column[1])-detail.armLengthM)<1e-9);
    }
  }
  const single=structuredClone(rail);single.railDetails.fallArresters.rowCount=1;
  assert.equal(fallArresterLayout(single,data.coordinateSystem,data.railLinesPx).length,27);
  for(const [key,value] of [['spacingM',0],['spacingM',NaN],['spacingM',20],['rowCount',0],['rowCount',3],['supportsPerRow',0],['supportsPerRow',1.5],['supportsPerRow',30],['heightM',null],['heightM',7],['armLengthM',1],['braceReachM',8],['basePlateM',.1],['referenceBasis','']]){
    const bad=structuredClone(data);bad.assets.find(a=>a.id==='RAIL-01').railDetails.fallArresters[key]=value;
    assert.throws(()=>validateSite(bad),/RAIL-01/);
  }
});

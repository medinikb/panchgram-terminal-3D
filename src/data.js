// The drawing register is kept separate from rendering so owners can review facts.
export function validateSite(data) {
  if (!data || data.schemaVersion !== 1) throw new Error('Unsupported site-data version. Expected schemaVersion 1.');
  const coordinates = data.coordinateSystem;
  if (!coordinates || !Number.isFinite(coordinates.metresPerPixel) || coordinates.metresPerPixel <= 0) throw new Error('coordinateSystem.metresPerPixel must be positive.');
  const validPoint = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
  if (!validPoint(coordinates.originPx)) throw new Error('coordinateSystem.originPx must contain two numbers.');
  for (const key of ['imageWidthPx', 'imageHeightPx']) if (!Number.isFinite(coordinates[key]) || coordinates[key] <= 0) throw new Error(`coordinateSystem.${key} must be positive.`);
  if (!Array.isArray(data.categories) || !data.categories.length) throw new Error('categories must be a nonempty array.');
  const categoryIds = new Set();
  for (const category of data.categories) {
    if (typeof category.id !== 'string' || categoryIds.has(category.id) || !/^#[\da-f]{6}$/i.test(category.color)) throw new Error('Invalid or duplicate category.');
    categoryIds.add(category.id);
  }
  const kinds = new Set(['tank','building','pumpHouse','equipment','basin','platform','gantry','railShed','shed','future','parking','underground']);
  const ids = new Set();
  if (!Array.isArray(data.assets) || !data.assets.length) throw new Error('assets must be a nonempty array.');
  for (const asset of data.assets) {
    if (!asset || typeof asset.id !== 'string' || !asset.id || ids.has(asset.id)) throw new Error('Every facility needs a unique id.');
    ids.add(asset.id);
    if (typeof asset.name !== 'string' || !asset.name) throw new Error(`${asset.id}: name is required.`);
    if (!categoryIds.has(asset.category) || !kinds.has(asset.kind)) throw new Error(`${asset.id}: unknown category or model kind.`);
    if (!validPoint(asset.planPositionPx)) throw new Error(`${asset.id}: planPositionPx must contain two finite numbers.`);
    for (const key of ['widthM','depthM','heightM']) if (!Number.isFinite(asset[key]) || asset[key] <= 0) throw new Error(`${asset.id}: ${key} must be positive.`);
    if (asset.capacityM3 !== undefined && (!Number.isFinite(asset.capacityM3) || asset.capacityM3 < 0)) throw new Error(`${asset.id}: capacityM3 must be non-negative.`);
    if (asset.rotationDeg !== undefined && !Number.isFinite(asset.rotationDeg)) throw new Error(`${asset.id}: rotationDeg must be finite.`);
    if (asset.kind === 'tank' && (!Number.isFinite(asset.diameterM) || asset.diameterM <= 0)) throw new Error(`${asset.id}: diameterM must be positive.`);
    if (asset.kind === 'tank') {
      const detail=asset.tankDetails;
      if (!['IFRVT','CRVT'].includes(asset.roofType)) throw new Error(`${asset.id}: unsupported scheduled roof type.`);
      if (!detail || !Number.isFinite(detail.foundationHeightM) || detail.foundationHeightM <= 0 || detail.foundationHeightM > 2) throw new Error(`${asset.id}: tankDetails requires a valid illustrative foundation height.`);
      if (!Number.isFinite(detail.roofRiseM) || detail.roofRiseM <= 0 || detail.roofRiseM >= asset.heightM*.2) throw new Error(`${asset.id}: roofRiseM must be positive and proportionate to the tank.`);
      if (typeof detail.referenceBasis !== 'string' || !detail.referenceBasis.trim()) throw new Error(`${asset.id}: tank reference basis is required.`);
    }
    if (asset.kind === 'underground' && (!Number.isFinite(asset.lengthM) || !Number.isFinite(asset.diameterM) || asset.lengthM <= 0 || asset.diameterM <= 0)) throw new Error(`${asset.id}: underground dimensions must be positive.`);
    if (asset.kind === 'underground') {
      const detail=asset.vesselDetails;
      if (!detail || !Number.isFinite(detail.headDepthM) || detail.headDepthM <= 0 || detail.headDepthM >= Math.min(asset.diameterM/2,asset.lengthM/2)) throw new Error(`${asset.id}: illustrative head depth must leave a cylindrical vessel body.`);
      if (!Number.isFinite(detail.soilCoverM) || detail.soilCoverM < 0 || detail.soilCoverM > asset.diameterM/2) throw new Error(`${asset.id}: soilCoverM must be a valid illustrative cover.`);
      for(const [key,min,max] of [['pitClearanceM',.25,.9],['wallThicknessM',.05,.3],['floorClearanceM',.2,1.5]]) if(!Number.isFinite(detail[key])||detail[key]<min||detail[key]>max) throw new Error(`${asset.id}: ${key} is outside the supported cutaway range.`);
      if (!Number.isInteger(detail.manwayCount) || detail.manwayCount<1 || detail.manwayCount>3 || !Number.isFinite(detail.manwayHeightM) || detail.manwayHeightM<=detail.soilCoverM+.15 || detail.manwayHeightM>2.5) throw new Error(`${asset.id}: illustrative manways need a valid count and height.`);
      if (typeof detail.referenceBasis!=='string' || !detail.referenceBasis.trim()) throw new Error(`${asset.id}: vessel reference basis is required.`);
    }
    if (asset.kind === 'gantry') {
      const detail = asset.gantryDetails;
      if (!detail || !Number.isInteger(detail.activeBays) || detail.activeBays < 1 || !Number.isInteger(detail.futureBays) || detail.futureBays < 0 || detail.activeBays + detail.futureBays > 24) throw new Error(`${asset.id}: gantryDetails requires valid active and future bay counts.`);
      if (!Number.isFinite(detail.platformHeightM) || detail.platformHeightM <= 0 || detail.platformHeightM >= asset.heightM - 1.5) throw new Error(`${asset.id}: platformHeightM must leave room below the canopy.`);
    }
    if (asset.kind === 'pumpHouse') {
      const detail = asset.pumpHouseDetails;
      if (!detail || !['fireWater','railReceipt','truckDispatch'].includes(detail.service)) throw new Error(`${asset.id}: pumpHouseDetails requires a known service.`);
      if (!Number.isInteger(detail.illustrativePumpCount) || detail.illustrativePumpCount < 1 || detail.illustrativePumpCount > 12 || (Math.max(asset.widthM,asset.depthM)-5)/detail.illustrativePumpCount < 2.7) throw new Error(`${asset.id}: illustrativePumpCount must fit the scheduled footprint.`);
      if (asset.heightM < 3.5 || Math.min(asset.widthM,asset.depthM) < 5) throw new Error(`${asset.id}: open-shed geometry requires sufficient height and span.`);
      if (typeof detail.referenceBasis !== 'string' || !detail.referenceBasis.trim()) throw new Error(`${asset.id}: pump-house reference basis is required.`);
    }
    if (asset.kind === 'railShed') {
      const detail=asset.railDetails;
      if(!detail||!Number.isInteger(detail.wagonCount)||detail.wagonCount<1||detail.wagonCount>50) throw new Error(`${asset.id}: valid illustrative wagon count required.`);
      if(!Number.isFinite(detail.wagonLengthM)||detail.wagonLengthM<8||detail.wagonLengthM>22||!Number.isFinite(detail.wagonPitchM)||detail.wagonPitchM<detail.wagonLengthM+2.75) throw new Error(`${asset.id}: illustrative wagon length must be 8–22 m, and pitch must keep the visible couplers from overlapping.`);
      if(!Number.isInteger(detail.wagonTrackCount)||detail.wagonTrackCount<1||detail.wagonTrackCount>2||!Number.isFinite(detail.wagonEndMarginM)||detail.wagonEndMarginM<0||detail.wagonEndMarginM>30) throw new Error(`${asset.id}: invalid wagon track count or end margin.`);
      if(!Number.isInteger(detail.unloadingStationCount)||detail.unloadingStationCount<1||!Number.isFinite(detail.unloadingStationPitchM)||detail.unloadingStationPitchM<=0||(detail.unloadingStationCount-1)*detail.unloadingStationPitchM+3>asset.widthM) throw new Error(`${asset.id}: unloading stations must remain inside the platform.`);
      for(let row=0;row<detail.wagonTrackCount;row++){
        const route=data.railLinesPx?.[row];
        if(!Array.isArray(route)||!validPoint(route[0])||!validPoint(route[1])) throw new Error(`${asset.id}: wagon row requires a valid rail trace.`);
        const available=Math.min(asset.widthM,Math.hypot(route[1][0]-route[0][0],route[1][1]-route[0][1])*coordinates.metresPerPixel);
        if((detail.wagonCount-1)*detail.wagonPitchM+detail.wagonLengthM+2.75>available-2*detail.wagonEndMarginM+1e-8) throw new Error(`${asset.id}: wagon row exceeds the allocated rail-area length.`);
      }
      if(!Number.isFinite(detail.trackOffsetM)||detail.trackOffsetM<1.4||detail.trackOffsetM+1.8>asset.depthM/2-.4||asset.depthM<9) throw new Error(`${asset.id}: covered track must leave room for the platform and columns.`);
      if(!Number.isFinite(detail.platformHeightM)||detail.platformHeightM<.6||detail.platformHeightM>1.2||asset.heightM<6) throw new Error(`${asset.id}: invalid illustrative platform or support height.`);
      if(typeof detail.referenceBasis!=='string'||!detail.referenceBasis.trim()) throw new Error(`${asset.id}: rail reference basis is required.`);
      const supports=detail.fallArresters;
      if(!supports||!Number.isInteger(supports.rowCount)||supports.rowCount<1||supports.rowCount>2||!Number.isInteger(supports.supportsPerRow)||supports.supportsPerRow<2||supports.supportsPerRow>60) throw new Error(`${asset.id}: fall-arrester rows and counts must be valid integers.`);
      for(const key of ['spacingM','heightM','armLengthM','braceReachM','basePlateM']) if(!Number.isFinite(supports[key])||supports[key]<=0) throw new Error(`${asset.id}: fallArresters.${key} must be positive metres.`);
      if((supports.supportsPerRow-1)*supports.spacingM+supports.basePlateM>asset.widthM||supports.braceReachM>=supports.armLengthM||supports.braceReachM>=supports.heightM||supports.basePlateM<.3||supports.basePlateM>1||supports.armLengthM<=.5||asset.heightM!==supports.heightM) throw new Error(`${asset.id}: support layout must fit the corridor and reference dimensions.`);
      if(!Array.isArray(data.railLinesPx)||data.railLinesPx.length<supports.rowCount) throw new Error(`${asset.id}: every support row needs a rail trace.`);
      for(let row=1;row<supports.rowCount;row++){
        const route=data.railLinesPx[row];
        if(!Array.isArray(route)||route.length<2||!validPoint(route[0])||!validPoint(route[1])) throw new Error(`${asset.id}: invalid support-row rail trace.`);
        const dx=route[1][0]-route[0][0],dz=route[1][1]-route[0][1],angle=(asset.rotationDeg||0)*Math.PI/180;
        if(Math.abs(dx*Math.cos(angle)-dz*Math.sin(angle))<.01) throw new Error(`${asset.id}: support-row trace must extend along the corridor.`);
      }
      if(typeof supports.referenceBasis!=='string'||!supports.referenceBasis.trim()) throw new Error(`${asset.id}: support reference basis required.`);
    }
  }
  if (!Array.isArray(data.boundaryPx) || data.boundaryPx.length < 3 || !data.boundaryPx.every(validPoint)) throw new Error('boundaryPx needs at least three valid points.');
  for (const key of ['roadsPx','railLinesPx','pipeRoutesPx','greenBeltPx']) {
    if (!Array.isArray(data[key]) || !data[key].every(route => Array.isArray(route) && route.length >= 2 && route.every(validPoint))) throw new Error(`${key}: malformed trace.`);
  }
  if (!Array.isArray(data.bunds) || !data.bunds.every(b => validPoint(b.positionPx) && Number.isFinite(b.widthM) && b.widthM > 0 && Number.isFinite(b.depthM) && b.depthM > 0)) throw new Error('Invalid tank bund.');
  if (!Array.isArray(data.tour) || !data.tour.every(stop => stop.assetId === null || ids.has(stop.assetId))) throw new Error('Tour refers to an unknown facility.');
  return data;
}

export function planToWorld(point, coordinates) {
  return [(point[0] - coordinates.originPx[0]) * coordinates.metresPerPixel,
    (point[1] - coordinates.originPx[1]) * coordinates.metresPerPixel];
}
export function storageTotals(assets) {
  // Scheduled usable/stored capacity is authoritative, not geometric cylinder volume.
  const aboveGroundProduct = assets.filter(a => a.category === 'storage' && a.kind === 'tank');
  const fireWater = assets.filter(a => a.id.startsWith('FW-') && a.kind === 'tank');
  return { productM3: aboveGroundProduct.reduce((s,a) => s + a.capacityM3, 0), fireWaterM3: fireWater.reduce((s,a) => s + a.capacityM3,0), productTanks: aboveGroundProduct.length, fireWaterTanks: fireWater.length };
}
export function filterAssets(assets, query = '', category = 'all') {
  const term = query.trim().toLocaleLowerCase();
  return assets.filter(a => (category === 'all' || a.category === category) &&
    `${a.name} ${a.id} ${a.sourceTag || ''} ${a.description}`.toLocaleLowerCase().includes(term));
}
export function horizontalDistanceM(a,b) {
  if (![a.x,a.z,b.x,b.z].every(Number.isFinite)) throw new Error('Measurement requires finite ground coordinates.');
  return Math.hypot(a.x-b.x,a.z-b.z);
}
export function registerCsv(assets) {
  // Spreadsheet programs can execute cells starting with =,+,-,@. Prefix free text.
  const cell = value => { let s = String(value ?? ''); if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replaceAll('"','""')}"`; };
  const keys = ['id','name','category','status','sourceNumber','sourceTag','widthM','depthM','heightM','capacityM3','footprintSource','heightSource','positionSource','description'];
  return '\uFEFF' + [keys.map(cell).join(','), ...assets.map(a => keys.map(k => cell(a[k])).join(','))].join('\r\n');
}

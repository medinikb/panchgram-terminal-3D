import * as THREE from 'three';
import {createScene} from './scene.js';
import {validateSite,storageTotals,filterAssets,horizontalDistanceM,registerCsv} from './data.js';

const $ = id => document.getElementById(id);
const format = value => new Intl.NumberFormat('en-IN',{maximumFractionDigits:1}).format(value);
let data, viewer, selectedId=null, isolated=false, measurement=false, measurePoints=[], tourIndex=-1,gantryRoofVisible=true;
const symbol={storage:'◉',logistics:'⇆',utilities:'◇',support:'▤',future:'▧'};
const labelElements=new Map();
const pumpHouseRoofVisibility=new Map();
const dialogs=['notes-dialog','export-dialog','sheet-dialog'];
let toastTimer;
let fullscreenDetailsOpen=false;
const panelPreferenceKey='panchgram.side-panels.v1';
const narrowPanels=matchMedia('(max-width:1050px)');
let listPanelOpen=false,detailsPanelOpen=false;
// Remember only these two display choices on this browser. Fresh visits start closed.
try{
  const saved=JSON.parse(localStorage.getItem(panelPreferenceKey));
  listPanelOpen=saved?.list===true;detailsPanelOpen=saved?.details===true;
}catch{/* Private browsing or a malformed preference still leaves usable controls. */}
function syncSidePanels(){
  // Drawers share the small screen; desktop panels can both be open independently.
  if(narrowPanels.matches&&listPanelOpen&&detailsPanelOpen)listPanelOpen=false;
  $('explorer').hidden=!listPanelOpen;
  $('explorer').classList.toggle('open',listPanelOpen);
  document.body.classList.toggle('details-collapsed',!detailsPanelOpen);
  for(const [id,open,name] of [['list-panel-toggle',listPanelOpen,'facility list'],['details-panel-toggle',detailsPanelOpen,'facility details']]){
    const toggle=$(id),label=`${open?'Close':'Open'} ${name}`;
    toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',label);toggle.title=label;
  }
  $('panel-scrim').hidden=!narrowPanels.matches||!(listPanelOpen||detailsPanelOpen);
  // Keep keyboard focus out of the covered workspace while a small-screen drawer is open.
  const drawerOpen=narrowPanels.matches&&(listPanelOpen||detailsPanelOpen);
  for(const target of [document.querySelector('.workspace-toolbar'),$('viewer-grid'),document.querySelector('.bottom-controls'),document.querySelector('.app-footer')])target.inert=drawerOpen;
  syncFullscreenDetails();
}
function setSidePanel(panel,open,remember=true){
  const region=$(panel==='list'?'explorer':'details'),restoreFocus=!open&&region.contains(document.activeElement);
  if(panel==='list')listPanelOpen=open;else detailsPanelOpen=open;
  if(open&&narrowPanels.matches){if(panel==='list')detailsPanelOpen=false;else listPanelOpen=false;}
  syncSidePanels();
  if(remember)try{localStorage.setItem(panelPreferenceKey,JSON.stringify({list:listPanelOpen,details:detailsPanelOpen}));}catch{}
  if(restoreFocus)$(panel==='list'?'list-panel-toggle':'details-panel-toggle').focus();
  if(open&&narrowPanels.matches)region.querySelector('.panel-close')?.focus();
}
// Selection updates the card, but only the user's button opens it in fullscreen.
function syncFullscreenDetails(){
  const active=document.fullscreenElement===$('viewport');
  $('details').hidden=active?!fullscreenDetailsOpen:!detailsPanelOpen;
  const toggle=$('fullscreen-details-toggle');
  toggle.hidden=!active;
  toggle.setAttribute('aria-expanded',String(active&&fullscreenDetailsOpen));
  toggle.textContent=fullscreenDetailsOpen?'Hide facility details ▾':'Facility details ▴';
}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function element(tag, text, className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}

// Use textContent for drawing-derived names and notes; never execute register text.
function renderList(){
  const filtered=filterAssets(data.assets,$('search').value,$('category').value);
  $('asset-count').textContent=`${filtered.length} / ${data.assets.length}`;
  $('no-results').hidden=filtered.length>0;
  $('asset-list').replaceChildren();
  for(const category of data.categories){
    const assets=filtered.filter(a=>a.category===category.id);if(!assets.length)continue;
    const head=element('div',category.name,'asset-group');head.append(element('span',String(assets.length)));$('asset-list').append(head);
    for(const asset of assets){const b=element('button',undefined,'asset-item');b.dataset.id=asset.id;b.style.setProperty('--asset-color',category.color);b.classList.toggle('selected',asset.id===selectedId);b.setAttribute('aria-pressed',String(asset.id===selectedId));
      b.append(element('span',symbol[asset.category],'asset-symbol'));
      const content=element('span');content.append(element('span',asset.name,'asset-name'),element('span',asset.sourceTag||asset.id,'asset-sub'));b.append(content,element('span','↗','asset-arrow'));
      b.addEventListener('click',()=>{selectAsset(asset.id,true);if(narrowPanels.matches)setSidePanel('list',false,false);});$('asset-list').append(b);
    }
  }
}
function addMetric(parent,value,title){const div=element('div',undefined,'metric');div.append(element('strong',value),element('span',title));parent.append(div);}
function renderDetails(asset){
  const dock=$('details');dock.replaceChildren();
  syncFullscreenDetails();
  const collapse=element('button','×','panel-close');collapse.setAttribute('aria-label','Collapse facility details');collapse.title='Collapse facility details';
  collapse.addEventListener('click',()=>{if(document.fullscreenElement===$('viewport')){fullscreenDetailsOpen=false;syncFullscreenDetails();$('fullscreen-details-toggle').focus();}else setSidePanel('details',false);});
  dock.append(collapse);
  const intro=element('div',undefined,'detail-intro');
  intro.append(element('div',asset?`${asset.id} / ${asset.status.toUpperCase()}`:'SITE OVERVIEW / PANCHGRAM','eyebrow'));
  intro.append(element('h3',asset?asset.name:'A place for every operation.'));
  intro.append(element('p',asset?(asset.sourceNumber?`Facility schedule · item ${asset.sourceNumber}`:'Tank schedule / drawing trace'):'Drawing-linked facilities, ready to explore'));
  dock.append(intro);
  const metrics=element('div',undefined,'detail-metrics');
  if(asset){
    if(asset.capacityM3!==undefined)addMetric(metrics,`${format(asset.capacityM3)} m³`,'Scheduled capacity');
    if(asset.diameterM)addMetric(metrics,`${format(asset.diameterM)} m`,asset.kind==='underground'?'Vessel diameter':'Tank diameter');
    else if(asset.kind==='railShed')addMetric(metrics,`${format(asset.railDetails.fallArresters.spacingM*1000)} mm`,'Support centre spacing');
    else addMetric(metrics,`${format(asset.widthM)} × ${format(asset.depthM)} m`,'Footprint');
    if(!asset.diameterM||asset.capacityM3===undefined)addMetric(metrics,asset.kind==='railShed'?`${format(asset.heightM*1000)} mm`:`${format(asset.heightM)} m`,asset.kind==='railShed'?'Reference support height':'Illustrative height');
    // The vertical information panel keeps the complete tank dimensions visible.
    else addMetric(metrics,`${format(asset.kind==='underground'?asset.lengthM:asset.heightM)} m`,asset.kind==='underground'?'Vessel length':'Scheduled shell height');
  }else {const totals=storageTotals(data.assets);addMetric(metrics,format(totals.productM3)+' m³','Product capacity');addMetric(metrics,format(totals.fireWaterM3)+' m³','Fire-water capacity');}
  dock.append(metrics);
  const actions=element('div',undefined,'detail-actions');
  actions.append(element('p',asset?asset.description:'Choose a facility in the model or list to see its dimensions, purpose and source. Use Compare to connect the 3D view to the original plot plan.','detail-description'));
  const buttons=element('div',undefined,'detail-buttons');
  if(asset){
    const focus=element('button','Focus view ↗');focus.addEventListener('click',()=>{setMode('model');focusFacility(asset);});
    const isolate=element('button',isolated?'Show all':'Isolate facility');isolate.addEventListener('click',()=>{isolated=!isolated;applyVisibility();renderDetails(asset);});
    buttons.append(focus,isolate);
    if(asset.kind==='gantry'){
      const roof=element('button',gantryRoofVisible?'Hide roof':'Show roof');
      roof.addEventListener('click',()=>{gantryRoofVisible=!gantryRoofVisible;viewer?.setGantryRoof(gantryRoofVisible);renderDetails(asset);});buttons.append(roof);
    }
    if(asset.kind==='railShed'){
      const equipment=element('button','Unloading close-up');
      equipment.addEventListener('click',()=>{
        setMode('model');
        viewer?.focusRailEquipment(asset.id);
        $('view-title').textContent='Rail unloading, open to view.';
        $('view-subtitle').textContent='Inverted-L supports · 12.42 m spacing along each track';
        for(const b of document.querySelectorAll('[data-view]'))b.classList.remove('active');
        renderDetails(asset);
      });buttons.append(equipment);
      const support=element('button','Support close-up');
      support.addEventListener('click',()=>{
        setMode('model');viewer?.focusRailSupport(asset.id);
        const dimensions=asset.railDetails.fallArresters;
        $('view-title').textContent='Inverted-L support detail.';
        $('view-subtitle').textContent=`${format(dimensions.heightM*1000)} mm height · ${format(dimensions.armLengthM*1000)} mm arm · ${format(dimensions.braceReachM*1000)} mm brace reach`;
        for(const b of document.querySelectorAll('[data-view]'))b.classList.remove('active');
      });buttons.append(support);
    }
    if(asset.kind==='pumpHouse'){
      const visible=pumpHouseRoofVisibility.get(asset.id)!==false;
      const roof=element('button',visible?'Hide roof':'Show roof');
      roof.addEventListener('click',()=>{pumpHouseRoofVisibility.set(asset.id,!visible);viewer?.setPumpHouseRoof(asset.id,!visible);renderDetails(asset);});buttons.append(roof);
      const equipment=element('button','Equipment close-up');
      equipment.addEventListener('click',()=>{
        setMode('model');pumpHouseRoofVisibility.set(asset.id,false);
        viewer?.setPumpHouseRoof(asset.id,false);viewer?.focusPumpEquipment(asset.id);
        $('view-title').textContent=asset.name;
        $('view-subtitle').textContent='Equipment close-up · illustrative pumps, pipework and valves';
        renderDetails(asset);
      });buttons.append(equipment);
    }
  }else{const guide=element('button','Take the guided tour →');guide.addEventListener('click',startTour);buttons.append(guide);}
  actions.append(buttons);
  if(asset)actions.append(element('span',asset.kind==='railShed'?'Supports: supplied detail · spacing: user request':asset.positionRevision?'Position: adjusted in viewer · footprint: schedule':asset.heightSource.startsWith('drawing')?'Dimensions: schedule · positions: trace':'Height: illustrative · positions: trace','confidence'));
  dock.append(actions);
}
function selectAsset(id,focus=false){
  const asset=data.assets.find(a=>a.id===id);if(!asset)return;
  selectedId=id;
  if(asset.underground&&!$('cutaway').checked){$('cutaway').checked=true;toast('Underground inspection display enabled. Burial depth is illustrative.');}
  if(asset.category==='future')$('future').checked=true;
  applyVisibility();viewer?.select(id);if(focus)focusFacility(asset);
  for(const b of document.querySelectorAll('.asset-item')){b.classList.toggle('selected',b.dataset.id===id);b.setAttribute('aria-pressed',String(b.dataset.id===id));}
  for(const [key,label] of labelElements)label.classList.toggle('selected',key===id);
  for(const marker of document.querySelectorAll('.plan-marker'))marker.classList.toggle('selected',marker.dataset.id===id);
  renderDetails(asset);
  history.replaceState(null,'',`#facility=${encodeURIComponent(id)}`);
}
function applyVisibility(){
  if(!viewer)return;
  for(const a of data.assets){viewer.assetGroups.get(a.id).visible=(!a.underground||$('cutaway').checked)&&(a.category!=='future'||$('future').checked)&&(!isolated||a.id===selectedId);}
  viewer.syncVesselCutaways();
  viewer.select(selectedId);
  for(const marker of document.querySelectorAll('.plan-marker')){const a=data.assets.find(a=>a.id===marker.dataset.id);marker.style.display=(!a.underground||$('cutaway').checked)&&(a.category!=='future'||$('future').checked)&&(!isolated||a.id===selectedId)?'':'none';}
}
function setMode(mode){
  $('viewer-grid').dataset.mode=mode;
  for(const button of document.querySelectorAll('[data-mode]')){button.classList.toggle('active',button.dataset.mode===mode);button.setAttribute('aria-pressed',String(button.dataset.mode===mode));}
  requestAnimationFrame(()=>viewer?.resize());
}
const viewNames={overview:['The complete picture.','Panchgram POL terminal · conceptual 3D reconstruction'],top:['Read the layout.','Top view · drawing axis, not true north'],storage:['At the heart of the site.','Seven product tanks · scheduled capacity 22,200 m³'],rail:['Where the journey begins.','Rail unloading · inverted-L supports at 12.42 m spacing'],gantry:['Ready for road dispatch.','Four active bays + four future bays · equipment is illustrative']};
function focusFacility(asset){
  if(asset.underground&&!$('cutaway').checked){$('cutaway').checked=true;applyVisibility();}
  if(asset.kind==='gantry'){setView('gantry');return;}
  if(asset.kind==='railShed'){setView('rail');return;}
  viewer?.focus(asset.id);
  if(asset.kind==='pumpHouse'){
    $('view-title').textContent=asset.name;
    $('view-subtitle').textContent='Reference-informed open shed · equipment and routing are illustrative';
    for(const b of document.querySelectorAll('[data-view]'))b.classList.remove('active');
  }
  if(asset.kind==='tank'){
    $('view-title').textContent=asset.name;
    $('view-subtitle').textContent=`${asset.sourceTag||asset.id} · scheduled shell dimensions · fittings illustrative`;
    for(const b of document.querySelectorAll('[data-view]'))b.classList.remove('active');
  }
  if(asset.kind==='underground'){
    $('view-title').textContent=asset.name;
    $('view-subtitle').textContent='Open pit inspection cutaway · burial depth and fittings illustrative';
    for(const b of document.querySelectorAll('[data-view]'))b.classList.remove('active');
  }
}
function setView(key){viewer?.setView(key);const [title,subtitle]=viewNames[key];$('view-title').textContent=title;$('view-subtitle').textContent=subtitle;for(const b of document.querySelectorAll('[data-view]'))b.classList.toggle('active',b.dataset.view===key);}
function reset(){stopTour();isolated=false;selectedId=null;measurement=false;measurePoints=[];gantryRoofVisible=true;viewer?.setGantryRoof(true);pumpHouseRoofVisibility.clear();viewer?.resetPumpHouseRoofs();viewer?.setMeasurement([]);$('measurement-banner').hidden=true;$('measure').classList.remove('active');$('measure').setAttribute('aria-pressed','false');$('orbit').checked=false;viewer?.setOrbit(false);$('search').value='';$('category').value='all';applyVisibility();viewer?.select(null);setView('overview');renderList();renderDetails();for(const label of labelElements.values())label.classList.remove('selected');for(const marker of document.querySelectorAll('.plan-marker'))marker.classList.remove('selected');history.replaceState(null,'',location.pathname+location.search);}
function setupLabels(){
  for(const a of data.assets){const b=element('button',a.sourceTag||a.name.replace(' · tank',''),'scene-label');b.title=a.name;b.setAttribute('aria-label',`Select ${a.name}`);b.addEventListener('click',()=>selectAsset(a.id,true));$('labels-layer').append(b);labelElements.set(a.id,b);}
  const projected=new THREE.Vector3();
  viewer.onFrame=(camera,renderer,controls)=>{
    const width=renderer.domElement.clientWidth,height=renderer.domElement.clientHeight;
    const occupied=[];
    const sorted=[...data.assets].sort((a,b)=>Number(b.id===selectedId)-Number(a.id===selectedId)||Number(b.kind==='tank')-Number(a.kind==='tank'));
    for(const asset of sorted){const label=labelElements.get(asset.id),group=viewer.assetGroups.get(asset.id);label.hidden=true;if(!$('labels').checked||!group.visible)continue;
      projected.copy(viewer.labelAnchors.get(asset.id)).project(camera);
      const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
      if(projected.z< -1||projected.z>1||x<25||x>width-50||y<110||y>height-50)continue;
      const length=Math.min(156,(label.textContent.length*5.2)+18),rect=[x-length/2,y-25,x+length/2,y+5];
      if(asset.id!==selectedId && occupied.some(r=>rect[0]<r[2]&&rect[2]>r[0]&&rect[1]<r[3]&&rect[3]>r[1]))continue;
      occupied.push(rect);label.style.left=`${x}px`;label.style.top=`${y}px`;label.hidden=false;
    }
    const direction=camera.position.clone().sub(controls.target);$('compass-arrow').setAttribute('transform',`rotate(${-THREE.MathUtils.radToDeg(Math.atan2(direction.x,direction.z))} 35 35)`);
  };
}
let planBox=[0,0,2000,1064],planDrag=null,planMoved=false;
function drawPlanBox(){$('plan-svg').setAttribute('viewBox',planBox.join(' '));}
function zoomPlan(factor){const w=Math.min(2400,Math.max(250,planBox[2]*factor)),h=w*1064/2000;planBox=[planBox[0]+(planBox[2]-w)/2,planBox[1]+(planBox[3]-h)/2,w,h];drawPlanBox();}
function setupPlan(){
  const svg=$('plan-svg'),ns='http://www.w3.org/2000/svg';
  for(const a of data.assets){const c=document.createElementNS(ns,'circle');c.setAttribute('cx',a.planPositionPx[0]);c.setAttribute('cy',a.planPositionPx[1]);c.setAttribute('r',a.kind==='tank'?'13':'9');c.setAttribute('fill',data.categories.find(cat=>cat.id===a.category).color);c.classList.add('plan-marker');c.dataset.id=a.id;c.setAttribute('tabindex','0');c.setAttribute('role','button');c.setAttribute('aria-label',`Select ${a.name} on plan`);const title=document.createElementNS(ns,'title');title.textContent=a.name;c.append(title);c.addEventListener('click',()=>{if(!planMoved)selectAsset(a.id);});c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectAsset(a.id);}});$('plan-markers').append(c);}
  svg.addEventListener('pointerdown',event=>{planDrag={x:event.clientX,y:event.clientY,box:[...planBox]};planMoved=false;if(!event.target.closest('.plan-marker'))svg.setPointerCapture(event.pointerId);});
  svg.addEventListener('pointermove',event=>{if(!planDrag)return;const dx=event.clientX-planDrag.x,dy=event.clientY-planDrag.y;planMoved=Math.hypot(dx,dy)>5;if(planMoved){const rect=svg.getBoundingClientRect();const ratio=Math.max(planDrag.box[2]/rect.width,planDrag.box[3]/rect.height);planBox=[planDrag.box[0]-dx*ratio,planDrag.box[1]-dy*ratio,...planDrag.box.slice(2)];drawPlanBox();}});
  svg.addEventListener('pointerup',event=>{planDrag=null;if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);});
  svg.addEventListener('pointercancel',()=>{planDrag=null;});
  svg.addEventListener('wheel',event=>{event.preventDefault();zoomPlan(event.deltaY>0?1.15:.87);},{passive:false});
  $('plan-in').addEventListener('click',()=>zoomPlan(.8));$('plan-out').addEventListener('click',()=>zoomPlan(1.25));$('plan-fit').addEventListener('click',()=>{planBox=[0,0,2000,1064];drawPlanBox();});
}
function stopTour(){tourIndex=-1;$('tour-card').hidden=true;}
function showTourStop(){
  const stop=data.tour[tourIndex];if(!stop){stopTour();toast('Tour complete. Select any facility to keep exploring.');return;}
  $('tour-card').hidden=false;$('tour-progress').textContent=`SITE WALKTHROUGH / ${String(tourIndex+1).padStart(2,'0')} OF ${String(data.tour.length).padStart(2,'0')}`;$('tour-title').textContent=stop.title;$('tour-copy').textContent=stop.copy;$('tour-next').textContent=tourIndex===data.tour.length-1?'Finish tour ✓':'Next stop →';
  if(stop.assetId)selectAsset(stop.assetId,!stop.view);if(stop.view)setView(stop.view);
}
function startTour(){if(!viewer){toast('3D is unavailable in this browser. You can still explore the drawing.');return;}setMode('model');isolated=false;applyVisibility();measurement=false;$('measurement-banner').hidden=true;$('measure').classList.remove('active');$('measure').setAttribute('aria-pressed','false');viewer.setMeasurement([]);$('orbit').checked=false;viewer.setOrbit(false);tourIndex=0;showTourStop();}
function setupNotes(){
  const content=$('notes-content');content.append(element('p','This model is for communication and visual review. It does not certify construction dimensions, safety distances or statutory compliance.','notice'));
  for(const note of data.notes)content.append(element('h3',note.heading),element('p',note.text));
  content.append(element('h3','Source tank schedule'));const img=element('img');img.src='assets/tank-schedule.webp';img.alt='Source storage tank, fire-water and underground vessel schedules';content.append(img);
}
function download(blob,name){const url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function exportPng(){
  if(!viewer){toast('A 3D scene is required for image export.');return;}
  try{const source=viewer.screenshot(),canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height+94;const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);ctx.fillStyle='#1b352c';ctx.fillRect(0,source.height,canvas.width,94);ctx.fillStyle='#eff4e7';ctx.font='18px Segoe UI, Arial';ctx.fillText('PANCHGRAM / POL TERMINAL · SOURCE REV D2',24,source.height+31);ctx.font='12px Segoe UI, Arial';ctx.fillStyle='#c5d2c0';ctx.fillText('Concept visualisation · manually traced positions · not for construction or safety decisions',24,source.height+57);ctx.fillText(selectedId?`Selected: ${selectedId} · dimensions: see facility register`:'Local units: metres · heights of most structures are illustrative',24,source.height+77);canvas.toBlob(blob=>{if(blob){download(blob,'panchgram-scene.png');toast('Scene image exported with an accuracy caption.');}else toast('Image export failed. Try a smaller browser window.');},'image/png');}catch{toast('Image export failed. Refresh the page and try again.');}
}
async function exportGlb(){
  if(!viewer){toast('3D is unavailable. Use the facility register instead.');return;}
  const button=$('export-glb');button.disabled=true;toast('Preparing the visible 3D geometry…');
  try{const {GLTFExporter}=await import('../vendor/GLTFExporter.js');const output=await new GLTFExporter().parseAsync(viewer.model,{binary:true,onlyVisible:true});const undergroundVisible=data.assets.some(a=>a.underground&&viewer.assetGroups.get(a.id).visible);const name=undergroundVisible?(isolated?`panchgram-${selectedId}-inspection.glb`:'panchgram-underground-inspection.glb'):'panchgram-concept-model.glb';download(new Blob([output],{type:'model/gltf-binary'}),name);toast('3D model exported. Accuracy notes are included in its metadata.');}catch(error){console.error('GLB export failed',error);toast('3D export failed. Try turning off Drawing and Underground, then retry.');}finally{button.disabled=false;}
}
function setupEvents(){
  window.addEventListener('hashchange',()=>{const id=new URLSearchParams(location.hash.slice(1)).get('facility');if(data.assets.some(a=>a.id===id))selectAsset(id,true);});
  $('search').addEventListener('input',renderList);$('category').addEventListener('change',renderList);
  for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>setMode(button.dataset.mode));
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{stopTour();setView(button.dataset.view);});
  $('reset').addEventListener('click',reset);
  $('future').addEventListener('change',applyVisibility);$('cutaway').addEventListener('change',applyVisibility);
  $('underlay').addEventListener('change',()=>viewer?.setUnderlay($('underlay').checked));
  $('night').addEventListener('change',()=>{document.body.classList.toggle('night',$('night').checked);viewer?.night($('night').checked);});
  $('orbit').addEventListener('change',()=>viewer?.setOrbit($('orbit').checked));
  // Fullscreen only shows children of the viewport. Move the same details panel
  // into it, keeping selection and action buttons in sync without duplicate data.
  const detailsHome=document.createComment('Normal-view facility details');
  $('details').before(detailsHome);
  $('fullscreen-details-toggle').addEventListener('click',()=>{
    fullscreenDetailsOpen=!fullscreenDetailsOpen;syncFullscreenDetails();
  });
  document.addEventListener('fullscreenchange',()=>{
    const active=document.fullscreenElement===$('viewport');
    fullscreenDetailsOpen=false;
    if(active)$('viewport').append($('details'));else detailsHome.after($('details'));
    const label=active?'Exit fullscreen viewer':'Fullscreen viewer';
    $('fullscreen').setAttribute('aria-label',label);$('fullscreen').title=label;
    renderDetails(data.assets.find(asset=>asset.id===selectedId));
    requestAnimationFrame(()=>viewer?.resize());
  });
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('viewport').requestFullscreen();}catch{toast('Fullscreen is unavailable. You can maximise your browser window.');}});
  $('measure').addEventListener('click',()=>{if(!viewer)return;stopTour();measurement=!measurement;measurePoints=[];viewer.setMeasurement([]);$('measurement-banner').hidden=!measurement;$('measurement-value').textContent='Select two points on the ground';$('measure').classList.toggle('active',measurement);$('measure').setAttribute('aria-pressed',String(measurement));});
  $('clear-measure').addEventListener('click',()=>{measurement=false;measurePoints=[];viewer?.setMeasurement([]);$('measurement-banner').hidden=true;$('measure').classList.remove('active');$('measure').setAttribute('aria-pressed','false');});
  if(viewer){let down;viewer.renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});viewer.renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5||e.button!==0)return;down=null;if(measurement){const point=viewer.pick(e,true);if(!point)return;if(measurePoints.length===2)measurePoints=[];measurePoints.push(point);viewer.setMeasurement(measurePoints);$('measurement-value').textContent=measurePoints.length===1?'Select the second ground point':`Approx. ${format(horizontalDistanceM(...measurePoints))} m`;return;}const id=viewer.pick(e);if(id)selectAsset(id);});}
  $('tour-start').addEventListener('click',startTour);$('tour-next').addEventListener('click',()=>{tourIndex++;showTourStop();});$('tour-end').addEventListener('click',stopTour);
  for(const id of ['open-notes','source-footer'])$(id).addEventListener('click',()=>$('notes-dialog').showModal());
  $('export-open').addEventListener('click',()=>$('export-dialog').showModal());$('plan-full').addEventListener('click',()=>$('sheet-dialog').showModal());
  for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>button.closest('dialog').close());
  $('export-png').addEventListener('click',exportPng);$('export-glb').addEventListener('click',exportGlb);$('export-csv').addEventListener('click',()=>{download(new Blob([registerCsv(data.assets)],{type:'text/csv;charset=utf-8'}),'panchgram-facility-register.csv');toast('Facility register exported. Unknown capacities remain blank.');});
  $('list-panel-toggle').addEventListener('click',()=>setSidePanel('list',!listPanelOpen));
  $('details-panel-toggle').addEventListener('click',()=>setSidePanel('details',!detailsPanelOpen));
  $('mobile-close').addEventListener('click',()=>setSidePanel('list',false));
  $('panel-scrim').addEventListener('click',()=>{setSidePanel('list',false);setSidePanel('details',false);});
  narrowPanels.addEventListener('change',syncSidePanels);
  document.addEventListener('keydown',event=>{
    if(dialogs.some(id=>$(id).open))return;
    if(event.key==='Escape'){
      if(narrowPanels.matches){setSidePanel('list',false);setSidePanel('details',false);}
      stopTour();return;
    }
    if(event.target.matches('input,textarea,select'))return;
    if(event.key==='/'){event.preventDefault();setSidePanel('list',true);$('search').focus();}
    if(event.key.toLowerCase()==='r')reset();
  });
  $('canvas-host').addEventListener('rendering-lost',()=>{toast('3D graphics connection lost. Reload to restore it; the drawing remains available.');setMode('plan');});
}
async function init(){
  try{
    syncSidePanels();
    const response=await fetch('data/site.json');if(!response.ok)throw new Error('Drawing register could not be loaded.');data=validateSite(await response.json());
    for(const category of data.categories){const option=element('option',category.name);option.value=category.id;$('category').append(option);}
    $('product-capacity').textContent=format(storageTotals(data.assets).productM3);
    try{viewer=createScene($('canvas-host'),data);setupLabels();$('loading').hidden=true;}
    catch(error){console.error('3D setup failed',error);$('loading').textContent='3D graphics are unavailable. Use Plot plan to explore the drawing, or enable hardware acceleration in your browser.';setMode('plan');toast('The drawing viewer is available. 3D needs a browser with WebGL graphics.');}
    setupPlan();setupNotes();setupEvents();applyVisibility();renderList();renderDetails();
    const id=new URLSearchParams(location.hash.slice(1)).get('facility');if(id&&data.assets.some(a=>a.id===id))selectAsset(id,true);
  }catch(error){console.error(error);$('loading').replaceChildren(element('p','The site register could not be loaded. Start the local server or use the GitHub Pages link. Opening index.html directly will not work.'));toast('Site data could not be loaded. See README troubleshooting.');}
}
init();

# Verification record

Verified on 30 September 2026 using the Codex in-app Chromium browser, Node.js and direct inspection of exported files.

| Check | Result |
|---|---|
| JavaScript syntax | Passed for app, scene and local server modules |
| Data contract tests | All 6 tests passed |
| Above-ground product capacity | 7 tanks, 22,200 m³ |
| Fire-water capacity | 2 tanks, 7,300 m³ |
| Underground capacity separation | 5 vessels at 50 m³ each; excluded from above-ground totals |
| Browser scene loading | Passed; 50 selectable facility records loaded |
| Console errors | No application errors during the checked interactions |
| Tank selection | HSD-02: 5,000 m³, 24 m diameter, 12.5 m shell height |
| Drawing link | Clicking MS-01's plan marker changed the details to the correct tank |
| Plan keyboard selection | Enter selected the ethanol tank from its marker |
| Search | T-02B returned HSD-02; underground search returned five records |
| Underground display | Selecting a vessel enabled inspection; details showed 3.3 m diameter and 7.5 m length |
| Guided tour | Completed all six stops, including the final stop and finish control |
| Isolation | Selected tank isolated; Show all restored the model |
| Drawing and lighting switches | Checked; no application errors |
| Ground measurement | Two ground clicks produced an approximate 541.9 m distance; clear removed it |
| PNG export | Downloaded a valid PNG with the caption area; inspected image header and dimensions |
| CSV export | Downloaded and parsed 50 facility records |
| GLB export | Downloaded; checked glTF 2 binary header, declared file length and source metadata |
| Initial standalone GLB, 30 September | 1,838,332 bytes; source revision D2, source date 2026-08-24; superseded by the gantry update below |
| Repository-subfolder deployment | `/panchgram-terminal-3d/` loaded model, data, modules and drawing assets correctly |
| Phone viewport | Checked at 390 × 844; menu, search and selection worked; no horizontal document overflow |
| Responsive camera | Preset views adjust distance for narrow viewports |

## Practical limits

- The browser checks were performed in Chromium. Actual Safari/iOS and low-powered physical devices have not been tested.
- The fallback drawing mode is implemented for unavailable WebGL, but a forced graphics-failure scenario was not tested.
- Fullscreen depends on browser permissions and environment; it was not independently confirmed here.
- The drawing's factual content was manually reviewed. This is not independent engineering verification.
- Measurements are based on approximate trace calibration. The browser test proves the interaction works, not that the distance matches survey data.
- The GLB container and metadata were checked. Importing the file into Blender, PowerPoint or a CAD application was not independently tested.
- GitHub publication has not been performed. The package and instructions are ready; actual publication depends on the destination repository and Pages setup.
- The supplied PDF and DWG remain unchanged.

## Gantry refinement, 1 October 2026

- Used the supplied gantry PNG as a visual reference only. All model geometry, signs and textures were independently generated; the reference image is excluded from the GitHub ZIP and listed in `.gitignore`.
- Preserved the scheduled 12 × 52 m footprint and four active plus four future bays. Tank capacities and site coordinates remain unchanged.
- Added original steelwork, pitched canopy, elevated operator walkway, two stair flights, handrails, loading arms, hoses, manifold details, four side-by-side tanker models and future-bay markings.
- Added a loading-gantry camera preset; facility selection and the dispatch tour stop use it. Hide roof opens a higher inspection view; Show roof restores the canopy.
- All seven data tests passed, including malformed gantry detail checks. JavaScript syntax checks passed.
- Browser rendered the gantry with no application errors. The roof controls worked in desktop and phone layouts; camera controls remained within the phone viewer.
- Re-exported the complete visible model: **2,310,708 bytes**. Checked its GLB container, four tanker nodes, active/future metadata and finite transforms.
- Gantry components, height, product routing and equipment arrangements remain illustrative. No loading-system design or structural engineering verification was performed.

## Pump-house refinement, 1 October 2026

- Reviewed Pump House.jpg, Pump House1.jpg and Pump House2.jpg. Geometry and signs are independently generated. Photos are not used as textures, remain locally unchanged, and Photos/ is excluded from Git tracking and the ZIP.
- Preserved scheduled footprints: FWPH-01 24 × 8 m; TWPH-01 40 × 6 m; TLPH-01 6 × 45 m. Preserved trace positions, source revision, tank capacities and gantry geometry.
- Replaced enclosed pump-house boxes and rooftop placeholders with floor-level pumps in open steel sheds, lattice columns, roof trusses, green corrugated upper cladding, pitched roofs, pump bases, curved pipework, flanges, gauges, valves, pipe crossovers and cabinets.
- Checked all three focused views, including the long truck-loading orientation. Roof visibility is independent; switching facilities remembers it; Reset restores roofs. Equipment close-up hides the selected roof and frames local pumps.
- Verified desktop and 390 × 844 phone controls. Phone page width was 375 px within a 390 px viewport; equipment close-up and Show roof control worked. No application errors were recorded.
- Eight automated data tests passed. Syntax checks passed for pump-house.js, scene.js, app.js and data.js.
- Re-exported the default complete visible model: **4,017,800 bytes**. verify-model.py checked three scheduled pump-house footprints, 17 illustrative pump assemblies, all three roofs, four retained gantry tankers, all node transforms and 475,136 finite geometry values. This supersedes the earlier standalone exports.
- GLB exporter emitted four material-advice warnings for existing line objects; no export errors occurred. Import into an external CAD or presentation application remains untested.
- Pump counts, duty arrangements, motors/drivers, heights, pipe diameters/routing and structural members are illustrative, not an engineered pump-house design.

## Tank appearance refinement, 1 October 2026

- Reviewed TankStorage-1920x840.jpg as a visual reference only. The original is unchanged and Photos/ remains excluded from the GitHub ZIP. All geometry, paint variation and signs are independently generated.
- Updated nine above-ground tanks with smoother pale shells, course/seam details, restrained service bands, concrete ring bases, closed fixed outer roofs, roof hatches/vents, access railings, curved external stairs, nozzles/manways, isolation valves, identity panels and warm emissive light accents.
- Preserved every scheduled diameter, shell height, capacity and roof-type tag. Internal floating roof tanks retain closed outer roofs; no exposed floating deck or fill level was inferred. Foundation heights and roof rises are explicitly illustrative.
- Added closer individual tank framing and a tank-farm camera fitted around the seven product tanks. Tank selection uses a ground ring rather than a box over the stairs and roof.
- Inspected daylight, dusk and closed motor-spirit roof views. Tested the focus control at 390 × 844 phone size; page width 375 px remained within the viewport and the complete tank was visible. Application console had no errors.
- All nine automated data tests passed. Syntax checks passed for tank.js, scene.js, app.js and data.js.
- Exported the complete default model: **9,786,840 bytes**. verify-model.py verified all nine actual shell diameters and heights from exported vertex bounds, roof tags and capacities, nine closed roofs, three pump houses, 17 illustrative pump assemblies and four gantry tankers. It checked 1,393,616 finite geometry values and all transforms. This export supersedes the earlier ones.
- Stairs, railings, fittings, roof slopes, paint, foundation heights and light positions are illustrative. Light accents are presentation effects, not an illumination calculation. No external CAD import, structural/access assessment or device performance benchmark was performed.

## Underground-vessel refinement, 1 October 2026

- Reviewed UG Vessel.jpg as a visual reference only. The original remains unchanged and the Photos/ folder remains excluded from the ZIP. Geometry, signs and colours are independently created.
- Preserved the five vessel schedules: 3.3 m diameter, 7.5 m total end-to-end length and 50 m³ per vessel. Above-ground product totals remain 22,200 m³; underground capacity remains separately scheduled at 250 m³.
- Replaced elevated placeholders with continuous red-coated horizontal shells below grade, illustrative rounded heads, seams, saddle supports, raised open manways, bolted flanges, small nozzles, concrete pits, access ladders and identity signs.
- Ground cutaways follow visible vessels. Checked all five visible, a single isolated pit, closed terrain after disabling Underground, and automatic reopening with Focus view. Vessel dimensions are shown in the phone details panel.
- Desktop and 390 × 844 phone views rendered correctly. Page width 375 px stayed inside the phone viewport; the vessel and full inspection pit were visible. No application console errors were recorded.
- Ten automated data tests passed. Syntax checks passed for underground-vessel.js, scene.js, app.js and data.js.
- Updated default export: **9,782,976 bytes**, with zero underground vessels and intact grade. New underground inspection export: **12,361,816 bytes**, with five below-grade vessels and matching open terrain cutaways. Both files passed verify-model.py.
- Inspection export verification checked actual shell diameters and total lengths, scheduled capacities, below-grade crown positions, matching cutaway IDs, all nine above-ground shells, three pump houses, 17 illustrative pumps and four gantry tankers. It checked 1,814,512 finite geometry values and all node transforms.
- Soil cover, pit clearances, floor/wall dimensions, head profiles, coating, supports, manway counts and fittings remain illustrative. No structural, lifting, excavation, installation or external CAD-import verification was performed.

## Rail-gantry refinement, 1 October 2026

- Inspected Rail 5.png, Rail photo.png, Rail_2.png, Rail 3.png and Rail 4.png as visual references only. Originals are unchanged. No photographs, brand marks or wagon IDs are embedded; Photos/ is excluded from packaging.
- Replaced placeholder rail wagons and the flat canopy with original pitched steelwork, knee braces/trusses, a corrugated removable canopy, raised concrete operator platform, safety edge/railing, end access steps, twelve unbranded rounded wagons, twenty-four bogies, wheels/flanges/axles/spring details, couplers, ladders, hatch platforms/railings, twelve illustrative unloading stations, manifolds, meters, valves, hoses and parked service arms.
- Preserved RAIL-01 position [641,392], 10-degree rotation, 350 x 10 m scheduled footprint, 8 m illustrative height, held status and the separate 380 x 15 m note. Hold signs remain on the fixed frame. The covered-track geometry is aligned locally to the shed; original rail traces remain in the data register. Gauge and local alignment remain illustrative.
- Tested Unloading close-up, Hide roof / Show roof, Isolate facility / Show all, complete-shed focus and reset restoring the canopy. Checked ladder/platform-side framing and the roofed view. Removed the selection box from rail inspection so it does not cover equipment.
- Tested 390 x 844 phone size: document width 375 px stayed within the 390 px viewport; the central wagon, access ladder, platform and facility notes were visible. Restored the default browser viewport. No application console errors were recorded.
- Eleven data tests passed, including source-footprint/hold preservation and rejection of overlapping or oversized wagon layouts. Syntax checks passed for rail-gantry.js, scene.js, app.js and data.js.
- Final default export: **13,920,060 bytes**, with intact grade and zero underground vessels. Final full-site underground inspection export: **16,500,012 bytes**, with five vessels and matching cutaways. Both passed verify-model.py, including the actual 350 x 10 m exported slab extent, rail metadata, 12 wagons, 24 bogies, 12 unloading stations and the default rail canopy.
- Both exports retained the nine scheduled above-ground shell dimensions, roof types and capacities, three pump-house footprints, 17 illustrative pumps and four road-loading tankers. Validation checked 1,945,632 finite geometry values in the default export and 2,366,528 in the inspection export, plus all node transforms.
- Wagon dimensions/count/pitch, vehicle details, platform, service-arm/hose connections, pipe routing, gauge, clearance and structural members are presentation assumptions. No wagon-standard, unloading-process, access-safety, structural or external CAD-import certification was performed.

## Inverted-L fall-arrester replacement, 1 October 2026 (current rail design)

- Inspected the supplied typical fall-arrester plan/section. The owner requested replacing the shed with inverted-L supports at 12420 mm spacing. Spacing is interpreted centre-to-centre along the tracks. Two rows of 27 supports interpret the detail's 54 places; the row arrangement remains an explicit assumption.
- Removed the former rail roof, paired shed columns, pitched trusses, longitudinal frame members, hold signs on that frame and rail Hide/Show roof controls. Retained wagons, platform, manifolds, valves, hoses and the original held shed source record. The current RAIL-01 label is Rail unloading · fall-arrester supports.
- Added 54 supports with 6850 mm height above the column base, 3260 mm total cantilever extent, 1500 mm brace reach, 45-degree brace centrelines, 500 mm square base plates and ISMC 250 BOX / ISMC 200 BOX / ISMC 150 labels. Box widths, base elevations, pedestals and bolts are illustrative.
- Added exact-millimetre metrics, Support close-up and updated Unloading close-up. Tested isolation, return to the complete site, the full-corridor view, and both close-ups. No application console errors were recorded.
- Checked 390 x 844 phone size: document width 375 px stayed within the viewport, support shape and exact dimensions were visible, and shortened facility notes remained readable above the footer. Restored the default viewport. Saved refreshed desktop, support-detail and phone previews.
- All 12 automated tests passed. New checks verify exact pitch along both angled rows, 54 total supports, reference dimensions, column-to-track placement, length bounds, a single-row calculation and rejection of invalid layouts. Syntax checks passed for rail-layout.js, fall-arrester.js, rail-gantry.js, scene.js, app.js and data.js.
- Updated default GLB: **13,885,312 bytes**. Updated full-site underground inspection GLB: **16,465,264 bytes**. Both passed verify-model.py. Actual exported column transforms confirm 12420 mm spacing; mesh dimensions/transforms confirm support height, cantilever length, 45-degree brace, 1500 mm reach and 500 mm base plates. Neither export contains the removed rail canopy or trusses.
- Both files retain nine scheduled above-ground tank shells/roofs/capacities, three pump houses, 17 illustrative pumps, four road-loading tankers, twelve rail wagons, twenty-four bogies and twelve unloading stations. Default grade is intact with no underground vessels; inspection export includes all five and matching cutaways. Checked 1,945,224 and 2,366,120 finite geometry values respectively, plus all transforms.
- The new export and previews supersede the earlier roofed rail model. The earlier generated canopy preview was archived inside the excluded Photos/ folder. The local reference detail remains outside the GitHub-ready package.
- No safety cable, trolley/lanyard or rated connection is inferred from the support drawing. Row count/setting-out, member widths, fixings, foundations and local base elevations remain reference/presentation assumptions; no structural or fall-protection-system verification or external CAD import was performed.

## TXR room position correction, 1 October 2026

- Reviewed the supplied screenshot showing TXR-01 over the railway. Moved its register position from [1785,218] to [1810,285], approximately 25.24 m towards the site interior. Its scheduled 10 x 5 m footprint and 3.5 m illustrative height are retained. PositionRevision records the original trace and reason; the details panel explicitly identifies the adjusted viewer placement.
- Checked the building footprint against both rail traces and the service-road routes, and visually confirmed open ground between the building, road, tracks and truck-parking area. This is a conceptual placement check, not an approved clearance or surveyed setting-out coordinate.
- Checked the 3D focus and plot comparison. The comparison marker is at cx=1810, cy=285. Existing drawing imagery is retained as the source reference. Saved assets/txr-room-preview.png.
- The shared project now has 25 wagons on each of two tracks. Preserved that current rail layout. Replaced a stale export with fresh models loaded from the current source. All 13 current data checks pass; app.js and scene.js syntax checks passed.
- The larger scene was repeatedly redrawing static geometry/shadows and slowed browser controls. Updated scene.js to request drawing when controls, animation, lighting, viewport or visible facilities change, and to reuse the static shadow map. Facility/layer/roof changes explicitly invalidate shadows; label updates continue during idle frames. Verified roof Hide/Show, day/Dusk, reset, focus and underground layer/export controls after the change. No application console errors were recorded. No frame-rate benchmark is claimed.
- Current default GLB: **10,793,928 bytes**, with zero underground vessels and intact grade. Current full-site underground inspection GLB: **13,373,416 bytes**, with five vessels and matching cutaways. Both passed the updated verify-model.py, including 50 wagons, 100 bogies, twelve unloading stations, 54 fall-arrester supports, scheduled tank dimensions/roofs/capacities, three pump houses, 17 pumps and four loading tankers.
- Independently checked TXR-01 in both binary models: exactly one room node, current [1810,285] metadata, original [1785,218] revision record, unchanged 10 x 5 m dimensions, and actual exported translation matching the adjusted register position. Checked 1,491,056 finite geometry values in the default export and 1,911,952 in the inspection export, plus all transforms.
- Placement remains an owner-requested viewer correction. Approved coordinates, access planning and civil clearances require the authoritative layout.

## Two-track wagon fleet, 1 October 2026

- Corrected the prior twelve-wagon single-track model to **25 wagons on each track, 50 total**, as requested. Retained 19 m illustrative shell lengths; changed wagon pitch to 22 m with a 2.75 m overall coupler allowance. Each rake uses 549.75 m of the existing longer corridor, with at least 10 m end margin. No rail trace is extended and the original 350 m unloading area remains unchanged.
- Kept twelve unloading stations at their existing 25 m station spacing. The support arrangement and unrelated facilities are unchanged by this update. The full rail view frames both complete rows.
- Added rail-wagons.js for row placement and wagon-geometry.js for combining fixed parts by material. Clones share the detailed prototype's geometry/materials while retaining 100 bogie groups and individual track/wagon identifiers. Browser drawing work is reduced; no device-performance benchmark was performed.
- All **13 tests passed**, including actual row counts, corridor fit, 22 m pitch, coupler clearance, unchanged shell length, retained station count and invalid-setting rejection. Syntax checks passed for the wagon modules, rail builder, scene and data validation.
- Checked both complete rows and the two-track close-up in a separate temporary preview. No application console errors were recorded. Browser automation had intermittent timeouts during export; the completed downloads were inspected and verified. The temporary preview was closed without modifying the main preview's controls.
- Refreshed default GLB: **10,793,928 bytes**. Refreshed underground inspection GLB: **13,373,416 bytes**. Both passed verify-model.py: 25 wagon groups per track, 50 total, 100 bogies, individual track/sequence tags, 19 m shell metadata, 22 m spacing metadata and non-overlapping actual exported positions. Twelve unloading stations and all 54 support assemblies remain.
- Default export contains no underground vessels and intact grade; inspection export contains five and matching cutaways. Both retain nine scheduled above-ground shells/roofs/capacities, three pump houses, 17 illustrative pumps and four road tankers. Checked 1,491,056 and 1,911,952 finite geometry values respectively, plus all transforms.
- The fifty-wagon preview and these exports supersede prior wagon-count exports. Vehicle dimensions, couplers, station-to-vehicle connections and stopping positions remain illustrative; no operating-capacity or vehicle-standard certification is implied.

## Fall-arrester outer placement correction, 1 October 2026

- Moved both support rows from the space between tracks to the outer sides of the pair. All 54 columns and 780 mm schematic pedestals stand beyond both rendered 4 m ballast strips. Cantilever arms point inward over their respective wagon rows. Retained 27 supports per row, 12420 mm pitch, 6850 mm height, 3260 mm arm, 1500 mm brace reach, 45-degree brace and 500 mm square plate.
- Added a placement regression check: it failed on the former inward layout and passes on the corrected layout. All **14 tests pass**. Syntax checks passed for the changed layout and scene modules. The portable-model checker independently uses actual central wagon transforms to verify column-side placement and actual support matrices to verify inward arm direction; the previous default GLB failed this new check.
- Checked Unloading close-up, Support close-up, isolation / Show all and Reset. Support close-up now approaches from outside the first track. Checked a 390 x 844 phone viewport: document width stayed within the viewport (375 px), dimensions and outer pedestal remained visible, and shortened facility notes no longer overlapped the footer. Saved refreshed rail, support-detail and phone previews. No application console errors were recorded. One browser click timed out immediately after reload; after inspecting the unchanged state, a subsequent click succeeded.
- Refreshed default GLB: **10,795,100 bytes**. Refreshed underground inspection GLB: **13,374,588 bytes**. Both passed verify-model.py, including actual outside column positions, inward arm rotations, exact pitch and member dimensions. The former shed roof and trusses remain absent.
- Both retain 50 wagons / 100 bogies, twelve unloading stations, nine scheduled above-ground shells/roofs/capacities, three pump houses, 17 illustrative pumps and four road tankers. Default export has intact grade and no underground vessels; inspection export includes all five and matching cutaways. Checked 1,491,056 and 1,911,952 finite geometry values respectively, plus all transforms. TXR-01 retains the earlier off-track position correction.
- The corrected outer placement supersedes earlier rail-support previews and exports. Side selection follows the owner instruction; exact coordinates, pedestals, fixings and base elevations remain illustrative.

## Vertical facility information panel, 1 October 2026

- Moved the normal-view facility summary from the bottom to a vertical right-side panel. At 1280 x 720, the panel is 300 px wide at x=980; the adjacent 3D viewer is 686 x 481 px. In Compare, the model and plot each occupy 343 x 481 px and the information panel stays on the right. Document width and scroll width both remain 1280 px.
- Checked Diesel · tank 3: 5000 m³ capacity, 24 m diameter and 12.5 m shell height remain visible with their labels. Checked Focus view, Isolate facility / Show all and comparison. Long facility content scrolls within the right panel. The existing fullscreen card styles and panel-reparenting logic are preserved.
- Checked 390 x 844 phone viewport: the information panel stacks below a 464 px-high model; all three tank measurements remain available. Document and scroll widths both remain 375 px, with no horizontal overflow. The footer follows the full content. Saved desktop and phone panel previews.
- All 14 existing automated checks passed; app.js syntax check passed. This is a page layout update, so the previously verified portable 3D geometry files do not require regeneration. Upload-package validation checks the refreshed site files and excludes local reference photos as before.

## Collapsible side panels, 1 October 2026

- Added independent Facilities and Details controls with expanded-state indicators, descriptive button labels and close controls. A fresh visit starts with both panels collapsed. At 1280 px width, actual model widths are 1280 px with both closed, 986 px with only the list open, 980 px with only Details open, and 686 px with both open. No horizontal page overflow occurred. Compare uses two 640 px panes with both side panels collapsed.
- Verified that both open choices survive a page reload. Collapsing via the panel's × updates the toolbar control and restores model width. Changed selection to RAIL-01 while Details was closed; it stayed closed, and opening it showed the current rail measurements and actions. The source register and geometry modules are not changed by this panel feature.
- Checked 390 x 844 phone view: model/document widths remain 390 px with panels closed and with a drawer open. A single side drawer overlays the model. Choosing Diesel · tank 3 in the list closed that drawer and left Details closed, returning focus to the list toggle. Verified ×, Escape and clicking the exposed dimmed background. Verified the / shortcut opens the list and focuses search on desktop.
- Fullscreen starts with its card collapsed; verified expanding it with Facility details, confirmed the actual fullscreen viewport and visible card, and collapsed it with the new × control. The normal panel states remain separate from the fullscreen card state. Desktop preferences and mobile drawers supersede the earlier permanently visible/stacked layout.
- All 14 existing automated checks and app.js syntax check passed. Saved closed-panel and phone-drawer previews. Browser storage reads/writes handle unavailable storage without preventing the controls from working; storage-blocked and malformed-preference cases were inspected in code rather than simulated in the browser.

## Shortened wagons within the 350 m allocation, 1 October 2026

- Used the scheduled 350 m length, retaining the separate 380 m hold note. Both 25-wagon rows now occupy 330 m with 10 m end margins: 10.45 m shells, 13.20 m centre pitch and 2.75 m overall coupler allowance. Centred both rows on the unloading facility, rather than the midpoint of the longer traced corridor. Moved wheel assemblies and saddles inward with the shorter body.
- All 14 automated checks passed, including source-area centring, exact margins, row counts and rejection of the former 19 m / 22 m oversized arrangement. Syntax checks passed for rail-wagons.js, rail-gantry.js and data.js.
- Checked the rail focus and unloading close-up in a separate temporary browser preview; no application console errors were recorded. The main preview's controls were not changed. Saved assets/rail-shortened-wagons-detail.png.
- Refreshed default GLB: 10,795,468 bytes. Refreshed underground inspection GLB: 13,374,956 bytes. Both passed verify-model.py. Checks traverse actual wagon meshes and transforms: each complete local envelope is 13.20 m, and every wagon mesh stays within the allocated longitudinal bounds. Actual centre spacing and end margins match the register.
- Both exports retain fifty wagons / 100 wheel assemblies, twelve unloading stations, 54 outer supports and the source tank/pump/gantry quantities. Default grade remains intact with no underground vessels; inspection includes all five and their cutaways. These shorter-wagon files supersede earlier exports; vehicle sizes and operational positioning remain illustrative.

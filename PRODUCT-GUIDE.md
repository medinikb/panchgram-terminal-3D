# Product guide for the owner

## 1. Product goal

A flat industrial plot plan is difficult for non-specialists to picture. Terminal Atlas lets project owners, operations teams and presentation audiences see the arrangement of rail receipt, tanks, dispatch and supporting buildings in one interactive view.

Business outcome: fewer explanations needed during reviews, clearer location-based conversations and a shareable presentation asset. It is not yet a tool for engineering decisions or quantity estimation.

## 2. MVP

The working first version is a static website: all information is read from files and drawn in the visitor's browser. A static site is simpler and cheaper to maintain than an application with accounts, a database and live equipment connections.

The MVP includes the interactive model, facility register, original drawing comparison, camera views, guided tour, display layers, approximate measurement and exports. It intentionally uses the supplied drawing as the evidence boundary.

## 3. User roles

| Role | Activity | Current access |
|---|---|---|
| Visitor / reviewer | Explore, search, inspect, compare and export | Anyone who can open the site |
| Product owner | Decide audience, review assumptions, manage publication | Edits project files / GitHub repository |
| Engineering reviewer | Verify source facts and request corrections | Reviews register and source drawing |

These are workflow roles, not a login or permission system. GitHub repository permissions govern editing. A publicly hosted site does not restrict viewing.

## 4. Key features and value

| Feature | Business benefit |
|---|---|
| Linked 3D and drawing selection | Makes a visual claim easy to trace to its source location |
| Facility search and categories | Helps teams find the relevant part of a large site quickly |
| Scheduled capacity and dimensions | Gives reviewers useful facts alongside the model |
| Source-confidence badges and notes | Reduces the chance that an illustrative height becomes a design assumption |
| Guided tour | Gives a consistent explanation of the terminal workflow |
| PNG, GLB and CSV exports | Supports presentations, external visual tools and register review |
| Local bundled dependencies | No runtime CDN, API key or recurring AI-service dependency |
| Underground inspection cutaways | Makes buried vessels understandable during reviews while separating scheduled sizes from illustrative civil details |
| Detailed tank appearance | Makes storage assets easier to recognise and explain while preserving scheduled shell dimensions and capacities |
| Detailed pump-house inspection | Explains visible pumps, valves and access structures during reviews; equipment close-ups make small features readable |
| Phone layout | Lets viewers explore a shared link during a meeting |

## 5. User journey

Open the viewer → understand the overview → pick or search for a facility → inspect its purpose and dimensions → compare its drawing position → isolate or focus if needed → export the result → read limitations before using it elsewhere.

The guided journey is rail receipt → product storage → road dispatch → operational support → future development.

## 6. Screens

One main page provides three working modes: **3D model**, **Compare**, and **Plot plan**. The facility list is on the left on larger screens and in a menu on smaller screens. Details appear below the viewer. Model notes, exports and the full drawing open in dialogs, which are panels placed above the main page.

## 7. Data model

There is no database in the MVP. `data/site.json` is the source register.

| Section | What it contains |
|---|---|
| `project` | Name, location, source document ID, revision, date and purpose |
| `coordinateSystem` | Image crop size, local origin and approximate metres-per-pixel calibration |
| `categories` | Names and display colours for storage, logistics, utilities, support and future areas |
| `assets` | Each selectable facility's ID, name, dimensions, source facts and description |
| `boundaryPx`, `roadsPx`, `railLinesPx` | Manually traced image points interpreted as local model coordinates |
| `bunds`, `pipeRoutesPx`, `greenBeltPx` | Tank containment footprints and illustrative site context |
| `tour` | Ordered stops and explanatory text |
| `notes` | Accuracy limits, discrepancies, holds and publication considerations |

Important facility fields: `widthM`, `depthM`, `heightM`, `diameterM`, `lengthM`, `capacityM3`, `sourceNumber`, `sourceTag`, `positionSource`, `footprintSource` and `heightSource`.

`tankDetails` records illustrative roof rise, foundation height and reference basis. Shell diameter, height, capacity and roof type remain separate source facts.

`pumpHouseDetails` records service, illustrative pump count and reference basis separately from scheduled footprints. These values control visual detail, not engineering procurement. `gantryDetails` records active and future bays.

Unknown capacity is omitted, not stored as zero. Many model IDs were created for navigation; source tags are separate. Above-ground product totals exclude fire-water and underground vessels.

## 8. Backend logic

A backend is a server performing work on behalf of users. This product needs no application backend. GitHub Pages delivers its files; the browser performs the viewing and export work. `server.mjs` only provides the same files locally for development.

This avoids login administration, server hosting, database backup and secret management for the MVP. A private site or shared editing would require additional infrastructure later.

## 9. Frontend logic

The frontend is what the visitor sees and interacts with.

- `validateSite()` checks the data before a model is built and reports invalid values.
- `storageTotals()` adds the schedule capacities without substituting cylinder volume.
- `planToWorld()` converts manually traced pixels into approximate local metres.
- `createScene()` builds cylinders, buildings, roads, boundaries, rail context and lighting.
- `buildPumpHouse()` creates open steel sheds, trusses, green roof/cladding, original pump geometry and local pipework; it rotates the same structure to suit each scheduled long axis.
- `focusPumpEquipment()` moves the camera closer to local equipment. Roof controls affect each pump house independently; Reset restores all roofs. Schematic site pipe guides are suppressed during pump-house inspection to keep local equipment readable.
- `selectAsset()` keeps the facility list, model, drawing and details aligned.
- `applyVisibility()` respects layer switches and facility isolation.
- `setupPlan()` handles drawing pan, zoom and linked marker selection.
- `horizontalDistanceM()` measures two ground points, ignoring elevation differences.
- `showTourStop()` moves through the guided workflow without automatic timed transitions.
- Export functions save the visible geometry, a captioned scene image or the register.

Three.js is the bundled library that draws the 3D scene. GLB is a common portable file format containing 3D geometry. CSV is a text-based table that spreadsheet tools can open.

## 10. Development journey

1. Inspect the supplied files and reference project's capabilities.
2. Render the PDF and read the facility schedules, tank schedules and title block.
3. Separate verifiable dimensions from traced positions and illustrative structures.
4. Create an editable facility register.
5. Build the model geometry and site context.
6. Add facility selection, search and details.
7. Link the drawing markers and model selections.
8. Add tour, views, display layers, ground measurement and exports.
9. Verify data, browser behaviour and mobile layout.
10. Package a local launcher and GitHub Pages publishing instructions.

## 11. Where future changes belong

Edit the register for facility facts; edit `scene.js` for how geometry looks; edit `app.js` for interactions; edit `styles.css` for appearance and responsiveness. Keep these responsibilities separate so a later engineer can maintain the product without rebuilding it.

## 12. Decisions for the owner

| Decision | Why it matters |
|---|---|
| Public presentation or restricted engineering review? | Determines whether GitHub Pages is suitable and whether drawing images can be published |
| PDF D2 or another approved source revision? | Prevents mixing geometry from conflicting drawing revisions |
| Concept presentation or engineering model? | Determines whether manual tracing is sufficient or surveyed CAD data is required |
| Which structures need verified heights first? | Prioritises the most valuable accuracy improvements |
| Which facilities are most important to reviewers? | Guides improvements to camera views and tour wording |

## 13. Testing

Use the checklist in `README.md` and the recorded results in `QA.md`. After any data change, run the checks, compare the affected facility with the drawing, test selection and inspect exports. For important geometric changes, get an engineering reviewer to verify them.

## 14. Deployment

The simplest path is GitHub Pages from the `main` branch and repository root, as described in `README.md`. Keep source control history so incorrect edits can be reversed. No paid server or API service is required for the current design, subject to your account's GitHub Pages eligibility.

## 15. Future roadmap

| Stage | Improvement | Value / prerequisite |
|---|---|---|
| Accuracy | Convert the correct DWG revision to a readable CAD interchange format and use survey coordinates | Reliable placement; requires source revision confirmation and a CAD conversion workflow |
| Geometry | Obtain elevations, equipment drawings and building heights | Better spatial realism with fewer assumptions |
| Reliability | Add automated browser checks and representative export validation to deployment | Detect broken controls before reviewers see them |
| Performance | Merge repeating road/rail geometry and use efficient repeated-object rendering | Faster viewing on weaker devices |
| Review workflow | Add revision comparison and structured comments | Track design changes and decisions; needs storage and access control |
| Security | Private hosting and sign-in if source material is restricted | Controlled audience; needs a suitable host and account management |
| Business integration | Link approved equipment schedules and cost records | Supports planning discussions; requires verified identifiers and authoritative data |

Quantity estimation, compliance validation and live operations should be separate, verified modules. A visually convincing model by itself is not an adequate basis for those decisions.

## Pump-house refinement, 1 October 2026

The three photographs were reviewed as architectural and equipment references. The old enclosed boxes with rooftop placeholder equipment were replaced with original open sheds and equipment at floor level. No photograph is embedded or copied as a texture. Scheduled footprints and traced positions are preserved. The fire-water shed uses red illustrative headers; the rail and truck sheds use silver headers. Colours, equipment counts, drivers and routing are presentation assumptions.

Owner review path: search for pump house → select each facility → check scheduled dimensions → hide roof → inspect equipment close-up → show roof → reset. This update uses existing browser tools and adds no recurring service cost. The next accuracy improvement is to obtain approved pump-house general arrangement drawings and an equipment schedule, then replace illustrative configurations with reviewed dimensions and duties.

## Tank appearance refinement, 1 October 2026

The supplied tank-storage photograph informs the exterior character only. `src/tank.js` creates original paint, shell seams, fixed outer roofs, roof access, curved stairs, vent/hatch details, identity signs and warm service-light accents. The photograph is not embedded or copied.

Business benefit: tanks are easier to recognise during presentations, and closer camera views help explain access and storage functions. No new packages, account or recurring service are required. The next accuracy improvement is to replace illustrative access structures and fittings with approved tank general arrangement drawings.

Review journey: Tank farm view → select tank → Focus view → Isolate facility → confirm source dimensions/capacity → toggle Dusk → Show all. The exported 3D shells are checked against the source register, including their actual geometric extents. This remains a visual communication tool, with no structural, access-safety or lighting certification.

## Underground-vessel refinement, 1 October 2026

The UG Vessel.jpg photo informs red-coated horizontal shells, rounded heads, raised manways and concrete inspection pits. `src/underground-vessel.js` constructs original geometry and generated identity signs. Overall envelope dimensions remain 3.3 m diameter and 7.5 m total length; the barrel is shortened to accommodate the rounded heads. Capacity remains the scheduled 50 m³ rather than a calculated geometric volume.

`vesselDetails` stores illustrative head depth, soil cover, pit/floor clearances, wall thickness, manway count/height and reference basis. `syncVesselCutaways()` opens terrain only over visible inspection pits and restores the original ground when inspections are hidden. Selecting or focusing a vessel enables the Underground layer automatically.

Review journey: search UG-01 → select → inspect or isolate → check dimensions/capacity → disable Underground to restore ground → Focus view to reopen → Show all → export. The package includes a separate full-site underground inspection GLB; the default GLB omits hidden underground structures. No new package, login or recurring service is needed.

Owner decision for the next accuracy phase: obtain approved underground-vessel and civil pit drawings before substituting actual cover depths, heads, support/anchoring, manway/nozzle schedules or pit construction details. No installation, lifting, excavation or structural design has been verified.

## Rail-gantry refinement, 1 October 2026

Goal: help presentation audiences understand rail receipt and help reviewers inspect the shed, vehicle access and equipment arrangement. The same viewer and single facility page are used; no database, account, server-side processing, added package or recurring service is needed.

The five local photographs provide cues for original pitched steel trusses, long operator platforms, unbranded rounded tank wagons, bogies, wheels, couplers, roof hatches, safety rails and access ladders. Manifolds, meters, valves, hoses and articulated service arms make the receipt workflow visible. The photographs, commercial markings and background scenery are not reproduced.

The drawing still controls the 350 × 10 m footprint, traced position, 10° orientation and hold status. The separate 380 × 15 m note remains disclosed. Twelve wagons and their 19 m shells/25 m pitch are presentation assumptions, not wagon specifications or a source-specified capacity. The covered track is aligned locally with the illustrative shed in the rendered scene; the two original trace routes remain in site.json. This avoids wheels floating beside rails without implying surveyed alignment.

Modules: data/site.json stores railDetails and its reference basis; src/data.js rejects overlapping or oversized wagon layouts; src/rail-gantry.js builds the original geometry; src/scene.js frames the complete shed or a platform-side close-up; src/app.js connects the roof and inspection controls. Each can be reviewed separately. The model exports include the geometry and source/assumption notes.

Review journey: search RAIL-01 → select Tank-wagon unloading shed → confirm footprint and hold note → Unloading close-up → inspect ladders, bogies, hoses and platform → Show roof → Hide roof → Isolate facility / Show all → Focus view for the whole shed → Reset. A reset restores the rail roof independently of the other roofs. Export uses the current visible roof/layer state.

Owner decision for the next accuracy phase: confirm which held shed dimensions govern and obtain an approved rail-siding/general arrangement drawing, wagon envelope and receipt-equipment schedule. These are needed before assigning actual wagon capacity, track gauge, platform clearance, unloading connections or structural design. Next business improvements are reviewed receipt-process labels and links to approved equipment records; repeated-object rendering would improve performance on weaker devices.

## Inverted-L rail supports, 1 October 2026 (supersedes the rail canopy refinement)

Goal: replace the rail-unloading shed superstructure with the fall-arrester support arrangement requested by the owner. The new MVP uses the supplied plan/section for visible dimensions, exact along-track spacing and clear inspection views. User roles and workflow remain the same: owners review the arrangement, presentation audiences explore it, and maintainers edit the register. No new tools, account, package, database or paid service is needed.

Removed: roof, paired shed columns, pitched trusses, longitudinal frame members and rail roof controls. Retained: wagons, operator platform, unloading assemblies, both rail routes and the original shed source record. The current facility is named Rail unloading · fall-arrester supports. Its source description separates the owner's visualization change from the original held 350 × 10 m shed schedule and 380 × 15 m note.

The supplied detail gives 6850 mm height, 3260 mm arm, 1500 mm brace reach, 500 mm square base plates and ISMC 250/200/150 member labels. ISMC is a steel-channel designation; this model shows schematic boxed sections with the labelled nominal depths. Widths, pedestal elevation and fixings remain illustrative. The diagonal brace has a 45-degree centreline. Cable, trolley, lanyard and load ratings are outside the supplied detail.

Spacing is stored as 12.42 metres in railDetails.fallArresters. It represents 12420 mm between neighbouring column centres along a track, not a lateral offset from the rail. To interpret 54 places within this corridor, the first layout uses two rows of 27. The second row follows the other traced rail direction, so the spacing is checked as an actual distance rather than an X-coordinate difference. Row count is an explicit owner-review assumption. Following owner review, each column row stands outside the pair of tracks, with its arms pointing inward over the respective wagons. The gap between tracks remains free of these support columns.

Data module: data/site.json stores reference dimensions, steel-member labels, spacing, row count and source notes. Calculation module: src/rail-layout.js determines row directions and column centres. Geometry module: src/fall-arrester.js creates supports and source metadata. The existing rail module retains the unloading workflow. The viewer module provides full-corridor, unloading and support close-ups; the page module shows exact millimetres and removes unavailable roof controls.

Review journey: search RAIL-01 → select → confirm 12420 mm pitch and 6850 mm height → Support close-up → inspect arm/brace/base → Unloading close-up → Isolate facility / Show all → Focus view for the whole corridor → export. Test checks cover dimensions, row counts, pitch on both angled rows, corridor length and malformed settings. Portable-model validation checks actual exported transforms/dimensions and absence of the former roof and trusses.

Deployment: use the refreshed GitHub-ready ZIP and the same README upload steps. No compilation or server change is required. The next owner decision is to confirm one versus two rows and approved setting-out coordinates. For an operational safety system, an approved structural/fall-protection design must supply the cable/trolley arrangement, connections, load ratings and foundations; the current module remains a visual support model.

## TXR room position correction, 1 October 2026

Problem: the earlier TXR-01 trace placed the inspection-room model over a railway. Owner request: move it clear. Updated data/site.json to place it on nearby open ground at plot-image coordinates [1810,285], retaining its 10 × 5 m scheduled footprint and 3.5 m illustrative height. The move is approximately 25.24 m in the conceptual model. PositionRevision stores the original [1785,218] trace and the reason for the adjustment.

Both the 3D building and the comparison marker use the same register position, so reviewers see one consistent location. src/app.js labels the position as adjusted in the viewer. This prevents a presentation audience from mistaking the correction for an unchanged or surveyed trace. No new package, account, backend or recurring service is needed.

Review path: search TXR-01 → select → Focus view → confirm room/rail separation and no service-road overlap → Compare to inspect the marker → return to 3D → export. Existing rail, support, tank, pump-house and loading arrangements are retained. The refreshed package contains both updated portable-model exports. The next accuracy decision is to confirm approved setting-out coordinates before using this placement for detailed design.

## Two-track wagon fleet, 1 October 2026

The owner requested 25 wagons on the existing track and another 25 on the other track. The previous viewer contained twelve on one track. The current quantity is 25 per track, 50 total, stored in railDetails.wagonCount and wagonTrackCount. This quantity follows the owner's request; vehicle size and arrangement remain illustrative.

Shell length stays 19 m. Wagons use 22 m centre spacing, keeping the visible couplers separated, with a 2.75 m overall coupler allowance. Each rake is 549.75 m long and uses the existing longer rail corridor beyond the original 350 m unloading area. No tank shell is shrunk, no rail route is extended, and the twelve unloading stations remain in their original platform area. src/rail-wagons.js checks corridor fit and follows track direction; the rail view camera now frames the complete fleet.

src/wagon-geometry.js combines static decorative parts by material; src/rail-gantry.js clones a common detailed wagon to share geometry and preserve the bogie groups. This keeps the larger scene manageable. No new dependency or account is required. Review: reload viewer → select RAIL-01 → Focus view for both complete rows → Unloading close-up → check the 25 per track/50 total note → export. The full-site GLB checker verifies actual wagon group counts, track identifiers, bogies, shell sizes and spacing metadata.

The existing rail support settings remain unchanged. Approved vehicle envelopes, stopping positions, platform coverage and actual unloading connections would be needed before interpreting this arrangement as an operating plan.

Rendering reliability for the current larger rail scene: scene.js reuses shadows for stationary geometry and draws again when the camera, lights, size, layers, roofs or selected graphics change. This reduces repeated graphics work while people read the facility notes. Roof and visibility controls request fresh shadows so the cached view stays correct; labels continue to update during idle frames. Verification included reset/focus, roof switches, dusk/day and underground exports. This is a rendering change, not a change to the terminal dimensions.

## Fall-arrester placement correction, 1 October 2026

Problem: the support columns were between the two tracks. The owner requires them outside. Each of the two rows now stands on the outer side of its track, with the arm pointing inward over the wagons. This makes the intended arrangement clearer during layout review and leaves the space between tracks free of these columns. The 54 supports, 12420 mm pitch and supplied member dimensions are retained.

Files: src/rail-layout.js changes which side receives each column; the existing src/fall-arrester.js automatically turns the arms towards the tracks. src/scene.js moves the Support close-up camera outside the first track so wagons do not hide the base. data/site.json records the placement decision and keeps the on-screen note short enough for phones. tests/data.test.mjs checks whole pedestal placement against both ballast strips. scripts/verify-model.py checks actual column positions and arm directions in the exported files against the central wagon rows, independently of the layout calculation.

No new software, account, package, database or key is required. Test: reload the viewer, select RAIL-01, use Unloading close-up to inspect both outer rows, then Support close-up to inspect the base and inward arm. Use Isolate facility / Show all to review it with or without surrounding buildings. Run `node --test tests/data.test.mjs` for the automated checks. Upload the refreshed ZIP using the existing README deployment steps. Both portable 3D files and previews contain the corrected placement. Future edits to track ordering or alignment should repeat the outside-placement checks; exact site coordinates remain illustrative.

## Vertical facility information panel, 1 October 2026

Goal: move the horizontal facility summary to a vertical panel on the right, as requested. Reviewers can keep capacity, dimensions, source notes and actions beside the equipment while the model gains vertical space. The same panel works with the 3D model and plot comparison. No new tools, accounts, packages, database or backend are required.

styles.css arranges the toolbar, viewer, display controls and information panel into two columns inside the existing work area. It stacks the panel's name, individual measurements, description and action buttons; long content scrolls inside the panel. The existing left facility list stays available. index.html names the information region for accessibility. src/app.js keeps the complete tank measurements visible at every screen width, using the existing register and selection logic. Screens up to 1050 px wide place the panel below the viewer to preserve usable model space. Existing fullscreen controls use the same panel and return it to its normal position on exit.

Review steps: refresh the page, select Diesel · tank 3, and confirm 5000 m³, 24 m and 12.5 m in the right panel. Try Focus view and Isolate facility / Show all. Switch to Compare and select another facility; its information should update in the same panel. On a phone, scroll below the viewer to see the complete measurements and actions. Deploy by replacing the repository files with the updated GitHub-ready ZIP using the README instructions. An already-open browser may need a refresh to load the new layout; long facility notes require scrolling within the desktop panel.

## Collapsible side panels, 1 October 2026

Goal: let the owner open the facility list and information panel only when needed, in the same spirit as Codex's sidebars. Both panels start closed on a fresh visit. Desktop users can show either, both or neither, giving presentations and model review the full available workspace. Selection keeps the latest information ready without opening a closed panel.

index.html adds two labelled sidebar buttons to the existing viewer toolbar, close controls and a dimmed-background button for narrow screens. styles.css removes the unused panel column when Details is closed, lets the model use the left panel's released space, and changes panels into side drawers on smaller screens. src/app.js controls the two open/closed states, updates button labels and accessibility state, and remembers only those choices under panchgram.side-panels.v1 in browser storage. There is no server database or new backend. Existing ResizeObserver logic resizes the 3D image automatically as panels change.

On screens up to 1050 px wide, one drawer opens at a time. The covered workspace stops receiving keyboard focus, and a close button, Escape or the dimmed background returns to the model. Selecting a facility closes the left drawer without opening Details. Pressing / opens the list and focuses search. Reset retains panel choices. Fullscreen continues to use its separate expandable information card and restores the normal panel choices on exit. This drawer arrangement supersedes the earlier information panel below the phone viewer.

Prerequisites remain the existing modern browser and local server or GitHub Pages site. Test the four desktop layouts, refresh with panels open, select while Details is closed, and check the drawer close methods on a phone. Use the README deployment steps with the refreshed GitHub-ready ZIP. If browser storage is blocked, controls still work but may not remember choices; no account or personal information is stored. A future improvement could make panel widths adjustable after the basic collapse controls have been reviewed.

## Wagon fit within the allocated rail-area length, 1 October 2026

The owner requested shorter wagons so both complete 25-wagon rows fit the allocated length. This correction supersedes the earlier 19 m shell / 22 m pitch / 549.75 m row arrangement. The source register gives a 350 m rail-area length; the separate 380 m hold note remains recorded. Each illustrative shell is now 10.45 m long. Centre spacing is 13.20 m, including the existing 2.75 m coupler allowance. The calculation is 24 spaces x 13.20 m + 13.20 m complete wagon envelope = 330 m per row, leaving 10 m at each end of the 350 m allocation.

Both rows are centred beside the unloading platform, rather than centred on the longer rail trace. Wheel assemblies and tank saddles move inward in proportion to the body length, while their individual sizes, wagon diameter, height, hatch and access platform remain unchanged. Fifty wagons, 100 wheel assemblies, twelve unloading stations and the outer fall-arrester arrangement are retained. This is an owner-requested visual fit, not a revised real railway-vehicle specification.

Data/site.json stores the new body length, pitch and owner decision. src/rail-wagons.js limits placement to the scheduled area and centres both rows on the facility. src/rail-gantry.js adjusts the wheel and saddle positions. src/data.js rejects configurations that exceed the allocation or overlap the couplers. tests/data.test.mjs checks count, end margins, source-area centring and rejection of the former oversized rows. scripts/verify-model.py checks actual exported meshes, including couplers and wheel assemblies, so shrinking only the descriptive settings cannot make an oversized model pass.

No new tools, account or paid service is needed. Test: refresh the viewer, select RAIL-01, use Focus view to inspect the complete arrangement, then Unloading close-up to inspect the shorter bodies and wheel positions. Run node --test tests/data.test.mjs for the automated checks. Use the refreshed wagon-fit package for this revision; an older downloaded model or ZIP will retain its earlier geometry.

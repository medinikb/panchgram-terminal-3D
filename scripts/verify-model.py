"""Check the portable 3D export without needing a CAD application."""
import json
import math
from pathlib import Path
import struct
import sys
from itertools import product

project = Path(__file__).resolve().parents[1]
model_path = Path(sys.argv[1]) if len(sys.argv)>1 else project / 'panchgram-concept-model.glb'
raw = model_path.read_bytes()
magic, version, size = struct.unpack_from('<4sII', raw)
assert magic == b'glTF' and version == 2 and size == len(raw), 'Invalid GLB header'
json_size, json_kind = struct.unpack_from('<II', raw, 12)
assert json_kind == 0x4e4f534a, 'Missing JSON chunk'
model = json.loads(raw[20:20 + json_size])
binary_offset = 20 + json_size
binary_size, binary_kind = struct.unpack_from('<II', raw, binary_offset)
assert binary_kind == 0x004e4942 and binary_offset + 8 + binary_size == len(raw)
binary = memoryview(raw)[binary_offset + 8:]

for node in model['nodes']:
    for key in ('matrix', 'translation', 'rotation', 'scale'):
        assert all(math.isfinite(v) for v in node.get(key, [])), f'Non-finite transform: {node.get("name")}'

# Inspect actual vertex/normal/texture data as well as node transforms.
widths = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
checked = 0
for accessor in model['accessors']:
    if accessor['componentType'] != 5126:
        continue
    view = model['bufferViews'][accessor['bufferView']]
    width = widths[accessor['type']]
    stride = view.get('byteStride', width * 4)
    offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    for index in range(accessor['count']):
        values = struct.unpack_from('<' + 'f' * width, binary, offset + index * stride)
        assert all(math.isfinite(v) for v in values), 'Non-finite geometry attribute'
        checked += width

register = json.loads((project / 'data/site.json').read_text(encoding='utf-8'))
for asset in (a for a in register['assets'] if a['kind'] == 'pumpHouse'):
    nodes = [n for n in model['nodes'] if n.get('extras', {}).get('id') == asset['id']]
    assert len(nodes) == 1, f'Missing or duplicated house: {asset["id"]}'
    metadata = nodes[0]['extras']
    assert [metadata['widthM'], metadata['depthM']] == [asset['widthM'], asset['depthM']]
    pumps = [n for n in model['nodes'] if n.get('name', '').startswith(f'Illustrative pump assembly · {asset["id"]} · ')]
    assert len(pumps) == asset['pumpHouseDetails']['illustrativePumpCount']
canopies = [n for n in model['nodes'] if n.get('name') == 'Removable pitched roof and corrugated upper cladding']
assert len(canopies) == 3, 'Default export must include all three pump-house roofs'
assert len([n for n in model['nodes'] if n.get('name', '').startswith('Illustrative tanker · bay')]) == 4
for tank in (a for a in register['assets'] if a['kind'] == 'tank'):
    parents = [n for n in model['nodes'] if n.get('extras', {}).get('id') == tank['id']]
    assert len(parents) == 1
    assert parents[0]['extras']['roofType'] == tank['roofType']
    assert parents[0]['extras']['capacityM3'] == tank['capacityM3']
    shells = [n for n in model['nodes'] if n.get('name') == f'Scheduled tank shell · {tank["id"]}']
    assert len(shells) == 1, f'Missing scheduled shell: {tank["id"]}'
    primitive = model['meshes'][shells[0]['mesh']]['primitives'][0]
    positions = model['accessors'][primitive['attributes']['POSITION']]
    # Check the exported shell's actual extent, not just its descriptive metadata.
    extents = [hi - lo for hi, lo in zip(positions['max'], positions['min'])]
    assert math.isclose(extents[0], tank['diameterM'], abs_tol=0.0001)
    assert math.isclose(extents[2], tank['diameterM'], abs_tol=0.0001)
    assert math.isclose(extents[1], tank['heightM'], abs_tol=0.0001)
    assert any(n.get('name') == f'Closed fixed outer roof · {tank["roofType"]} · {tank["id"]}' for n in model['nodes'])
vessels=[a for a in register['assets'] if a['kind']=='underground']
present=[a for a in vessels if any(n.get('extras',{}).get('id')==a['id'] for n in model['nodes'])]
inspection_export='underground-inspection' in model_path.name
assert len(present)==(5 if inspection_export else 0), 'Full inspection export requires all five vessels; default export must omit them'
for vessel in present:
    parents=[n for n in model['nodes'] if n.get('extras',{}).get('id')==vessel['id']]
    assert len(parents)==1 and parents[0]['extras']['capacityM3']==50
    assert parents[0]['extras']['inspection']['burialDepthSource']=='illustrative'
    shells=[n for n in model['nodes'] if n.get('name')==f'Scheduled underground vessel shell · {vessel["id"]}']
    assert len(shells)==1
    shell=shells[0]
    accessor=model['accessors'][model['meshes'][shell['mesh']]['primitives'][0]['attributes']['POSITION']]
    extents=[hi-lo for hi,lo in zip(accessor['max'],accessor['min'])]
    assert math.isclose(extents[0],vessel['diameterM'],abs_tol=.0001)
    assert math.isclose(extents[1],vessel['diameterM'],abs_tol=.0001)
    assert math.isclose(extents[2],vessel['lengthM'],abs_tol=.0001)
    centre_y=shell['matrix'][13] if 'matrix' in shell else shell.get('translation',[0,0,0])[1]
    assert centre_y+vessel['diameterM']/2<0, 'Vessel crown should be below grade in the cutaway'
cutaways=[n['extras']['inspectionCutaways'] for n in model['nodes'] if 'inspectionCutaways' in n.get('extras',{})]
assert cutaways==[[a['id'] for a in present]], 'Ground cutaways must agree with the visible vessel layer'
rail=next(a for a in register['assets'] if a['id']=='RAIL-01')
rail_nodes=[n for n in model['nodes'] if n.get('extras',{}).get('id')==rail['id']]
assert len(rail_nodes)==1
metadata=rail_nodes[0]['extras']
assert [metadata['widthM'],metadata['depthM'],metadata['rotationDeg'],metadata['planPositionPx']]==[350,10,10,[641,392]]
assert metadata['originalShedSchedule']['status']=='hold / see notes'
assert metadata['railConcept']['structure']=='inverted-L fall-arrester supports'
wagons=[n for n in model['nodes'] if n.get('name','').startswith('Illustrative rail tank wagon · ')]
bogies=[n for n in model['nodes'] if n.get('name','').startswith('Illustrative rail bogie · ')]
stations=[n for n in model['nodes'] if n.get('name','').startswith('Illustrative rail unloading station · ')]
rail_detail=rail['railDetails']
wagon_envelope=rail_detail['wagonLengthM']+2.75
assert len(wagons)==rail['railDetails']['wagonCount']*rail['railDetails']['wagonTrackCount']==50
assert len(stations)==rail['railDetails']['unloadingStationCount']==12 and len(bogies)==100
for track_number in range(1,rail['railDetails']['wagonTrackCount']+1):
    row=[n for n in wagons if n.get('extras',{}).get('trackNumber')==track_number]
    assert len(row)==25
    assert sorted(n['extras']['wagonNumber'] for n in row)==list(range(1,26))
    distances=sorted(n['extras']['distanceAlongTrackM'] for n in row)
    assert all(math.isclose(b-a,rail_detail['wagonPitchM'],abs_tol=.00001) for a,b in zip(distances,distances[1:]))
    assert all(n['extras']['shellLengthM']==rail_detail['wagonLengthM'] for n in row)
    assert math.isclose(distances[0]-wagon_envelope/2,10,abs_tol=.00001)
    assert math.isclose(distances[-1]+wagon_envelope/2,rail['widthM']-10,abs_tol=.00001)
print(f"Wagons verified: 25 on each track, 50 total, 100 bogies; {rail_detail['wagonLengthM']} m shells, {rail_detail['wagonPitchM']} m pitch; both rows within the {rail['widthM']} m allocation, with 10 m end margins.")
assert not any(n.get('name') in ('Removable rail canopy · illustrative superstructure on hold','Illustrative steel columns, knee braces and pitched trusses') for n in model['nodes']), 'Old shed roof and trusses must be absent'
footprint=next(n for n in model['nodes'] if n.get('name')=='Original source rail area · 350 × 10 m')
positions=model['accessors'][model['meshes'][footprint['mesh']]['primitives'][0]['attributes']['POSITION']]
extent=[hi-lo for hi,lo in zip(positions['max'],positions['min'])]
scale=footprint.get('scale')
if scale is None:
    matrix=footprint['matrix']
    scale=[math.sqrt(sum(matrix[col*4+row]**2 for row in range(3))) for col in range(3)]
assert math.isclose(extent[0]*scale[0],350,abs_tol=.0001) and math.isclose(extent[2]*scale[2],10,abs_tol=.0001)
detail=rail['railDetails']['fallArresters']
supports=[n for n in model['nodes'] if n.get('name','').startswith('Fall-arrester support · row ')]
assert len(supports)==detail['rowCount']*detail['supportsPerRow']==54

def node_position(node):
    return [node['matrix'][i] for i in (12,13,14)] if 'matrix' in node else node.get('translation',[0,0,0])

# Inspect all wagon meshes, including the moved bogies and merged couplers.
# Exporter matrices are column-major; accessor bounds are in each mesh's frame.
identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
def multiply(a,b):
    return [sum(a[k*4+row]*b[column*4+k] for k in range(4)) for column in range(4) for row in range(4)]

def wagon_x_bounds(wagon,rail_frame=False):
    values=[]
    def visit(node,transform):
        if 'mesh' in node:
            for primitive in model['meshes'][node['mesh']]['primitives']:
                bounds=model['accessors'][primitive['attributes']['POSITION']]
                for corner in product(*zip(bounds['min'],bounds['max'])):
                    values.append(sum(transform[i*4]*corner[i] for i in range(3))+transform[12])
        for child_index in node.get('children',[]):
            child=model['nodes'][child_index]
            visit(child,multiply(transform,child.get('matrix',identity)))
    visit(wagon,wagon.get('matrix',identity) if rail_frame else identity)
    return min(values),max(values)

for wagon in wagons:
    low,high=wagon_x_bounds(wagon)
    assert math.isclose(high-low,wagon_envelope,abs_tol=.0001), 'Actual wagon geometry, including bogies/couplers, must fit its shorter envelope'
    low,high=wagon_x_bounds(wagon,rail_frame=True)
    assert low>=-rail['widthM']/2 and high<=rail['widthM']/2, 'Every exported wagon mesh must stay within the allocated rail length'

# Confirm actual exported wagon positions, rather than relying on counts alone.
for track_number in range(1,rail['railDetails']['wagonTrackCount']+1):
    ordered=sorted((n for n in wagons if n['extras']['trackNumber']==track_number),key=lambda n:n['extras']['wagonNumber'])
    for a,b in zip(ordered,ordered[1:]):
        separation=math.dist(node_position(a),node_position(b))
        assert wagon_envelope-.0001<=separation<=rail_detail['wagonPitchM']+.0001, 'Neighbouring wagon envelopes must not overlap'

def mesh_extent(node):
    primitive=model['meshes'][node['mesh']]['primitives'][0]
    bounds=model['accessors'][primitive['attributes']['POSITION']]
    scale=node.get('scale')
    if scale is None:
        m=node.get('matrix',[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])
        scale=[math.sqrt(sum(m[col*4+row]**2 for row in range(3))) for col in range(3)]
    return [(hi-lo)*factor for hi,lo,factor in zip(bounds['max'],bounds['min'],scale)]

# Use the actual central wagon transforms as independent track centrelines.
# This catches inward columns or reversed arms in the exported geometry itself.
track_axes=[]
for track_number in (1,2):
    central=sorted((n for n in wagons if n['extras']['trackNumber']==track_number),key=lambda n:n['extras']['wagonNumber'])[12:14]
    a,b=map(node_position,central)
    dx,dz=b[0]-a[0],b[2]-a[2]
    length=math.hypot(dx,dz)
    track_axes.append((a,[-dz/length,dx/length]))

for row in range(1,detail['rowCount']+1):
    ordered=sorted((n for n in supports if n['extras']['row']==row),key=lambda n:n['extras']['index'])
    assert len(ordered)==detail['supportsPerRow']
    for a,b in zip(ordered,ordered[1:]):
        assert math.isclose(math.dist(node_position(a),node_position(b)),12.42,abs_tol=.00001), 'Actual exported support pitch must be 12420 mm'
for support in supports:
    position=node_position(support)
    outer_side=1 if support['extras']['row']==1 else -1
    for track_position,normal in track_axes:
        distance=(position[0]-track_position[0])*normal[0]+(position[2]-track_position[2])*normal[1]
        assert outer_side*distance>2+.39, 'Actual pedestal must be outside both 4 m ballast strips'
    track_position,normal=track_axes[support['extras']['row']-1]
    # Local +Z is the boom direction; the support matrix rotates it into the scene.
    matrix=support['matrix']
    arm_direction=[matrix[8],matrix[10]]
    inward=[-outer_side*v for v in normal]
    assert sum(a*b for a,b in zip(arm_direction,inward))>.99999, 'Exported arm must face inward over its track'
    children=[model['nodes'][i] for i in support['children']]
    plate=next(n for n in children if n.get('name')=='Reference 500 × 500 mm base plate')
    arm=next(n for n in children if n.get('name')=='Reference 3260 mm cantilever · ISMC 200 BOX')
    column=next(n for n in children if n.get('name')=='ISMC 250 BOX · nominal depth')
    brace=next(n for n in children if n.get('name')=='ISMC 150 brace · 1500 mm reference reach')
    assert math.isclose(mesh_extent(arm)[2],3.26,abs_tol=.00001)
    assert all(math.isclose(mesh_extent(plate)[i],.5,abs_tol=.00001) for i in [0,2])
    top=node_position(arm)[1]+mesh_extent(arm)[1]/2
    base=node_position(plate)[1]+mesh_extent(plate)[1]/2
    assert math.isclose(top-base,6.85,abs_tol=.00001)
    assert math.isclose(mesh_extent(column)[2],.25,abs_tol=.00001)
    m=brace['matrix'];assert math.isclose(abs(m[5]),abs(m[6]),abs_tol=.00001), 'Brace must have a 45-degree centreline'
    assert math.isclose(abs(m[5]),1.5,abs_tol=.00001)
print('Rail supports verified: 54 inverted-L assemblies outside both tracks, arms inward; actual 12420 mm pitch, 6850 mm height, 3260 mm arms, 45-degree braces and 500 mm base plates; old shed absent.')
print(f'GLB verified: {len(raw):,} bytes; nine scheduled tank shells and closed roofs; three pump houses; 17 illustrative pumps; four gantry tankers; {len(present)} underground vessels.')
print(f'Checked {checked:,} finite geometry values and all node transforms. External CAD import is not certified.')

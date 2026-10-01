import * as THREE from 'three';

// Combine small, fixed parts by material before cloning the wagon. This reduces
// browser drawing work without changing the shape or the two bogie groups.
export function combineWagonDetails(group){
  for(const child of group.children)if(child.isGroup)combineWagonDetails(child);
  const batches=new Map();
  for(const part of group.children){
    if(!part.isMesh||part.name.startsWith('Illustrative rail wagon shell'))continue;
    if(!batches.has(part.material))batches.set(part.material,[]);
    batches.get(part.material).push(part);
  }
  for(const [material,parts] of batches){
    if(parts.length<2)continue;
    const positions=[],normals=[],uvs=[],indices=[];
    let offset=0;
    for(const part of parts){
      part.updateMatrix();
      const normalMatrix=new THREE.Matrix3().getNormalMatrix(part.matrix);
      const p=part.geometry.getAttribute('position'),n=part.geometry.getAttribute('normal'),uv=part.geometry.getAttribute('uv');
      const point=new THREE.Vector3(),normal=new THREE.Vector3();
      for(let i=0;i<p.count;i++){
        point.fromBufferAttribute(p,i).applyMatrix4(part.matrix);positions.push(point.x,point.y,point.z);
        normal.fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix);normals.push(normal.x,normal.y,normal.z);
        uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
      }
      const index=part.geometry.getIndex();
      for(let i=0;i<(index?.count||p.count);i++)indices.push(offset+(index?index.getX(i):i));
      offset+=p.count;
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    geometry.setIndex(indices);geometry.computeBoundingSphere();
    const combined=new THREE.Mesh(geometry,material);
    combined.name='Shared fixed wagon details';combined.castShadow=true;combined.receiveShadow=true;
    for(const part of parts)group.remove(part);
    group.add(combined);
  }
}

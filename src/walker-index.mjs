// Only the pinned walker batch uses this index. Before each synchronous batch,
// compare the exact input (including mutation, replacement, append, deletion).
// Never used for vehicle contact, camera, weapons, or general world queries.
export function createWalkerIndex() {
  const caches=new WeakMap(), cell=16, margin=.25, side=128;
  // Valid query coordinates are limited by the original world edge test.
  const bin=v=>Math.floor(v/cell);
  const key=(x,z)=>(x+32)*side+z+32;
  const unchanged=(b,s,i)=>s[5*i]===b && s[5*i+1]===b.minX && s[5*i+2]===b.maxX && s[5*i+3]===b.minZ && s[5*i+4]===b.maxZ;
  function rebuild(blocks) {
    const values=[], cells=new Map();
    for(const b of blocks) {
      if(!b || ![b.minX,b.maxX,b.minZ,b.maxZ].every(Number.isFinite) || b.minX>b.maxX || b.minZ>b.maxZ) return null;
      values.push(b,b.minX,b.maxX,b.minZ,b.maxZ);
      const x0=Math.max(-14,bin(b.minX-margin)), x1=Math.min(9,bin(b.maxX+margin));
      const z0=Math.max(-18,bin(b.minZ-margin)), z1=Math.min(18,bin(b.maxZ+margin));
      for(let x=x0;x<=x1;x++) for(let z=z0;z<=z1;z++) {
        const k=key(x,z); if(!cells.has(k)) cells.set(k,[]);
        cells.get(k).push(b);
      }
    }
    return {values,cells};
  }
  function batch(game) {
    const blocks=game.blocks;
    if (!Array.isArray(blocks)) return game;
    let c=caches.get(blocks);
    let stale = !c || c.values.length!==blocks.length*5;
    for(let i=0;!stale && i<blocks.length;i++) { const b=blocks[i]; stale=!b || !unchanged(b,c.values,i); }
    if (stale) {
      c=rebuild(blocks); if(!c) { caches.delete(blocks); return game; } caches.set(blocks,c);
    }
    return {blocked(x,z,r) {
      if (!(r>=0 && r<=margin && Number.isFinite(x) && Number.isFinite(z))) return game.blocked(x,z,r);
      if(x < -207+r || x > (game.car?136:141)-r || z < -288+r || z > 288-r) return true;
      const list=c.cells.get(key(bin(x),bin(z))); if(!list) return false;
      for(const b of list) if(x+r>b.minX && x-r<b.maxX && z+r>b.minZ && z-r<b.maxZ) return true;
      return false;
    }};
  }
  return {batch};
}

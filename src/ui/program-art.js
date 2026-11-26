/* Decorative covers derived from existing random identities. No training-store writes. */
(()=>{
 'use strict';
 const kinds=['bench','dumbbells','machine','kettlebells','leg-press','barbell'];
 const capacity=kinds.length*36*6;
 function hash(value){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;return n>>>0;}
 function allocate(profileId,ids){
  const used=new Set(),result=new Map();
  for(const id of ids){
   if(result.has(id))continue;
   const seed=hash(String(profileId)+':'+id);let slot=seed%capacity;
   for(let attempts=0;used.has(slot)&&attempts<capacity;attempts++)slot=(slot+1)%capacity;
   used.add(slot);
   const kind=kinds[slot%kinds.length],variant=Math.floor(slot/kinds.length);
   result.set(id,{key:kind+'-'+variant,kind,src:'src/ui/program-art/'+kind+'.webp',hue:(variant%36)*10,saturation:.65+Math.floor(variant/36)*.12,tint:hash(id+':card')%8});
  }
  return result;
 }
 globalThis.GymnastikaProgramArt=Object.freeze({allocate});
})();

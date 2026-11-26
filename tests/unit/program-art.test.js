import {test,expect} from 'vitest';
import '../../src/ui/program-art.js';
const {allocate}=globalThis.GymnastikaProgramArt;
test('distinct covers for the supported program and standalone collection, without mutating records',()=>{
 const rows=Array.from({length:1200},(_,i)=>({id:'plan-'+i,title:'Ten sam tytuł'}));const before=JSON.stringify(rows);
 const art=allocate('profile-a',rows.map(x=>x.id));
 expect(new Set([...art.values()].map(x=>x.key)).size).toBe(1200);expect(JSON.stringify(rows)).toBe(before);
});
test('random identity selects the cover; reload, rename and appending preserve previous choices',()=>{
 const ids=Array.from({length:200},()=>crypto.randomUUID());const first=allocate('p',ids);
 expect(allocate('p',ids)).toEqual(first);expect(new Set([...first.values()].map(x=>x.kind)).size).toBe(6);expect(new Set([...first.values()].map(x=>x.tint)).size).toBe(8);
 const extended=allocate('p',[...ids,crypto.randomUUID()]);for(const id of ids)expect(extended.get(id)).toEqual(first.get(id));
});
test('profiles are independent and output paths stay within the packaged library',()=>{
 const ids=['same','other'];const a=allocate('a',ids),b=allocate('b',ids);
 expect(a).not.toEqual(b);for(const cover of a.values()){expect(cover.src).toMatch(/^src\/ui\/program-art\/[a-z-]+\.webp$/);expect(cover.hue).toBeGreaterThanOrEqual(0);}
});

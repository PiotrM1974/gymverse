import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [id, ...positions] = process.argv.slice(2);
if (!/^\d+$/.test(id) || !positions.length || positions.some(p => !/^\d+$/.test(p))) throw new Error('Provide numeric ACE ID and photo numbers');
const target = join(tmpdir(), 'gymnastika-ace-photo-review');
await mkdir(target, { recursive: true });
for (const position of positions) {
  const url = `https://ik.imagekit.io/02fmeo4exvw/exercise-library/large/${id}-${position}.jpg`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const path = join(target, `${id}-${position}.jpg`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
  console.log(path);
}

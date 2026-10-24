import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {articlePages} from '../tools/legacy-content.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
test('Historical buying-guide tables survive the template migration',()=>{
 let tables=0;
 for(const article of articlePages){
  const sections=(article.sections||[]).filter(s=>s.table);
  if(!sections.length)continue;
  const html=fs.readFileSync(path.join(root,'dist',article.path,'index.html'),'utf8');
  for(const section of sections){tables++;for(const row of section.table)for(const cell of row)assert.ok(html.includes(escape(cell)),`Missing table cell on ${article.path}: ${cell}`);}
 }
 assert.ok(tables>=4,'Expected the preserved RFQ, packaging and reorder checklists');
});

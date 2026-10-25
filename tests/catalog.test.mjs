import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {products} from '../content/site/products.mjs';
import {catalogProducts} from '../content/site/catalog-products.mjs';
import {catalogCopy} from '../content/site/catalog-copy.mjs';
const langs=Object.keys(catalogCopy);
test('63 new products have seven language pages, product-only images, inquiry links, and no prices or supplier models',()=>{
 assert.equal(catalogProducts.length,63);assert.equal(products.length,75);
 assert.equal(new Set(products.map(p=>p.model)).size,75);
 let images=0;
 for(const p of catalogProducts){
  assert.ok(!['S-OH-016','S-OH-017','S-OH-018'].includes(p.model));
  assert.ok(p.gallery.length);images+=p.gallery.length;
  for(const l of langs){
   const route=(l==='en'?'':'/'+l)+'/products/'+p.slug+'/';
   const html=fs.readFileSync('dist'+route+'index.html','utf8');
   assert.ok(html.includes('?product='+p.model+'#inquiry'),route);
   assert.ok(html.includes(p.quote[l]),route);
   assert.ok(!html.includes(p.sourceModel),route+' leaks supplier model');
   assert.ok(!/cost_usd|sale_usd|gross.?margin|\bUSD\b|\$\d|packaging_(?:front|back|variant)|series_reference/.test(html),route+' internal data or packaging');
   assert.ok(!/"offers"\s*:/.test(html),route+' price offer not permitted');
   assert.ok(!html.includes('undefined'),route);
   assert.ok(p.specs[l].every(([label,value])=>label&&value),route);
  }
 }
 assert.equal(images,150);
 const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
 for(const code of ['s-oh-016','s-oh-017','s-oh-018'])assert.ok(!sitemap.includes(code));
});
test('ANC runtime modes remain separate and conflicting source runtime is held back',()=>{
 const p=catalogProducts.find(p=>p.model==='S-OH-010');
 for(const [k,v]of [['normalPlayback','40 h'],['rgbPlayback','25 h'],['rgbAncPlayback','20 h']])assert.ok(p.specs.en.some(([label,value])=>label===catalogCopy.en.params[k]&&value===v));
 const gaming=catalogProducts.find(p=>p.model==='S-OH-019');
 assert.ok(!gaming.specs.en.some(([label])=>label===catalogCopy.en.params.playback));
 assert.ok(catalogProducts.find(p=>p.model==='S-IE-015').specs.en.some(([label,value])=>label===catalogCopy.en.params.charge&&value==='0.5 h'));
});

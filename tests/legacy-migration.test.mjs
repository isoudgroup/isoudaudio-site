import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {legacyRedirects,retiredPages,currentHref} from '../content/site/legacy-migration.mjs';
test('retired pages are absent from publication and sitemap; replacements exist',()=>{
 const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
 const redirects=fs.readFileSync('dist/_redirects','utf8');
 for(const from of [...Object.keys(legacyRedirects),...retiredPages]){
  assert.equal(fs.existsSync('dist'+from+'index.html'),false,from);
  assert.equal(sitemap.includes('<loc>https://isoudaudio.com'+from+'</loc>'),false,from);
 }
 for(const [from,to] of Object.entries(legacyRedirects)){
  assert.ok(fs.existsSync('dist'+to+'index.html'),to);
  assert.ok(redirects.includes(`${from} ${to} 301`));
  assert.ok(redirects.includes(`${from}index.html ${to} 301`));
 }
 assert.equal(currentHref('/fr/controle-qualite/#tests'),'/fr/usine-fabrication-ecouteurs/#tests');
 assert.equal(currentHref('/fr/produits/ecouteurs-traducteurs-ia/'),'/fr/produits/');
 assert.equal(currentHref('https://other.example/fr/rss/'),'https://other.example/fr/rss/');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {products} from '../content/site/products.mjs';
import {languages} from '../content/site/locales.mjs';

test('Inquiry-only catalogue preserves page identity without unsupported Product rich-result claims',()=>{
  let checked=0;
  for(const lang of Object.keys(languages))for(const p of products){
    const route=`/${lang==='en'?'':lang+'/'}products/${p.slug}/`;
    const html=fs.readFileSync(new URL(`../dist${route}index.html`,import.meta.url),'utf8');
    const data=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const graph=data['@graph'];
    const page=graph.find(n=>n['@type']==='WebPage');
    assert.equal(page.url,'https://isoudaudio.com'+route);
    assert.equal(page.about.identifier,p.model);
    assert.equal(page.about['@type'],'Thing');
    assert.equal(page.description,p.description[lang]);
    assert.equal(page.primaryImageOfPage['@type'],'ImageObject');
    assert.ok(page.primaryImageOfPage.contentUrl.startsWith('https://isoudaudio.com/assets/'));
    assert.ok(graph.some(n=>n['@type']==='Organization'));
    const crumbs=graph.find(n=>n['@type']==='BreadcrumbList');
    assert.equal(crumbs.itemListElement.length,3);
    assert.equal(crumbs.itemListElement.at(-1).item,page.url);
    function check(node){
      if(!node||typeof node!=='object')return;
      assert.ok(!['Product','Offer','AggregateOffer','Review','AggregateRating'].includes(node['@type']),route);
      for(const value of Object.values(node))if(typeof value==='object')check(value);
    }
    check(data);
    assert.ok(html.includes('contact/?product=')||html.includes('contact/?'));
    checked++;
  }
  assert.equal(checked,products.length*Object.keys(languages).length);
});

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Offline structural checks. This does not verify translation quality, visual
// layout, external URLs, ranking, or delivery of an inquiry.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const origin = 'https://isoudaudio.com';
const errors = [];
const fail = (file, message) => errors.push(`${file}: ${message}`);
if (!fs.existsSync(dist)) {
  console.error(`Missing build: ${dist}. Run npm run build first.`);
  process.exit(1);
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
function attrs(tag) {
  const result = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) result[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4]);
  return result;
}
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
}
const files = walk(dist).filter(f => f.endsWith('.html'));
const pages = new Map();
const redirected = new Set();
if (fs.existsSync(path.join(dist,'_redirects'))) {
  for (const line of fs.readFileSync(path.join(dist,'_redirects'),'utf8').split('\n')) {
    const [from,to,status] = line.trim().split(/\s+/);
    if (from && to && /^30[1278]$/.test(status)) redirected.add(from);
  }
}
const reportFile = path.join(root,'build-report.json');
const translated = new Set(fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile,'utf8')).routes.filter(r=>r.translated).map(r=>r.route) : []);
function localFile(url) {
  let p;
  try { p = decodeURIComponent(url.pathname); } catch { return null; }
  const target = path.resolve(dist, '.'+p);
  if (!target.startsWith(dist+path.sep) && target!==dist) return null;
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;
  const index = path.join(target,'index.html');
  return fs.existsSync(index) ? index : null;
}
let refs = 0, schemas = 0, translatedCount = 0;
const anchors = new Map(), fragmentLinks = [];
function checkRef(file, route, value) {
  if (!value || /^(?:data:|mailto:|tel:|javascript:|blob:)/i.test(value)) return;
  let url;
  try { url = new URL(value, origin+route); } catch { fail(file,`invalid URL ${value}`); return; }
  if (url.origin!==origin || url.pathname.startsWith('/api/') || redirected.has(url.pathname)) return;
  refs++;
  if (!localFile(url)) fail(file,`missing local resource ${value}`);
}
for (const full of files) {
  const file = path.relative(dist,full).split(path.sep).join('/');
  const route = '/'+file.replace(/index\.html$/,'');
  const html = fs.readFileSync(full,'utf8');
  // Do not mistake markup strings inside scripts or comments for HTML tags.
  const markup = html.replace(/<!--[\s\S]*?-->/g,'').replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi,'<script$1></script>');
  const tags = [...markup.matchAll(/<[a-z][^>]*>/gi)].map(m=>({name:m[0].match(/^<([\w-]+)/)[1].toLowerCase(), a:attrs(m[0])}));
  const ids = tags.filter(t=>t.a.id).map(t=>t.a.id);
  if (ids.length!==new Set(ids).size) fail(file,'duplicate element IDs');
  anchors.set(route,new Set(ids));
  if (html.includes('${styleVersion}') || html.includes('${scriptVersion}')) fail(file,'unresolved asset version placeholder');
  for (const {name,a} of tags) {
    if (name==='img') {
      if (!('alt' in a)) fail(file,'image missing alt attribute');
      if (!(Number(a.width)>0 && Number(a.height)>0)) fail(file,'image missing intrinsic dimensions');
    }
    if (name==='a' && a.href && !/^(mailto:|tel:|javascript:)/i.test(a.href)) {
      const url=new URL(a.href,origin+route);
      if(url.origin===origin && url.hash) fragmentLinks.push({file,path:url.pathname,hash:decodeURIComponent(url.hash.slice(1))});
    }
    for (const key of ['href','src','data-src','poster']) if (a[key]) checkRef(file,route,a[key]);
    if (a.srcset && !a.srcset.startsWith('data:')) for (const candidate of a.srcset.split(',')) checkRef(file,route,candidate.trim().split(/\s+/)[0]);
  }
  if (tags.some(t=>t.name==='meta' && t.a['http-equiv']?.toLowerCase()==='refresh')) continue;
  const htmlTag = tags.find(t=>t.name==='html')?.a || {};
  if (!htmlTag.lang) fail(file,'missing html lang');
  if (htmlTag.lang?.split('-')[0]==='ar' && htmlTag.dir!=='rtl') fail(file,'Arabic page must have dir="rtl"');
  const h1 = tags.filter(t=>t.name==='h1').length;
  if (h1!==1) fail(file,`expected one H1, found ${h1}`);
  const titles = [...markup.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titles.length!==1 || !titles[0][1].trim()) fail(file,'expected one nonempty title');
  const noindex = tags.some(t=>t.name==='meta' && t.a.name==='robots' && /noindex/i.test(t.a.content));
  if (noindex || file==='404.html') continue;
  for (const {a} of tags.filter(t=>t.name==='form')) {
    if ((a.method||'get').toLowerCase()!=='post') fail(file,'inquiry forms must POST, never send personal information in query strings');
  }
  const descriptions = tags.filter(t=>t.name==='meta' && t.a.name==='description');
  if (descriptions.length!==1 || !descriptions[0].a.content?.trim()) fail(file,'expected one nonempty meta description');
  const canonicals = tags.filter(t=>t.name==='link' && t.a.rel==='canonical');
  const canonical = canonicals[0]?.a.href;
  if (canonicals.length!==1 || canonical!==origin+route) fail(file,`canonical must self-reference ${origin+route} (found ${canonical})`);
  const alternates = tags.filter(t=>t.name==='link' && t.a.rel==='alternate' && t.a.hreflang).map(t=>t.a);
  pages.set(origin+route,{file,lang:htmlTag.lang,alternates});
  if (translated.has(route) || alternates.length) {
    translatedCount++;
    for (const l of ['en','fr','es','pt','ru','ar','zh-CN','x-default']) {
      if (alternates.filter(a=>a.hreflang===l).length!==1) fail(file,`expected one hreflang ${l}`);
    }
    if (!alternates.some(a=>a.hreflang===htmlTag.lang && a.href===canonical)) fail(file,'hreflang missing self-reference');
  }
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attrs(match[1]).type!=='application/ld+json') continue;
    try { const data=JSON.parse(match[2]); if (!data || typeof data!=='object') throw new Error('expected object or array'); schemas++; }
    catch(e) { fail(file,`invalid JSON-LD: ${e.message}`); }
  }
}
for (const link of fragmentLinks) {
  if (anchors.has(link.path) && !anchors.get(link.path).has(link.hash)) fail(link.file,`missing anchor ${link.path}#${link.hash}`);
}
for (const [url,page] of pages) for (const alternate of page.alternates) {
  if (alternate.hreflang==='x-default') continue;
  const target = pages.get(alternate.href);
  if (!target) { fail(page.file,`hreflang target missing or not canonical: ${alternate.href}`); continue; }
  if (target.lang!==alternate.hreflang) fail(page.file,`hreflang target language mismatch: ${alternate.href}`);
  if (!target.alternates.some(a=>a.hreflang===page.lang && a.href===url)) fail(page.file,`nonreciprocal hreflang: ${alternate.href}`);
}
const sitemapFile = path.join(dist,'sitemap.xml');
let locations = [];
if (!fs.existsSync(sitemapFile)) fail('sitemap.xml','missing sitemap');
else {
  const xml = fs.readFileSync(sitemapFile,'utf8');
  locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));
  const seen = new Set();
  for (const url of locations) {
    if (seen.has(url)) fail('sitemap.xml',`duplicate URL ${url}`);
    seen.add(url);
    if (!pages.has(url)) fail('sitemap.xml',`URL not an indexable canonical page: ${url}`);
  }
  if (!locations.length) fail('sitemap.xml','empty sitemap');
  for (const url of pages.keys()) if (!seen.has(url)) fail('sitemap.xml',`canonical page omitted: ${url}`);
}
const buildReport=JSON.parse(fs.readFileSync(reportFile,'utf8'));
if(buildReport.pages!==pages.size) fail('build-report.json','page count does not match generated pages');
const uniqueErrors = [...new Set(errors)];
console.log(`Checked ${files.length} HTML files, ${translatedCount} translated pages, ${refs} local references, ${schemas} JSON-LD blocks, ${locations.length} sitemap URLs.`);
if (uniqueErrors.length) {
  console.error(`FAIL: ${uniqueErrors.length} issues\n${uniqueErrors.slice(0,60).map(e=>'  '+e).join('\n')}${uniqueErrors.length>60?'\n  … additional issues omitted':''}`);
  process.exitCode=1;
} else console.log('PASS: structural SEO, language links and local resources. Browser and delivery checks are separate.');

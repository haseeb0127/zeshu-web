import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('app/components/CustomerLanguageProvider.tsx','utf8');
assert(source.length<10000,'Global language provider must stay small on mobile');
assert(source.includes("import('./customer-translations/te')"));
assert(source.includes("import('./customer-translations/hi')"));
assert(source.includes("import('./customer-translations/ur')"));
assert(source.includes('useEffect(()=>{loadTranslations(language);},[language,loadTranslations])'));
assert(source.includes('setLanguageState(next)'));
assert(source.includes('applyDocumentLanguage(next)'),'Keep immediate RTL and language settings');
assert(source.includes('translations[language]?.[english] || english'),'Offline/delayed locales need safe English fallback');
assert(!source.includes('"Payment receipt and order summary":'),'Never put locale dictionaries back into first-page JS');

const dictionaries=await Promise.all(['te','hi','ur'].map(async code=>{
 const file='app/components/customer-translations/'+code+'.ts';
 const raw=readFileSync(file,'utf8');
 assert(raw.length>25000,'The '+code+' dictionary appears truncated');
 assert(raw.includes('export default')&&raw.includes('satisfies Record<string, string>'));
 const module=await import('../../app/components/customer-translations/'+code+'.ts');
 return {code,dict:module.default};
}));
for(const {code,dict} of dictionaries){
 assert(Object.keys(dict).length>350,code+' dictionary missing many customer-facing strings');
 for(const key of [
  'Payment receipt and order summary',
  'Choose language',
  'Zeshu Dine',
  'Zeshu Green',
  'Our first goal: 1–2 trees after 1,000 eligible deliveries.',
  'Shop in Jagtial',
  'Set your address',
 ]){
  assert(typeof dict[key]==='string'&&dict[key].trim().length>0,
    code+' missing essential customer translation: '+key);
 }
}
console.log('PASS: 3 deferred intact language chunks, compact initial provider and safe RTL/offline fallback.');

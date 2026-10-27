// Read-only publication status checker for Zeshu Buffer post receipts.
import { readFileSync, readdirSync } from 'node:fs';
const token=process.env.BUFFER_API_KEY;
if(!token) throw new Error('BUFFER_API_KEY missing');
const paths=readdirSync('social-receipts').filter(x=>x.endsWith('.json')).sort();
if(!paths.length){console.log('No receipt files.');process.exit(0)}
const rows=paths.map(path=>JSON.parse(readFileSync('social-receipts/'+path,'utf8'))).filter(x=>x.buffer_post_id);
if(!rows.length){console.log('No post IDs accepted by Buffer yet.');process.exit(0)}
for(const rec of rows) {
  const r=await fetch('https://api.buffer.com',{
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    body:JSON.stringify({query:'query($postId:PostId!){post(input:{id:$postId}){id status dueAt sentAt externalLink schedulingType error { message }}}',variables:{postId:rec.buffer_post_id}}),
    signal:AbortSignal.timeout(20000)
  });
  if(!r.ok){console.log(rec.platform, 'Buffer HTTP', r.status);continue}
  const json=await r.json();
  if(json.errors?.length){console.log(rec.platform,'Status lookup failed:',json.errors.map(e=>e.message).join('; ').slice(0,200));continue}
  const post=json.data?.post;
  if(!post){console.log(rec.platform,'No Buffer record');continue}
  console.log(JSON.stringify({platform:rec.platform,id:post.id,status:post.status,sentAt:post.sentAt,externalLink:post.externalLink,automatic:post.schedulingType==='automatic'}));
}

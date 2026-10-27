// Read-only Buffer credential and channel check; never writes social posts.
const token = process.env.BUFFER_API_KEY || '';
if (!token) {
  console.error('GitHub Actions repository secret BUFFER_API_KEY is missing or empty.');
  process.exit(1);
}
const endpoint = 'https://api.buffer.com';
async function query(source, variables = {}) {
  const response = await fetch(endpoint, {
    method:'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type':'application/json' },
    body: JSON.stringify({query:source, variables}), signal: AbortSignal.timeout(20000),
  });
  if(!response.ok) throw new Error('Buffer API HTTP status '+ response.status);
  const body = await response.json();
  if(body.errors?.length) throw new Error('Buffer query returned errors: '+body.errors.map(e=>e.message).join('; ').slice(0,400));
  return body.data;
}
try {
  const first = await query('query { account { organizations { id name } } }');
  const orgs = first?.account?.organizations || [];
  if(orgs.length!==1) throw new Error('Expected one Buffer organization; got '+orgs.length+'. Need explicit org setting.');
  const data = await query('query($id:OrganizationId!) { channels(input:{organizationId:$id}) { id name displayName service isDisconnected isLocked } }',{id:orgs[0].id});
  const channelNames = data?.channels||[];
  const expected = {instagram:'zeshu.in',facebook:'zeshu',youtube:'zeshu'};
  for(const [platform, name] of Object.entries(expected)) {
    const matches=channelNames.filter(c=>String(c.service).toLowerCase()===platform && [c.name,c.displayName].some(s=>String(s||'').trim().replace(/^@/,'').toLowerCase()===name));
    if(matches.length!==1) throw new Error(platform+': expected one '+name+' channel, got '+matches.length);
    if(matches[0].isDisconnected||matches[0].isLocked) throw new Error(platform+' is disconnected/locked');
    console.log(platform+': authorized and unlocked ('+matches[0].name+')');
  }
  console.log('BUFFER_READ_ONLY_PREFLIGHT_OK; no posts created or scheduled.');
} catch(e) {
  console.error('Buffer preflight failed:', String(e.message||e));
  process.exitCode=1;
}

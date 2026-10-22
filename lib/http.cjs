const crypto=require('node:crypto');
const storage=require('./storage.cjs');
function json(res,status,data){res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.statusCode=status;res.end(JSON.stringify(data));}
function sameOrigin(req){
  try{const origin=new URL(req.headers.origin);return origin.host===req.headers.host&&(origin.protocol==='https:'||(!process.env.VERCEL&&origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname)));}catch{return false;}
}
async function body(req){
  if(!(req.headers['content-type']||'').startsWith('application/json'))throw Object.assign(new Error('요청 형식을 확인해 주세요.'),{status:415});
  if(Number(req.headers['content-length']||0)>12288)throw Object.assign(new Error('입력 내용이 너무 깁니다.'),{status:413});
  if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>12288)throw Object.assign(new Error('입력 내용이 너무 깁니다.'),{status:413});return JSON.parse(raw);}
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>12288)throw Object.assign(new Error('입력 내용이 너무 깁니다.'),{status:413});}
  try{return JSON.parse(raw);}catch{throw Object.assign(new Error('입력 내용을 확인해 주세요.'),{status:400});}
}
function hash(value){return crypto.createHash('sha256').update(value).digest('hex');}
function equal(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function sign(value){if(!process.env.ADMIN_SESSION_SECRET)throw new Error('Session configuration missing');return crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(value).digest('base64url');}
function session(){const value=`${Date.now()+12*3600000}.${crypto.randomBytes(16).toString('hex')}`;return `${value}.${sign(value)}`;}
function authenticated(req){
  try{const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('skktlg_admin='))?.slice(13);if(!token)return false;const parts=token.split('.');if(parts.length!==3||Number(parts[0])<Date.now()||Number(parts[0])>Date.now()+12*3600000)return false;return equal(parts[2],sign(parts.slice(0,2).join('.')));}catch{return false;}
}
function cookie(value,clear=false){return `skktlg_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:43200}${process.env.VERCEL?'; Secure':''}`;}
async function rateLimit(req,type,owner,limit=10,minutes=10,subject=''){
  const ip=process.env.VERCEL?(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0]:req.socket?.remoteAddress||'local';
  const identity=crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET||'local-test-only').update(subject||ip).digest('hex');
  const bucket=Math.floor(Date.now()/(minutes*60000)),date=new Date().toISOString().slice(0,10);
  for(let slot=0;slot<limit;slot++)if(await storage.claim(`rate/${date}/${type}-${identity}-${bucket}-${slot}.json`,{owner,expiresAt:Date.now()+24*3600000}))return true;
  return false;
}
function failure(res,e){json(res,e.status||503,{ok:false,message:e.status?e.message:'일시적으로 연결이 어렵습니다. 잠시 후 다시 시도해 주세요.'});}
module.exports={json,sameOrigin,body,hash,equal,session,authenticated,cookie,rateLimit,failure};

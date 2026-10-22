const crypto=require('node:crypto');
const H=require('../lib/http.cjs');
const store=require('../lib/storage.cjs');
const M=require('../survey-model.js');
module.exports=async function(req,res){
  const url=new URL(req.url,'https://site.local');
  try{
    if(req.method==='POST'){
      if(!H.sameOrigin(req))return H.json(res,403,{ok:false});
      const input=await H.body(req);
      if(input.action==='logout'){res.setHeader('Set-Cookie',H.cookie('',true));return H.json(res,200,{ok:true});}
      if(input.action==='login'){
        if(!process.env.ADMIN_PASSWORD_HASH||!process.env.ADMIN_SESSION_SECRET)return H.json(res,503,{ok:false,message:'관리자 설정을 확인해 주세요.'});
        if(!await H.rateLimit(req,'login',crypto.randomUUID(),10,15))return H.json(res,429,{ok:false,message:'로그인 시도가 많습니다. 15분 후 다시 시도해 주세요.'});
        if(typeof input.password!=='string'||input.password.length>200||!H.equal(H.hash(input.password),process.env.ADMIN_PASSWORD_HASH.trim()))return H.json(res,401,{ok:false,message:'비밀번호를 확인해 주세요.'});
        res.setHeader('Set-Cookie',H.cookie(H.session()));return H.json(res,200,{ok:true});
      }
      if(!H.authenticated(req))return H.json(res,401,{ok:false,message:'다시 로그인해 주세요.'});
      if(!/^[0-9a-f-]{36}$/.test(input.id||''))return H.json(res,400,{ok:false,message:'접수번호를 확인해 주세요.'});
      const key=`leads/${input.id}.json`,record=await store.read(key);
      if(!record)return H.json(res,404,{ok:false,message:'접수 내역이 없습니다.'});
      if(input.action==='delete'){await store.remove(key);return H.json(res,200,{ok:true});}
      if(input.action==='status'&&M.statuses.includes(input.status)){record.status=input.status;record.updatedAt=new Date().toISOString();await store.write(key,record,true);return H.json(res,200,{ok:true});}
      return H.json(res,400,{ok:false,message:'변경 내용을 확인해 주세요.'});
    }
    if(req.method!=='GET'){res.setHeader('Allow','GET, POST');return H.json(res,405,{ok:false});}
    if(!H.authenticated(req))return H.json(res,401,{ok:false,message:'로그인이 필요합니다.'});
    const page=Math.max(0,Math.min(10000,Number(url.searchParams.get('page'))||0));
    const files=(await store.list('leads/')).sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
    const records=await Promise.all(files.slice(page*30,page*30+30).map(f=>store.read(f.pathname)));
    const items=records.filter(r=>r&&r.expiresAt>Date.now()).map(({digest,...rest})=>rest).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    return H.json(res,200,{ok:true,items,total:files.length,page,hasMore:(page+1)*30<files.length});
  }catch(e){return H.failure(res,e);}
};

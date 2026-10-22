const H=require('../lib/http.cjs');
const store=require('../lib/storage.cjs');
module.exports=async function(req,res){
  if(req.method!=='GET')return H.json(res,405,{ok:false});
  if(!process.env.CRON_SECRET||!H.equal(req.headers.authorization,`Bearer ${process.env.CRON_SECRET}`))return H.json(res,401,{ok:false});
  try{
    let removed=0;
    for(const prefix of ['leads/','rate/']){
      const files=await store.list(prefix);
      for(const f of files){
        if(prefix==='rate/'&&Date.now()-new Date(f.uploadedAt).getTime()<86400000)continue;
        const record=await store.read(f.pathname);
        if(record&&record.expiresAt<=Date.now()){await store.remove(f.pathname);removed++;}
      }
    }
    return H.json(res,200,{ok:true,removed});
  }catch(e){return H.failure(res,e);}
};

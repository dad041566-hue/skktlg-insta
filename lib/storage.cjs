const fs=require('node:fs/promises');
const path=require('node:path');
const blob=require('@vercel/blob');
function localRoot(){return !process.env.VERCEL&&process.env.LOCAL_DATA_DIR?path.resolve(process.env.LOCAL_DATA_DIR):null;}
function localPath(key){const root=localRoot(),file=path.resolve(root,key);if(!file.startsWith(root+path.sep))throw new Error('Invalid storage key');return file;}
async function read(key){
  if(localRoot()){try{return JSON.parse(await fs.readFile(localPath(key),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
  const result=await blob.get(key,{access:'private',useCache:false});
  if(!result||result.statusCode===404)return null;
  if(result.statusCode!==200)throw new Error('Storage read failed');
  return JSON.parse(await new Response(result.stream).text());
}
async function write(key,value,overwrite=false){
  if(localRoot()){const file=localPath(key);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(value),{flag:overwrite?'w':'wx'});return;}
  await blob.put(key,JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:overwrite,contentType:'application/json',cacheControlMaxAge:60});
}
async function claim(key,value){
  try{await write(key,value);return true;}catch(e){const existing=await read(key);if(existing)return existing.owner===value.owner;throw e;}
}
async function list(prefix){
  if(localRoot()){
    const root=localRoot(),base=localPath(prefix);const result=[];
    async function walk(dir){let entries;try{entries=await fs.readdir(dir,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}
      for(const item of entries){const file=path.join(dir,item.name);if(item.isDirectory())await walk(file);else{const stat=await fs.stat(file);result.push({pathname:path.relative(root,file).replace(/\\/g,'/'),uploadedAt:stat.mtime});}}
    }await walk(base);return result;
  }
  let cursor,result=[];
  do{const page=await blob.list({prefix,limit:1000,...(cursor?{cursor}:{})});result.push(...page.blobs);cursor=page.hasMore?page.cursor:null;}while(cursor);
  return result;
}
async function remove(key){if(localRoot()){await fs.rm(localPath(key),{force:true});return;}await blob.del(key);}
module.exports={read,write,claim,list,remove};

/*
 A simple tool for watching files
 author treemonster
 latest 2017/3/22
 git: https://github.com/treemonster/watcher.js
 */

const fs=require("fs")
const ev=new(require("events"))
const path=require("path")

let watchers={}/*
key => filefullname
value => {
  watcher => fs.Watcher
  isFile => true | false
  fullname => 
  filename =>
}
*/

const FILE_CREATED='fileCreated'
const FILE_MODIFIED='fileModified'
const FILE_DELETED='fileDeleted'

const DIR_CREATED='dirCreated'
const DIR_MODIFIED='dirModified'
const DIR_DELETED='dirDeleted'

let __fullname=(fromdir,fn)=>path.resolve(fromdir+path.sep+fn);
let __basename=(fullname)=>path.parse(fullname).base;
let __subdir=(dir)=>new Promise((resolve,reject)=>{
  const fulldir=__fullname(dir,'')
  fs.readdir(fulldir,(e,files)=>{
    if(e) return resolve([])
    let n=files.length,results=[{isFile: false,fullname: fulldir, filename: __basename(fulldir)}];
    files.map((file)=>{
      const ff=__fullname(fulldir,file);
      fs.stat(ff,(e,s)=>{
        s && results.push({isFile: s.isFile(),fullname: ff, filename: __basename(ff)})
        !--n && resolve(results)
      })
    }).length || resolve([])
  })
})
let __subdirs=(dirs)=>Promise.all(dirs.map((d)=>__subdir(d))).then((list)=>list.reduce((a,b)=>a.concat(b),[]))
let __suballdirs=(dirs)=>{
  let dds=[];
  let map={};
  return (function x(dirs){
    let ds=[];
    return __subdirs(dirs).then((ffs)=>ffs.map((res)=>{
      if(map[res.fullname])return;
      map[res.fullname]=true;
      dds.push(res)
      if(!res.isFile) ds.push(res.fullname)
    })).then(()=>ds.length?x(ds):dds)
  })(dirs)
}
let __emit=(et,_res)=>{
  res=watchers[_res.fullname]
  if(res._last==et && Date.now()-res._last_time<100) return;
  ev.emit(et,res.filename,res.fullname)
  res._last_time=Date.now()
  res._last=et
}
let __addwatcher=(res,isInit)=>{
  if(watchers[res.fullname]) return __emit(res.isFile?FILE_MODIFIED:DIR_MODIFIED,res)
  try{
    watchers[res.fullname]={
      watcher: fs.watch(res.fullname,(_,fn)=>__modify(res,fn)).on('error',()=>__modify(res)),
      isFile: res.isFile,
      fullname: res.fullname,
      filename: res.filename
    }
    if(!isInit) __emit(res.isFile?FILE_CREATED:DIR_CREATED,res)
  }catch(e){}
}
let __removewatcher=(watcher_key)=>{
  const res=watchers[watcher_key];
  if(!res) return;
  __emit(res.isFile?FILE_DELETED:DIR_DELETED,res)
  res.watcher.close()
  delete watchers[watcher_key]
}
let __modify=(res,fn)=>{
  const fullfn=res.isFile?res.fullname:__fullname(res.fullname,fn||'')
  fs.stat(fullfn,(e,s)=>{
    if(e) return __removewatcher(fullfn);
    __addwatcher({ isFile: s.isFile(), fullname: fullfn, filename: __basename(fullfn) })
    !s.isFile() && __suballdirs([fullfn]).then((ffs)=>ffs.map(__addwatcher))
  })
}

module.exports=(dirs)=>{
  console.log("loading all directorys, please wait patiently..");
  __suballdirs(dirs).then((ffs)=>ffs.map((res)=>__addwatcher(res,true))).then(()=>console.log('watchers is ready!'))
  return ev
}

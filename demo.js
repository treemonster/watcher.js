const watcher=require("./watcher")

watcher(["./"]).on('fileModified',(filename,fullfilename)=>{
  console.log("Modified file:", filename,fullfilename);
}).on('fileCreated',(filename,fullfilename)=>{
  console.log("Created file:", filename,fullfilename);
}).on('fileDeleted',(filename,fullfilename)=>{
  console.log("Deleted file:", filename,fullfilename);
}).on('dirModified',(filename,fullfilename)=>{
  console.log("Modified dir:", filename,fullfilename);
}).on('dirCreated',(filename,fullfilename)=>{
  console.log("Created dir:", filename,fullfilename);
}).on('dirDeleted',(filename,fullfilename)=>{
  console.log("Deleted dir:", filename,fullfilename);
})

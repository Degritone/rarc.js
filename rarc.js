let RARC = {
  packFileSystemHandle(file){
    let dictionary = {};
    let recursiveDirectory = async function(directory,path){
      let parent = dictionary;
      for(let p of path)
        parent = parent[p];
      parent[directory.name] = {};
      let promises = [];
      for await(let h of directory.values()){
        if(h.kind=="directory")
          promises.push(recursiveDirectory(h,path.concat(directory.name)));
        else{
          promises.push(new Promise(res=>{
            h.getFile().then(f=>{
              let fr = new FileReader();
              fr.onload = ()=>{
                parent[directory.name][h.name] = fr.result;
                res();
              }
              fr.readAsArrayBuffer(f);
            });
          }));
        }
      }
      return Promise.allSettled(promises);
    }
    return new Promise(res=>{
      if(file.kind=="directory")
        recursiveDirectory(file,[]).then(()=>RARC.packArrayBufferDictionary(dictionary)).then(res);
      else{
        file.getFile().then(f=>{
          let fr = new FileReader();
          fr.onload = ()=>{
            dictionary[file.name] = fr.result;
            RARC.packArrayBufferDictionary(dictionary).then(res);
          }
          fr.readAsArrayBuffer(f);
        });
      }
    });
  },
  packArrayBufferDictionary(file){
    let nameTable = [];
    let fileSize = 0;
    let fileCounts = {
      file:0,
      folder:0
    }
    let folders = [];
    let getFileSize = function({name="",data=new Uint8Array([])}={}){
      if(!nameTable.some(n=>n.match(new RegExp(RegExp.escape(name)+"$"))))
        nameTable.push(name);
      if(!(data instanceof Uint8Array) && !(data instanceof ArrayBuffer)){
        fileCounts.folder++;
        folders.push({name,files:data});
        for(let f of Object.keys(data))
          getFileSize({name:f,data:data[f]});
        return;
      }
      fileCounts.file++;
      fileSize+=new Uint8Array(data).length;
    }
    for(let f of Object.keys(file))
      getFileSize({name:f,data:file[f]});
    let onlyFolder = Object.keys(file).length==1 && folders[0].name==Object.keys(file)[0];
    let fileOffset = 80+(fileCounts.folder+(onlyFolder?0:1))*16;
    let nameTableOffset = fileOffset+(fileCounts.file+fileCounts.folder)*20;
    nameTableOffset = Math.ceil(nameTableOffset/32)*32;
    let dataOffset = nameTableOffset+nameTable.reduce((a,c)=>a+c.length+1,0);
    fileSize+=dataOffset;
    
    let nameToWeird = function(name){
      let n = 0;
      for(let i=0;i<name.length;i++)
        n+=name.charCodeAt(name.length-1-i)*(3**1);
      return n%(2**16);
    }
    
    let nameToOffset = function(name){
      let i = nameTable.indexOf(nameTable.find(n=>n.match(new RegExp(RegExp.escape(name)+"$"))));
      let o = 0;
      for(let [j,n] of nameTable.entries()){
        if(j==i)
          break;
        o+=n.length+1;
      }
      if(nameTable[i]!=name){
        let n = nameTable[i];
        while(n!=name){
          n = n.split("");
          n.shift();
          n = n.join("");
          o++;
        }
      }
      return o;
    }
    
    let te = new TextEncoder();
    
    let buffer = new Uint8Array(fileSize);
    buffer.set(te.encode("RARC"),0);
    let view = new DataView(buffer.buffer);
    view.setUint32(4,fileSize);
    view.setUint32(8,32);
    view.setUint32(12,dataOffset-32);
    view.setUint32(16,fileSize-dataOffset);
    view.setUint32(20,fileSize-dataOffset);
    view.setUint32(32,fileCounts.folder);
    view.setUint32(36,32);
    view.setUint32(40,fileCounts.file+fileCounts.folder*3-1);
    view.setUint32(44,fileOffset-32);
    view.setUint32(48,64);
    view.setUint32(52,nameTableOffset-32);
    view.setUint16(56,(fileCounts.file+fileCounts.folder*3-1)%(2**16));
    view.setUint16(58,256);
    
    let pointer = 64;
    let filesIncluded = 0;
    let dataLength = 0;
    let fileID = 0;
    if(onlyFolder)
      folders[0].root = true;
    else
      folders.unshift({root:true,name:"ROOT",files:file});
    for(let f of folders){
      if(f==folders[0]){
        view.setUint16(fileOffset,2**16-1);
        view.setUint16(fileOffset+2,nameToWeird(f.name));
        view.setUint16(fileOffset+4,512);
        view.setUint16(fileOffset+6,nameToOffset(f.name));
        view.setUint32(fileOffset+8,0);
        view.setUint32(fileOffset+12,0);
        filesIncluded++;
      }
      buffer.set(te.encode(f.root?"ROOT":f.name.slice(0,4).toUpperCase()),pointer);
      view.setUint32(pointer+4,f.root?nameTable[0].lenght:nameToOffset(f.name));
      view.setUint16(pointer+8,f.root?0:nameToWeird(f.name));
      let files = Object.keys(f.files).length;
      view.setUint16(pointer+10,files);
      view.setUint32(pointer+12,filesIncluded);
      pointer+=16;
      for(let k of Object.keys(f.files)){
        let data = f.files[k];
        let isFile = (data instanceof Uint8Array) || (data instanceof ArrayBuffer);
        data = isFile?new Uint8Array(data):data;
        view.setUint16(fileOffset+20*filesIncluded,isFile?fileID:2**16-1);
        view.setUint16(fileOffset+2+20*filesIncluded,nameToWeird(k));
        view.setUint16(fileOffset+4+20*filesIncluded,isFile?4352:512);
        view.setUint16(fileOffset+6+20*filesIncluded,nameToOffset(k));
        view.setUint32(fileOffset+8+20*filesIncluded,isFile?dataLength:folders.indexOf(folders.find(f=>f.name==k)));
        view.setUint32(fileOffset+12+20*filesIncluded,isFile?data.length:16);
        if(isFile)
          buffer.set(data,dataOffset+dataLength);
        dataLength+=isFile?data.length:0;
        fileID+=isFile?1:0
        filesIncluded++;
      }
    }
    
    pointer = nameTableOffset;
    for(let n of nameTable){
      buffer.set(te.encode(n),pointer);
      pointer+=n.length+1;
    }
    return new Promise(res=>res(buffer));
  },
  unpackFileSystemHandle(file){
    let fileReader = new FileReader();
    return new Promise(res=>{
      file.getFile().then(f=>{
        fileReader.onload = ()=>RARC.unpackArrayBuffer(fileReader.result).then(res);
        fileReader.readAsArrayBuffer(f);
      });
    });
  },
  unpackArrayBuffer(file){
    return new Promise((res,rej)=>{
      let output = {};
      let array = new Uint8Array(file);
      if(new TextDecoder().decode(array.slice(0,4))!="RARC")
        return rej(new Error("The input file is not a RARC file"));
      let arc = new DataView(array.buffer);
      let pointer = 12;
      let dataOffset = arc.getUint32(pointer)+32;
      pointer+=20;
      let folderCount = arc.getUint32(pointer);
      pointer+=12;
      let fileOffset = arc.getUint32(pointer)+32;
      pointer+=8;
      let tableOffset = arc.getUint32(pointer)+32;
      pointer+=12;
      let headerSize = pointer;
      let nodeSize = 4+4+2+2+4;
      let getName = function(offset){
        let start = tableOffset+offset;
        let end = start;
        while(array[end]!=0)end++;
        return new TextDecoder().decode(array.slice(start,end));
      }
      let RarcFolder = function(index){
        let pointer = headerSize+nodeSize*index;
        this.index = index;
        this.isRoot = arc.getUint32(pointer)==21071;
        pointer+=4;
        this.namePointer = arc.getUint32(pointer);
        this.name = getName(this.namePointer);
        pointer+=6;
        this.fileCount = arc.getUint16(pointer);
        pointer+=2;
        this.firstFileOffset = arc.getUint32(pointer);
        this.path = [];
      }
      let rf = new RarcFolder(0);
      if(rf.name!=""){
        rf.path = [rf.name];
        output[rf.name] = {};
      }
      let fileDataSize = 2+4+2+4+4+4;
      let RarcFileData = function(index,node){
        let pointer = fileOffset+(node.firstFileOffset+index)*fileDataSize;
        this.id = arc.getUint16(pointer);
        pointer+=6;
        this.name = getName(arc.getUint16(pointer));
        pointer+=2;
        this.dataOffset = arc.getUint32(pointer);
        pointer+=4;
        let ds = arc.getUint32(pointer);
        this.data = array.slice(dataOffset+this.dataOffset,dataOffset+this.dataOffset+ds);
      }
      let recursiveFolder = function(rf){
        let o = output;
        for(let p of rf.path)
          o = o[p];
        for(let i=0;i<rf.fileCount;i++){
          let rfd = new RarcFileData(i,rf);
          if(rfd.id==0xFFFF){
            if(rfd.name!="." && rfd.name!=".."){
              let rfn = new RarcFolder(rfd.dataOffset);
              console.log(rfd,rfn)
              o[rfd.name] = {};
              rfn.path = rf.path.concat([rfd.name]);
              recursiveFolder(rfn);
            }
            continue;
          }
          o[rfd.name] = rfd.data;
        }
      }
      recursiveFolder(rf);
      res(output);
    });
  }
}

if(!RegExp.escape)
  RegExp.escape = string=>string.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

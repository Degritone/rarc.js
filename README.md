#### How to Use
To unpack a RARC file, either provide a FileSystemHandle of the .arc file to RARC.unpackFileSystemHandle or either a Uint8Array or ArrayBuffer to RARC.unpackArrayBuffer. For example, if you were to enable drag and drop onto your page, you could do:
```js
let dropFiles = async function(e){
  e.preventDefault();
  if(e.dataTransfer.files[0].name.match(/.arc$/)){
    e.dataTransfer.items[0].getAsFileSystemHandle().then(RARC.unpackFileSystemHandle).then(unpacked=>{
      //Use the unpacked file here
    });
  }
}
```
To pack files into a RARC, you can provide a FileSystemHandle of the folder you wish to pack into a .arc to RARC.packFileSystemHandle or provide an with the following structure to RARC.packArrayBufferDictionary:
```js
{
  folderName:{ //folders are represented by objects, with
               //the key associated with said object being the folder's name
    subFolder:{ //folders can have other folders in them
      "fileName.txt":new Uint8Array([1,2,3]), //files are represented by Uint8Arrays
                                              //inside the folder objects, with the key
                                              //associated with the array being the file's name
      ...
    },
    "anotherFile.md":new ArrayBuffer(new UintArray([4,5,6])), //also supports a raw ArrayBuffer
    "yetAnotherFile.js":new UintArray([7,8,9]),
    ...
  }
}
```
The above is simply an object (or more purely, a dictionary) and is not wrapped in a class. It's simply a file dictionary.

The function signatures are as follows:
```js
RARC.unpackFileSystemHandle(FileSystemHandle) -> Promise -> dictionary
RARC.unpackArrayBuffer(ArrayBuffer)           -> Promise -> dictionary
RARC.unpackArrayBuffer(Uint8Array)            -> Promise -> dictionary
RARC.packFileSystemHandle(FileSystemHandle)   -> Promise -> Uint8Array
RARC.packArrayBufferDictionary(dictionary)    -> Promise -> Uint8Array
```

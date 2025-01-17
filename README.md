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

##### License
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>

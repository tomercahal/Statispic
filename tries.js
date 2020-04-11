// var fs = require('fs')


// STATISPIC_PHOTO_INDEX_FILE_LOCATION = "D:/Statispic/Photos/imageIndex.txt"
// function writeToTextFile(fileLocation, index){
//     fs.writeFileSync(fileLocation, index) // Index is the current index for the photos
// }

// writeToTextFile(STATISPIC_PHOTO_INDEX_FILE_LOCATION, 0)

const spawn = require("child_process").spawn;
const pythonProcess = spawn('python',["tries.py", 1,2,3]);

console.log(2)
pythonProcess.stdout.on('data', (data) =>{
    console.log(data.toString())
})
console.log(4)
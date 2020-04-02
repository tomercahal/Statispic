var fs = require('fs')


STATISPIC_PHOTO_INDEX_FILE_LOCATION = "D:/Statispic/Photos/imageIndex.txt"
function writeToTextFile(fileLocation, index){
    fs.writeFileSync(fileLocation, index) // Index is the current index for the photos
}

writeToTextFile(STATISPIC_PHOTO_INDEX_FILE_LOCATION, 0)
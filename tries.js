var fs = require('fs')

function readFromTextFile(fileLocation){
    console.log(fs.readFileSync(fileLocation, 'utf8'))
}

readFromTextFile("D:/Statispic/statispicPassword.txt")
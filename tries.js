// var fs = require('fs')


// STATISPIC_PHOTO_INDEX_FILE_LOCATION = "D:/Statispic/Photos/imageIndex.txt"
// function writeToTextFile(fileLocation, index){
//     fs.writeFileSync(fileLocation, index) // Index is the current index for the photos
// }

// writeToTextFile(STATISPIC_PHOTO_INDEX_FILE_LOCATION, 0)

// const spawn = require("child_process").spawn; //for the connection with python
// const pythonProcess = spawn('python',["tries.py", 1,2,3]);

// console.log(2)
// pythonProcess.stdout.on('data', (data) =>{
//     console.log(data.toString())
// })
// console.log(4)

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/statispic_database";

// MongoClient.connect(url, function (err, db) {
//     if (err) console.log(err);
//     var dbo = db.db("mydb");
//     dbo.createCollection("picture data", function (err, res) {
//         if (err) throw err;
//         console.log("Collection created!");
//     });
//     var mypic = {dir: "D:/Statispic/Photos/photo1.jpg", likes : "10", user_uploaded: "tomercahal", followers: 942, ratio: "0.1"}
//     dbo.collection("picutre data").insertOne(mypic, function(err, yes){
//         if (err) throw err;
//         console.log("Insetred an item to the collection!")
//         db.close();
//     })
// });

// MongoClient.connect(url, function (err, db) {
//     if (err) throw err;
//     var database = db.db("statispic_database")
//     var testPic = { dir: "D:/Statispic/Photos/photo1.jpg", likes: 11, user_uploaded: "tomercahal", followers: 942, ratio: "0.1" }
//     database.collection("Picutre data").insertOne(testPic, function (err, yes) {
//         if (err) throw err;
//         console.log("Insetred an item to the collection!")
//         db.close();
//     })
// });
const util = require("util")
var objectt = {name: "tomer", call: "wassup dude?"}
console.log(util.inspect(objectt, false, null, true))


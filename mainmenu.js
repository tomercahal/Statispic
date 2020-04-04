const { app } = require('electron')
const prompt = require('electron-prompt');
var api = require('instagram-private-api');
var fs = require('fs');
//var mongo = require('mongodb') // Importing MongoDB database
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
const download = require('image-downloader')
// Download to a directory and save with an another filename

var options = {
    url: 'http://someurl.com/image2.jpg',
    dest: 'stam.jpg'      // Save to the current dir. 
}
var photoString = 'Photos/'
var jpgString = '.jpg'

function readFromTextFile(fileLocation){
    return fs.readFileSync(fileLocation, 'utf8')
}

STATISPIC_PHOTO_INDEX_FILE_LOCATION = "D:/Statispic/Photos/imageIndex.txt"
function writeToTextFile(fileLocation, index){
    fs.writeFileSync(fileLocation, index) // Index is the current index for the photos
}

function AppendListToTextFile(list_data) {
    var textfile = fs.createWriteStream('Photos/statispicData.txt', { flags: 'a' }) // 'a' means appending (old data will be preserved)
    for (i = 0; i < list_data.length; i++) {
        textfile.write(list_data[i])
    }
}

var account = { // for the instagram API login
    accName: 'statispic_test',
    password: readFromTextFile("D:/Statispic/statispicPassword.txt") // Change the file if there is a new password
}


//const IG_USERNAME = 'romi.bennun'//'tomercahal' // The username that I will download the photos from

function TryDatabase() {
    MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
        if (err) throw err;
        console.log("Database created!");
        db.close();
    });
}

async function getUserName(){
    var data = await prompt({
        title: 'Add user\'s photos to the database',
        label: 'Enter username:',
        value: '',
        inputAttrs: {
            type: 'text'
        },
        type: 'input',
        width : 500,
        height : 175
    })
    return data
}

async function runInstagarm() {
    const IG_USERNAME = await getUserName() //'tomercahal' The username that I will download the photos from
    const ig = new api.IgApiClient();

    ig.state.generateDevice(IG_USERNAME);

    (async () => {
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(account.accName, account.password);
        process.nextTick(async () => await ig.simulate.postLoginFlow());
        retUser = await ig.user.searchExact(IG_USERNAME) //The amount of followers that the user has
        retInfo = await ig.user.info(retUser.pk)
        userFollowersCount = retInfo.follower_count
        // userFollowersAmount = await ig.user.searchExact(retUser.pk) //The amount of followers that the user has
        const userFeed = ig.feed.user(retUser.pk);
        var postsFoundCounter = 0
        var amountOfPhotos = 0
        var imageIndex = readFromTextFile(STATISPIC_PHOTO_INDEX_FILE_LOCATION) // Keeping track of the images indexes so that the program won't override images.
        var dataFromAccount = [] // Used to contain all the data that will go into the text file
        do {
            const myPostsFirstPage = await userFeed.items();
            for (i = 0; i < myPostsFirstPage.length; i++) {
                if (myPostsFirstPage[i].media_type === 1) {
                    console.log(myPostsFirstPage[i].image_versions2.candidates[0].url)
                    var postURLToDownload = myPostsFirstPage[i].image_versions2.candidates[0].url
                    amountOfPhotos++;
                    console.log("The amount of likes for the post is " + myPostsFirstPage[i].like_count)
                    console.log("The page it was taken from: " + myPostsFirstPage[i].user.username)
                    photo_likes = myPostsFirstPage[i].like_count
                    photo_username =  myPostsFirstPage[i].user.username
                    console.log(myPostsFirstPage[i])
                    imageIndex++; // ImageIndex starts off as 0 and needs to be incremented every new image that we are saving.
                    var photoIndex =  "photo" + imageIndex + jpgString // In Javascript strings are immutable (can't change)
                    var destName = photoString + photoIndex
                    options.url = postURLToDownload
                    options.dest = destName
                    console.log(options)
                    download.image(options)
                        .then(({ filename, image }) => {
                        })
                        .catch((err) => console.error(err))
                    dataFromAccount.push("\r\n" + photoIndex + " " + photo_likes + " " + photo_username + " " + userFollowersCount + " " + (photo_likes/userFollowersCount))
                }
                
            }
                console.log(myPostsFirstPage.length + ' More Avaliable.');
                console.log("Is there another field to pull from? " + userFeed.moreAvailable)
                postsFoundCounter = postsFoundCounter + myPostsFirstPage.length          
        }
        while (userFeed.moreAvailable);

        writeToTextFile(STATISPIC_PHOTO_INDEX_FILE_LOCATION, imageIndex)
        AppendListToTextFile(dataFromAccount) //Appending all the latest user photo data into the text file
        console.log('found: ' + postsFoundCounter + ' posts')
        console.log("total amount of photos is: " + amountOfPhotos)
    })();
}

module.exports = [{
    label: 'run',
    submenu: [{
        label: 'Load Instagram user photos to the database',
        click: () => {
            runInstagarm()
        }
    },
    {
        label: 'Test database',
        click: () => {
            TryDatabase()
        }

    }]
}]

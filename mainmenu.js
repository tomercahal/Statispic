const { app, shell, dialog, browserWindow, Notification } = require('electron')
const prompt = require('electron-prompt');
var api = require('instagram-private-api');
var fs = require('fs');
const util = require('util')

//MongoDB stuff, will use them in try database and when adding each image into the database
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";

const download = require('image-downloader') // Download to a directory and save with an another filename



var ig = new api.IgApiClient();

var options = {
    url: 'http://someurl.com/image2.jpg',
    dest: 'stam.jpg'      // Save to the current dir. 
}
var photoString = 'Photos/' // The sub folder that the photos are in
var jpgString = '.jpg'
const dir_pictures = "D:/Statispic/Photos/"

var filters_file_explorer = [{ name: 'Images', extensions: ['jpg'] }] //only jpgs because that's what I download from Instagram and what the ML model expects

function readFromTextFile(fileLocation) {
    return fs.readFileSync(fileLocation, 'utf8')
}

STATISPIC_PHOTO_INDEX_FILE_LOCATION = "D:/Statispic/Photos/imageIndex.txt"
function writeToTextFile(fileLocation, index) {
    fs.writeFileSync(fileLocation, index) // Index is the current index for the photos
}

function AppendListToTextFile(list_data) {
    var textfile = fs.createWriteStream('Photos/statispicData.txt', { flags: 'a' }) // 'a' means appending (old data will be preserved)
    for (i = 0; i < list_data.length; i++) {
        textfile.write(list_data[i])
    }
}

var account = { // for the instagram API login
    accName: 'statispic',
    password: readFromTextFile("D:/Statispic/statispicPassword.txt") // Change the file if there is a new password
}


//const IG_USERNAME = 'romi.bennun'//'tomercahal' // The username that I will download the photos from

function InsertToDatabase(picData) {
    MongoClient.connect(url, function (err, db) {
        if (err) console.log(err);
        var database = db.db("statispic_database")
        database.collection("statispic_database").insertOne(picData, function (err, yes) {
            if (err) console.log(err)
            console.log("Successfully inserted a picture to the database! Here are the image details:")
            console.log(util.inspect(picData, false, null, true))
        })
    })
}


async function openPromptBox(title_info, label_info) {
    var data = await prompt({
        title: title_info,
        label: label_info,
        value: '',
        inputAttrs: {
            type: 'text'
        },
        type: 'input',
        width: 500,
        height: 175
    })
    return data
}

async function openPromptLoginBox() { // might user later to ask for login info
    var data = await prompt({
        title: "Login to Instagram",
        label: "Username:",
        value: '',
        inputAttrs: {
            type: 'text'
        },
        type: 'input',
        width: 500,
        height: 175
    })
}

async function dologin() {
    ig.state.generateDevice(account.accName);

    await ig.simulate.preLoginFlow();
    var loggedInUser = await ig.account.login(account.accName, account.password);
    process.nextTick(async () => await ig.simulate.postLoginFlow());
    console.log("Successfully logged in!!!")
    noti = new Notification({title: "Loggged in successfully!"})
    noti.show()
}

async function analyze() {
    dirs = dialog.showOpenDialogSync(browserWindow, { title: "Statispic!!", buttonLabel: "Let's rock!", filters: filters_file_explorer, properties: ["multiSelections"] })
    console.log(dirs)
    let myNotification = new Notification('Error', { body: "Invalid username/password" }) // Just testing notification 
    myNotification.show()
}
async function runInstagarm() {

    const IG_USERNAME = await openPromptBox('Add user\'s photos to the database', 'Enter username:') //'tomercahal' The username that I will download the photos from
    const ig = new api.IgApiClient();

    ig.state.generateDevice(IG_USERNAME);

    (async () => {
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(account.accName, account.password);
        process.nextTick(async () => await ig.simulate.postLoginFlow());
        retUser = await ig.user.searchExact(IG_USERNAME) //The amount of followers that the user has
        retInfo = await ig.user.info(retUser.pk)
        userFollowersCount = retInfo.follower_count
        const userFeed = ig.feed.user(retUser.pk);
        var postsFoundCounter = 0
        var amountOfPhotos = 0
        var imageIndex = readFromTextFile(STATISPIC_PHOTO_INDEX_FILE_LOCATION) // Keeping track of the images indexes so that the program won't override images.
        var dataFromAccount = [] // Used to contain all the data that will go into the text file
        do {
            const myPostsFirstPage = await userFeed.items(); // needs to be await
            for (i = 0; i < myPostsFirstPage.length; i++) {
                if (myPostsFirstPage[i].media_type === 1) {
                    var postURLToDownload = myPostsFirstPage[i].image_versions2.candidates[0].url
                    amountOfPhotos++;
                    photo_likes = myPostsFirstPage[i].like_count
                    photo_username = myPostsFirstPage[i].user.username
                    imageIndex++; // ImageIndex starts off as 0 and needs to be incremented every new image that we are saving.
                    var photoIndex = "photo" + imageIndex + jpgString // In Javascript strings are immutable (can't change)
                    var destName = photoString + photoIndex
                    options.url = postURLToDownload
                    options.dest = destName
                    download.image(options)
                        .then(({ filename, image }) => {
                        })
                        .catch((err) => console.error(err))

                    pic_data_to_db = {
                        dir_location: dir_pictures + photoIndex, likes: photo_likes,
                        user_uploaded: photo_username, followers: userFollowersCount,
                        success_ratio: (photo_likes / userFollowersCount)
                    }
                    InsertToDatabase(pic_data_to_db)
                    dataFromAccount.push("\r\n" + dir_pictures + photoIndex + " " + photo_likes + " " + photo_username + " " + userFollowersCount + " " + (photo_likes / userFollowersCount))
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
        var noti = new Notification({title:"Finished!", body: "I went through " + photo_username + "'s account and I saved " + amountOfPhotos + " total pictures."})
        noti.show()
    })
        ();
}

async function uploadInstagram() {
    console.log('Publishing photo')
    ig.publish.photo({ file: fs.readFileSync("Photos/try.jpg"), caption: "This is a test upload" }) // The file needs to be in the allowed size, still need to check for that
        .then(publishResult => {
            console.log('Photo post return media id: ' + publishResult.media.id);
        })
        .catch(e => {
            // error during post photo 
            console.log('--- Error --- sendPostForAccount [pAccount.ig.publish.photo] error:' + e.message);
        })

}

async function displayInstagramProfile() {
    var profileName = await openPromptBox('View Your Instagram Profile', 'Enter username:') //'tomercahal' The username that I will download the photos from
    shell.openExternal("https://www.instagram.com/" + profileName + "/")
    var noti = new Notification({ title: "Showing now", body: "Opening up " + profileName + "'s Instagram profile in your browser." })
    noti.show()
}


module.exports = [{
    label: 'Actions',
    submenu: [
        {
            label: 'Login to Instagram',
            click: () => {
                dologin()
            }
        },
        {
            label: 'Load Instagram user photos to the database',
            click: () => {
                runInstagarm()
            }
        },
        {
            label: 'Upload photo to Instagram',
            click: () => {
                uploadInstagram()
            }
        },
        {
            label: 'Analyze photos',
            click: () => {
                analyze()
            }

        },
        {
            label: 'View Instagram Profile',
            click: () => {
                displayInstagramProfile()
            }
        },
        { type: 'separator' }, //Creating a space between the the options and the quit option 
        {
            label: "Exit",
            click() {
                app.quit()
            }
        }
    ]
}]

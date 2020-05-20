const { app, shell, dialog, browserWindow, Notification } = require('electron')
const prompt = require('electron-prompt');
var api = require('instagram-private-api');
var fs = require('fs');
const util = require('util')
const loginInstagram = require('./instagram') //Includes the login function and the cookies.

//MongoDB stuff, will use them in try database and when adding each image into the database
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";

const download = require('image-downloader') // Download to a directory and save with an another filename

const spawn = require("child_process").spawn; //for the connection with python, calling the python script

let account2;

let LOGGEDIN = false;

var options = {
    url: 'http://someurl.com/image2.jpg',
    dest: 'stam.jpg' // Save to the current dir. 
}

var photoString = 'Photos/' // The sub folder that the photos are in
var jpgString = '.jpg'
const dir_pictures = "./Photos/"

var filters_file_explorer = [{
    name: 'Images',
    extensions: ['jpg']
}] //only jpgs because that's what I download from Instagram and what the ML model expects

function readFromTextFile(fileLocation) {
    return fs.readFileSync(fileLocation, 'utf8')
}

STATISPIC_PHOTO_INDEX_FILE_LOCATION = "D:/Statispic2/Photos/imageIndex.txt"

var SIDE_LOGGED_IN = false // Holds weather the side log in happaned already so I won't do it twice

var account = { // for the user instagram api login
    accName: "statispic",
    accPassword: "statispic2020" // need to change according to the corrrect login credintials 
}
//account.ig = new api.IgApiClient()


function writeToTextFile(fileLocation, index) {
    fs.writeFileSync(fileLocation, index) // Index is the current index for the photos
}

function AppendListToTextFile(list_data) {
    var textfile = fs.createWriteStream('Photos/statispicData.txt', {
        flags: 'a'
    }) // 'a' means appending (old data will be preserved)
    for (i = 0; i < list_data.length; i++) {
        textfile.write(list_data[i])
    }
}


async function openPromptBox(title_info, label_info) { // A function used to open a prompt box to get input from the user, give title and the message.
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

async function showNotification(notificationOptions) {
    //This is a function that recieves notification options, it then created a notification and shows it to the user.
    var noti = new Notification(notificationOptions)
    noti.show()
}

function fileExplorerOuptut(singleOrMulti) { ///Single or multi is property that is being passed to dialog. It changes the option that the user can choose multiple photos or not
    if (singleOrMulti)
        dirs = dialog.showOpenDialogSync(browserWindow, { // Getting file explorer output from user (multiple files)
            title: "Statispic!!",
            buttonLabel: "Let's rock!",
            filters: filters_file_explorer,
            properties: "multiSelections"
        })
    else
        dirs = dialog.showOpenDialogSync({ // Getting file explorer output from user (one files)
            title: "Statispic!!",
            buttonLabel: "Let's rock!",
            filters: filters_file_explorer
        })
    if (typeof dirs == 'undefined') //means the user has pressed x
    {
        console.log("The user has pressed x on the file explorer")
        return null
    }
    dirs = dirs.toString()
    console.log(dirs)
    return dirs // Retutning the images paths
}

function InsertToDatabase(picData) { // Inserting the MongoDB document to the database
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

function checkIfLoggedIn() {
    if (LOGGEDIN) //Checking if the user has logged in yet
        return true
    return false
}

async function getUsernameAndPassword() {
    console.log('PRE LOGGING IN')
    do {
        var usernameInput = await openPromptBox("Login to instagram", "Enter the username: ") // Getting the username input
        if (usernameInput == null) //Meaning that the user has pressed x.
            return false
        else if (usernameInput == "") {
            dialog.showMessageBox({
                type: "error",
                title: "Uh Oh!",
                message: "Error. The username you entered in invalid :( Please try and login again."
            })
            continue
        }
        try {
            retAcc = await accAlwaysIn.ig.user.searchExact(usernameInput) // Checking if the user exists
            console.log("valid username! The username entered is: " + usernameInput)
            account.accName = usernameInput //Putting the valid username into the account username field.
        } catch (e) {
            // error during post photo 
            console.log('--- Error --- The username entered is not found. The error message recieved from Instagram: ' + e.message);
            dialog.showMessageBox({ // Show error message box because it is invalid username
                type: "error",
                title: "Uh Oh!",
                message: "Error. The username you entered in invalid :( Please try and login again."
            })
            return false
        }
    }
    while (account.accName == "" || account.accName == null) // Checking if the username is nothing or the user pressed x
    console.log(account.accName)
    var passwordInput = await openPromptBox("Login to instagram", "Enter the password: ")
    if (passwordInput === null) { //This means that the user has hit x and closed the window.
        console.log("The user has left the enter password prompt box")
        account.accName = "" //Resetting the account.accName to be empty string now.
    }
    console.log("This is the password that he entered: " + passwordInput)
    account.password = passwordInput
    account.ig = new api.IgApiClient()
    account.ig.state.generateDevice(account.accName);
    await account.ig.simulate.preLoginFlow();
    try {
        await account.ig.account.login(account.accName, account.password)
        console.log("Successfull log in!")
        process.nextTick(async () => await account.ig.simulate.postLoginFlow());
        console.log('POST LOGGING IN')
        return true
    } catch (e) { //Error occured during log in.
        console.log('--- Error --- The password entered does not match the user. The error message recieved from Instagram: ' + e.message);
        dialog.showMessageBox({
            type: "error",
            title: "Uh Oh!",
            message: "Error. The password entered does not match the user :( Please try and log in again."
        })
        account.accName = ""
        account.password = ""
        return false
    }
}

async function dologin(fromfunc) { //fromfunc includes details weather dologin was called from a func or not
    let promise = new Promise(resolve => {
        // if (fromfunc){
        //     buttons_available = ["Stay on " + account.accName, "Login to a new account"]
        //     response = dialog.showMessageBoxSync({
        //         type: "info", buttons: buttons_available, title: "New sign in?", message: "Would you like to sign in with" +
        //         "a new account?\r\nNote: The current sign in will not be saved and you will need to log in again later in order to use that account."
        //     }) // response holds the index of the clicked button
        //     console.log("The user has clicked: "+ buttons_available[response] + " button." )
        //     if (response === 1)// It means that the user has pressed fine
        //         await getUsernameAndPassword()// If he didn't press fine then he pressed login
        //     else
        //         return
        // }
        // else {}
        getUsernameAndPassword()
            .then(loggedInStatus => {
                console.log(loggedInStatus)
                if (loggedInStatus) {
                    LOGGEDIN = true
                    showNotification({
                        title: account.accName + " has loggged in successfully!"
                    })
                    resolve(true)
                } else if (loggedInStatus == false) {
                    console.log("The user has left without logging in")
                    console.log(account)
                    resolve(false)
                }
            })
            .catch(e => {
                console.log(e.message)
                resolve(false)
            })
    })
    let result = await promise;
    // console.log('after result')
    return result;

}

async function analyze() {
    dirs = dialog.showOpenDialogSync(browserWindow, {
        title: "Statispic!!",
        buttonLabel: "Let's rock!",
        filters: filters_file_explorer,
        properties: ["multiSelections"]
    })
    //console.log(dirs)
    str_arg = ""
    for(i=0; i<dirs.length;i++){
        //console.log(dirs[i])
        str_arg += dirs[i] + " "
    }
    //console.log(str_arg)
    str_arg = str_arg.slice(0, str_arg.length -1)
    //console.log(str_arg)
    const pythonProcess = spawn('python',["D:/Statispic2/ML/statispic_model_predict.py", str_arg]);

    pythonProcess.stdout.on('data', (data) =>{
        console.log(data.toString())
    })

}

async function runInstagarm() {

    var IG_USERNAME = await openPromptBox('Add user\'s photos to the database', 'Enter username:') //'tomercahal' The username that I will download the photos from
    if (IG_USERNAME === null)
        return //This happens when the user has pressed x to quit.
    (async () => {
        retUser = await accAlwaysIn.ig.user.searchExact(IG_USERNAME) //The amount of followers that the user has
        retInfo = await accAlwaysIn.ig.user.info(retUser.pk) // Getting the profile info and much more about the user using his pk (like id)
        userFollowersCount = retInfo.follower_count
        const userFeed = accAlwaysIn.ig.feed.user(retUser.pk); // Getting the feed of the user.
        var postsFoundCounter = 0
        var amountOfPhotos = 0 // Total amount of posts.
        var imageIndex = readFromTextFile(STATISPIC_PHOTO_INDEX_FILE_LOCATION) // Keeping track of the images indexes so that the program won't override images.
        var dataFromAccount = [] // Used to contain all the data that will go into the text file
        do {
            const myPostsFirstPage = await userFeed.items(); // needs to be await
            for (i = 0; i < myPostsFirstPage.length; i++) {
                if (myPostsFirstPage[i].media_type === 1) { // Checking if it an image(1), video(2), carousel (8)
                    var postURLToDownload = myPostsFirstPage[i].image_versions2.candidates[0].url // Getting the valid url of the image
                    amountOfPhotos++;
                    photo_likes = myPostsFirstPage[i].like_count
                    photo_username = myPostsFirstPage[i].user.username
                    imageIndex++; // ImageIndex starts off as 0 and needs to be incremented every new image that we are saving.
                    var photoIndex = "photo" + imageIndex + jpgString // Building a unique image name photo, for example: photo1.jpg and photo2.jpg
                    var destName = photoString + photoIndex // Building the full path to the image location
                    options.url = postURLToDownload // Giving the url to download from 
                    options.dest = destName // Giving the download path (where the image will be saved + the name of it)
                    download.image(options)
                    .catch((err) => console.error(err)) // Might get an error.

                    pic_data_to_db = { // Building the document to upload to MongoDB
                        dir_location: dir_pictures + photoIndex,
                        likes: photo_likes,
                        user_uploaded: photo_username,
                        followers: userFollowersCount,
                        success_ratio: (photo_likes / userFollowersCount)
                    }
                    InsertToDatabase(pic_data_to_db) // A function that upload the document to MongoDB
                    dataFromAccount.push("\r\n" + dir_pictures + photoIndex + " " + photo_likes + " " + photo_username + " " + userFollowersCount + " " + (photo_likes / userFollowersCount))
                }

            }
            console.log(myPostsFirstPage.length + ' More Avaliable.');
            console.log("Is there another field to pull from? " + userFeed.moreAvailable)
            postsFoundCounter = postsFoundCounter + myPostsFirstPage.length
        }
        while (userFeed.moreAvailable && amountOfPhotos <= totalAmountOfPhotosToDownload); //Enter how many max photos(close to)

        writeToTextFile(STATISPIC_PHOTO_INDEX_FILE_LOCATION, imageIndex)
        AppendListToTextFile(dataFromAccount) //Appending all the latest user photo data into the text file
        console.log('found: ' + postsFoundCounter + ' posts')
        console.log("total amount of photos is: " + amountOfPhotos)
        await showNotification({
            title: "Finished!",
            body: "I went through " + photo_username + "'s account and I saved " + amountOfPhotos + " total pictures."
        })
    })
        ();
}

async function uploadPhotoToInstagram() {
    dir = fileExplorerOuptut(false) // "Photos/upload_tries/try4.jpg"
    console.log(dir)
    if (dir === null)
        return //This happens when the user has pressed x to quit.
    if (!checkIfLoggedIn()) {
        buttons_available = ["Quit photo upload mode", "Login"]
        response = dialog.showMessageBoxSync({
            type: "warning",
            buttons: buttons_available,
            title: "Cannot perform requested function",
            message: "Error, in order to upload " +
                "an image to Instagram you must log in first."
        }) // response holds the index of the clicked button
        console.log("The user has clicked: " + buttons_available[response] + " button.")
        if (response === 1) { // It means that the user has pressed login
            //await loginInstagram.ig_doLogin(account)
            dologin()
            .then(result => {
                // console.log("result is:" + result)
                // if (result) {
                //Uploder()
                console.log('Publishing photo')
                account.ig.publish.photo({
                    file: fs.readFileSync(dir),
                    caption: "This is a test upload"
                }) // The file needs to be in the allowed size, still need to check for that
                    .then(publishResult => {
                        if (typeof publishResult.media.id == 'undefined') //Checking if the image has been successfully uploaded (if it has an id)
                            dialog.showMessageBox({
                                type: "error",
                                title: "Uh Oh!",
                                message: "Error. Instagram had some trouble uploading your picture.\r\n" +
                                    "The problem is usually in the image size/aspect ration, please try again later."
                            })
                        else {

                            console.log('The photo is up on Instagram! Photo post media id: ' + publishResult.media.id);

                            showNotification({
                                title: "Image successfully uploaded!!",
                                body: "The image is now up on " + account.accName + "'s Instagram profile"
                            })
                        }
                    })
                    .catch(e => {
                        // error during post photo 
                        console.log('--- Error --- upload post to main logged in account [account.ig.publish.photo] error:' + e.message);
                        dialog.showMessageBox({
                            type: "error",
                            title: "Uh Oh!",
                            message: "Error. Instagram had some trouble uploading your picture.\r\n"
                        })
                    })
                })
            //})

        } else
            return
    }
    else {
        Uploder()
    }
}

async function Uploder() {
    photoCaption = await openPromptBox("The caption for your photo", "Enter the caption: ") // Getting the image caption from the user
    console.log('Publishing photo')
    console.log(photoCaption)
    account.ig.publish.photo({
        file: fs.readFileSync(dir),
        caption: photoCaption
    }) // The file needs to be in the allowed size, still need to check for that
        .then(publishResult => {
            if (typeof publishResult.media.id == 'undefined') //Checking if the image has been successfully uploaded (if it has an id)
            {
                dialog.showMessageBox({
                    type: "error",
                    title: "Uh Oh!",
                    message: "Error. Instagram had some trouble uploading your picture.\r\n" +
                        "The problem is usually in the image size/aspect ration, please try again later."
                })
                console.log(publishResult)
            }
            else {

                console.log('The photo is up on Instagram! Photo post media id: ' + publishResult.media.id);

                showNotification({
                    title: "Image successfully uploaded!!",
                    body: "The image is now up on " + account.accName + "'s Instagram profile"
                })
            }
        })
        .catch(e => {
            // error during post photo 
            console.log('--- Error --- upload post to main logged in account [account.ig.publish.photo] error:' + e.message);
            dialog.showMessageBox({
                type: "error",
                title: "Uh Oh!",
                message: "Error. Instagram had some trouble uploading your picture.\r\n"
            })
        })
}


async function displayInstagramProfile() {
    var profileName = await openPromptBox('View Your Instagram Profile', 'Enter username:') //'tomercahal' The username that I will download the photos from
    if (profileName === null) //This means that the user has pressed on the x to close the tab.
        return
    shell.openExternal("https://www.instagram.com/" + profileName + "/") // Opening the browser
    await showNotification({ // Showing the Toast notification to the user
        title: "Showing now",
        body: "Opening up " + profileName + "'s Instagram profile in your browser."
    })
}

async function tries() {
    //dialog.showErrorBox("Error this is real bad g", "oh no")
    //dialog.showMessageBox({type: "warnig", buttons: ["ok", "bet"], title: "Oh shit!", message: "Oh no this is not looking good!"})
    //dialog.showMessageBox({ type: "error", title: "Uh Oh!", message: "Error. Instagram had some trouble uploading your picture.\r\nThe problem is usually in the image size/aspect ration, please try again later." })
    // const ig = new api.IgApiClient();

    // ig.state.generateDevice("tomercahal");
    // retUser = await ig.user.searchExact("123456255jldjflsjg") //The amount of followers that the user has
    // console.log(retUser)
    response = dialog.showMessageBoxSync({
        type: "warning",
        buttons: ["login", "fine"],
        title: "Cannot perform requested function",
        message: "Error, in order to download and add the images" +
            "to the database you must log in first."
    })
    console.log(response)
    //var l = openPromptBox("","")
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
// this will run first
// var accAlwaysIn = { // for the instagram API login
//     accName: 'statispic',
//     accPassword: 'statispic2020'
// }
// console.log("Started the account always in login")
// loginInstagram.ig_doLogin(accAlwaysIn) //Logs in to the always in account from the cookie, if not available then creates cookie.
// console.log("Finished the account always in login")


module.exports = [{
    label: 'Actions',
    submenu: [{
        label: 'Login to Instagram',
        click: () => {
            dologin()
        }
    },
    {
        label: 'tries',
        click: () => {
            tries()
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
            uploadPhotoToInstagram()
        }
    },
    {
        label: 'Analyze photos',
        click: () => {
            analyze()
        }

    },
    {
        label: 'View an Instagram Profile',
        click: () => {
            displayInstagramProfile()
        }
    },
    {
        type: 'separator'
    }, //Creating a space between the the options and the quit option 
    {
        label: "Exit",
        click() {
            app.quit()
        }
    }
    ]
}]
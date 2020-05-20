const Bluebird = require('bluebird');
var fs = require('fs');
var api = require('instagram-private-api');
var request = require('request-promise');

const {promisify} = require('util');
const {
    writeFile,
    readFile,
    exists
} = require('fs');

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);
const existsAsync = promisify(exists);

const cookiesDirectory = './cookie/'

const IgCheckpointError = api.IgCheckpointError


async function getPromptInput(title, label, defaultValue) {
    let promise = new Promise(resolve => {
        let code = prompt({
                title: title,
                label: label + ':',
                value: defaultValue,
                inputAttrs: {
                    type: 'text'
                },
                type: 'input'
            })
            .then(code => {
                resolve(code);
            })
    })
    let result = await promise;
    return result;
}

async function saveState(ig) {
    var stateFileName = cookiesDirectory + ig.accName + '.json';
    const cookies = await ig.state.serializeCookieJar();
    const stateAndCookie = {
        cookies: cookies,
        deviceString: ig.state.deviceString,
        deviceId: ig.state.deviceId,
        uuid: ig.state.uuid,
        phoneId: ig.state.phoneId,
        adid: ig.state.adid,
        build: ig.state.build,
    };
    // return writeFileAsync('state.json', JSON.stringify(stateAndCookie), { encoding: 'utf8' });
    return writeFileAsync(stateFileName, JSON.stringify(stateAndCookie), {
        encoding: 'utf8'
    });
}


async function readState(ig) {
    // if (!await existsAsync('state.json')){
    var stateFileName = cookiesDirectory + ig.accName + '.json'
    if (!await existsAsync(stateFileName)) {
        return 'new';
    }

    // await ig.importState(await readFileAsync('state.json', {encoding: 'utf8'}));
    const stateAndCookie = JSON.parse(await readFileAsync(stateFileName, {
        encoding: 'utf8'
    }));
    await ig.state.deserializeCookieJar(stateAndCookie.cookies);
    ig.state.deviceString = stateAndCookie.deviceString;
    ig.state.deviceId = stateAndCookie.deviceId;
    ig.state.uuid = stateAndCookie.uuid;
    ig.state.phoneId = stateAndCookie.phoneId;
    ig.state.adid = stateAndCookie.adid;
    ig.state.build = stateAndCookie.build;

    return 'exist';
}


async function loginToInstagram(ig) {
    // await readState(ig);
    ig.request.end$.subscribe(() => saveState(ig));
    // await ig.account.login(credentials.username, credentials.password);
    Bluebird.try(async () => {
        console.log('From loginToInstagram doing log in: \r\nUsername: ' + ig.accName + '\r\npassword: ' + ig.accPassword)

        const auth = await ig.account.login(ig.accName, ig.accPassword);
        // const auth = await ig.account.login(accname, accPass);
        console.log(ig.accName + ' Has successfully logged in')
    }).catch(IgCheckpointError, async () => {
        console.log(ig.accName + ' Login (ig) Catch IgCheckpointError... ')
        // console.log('Catch IgCheckpointError...')
        console.log(ig.state.checkpoint); // Checkpoint info here
        await ig.challenge.auto(true); // Requesting sms-code or click "It was me" button
        console.log(ig.state.checkpoint); // Challenge info here

        code = await getPromptInput('Security Code', 'code', '******')
        console.log('code: ' + code);
        console.log(await ig.challenge.sendSecurityCode(code));
    });

}


async function ig_doLogin(account, runPostAndPreActions = true) {

    account.ig = new api.IgApiClient()
    account.ig.accName = account.accName;
    account.ig.accPassword = account.accPassword;
    const c_accName = account.accName;

    account.ig.state.generateDevice(account.ig.accName);
    if (runPostAndPreActions) {
        // await account.ig.simulate.preLoginFlow()
    };
    let newLogin = false
    if (await readState(account.ig) === 'new') {
        console.log('New login and create cookie for account: ' + account.accName);
        newLogin = true
    }

    await loginToInstagram(account.ig);

    if (runPostAndPreActions && newLogin) {
        // process.nextTick(async () => await account.ig.simulate.postLoginFlow());
        process.nextTick(async () => {
            account.ig.simulate.postLoginFlow()
                .catch(e => {
                    console.log('error on postLoginFlow for account ' + c_accName)
                })
        });
    }
    await saveState(account.ig);
}

function deleteAccountCookie(accName) {
    fs.unlinkSync(__dirname + '/cookies/' + accName + '.json')
    console.log(utils.runTimeStr() + 'delete cookie for accName: ' + accName);
}

module.exports = {
    ig_doLogin
}
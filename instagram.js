const Bluebird = require('bluebird');
var fs = require('fs');
var api = require('instagram-private-api');

const cookiesDirectory = './cookies_ig/'



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


async function loginToInstagram(ig) {
    // await readState(ig);
    ig.request.end$.subscribe(() => saveState(ig));
    // await ig.account.login(credentials.username, credentials.password);
    Bluebird.try(async () => {
        const auth = await ig.account.login(ig.accName, ig.accPassword);
        console.log(utils.runTimeStr() + ig.accName + ' Login (ig) success to account')
    }).catch(IgCheckpointError, async () => {
        console.log(utils.runTimeStr() + ig.accName + ' Login (ig) Catch IgCheckpointError... ')
        // console.log('Catch IgCheckpointError...')
        console.log(ig.state.checkpoint); // Checkpoint info here
        await ig.challenge.auto(true); // Requesting sms-code or click "It was me" button
        console.log(ig.state.checkpoint); // Challenge info here

        code = await utils.getPromptInput('Security Code', 'code', '******')
        console.log('code: ' + code);
        console.log(await ig.challenge.sendSecurityCode(code));
    });

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
    return fs.writeFileSync(stateFileName, JSON.stringify(stateAndCookie), {
        encoding: 'utf8'
    });
}


async function readState(ig) {
    // if (!await existsAsync('state.json')){
    var stateFileName = cookiesDirectory + ig.accName + '.json'
    if (fs.existsSync(stateFileName)) {
        return 'new';
    }

    // await ig.importState(await readFileAsync('state.json', {encoding: 'utf8'}));
    const stateAndCookie = JSON.parse(await fs.readFileSync(stateFileName, {
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

async function ig_doLogin(account) {

    account.ig = new api.IgApiClient()
    account.ig.accName = account.accName;
    account.ig.accPassword = account.accPassword;
    const c_accName = account.accName;

    account.ig.state.generateDevice(account.ig.accName);
    let newLogin = false
    if (await readState(account.ig) === 'new') {
        console.log(utils.runTimeStr() + 'New login and create cookie for account: ' + account.accName);
        newLogin = true
    }

    await loginToInstagram(account.ig);

    if (newLogin) {
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


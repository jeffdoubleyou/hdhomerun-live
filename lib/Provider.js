const util = require('util');
const EventEmitter = require('events');
const timeout = ms => new Promise(res => setTimeout(res, ms))

const defaultProviderSettings = {
    Provider: 'WOW',
    Page: null,
    Url: 'https://sp.auth.adobe.com/adobe-services/authenticate/saml?noflash=true&mso_id=%s&requestor_id=%s&no_iframe=false&redirect_url=%s',
    ExecutablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    RemoteWsUrl: null,
    UserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
    Debug: false,
    Broswer: null,
    RequestMatch: '/master.m3u8',
    DataDir: './data',
    LoggedIn: false,
    RedirectUrl: null,
    RequestorId: null,
    Username: null,
    Password: null,
};

class Provider extends EventEmitter{
    constructor(args) {
        super();
        if(typeof args != "object")
            args = {};
        this._options = Object.assign({}, defaultProviderSettings, args);
        this._settings = args.settings;
        this._trying_to_login = false;
    }

    get Username() {
        return this._options["Username"];
    }

    set Username(val) {
        this._options["Username"] = val;
    }

    get Password() {
        return this._options["Password"];
    }

    set Password(val) {
        this._options["Password"] = val;
    }

    get RedirectUrl() {
        return this._options["RedirectUrl"];
    }

    set RedirectUrl(val) {
        this._options["RedirectUrl"] = val;
    }

    get RequestorId() {
        return this._options["RequestorId"];
    }

    set RequestorId(val) {
        this._options["RequestorId"] = val;
    }

    get TryingToLogin() {
        return this._trying_to_login;
    }

    set TryingToLogin(val) {
        this._trying_to_login = val;
    }

    get LoggedIn() {
        return this._options["LoggedIn"];
    }

    set LoggedIn(val) {
        this._options["LoggedIn"] = val;
    }

    get DataDir() {
        return this._options["DataDir"];
    }

    set DataDir(val) {
        this._options["DataDir"] = val;
    }

    get Provider() {
        return this._options["Provider"];
    }

    set Provider(val) {
        this._options["Provider"] = val;
    }

    get Url() {
        return this._options["Url"];
    }

    set Url(val) {
        this._options["Url"] = val;
    }

    get Debug() {
        return this._options["Debug"];
    }

    set Debug(val) {
        this._options["Debug"] = val;
    }

    get RemoteWsUrl() {
        return this._options["RemoteWsUrl"];
    }

    set RemoteWsUrl(val) {
        this._options["RemoteWsUrl"] = val;
    }

    get ExecutablePath() {
        return this._options["ExecutablePath"];
    }

    set ExecutablePath(val) {
        this._options["ExecutablePath"] = val;
    }

    get UserAgent() {
        return this._options["UserAgent"];
    }

    set UserAgent(val) {
        this._options["UserAgent"] = val;
    }

    get RequestMatch() {
        return this._options["RequestMatch"];
    }

    set RequestMatch(val) {
        this._options["RequestMatch"] = val;
    }

    get PlaylistUrl() {
        return this._options["PlaylistUrl"];
    }

    set PlaylistUrl(val) {
        this._options["PlaylistUrl"] = val;
    }

    get Puppeteer() {
        if(this._options["Puppeteer"])
            return this._options["Puppeteer"];
        this._options["Puppeteer"] = require('puppeteer');
        return this._options["Puppeteer"];
    }

    async GetPage() {
        console.log("Going to get a browser instance");
        if(this._options["Page"])
            return this._options["Page"];
        let browser = await this.GetBrowser();
        this._options["Page"] = await browser.newPage();
        return this._options["Page"];
    }

    set Page(val) {
        this._options["Page"] = val;
    }

    async GetBrowser() {
        if(this._options["Browser"]) {
            //console.log("Already have a browser");
            return this._options["Browser"];
        }
        console.log("Creating new browser instance");

        if(this.RemoteWsURL) {
            let BrowserSettings = {};
            console.log("Using remote Chrome WS URL: %s", this.RemoteWsURL);
            BrowserSettings.browserURL = this.RemoteWsUrl;
            BrowserSettings.headless = true;
            this._options["Browser"] = await this.Puppeteer.connect(BrowserSettings);
        }
        else {
            let BrowserSettings = { headless: true };
            console.log("Launching chrome application at %s", this.ExecutablePath);
            if(this.Debug == true)
                BrowserSettings.headless = false;
            BrowserSettings.userDataDir = this.DataDir;
            BrowserSettings.executablePath = this.ExecutablePath;
            this._options["Browser"] = await this.Puppeteer.launch(BrowserSettings);
        }

        console.log("Created new browser");
        return this._options["Browser"];

    }

    set Browser(val) {
        this._options["Browser"] = val;
    }

    async Navigate() {
        let _self = this;
        let page = await this.GetPage();
        let url = util.format(this.Url, this.Provider, this.RequestorId, this.RedirectUrl);
        let username = this.Username;
        let password = this.Password;

        let match_url = this.RequestMatch;
        console.log("Going to look for %s at %s", match_url, url);
        this.UserAgent = (await page.evaluate('navigator.userAgent'));

        await page.setRequestInterception(true);

        page.on('request', request => {
            if(request._url.match(match_url)) {
                console.log("Got matching '%s' Playlist URL: %s", match_url, request._url);
                this.PlaylistUrl = request._url;
                this.Ready();
                return true;
            }
            request.continue();
        });

        await Promise.race([
            page.goto(url, {waitUntil: 'networkidle2'}),
            new Promise(x => setTimeout(x, 5000)),
        ]);

        var href = await page.evaluate(() => {
            return location.href
        })
        let auth_url = new URL(href)
        let auth_host = auth_url.origin
        console.log('provider domain', auth_host)

        console.log("U: %s P: %s", username, password);
        await page.evaluate((username, password) => {
            let inputs = Array.from(document.querySelectorAll("form[method=POST] input[type=password]")).filter((f) => f.offsetParent !== null)
            if (inputs.length == 0)
              throw "no login form found"

            let form = inputs[0].form
            form.querySelector("input[type=text], input[type=email]").value = username;
            form.querySelector("input[type=password]").value = password;
            
            form.submit()
        }, username, password)
        await page.waitForNavigation()

        let cookies = await page.cookies("https://sp.auth.adobe.com", "https://api.auth.adobe.com", auth_host)
        let filtered = cookies.filter((c) => c.domain == "sp.auth.adobe.com" || c.domain == "api.auth.adobe.com" || c.domain == auth_url.hostname)
        console.log('cookies', JSON.stringify(filtered))

        this.Player();
        return true;
    }

    async Player() {
        console.log("Try to play video");
		let page = await this.GetPage();
		try {
			await page.waitForSelector('#playerDiv', { timeout: 3000 });
			await page.focus('#playerDiv');
			await page.click('#playerDiv > div.image-wrapper > div > div > div');
		}
		catch {
			console.log('%s No player!', this.GuideName);
		}
    }

    async FindPlaylist() {
        console.log("Try to click on the player");
        this.Player();
    }

    async Close() {
        let browser = await this.GetBrowser();
        browser.close();
        this.Browser = null;
    }

    Ready() {
        this.emit('Ready', this.PlaylistUrl);
        this.Close();
    }
    

}

module.exports = Provider;

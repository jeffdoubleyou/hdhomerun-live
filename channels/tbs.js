var ChannelClass = require('../lib/ChannelClass.js');
const puppeteer = require('puppeteer');
const timeout = ms => new Promise(res => setTimeout(res, ms))

/* 
    NOTE: Since these streams expire pretty regularly, a scan should be done at a regular interval - ScanInterval
*/

class Channel extends ChannelClass {

  constructor(args) {
    super(args);
    this.GuideName = "TBS";
    this.GuideNumber = 1206;
    this.HD = true;
    this.Headers = 'host: turnerlive.akamaized.net';
    this.ScanInterval = 120;
  }

  InitializeChannel() {

        if(this.HasPlaylist(this.ScanInterval)) {
            console.log("Already have playlist URL for channel %s", this.GuideName);
            this.Ready();
            return true;
        }

        if(this.Scanning && this.SkipScan) {
            console.log("Scanning is disabled for %s", this.GuideName);
            this.Ready();
            return true;
        }

        (async() => {
            var browserSettings = {};
            var browser;

            if(this.ChromeRemoteWsURL) {
                console.log("Using remote URL: %s for channel %s", this.ChromeRemoteWsURL, this.GuideName);
                browserSettings.browserURL = this.RemoteWsUrl;
                browserSettings.headless = false;
                browser = await puppeteer.connect(browserSettings);
            }
            else {
                console.log("Launching chrome application at %s for channel %s", this.ChromeExecutablePath, this.GuideName);
                browserSettings.headless =  true;
                if(this.Debug == true)
                    browserSettings.headless = false;
                browserSettings.userDataDir = './data';
                browserSettings.executablePath = this.ChromeExecutablePath;
                browser = await puppeteer.launch(browserSettings);
            }


            const page = await browser.newPage();
            this.UserAgent = (await page.evaluate('navigator.userAgent'));
            await page.setRequestInterception(true);
            page.on('request', request => {
                if(request._url.match('m3u8')) {
                    console.log("Got %s Playlist URL: %s", this.GuideName, request._url);
                    this.PlaylistURL = request._url;
                    this.Available = true;
                    this.Ready();
                    browser.close();
                    return true;
                }
                request.continue();
            });

            await Promise.race([
                page.goto("https://www.tbs.com/watchtbs/" + this._options["Timezone"], {waitUntil: 'networkidle2'}),
                new Promise(x => setTimeout(x, 30000)),
            ]);

            console.log("%s Frame should be loaded", this.GuideName);

            try {
                await page.waitForSelector('#playerDiv', { timeout: 3000 });
                await page.focus('#playerDiv');
                await page.click('#playerDiv > div.image-wrapper > div > div > div');
            }
            catch {
                console.log('%s No player!', this.GuideName);
            }

            try {
                await page.waitForSelector('#mvpdPickerFrame', { timeout: 30000 });
                await page.waitForSelector('#mvpdpicker > div.slates > div.slate.pickbylogo > div > button > span', { timeout: 15000 });
                await page.click('#mvpdpicker > div.slates > div.slate.pickbylogo > div > button > span');
                await page.waitForNavigation();
                console.log("%s Got provider selector", this.GuideName);
            }
            catch {
                console.log("%s No Provider selector", this.GuideName);
            }

            try {
                await page.waitForSelector('#mvpdpicker', { timeout: 30000 });
                await page.focus('#mvpdpicker');
                await page.click('#mvpdpicker > div.slates > div.slate.remembered > div.footer.rememberedfooter > button.rememberedokbutton');            
                await page.waitForSelector('#mvpdpicker > div.slates > div.slate.success');
                await page.waitForSelector('#mvpdpicker > div.slates > div.slate.success > button', { timeout: 30000 });
                console.log("%s Remembered Provider login succeeded", this.GuideName);
                await timeout(5000)
            } catch(err) {
                console.log("%s No provider selector", this.GuideName);
            }

            try {
                await page.waitForSelector('#mvpdpicker > div.slates > div.slate.pickbylogo > div > button > span');
                console.log("%s Provider list now available", this.GuideName);
                await page.waitForSelector('#mvpdpicker > div.slates > div.slate.pickbylogo > div > button');
                console.log("%s Button to show all available", this.GuideName);
                await page.click('#mvpdpicker > div.slates > div.slate.pickbylogo > div > button');
                console.log('%s Button to show all providers clicked', this.GuideName);
                await page.click('li[data-mvpdid="'+this.Provider+'"]')
                console.log("%s Clicked provider name", this.GuideName);
            } catch {
                console.log("Could not find provider list");
            }

            console.log("%s page loading completed", this.GuideName);

            await page.waitFor(30000);
            if(this.PlaylistURL) {
                return;
            }
            else {
                console.log("Timeout on %s", this.GuideName);
                this.Error("Timeout waiting for %s", this.GuideName);
                browser.close();
            }
        })();
    }
}

module.exports = Channel;

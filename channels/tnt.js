var ChannelClass = require('../lib/ChannelClass.js');
const puppeteer = require('puppeteer');
const timeout = ms => new Promise(res => setTimeout(res, ms))

class Channel extends ChannelClass {

  constructor(args) {
    super(args);
    this.GuideName = "TNT";
    this.GuideNumber = 501;
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
            /*const browser = await puppeteer.launch({
                "headless": true,
                "userDataDir": './data',
                "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            });*/

            var browserSettings = {};
            var browser;

            if(this.ChromeRemoteWsURL) {
                browserSettings.browserURL = this.RemoteWsUrl;
                browser = await puppeteer.connect(browserSettings);
            }
            else {
                browserSettings.headless =  true;
                browserSettings.userDataDir = './data';
                browserSettings.executablePath = this.ChromeExecutablePath;
                browser = await puppeteer.launch(browserSettings);
            }

            const page = await browser.newPage();
            this.UserAgent = (await page.evaluate('navigator.userAgent'));
            await page.setRequestInterception(true);
            page.on('request', request => {
                if(request._url.match('m3u8') && !this.PlaylistURL) {
                    console.log("Got TNT Playlist URL: ", request._url);
                    this.PlaylistURL = request._url;
                    this.Available = true;
                    this.Ready();
                    browser.close();
                    return true;
                }
                request.continue();
            });

            await Promise.race([
                page.goto("https://www.tntdrama.com/watchtnt/" + this._options["Timezone"], {waitUntil: 'networkidle2'}),
                new Promise(x => setTimeout(x, 30000)),
            ]);

            try {
                await page.waitForSelector('#playerDiv', { timeout: 3000 });
                await page.focus('#playerDiv');
                await page.click('#playerDiv > div.image-wrapper > div > div > div');
            }
            catch {
                console.log('No player!');
            }

            if(this.PlaylistURL)
                return;

            try {
                await page.waitForSelector('#mvpdpicker', { timeout: 30000 });
                await page.focus('#mvpdpicker');
                console.log("Provider picker window displayed");
                await page.click('#mvpdpicker > div.slates > div.slate.remembered > div.footer.rememberedfooter > button.rememberedokbutton');            
                await page.waitForSelector('#mvpdpicker > div.slates > div.slate.success');
                await page.waitForSelector('#mvpdpicker > div.slates > div.slate.success > button', { timeout: 30000 });
                console.log("Provider login succeeded");
                await timeout(5000)
            } catch(err) {
                console.log("No provider selector");
            }

            console.log("%s page loading completed", this.GuideName);

            if(this.PlaylistURL)
                return;

            await page.waitFor(10000);
            console.log("Timeout on %s", this.GuideName);
            this.Error("Timeout waiting for %s", this.GuideName);


            if(this.PlaylistURL)
                return;

            try {
                browser.close();
            }
            catch {
                console.log("Browser already closed for %s", this.GuideName);
            }
        })();
    }

    
}

module.exports = Channel;

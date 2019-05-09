var ChannelClass = require('../lib/ChannelClass.js');
const puppeteer = require('puppeteer');
const timeout = ms => new Promise(res => setTimeout(res, ms))
const Provider = require('../lib/Provider.js');
const provider = new Provider;

/* 
    NOTE: Since these streams expire pretty regularly, a scan should be done at a regular interval - ScanInterval
*/

class Channel extends ChannelClass {

  constructor(args) {
    super(args);
    this.GuideName = "TNT";
    this.GuideNumber = 1207;
    this.HD = true;
    this.Headers = 'host: turnerlive.akamaized.net';
    this.ScanInterval = 120;
  }

  InitializeChannel() {

        const _self = this;
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
            provider.Provider = this.Provider;
            provider.RequestorId = "TBS";
            provider.RedirectUrl = 'https://www.tntdrama.com/watchtnt/' + this._options["Timezone"];
            provider.Debug = true;
            provider.DataDir = './newdatadir';
            provider.on('Ready', function(url) {
                console.log("Got URL %s", url);
                _self.PlaylistURL = url;
                _self.Available = true;
                _self.Ready();
                provider.Close();
            });
            provider.on('Error', function(error) {
                console.log("Error from provider %s", error);
                _self.Error(error);
                _self.Available = false;
                provider.Close();
            });
            provider.Navigate().then(function() {
                console.log("Navigation complete");
            });
        })();
    }
}

module.exports = Channel;

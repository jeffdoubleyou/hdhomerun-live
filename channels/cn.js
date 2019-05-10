var ChannelClass = require('../lib/ChannelClass.js');
const puppeteer = require('puppeteer');
const timeout = ms => new Promise(res => setTimeout(res, ms))
const Provider = require('../lib/Provider.js');
const provider = new Provider;

/* 
    This is an example for adding a non TV Everywhere channel - Cartoon Network does not offer a TV Everywhere site.  Maybe there is a better source of Cartoon Network, but this is free.
*/

class Channel extends ChannelClass {

  constructor(args) {
    super(args);
    this.GuideName = "CN";
    this.GuideNumber = 1212;
    this.HD = false;
    this.ScanInterval = 120;
    this.Headers = 'Referer: http://123tvnow.com/watch/cartoon-network/';
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
            provider.Username = this.Username;
            provider.Password = this.Password;
            provider.RequestMatch = '/chunks.m3u8';
            provider.RequestorId = "";
            provider.RedirectUrl = ""; 
            provider.Provider = "";
            provider.Url = "http://123tvnow.com/watch/cartoon-network/";
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

var ChannelClass = require('../lib/ChannelClass.js');
const puppeteer = require('puppeteer');
const timeout = ms => new Promise(res => setTimeout(res, ms))
const Provider = require('../lib/Provider.js');
const provider = new Provider;
const uuid = require('uuid');
const util = require('util');

/* 
    This is an example for adding a non TV Everywhere channel - Cartoon Network does not offer a TV Everywhere site.  Maybe there is a better source of Cartoon Network, but this is free.
*/

class Channel extends ChannelClass {

  constructor(args) {
    super(args);
    this.GuideName = "CNET";
    this.GuideNumber = 1216;
    this.HD = false;
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

        let deviceId = uuid();

        this.PlaylistURL = util.format('http://service-stitcher.clusters.pluto.tv/stitch/hls/channel/56283c8769ba54637dea0464/master.m3u8?deviceType=web&deviceMake=Chrome&deviceModel=Chrome&sid=fed1bbc8-128e-4cc4-a645-eea924ab0528&deviceId=%s&deviceVersion=12.0.2&appVersion=2.5.2-df6a9fe9a4551c2243cd791b651e4e5dd5a118f4&deviceDNT=0', deviceId);

        console.log(this.PlaylistURL);
        this.Available = true;
        this.Ready();
    }
}

module.exports = Channel;

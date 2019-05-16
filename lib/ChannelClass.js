const puppeteer = require('puppeteer');
const EventEmitter = require('events');

var defaultChannelSettings = {
    GuideNumber: 1,
    GuideName: 'Unknown',
    HD: false,
    VideoCodec: "MPEG2",
    AudioCodec: "AC3",
    Tags: [],
    Headers: null,
    Buffer: 1500,
    Scanning: false,
    Available: false,
    Timezone: "east",
    UserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
    ScanInterval: 1800,
    ChromeRemoteWsUrl: '', //'ws://127.0.0.1:9222/devtools/browser/36d2d6bb-1096-4522-933c-32b1ab912f8e'
    ExecutablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    Provider: "WOW",
    Debug: false,
    SkipScan: false,
    Username: null,
    Password: null
};

class Channel extends EventEmitter {
  
  constructor(args) {
    super();
    if(typeof args != "object")
        args = {};
    this._options = Object.assign({}, defaultChannelSettings, args);
    if(!args.settings || !args.settings.hasOwnProperty("db")) {
        console.log("Settings object required for ChannelClass");
        process.exit(1);
    }
    this._settings = args.settings;
    console.log("Channel %s options - Debug %s - SkipScan: %s", this.GuideName, this._options["Debug"], this._options["SkipScan"]);
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


  set Provider(val) {
    this._options["Provider"] = val;
  }

  get Provider() {
    return this._options["Provider"];
  }
  set Debug(val) {
    this._options["Debug"] = val;
  }
  get Debug() {
    return this._options["Debug"];
  }
  set ChromeRemoteWsUrl(val) {
    this._options["ChromeRemoteWsUrl"] = val;
  }

  get ChromeRemoteWsUrl() {
    return this._options["ChromeRemoteWsUrl"];
  }
  set ExecutablePath(val) {
    this._options["ExecutablePath"] = val;
  }

  get ExecutablePath() {
      return this._options["ExecutablePath"];
  }
  get GuideNumber() {
    return this._options["GuideNumber"];
  }

  set GuideNumber(val) {
    this._options["GuideNumber"] = val;
  }

  get GuideName() {
    return this._options["GuideName"];
  }

  set GuideName(val) {
    this._options["GuideName"] = val;
  }

  get HD() {
    return this._options["HD"];
  }

  set HD(val) {
    this._options["HD"] = val;
  }

  get Buffer() {
    return this._options["Buffer"];
  }

  set Buffer(val) {
    this._options["Buffer"] = val;
  }

  isHD() {
    if(this._options["HD"] == true)
        return 1;
    return 0;
  }

  get AudioCodec() {
    return this._options["AudioCodec"];
  }

  get VideoCodec() {
    return this._options["VideoCodec"];
  }

  get Headers() {
    return this._options["Headers"];
  }

  set Headers(val) {
    this._options["Headers"] = val;
  }

  Stream() {
    if(this.PlaylistURL()) {
        this.Ready();
    } else {
        this.Error("Failed to retrieve playlist URL");
    }
  }

  get PlaylistURL() {
    return this._options["PlaylistURL"];
  }

  set PlaylistURL(val) {
      this._options["PlaylistURL"] = val;
  }
   
  Ready() {
    console.log("Channel " + this.GuideNumber + " is ready");
    this._settings.ClearStream(this.GuideNumber);
    this._settings.SetStream(this.GuideNumber, this.PlaylistURL);
    this.emit('Ready');   
    if(this.Scanning)
      this.ScanComplete(true);
  }

  Error(err) {
    this.emit('Error', err);
    if(this.Scanning)
        this.ScanComplete(false);
  }

  InitializeChannel() {
      this.PlaylistURL = 'http://www.example.com/master.m8u3';
      this.Ready();
  }

  ScanChannel() {
    this.Scanning = true;
    this.InitializeChannel();
  }

  ScanComplete(status) {
    this.Available = status;
    this.Scanning = false;
    this.emit('ScanComplete', this.Available, this.ScanInterval);
  }

  set SkipScan(val) {
    this._options["SkipScan"] = val;
  }

  get SkipScan() {
    return this._options["SkipScan"];
  }

  set ScanInterval(val) {
    this._options["ScanInterval"] = val;
  }

  get ScanInterval() {
    return this._options["ScanInterval"];
  }

  set Available(val) {
    this._options["Available"] = val;
  }

  get Available() {
    return this._options["Available"];
  }

  set Scanning(val) {
    this._options["Scanning"] = val;
  }

  get Scanning() {
    return this._options["Scanning"];
  }

  get Timezone() {
    return this._options["Timezone"];
  }

  set UserAgent(val) {
    this._options["UserAgent"] = val;
  }

  get UserAgent() {
    return this._options["UserAgent"];
  }

  HasPlaylist(timeout) {
    var url = this._settings.GetStream(this.GuideNumber, timeout);
    if(!this.Scanning && url)
    {
        this.PlaylistURL = url;
        console.log("We are not scanning and have a stream URL already, not getting a new URL - using:", this.PlaylistURL);
        this.Available = true;
        this.Ready();
        return true;
    }
  }

}

module.exports = Channel;

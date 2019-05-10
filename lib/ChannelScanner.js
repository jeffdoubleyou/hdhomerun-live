const EventEmitter = require('events');
const fs = require('fs');

class ChannelScanner extends EventEmitter {
  
    constructor(args) {
        super();
        this._options = {};
        this._channels = {};
        this._scanInterval = {};
        this._scannedCount = 0;
        this._channelCount = 0;
        this._foundCount = 0;
        this._scanning = 0;
        console.log("INIT Scanner");
        if(!args.settings || !args.settings.hasOwnProperty("db")) {
            console.log("Settings object required for ChannelScan");
            process.exit(1);
        }
        console.log("Scanner settings");
        this._settings = args.settings; // || new Settings;
        this._options["Debug"] = args.Debug;
        this._options["SkipScan"] = args.SkipScan;
        this._options["Provider"] = args.Provider;
        this._options["Username"] = args.Username;
        this._options["Password"] = args.Password;
        this._options["Once"] = args.Once;
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
        this._options["Password"] = val
    }

    ClearChannels() {
        return this._settings.ClearAllChannels();
    }

    get SkipScan() {
        return this._options["SkipScan"];
    }

    set SkipScan(val) {
        this._options["SkipScan"] = val;
    }

    get Debug() {
        return this._options["Debug"];
    }

    set Debug(val) {
        this._options["Debug"] = val;
    }

    get Once() {
        return this._options["Once"];
    }

    set Once(val) {
        this._options["Once"] = val;
    }
    
    get ChannelCount() {
        return this._channelCount;
    }

    set ChannelCount(val) {
        this._channelCount = val;
    }

    ScanComplete() {
        this._scanning = 0;
        this.emit('ScanComplete');
    }

    get ScannedCount() {
        return this._scannedCount;
    }

    set ScannedCount(val) {
        this._scannedCount = val;
    }

    IncrementScannedCount() {
        this._scannedCount++;
        this.ScanUpdate();
    }

    ScanUpdate() {
        this.emit('ScanProgress', this.Progress());

    }

    FoundChannels() {
        return this._foundCount;
    }

    IncrementFoundChannels() {
        this._foundCount++;
    }

    ScanStatus() {
        return this._scanning;
    }

    Progress() {
        return parseInt((this.ScannedCount / this.ChannelCount)*100);
    }

    ScanChannel(channel) {
        var _self = this;
        console.log("Load channel ", channel);
        var ChannelModule = require('../channels/'+channel);
        this._channels[channel] =  new ChannelModule({ 
            Debug: this.Debug,
            settings: this._settings, 
            SkipScan: this.SkipScan,
            Provider: this.Provider,
            Username: this.Username,
            Password: this.Password
        });
        this._channels[channel].on('ScanComplete', function(Status, ScanInterval) {
          if(_self._scanInterval[channel]) {
              console.log("Already scanning " + channel);
              if(Status == false) {
                  console.log("Disabling scanning of " + channel + " because the last scan failed");
                  clearInterval(_self._scanInterval[channel]);
                  delete _self._channels[channel];
              }
          } 
          else {
            _self.IncrementScannedCount();
            if(Status)
                _self.IncrementFoundChannels();
            if(_self.ScannedCount == _self.ChannelCount) {
                _self.ScanComplete()
            }
            if(Status == true) {
                console.log("Insert channel %s into lineup", channel);
                _self._settings.InsertChannel(_self._channels[channel]);
            }
            if(!_self.Once) {
                console.log("Going to scan %s every %d seconds", channel, ScanInterval);
                _self._scanInterval[channel] = setInterval(function() { console.log("Scan " + channel); _self._channels[channel].ScanChannel(channel); }, ScanInterval * 1000);
            }
          }
        });
        if(this._channels[channel] && !this._scanInterval[channel]) {
            console.log("Initiate first scan of " + channel);
            this._channels[channel].ScanChannel();
        }
    }

    GetChannels() {
        var _self = this;
        this._scanning = 1;
        fs.readdir('./channels', function(err, channels) {
            _self.ChannelCount = channels.length;
            console.log("Found %d channels to scan", _self.ChannelCount);
            channels.forEach(function(channel) {
                _self.ScanChannel(channel);        
            });
        });
    }
}

module.exports = ChannelScanner;


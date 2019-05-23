var ChannelClass = require('../lib/ChannelClass.js');
const Provider = require('../lib/Provider/Discovery.js');

class Channel extends ChannelClass {

  constructor(args) {
    super(args);
    this.GuideName = "ID";
    this.GuideNumber = 1311;
    this.HD = true;
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

        let provider = new Provider({ settings: this._settings });

        (async() => {
            provider.Provider = this.Provider;
            provider.Username = this.Username;
            provider.Password = this.Password;
            provider.RequestorId = "ID";
            provider.RedirectUrl = "https://www.investigationdiscovery.com/watch/investigation-discovery"
            provider.Url = provider.RedirectUrl;
            provider.RequestMatch = "channel/.+\\.m3u8"
            provider.Debug = this.Debug;
            provider.ExecutablePath = this.ExecutablePath;
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

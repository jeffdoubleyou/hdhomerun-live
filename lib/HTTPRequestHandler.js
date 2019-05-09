const Stream = require('./StreamingClass.js');
const Scanner = require('./ChannelScanner.js');

var scan;
var config;
var appConfig;
var settings;

class HTTPRequestHandler {
  
    constructor(args) {
        this._options = {};
        if(!args.settings || !args.settings.hasOwnProperty("db")) {
            console.log("Settings object required for HTTPRequestHandler");
            process.exit(1);
        }
        settings = args.settings;
        config = settings.GetConfig("device");
        appConfig = settings.GetConfig("app");
        this._settings = settings;
        scan = new Scanner({ 
            settings: settings,
            Once: true, 
            SkipScan: appConfig.SkipScan, 
            Debug: appConfig.Debug, 
            ExecutablePath: appConfig.ChromePath, 
            Provider: appConfig.Provider,
            Username: appConfig.Username,
            Password: appConfig.Password
        });
    }

    get PlaylistURL() {
        return this._options["PlaylistURL"];
    }

    set PlaylistURL(val) {
        this._options["PlaylistURL"] = val;
    }

    Lineup(req, res) {
        res.setHeader('Content-Type', 'application/json');
        var channelList = settings.GetChannels();
        channelList.forEach(function(channel) {
            channel.URL = `http://${req.headers.host}/auto/v${channel.GuideNumber}`
            channel.GuideNumber = channel.GuideNumber.toString();
        });
        res.send(
            JSON.stringify(channelList)
        );
    }

    LineupStatus(req, res) {
        console.log(this);
        res.setHeader('Content-Type', 'application/json');
        res.send(
            JSON.stringify(
              {
                ScanInProgress: scan.ScanStatus(),
                ScanPossible: 1,
                Source: 'Cable',
                SourceList: ['Cable'],
                Progress: scan.Progress(),
                Found: scan.FoundChannels()
              },
            ),
        );
    }

    Discover(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(
            JSON.stringify({
                FriendlyName: config.FriendlyName,
                ModelNumber: config.ModelNumber,
                FirmwareName: config.FirmwareName,
                TunerCount: config.TunerCount,
                FirmwareVersion: config.FirmwareVersion,
                DeviceID: config.DeviceId,
                DeviceAuth: config.DeviceAuth,
                BaseURL: `http://${req.headers.host}`,
                LineupURL: `http://${req.headers.host}/lineup.json`,
                Manufacturer: 'Silicondust',
            })
        );
    }

    Play(req, res) {
        const GuideNumber = req.params.channelNum.replace(/[^0-9]/g, '');
        console.log("GuideNumber: '%d'", GuideNumber);
        const ChannelConfig = settings.GetChannelByGuideNumber(GuideNumber);
        const ChannelModuleName = ChannelConfig.GuideName.toLowerCase();
        const ChannelModule = require('../channels/' + ChannelModuleName + '.js');
        const Channel = new ChannelModule({
            settings: settings,
            Debug: appConfig.Debug,
            ExecutablePath: appConfig.ChromePath,
            Provider: appConfig.Provider,
            Username: appConfig.Username,
            Password: appConfig.Password
        });

        const Streamer = new Stream({
            ResponseObject: res,
            Buffer: Channel.Buffer,
            UserAgent: Channel.UserAgent,
            Headers: Channel.Headers
        });
        
        console.log("Stream starting for " + Channel.GuideName + " on channel " + Channel.GuideNumber);

        res.writeHead(200, {
            'Content-Type': 'video/mpeg',
            'Server': 'HDHomeRun/1.0',
            'transferMode.dlna.org': 'Streaming'
        });

        Channel.on('Error', function(err) {
            console.log("Unable to stream " + Channel.GuideName + " on channel " + Channel.GuideNumber + " because " + err);
        });

        Channel.on('Ready', function() {
            console.log(Channel.GuideName + " channel " + Channel.GuideNumber + " is ready to stream at " + Channel.PlaylistURL);
            Streamer.PlaylistURL = Channel.PlaylistURL;
            Streamer.Stream();
        });

        Channel.InitializeChannel();
    }

    Scan(req, res) {
        if(scan.ScanInProgress) {
            console.log("Already scanning for channels");
        }
        else {
            console.log("Begin channel scan");

            scan.on('ScanProgress', function(progress) {
                console.log("Scan is %d percent complete", progress);
            });

            scan.on('ScanComplete', function() {
                console.log("Scan of %d channels completed - Found %d channels", scan.ChannelCount, scan.FoundChannels());
            });

            scan.ClearChannels();
            scan.GetChannels();
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(
            JSON.stringify(
              {
                ScanInProgress: scan.ScanStatus(),
                ScanPossible: 1,
                Source: 'Cable',
                SourceList: ['Cable'],
              },
            ),
        );
 
    }
}

module.exports = HTTPRequestHandler;


var MULTICAST_PORT = 65001;

var Settings = require('./lib/Settings.js');
var Scanner = require('./lib/ChannelScanner.js');

var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var proto = require('./protocol');
var request_encoder = new proto.RequestEncoder();
var reply_decoder = new proto.ReplyDecoder();
var net = require('net');
var HTTPRequestHandler = require('./lib/HTTPRequestHandler.js');
var settings = new Settings();
var httpRequest = new HTTPRequestHandler({ settings: settings });
var appConfig  = settings.GetConfig("app");

const express = require('express');
const morgan = require('morgan');

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);
    msg = {};
    proto.decode_pkt(message, msg);
    console.log("MSG", msg);
   
    var reply1 = {
      type: proto.types.disc_rpy,
      device_type: proto.dev_values.device_type_tuner,
      device_id: "0x1068A145",
      tuner_count: 2,
      base_url: "http://" + appConfig.ServerAddress + ":80",
      device_auth_str: "dNP7gQINBqufvAYnMFPEmlbQ",
      lineup: "http://" + appConfig.ServerAddress+ ":80/lineup.json",
    };

    var reply = proto.encode_msg(reply1);
    //console.log("REPLY WITH:", reply1);
    server.send(reply, remote.port, remote.address, function(error) {
        if(error) {
            console.log("ERR", error);
        } else {
            console.log("SENT");
        }
    });

});

server.bind(MULTICAST_PORT, () => {
    server.setMulticastInterface(appConfig.ServerAddress);
});


var tcpserver = net.createServer(function(socket) {
    console.log("TCP SERVER MESSAGE");
    socket.on('data', function(message, s) {
        msg = {};
        proto.decode_pkt(message, msg);
        //console.log(msg);
        var reply1 = {};
        switch(msg.type) {
            case(2):
                reply1 = {
                    type: proto.types.disc_rpy,
                    getset_name: '/sys/model',
                    getset_value: 'hdhomerun5_atsc',
                    device_type: proto.dev_values.device_type_tuner,
                    tuner_count: 2,
                    device_id: "0x1068A145",
                    device_auth_str: 'dNP7gQINBqufvAYnMFPEmlbQ',
                };
                break;
            case(4):
                console.log("GET TCP SERVER:", msg.getset_name);
                reply1 = {
                    type: proto.types.getset_rpy,
                    getset_name: msg.getset_name
                };
                switch(msg.getset_name) {
                    case("/tuner1/status"):
                        reply1.getset_value = "ch=none lock=none ss=0 snq=0 seq=0 bps=0 pps=0";
                        break;
                    case("/tuner2/status"):
                        reply1.getset_value = "ch=none lock=none ss=0 snq=0 seq=0 bps=0 pps=0";
                        break;
                    case("/sys/model"):
                        reply1.getset_value = "hdhomerun5_atsc";
                        break;
                    case("/sys/hwmodel"):
                        reply1.getset_value = "HDHR5-2US";
                        break;
                    case("/sys/version"):
                        reply1.getset_value = "20180817";
                        break;
                    case("/sys/features"):
                        reply1.getset_value = "channelmap: us-bcast us-cable us-hrc us-irc kr-bcast kr-cable\nmodulation: 8vsb qam256 qam64\nauto-modulation: auto auto6t auto6c qam\n";
                        break;
                    case("help"):
                        reply1.getset_value = 'Supported configuration options:\n/lineup/scan\n/sys/copyright\n/sys/debug\n/sys/features\n/sys/hwmodel\n/sys/model\n/sys/restart <resource>\n/sys/version\n/tuner<n>/channel <modulation>:<freq|ch>\n/tuner<n>/channelmap <channelmap>\n/tuner<n>/debug\n/tuner<n>/filter "0x<nnnn>-0x<nnnn> [...]"\n/tuner<n>/lockkey\n/tuner<n>/program <program number>\n/tuner<n>/streaminfo\n/tuner<n>/status\n/tuner<n>/target <ip>:<port>\n/tuner<n>/vchannel <vchannel>\n';
                        break;
                        
                };
        };

        console.log("ENCODE:", reply1);
        var reply = proto.encode_msg(reply1);
    //    console.log("TCP REPLY:", reply);
        socket.write(reply);
    });
});

tcpserver.on('listening', function () {
    var address = server.address();
    console.log('TCP Server listening on ' + address.address + ":" + address.port);
});

tcpserver.listen(MULTICAST_PORT, appConfig.ServerAddress);

const http = express();
const http_port = 80;
const media_port = 5004;

http.use(express.static('static'));
http.use(morgan('dev'));
http.get('/lineup.json', httpRequest.Lineup);
http.get('/lineup_status.json', httpRequest.LineupStatus);
http.post('/lineup_status.json', httpRequest.LineupStatus);
http.post('/lineup.post', httpRequest.Scan);
http.get('/discover.json', httpRequest.Discover);
http.get('/stream/:channelNum', httpRequest.Play);
http.get('/auto/:channelNum', httpRequest.Play);
http.get('/tuner0/:channelNum', httpRequest.Play);
http.get('/tuner1/:channelNum', httpRequest.Play);

http.listen(http_port, () => {
  console.log("HTTP server started listening on port %d", http_port);
});

http.listen(media_port, () => {
    console.log("MEDIA Server started listening on port %d", media_port);
});

//scan.GetChannels();

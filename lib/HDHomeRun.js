/*
    This class is mostly refactored code from https://github.com/mharsch/node-hdhomerun
*/
const PORT = 65001;
const dgram = require('dgram');
//const server = dgram.createSocket('udp4');
const proto = require('../protocol');
const request_encoder = new proto.RequestEncoder();
const reply_decoder = new proto.ReplyDecoder();
const net = require('net');
const util = require('util');
const Protocol = require('./Protocol.js');

class HDHomeRun {
    constructor(args) {
        this._settings = args.settings;
        this.AppConfig = this._settings.GetConfig('app');
        this.DeviceConfig = this._settings.GetConfig('device');
        this.Protocol = new Protocol();
        let date = new Date();
        this._version = util.format("%s%s%s", date.getUTCFullYear(), ("0" + (date.getMonth() + 1)).slice(-2), ("0" + date.getDate()).slice(-2));
    }

    MultiCast() {
        let _self = this;
        _self.MultiCastServer = dgram.createSocket('udp4');
        _self.MultiCastServer.on('listening', function() {
            console.log("Multicast discovery server is listening");
        });
        _self.MultiCastServer.on('message', function(packet, client) {
            _self.RequestHandler(this, packet, client);
        });
        _self.MultiCastServer.bind(PORT, () => {
            console.log("Listen for multicast requests on %s", _self.ServerAddress);
            _self.MultiCastServer.setMulticastInterface(_self.ServerAddress);
        });
    }

    ControlServer() {
        let _self = this;
        _self.TCPControlServer = net.createServer(function(socket) {
            socket.on('data', function(request, client) {
                console.log("TCP Control Server request from %s on port %d", socket.remoteAddress, socket.remotePort);
                _self.RequestHandler(socket, request, {address: socket.remoteAddress, port: socket.remotePort});
            });
        });
        _self.TCPControlServer.on('listen', function() {
            console.log("TCP Control Sever listening on %s:%d", _self.ServerAddress, PORT);
        });

        _self.TCPControlServer.listen(PORT, _self.ServerAddress);
    }

    Discover(packet) {
        // nothing
    }

    GetSet(packet) {
        console.log("GET SET REQUEST for %s", packet.GetSetName);
        switch(packet.GetSetName) {
        }

    }

    RequestHandler(server, data, client) {
        console.log("Got request from %s on port %d", client.address, client.port);
        let _self = this;
        let packet = new Protocol()
        packet.ParsePacket(data)
        let type = packet.Type;
        let getset_name = packet.GetSetName;
        let reply = new Protocol()
        reply.Type = type;
        if(getset_name)
            reply.GetSetName = getset_name
        reply.DeviceType = 'tuner';
        reply.DeviceId = this.DeviceId
        reply.TunerCount = this.TunerCount
        reply.BaseURL = this.BaseURL
        reply.DeviceAuthStr = this.DeviceAuth
        reply.Lineup = this.Lineup
        reply.FirmwareName = this.FirmwareName
        reply.Version = this.Version;
        reply.HardwareModel = this.HardwareModel;
        reply.FriendlyName = this.FriendlyName;

        switch(type) {
            case 'discover':
                this.Discover(reply)
                break;
            case 'upgrade':
                this.Upgrade(reply)
                break;
            case 'getset':
                this.GetSet(reply)
                break;
            default:
        }

        let response = reply.Encode()
        if(server.type == 'udp4') {
            server.send(response, client.port, client.address, function(error) {
                if(error) {
                    console.log("Error %s", error);
                }
            });
        }
        else {
            server.write(response);
        }
    }

    RequestType(packet) {
        console.log("Request type: %s", packet.type);
        return packet.type; 
    }

    get DeviceType() {
        return proto.dev_values.device_type_tuner;
    }

    get DeviceId() {
        return this.DeviceConfig.DeviceID;
    }

    get TunerCount() {
        return this.DeviceConfig.TunerCount;
    }

    get BaseURL() {
        return util.format('http://%s:80', this.ServerAddress);
    }

    get ServerAddress() {
        return this.AppConfig.ServerAddress;
    }

    get DeviceAuth() {
        return this.DeviceConfig.DeviceAuth;
    }

    get Lineup() {
        return util.format('http://%s:80/lineup.json', this.ServerAddress);
    }

    get FirmwareName() {
        return this.DeviceConfig.FirmwareName;
    }

    get Model() {
        return this.DeviceConfig.Model;
    }

    get HardwareModel() {
        return this.DeviceConfig.ModelNumber;
    }

    get Version() {
        return this._version;
    }

    get FriendlyName() {
        return this.DeviceConfig.FriendlyName;
    }

    ncode(input) {
        return proto.encode_msg(input)
    }

    Decode(input) {
        let packet = {};
        proto.decode_pkt(input, packet);
        return packet;
    }
}

module.exports = HDHomeRun;

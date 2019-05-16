const proto = require('../protocol');

HDHOMERUN_TYPE_DISCOVER_REQ = 0x0002
HDHOMERUN_TYPE_DISCOVER_RPY = 0x0003
HDHOMERUN_TYPE_GETSET_REQ = 0x0004
HDHOMERUN_TYPE_GETSET_RPY = 0x0005
HDHOMERUN_TYPE_UPGRADE_REQ = 0x0006
HDHOMERUN_TYPE_UPGRADE_RPY = 0x0007

HDHOMERUN_TAG_DEVICE_TYPE = 0x01
HDHOMERUN_TAG_DEVICE_ID = 0x02
HDHOMERUN_TAG_GETSET_NAME = 0x03
HDHOMERUN_TAG_GETSET_VALUE = 0x04
HDHOMERUN_TAG_GETSET_LOCKKEY = 0x15
HDHOMERUN_TAG_ERROR_MESSAGE = 0x05
HDHOMERUN_TAG_TUNER_COUNT = 0x10
HDHOMERUN_TAG_DEVICE_AUTH_STR = 0x2B
HDHOMERUN_TAG_BASE_URL = 0x2A
HDHOMERUN_TAG_LINEUP = 0x27

HDHOMERUN_DEVICE_TYPE_WILDCARD = 0xFFFFFFFF
HDHOMERUN_DEVICE_TYPE_TUNER = 0x00000001
HDHOMERUN_DEVICE_ID_WILDCARD = 0xFFFFFFFF

const requestType = {
    discover: HDHOMERUN_TYPE_DISCOVER_REQ,
    getset: HDHOMERUN_TYPE_GETSET_REQ,
    upgrade: HDHOMERUN_TYPE_UPGRADE_REQ
}

const responseType = {
    discover: HDHOMERUN_TYPE_DISCOVER_RPY,
    getset: HDHOMERUN_TYPE_GETSET_RPY,
    upgrade: HDHOMERUN_TYPE_UPGRADE_RPY
}

const deviceType = {
    wildcard: HDHOMERUN_DEVICE_TYPE_WILDCARD,
    tuner: HDHOMERUN_DEVICE_TYPE_TUNER,
}

const tag = {
    device_type: HDHOMERUN_TAG_DEVICE_TYPE,
    device_id: HDHOMERUN_TAG_DEVICE_ID,
    getset_name: HDHOMERUN_TAG_GETSET_NAME,
    getset_value: HDHOMERUN_TAG_GETSET_VALUE,
    getset_lockkey: HDHOMERUN_TAG_GETSET_LOCKKEY,
    error_message: HDHOMERUN_TAG_ERROR_MESSAGE,
    tuner_count: HDHOMERUN_TAG_TUNER_COUNT,
    device_auth_str: HDHOMERUN_TAG_DEVICE_AUTH_STR,
    base_url: HDHOMERUN_TAG_BASE_URL,
    lineup: HDHOMERUN_TAG_LINEUP
}

class Protocol {

    constructor() {
        this._decoded = {};
    }

    get Type() {
        let _self = this;
        let _type;
        if(!this._decoded.hasOwnProperty('type'))
            return null
        Object.keys(requestType).some(function(type) {
            if(requestType[type] == _self._decoded.type || responseType[type] == _self._decoded.type) {
                _type = type
                return type
            }
        });
        return _type
    }

    set Type(type) {
        this._decoded.type = responseType[type];
    }

    get GetSetName() {
        return this._decoded.getset_name;
    }

    set GetSetName(name) {
        this._decoded.getset_name = name;
    }

    get GetSetValue() {
        let val, tuner, sys;
        let name = this.GetSetName;
        if(tuner = name.match(/tuner(\d+)\/status/)) {
            val = this.TunerStatus(tuner[1])
        }
        else {
            if(sys = name.match(/sys\/(\w+)/)) 
                val = this.SysValue(sys[1])
            else 
                val = this.Help()
        }
        return String(val)
    }

    set GetSetValue(val) {
        this._decoded.getset_value = val;
    }

    TunerStatus(tuner) {
       // TODO: Add support for tuner status
       return "ch=none lock=none ss=0 snq=0 seq=0 bps=0 pps=0";
    }

    SysValue(field) {
        switch(field) {
            case 'model':
                return this.FirmwareName
                break
            case 'hwmodel':
                return this.HardwareModel
                break
            case 'version':
                return this.Version
                break
            case 'features':
                return this.Features
                break;
            default:
                console.log("Unknown sys request for %s", field);
        }
        return "";
    }

    Help() {
        // TODO: Add tuner count support
        return 'Supported configuration options:\n/lineup/scan\n/sys/copyright\n/sys/debug\n/sys/features\n/sys/hwmodel\n/sys/model\n/sys/restart <resource>\n/sys/version\n/tuner<n>/channel <modulation>:<freq|ch>\n/tuner<n>/channelmap <channelmap>\n/tuner<n>/debug\n/tuner<n>/filter "0x<nnnn>-0x<nnnn> [...]"\n/tuner<n>/lockkey\n/tuner<n>/program <program number>\n/tuner<n>/streaminfo\n/tuner<n>/status\n/tuner<n>/target <ip>:<port>\n/tuner<n>/vchannel <vchannel>\n';
    }

    get Features() {
        return "channelmap: us-bcast us-cable us-hrc us-irc kr-bcast kr-cable\nmodulation: 8vsb qam256 qam64\nauto-modulation: auto auto6t auto6c qam\n";
    }

    get DeviceType() {
        return deviceType[this._decoded.type];
    }

    set DeviceType(type) {
        this._decoded.device_type = deviceType[type];
    }

    get DeviceId() {
        return this._decoded.device_id;
    }

    set DeviceId(id) {
        this._decoded.device_id = id;
    }

    get DeviceIdWildCard() {
        return HDHOMERUN_DEVICE_ID_WILDCARD;
    }

    ParsePacket(data) {
        this._decoded = this.Decode(data);
    }

    get TunerCount() {
        return this._decoded.tuner_count;
    }

    set TunerCount(count) {
        this._decoded.tuner_count = count;
    }

    get BaseURL() {
        return this._decoded.base_url;    
    }

    set BaseURL(url) {
        this._decoded.base_url = url;
    }

    get DeviceAuthStr() {
        return this._decoded.device_auth_str;    
    }

    set DeviceAuthStr(auth) {
        this._decoded.device_auth_str = auth;
    }

    get Lineup() {
        return this._decoded.lineup;
    }

    set Lineup(lineup) {
        this._decoded.lineup = lineup;
    }

    get FirmwareName() {
        return this._firmware_name;
    }

    set FirmwareName(name) {
        this._firmware_name = name;
    }

    get HardwareModel() {
        return this._hwmodel;
    }

    set HardwareModel(model) {
        this._hwmodel = model;
    }

    get Version() {
        return this._version;
    }

    set Version(version) {
        this._version = version;
    }

    get FriendlyName() {
        return this._name;
    }

    set FriendlyName(name) {
        this._name = name;
    }


    Encode() {
        if(this.Type == 'getset') {
            console.log({ getset_name: this.GetSetName, getset_value: this.GetSetValue });
            return proto.encode_msg({ getset_name: this.GetSetName, getset_value: this.GetSetValue });
        }
        return proto.encode_msg(this._decoded)
    }

    Decode(input) {
        let packet = {};
        proto.decode_pkt(input, packet);
        return packet;
    }

}

module.exports = Protocol;

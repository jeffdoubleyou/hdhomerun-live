const low = require('lowdb')
const fs = require('fs')
const FileSync = require('lowdb/adapters/FileSync')

class Settings {
    constructor() {
        this.adapter = new FileSync('./settings.json');
        this.db = low(this.adapter);
        this.db.read();
    }

    InsertChannel(channel) {
        if(this.GetChannelByGuideNumber(parseInt(channel.GuideNumber))) {
            return this.UpdateChannel(channel);
        }

        return this.db.get('channels').push({
            GuideNumber: parseInt(channel.GuideNumber),
            GuideName: channel.GuideName,
            HD: channel.isHD(),
            Tags: channel.Tags,
            AudioCodec: channel.AudioCodec,
            VideoCodec: channel.VideoCodec
        }).write();
    }

    ClearAllChannels() {
        this.db.get('channels').remove().write();
        this.db.get('stream').remove().write();
        return;
    }

    UpdateChannel(channel) {
        channel.GuideNumber = parseInt(channel.GuideNumber);
        return this.db.get('channels').find({ GuideNumber: channel.GuideNumber }).assign(channel).write();
    }
    GetChannels() {
        return this.db.get('channels').sortBy('GuideNumber').value();
    }
    GetChannelCount(filter) {
        return this.db.get('channels').filter(filter).size().value();
    }

    GetChannelByGuideNumber(guideNumber) {
        this.db.read();
        return this.db.get('channels').find({ GuideNumber: parseInt(guideNumber) }).value();
    }

    InsertCustomGuideNumber(defaultGuideNumber, customGuideNumber) {
        return this.db.get('customChannels').push({ GuideNumber: parseInt(defaultGuideNumber), CustomGuideNumber: parseInt(customGuideNumber) });
    }

    GetCustomerGuideNumberByDefaultGuideNumber(defaultGuideNumber) {
        return this.db.get('customChannels').find({ GuideNumber: parseInt(defaultGuideNumber) }).value();
    }

    GetGuideNumberByCustomGuideNumber(customGuideNumber) {
        return this.db.get('customChannels').find({ CustomGuideNumber: parseInt(customGuideNumber) }).value();
    }

    GetScanStatus() {
        var scanStatus = this.db.get('status').find({ type: "scan" }).value();
        return scanStatus.status;
    }

    SetScanStatus(scanning, value) {
        return this.db.get('status').find({ type: "scan" }).assign({ status: scanning, value: value }).write();
    }

    GetConfig(section) {
        return this.db.get('config').find({ type: section }).value();
    }

    UpdateConfig(section, config) {
        config.type = section;
        return this.db.get('config').find({ type: section }).assign(config).write();
    }
    GetStream(guideNumber, timeout = 0) {
        var stream;

        var ts = Math.round((new Date()).getTime() / 1000) - timeout;

        if(stream = this.db.get('stream').find({ GuideNumber: parseInt(guideNumber)}).value()) {
            console.log("Stream URL: %s created at: %d", stream.Url, stream.Timestamp);
            if(stream.Timestamp >= ts)
                return stream.Url; 
            else
                this.ClearStream(guideNumber);
        }
        return null;
    }
    
    ClearStream(guideNumber) {
        return this.db.get('stream').remove({ GuideNumber: parseInt(guideNumber) }).write();
    }

    SetStream(guideNumber, url) {
        var ts = Math.round((new Date()).getTime() / 1000);
        return this.db.get('stream').push({ GuideNumber: parseInt(guideNumber), Url: url, Timestamp: ts }).write();
    }
}

module.exports = Settings;

const EventEmitter = require('events');
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');

var defaultStreamSettings = {
    VideoCodec: "MPEG2",
    AudioCodec: "AC3",
    Headers: null,
    Buffer: 1500,
    UserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
};

class Stream extends EventEmitter {
  
  constructor(args) {
    super();
    if(typeof args != "object")
        args = {};
    this._options = Object.assign({}, defaultStreamSettings, args);
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

  get Buffer() {
    return this._options["Buffer"];
  }

  set Buffer(val) {
    this._options["Buffer"] = val;
  }

  get PlaylistURL() {
    return this._options["PlaylistURL"];
  }

  set PlaylistURL(val) {
      this._options["PlaylistURL"] = val;
  }
   
  Ready() {
    this.emit('Ready');   
  }

  Error(err) {
    this.emit('Error', err);
  }

  set UserAgent(val) {
    this._options["UserAgent"] = val;
  }

  get UserAgent() {
    return this._options["UserAgent"];
  }

  get ResponseObject() {
    return this._options["ResponseObject"];
  }

  set ResponseObject(val) {
    this._options["ResponseObject"] = val;
  }

  Stream(loop) {
      var _self = this;
      let ffmpegStream = ffmpeg(this.PlaylistURL);
      ffmpegStream.addInputOption('-seekable 1');
      ffmpegStream.addInputOption(["-user_agent", this.UserAgent]);
      if(this.Headers) {
        var headers = this.Headers + "\nuser-agent: " + this.UserAgent;
        ffmpegStream.addInputOption(["-headers", headers]);
      }
      
      // Video acceleration
      if (process.env.VIDEO_ACCEL !== 'true' || process.platform === 'win32') {
        ffmpegStream = ffmpegStream
          .videoCodec('libx264')
          .addOutputOption('-preset superfast');
      } else if (process.platform === 'darwin') {
        ffmpegStream = ffmpegStream
          .videoCodec('h264_videotoolbox');
      } else if (process.platform === 'linux') {
        ffmpegStream = ffmpegStream
          .addInputOption('-vaapi_device /dev/dri/renderD128')
          .addInputOption('-hwaccel vaapi')
          .addOutputOption('-vf format=nv12,hwupload')
          .videoCodec('h264_vaapi');
      }

      ffmpegStream = ffmpegStream
        .addOutputOption('-c copy')
        .addOutputOption('-bufsize '+this.Buffer + 'k')
        .outputFormat('mpegts');

      ffmpegStream.on('error', function(err) {
          console.log("FFMPEG ERROR", new Date(), err)
          _self.Error(err);
      });

      ffmpegStream.pipe(this.ResponseObject);
  }
}

module.exports = Stream;

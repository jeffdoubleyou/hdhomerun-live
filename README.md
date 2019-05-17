# hdhomerun-live

HDHomeRun Emulator that scrapes playlist URLs from TV station live streaming web pages utilizing TV everywhere.

Made for use with Channels DVR ( getchannels.com ).

Should work with any type of playlist that is supported by FFMPEG, so you could potentially add any IPTV stream you wanted or other type of service.  Channels can be added in the /channels directory.  

You'll want to point ChromePath in config.json to a Chrome path instead of using the built in Chromium browser installed w/ Puppeteer because you need mpeg4 support.

Still trying to figure out how to get authentication working on a few different sites like those from Discovery.

This is a work in progress....

## Installation:

	yarn install

## Running

    Edit config.json
    node multicast.js

## License:
MIT.

## Attibutions:

Some ( Currently most ) libhdhomerun protocol implementation from:

https://github.com/mharsch/node-hdhomerun
 

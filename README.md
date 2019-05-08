# hdhomerun-live

HDHomeRun Emulator that scrapes playlist URLs from TV station live streaming web pages.

Made for use with Channels DVR ( getchannels.com ).

Should work with any type of playlist that is supported by FFMPEG, so you could potentially add any IPTV stream you wanted or other type of service.  Channels can be added in the /channels directory.  Existing channels included here are not complete and require that you login to your cable provider in the Chrome browser.

This is a work in progress....

## Installation:

	yarn install

## Running

    Edit settings.json
    node multicast.js

## License:
MIT.

## Attibutions:

Some ( Currently most ) libhdhomerun protocol implementation from:

https://github.com/mharsch/node-hdhomerun
 

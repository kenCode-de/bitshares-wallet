#!/usr/bin/env node
 
//this hook installs all your plugins
 
// add your plugins to this list--either 
// the identifier, the filesystem location 
// or the URL
var pluginlist = [
    "https://github.com/msopentech/cordova-plugin-indexedDB/",
    "cordova-plugin-crosswalk-webview",
    "https://git-wip-us.apache.org/repos/asf/cordova-plugin-file.git",
    "https://github.com/ABB-Austin/cordova-plugin-indexeddb-async",
    "cordova-plugin-social-message",
    //"cordova-plugin-whitelist",
    "https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git",
    "https://git-wip-us.apache.org/repos/asf/cordova-plugin-device.git",
    "https://github.com/wildabeast/BarcodeScanner"	,
	"cordova-plugin-media"
];

 
 
// no need to configure below
 
var fs = require('fs');
var path = require('path');
var sys = require('sys')
var exec = require('child_process').exec;
 
function puts(error, stdout, stderr) {
    sys.puts(stdout)
}
 
pluginlist.forEach(function(plug) {
    exec("cordova plugin add " + plug, puts);
});
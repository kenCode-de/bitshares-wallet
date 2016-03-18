Prerequisites

1) go to project root directory
2) cd dev
3) unpack node_modules_bsw.zip so that node_modules directory appeared in Dev  directory
4) cd app\dl
5) npm install
6) cd ..\..\..
7) npm install cordova -g
8) Install Android SDK
9) cordova platform add android




Web build

1) go to project root directory
2) cd dev
3) npm run build
4) set port = 5000
5) http-server <current directory path>
6) (optional) remove cookies, localstorage and web databases for localhost to clear applicaton settings
7) open localhost:5000


Android build

1) go to project root directory
2) cd dev
3) npm run buildprod
4) cd ..
5) If any changes  of external resources (css, images etc) occured since last build, manually copy these folders from dev\app\assets\ to www\assets
6) copy index_android.html to index.html (overwriting old index.html)
7) cordova build android --debug
8) Resulting .apk file comes to platforms\android\build\outputs\apk

iOs build

Platform installation:

1) copy whole project folder (except Platforms folder) to your Mac
2) Install XCode 7.x 
3) open terminal window for root project folder
4) cordova platform add ios
5) copy index_ios.html to index.html (overwriting old index.html)
6) copy Intl.js to www/assets (next to socialSharing.js)


Test build:

1) on Windows machine, run "npm run build" against DEV folder
2) copy www\assets to the relevat folder of your Mac 
3) open OS X terminal for root project folder
4) cordova build ios --debug
5) select platforms\bitshareswallet.xcodeproj.  Project should open in XCode
6) select 'Generic device' and 'Debug\Archive'
7) Create ad-hoc build 
8) Install .ipa file to youriOs device



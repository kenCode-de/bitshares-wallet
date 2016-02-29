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
5) cordova build android --debug
7) Resulting .apk file comes to platforms\android\build\outputs\apk


#Set Up the Development Environment
Install a cross‑platform framework (e.g., Cordova/Ionic or React Native).
#Ensure Node.js and npm are installed.
npm install -g cordova // Install mini version of web server

#Create the First App Project
Use the framework’s CLI to generate a starter project.
cordova create MyFirstApp com.example.myfirstapp MyFirstApp

#Install Platform Support: Add target platforms (Android, iOS, Browser).
cordova platform add android // add android to the project folder
cordova platform add browser // add a browser platform

Build the App
Compile the project into platform‑specific binaries.
cordova build android

Install on Device/Emulator
Connect your phone via USB or use an emulator.
cordova emulate android

cordova run android // #Runs android from your Phone
cordova run --emulator //Runs android from your emulator  
cordova run browser // Runs a browser as as the build vs code live web server

cordova requirements
cordova emulate android --list
avdmanager list avd

checking if empty
echo $env:ANDROID_HOME
echo $env:ANDROID_SDK_ROOT

Chapter 5
npm install cordova-plugin-battery-status@2.0.3 --save
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-device
cordova platform remove android
cordova platform add android
cordova run android

npm install -g cordova-res

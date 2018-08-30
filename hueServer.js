//==========================//
//      Created modules     //
//==========================//

var { counter, incCounter } = require('./modules/counter');
var colour_converter = require('./modules/colour_converter');
var dateTime = require('./modules/dateTime');
var temperatureMonitoring = require('./modules/temperatureMonitoring');
//==========================//
// Node.js // npm  packages //
//==========================//

//===============================================//
//==============    Software    ================//
//===============================================//
var express = require('express'); //Webserver hosting
var app = express();
var http = require('http').Server(app);

const sqlite3 = require('sqlite3').verbose();


var io = require('socket.io')(http); //two way communication between client <--> server

var fs = require('fs'); //require filesystem module
var path = require('path'); //Supporting package for fs

var nodemailer = require('nodemailer'); //Email package

var TPLSmartDevice = require('tplink-lightbulb'); //Allows control of TP-Link HS100 Wifi smart plugs

//===============================================//
//===============    Hardware    ================//
//===============================================//

var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

var RaspiCam = require("raspicam"); //include Raspberry Pi Camera module

var ws281x = require('rpi-ws281x-native');// ws281x addressable RGB strip


var piFan = new Gpio(27, 'out'); //Raspberry Pi Case Fan
piFan.writeSync(1); //Fan on when Server Starts

//===============================================//
//============    GPIO Variables     ============//
//===============================================//

var pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled



var pirSensor = new Gpio(26,'in', 'both'), motionDetectStatus = false; //Motion Detection using infrared sensor, off at launch




//=======================//
//   TP-Link plug setup  //
//=======================//

let plugs =[];

const scan = TPLSmartDevice.scan()
  .on('light', light => {
    light.info()
      .then(status => {
          newPlug = {
            name: light._sysinfo.alias,
            ip: light.ip,
            on: light._sysinfo.relay_state,
          };
          plugs.push(newPlug)
        scan.stop();
        console.log(plugs);
      })
      .catch(error => {
      })
  })
//========================//
//    ws2812b LED setup   //
//========================//

var NUM_LEDS = parseInt(process.argv[2], 10) || 25,
    pixelData = new Uint32Array(NUM_LEDS),
    pixelDataStore;

ws281x.init(NUM_LEDS);

function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

for (var i = 0; i < NUM_LEDS; i+=5) {
    pixelData[i] = rgb2Int(255,255,150);
};
ws281x.render(pixelData);

setInterval(function() {
  ws281x.render(pixelData);

},5000);


//=============//
//  Hue Setup  //
//=============//

let x;

var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
    x = rgb;
};

var displayResult2 = function(result) {
    console.log(result);
};

var hue = require("node-hue-api"),
HueApi = hue.HueApi,
lightState = hue.lightState;

var host = "192.168.1.64",
username = "8FNEwdPyoc9eVRxP7ukCnf4QFowMK2aoHOmBuJdi",
api = new HueApi(host, username), state;

var lightStatus = [];
api.lights(function(err, devices ) {
    lightStatus = [];
    if (err) throw err;
    let lightsJSON = JSON.stringify(devices, null, 2);
    lightsJSON = JSON.parse(lightsJSON);
    lightsJSON = lightsJSON.lights;

    for (let i = 0; i < lightsJSON.length; i++) {

      //If the light bulb is on, get info from the hub.
      if (lightsJSON[i].state.reachable) {
        lightStatus.push(
          {
            "name":lightsJSON[i].name,
            "type":lightsJSON[i].type,
            "id":lightsJSON[i].id,
            "state":{
                      "on":lightsJSON[i].state.on,
                      "brightness":lightsJSON[i].state.bri,
                      // If bulb is RGB, return the converted CIE colour, else return 'N/A'
                      "rgb": (lightsJSON[i].type === 'Extended color light') ? colour_converter.cie_to_rgb(lightsJSON[i].state.xy[0],lightsJSON[i].state.xy[1],lightsJSON[i].state.brightness) : "rgb(240,200,140)" ,
                    },
          }
        )
      };
  };

});

//======================================//
//   Scrapes Photos from local files    //
//======================================//

let photosDir = '../../jack/fileShare/TimeShot_Captures';
let newestPhoto = {};
fs.readdir(photosDir, function(err, files) {
  let fileArray = files;
  var newest = { file: files[0]
              };
  var checked = 0;
  fs.stat(photosDir+"/"+newest.file, function(err, stats) {
    newest.mtime = stats.mtime;
  });
  for (var i = 0; i < files.length; i++) {
    let file = fileArray[i];
    fs.stat(photosDir+"/"+file, function(err, stats) {
      ++checked;
      if (stats.mtime.getTime() > newest.mtime.getTime()) {
        newest = {
          file : file,
          mtime : stats.mtime,
          atime: stats.atime,
          birthdate: stats.birthtime,
        };
      };
      if (checked == files.length) {
        newestPhoto = newest;
        console.log(newest);
      }
    })
  }
});



// Defines locations accessible from server
app.use(express.static('public'));
app.use(express.static(photosDir));

// Very basic routing, only defines root directory. Further routing done in 'index.js'
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});


//When a client connects to the server;
io.on('connection', function(socket){
  console.log('user connected');

  //Wait for disconnection, notify when done
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('getTemperatureLog', function() {
    socket.emit('sendTemperatureLog', temperatureMonitoring.temperatureLog);
  });

  socket.on('getTPLinkPlugStatus', function() {
    socket.emit('putTPLinkPlugStatus', plugs);
  });

  //Update client with Motion Detection on/off status
  socket.emit("motionDetectSend", motionDetectStatus);

  //Update client with array of most recent photos
  socket.emit("newestPhoto", newestPhoto);

  //Wait for request, detect the status of hue lights, send to client
  socket.on('updateLightStatus', function() {
    api.lights(function(err, devices ) {
        lightStatus = [];
        if (err) throw err;
        let lightsJSON = JSON.stringify(devices, null, 2);
        lightsJSON = JSON.parse(lightsJSON);
        lightsJSON = lightsJSON.lights;
        for (let i = 0; i < lightsJSON.length; i++) {
          if (lightsJSON[i].state.reachable) {

            lightStatus.push(
              {
                "name":lightsJSON[i].name,
                "type":lightsJSON[i].type,
                "id":lightsJSON[i].id,
                "state":{
                          "on":lightsJSON[i].state.on,
                          "brightness":lightsJSON[i].state.bri,
                          "rgb": (lightsJSON[i].type === 'Extended color light') ? colour_converter.cie_to_rgb(lightsJSON[i].state.xy[0],lightsJSON[i].state.xy[1],lightsJSON[i].state.brightness) : "rgb(240,200,140)" ,
                        },
              }
            )
          };
      };

      console.log(lightStatus);

    });
    socket.emit("giveLightStatus", lightStatus);
  });

socket.on('getLightStatus', function() {
  socket.emit("giveLightStatus", lightStatus);
});


  socket.on("takePhoto", function() {
    takePhoto(displayPhoto);
    console.log("Photo taken manually!");
  });

  socket.on("sendPixelArray", function(ledPixelArray) {
    pixelDataStore = ledPixelArray;
    for (var i = 0; i < ledPixelArray.length; i++) {
      x = ledPixelArray[i].state;
      pixelData[i] = rgb2Int(x.red,x.green,x.blue);
    };
    pixelData = pixelData.reverse()
    ws281x.render(pixelData);
  });



  socket.on("motionDetectOnOff", function(motionDetect) {
    setTimeout(function() {
    motionDetectStatus = motionDetect;
    motionDetect ? console.log("Motion Detection now active!") : console.log("Motion Detection now turned off.") ;
  },1000);
  });

  let temp = fs.readFile("/sys/class/thermal/thermal_zone0/temp", function(err, data) {
  //console.log(data/1000);
  //socket.emit('piTemperatureUpdate', data/1000, cRoomTemp);
});

socket.on('rgbLed', function(data) { //get light switch status from client
   //output data from WebSocket connection to console
  //for common cathode RGB LED 0 is fully off, and 255 is fully on
  //api.setLightState(3, lightState.create().on().rgb(255,200,200).brightness(80));

  for (let i = 0; i< data.length; i++) {
  rgb = data[i].state.rgb.split('(')[1].split(')')[0].split(',');
  red=parseInt(rgb[0]);
  green=parseInt(rgb[1]);
  blue=parseInt(rgb[2]);
  brightness=parseInt(data[i].state.brightness);
  device=parseInt(data[i].id);
  lightStatus[i].state.rgb = "rgb("+red+","+green+","+blue+")";
  lightStatus[i].state.brightness = brightness;
  lightStatus[i].state.on = data[i].state.on;
  if (data[i].state.on) {
    state = lightState.create().on().rgb(red,green,blue).brightness(brightness);
    console.log("Setting "+data[i].name+" to rgb("+red+","+green+","+blue+").");
  } else {
    state = lightState.create().off();
    console.log("Turning "+data[i].name+" off.")
  };

  if (brightness <= 5) {
     state = state.off();
   };

api.setLightState(device, state);
}

});

socket.on('TPLinkPlugState', function(index) {
  let plugIp = plugs[index].ip;
  let plugPowerState = plugs[index].on ? "off" : "on";
  const light = new TPLSmartDevice(plugIp)
    light.power(!(plugs[index].on))
  .then(status => {
    console.log("Turning "+plugs[index].name+" "+plugPowerState+"!");
  })
  .catch(err => console.error(err))
    plugs[index].on = (plugs[index].on) ? 0 : 1;
});

});

//==================//
//==Camera Control==//
//==================//

let recentPhoto;
let takePhoto = function(Intruder) {

let timeNow = dateTime.getTime();
let today = dateTime.getDate();

let cameraPath = Intruder === "IntruderAlert" ? "Intruder_Detection/Intruder_Detected_" : "TimeShot_Captures/TimeShot_Me_";
    recentPhoto = "../../jack/fileShare/"+ cameraPath + today +"@"+timeNow+".jpg";

var camera = new RaspiCam({mode:"photo", output:recentPhoto, e:"jpg", width: 1920, height: 1080, log:"" , quality:100, q:100, sh: 0, co: 0,});

camera.start();
};


let emailDetails = JSON.parse(fs.readFileSync("public/static/js/emailDetails.txt"));
var transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: emailDetails.user,
    pass: emailDetails.pass
  }
});


var mailOptions = {
  from: 'ironcladjack@live.co.uk',
  to: 'ironcladjack@live.co.uk',
  subject: 'Intruder Detected',
  text: 'Date: '+dateTime.getDate()+', Time: '+dateTime.getTime(),
  attachments: [{
  filename: 'Intruder_Detected_'+dateTime.getDate()+'@'+dateTime.getTime()+'.jpg', // stream this file
  path: "../../jack/fileShare/Intruder_Detection/Intruder_Detected_To_Be_Sent.jpg",
  cid: 'Intruder_Detected_'+dateTime.getDate()+'@'+dateTime.getTime()+'.jpg',
  }]
};


let motionDetectRecent = false;

pirSensor.watch(function (err, value) {
  if (err) {
    console.error('There was an error', err);
  };
    var intruderCapture = new Promise(function(resolve, reject) {
      if (motionDetectStatus && !motionDetectRecent) {
        motionDetectRecent = true;
        console.log("Intruder Detected!")
        takePhoto("IntruderAlert");
        setTimeout(function() {
          resolve("Preparing photo for email...");
        },10000);
      };
    });
    intruderCapture.then(function(value) {
      console.log(value)
      // expected output: "Success!"
    }, function (error) {
      console.error('uh oh: ', error);   // 'uh oh: something bad happened’
    }).then(function(){
      console.log("Preparing to send photo...");
        fs.createReadStream(recentPhoto).pipe(fs.createWriteStream('../../jack/fileShare/Intruder_Detection/Intruder_Detected_To_Be_Sent.jpg'));
    }).then(function(){
        setTimeout(function() {
          console.log("Sending Photo...")
          transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }, 3000);
    }).then(function() {
      setTimeout(function() {
        motionDetectRecent = false;
        console.log("Motion Detection ready.")
      }, 10000)
    });
});




pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton GPIO, specify callback function
  if (err) { //if an error
    console.error('There was an error', err); //output error message to console
  return;
  }
  takePhoto();
});

setInterval(function() {
	takePhoto();
}, 1000*60*20);

let displayPhoto = function() {
  //SORT THIS OUT
};

//================//
//==Temp Logging==//
//================//

let temperatureLog = [];

temperatureMonitoring.getTemps(function(result) {
  console.log(result);
});
temperatureLog = temperatureMonitoring.temperatureLog;

setInterval(function() {
  temperatureMonitoring.getTemps(function(result) {
    console.log(result);
  });
  temperatureLog = temperatureMonitoring.temperatureLog;
    if (temperatureLog[0][0] > 43) {
      piFan.writeSync(1);
    } else {
      piFan.writeSync(0);
    };
}, 1000*60*5);


let port = 3000;
http.listen(port, function(){
  console.log('listening on //RASPBERRYPI:'+port);
});

process.on('SIGINT', function () { //on ctrl+c
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Closed the database connection.');
  });
  console.log("Closing down on Request.");
  ws281x.reset();
  process.exit(); //exit completely
});

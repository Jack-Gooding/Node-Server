var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var fs = require('fs'); //require filesystem module
var mongo = require('mongodb');  //require mongodb Database module

var nodemailer = require('nodemailer');


var ds18x20 = require('ds18x20');
var RaspiCam = require("raspicam"); //include Raspberry Pi Camera module

var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

var piFan = new Gpio(27, 'out');
piFan.writeSync(1); //Fan on when Server Starts

let motionDetectStatus = false;
var pirSensor = new Gpio(26,'in', 'both');

//=============//
//  Hue Setup  //
//=============//


ledRed = 0;
ledGreen = 0;
ledBlue = 0;
redRGB = 0, //set starting value of RED variable to off (0 for common cathode)
greenRGB = 0, //set starting value of GREEN variable to off (0 for common cathode)
blueRGB = 0; //set starting value of BLUE variable to off (0 for common cathode)

var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
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

let getRGB = function() {
  console.log("test");
};

var lightStatus = [];
api.lights(function(err, devices, getRGB) {
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
                      "rgb":0,
                    },
          }
        )
      };
  };

  console.log(lightStatus);

});

api.lights();


app.use(express.static('public'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});



io.on('connection', function(socket){
  console.log('user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });


  socket.on('hello', function() {
    console.log("Hello!");
  })

  socket.on("takePhoto", function() {
    takePhoto(displayPhoto);
    console.log("Photo taken manually!");
  });


  socket.on("motionDetectOnOff", function(motionDetect) {
    setTimeout(function() {
    motionDetectStatus = motionDetect;
    motionDetect ? console.log("Motion Detection now active!") : console.log("Motion Detection now turned off.") ;
  },1000);
  });

  setInterval(function() {
  let temp = fs.readFile("/sys/class/thermal/thermal_zone0/temp", function(err, data) {
  console.log(data/1000);
  socket.emit('piTemperatureUpdate', data/1000, cRoomTemp);
  if (data/1000 > 43) {
    piFan.writeSync(1);
  } else {
    piFan.writeSync(0);
  };
/*  setTimeout(function() {
  socket.emit("hueLights", lightStatus);
},1000);*/

  });
}, 10000);

socket.on('rgbLed', function(data) { //get light switch status from client
  console.log(data); //output data from WebSocket connection to console
  //for common cathode RGB LED 0 is fully off, and 255 is fully on
  //api.setLightState(3, lightState.create().on().rgb(255,200,200).brightness(80));

  for (let i = 0; i< data.length; i++) {
  rgb = data[i].state.rgb.split('(')[1].split(')')[0].split(',');
  red=parseInt(rgb[0]);
  green=parseInt(rgb[1]);
  blue=parseInt(rgb[2]);
  brightness=parseInt(data[i].state.brightness);
  device=parseInt(data[i].id);
  //lightStatus[i].state.brightness = brightness;
  //lightStatus[i].state.rgb = "rgb("+red+","+green+","+blue+")";
  //lightStatus[i].state.on = data[i].state.on;
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
});

//==================//
//==Camera Control==//
//==================//

let getTime = function() {
  var today = new Date();

  var hh = today.getHours();
  var m = today.getMinutes();
  var ss = today.getSeconds();

  if(hh<10) {
      hh = '0'+hh
  }
  if(m<10) {
      m = '0'+m
  }
  if(ss<10) {
      ss = '0'+ss
  }


  let timeNow = hh + "-" + m + "-" + ss;
  return timeNow;
}
let recentPhoto;
let getDate = function() {
  let today = new Date();

  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
      dd = '0'+dd
  }

  if(mm<10) {
      mm = '0'+mm
  }


  today = yyyy + '_' + mm + '_' + dd;
  return today;

}


let takePhoto = function(Intruder) {

let timeNow = getTime();
let today = getDate();
let cameraPath = Intruder === "IntruderAlert" ? "Intruder_Detection/Intruder_Detected_" : "TimeShot_Captures/TimeShot_Me_";
    recentPhoto = "../../jack/fileShare/"+ cameraPath + today +"@"+timeNow+".jpg";
var camera = new RaspiCam({mode:"photo", output:recentPhoto, e:"jpg", width: 1920, height: 1080, log:"" , quality:100, q:100, sh: 0, co: 0,});

camera.start();
setTimeout(function() {
if (Intruder === "IntruderAlert") {
  fs.createReadStream(recentPhoto).pipe(fs.createWriteStream('../../jack/fileShare/Intruder_Detection/Intruder_Detected_To_Be_Sent.jpg'));
  console.log(recentPhoto);
};
}, 12000);
}

var transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: 'REDACTED',
    pass: 'REDACTED'
  }
});


var mailOptions = {
  from: 'ironcladjack@live.co.uk',
  to: 'ironcladjack@live.co.uk',
  subject: 'Intruder Detected',
  text: 'Date: '+getDate()+', Time: '+getTime(),
  attachments: [{
  filename: 'Intruder_Detected_'+getDate()+'@'+getTime()+'.jpg', // stream this file
  path: "../../jack/fileShare/Intruder_Detection/Intruder_Detected_To_Be_Sent.jpg",
  cid: 'Intruder_Detected_'+getDate()+'@'+getTime()+'.jpg',
  }]
};



pirSensor.watch(function (err, value) {
  if (err) {
    console.error('There was an error', err);
  };
  if (motionDetectStatus) {
    console.log("Intruder Detected!");
    takePhoto("IntruderAlert");
    setTimeout(function() {
      transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }, 15000);
  }
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

}, 1200000);

let displayPhoto = function() {
  //SORT THIS OUT
};

//================//
//==Temp Logging==//
//================//



//==Room Temp==//

let roomTemps = new Object();
let cRoomTemp = 0


setInterval(function() {

let roomTemp;

// ... async call
ds18x20.get("28-0316c2c8bbff", function(err, value) {
  if (err) {
    console.log("Temp Sensing Error: "+err);
    return;
  } else {
  console.log('Current temperature is', value);
  roomTemp = value;
  let today = getDate();
  let timeNow = getTime();
  let timeDate = today+"_"+timeNow;
  roomTemps[timeDate] = value;
  //fs.appendFile("./tempLogging", value+"\n")
  cRoomTemp = value;
  console.log("room temp = "+cRoomTemp);

  for (x in roomTemps) {
    if (Object.keys(roomTemps).length >10) {
      delete roomTemps[x];
    };
  };
  console.log(roomTemps);

  }
});

}, 10000);


http.listen(3000, function(){
  console.log('listening on //RASPBERRYPI:8081');
});

process.on('SIGINT', function () { //on ctrl+c
  console.log("Closing down on Request.");
  process.exit(); //exit completely
});

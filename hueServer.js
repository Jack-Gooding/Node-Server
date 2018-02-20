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
let TPLSmartDevice = require('tplink-lightbulb');

let plugs;
// turn first discovered light off
const scan = TPLSmartDevice.scan()
  .on('light', light => {
    let plug = JSON.parse(JSON.stringify(light).split('ip :')[0]);
    plugs = [{
        name: plug.name,
        ip: plug.ip,
        on: plug._sysinfo.relay_state,
      },
    ];
    console.log(plugs);
        scan.stop()
  });


var ws281x = require('rpi-ws281x-native');// ws281x addressable RGB strip

var NUM_LEDS = parseInt(process.argv[2], 10) || 25,
    pixelData = new Uint32Array(NUM_LEDS);
    let pixelDataStore;

ws281x.init(NUM_LEDS);
for (var i = 0; i < NUM_LEDS; i+=5) {
    pixelData[i] = rgb2Int(255,255,150);
};
ws281x.render(pixelData);
setInterval(function() {
  ws281x.render(pixelData);

},5000);

function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

//=============//
//  Hue Setup  //
//=============//


ledRed = 0;
ledGreen = 0;
ledBlue = 0;
redRGB = 0, //set starting value of RED variable to off (0 for common cathode)
greenRGB = 0, //set starting value of GREEN variable to off (0 for common cathode)
blueRGB = 0; //set starting value of BLUE variable to off (0 for common cathode)

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

/**
 * Converts CIE color space to RGB color space
 * @param {Number} x
 * @param {Number} y
 * @param {Number} brightness - Ranges from 1 to 254
 * @return {Array} Array that contains the color values for red, green and blue
 */
function cie_to_rgb(x, y, brightness)
{
	//Set to maximum brightness if no custom value was given (Not the slick ECMAScript 6 way for compatibility reasons)
	if (brightness === undefined) {
		brightness = 254;
	}

	var z = 1.0 - x - y;
	var Y = (brightness / 254).toFixed(2);
	var X = (Y / y) * x;
	var Z = (Y / y) * z;

	//Convert to RGB using Wide RGB D65 conversion
	var red 	=  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
	var green 	= -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
	var blue 	=  X * 0.051713 - Y * 0.121364 + Z * 1.011530;

	//If red, green or blue is larger than 1.0 set it back to the maximum of 1.0
	if (red > blue && red > green && red > 1.0) {

		green = green / red;
		blue = blue / red;
		red = 1.0;
	}
	else if (green > blue && green > red && green > 1.0) {

		red = red / green;
		blue = blue / green;
		green = 1.0;
	}
	else if (blue > red && blue > green && blue > 1.0) {

		red = red / blue;
		green = green / blue;
		blue = 1.0;
	}

	//Reverse gamma correction
	red 	= red <= 0.0031308 ? 12.92 * red : (1.0 + 0.055) * Math.pow(red, (1.0 / 2.4)) - 0.055;
	green 	= green <= 0.0031308 ? 12.92 * green : (1.0 + 0.055) * Math.pow(green, (1.0 / 2.4)) - 0.055;
	blue 	= blue <= 0.0031308 ? 12.92 * blue : (1.0 + 0.055) * Math.pow(blue, (1.0 / 2.4)) - 0.055;


	//Convert normalized decimal to decimal
	red 	= Math.round(red * 255);
	green 	= Math.round(green * 255);
	blue 	= Math.round(blue * 255);

	if (isNaN(red))
		red = 0;

	if (isNaN(green))
		green = 0;

	if (isNaN(blue))
		blue = 0;


	return "rgb("+red+","+green+","+blue+")";
}

var lightStatus = [];
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
                      "rgb": (lightsJSON[i].type === 'Extended color light') ? cie_to_rgb(lightsJSON[i].state.xy[0],lightsJSON[i].state.xy[1],lightsJSON[i].state.brightness) : "rgb(240,200,140)" ,
                    },
          }
        )
      };
  };

  console.log(lightStatus);

});

app.use(express.static('public'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});



io.on('connection', function(socket){
  console.log('user connected');
  socket.emit("motionDetectSend", motionDetectStatus);
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

socket.on('getLightStatus', function() {
  socket.emit("giveLightStatus", lightStatus);
});


  socket.on("takePhoto", function() {
    takePhoto(displayPhoto);
    console.log("Photo taken manually!");
  });

  socket.on("sendPixelArray", function(ledPixelArray) {
    console.log(ledPixelArray);
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
  console.log(data/1000);
  socket.emit('piTemperatureUpdate', data/1000, cRoomTemp);
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

socket.on('TPLinkPlugState', function() {
  console.log(plugs[0].ip);
  let plugIp = plugs[0].ip;
  const light = new TPLSmartDevice(plugIp)
    light.power(!(plugs[0].on))
  .then(status => {
    console.log(status)
  })
  .catch(err => console.error(err))
    plugs[0].on = (plugs[0].on) ? 0 : 1;
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
  text: 'Date: '+getDate()+', Time: '+getTime(),
  attachments: [{
  filename: 'Intruder_Detected_'+getDate()+'@'+getTime()+'.jpg', // stream this file
  path: "../../jack/fileShare/Intruder_Detection/Intruder_Detected_To_Be_Sent.jpg",
  cid: 'Intruder_Detected_'+getDate()+'@'+getTime()+'.jpg',
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

let port = 3000;
http.listen(port, function(){
  console.log('listening on //RASPBERRYPI:'+port);
});

process.on('SIGINT', function () { //on ctrl+c
  console.log("Closing down on Request.");
  ws281x.reset();
  process.exit(); //exit completely
});

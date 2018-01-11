var http = require('http').createServer(handler); //require http server, and create server with function handler()
var path = require('path');
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var ds18x20 = require('ds18x20');
var mongo = require('mongodb');  //require mongodb Database module
var RaspiCam = require("raspicam"); //include Raspberry Pi Camera module

var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled
var piFan = new Gpio(27, 'out');
var pirSensor = new Gpio(26,'in', 'both');

piFan.writeSync(1);


ledRed = 0;
ledGreen = 0;
ledBlue = 0;
redRGB = 0, //set starting value of RED variable to off (0 for common cathode)
greenRGB = 0, //set starting value of GREEN variable to off (0 for common cathode)
blueRGB = 0; //set starting value of BLUE variable to off (0 for common cathode)

var hue = require("node-hue-api"),
    HueApi = hue.HueApi,
    lightState = hue.lightState;

var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
};

var displayResult2 = function(result) {
    console.log(result);
};

var host = "192.168.1.64",
    username = "8FNEwdPyoc9eVRxP7ukCnf4QFowMK2aoHOmBuJdi",
    api = new HueApi(host, username),
    state;


var lightStatus = [];

let getRGB = function() {
  console.log("test");
};

api.lights(function(err, devices, getRGB) {
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


http.listen(8081); //listen to port 8080

function handler (req, res) { //what to do on requests to port 8080
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file rgb.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from rgb.html
    console.log("Connected!");
    return res.end();
  });
}








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


let takePhoto = function() {

let timeNow = getTime();
let today = getDate();

var camera = new RaspiCam({mode:"photo", output:"../../jack/fileShare/TimeShot_Captures/TimeShot_Me_" + today +"@"+timeNow+".jpg", e:"jpg", width: 1920, height: 1080, log:"" , quality:100, q:100, sh: 0, co: 0,});

camera.start();
}

pirSensor.watch(function (err, value) {
  if (err) {
    console.error('There was an error', err)
  }
  console.log('Intruder Detected');
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

//================//
//==Temp Logging==//
//================//



//==Room Temp==//

let roomTemps = new Object();
let cRoomTemp = 0;
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
  fs.appendFile("./tempLogging", value+"\n")
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

io.sockets.on('connection', function (socket) {// Web Socket Connection

		setInterval(function() {
		let temp = fs.readFile("/sys/class/thermal/thermal_zone0/temp", function(err, data) {
		console.log(data/1000);
		socket.emit('piTemperatureUpdate', data/1000, cRoomTemp);
		if (data/1000 > 43) {
			piFan.writeSync(1);
		} else {
			piFan.writeSync(0);
		};

});
}, 10000);

//lightStatus = JSON.stringify(lightStatus);
//socket.emit('hueStatus', lightStatus);

//=================//
//==Socket Handle==//
//=================//


  socket.on('rgbLed', function(data) { //get light switch status from client
    console.log(data); //output data from WebSocket connection to console
    //for common cathode RGB LED 0 is fully off, and 255 is fully on
    redRGB=parseInt(data.red);
    greenRGB=parseInt(data.green);
    blueRGB=parseInt(data.blue);
    brightRGB=parseInt(data.brightness);
    device=parseInt(data.device);

state = lightState.create().on().rgb(redRGB,greenRGB,blueRGB).brightness(brightRGB);

if (brightRGB <= 5) {
	state = state.off();
}

api.setLightState(device, state);

  });
});

//================//
//==Close Handle==//
//================//


process.on('SIGINT', function () { //on ctrl+c
  fs.writeFile("./roomTemps.txt",roomTemps);
  process.exit(); //exit completely
});

//===================//
//Cookie Control Functions
//===================//


// Creates Cookies
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

// Retreives Cookies from Browsers
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Clears specific Cookies
function deleteCookie(cname) {
  document.cookie = cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// Checks if Cookie Exists
function cookieExists(cookie, base) {
    if (getCookie(cookie) > base) {
      let cookie = getCookie(cookie);
    } else {
      let cookie = base;
    }

}


let socket = io(); //load socket.io-client and connect to the host that serves the page





var rgbDevice = [{"state":{"brightness":35},},{"state":{"brightness":35},},{"state":{"brightness":35},},];
var tempDevice = [];


let ledPixelArray = [];
for (let i = 0; i < 25; i++) {
    ledPixelArray.push(
      {
        "index": i,
        "state": {
          "red": Math.round(Math.random()*255),
          "green": Math.round(Math.random()*255),
          "blue": Math.round(Math.random()*255),
        },
      },
    )
};



function openNav() { // Set the width of the side navigation to 250px
    document.getElementById("mySidenav").style.width = "250px";
};


function closeNav() {// Set the width of the side navigation to 0
    document.getElementById("mySidenav").style.width = "0";
};

$(document).keydown(function(event){
    if(event.which=="17")
        ctrlIsPressed = true;
});

$(document).keyup(function(){
    ctrlIsPressed = false;
});

var ctrlIsPressed = false;



var AngularApp = angular.module('Angular', ["ngRoute"]);
var extScope;
AngularApp.controller('AngularApp', function($scope, $compile) {
  //Camera
  $scope.motionDetect = false;
  $scope.motionDetectOn = function() {
    // toggles motionDetect & emits the value
    $scope.motionDetect = !$scope.motionDetect;
    socket.emit("motionDetectOnOff", $scope.motionDetect);
  };
      $scope.devices = [
        {"name":"Bathroom Light",
        "type":"Dimmable light",
        "id": "1",
        "state": {
          "on":true,
          "brightness":20,
          "rgb":"rgb(240,200,140)",
        },
        },
        {"name":"Bedroom Light",
        "type":"Extended color light",
        "id":"3",
        "state": {
          "on":true,
          "brightness":40,
          "rgb":"rgb(140,200,240)",
        },
        },
        {"name":"Bedside Lamp",
        "type":"Extended color light",
        "id":"4",
        "state": {
          "on":true,
          "brightness":80,
          "rgb":"rgb(200,240,140)",
        },
        },
                      ];
      $scope.red = 240;
      $scope.green = 200;
      $scope.blue = 140;
      $scope.brightness = 80;
      $scope.device = 3;
      $scope.deviceIndex = 0;
      $scope.updateSliderUI = function(deviceName, index) { //Changes all sliders and Swatches to match the current device, pulled from devices.
        $scope.device = deviceName.id;
        let rgb = deviceName.state.rgb.split("(")[1].split(")")[0].split(",");
        $scope.red = parseInt(rgb[0], 10);
        $scope.green = parseInt(rgb[1], 10);
        $scope.blue = parseInt(rgb[2], 10);
        $scope.brightness = deviceName.state.brightness;
        $scope.deviceIndex = index;
        rgbDevice = $scope.devices;
        socket.emit("rgbLed", rgbDevice);
      };
      $scope.dblclickOnOff = function(index) {  // If a device is double clicked, toggle 'ON' status of lights.
        if ($scope.devices[index].state.on) {
          $scope.devices[index].state.on = false;
          rgbDevice = $scope.devices;
        } else {
          $scope.devices[index].state.on = true;
          rgbDevice = $scope.devices;
        };
        socket.emit("rgbLed", rgbDevice);
      };

      $scope.colourUpdate = function(devices) { //OnChange for any RGB slider, update the Devices Object.
        if (devices) {
          for (let i = 0; i < devices.length; i++) {
            $scope.devices[devices[i]].state.rgb = "rgb("+$scope.red+","+$scope.green+","+$scope.blue+")";
          }
        } else {
        $scope.devices[$scope.deviceIndex].state.rgb = "rgb("+$scope.red+","+$scope.green+","+$scope.blue+")";
      }
      };

      $scope.brightnessUpdate = function() { //OnChange for the Brightness slider, update the Devices Object.
        $scope.devices[$scope.deviceIndex].state.brightness = $scope.brightness;
      };
      $scope.savedColourUpdate = function(red, green, blue) { // handles onClick even for saved colours
        $scope.red = red;
        $scope.green = green;
        $scope.blue = blue;
        if (ctrlIsPressed) {
          $scope.colourUpdate([0,1,2]);
        } else {
          $scope.colourUpdate();
        }
      };
      $scope.colourSave = function() {
        $compile($(".save-colour-active")
          .css("background","rgb("+$scope.red+","+$scope.green+","+$scope.blue+")")
          .html('<div class="remove-icon-corner"></div><p class="remove-icon">&times;</p>')
          .removeClass("save-colour-active").attr("ng-click","savedColourUpdate("+$scope.red+","+$scope.green+","+$scope.blue+")"))($scope);

        $compile($(".save-colour-inactive:first")
        .html('<div><p class="save-colour-icon" style="font-weight: 900;" ng-click="colourSave()">+</p></div>'))($scope)
        .addClass("save-colour-active").removeClass("save-colour-inactive");

        $(".save-colour-block").on({
        	mouseenter: function() {   $(this).find($(".remove-icon, .remove-icon-corner")).show();   	},
        	mouseleave: function() {   $(this).find($(".remove-icon, .remove-icon-corner")).hide();    	},
        });

        $(".remove-icon").on({
        	mouseup: function() {
            $(this).parent().parent().find(".randomise").before('<div class="col save-colour-block save-colour-inactive"></div>');
        		$(this).css("color","red").parent().remove();
            if ($(".save-colour-block").hasClass("save-colour-active")) {
            } else {
              $compile($(".save-colour-active").after('<div class="col save-colour-block save-colour-active"><div><p class="save-colour-icon" style="font-weight: 900;" ng-click="colourSave()">+</p></div></div>'))($scope);
            }
        	},
        	mouseleave: function() {
        		$(this).css("color","red");
        	},
        	mouseenter: function() {
        		$(this).css("color","blue");
        	},
        });
      };
      $scope.randomiseColours = function() { //onclick function to Ranomise Colours button
        $scope.red = Math.floor(Math.random()*255);
        $scope.green = Math.floor(Math.random()*255);
        $scope.blue = Math.floor(Math.random()*255);
        $scope.colourUpdate();
      };

      $scope.initialiseState = function(data) {
      };

      //Declaring variables for use with Settings & ng-show
      $scope.showSwatch = true;
      $scope.hueAdvanced = false;
      $scope.colourInfo = false;
      $scope.hueMostUsed = true;
      $scope.piTemp = "--";
      $scope.roomTemp = "--";


      //RGB WS2812b NeoPixel controller

      $scope.ledArray = ledPixelArray;

      $scope.pixelSelection = "single";
      $scope.pixelRed=245;
      $scope.pixelGreen=115;
      $scope.pixelBlue=175;

      $scope.pixelIndex = [0,]; //Translate which Pixel is selected

      $scope.updateLedArray = function() { //changes the associated Pixel to match the Sliders
        for (let i = 0; i < $scope.pixelIndex.length; i++) {
          $scope.ledArray[$scope.pixelIndex[i]].state.red = $scope.pixelRed;
          $scope.ledArray[$scope.pixelIndex[i]].state.green = $scope.pixelGreen;
          $scope.ledArray[$scope.pixelIndex[i]].state.blue = $scope.pixelBlue;
        }
      };
      $scope.updatePixelSliderUI = function(index) { //Changes which Pixel is selected,and updates the Sliders to match
        $scope.pixelIndex = $scope.pixelIndex.slice(0,1);
        if (index === 'input') {
          $scope.pixelIndex[0] = document.getElementById("singlePixelInput").value;
        } else if (index === 'range') {
          pixelRange = document.getElementById("rangePixelInput").value;
          pixelRange = pixelRange.split('-');
          pixelRangeStart = parseInt(pixelRange[0]);
          pixelRange = parseInt(pixelRange[1]);
          for (let i = 0; i < pixelRange; i++) {
            $scope.pixelIndex[i] = pixelRangeStart + i;
          };
        } else if (index === 'string') {
            for (let i = 0; i < 25; i++) {
              $scope.pixelIndex[i] = i;
            }
        } else {
          $scope.pixelIndex[0] = index;
        };
        $scope.pixelRed = $scope.ledArray[$scope.pixelIndex[0]].state.red;
        $scope.pixelGreen = $scope.ledArray[$scope.pixelIndex[0]].state.green;
        $scope.pixelBlue = $scope.ledArray[$scope.pixelIndex[0]].state.blue;
      };
      $scope.emitPixelArray = function() {
        socket.emit('sendPixelArray', ledPixelArray);
      };
      extScope = $scope; //allows access to the $scope object outside of the Angular Contructor
});


AngularApp.config(function($routeProvider) { //Angular routing provides these HTML docs to "<ng-view></ng-view>" element
  $routeProvider
  .when("/", {
    templateUrl : "./static/html/main.htm",
    controller : "AngularApp"
  })
  .when("/monitor", {
    templateUrl : "./static/html/monitor.htm"
  })
  .when("/camera", {
    templateUrl : "./static/html/camera.htm"
  })
  .otherwise({
    template : "<h1>404 Error</h1><p>Sorry! There's nothing here!</p>"
  });
});

window.addEventListener("load", function(){ //when page loads

});

$(document).ready(function() {

$(".device").on({
    mouseenter: function() {
        $(this).css("transform","translateY(-1px)");
    },
    mouseleave: function() {
        $(this).css("transform","translateY(0px)");
    },
    mousedown: function() {
        $(this).css("border-color","blue");
        let newDevice = $(this).attr("value");
        rgb.device = newDevice;
    },
    mouseup: function() {
        $(this).css("border-color","white");
    },
});

//Attach id="resizable" to an element to have it be vertially resizable.
$( function() {
  $( "#resizable" ).resizable({
    minHeight: 400,
    handles: 's',
stop: function(event, ui) {
    $(this).css("width", '');
}
  });
});

});

socket.on('piTemperatureUpdate', function(piTemp, roomTemp) {
	extScope.piTemp = parseInt(piTemp);
  $("#PiTemp").html("&nbsp; Pi Temp: "+piTemp+"'C");
  extScope.roomTemp = parseInt(roomTemp);
  $("#RoomTemp").html("&nbsp; Room Temp: "+roomTemp+"'C");

});

socket.on('motionDetectSend', function(motionDetect) {
  extScope.motionDetect = motionDetect;
});

socket.on('hueLights', function(data) {
  tempDevice = JSON.stringify(data);
  $("html").append(JSON.parse(tempDevice).length);
  //$("html").append(JSON.parse(tempDevice)[2].state.rgb);
  for (let i = 0; i < JSON.parse(tempDevice).length; i++) {
    extScope.$apply(function(){
      extScope.devices[i].state.brightness = JSON.parse(tempDevice)[i].state.brightness;
      extScope.brightness = JSON.parse(tempDevice)[extScope.deviceIndex].state.brightness;

      //$("html").append(JSON.parse(tempDevice)[i].state.rgb.split('(')[1].split(')')[0].split(',')[1]);
      let getrgb = JSON.parse(tempDevice)[i].state.rgb.split('(')[1].split(')')[0].split(',');
      let red = getrgb[0];
      let green = getrgb[1];
      let blue = getrgb[2];
      $("html").append("rgb("+red+","+green+","+blue+")");
      extScope.devices[i].state.rgb = "rgb("+red+","+green+","+blue+")";
      let givergb = JSON.parse(tempDevice)[extScope.deviceIndex].state.rgb.split('(')[1].split(')')[0].split(',');
      extScope.red = parseInt(givergb[0]);
      extScope.green = parseInt(givergb[1]);
      extScope.blue = parseInt(givergb[2]);

  });
};
});


//======================//
// Various Button onClick functions
//======================//


let takePhoto = function() { //onClick for Camera "fa-camera" icon
  socket.emit("takePhoto");
};

let blindControl = function(direction) { //onClick for Blinds "fa-level-direction" icon
  if (direction === "up") {
  $(".blind-control-button").addClass("fa-level-down").removeClass("fa-level-up").attr("ondblclick","blindControl('down')");
} else if (direction === "down") {
  $(".blind-control-button").removeClass("fa-level-down").addClass("fa-level-up").attr("ondblclick","blindControl('up')");
}
};


/*
socket.on('hueLightStatus', function(data) {
  data = JSON.stringify(data);
  extScope.devices = JSON.parse(data);
  $("body").append(JSON.parse(data)[1].state.brightness/100*255);
  extScope.brightness = JSON.parse(data)[1].state.brightness/100*255;
  extScope.devices[1].state.brightness = JSON.parse(data)[1].state.brightness/100*255;
});
*/

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
let ledPixelArrayStore = [];

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



let cieRGB = "wrong";

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

//document.getElementById("testing").innerHTML = "Paragraph changed!";
let rgb = cie_to_rgb(0.2, 0.7, 54);
$(document).ready(function() {
  $("body").append(rgb);
});

function openNav() { // Set the width of the side navigation to 250px
    document.getElementById("mySidenav").style.width = "250px";
};


function closeNav() {// Set the width of the side navigation to 0
    document.getElementById("mySidenav").style.width = "0";
};

let randRGBCol = function () {
  return Math.floor(Math.random()*255);
};


var ctrlIsPressed = false;
var shiftIsPressed = false;
var altIsPressed = false;

$(document).keydown(function(event){
    if (event.which=="17") {
        ctrlIsPressed = true;
      };
    if (event.which=="16") {
        shiftIsPressed = true;
    };

    if (event.which=="18") {
        altIsPressed = true;
    };
});

$(document).keyup(function(event){
    if (event.which=="17") {
        ctrlIsPressed = false;
      };
    if (event.which=="16") {
        shiftIsPressed = false;
    };

    if (event.which=="18") {
        altIsPressed = false;
    };
});

$(window).blur(function(){
  ctrlIsPressed = false;
  shiftIsPressed = false;
  altIsPressed = false;
});

var AngularApp = angular.module('Angular', ["ngRoute"]);
var extScope;
$('.device p').click(function(){
    $(this)
        .css('font-color','red')
        .siblings()
        .css('font-color','blue');
});
AngularApp.controller('AngularApp', function($scope, $interval, $compile) {
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
      $scope.colourSliderDisabled = false;
      $scope.colourSliderBlur = function(onOff) {
        if (onOff) {
          $scope.brightnessSliderBlur(true);
          $scope.brightnessSliderDisabled = true;
          $(".hueBrightnessSlider").css("opacity","0.3");
        } else {
          $scope.brightnessSliderDisabled = false;
          $scope.brightnessSliderBlur(false);
          if ($scope.devices[index].type === "Extended color light") {
          };
          $(".hueBrightnessSlider").css("opacity","1");
        };
      };
      $scope.brightnessSliderBlur = function(onOff) {
        if (onOff) {
          $scope.colourSliderDisabled = true
          $(".hueColourSlider").css("opacity","0.3");
        } else {
          $scope.colourSliderDisabled = false;
          $(".hueColourSlider").css("opacity","1");
        };
      };
      $scope.brightness = 80;
      $scope.brightnessSliderDisabled = false;
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
        if ($scope.devices[index].state.on) {
          $scope.colourSliderBlur(false);
          if ($scope.devices[index].type === "Extended color light") {
            $scope.brightnessSliderBlur(false);
          } else {
            $scope.brightnessSliderBlur(true);
          }
        } else {
          $scope.colourSliderBlur(true);
        }
      };
      $scope.sendHueData = function() {
        socket.emit("rgbLed", rgbDevice);
      }
      $scope.dblclickOnOff = function(index) {  // If a device is double clicked, toggle 'ON' status of lights.
        if ($scope.devices[index].state.on) {
          $scope.devices[index].state.on = false;
          $scope.colourSliderBlur(true);
          rgbDevice = $scope.devices;
        } else {
          $scope.devices[index].state.on = true;
          $scope.colourSliderBlur(false);
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
        		$(this).css("color","blue");
        	},
        	mouseenter: function() {
        		$(this).css("color","red");
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

      $scope.pixelSelection = "string";
      $scope.pixelRed=245;
      $scope.pixelGreen=115;
      $scope.pixelBlue=175;

      $scope.pixelIndex = []; //Translate which Pixel is selected
      for (x in ledPixelArray) {
        $scope.pixelIndex.push(x);
      };
      $scope.pixelIndexStore;
      $scope.lastPixelIndex;

      $scope.pixelSingleSelection = 1;
      $scope.pixelRangeSelection = "0-5";
      $scope.pixelStringSelection = "N/A";

      $scope.flashIndex = [];
      $scope.blinkOnOff = true;
      $scope.blink = null;
      $scope.neoPixelEffect = function() {
        effect = document.getElementById("neoPixelEffect").value;
        switch (effect) {
          case "Blink (off)":
            $scope.blinkOn("onOff");
            break;
          case "Blink (random,each,full)":
            $scope.blinkOn("random,each,full");
            break;
          case "Blink (random,each,small)":
            $scope.blinkOn("random,each,small");
            break;
          case "Blink (random,all,full)":
            $scope.blinkOn("random,all,full");
            break;
          case "Blink (random,all,small)":
            $scope.blinkOn("random,all,small");
            break;
        }
      };
      $scope.clearNeoPixelEffect = function() {
        $scope.blinkOff();
      };

      $scope.blinkOn = function(effect) {

          $scope.flashIndex = $scope.pixelIndex;

        if (angular.isDefined($scope.blink)) {
              $interval.cancel($scope.blink);
              for (let i = 0; i < $scope.ledArray.length; i++) {
                if ($scope.ledArray[i].state.savedTemp) {
                $scope.ledArray[i].state.red = $scope.ledArray[i].state.redTemp;
                $scope.ledArray[i].state.green = $scope.ledArray[i].state.greenTemp;
                $scope.ledArray[i].state.blue = $scope.ledArray[i].state.blueTemp;
              };
            };
        }


            $scope.blink = $interval(function() {
                if ($scope.blinkOnOff) {
                  $("body").append("on");
                  for (let i = 0; i < $scope.ledArray.length; i++) {
                    $scope.ledArray[i].state.redTemp = $scope.ledArray[i].state.red;
                    $scope.ledArray[i].state.greenTemp = $scope.ledArray[i].state.green;
                    $scope.ledArray[i].state.blueTemp = $scope.ledArray[i].state.blue;
                    $scope.ledArray[i].state.savedTemp = true;
                  }
                  switch (effect) {
                    case "onOff":
                      for (let i = 0; i < $scope.flashIndex.length; i++) {
                        $scope.ledArray[$scope.flashIndex[i]].state.red = 0;
                        $scope.ledArray[$scope.flashIndex[i]].state.green = 0;
                        $scope.ledArray[$scope.flashIndex[i]].state.blue = 0;
                      };
                      $scope.blinkOnOff = false;
                      break;
                    case "random,all,full":
                      r = randRGBCol();
                      g = randRGBCol();
                      b = randRGBCol();
                      for (let i = 0; i < $scope.flashIndex.length; i++) {
                        $scope.ledArray[$scope.flashIndex[i]].state.red = r;
                        $scope.ledArray[$scope.flashIndex[i]].state.green = g;
                        $scope.ledArray[$scope.flashIndex[i]].state.blue = b;
                      }
                      break;
                    case "random,all,small":
                      for (let i = 0; i < $scope.flashIndex.length; i++) {
                        $scope.ledArray[$scope.flashIndex[i]].state.red = (Math.round(Math.random()) === 1) ? $scope.ledArray[$scope.flashIndex[i]].state.red + 10 : $scope.ledArray[$scope.flashIndex[i]].state.red - 10;;
                        $scope.ledArray[$scope.flashIndex[i]].state.green = (Math.round(Math.random()) === 1) ? $scope.ledArray[$scope.flashIndex[i]].state.green + 10 : $scope.ledArray[$scope.flashIndex[i]].state.green - 10;;
                        $scope.ledArray[$scope.flashIndex[i]].state.blue = (Math.round(Math.random()) === 1) ? $scope.ledArray[$scope.flashIndex[i]].state.blue + 10 : $scope.ledArray[$scope.flashIndex[i]].state.blue - 10;;
                      }
                      break;
                    case "random,each,full":
                      for (let i = 0; i < $scope.flashIndex.length; i++) {
                        $scope.ledArray[$scope.flashIndex[i]].state.red = Math.floor(Math.random()*255);
                        $scope.ledArray[$scope.flashIndex[i]].state.green = Math.floor(Math.random()*255);
                        $scope.ledArray[$scope.flashIndex[i]].state.blue = Math.floor(Math.random()*255);
                      };
                      break;
                    case "random,each,small":
                      for (let i = 0; i < $scope.flashIndex.length; i++) {
                        $scope.ledArray[$scope.flashIndex[i]].state.red = (Math.round(Math.random()) === 1) ? $scope.ledArray[$scope.flashIndex[i]].state.red + 10 : $scope.ledArray[$scope.flashIndex[i]].state.red - 10;
                        $scope.ledArray[$scope.flashIndex[i]].state.green = (Math.round(Math.random()) === 1) ? $scope.ledArray[$scope.flashIndex[i]].state.green + 10 : $scope.ledArray[$scope.flashIndex[i]].state.green - 10;
                        $scope.ledArray[$scope.flashIndex[i]].state.blue = (Math.round(Math.random()) === 1) ? $scope.ledArray[$scope.flashIndex[i]].state.blue + 10 : $scope.ledArray[$scope.flashIndex[i]].state.blue - 10;
                      }
                      break;
                    default:
                      for (let i = 0; i < $scope.flashIndex.length; i++) {
                        $scope.ledArray[$scope.flashIndex[i]].state.red = 255;
                        $scope.ledArray[$scope.flashIndex[i]].state.green = 0;
                        $scope.ledArray[$scope.flashIndex[i]].state.blue = 0;
                      };
                  };
                  $scope.emitPixelArray();
                } else {
                  $("body").append("off");
                  for (let i = 0; i < $scope.flashIndex.length; i++) {
                    if ($scope.ledArray[$scope.flashIndex[i]].state.savedTemp) {
                    $scope.ledArray[$scope.flashIndex[i]].state.red = $scope.ledArray[$scope.flashIndex[i]].state.redTemp;
                    $scope.ledArray[$scope.flashIndex[i]].state.green = $scope.ledArray[$scope.flashIndex[i]].state.greenTemp;
                    $scope.ledArray[$scope.flashIndex[i]].state.blue = $scope.ledArray[$scope.flashIndex[i]].state.blueTemp;
                    }
                  };
                  $scope.blinkOnOff = true;
                }
              },1000);


        };
        $scope.blinkOff = function() {
          if (angular.isDefined($scope.blink)) {
            for (let i = 0; i < $scope.ledArray.length; i++) {
              $scope.ledArray[i].state.red = $scope.ledArray[i].state.redTemp;
              $scope.ledArray[i].state.green = $scope.ledArray[i].state.greenTemp;
              $scope.ledArray[i].state.blue = $scope.ledArray[i].state.blueTemp;
            };
              $interval.cancel($scope.blink);
          }
        };
        $scope.updateLedArray = function() { //changes the associated Pixel to match the Sliders
          for (let i = 0; i < $scope.pixelIndex.length; i++) {
            $scope.ledArray[$scope.pixelIndex[i]].state.red = $scope.pixelRed;
            $scope.ledArray[$scope.pixelIndex[i]].state.green = $scope.pixelGreen;
            $scope.ledArray[$scope.pixelIndex[i]].state.blue = $scope.pixelBlue;
            $scope.ledArray[$scope.pixelIndex[i]].state.redTemp = $scope.ledArray[$scope.pixelIndex[i]].state.red;
            $scope.ledArray[$scope.pixelIndex[i]].state.greenTemp = $scope.ledArray[$scope.pixelIndex[i]].state.green;
            $scope.ledArray[$scope.pixelIndex[i]].state.blueTemp = $scope.ledArray[$scope.pixelIndex[i]].state.blue;
          }
        };
      $scope.updatePixelSliderUI = function(index) { //Changes which Pixel is selected,and updates the Sliders to match

        if (!(ctrlIsPressed || shiftIsPressed || altIsPressed)) {
          $scope.pixelIndex = $scope.pixelIndex.slice(0,0);
          $(".pixelBox").removeClass("pixelBox-active");
        };

        if (index === 'input') {
          x = document.getElementById("singlePixelInput").value;
          $scope.pixelIndex[0] = x;
          $scope.pixelSingleSelection = x;
          $(".pixelBox[data='" + x +"']").addClass("pixelBox-active");

        } else if (index === 'range') {
          x = document.getElementById("rangePixelInput").value;
          pixelRange = x;
          $scope.pixelRangeSelection = x;
          if (pixelRange.includes('-')) {
            pixelRange = pixelRange.split('-');
            pixelRangeStart = parseInt(pixelRange[0]);
            pixelRange = parseInt(pixelRange[1]);
            for (let i = 0; i < pixelRange; i++) {
              $scope.pixelIndex[i] = pixelRangeStart + i;
            };
          } else if (pixelRange.includes(':')) {
            pixelRange = pixelRange.split(':');
            pixelRangeStart = parseInt(pixelRange[0]);
            pixelRange = parseInt(pixelRange[1]);
            pixelRange = pixelRange - pixelRangeStart;
            for (let i = 0; i <= pixelRange; i++) {
              $scope.pixelIndex[i] = pixelRangeStart + i;
            };
          }
        } else if (index === 'string') {
            for (let i = 0; i < 25; i++) {
              $scope.pixelIndex[i] = i;
              $(".pixelBox[data='" + i +"']").addClass("pixelBox-active");

            }
        } else {
          $scope.lastPixelIndex = $scope.pixelIndex.slice(-1)[0];
          if (ctrlIsPressed && shiftIsPressed) {
            //$scope.pixelIndexStore = $scope.pixelIndex.slice(0,1);
            let shiftStringLength =  Math.abs(index - $scope.lastPixelIndex);
            let tempStore = [];
            startPoint = (index > $scope.lastPixelIndex) ? $scope.lastPixelIndex : index;
            for (let i = 0; i <= shiftStringLength; i++) {
              let arrayValToPush = startPoint+i;
              tempStore.push(arrayValToPush);
              $(".pixelBox[data='" +arrayValToPush+"']").addClass("pixelBox-active");
            };
            $scope.pixelIndex = $scope.pixelIndex.concat(tempStore);
          }
          else if (ctrlIsPressed) {
            $scope.pixelIndex.push(index);
            $(".pixelBox[data='" + index +"']").addClass("pixelBox-active");
          }
          else if (shiftIsPressed) {
            //$scope.pixelIndexStore = $scope.pixelIndex.slice(0,1);
            $scope.pixelIndex = [$scope.lastPixelIndex];
            $(".pixelBox").removeClass("pixelBox-active");
            let shiftStringLength =  Math.abs(index - $scope.lastPixelIndex);
            let tempStore = [];
            startPoint = (index > $scope.lastPixelIndex) ? $scope.lastPixelIndex : index;
            for (let i = 0; i <= shiftStringLength; i++) {
              let arrayValToPush = startPoint+i;
              tempStore.push(arrayValToPush);
              $(".pixelBox[data='" +arrayValToPush+"']").addClass("pixelBox-active");
            };
            $scope.pixelIndex = tempStore;
          }
          else if (altIsPressed) {
            var a = $scope.pixelIndex.indexOf(index);
            $scope.pixelIndex.splice(a,1);
            $(".pixelBox[data='" + index +"']").removeClass("pixelBox-active");
          }
          else {
            $scope.pixelIndex[0] = index;
            $(".pixelBox[data='" + index +"']").addClass("pixelBox-active");
        }
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

let neoPixelEffect = function(effect) {
  alert(effect);
  //extScope.neoPixelEffect(effect);
};

AngularApp.config(function($routeProvider) { //Angular routing provides these HTML docs to "<ng-view></ng-view>" element
  $routeProvider
  .when("/", {
    templateUrl : "./static/html/main2.htm",
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
// On click/hover effects of device buttons
$(document).ready(function() {

$(".device").on({
    mouseenter: function() {
        $(this).css("");
    },
    mouseleave: function() {
        $(this).css("");
    },
    mousedown: function() {
      $(this).css({"opacity":"1", "transition": "all 0.5s"});
      $(this).siblings().css({"opacity":"0.5", "transition": "all 0.5s"});
      let newDevice = $(this).attr("value");
      rgb.device = newDevice;
        },
});

// dan test jquery
$( ".device" ).on("dblclick", function(){
  if ( !$(this).hasClass('grey') ) {
    $(this).addClass('grey');
    $(this).css("background","grey");
} else {
    $(this).removeClass('grey');
    $(this).css("background",extScope.devices[$(this).attr("data")].state.rgb);
}
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

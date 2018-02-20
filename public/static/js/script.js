
let socket = io(); //load socket.io-client and connect to the host that serves the page

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




var rgbDevice = [{"state":{"brightness":35},},{"state":{"brightness":35},},{"state":{"brightness":35},},];
var tempDevice = [];


let ledPixelArray = [];
let ledPixelArrayStore = [];
let initialPixelColour = {
  red : Math.round(Math.random()*255),
  green : Math.round(Math.random()*255),
  blue : Math.round(Math.random()*255),
  }

for (let i = 0; i < 25; i++) {
    ledPixelArray.push(
      {
        "index": i,
        "state": {
          "red": initialPixelColour.red,
          "green": initialPixelColour.green,
          "blue": initialPixelColour.blue,
        },
      },
    )
    socket.emit('sendPixelArray', ledPixelArray);
};



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

$(document).on({

    keydown: function(event){ // Watches for keydowns, changes behaviour accordingly
      if (event.which=="16") { shiftIsPressed = true;};
      if (event.which=="17") { ctrlIsPressed = true; };
      if (event.which=="18") { altIsPressed = true;  };
    },

    keyup:  function(event){ // Watches for keyups, changes behaviour accordingly
      if (event.which=="16") { shiftIsPressed = false;};
      if (event.which=="17") { ctrlIsPressed = false; };
      if (event.which=="18") { altIsPressed = false;  };
    },
});

$(window).blur(function(){
  ctrlIsPressed = false;
  shiftIsPressed = false;
  altIsPressed = false;
});

var AngularApp = angular.module('Angular', ["ngRoute"]);
var extScope;

AngularApp.controller('AngularApp', function($scope, $interval, $compile) {

  $scope.debug = true;

  //Camera
  $scope.motionDetect = false;
  $scope.motionDetectOn = function() {
    // toggles motionDetect & emits the value
    $scope.motionDetect = !$scope.motionDetect;
    socket.emit("motionDetectOnOff", $scope.motionDetect);
  };
  $scope.red = 240;
  $scope.green = 200;
  $scope.blue = 140;
  $scope.colourSliderDisabled = false;
  $scope.brightness = 80;
  $scope.brightnessSliderDisabled = false;
  $scope.device = 3;
  $scope.devices = ( !$scope.debug ) ? [{
    "name":"loading...",
    "type":"Extended color light",
    "id":0,
    "state": {
      "on":true,
      "brightness":255,
      "rgb":"rgb(255,255,255)",
    },
  },] : [
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
      },]
      $scope.initialiseHueState = function() { // called on page load, gets values from Server, re-creates $scope.devices with these values.
        $scope.devices = []; //clears $scope.devices
        for (let i = 0; i < newData.length; i++) { // creates the framework
          $scope.devices.push({
            'name': undefined,
            'type': undefined,
            'id':undefined,
            'state': {
              'on': undefined,
              'brightness': undefined,
              'rgb': undefined,
            },
          })
      };
      for (let i = 0; i < newData.length; i++) { // Fills the frame from newData
        $scope.devices[i].name = newData[i].name;
        $scope.devices[i].type = newData[i].type;
        $scope.devices[i].id = newData[i].id;
        $scope.devices[i].state.on = newData[i].state.on;
        $scope.devices[i].state.brightness = newData[i].state.brightness;
        $scope.devices[i].state.rgb = newData[i].state.rgb;
        };

      // updates the view from $scope.devices
      $scope.red = $scope.devices[0].state.rgb.split('(')[1].split(')')[0].split(',')[0];
      $scope.green = $scope.devices[0].state.rgb.split('(')[1].split(')')[0].split(',')[1];
      $scope.blue = $scope.devices[0].state.rgb.split('(')[1].split(')')[0].split(',')[2];
      $scope.brightness = $scope.devices[0].state.brightness;
      $("body").append($scope.devices);
      if ($scope.devices[0].type !== "Extended color light") {$scope.brightnessSliderBlur(true)};
      $compile($(".hueBrightnessSlider").attr("value",$scope.devices[0].state.brightness))($scope);
      };

      $scope.brightnessSliderBlur = function(onOff) {
        if (onOff) {
          $scope.colourSliderBlur(true);
          $scope.brightnessSliderDisabled = true;
          $(".hueBrightnessSlider").css("opacity","0.3");
        } else {
          $scope.brightnessSliderDisabled = false;
          if ($scope.devices[$scope.deviceIndex].type === "Extended color light") {
            $scope.colourSliderBlur(false);
          };
          $(".hueBrightnessSlider").css("opacity","1");
        }
      };
      $scope.colourSliderBlur = function(onOff) {
        if (onOff) {
          $scope.colourSliderDisabled = true
          $(".hueColourSlider").css("opacity","0.3");
        } else {
          $scope.colourSliderDisabled = false;
          $(".hueColourSlider").css("opacity","1");
        };
      };
      $scope.deviceIndex = 0;
      $scope.updateSliderUI = function(deviceName, index) { //Changes all sliders and Swatches to match the current device, pulled from devices.
        $scope.device = deviceName.id;
        let rgb = deviceName.state.rgb.split("(")[1].split(")")[0].split(",");
        $scope.red = parseInt(rgb[0], 10);
        $scope.green = parseInt(rgb[1], 10);
        $scope.blue = parseInt(rgb[2], 10);
        $scope.brightness = deviceName.state.brightness;
        $scope.deviceIndex = index;
        if ($scope.devices[index].state.on) {
          $scope.brightnessSliderBlur(false);
          if ($scope.devices[index].type === "Extended color light") {
            $scope.colourSliderBlur(false);
          } else {
            $scope.colourSliderBlur(true);
          }
        } else {
          $scope.brightnessSliderBlur(true);
        }
        $(".device").removeClass("device-active"); // Makes it look like a physical button
        $(".device[data="+index+"]").addClass("device-active");
      };
      $scope.sendHueData = function() {
        rgbDevice = $scope.devices;
        socket.emit("rgbLed", rgbDevice);
      }
      $scope.dblclickOnOff = function(index) {  // If a device is double clicked, toggle 'ON' status of lights.
        if ($scope.devices[index].state.on) {
          $scope.devices[index].state.on = false;
          rgbDevice = $scope.devices;
          $scope.brightnessSliderBlur(true);
        } else {
          $scope.devices[index].state.on = true;
          rgbDevice = $scope.devices;
          $scope.brightnessSliderBlur(false);
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
        if ($scope.devices[$scope.deviceIndex].type === "Extended color light") {
          $scope.red = red;
          $scope.green = green;
          $scope.blue = blue;
          if (ctrlIsPressed) { // If CTRL is pressed, update all relevant colour
            let targets = [];
            for (let i = 0; i < $scope.devices.length; i++) {
              if ($scope.devices[i].type === "Extended color light") {
                targets.push(i);
              }
            }
            $scope.colourUpdate(targets);
          } else {
            $scope.colourUpdate();
          }
        }
      };
      $scope.colourSave = function() {
        $compile($(".save-colour-active")
          .css("background","rgb("+$scope.red+","+$scope.green+","+$scope.blue+")")
          .html('<div class="remove-icon-corner"></div><p class="remove-icon">&times;</p>')
          .removeClass("save-colour-active").attr("ng-click","savedColourUpdate("+$scope.red+","+$scope.green+","+$scope.blue+")"))($scope);

        $compile($(".save-colour-inactive:first")
        .html('<div><p class="save-colour-icon" ng-click="colourSave()">+</p></div>'))($scope)
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
              $compile($(".save-colour-active").after('<div class="col save-colour-block save-colour-active"><div><p class="save-colour-icon" ng-click="colourSave()">+</p></div></div>'))($scope);
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
        if ($scope.devices[$scope.deviceIndex].type === "Extended color light") {
          $scope.red = Math.floor(Math.random()*255);
          $scope.green = Math.floor(Math.random()*255);
          $scope.blue = Math.floor(Math.random()*255);
        };
        if (ctrlIsPressed) { // If CTRL is pressed, update all relevant colour
          let targets = [];
          for (let i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].type === "Extended color light") {
              targets.push(i);
            }
          }
          $scope.colourUpdate(targets);
        } else {
          $scope.colourUpdate();
        }
      };

      $scope.initialiseState = function(data) {
      };

      //Declaring variables for use with Settings & ng-show
      $scope.showSwatch = true;
      $scope.hueAdvanced = false;
      $scope.colourInfo = true;
      $scope.hueMostUsed = true;
      $scope.piTemp = "--";
      $scope.roomTemp = "--";


      //RGB WS2812b NeoPixel controller

      $scope.ledArray = ledPixelArray;

      $scope.pixelSelection = "string";
      $scope.pixelRed=$scope.ledArray[0].state.red;
      $scope.pixelGreen=$scope.ledArray[0].state.green;
      $scope.pixelBlue=$scope.ledArray[0].state.blue;

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
      $scope.updatePixelSliderUI = function(index) { //Changes which Pixel(s) are selected,and updates the Sliders to match

        if (!(ctrlIsPressed || shiftIsPressed || altIsPressed)) { //clears the current selection if no keys are held down
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
        } else { //Assuming now that a pixel has been clicked
          $scope.lastPixelIndex = $scope.pixelIndex.slice(-1)[0];
          if (ctrlIsPressed && shiftIsPressed) { //handles adding range to selection
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
          else if (ctrlIsPressed) { //handles adding pixel to selection
            $scope.pixelIndex.push(index);
            $(".pixelBox[data='" + index +"']").addClass("pixelBox-active");
          }
          else if (shiftIsPressed) { //handles changing selection to new range
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
          else if (altIsPressed) { // handles removing pixel from selection
            var a = $scope.pixelIndex.indexOf(index);
            $scope.pixelIndex.splice(a,1);
            $(".pixelBox[data='" + index +"']").removeClass("pixelBox-active");
          }
          else {  // changes selection to new pixel
            $scope.pixelIndex[0] = index;
            $(".pixelBox[data='" + index +"']").addClass("pixelBox-active");
            $scope.pixelSelection = 'single';
        }
        if ($scope.pixelIndex.length > 1) { // Updates selection boxes
          $scope.pixelSelection = 'range';
        };
        };
        $scope.pixelRed = $scope.ledArray[$scope.pixelIndex[0]].state.red;
        $scope.pixelGreen = $scope.ledArray[$scope.pixelIndex[0]].state.green;
        $scope.pixelBlue = $scope.ledArray[$scope.pixelIndex[0]].state.blue;
      };


      $scope.emitPixelArray = function() {
        socket.emit('sendPixelArray', ledPixelArray);
      };

      // TP-Link controller
      $scope.TPLinkOnColour = "#EECCAA";
      $scope.TPLinkOffColour = "#bbb";
      $scope.TPLinkDevices = [{
            name: "The Magic",
            ip: "192.168.0.95",
            on: 0,
            background: $scope.TPLinkOffColour,
          },{
            name: "Desk Fan",
            ip: "192.168.0.96",
            on: 1,
            background: $scope.TPLinkOnColour,
          },
        ];
      $scope.TPLinkDeviceOnOff = function(index) {
        if ($scope.TPLinkDevices[index].on) {
          $scope.TPLinkDevices[index].on = 0;
          $scope.TPLinkDevices[index].background = $scope.TPLinkOffColour;
        } else {
          $scope.TPLinkDevices[index].on = 1;
          $scope.TPLinkDevices[index].background = $scope.TPLinkOnColour;
        };
        socket.emit("TPLinkPlugState", true);
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
    templateUrl : "./static/html/control-center.htm",
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
$(document).ready(function() {

$( ".device" ).on("dblclick", function(){
  if (!$(this).hasClass('grey')) {
    $(this).addClass('grey').css("background","grey");
} else {
    $(this).removeClass('grey').css("background",extScope.devices[$(this).attr("data")].state.rgb);
}
});
$(".fa-chevron-right").click(function(){
  $(this).animate({'-moz-transform': "rotate(45deg)"},200);
})
});
//Attach id="resizable" to an element to have it be vertially resizable.
/*$( function() {
  $( "#resizable" ).resizable({
    minHeight: 400,
    handles: 's',
stop: function(event, ui) {
    $(this).css("width", '');
}
  });
});*/

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


setTimeout(function() {
socket.emit('getLightStatus');
},500);

let newData = [];
socket.on('giveLightStatus', function(data) {
  newData = data;
  extScope.initialiseHueState();
});

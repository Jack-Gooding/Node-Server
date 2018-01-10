
var socket = io(); //load socket.io-client and connect to the host that serves the page

socket.on('piTemperatureUpdate', function(piTemp, roomTemp) {
	document.getElementById("PiTemp").innerHTML = "Raspberry Pi Temp: "+piTemp;
  document.getElementById("RoomTemp").innerHTML = "Room Temp: "+roomTemp;

});

socket.on('hueStatus', function(lightStatus) {
  lightStatus = JSON.parse(lightStatus);
  $("body").append(lightStatus);
});


var rgb = w3color("rgb(0,0,0)"); //we use the w3color.js library to keep the color as an object
window.addEventListener("load", function(){ //when page loads
  var rSlider = document.getElementById("redSlider");
  var gSlider = document.getElementById("greenSlider");
  var bSlider = document.getElementById("blueSlider");
  var brightSlider = document.getElementById("brightSlider");
  var picker = document.getElementById("pickColor");
  var light = document.getElementById("light");


var ctrlIsPressed;

  $(document).keydown(function(event){
    if(event.which=="17")
        ctrlIsPressed = true;
});


$(".deviceControl").dblclick(function() {
  if (rgb.lightness < 5) {
    rgb.lightness = 100;
  } else {
    rgb.lightness = 0;
  };
  brightSlider.value = rgb.lightness;
  socket.emit("rgbLed", rgb);

});

$(".deviceControl").mousedown(function() {
  if(ctrlIsPressed != true) {
    $(".deviceControl").removeClass("activeLight");
  };
  $(this).addClass("activeLight");
  rgb.whiteness = $(this).attr("data");
  socket.emit("rgbLed", rgb);
});

  $(".submit").click(function() {
    socket.emit("rgbLed", rgb);
  });

  rSlider.addEventListener("change", function() { //add event listener for when red slider changes
    rgb.red = this.value; //update the RED color according to the slider
    colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
    //socket.emit("rgbLed", rgb); //send the updated color to RGB LED via WebSocket
  });
  gSlider.addEventListener("change", function() { //add event listener for when green slider changes
    rgb.green = this.value; //update the GREEN color according to the slider
    colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
    //socket.emit("rgbLed", rgb); //send the updated color to RGB LED via WebSocket
  });
  bSlider.addEventListener("change", function() { //add event listener for when blue slider changes
    rgb.blue = this.value;  //update the BLUE color according to the slider
    colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
    //socket.emit("rgbLed", rgb); //send the updated color to RGB LED via WebSocket
  });
  brightSlider.addEventListener("change", function() { //add event listener for when blue slider changes
    rgb.lightness = this.value;  //update the BLUE color according to the slider
    colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
    //socket.emit("rgbLed", rgb); //send the updated color to RGB LED via WebSocket
  });
  picker.addEventListener("input", function() { //add event listener for when colorpicker changes
    rgb.red = w3color(this.value).red; //Update the RED color according to the picker
    rgb.green = w3color(this.value).green; //Update the GREEN color according to the picker
    rgb.blue = w3color(this.value).blue; //Update the BLUE color according to the picker
    colorShow.style.backgroundColor = rgb.toRgbString();  //update the "Current color"
    rSlider.value = rgb.red;  //Update the RED slider position according to the picker
    gSlider.value = rgb.green;  //Update the GREEN slider position according to the picker
    bSlider.value = rgb.blue;  //Update the BLUE slider position according to the picker
   socket.emit("rgbLed", rgb);  //send the updated color to RGB LED via WebSocket
  });
});

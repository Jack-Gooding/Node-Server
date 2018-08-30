var colour_converter = require('./modules/colour_converter');


var hueModule = require("node-hue-api");
var HueApi = hueModule.HueApi;
var lightState = hueModule.lightState;
var hue = new HueApi();

let fs = require('fs');

var lightState = hue.lightState;


let hueData = [],
    hueBridgeIP = "",
    hueBridgeUsername = "",
    api;



var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
};


//Search for a hue bridge on the local network
hueModule.nupnpSearch(function(err, result) {
  if (err) throw err;

  //Parse the found bridge to find the ipaddress
  hueBridgeIP = JSON.stringify(result[0].ipaddress);
  hueBridgeIP = hueBridgeIP.replace(/"/g,"");
  console.log("Found Bridge: "+hueBridgeIP);

  //Check for an existing user account
  fs.stat('hueUser.txt', function(err, stat) {
    if(err == null) {
      fs.readFile('hueUser.txt', function(err, userId) {
        if (err) throw err;
        hueBridgeUsername = JSON.parse(userId);
        console.log("Found User: "+ hueBridgeUsername);

      api = new HueApi(hueBridgeIP, hueBridgeUsername);
    //If there is an existing user Account
      console.log(api);

      api.lights(function(err, devices) {
          hueData = [];
          if (err) throw err;
          let lightsJSON = JSON.stringify(devices, null, 2);
          lightsJSON = JSON.parse(lightsJSON);
          lightsJSON = lightsJSON.lights;

          for (let i = 0; i < lightsJSON.length; i++) {

            //If the light bulb is on, get info from the hub.
            if (lightsJSON[i].state.reachable) {
              hueData.push(
                {
                  "name":lightsJSON[i].name,
                  "type":lightsJSON[i].type,
                  "id":lightsJSON[i].id,
                  "state":{
                            "on":lightsJSON[i].state.on,
                            "brightness":lightsJSON[i].state.bri,
                            // If bulb is RGB, return the converted CIE colour, else return 'N/A'
                            //"rgb": (lightsJSON[i].type === 'Extended color light') ? colour_converter.cie_to_rgb(lightsJSON[i].state.xy[0],lightsJSON[i].state.xy[1],lightsJSON[i].state.brightness) : "rgb(240,200,140)" ,
                          },
                }
              )
            };
        };
        console.log(hueData);

        hueData.forEach(function(element){
          api.setLightState(element.id, {"on": true}).done();
        })

      });
      });


} else if(err.code == 'ENOENT') {
      console.log("no file found")
    //Create a user and update hueUser.txt
      hue.createUser(hueBridgeIP, function(err, user) {
        if (err) throw err;
        hueBridgeUsername = result;
        //Save new user to file
        fs.writeFile('hueUser.txt', user, (err) => {
          if (err) throw err;
          console.log("User created and saved! - " + JSON.stringify(user));
        });
      });

    } else {
        console.log('An error with detecting the hueUser.txt: ', err.code);
    };
  });
});

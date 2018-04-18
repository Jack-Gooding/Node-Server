let fs = require('fs');
var dateTime = require('./dateTime');
const sqlite3 = require('sqlite3').verbose();
var ds18x20 = require('ds18x20'); // ds18x20 temperature sensor,  1-wire, serial
var sensor = require('node-dht-sensor');

let db = new sqlite3.Database('./public/database/tempertature_monitor.db', (err) => {

  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the temperature monitor SQlite database.');
});

db.serialize(() => {

db.run(`CREATE TABLE if not exists DHT22Log(
  DHT22id integer PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  temperature NUMBER NOT NULL,
  humidity NUMBER NOT NULL)`,
  function(err) {
    if (err) { return console.log(err) };
  });

db.run(`CREATE TABLE if not exists TemperatureLog(
  temperatureid integer PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  temperature NUMBER NOT NULL)`,
  function(err) {
  if (err) { return console.log(err) };
});


});

let temperatureLog = [["Raspi-Temp"],["Desk-Temp"],["DHT22-Temp"],["DHT22-Humidity"]];

let getTemps = function() {

  let currentTime = dateTime.getTime();
  let currentDate = dateTime.getDate();


let temp = fs.readFile("/sys/class/thermal/thermal_zone0/temp", function(err, data) {
  data /= 1000;


db.serialize(() => {
// insert one row into the langs table
db.run(`INSERT INTO TemperatureLog(date, time, location, temperature) VALUES('${currentDate}', '${currentTime}' , 'RaspberryPi', ${data})`, function(err) {
  if (err) { return console.log(err.message)};
  console.log(`A row has been inserted into TemperatureLog with rowid ${this.lastID} and location: RaspberryPi`);
});

temperatureLog[0] = [];
db.each(`SELECT temperatureid, date, time, location, temperature FROM TemperatureLog WHERE location = 'RaspberryPi' ORDER BY temperatureid DESC LIMIT 5`, (err, row) => {
  if (err){
    throw err;
  }
  temperatureLog[0].push(JSON.stringify(row));
  //console.log(`${JSON.stringify(row)}`);
});

});


});

// ... async call
ds18x20.get("28-0316c2c8bbff", function(err, value) {
  if (err) {    console.log("Temp Sensing Error: "+err); };

  db.serialize(() => {
  // insert one row into the langs table
  db.run(`INSERT INTO TemperatureLog(date, time, location, temperature) VALUES('${currentDate}', '${currentTime}' , 'Desk', ${value})`, function(err) {
    if (err) { return console.log(err.message)};
      console.log(`A row has been inserted into TemperatureLog with rowid ${this.lastID} and location: Desk`);
  });

temperatureLog[1] = [];
  db.each(`SELECT temperatureid, date, time, location, temperature FROM TemperatureLog WHERE location = 'Desk' ORDER BY temperatureid DESC LIMIT 5`, (err, row) => {
    if (err){
      throw err;
    }
    temperatureLog[1].push(JSON.stringify(row));
    //console.log(`${JSON.stringify(row)}`);
  });

  });
});

sensor.read(22, 16, function(err, temperature, humidity) {
    if (!err) {

      db.serialize(() => {
      // insert one row into the langs table
      db.run(`INSERT INTO DHT22Log(date, time, location, temperature, humidity) VALUES('${currentDate}', '${currentTime}' , 'Desk', ${temperature}, ${humidity})`, function(err) {
        if (err) { return console.log(err.message)};
        console.log(`A row has been inserted into DHT22Log with rowid ${this.lastID}`);
      });

    temperatureLog[2] = [];
      db.each(`SELECT DHT22id, date, time, location, temperature, humidity FROM DHT22Log WHERE location = 'Desk' ORDER BY DHT22id DESC LIMIT 5`, (err, row) => {
        if (err){
          throw err;
        }
        temperatureLog[2].push(JSON.stringify(row));
        //console.log(`${JSON.stringify(row)}`);
      });

      });

        console.log('temp: ' + temperature.toFixed(1) + '°C, ' +
            'humidity: ' + humidity.toFixed(1) + '%'
        );
    }
});


return temperatureLog;



};


exports.getTemps = getTemps;
exports.temperatureLog = temperatureLog;

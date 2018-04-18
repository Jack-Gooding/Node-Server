const sqlite3 = require('sqlite3').verbose();
var ds18x20 = require('ds18x20');

let db = new sqlite3.Database('./public/database/tempertature_monitor.db', (err) => {

  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the temperature monitor SQlite database.');
});

db.serialize(() => {

db.run(`CREATE TABLE if not exists langs( temperatureid integer PRIMARY KEY,
                                          date TEXT NOT NULL,
                                          time TEXT NOT NULL,
                                          location TEXT NOT NULL,
                                          temperature NUMBER NOT NULL)`, function(err) {
  if (err) { return console.log(err) };
});


});

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

setInterval(function() {

let roomTemp;

// ... async call
ds18x20.get("28-0316c2c8bbff", function(err, value) {
  if (err) {    console.log("Temp Sensing Error: "+err); };

  let today = getDate();
  let timeNow = getTime();
  let timeDate = today+"_"+timeNow;

  db.serialize(() => {
  // insert one row into the langs table
  db.run(`INSERT INTO langs(date, time, location, temperature) VALUES('${today}', '${timeNow}' , 'Desk', ${value})`, function(err) {
    if (err) { return console.log(err.message)};
    console.log(`A row has been inserted with rowid ${this.lastID}`);
  });

  db.each(`SELECT temperatureid, date, time, location, temperature FROM langs ORDER BY temperatureid DESC LIMIT 5`, (err, row) => {
    if (err){
      throw err;
    }
    console.log(`${JSON.stringify(row)}`);
  });

  });
});
}, 1000*60*5);

process.on('SIGINT', function () { //on ctrl+c
  console.log("Closing down on Request.");
  // close the database connection
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Closed the database connection.');
  });
  process.exit(); //exit completely
});

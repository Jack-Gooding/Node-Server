exports.getTime = function() {
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


  return hh + "-" + m + "-" + ss;
}

exports.getDate = function() {
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


  return yyyy + '_' + mm + '_' + dd;
}

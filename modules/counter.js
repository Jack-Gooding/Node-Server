let counter = 3;
function incCounter() {
  counter++;
  console.log(counter);
}

module.exports.counter = counter;
module.exports.incCounter = incCounter;

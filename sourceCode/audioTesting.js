/*
// Web Audio API Testing

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
// var osc = audioContext.createOscillator();
// var gain = audioContext.createGain();

//osc.type = e.currentTarget.id;

// osc.type = 'sine';
// osc.frequency.value = 261.63;
//osc.start(0);
// osc.connect(audioContext.destination);


// gain.gain.value = 0;
// gain.connect(audioContext.destination);

// setTimeout(function() {
//   osc.stop(0);
// }, 2000);

var osc;


var activeOscs = [];


document.addEventListener('keydown', (e) => {
  //if (!audioInitiated) { initAudio(); }
  if (e.key == 'k') {
    if (osc) { return; }

    // osc = audioContext.createOscillator();
    // osc.type = 'sine';
    // osc.frequency.value = 261.63;
    // osc.connect(audioContext.destination);
    // osc.start(0);

    //gain = audioContext.createGain();
    //gain.gain.value = .4;
    //gain.connect(audioContext.destination);

    createOsc();

  } else if (e.key == 'l') {
    osc.stop(0);
    osc = null;
    //gain.value = 0;

  }
});

// var audioInitiated = false;
// function initAudio() {
//   audioInitiated = true;
//   osc.start(0);
// }

function createOsc() {
  // var index = activeOscs.push({
  //   type: 'sine',
  //   freqVal: 261.63,
  //   dest: audioContext.destination
  // }) - 1;

  //var index = activeOscs.push(audioContext.createOscillator()) - 1;

  // index.type = 'sine';
  // index.frequency.value = 261.63;
  // index.connect(audioContext.destination);
  // index.start(0);


  var newOsc = audioContext.createOscillator();
  newOsc.type = 'sine';
  newOsc.frequency.value = 261.63;
  newOsc.connect(audioContext.destination);
  newOsc.start(0);

  activeOscs.push(newOsc);
}

function audioLoop() {
  if (activeOscs.length <= 0) { return; }
  console.log(activeOscs);
  activeOscs.forEach((item, i) => {
    if (!item.start(0)) {
      item.start(0);
    }
  });
}

setInterval(audioLoop, 1000);

*/

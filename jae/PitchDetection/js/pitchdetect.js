/*
The MIT License (MIT)

Copyright (c) 2014 Chris Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var setIntervalTimeRate = 1000; // milliseconds
var audioContext = null;
var isPlaying = false;
var sourceNode = null;
var analyser = null;
var theBuffer = null;
var DEBUGCANVAS = null;
var graphCanvas = null;
var mediaStreamSource = null;
var noteArray = [];
var detectorElem, 
  canvasElem,
  waveCanvas,
  noteCanvas,
  pitchElem,
  noteElem,
  detuneElem,
  detuneAmount;

window.onload = function() {

  audioContext = new AudioContext();

  // corresponds to a 5kHz signal
  // MAX_SIZE = Math.max(4, Math.floor(audioContext.sampleRate / 5000));  
  
  var onFileChange = function(callback, event) {
    var reader = new FileReader();
    reader.readAsArrayBuffer(event.target.files[0]);

    reader.onload = function(e) {
      callback(e.target.result);
    };
  };

  var loadSong = function(audioData) {
    console.log('Song Loaded');

    audioContext.decodeAudioData(audioData, function(arrayBuffer) {
      theBuffer = arrayBuffer;
    });

  };

  $('#fileInput').change(function(event) {
    onFileChange(loadSong, event);
  });

  detectorElem = document.getElementById( 'detector' );
  canvasElem = document.getElementById( 'output' );
  DEBUGCANVAS = document.getElementById( 'waveform' );
  graphCanvas = document.getElementById( 'pitchGraph' );

  if (DEBUGCANVAS) {
    waveCanvas = DEBUGCANVAS.getContext('2d');
    waveCanvas.strokeStyle = 'black';
    waveCanvas.lineWidth = 1;
  }

  // pitch graph canvas
  if (graphCanvas) {
    noteCanvas = graphCanvas.getContext('2d');
    noteCanvas.strokeStyle = 'black';
    noteCanvas.lineWidth = 1;
  }

  pitchElem = document.getElementById( 'pitch' );
  noteElem = document.getElementById( 'note' );
  detuneElem = document.getElementById( 'detune' );
  detuneAmount = document.getElementById( 'detune_amt' );

  // detectorElem.ondragenter = function () { 
  //   this.classList.add('droptarget'); 
  //   return false; 
  // };
  // detectorElem.ondragleave = function () { 
  //   this.classList.remove('droptarget'); 
  //   return false; 
  // };
  // detectorElem.ondrop = function (e) {
  //   this.classList.remove('droptarget');
  //   e.preventDefault();
  //   theBuffer = null;

  //   var reader = new FileReader();
  //   reader.onload = function (event) {
  //     audioContext.decodeAudioData( event.target.result, function(buffer) {
  //       theBuffer = buffer;
  //     }, function() { alert('error loading!'); } ); 
  //   };
  //   reader.onerror = function (event) {
  //     alert('Error: ' + reader.error );
  //   }; 
  //   reader.readAsArrayBuffer(e.dataTransfer.files[0]);
  //   return false;
  // };
};

var error = function() {
  alert('Stream generation failed.');
};

var toggleOscillator = function() {
  if (isPlaying) {
    //stop playing and return
    sourceNode.stop( 0 );
    sourceNode = null;
    analyser = null;
    isPlaying = false;

    // if (!window.cancelAnimationFrame) {
    //   window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
    // }
    // window.fjcancelAnimationFrame( rafID );
    return 'play oscillator';
  }

  sourceNode = audioContext.createOscillator();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  sourceNode.connect( analyser );
  analyser.connect( audioContext.destination );
  sourceNode.start(0);
  isPlaying = true;
  isLiveInput = false;

  setInterval(updatePitch, setIntervalTimeRate);

  return 'stop oscillator';
};

var toggleLiveInput = function() {
  if (isPlaying) {
    // stop playing and return
    // sourceNode.stop( 0 );
    sourceNode = null;
    analyser = null;
    isPlaying = false;
    mediaStreamSource.disconnect(analyser);

    return 'use live input';
    // if (!window.cancelAnimationFrame) {
    //   window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
    // }
    // window.cancelAnimationFrame( rafID );
  }
  // getUserMedia({
  //   'audio': {
  //     'mandatory': {
  //       'googEchoCancellation': 'false',
  //       'googAutoGainControl': 'false',
  //       'googNoiseSuppression': 'false',
  //       'googHighpassFilter': 'false'
  //     },
  //     'optional': []
  //   },
  // }, gotStream);
  
  getUserAudio();

  return 'stop live input';
  
};

// var gotStream = function(stream) {
//   // Create an AudioNode from the stream.
//   mediaStreamSource = audioContext.createMediaStreamSource(stream);

//   // Connect it to the destination.
//   analyser = audioContext.createAnalyser();
//   analyser.fftSize = 2048;
//   mediaStreamSource.connect( analyser );
  
//   setInterval(updatePitch, setIntervalTimeRate);
// };
// 
// var getUserMedia = function(dictionary, callback) {
//   try {
//     navigator.getUserMedia = 
//       navigator.getUserMedia ||
//       navigator.webkitGetUserMedia ||
//       navigator.mozGetUserMedia;

//     navigator.getUserMedia(dictionary, callback, error);
//   } catch (e) {
//     alert('getUserMedia threw exception :' + e);
//   }
// };


var getUserAudio = function() {
  // The user will be prompted whether he will permit the browser
  // to record the audio. If given permission, this script will
  // create a MediaStream object from user input. 
  // The script then connects the audio source to the analyser
  // node. Visualization is then run on ten times a second.
  // NOTE that the source is not connected to any destination.
  // This is allowed by Web Audio, and it just means that 
  // the user audio won't be played back.

  // navigator.mediaDevices.getUserMedia({audio: true})
  //   .then(function(mediaStream) {
  //     console.log('Getting user audio');
  //     mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

  //     analyser = audioContext.createAnalyser();
  //     analyser.fftSize = 2048;
  //     mediaStreamSource.connect( analyser );

  //     setInterval(updatePitch, setIntervalTimeRate);
  //   });
  //   
  console.log('inside GetUserAudio function');

  navigator.webkitGetUserMedia({audio: true}, function(mediaStream) {
    console.log('Getting user audio');
    mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect( analyser );
    // sourceNode.start(0);
    isPlaying = true;
    isLiveInput = true;

    setInterval(updatePitch, setIntervalTimeRate);
  }, function(error) { console.log(error); });
};

var togglePlayback = function() {
  if (isPlaying) {
    //stop playing and return
    sourceNode.stop( 0 );
    sourceNode = null;
    analyser = null;
    isPlaying = false;

    // if (!window.cancelAnimationFrame) {
    //   window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
    // }
    // window.cancelAnimationFrame( rafID );
    
    return 'start';
  }

  sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = theBuffer;
  sourceNode.loop = true;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  sourceNode.connect( analyser );
  analyser.connect( audioContext.destination );
  sourceNode.start( 0 );
  isPlaying = true;
  isLiveInput = false;

  setInterval(updatePitch, setIntervalTimeRate);

  return 'stop';
};

var rafID = null;
var tracks = null;
var buflen = 1024;
var buf = new Float32Array( buflen );

var noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

var noteFromPitch = function( frequency ) {
  var noteNum = 12 * (Math.log( frequency / 440 ) / Math.log(2) );
  return Math.round( noteNum ) + 69;
};

var frequencyFromNoteNumber = function( note ) {
  return 440 * Math.pow(2, (note - 69) / 12);
};

var centsOffFromPitch = function( frequency, note ) {
  return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note )) 
    / Math.log(2) );
};

var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
var GOOD_ENOUGH_CORRELATION = 0.9; // this is the 'bar' for how close a correlation needs to be


// The algorithm that calculates the autocorrelation (ac) which is equal to the pitch
var autoCorrelate = function( buf, sampleRate ) {
  var SIZE = buf.length;
  var MAX_SAMPLES = Math.floor(SIZE / 2);
  var bestOffset = -1;
  var bestCorrelation = 0;
  var rms = 0;
  var foundGoodCorrelation = false;
  var correlations = new Array(MAX_SAMPLES);

  for (var i = 0; i < SIZE; i++) {
    var val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) { // not enough signal
    return -1;
  }

  var lastCorrelation = 1;
  for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    var correlation = 0;

    for (var i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs((buf[i]) - (buf[i + offset]));
    }
    correlation = 1 - (correlation / MAX_SAMPLES);
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      // Now we need to tweak the offset - by interpolating between the values to the left and right of the
      // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on correlations[] around bestOffset in order to better determine precise
      // (anti-aliased) offset.

      // we know bestOffset >=1, 
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
      // we can't drop into this clause until the following pass (else if).
      var shift = (correlations[ bestOffset + 1] - correlations[ bestOffset - 1 ]) / correlations[bestOffset];  
      return sampleRate / ( bestOffset + (8 * shift));
    }
    lastCorrelation = correlation;
  }
  if (bestCorrelation > 0.01) {
    // console.log('f = ' + sampleRate/bestOffset + 'Hz (rms: ' + rms + ' confidence: ' + bestCorrelation + ')')
    return sampleRate / bestOffset;
  }
  return -1;
  //  var best_frequency = sampleRate/bestOffset;
};

var updatePitch = function( time ) {
  if (!isPlaying) {
    return;
  }
  var cycles = new Array;
  analyser.getFloatTimeDomainData( buf );
  console.log('Buffer: ', buf);
  var ac = autoCorrelate( buf, audioContext.sampleRate );
  // TODO: Paint confidence meter on canvasElem here.

  if (DEBUGCANVAS) {  // This draws the current waveform, useful for debugging
    waveCanvas.clearRect(0, 0, 512, 256);
    waveCanvas.strokeStyle = 'red';
    waveCanvas.beginPath();
    waveCanvas.moveTo(0, 0);
    waveCanvas.lineTo(0, 256);
    waveCanvas.moveTo(128, 0);
    waveCanvas.lineTo(128, 256);
    waveCanvas.moveTo(256, 0);
    waveCanvas.lineTo(256, 256);
    waveCanvas.moveTo(384, 0);
    waveCanvas.lineTo(384, 256);
    waveCanvas.moveTo(512, 0);
    waveCanvas.lineTo(512, 256);
    waveCanvas.stroke();
    waveCanvas.strokeStyle = 'black';
    waveCanvas.beginPath();
    waveCanvas.moveTo(0, buf[0]);
    for (var i = 1; i < 512; i++) {
      waveCanvas.lineTo(i, 128 + (buf[i] * 128));
    }
    waveCanvas.stroke();
  }

  if (ac === -1) {
    detectorElem.className = 'vague';
    console.log('vague autocorrelation');
    pitchElem.innerText = '--';
    noteElem.innerText = '-';
    detuneElem.className = '';
    detuneAmount.innerText = '--';
  } else {
    detectorElem.className = 'confident';
    console.log('confident autocorrelation');
    pitch = ac;
    pitchElem.innerText = Math.round( pitch );


    var note = noteFromPitch( pitch );
    noteElem.innerHTML = noteStrings[note % 12];

    // store pitch into noteArray
    noteArray.push(note % 12);
    console.log('note array: ', noteArray);
    drawNoteGraph();

    var detune = centsOffFromPitch( pitch, note );
    if (detune === 0 ) {
      detuneElem.className = '';
      detuneAmount.innerHTML = '--';
    } else {
      if (detune < 0) {
        detuneElem.className = 'flat';
      } else {
        detuneElem.className = 'sharp';
      }
      detuneAmount.innerHTML = Math.abs( detune );
    }
  }

  // if (!window.requestAnimationFrame) {
  //   window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  // }
  // rafID = window.requestAnimationFrame( updatePitch );
};

var getMax = function(array) {
  var max = array[0];
  array.forEach(function(el) {
    if (el > max) {
      max = el;
    }
  });
  return max;
};

var factor = 256 / 11;

// visualization of notes
var drawNoteGraph = function() {
  // var maxPitch = getMax(noteArray);
  // console.log('max pitch is: ', maxPitch);

  if (graphCanvas) {
    noteCanvas.clearRect(0, 0, 600, 256);

    noteCanvas.strokeStyle = 'red';
    noteCanvas.beginPath();
    noteCanvas.moveTo(0, 0);
    noteCanvas.lineTo(0, 256);
    noteCanvas.moveTo(0, 256);
    noteCanvas.lineTo(600, 256);
    noteCanvas.stroke();

    noteCanvas.strokeStyle = 'black';
    noteCanvas.beginPath();
    noteCanvas.moveTo(0, 256 - noteArray[0] * factor);
    for (var i = 5; i < 5 * noteArray.length; i = i + 5) {
      noteCanvas.lineTo(i, 256 - noteArray[i / 5] * factor);
    }
    noteCanvas.stroke();
  }
};

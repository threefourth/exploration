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

var setIntervalTimeRate = 1000 / 60; // milliseconds

// MP3 related varibles
var songAudioContext = new (window.AudioContext || window.webkitAudioContext)();
var songAnalyser = songAudioContext.createAnalyser();

var songNoteArray = []; // Contains notes taken 60 times a second
var songAvgNoteArray = []; // Average of notes per second

var songBuflen = 1024;
var songBuf = new Float32Array( songBuflen );


// User audio related variables
var userAudioContext = new (window.AudioContext || window.webkitAudioContext)();
var userAnalyser = userAudioContext.createAnalyser();

var userNoteArray = []; // Contains notes taken 60 times a second
var userAvgNoteArray = []; // Average of notes per second
var localStream = null; // Used to stop audio input
var userBuflen = 1024;
var userBuf = new Float32Array( userBuflen );


var noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

var noteFromPitch = function( frequency ) {
  var noteNum = 12 * (Math.log( frequency / 440 ) / Math.log(2) );
  return Math.round( noteNum ) + 69;
};

var frequencyFromNoteNumber = function( note ) {
  return 440 * Math.pow(2, (note - 69) / 12);
};

var centsOffFromPitch = function( frequency, note ) {
  return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note )) / Math.log(2) );
};

// The algorithm that calculates the autocorrelation (ac) which is equal to the pitch
var autoCorrelate = function( buf, sampleRate ) {
  var SIZE = buf.length;
  var MIN_SAMPLES = 0; // will be initialized when AudioContext is created.
  var MAX_SAMPLES = Math.floor(SIZE / 2);
  var GOOD_ENOUGH_CORRELATION = 0.9; // this is the 'bar' for how close a correlation needs to be
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

var getNote = function( audioContext, analyser, buf ) {

  analyser.getFloatTimeDomainData( buf );

  var ac = autoCorrelate( buf, audioContext.sampleRate );

  pitch = ac;

  var note = noteFromPitch( pitch );

  // store pitch into noteArray
  // in order to solve the octave issue
  // we are using the raw note value instead of (note % 12)

  if (isNaN(note)) {
    note = 0;
  }

  return note;
};

var getAvgNote = function( noteArray, avgNoteArray ) {
  
  // Get all notes in the most recent second
  var startIndex = avgNoteArray.length * 60;
  var noteSet = noteArray.slice(startIndex, startIndex + 60);

  // Remove the zero value notes since they
  // represent silence
  noteSet = noteSet.filter(function(note) {
    if (note !== 0) {
      return note;
    }
  });

  // If all notes in a noteSet is zero
  // (and hence filtered noteSet is empty)
  // give noteSet a single value of zero
  if (noteSet.length === 0) {
    noteSet = [0];
  }

  var sum = 0;

  noteSet.forEach(function(note) {
    sum += note;
  });

  var avgNote = {
    id: avgNoteArray.length,
    value: Math.round(sum / noteSet.length)
  };

  console.log( avgNote.value );
  
  return avgNote;
};

var getUserAudio = function() {
  // The user will be prompted whether he will permit the browser
  // to record the audio. If given permission, this script will
  // create a MediaStream object from user input. 
  // The script then connects the audio source to the analyser
  // node. Visualization is then run on ten times a second.
  // NOTE that the source is not connected to any destination.
  // This is allowed by Web Audio, and it just means that 
  // the user audio won't be played back.

  // Web Audio once used navigator.getUserMedia to access user's 
  // camera and microphone. This method has been deprecated.
  // Navigator.mediaDevices.getUserMedia is the newer standard 
  // and works on the latest Chrome builds. But sometimes Chrome
  // won't recognize navigator.mediaDevices.getUserMedia as an 
  // available function. We have to use navigator.webkitGetUserMedia
  // instead in those cases.

  if ( navigator.mediaDevices.getUserMedia ) {

    navigator.mediaDevices.getUserMedia({audio:true})
      .then( function( mediaStream ) {
        console.log('Getting user audio via mediaDevices.getUserMedia');
        localStream = mediaStream;
        var source = userAudioContext.createMediaStreamSource( mediaStream );

        source.connect( userAnalyser );

      });

  } else if ( navigator.webkitGetUserMedia ) {

    navigator.webkitGetUserMedia( { audio:true }, function( mediaStream ) {
        console.log('Getting user audio via webkitGetUserMedia');
        localStream = mediaStream;
        var source = userAudioContext.createMediaStreamSource( mediaStream );

        source.connect( userAnalyser );
    });

  } else {

    alert('This browser does not support user audio input');

  }
};



$(document).ready(function() {

  // Creates and appends new instance of audio
  // Uses the HTMLAudioElement interface, which
  // allows greater control over the <audio> elements
  // being created
  var audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.src = 'http://localhost:3000';
  audio.controls = true;
  audio.loop = true;
  audio.autoplay = true;

  $('#audio_box').append(audio);

  // Create a new audio context and define the 
  // HTML media element that will feed into it
  var audioContext = new (window.AudioContext || window.webkitAudioContext)();
  var myAudio = document.querySelector('audio');

  // Create a MediaElementSource
  var source = audioContext.createMediaElementSource(myAudio);

  // Create a Analyser node
  // Define parameters to be used for visualization
  var analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  // Connect the audio source to the destination
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  // Draw the visualization graph and periodically call the
  // updateGraph visualizer function
  var graph = d3.select('#visualizer').append('svg')
    .attr('width', 500)
    .attr('height', 500);

  setInterval(updateGraph.bind(this, dataArray, analyser, graph), 100);

});
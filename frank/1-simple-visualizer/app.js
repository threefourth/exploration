// Play mp3 file and dump the data to a visualizer

$(document).ready(function() {

  /*
    AUDIO RELATED FUNCTIONS
  */

  // An audioContext must be created every time that you want to use
  // the Web Audio API in your browser. The best practice is to check
  // for both window.AudioContext and window.webKitAudioContext, since
  // there is someone inconsistent implementation across the browsers.
  // Web Audio can be visualized like this:
  // - Audio Context
  //   - Audio Source
  //   - Node 1
  //   - Node 2
  //   - Node 3
  //      ...
  //   - Destination 
  // The destination is usually a speaker. Note that you don't actually
  // have to provide a destination or pipe to a speaker if you don't wanna.
  // 
  // I created an instance of an AnalyserNode here.  An AnalyserNode
  // takes audio source and spits out data about it.  Explained more below.

  var audioContext = new (window.AudioContext || window.webkitAudioContext)();
  var analyser = audioContext.createAnalyser();

  // fftSize represents the size of the Fast Furier Transform that's 
  // going to be used to determine the frequency domain.
  // The default value is 2048. That's what the demos usually go with.
  //
  // The frequencyBinCount is half the value of the FFT size. According
  // to the API, this generally equates to the number of data values
  // that we will need to account for in our visualization.
  //
  // We can ask the analyser node to return four types of data:
  // - getFloatFrequencyData: frequency data into a Float32Array
  // - getByteFrequencyData: frequency data into a Uint8Array
  // - getFloatTimeDomainData: current waveform into Float32Array
  // - getByteTimeDomainData: current waveform into Uint8Array
  // 
  // I don't know the exact difference between getting frequency data
  // and time domain data. Can someone explain it to me?

  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  // Until I can figure out how to stream MP3 from the server to 
  // the client, I'm asking the user to select a locally-stored
  // music file. onFileChange is handling that. FileReader is a native
  // browser function that detects when a file has been loaded (via 
  // an <input type="file"> element on the DOM). Please NOTE that 
  // the file must be read as an ArrayBuffer, since that's the data
  // type that Web Audio's audiodecoder expects.

  var onFileChange = function(callback, event) {
    // The filereader reads the uploaded file as an ArrayBuffer
    // and stores the buffer in result. When the file is loaded,
    // the data is piped to the callback

    var reader = new FileReader();
    reader.readAsArrayBuffer(event.target.files[0]);

    reader.onload = function(e) {

      callback(e.target.result);
    };
  };

  /*
    Plays the selected song. Pass this function as a callback to 
    onFileChange so that the selected file gets played.

    This is Web Audio at work. onFileChange converts the selected
    music file into an ArrayBuffer and passes the data to playSong.

    playSong then creates a buffer source inside our audioContext then
    hooks up the incoming arrayBuffer to it. Now you can play around
    with the music! Here I hook up that data to my analyser node and 
    then pass it to the destination, which is my speaker. 

    Once I set up the audio node chain, I hit source.start() and 
    start playing the song. I grab and visualize the audio data
    in the updateGraph function below.
  */

  var playSong = function(audioData) {
    console.log('Now playing song');

    audioContext.decodeAudioData(audioData, function(arrayBuffer) {
      var source = audioContext.createBufferSource();
      source.buffer = arrayBuffer;

      // Set up the Web Audio node chain
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.getByteTimeDomainData(dataArray);
      updateGraph(dataArray);
      // Start playing the song
      source.start();

      // Periodically call the visualizer 
      setInterval(updateGraph.bind(this, dataArray), 100);
    });

  };

  $('#fileInput').change(function(event) {
    onFileChange(playSong, event);
  });

  /*
    VISUALIZATION RELATED FUNCTIONS
  */

  /*
  I use D3 to visualize the music data. Each time update is
  called, D3 will create or update the location of a small circle
  that corresponds to each number in the Uint8Array, which is created
  by Web Audio's getByteTimeDomainData method.  I plot the graph 
  by assigning the array index as y and array[index] value as x.

  d3's scaleLinear function takes your data input and automatically
  scales it to the desired visual plane. Domain is the range of your
  input.  So if you're plotting data on a 0 to 1 plane, set the domain
  as [0, 1]. Range is the range of the visual plane where you want to 
  stretch out and plot the input data. I set it here as the x/y values 
  value of the SVG object.
  */

  var xScale = d3.scaleLinear()
    .domain([0, 128])
    .range([0, 1000]);
  var yScale = d3.scaleLinear()
    .domain([0, 128])
    .range([0, 1000]);

  var graph = d3.select('.visualizer').append('svg')
    .attr('width', 1000)
    .attr('height', 1000);

  var updateGraph = function(dataArray) {
    analyser.getByteTimeDomainData(dataArray);
    // console.log(dataArray);
    var dots = graph.selectAll('circle')
      .data(dataArray);

    dots.enter()
      .append('circle')
        .attr('cx', function(d, i) {
          return xScale(i);
        })
        .attr('cy', function(d) {
          return d / 2; // Change this to alter the height of y-axis
        })
        .attr('r', 2)
        .attr('fill', 'lavender');

    dots
      .interrupt()
      .transition()
      .duration(100)
      .ease(d3.easeSin)
      .attr('cx', function(d, i) {
        return xScale(i);
      })
      .attr('cy', function(d) {
        return d / 2; // Change Change this to alter the height of y-axis 
      })
      .attr('r', 2)
      .attr('fill', 'lavender');

    dots.exit()
        .remove();
  };

});
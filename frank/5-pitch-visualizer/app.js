$(document).ready(function() {

  // Goal: create a dynamically scaling graph that
  // creates rectangles with y-position equal to the 
  // note integer and x-width scaled to the number of
  // total notes that are being graphed

  // Create SVG element
  var svgWidth = 1000;
  var svgHeight = 500;

  var graph = d3.select('#visualizer').append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight);

  // Music related variables
  var audioContext = new (window.AudioContext || window.webkitAudioContext)();
  var analyser = audioContext.createAnalyser();
  
  var notesArray = [];


  // Loading local music as an ArrayBuffer, 
  // which can be decoded by Web Audio
  var onFileChange = function(callback, event) {
    var reader = new FileReader();
    // console.log(event.target.files);
    reader.readAsArrayBuffer(event.target.files[0]);

    reader.onload = function(e) {
      // console.log(e.target.result);
      callback(e.target.result);
    };
  };

  var playSong = function(audioData) {
    console.log('Inside: ', audioData);
    audioContext.decodeAudioData(audioData, function(arrayBuffer) {
      var source = audioContext.createBufferSource();
      source.buffer = arrayBuffer;

      source.connect(audioContext.destination);

      source.start();
    });
  };

  $('#fileInput').change(function(event) {
    onFileChange(playSong, event);
  });

  // Creates a random integer 1-12 every second and 
  // pushes it into notesArray. Each note needs an
  // id so that D3 can persistently bind a DOM element
  // to each note
  var generateNote = function() {
    var note = {
      id: notesArray.length,
      value: Math.floor(Math.random() * 12) + 1
    };

    notesArray.push(note);
  };

  // Use D3 to graph notesArray
  // Should scale dynamically
  var updateGraph = function() {
    console.log(notesArray);
    // Redefine the scale functions so that 
    // the graph will scale dynamically (hopefully!)
    var xScale = d3.scaleLinear()
      .domain([0, notesArray.length])
      .range([0, svgWidth]);

    var yScale = d3.scaleLinear()
      .domain([0, 12])
      .range([0, svgHeight]);

    // Bind each note object in notesArray
    // to a rect svg element
    var notes = graph.selectAll('rect')
      .data(notesArray);

    // D3 General Update Pattern

    // ENTER
    notes.enter()
      .append('rect')
      .attr('x', function(d) {
        return xScale(d.id);
      })
      .attr('y', function(d) {
        return yScale(d.value);
      })
      .attr('width', svgWidth / notesArray.length)
      .attr('height', 10)
      .attr('fill', 'red');

    // UPDATE
    notes
      .transition()
      .ease(d3.easeSin)
      .attr('x', function(d) {
        return xScale(d.id);
      })
      .attr('y', function(d) {
        return yScale(d.value);
      })
      .attr('width', svgWidth / notesArray.length)
      .attr('height', 10)
      .attr('fill', 'blue');   
  };

  // Generates a random note every second
  // and graphs it
  var startGraph = function() {
    
    setInterval(function() {
      generateNote();
      updateGraph();
    }, 1000);

  };

  startGraph();

});
















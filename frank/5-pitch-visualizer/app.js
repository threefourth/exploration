// Lets try this without using jQuery's document.ready

window.onload = function() {

  // Goal: create a dynamically scaling graph that
  // creates rectangles with y-position equal to the 
  // note integer and x-width scaled to the number of
  // total notes that are being graphed

  var notesArray = [];
  var svgWidth = 1000;
  var svgHeight = 500;

  // Create SVG element
  var graph = d3.select('.visualizer').append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight);

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
};
















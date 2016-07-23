// Lets try this without using jQuery's document.ready

window.onload = function() {

  // Goal: create a dynamically scaling graph that
  // creates rectangles with y-position equal to the 
  // note integer and x-width scaled to the number of
  // total notes that are being graphed

  var notesArray = [];
  var svgWidth;
  var svgHeight;

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
  var updateGraph = function() {};

};
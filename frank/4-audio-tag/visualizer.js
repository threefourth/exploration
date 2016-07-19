// Using D3 to visualize audio data

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
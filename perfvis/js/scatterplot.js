class ScatterPlot{
	constructor(){
        var bb = document.querySelector('#Outlier')
                    .getBoundingClientRect();
        this.margin = [40, 40, 40, 40]; //top right bottom left (space for label texts)
        var me = this;
        this.w = Math.floor(bb.right) - Math.ceil(bb.left);

        this.width = Math.floor(bb.right) - Math.ceil(bb.left) - 2*this.margin[1] - 2*this.margin[3];
        var width = this.width;
		var height = this.width;

		this.xScale = d3.scaleLinear().range([0, width]).domain([0,1]); // value -> display
		this.xAxis = d3.axisBottom().scale(me.xScale);

		// setup y
		this.yScale = d3.scaleLinear().range([height, 0]).domain([0,1]); // value -> display
		this.yAxis = d3.axisLeft().scale(me.yScale);

		// setup fill color
		var cValue = function(d) { return d.Manufacturer;};
		this.color = d3.scaleOrdinal(d3.schemeCategory20b).domain([0,10,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116]);
        this.svg = d3.select("#Outlier")
            .append("svg")
            .attr("width", me.w)
            .attr("height", me.w)
            .attr("class", "chart")
  			.append("g")
    		.attr("transform", "translate(" + me.margin[3] + "," + me.margin[0] + ")");

		  // x-axis
		this.xAxisSVG = this.svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")");

		this.xAxisSVG.append("text")
		      .attr("class", "label")
		      .attr("x", width)
		      .attr("y", 30)
		      .style("text-anchor", "end")
		      .style("text-anchor", "middle")
		      .text("time_by_lasttime");

		  // y-axis
		this.yAxisSVG = this.svg.append("g")
		      .attr("class", "y axis");

		this.yAxisSVG.append("text")
		      .attr("class", "label")
		      .attr("transform", "rotate(-90)")
		      .attr("y", -30)
		      .attr("dy", ".71em")
		      .style("text-anchor", "end")
		      .style("text-anchor", "middle")
		      .text("time_diff");

		  // draw legend
		  var legend = this.svg.selectAll(".legend")
		      .data(me.color.domain())
		    .enter().append("g")
		      .attr("class", "legend")
		      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		  // draw legend colored rectangles
		  legend.append("rect")
		      .attr("x", width - 18)
		      .attr("width", 18)
		      .attr("height", 12)
		      .style("fill", me.color);

		  // draw legend text
		  legend.append("text")
		      .attr("x", width - 24)
		      .attr("y", 6)
		      .attr("dy", ".35em")
		      .style("text-anchor", "end")
		      .text(function(d) { return d;})

	}
	update(fileName){
		var svg = this.svg;
		var xAxis = this.xAxis;
		var yAxis = this.yAxis;
		var color = this.color;
		var me = this;

		d3.csv(fileName, function(error, data) {

		  console.log(data.length);
		  console.log(data[0]);
		  console.log(me.width);

		  // change string (from CSV) into number format
		  data.forEach(function(d) {
		    d["time_by_lasttime"] = +d["time_by_lasttime"];
		    d["time_diff"] = +d["time_diff"];
		//    console.log(d);
		  });

		  //data = data.filter(function(d) {return d['class']==1;});


		var xValue = function(d) { return d["time_by_lasttime"];}, // data -> value
		    xMap = function(d) { return me.xScale(xValue(d));}; // data -> display

		var yValue = function(d) { return d["time_diff"];}, // data -> value
		    yMap = function(d) { return me.yScale(yValue(d));}; // data -> display
		  // don't want dots overlapping axis, so add in buffer to data domain
		  var xRange = d3.max(data, xValue) - d3.min(data, xValue);
		  var yRange = d3.max(data, yValue) - d3.min(data, yValue);
		  me.xScale.domain([d3.min(data, xValue)-xRange/100, d3.max(data, xValue)+xRange/100]);
		  me.yScale.domain([d3.min(data, yValue)-yRange/100, d3.max(data, yValue)+yRange/100]);
		  me.xAxisSVG.call(me.xAxis)
		  me.yAxisSVG.call(me.yAxis)

		  //----------------xw---------------------------------
		// compute 2D histogram of the data
		var width = 100; //me.width;
		var height = 100; //me.width;
		var xScale = d3.scaleLinear().range([0, width]).domain([d3.min(data, xValue), d3.max(data, xValue)]);
		var yScale = d3.scaleLinear().range([height, 0]).domain([d3.min(data, yValue), d3.max(data, yValue)]);
		var xRevScale = d3.scaleLinear().domain([0, width]).range([d3.min(data, xValue), d3.max(data, xValue)]);
		var yRevScale = d3.scaleLinear().domain([height, 0]).range([d3.min(data, yValue), d3.max(data, yValue)]);

		//histogram has one more element in each dimension 
		var newdata = new Array(width+1); 
		for (var i = 0; i < width+1; i++) {
			newdata[i] = [];
			for (var j = 0; j < height+1; j++) {
				var item = { "size": 0, "node": [] };
				newdata[i].push(item);
			}
		}

		var fulldata = []; // final data to keep
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			if (item["class"] == 0) {
				var xPos = xScale(item["time_by_lasttime"]);
				var yPos = yScale(item["time_diff"]);
				//console.log(xPos + ", " + yPos + ": " + item["time_by_lasttime"] + ", " + item["time_diff"]);
				newdata[Math.floor(xPos)][Math.floor(yPos)]["size"] += 1;
				newdata[Math.floor(xPos)][Math.floor(yPos)]["node"].push(item["node"]); 
			} else {
				console.log("anomaly");
				item["size"] = 1;
				fulldata.push(item);
			}
		}

		for (var i = 0; i < width+1; i++) {
			for (var j = 0; j < height+1; j++) {
				if (newdata[i][j]["size"] != 0) {
					var item = {}; //initialize!!!
					//console.log(i + ":" + j + ", " + xRevScale(i) + ":" + yRevScale(j) + ", " + newdata[i][j]["size"]);
					item["time_by_lasttime"] = xRevScale(i);
					item["time_diff"] = yRevScale(j);
					item["size"] = newdata[i][j]["size"];
					item["class"] = 0;
					item["node"] = newdata[i][j]["node"].slice(0,5); //only show first 5 nodes
					fulldata.push(item);
				}
			}
		}
		data = fulldata;
		console.log(data.length);

		var sizeValue = function(d) { return d["size"];};
		var sizeScale = d3.scaleLinear().range([3.5, 35]).domain([d3.min(data, sizeValue), d3.max(data, sizeValue)]);
		var sizeMap = function(d) { return sizeScale(sizeValue(d));};
		//-------------------------------------------------------

		  // draw dots
		  svg.selectAll(".dot").remove();
		  data = data.sort(function(a,b) {
          		return d3.ascending(+a.class, +b.class);
      		});
		  var dots = svg.selectAll(".dot")
		      .data(data);

		  dots.enter().append("circle")
		      .attr("class", "dot")
		      .attr("r", function(d) {
		      	if (d['class']==1){
		      		return 10;
		      	}
		      	else{
		      		return sizeMap(d);
		      	}
		      })
		      .attr("cx", xMap)
		      .attr("cy", yMap)
		      .style("fill", function(d) {
		      	var fillColor = "gray";
		      	if(d['class']==1){
		      		fillColor = color(d['node']);
		      	}
		      	return fillColor;
		      })
		      .style("stroke","black")
		      .style("stroke-width", function(d){
		      	return (d['class']==0)?0:0.1;
		      })
		      .style("fill-opacity", function(d){
		      	return (d['class']==0)?0.5:0.8;
		      })
   				.append("svg:title")
		      .text(function(d){return d.node;});
			dots.exit().remove();
		});
	}
}
var scatterplot = new ScatterPlot();
$('.thi li > a').click(function(e) {
    $('#outlier').text(this.innerHTML);
    scatterplot.update("../outliers/"+this.innerHTML+".csv");
});
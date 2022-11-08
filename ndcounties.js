//Setting width and height of the svg
var width = 960,
    height = 500;

//Creating SVG
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height + 100);

//Declaring the default color scale
var color = d3.scaleThreshold()
    .domain([0.0, 0.5, 1.5, 3.0, 7.0, 15.0, 30.0, 80.0])
    .range(d3.schemeOrRd[9]);

//Defining the scale for the legend
var x = d3.scaleSqrt()
    .domain([0, 100])
    .range([440, 950]);

//Appending a g element to the svg
var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,550)");

//Creating a rectangle in the g element seting the color segments of the legend
//Defining the width and height of the rectangle with the scale fucntion x
//Filling in the colors for each density
g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) {console.log("calc d1 " +x(d[1]) + "calc d0 " +x(d[0])); return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

//Adding the title to the legend
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population Density per County");

//Adding the ticks to the legend to differntiate the densities
g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain())
    .tickFormat(d3.format(".1f")))
  .select(".domain")
    .remove();

//Accessing the data
d3.json("counties-10m.json", function(error, counties) {
    if (error) return console.error(error);
    
    //Filtering the counties and putting them in an object so that fitsize can call it
    var nd_counties = topojson.feature(counties, counties.objects.counties).features.filter((d) => parseInt(d.id) >= 38000 && parseInt(d.id) <= 38999);
    var geojson = {"type":"FeatureCollection", "features": nd_counties};
    var projection = d3.geoMercator().scale(1).fitSize([width, height], geojson);
    var path = d3.geoPath().projection(projection);
    console.log(counties);
    
    //Accessing the density data
    var nd_densities;
    d3.csv("Population-Density By County.csv", function(error, population) {
        if (error) return console.error(error);
        
        //Filtering the density data for just North Dakota
        var nd_pop = population.filter((d) => d["GEO.display-label"] === "North Dakota");
        console.log(nd_pop);
        nd_densities = nd_pop.map(function(d) { return d["Density per square mile of land area"]});
        
        //Putting the filter data in objects
        const densities_obj = {};
        const counties_obj = {};
        nd_pop.forEach(d => (densities_obj[d["GCT_STUB.display-label"]] = d["Density per square mile of land area"]));
        nd_counties.forEach(d => (counties_obj[d.properties.name] = d));
        console.log(densities_obj);
    
        //Drawing the counties that make up the whole state
        //When mouse over tooltip appears
        svg.selectAll("path")
            .data(nd_counties)
            .enter().append("path")
            .style("fill", function(d) {console.log(d.properties.name + " County"); return color(densities_obj[d.properties.name + " County"]);})
            .attr("d", path)
            .on("mouseover", function(d) {
                console.log(d);
                d3.select("#tooltip")
                    .style("left", (d3.event.clientX - 80) + "px")
                    .style("top", (d3.event.clientY - 20) + "px");
                console.log(d3.event.clientX + 20);
                console.log(d3.event.clientY - 20);
                d3.select(".title")
                    .text(d.properties.name);
                d3.select("#pop")
                    .text(densities_obj[d.properties.name + " County"]);
                d3.select("#tooltip").classed("hidden", false);
            })
            .on("mouseout", function() {
                d3.select("#tooltip").classed("hidden", true);
            });;
        
        //When County border is clicked then the borders are highlighted with black stroke
        var checkbox = document.querySelector('input[type="checkbox"]');

        checkbox.addEventListener('change', function () {
            if (checkbox.checked) {
                svg.selectAll("path").attr("stroke", "#111");
            } else {
                svg.selectAll("path").attr("stroke", "none");
            }
        });
        
        //When color button is clicked then the map changes color scheme
        var colorbox = document.querySelector('#colorbox');

        colorbox.addEventListener('change', function () {
            if (colorbox.checked) {
                color.range(d3.schemeYlGnBu[9]);
                svg.selectAll("path").style("fill", function(d) { return color(densities_obj[d.properties.name + " County"]);})
                g.selectAll("rect").attr("fill", function(d) { return color(d[0]); });
            } else {
                color.range(d3.schemeOrRd[9])
                svg.selectAll("path").style("fill", function(d) { return color(densities_obj[d.properties.name + " County"]);})
                g.selectAll("rect").attr("fill", function(d) { return color(d[0]); });
            }
        });
    });
});

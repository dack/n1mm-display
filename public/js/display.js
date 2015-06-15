
var gpsHome=[-122.807727,49.2480338];

var width = 1600,
		height = 1600;

var projection = d3.geo.mercator()
	.center([0,-40])
		.scale((width + 1) / 2 / Math.PI)
		.translate([width / 2, height / 2])
		.precision(.1);

var path = d3.geo.path()
		.projection(projection);

//var graticule = d3.geo.graticule();

var svg = d3.select("body").append("svg")
		.attr("id","worldmap")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox","0 0 "+width+" "+height)
		.attr("preserveAspectRatio","xMinYMid");

d3.select(self.frameElement).style("height", height + "px");
var aspect=$('#worldmap').width()/$('#worldmap').height();
$(window).on("resize",function(){
		var targetWidth=$('body').width();
		svg.attr("width",targetWidth);
		svg.attr("height",Math.round(targetWidth/aspect));
}).trigger("resize");
/*
svg.append("path")
		.datum(graticule)
		.attr("class", "graticule")
		.attr("d", path);
	*/


var draw_map=function(callback){
	d3.json("data/world-50m.json", function(error, world) {
		svg.insert("path")
				.datum(topojson.feature(world, world.objects.land))
				.attr("class", "land")
				.attr("d", path);

		svg.insert("path")
				.datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
				.attr("class", "boundary")
				.attr("d", path);

		d3.json("data/prov_4326_simple.topo.json",function(error,canada){
			svg.insert("path")
					.datum(topojson.mesh(canada, canada.objects.provinces))
					.attr("class", "boundary")
					.attr("d", path);
			d3.json("data/us-10m.json",function(error,us){
				svg.insert("path")
						.datum(topojson.mesh(us, us.objects.states))
						.attr("class", "boundary")
						.attr("d", path);
				callback();
			});
		});

	});
};


draw_map(function(){
	
	var socket = io();

	var contact=[];

	socket.on('connect',function(){
		contact=[];//erase all contacts (out of data information)
		var points=svg.selectAll("circle.contact").data(contact,function(d){return d.id});
		points.exit().remove();
	});

	socket.on('oldcontact', function (data) {
		data.coord=[data.coord.longitude,data.coord.latitude];
		contact.push(data);
		var points=svg.selectAll("circle.contact").data(contact,function(d){return d.id});
		points.enter().append("circle")
			.attr("cx", function (d) { return projection(d.coord)[0]; })
			.attr("cy", function (d) { return projection(d.coord)[1]; })
			.attr("class","contact old complete")
			.style("fill-opacity", 1)
			.attr("r","3px")
			.attr("fill","teal");
	});

	socket.on('newcontact', function (data) {
		data.coord=[data.coord.longitude,data.coord.latitude];
		contact.push(data);

		var points=svg.selectAll("circle.contact").data(contact,function(d){return d.id});
		
		svg.selectAll("circle.contact.new.complete")
			.attr("class","contact old")
			.transition()
				.duration(1000)
				.style("r","8px")
				.attr("fill", "orange")
				.style("fill-opacity", 1)
			.transition()
				.delay(5000)
				.duration(3000)
				.style("r","3px")
				.attr("fill", "teal")
				.attr("class","contact old complete");

		//add new points
		points.enter().append("circle")
				.attr("class","contact new")
				.attr("cx", function (d) { return projection(d.coord)[0]; })
				.attr("cy", function (d) { return projection(d.coord)[1]; })
				.style("fill-opacity", 1e-6)
				.attr("r","100px")
				.attr("fill","white")
			.transition()
				.attr("class","contact new complete")
				.delay(500)
				.duration(1000)
				.attr("r", "10px")
				.attr("fill", "red")
				.style("fill-opacity", 1);


		//cool lines beaming in
		var lines=svg.selectAll("line.contact").data([data],function(d){return d.id});
		lines.enter().append("line")
			.attr("class","contact")
			.attr("x1", projection(gpsHome)[0])
			.attr("y1", projection(gpsHome)[1])
			.attr("x2", projection(gpsHome)[0])
			.attr("y2", projection(gpsHome)[1])
			.attr("stroke","red")
		.transition()
			.duration(500)
			.ease("linear")
			.attr("x2", function (d) { return projection(d.coord)[0]; })
			.attr("y2", function (d) { return projection(d.coord)[1]; })
		.transition()
			.duration(500)
			.ease("linear")
			.attr("x1", function (d) { return projection(d.coord)[0]; })
			.attr("y1", function (d) { return projection(d.coord)[1]; })
			.remove();

		lines.exit();

	});

	svg.append("text")
		.attr("x",width/2)
		.attr("y",100)
		.attr("font-size",100)
		.attr("alignment-baseline","middle")
		.attr("text-anchor","middle")
		.attr("fill","teal")
		.attr("stroke","orange")
		.style("fill-opacity", 1)
		.text("VE7SCC");
});


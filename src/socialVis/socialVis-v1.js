SocialVis = function(){
	windowWidth = null; 
	windowHeight = null;
	nodeRadius = null;
	minClusterRadius = null;
	cScale = null;
	//svg = null;
	gradNode = null;
	colorData = null;
	clusterData = null;
	dailyData = null;
	linkColorScale = null;
	force = null;
	forceCluster = null;
	cluster = null;
	node = null;
	pos = null;
	var Map = function(){
		var data = [];
		this.entry = data;
		this.set = function(key, value){
			data[key] = value;
		}
		this.get = function(key){
			return data[key];
		}
		this.has = function(key){
			return (key in data);
		}
		this.delete = function(key){
			data.splice(data.indexOf(key), 1);
		}
		this.clear = function(){
			data = [];
		}
	}
	prePosition = null;
	worldMapInstance = null;
	

	//initialize variables
	function initialize(){
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;
		minClusterRadius = 20;
		nodeRadius = 4;

		//decide color of node
		cScale = d3.scale.category20();

		//return color of edge
		linkColorScale = d3.scale.linear()         
    		.range([0, 1]);

		//create svg
		svg = d3.select("#mainContainer")                          							
		    .append("svg")
		    .attr("width",windowWidth)
		    .attr("height",windowHeight)
		    .attr("preserveAspectRatio", "xMidYMid")      //for map
		    .on("mousemove", mousemove);

		//place to show mouse coordinate
		pos = svg.append("text")
			.attr("fill", "gold")
			.attr("font-size", 10);

		//the RGB of colors will be used to paint
		colorData = d3.range(20).map(function(d, i){  
			    return d3.rgb(cScale(i));
			});

		//set the gradient parameter for svg node
		gradNode = svg.append("defs")
		    .selectAll("radialGradient")
		    .data(colorData)
		    .enter()
		    .append("radialGradient")
		    .attr("id", function(d, i){
		        return "grad" + i;
		    })
		    .attr("cx", "50%")
		    .attr("cy", "50%")
		    .attr("r", "70%");
		//Radial gradients use to fill nodes, give a feeling of comet              
		gradNode.append("stop")
		    .attr("offset", "0%")
		    .style("stop-color", function(d){
		        //var color = d3.rgb(cScale(d.color));
		        return "rgb(" + d.r + "," + d.g + "," + d.b + ")";
		    })
		    .attr("stop-opacity", 1);
		gradNode.append("stop")
		    .attr("offset", "20%")
		    .style("stop-color", function(d){
		        return "rgb(" + Math.floor(d.r / 2) + "," + Math.floor(d.g / 2) + "," + Math.floor(d.b / 2) + ")";
		    })
		    .attr("stop-opacity", 0.7);
		gradNode.append("stop")
		    .attr("offset", "100%")
		    .style("stop-color", function(d){
		        return "rgb(0, 0, 0)";
		    })
		    .attr("stop-opacity", 0);
			
		
		cluster = svg.selectAll(".cluster");    			//set of all clusters
		link = svg.selectAll(".link");                		//set of all edges
		node = svg.selectAll(".node");                		//set of all nodes 

		force = d3.layout.force()                 			//create force layout
		    .charge(10)                                        		//charge>0 nodes attract, charge<0 nodes repel, value is the threshold of apply the force
		    .linkDistance(function(d){                		//generally the distance between two nodes who are linked by edge
		        //return (d.source.group==d.target.group)?10:20;
		        return 50;                            		//no group option, the link distance is same 
		    })
		    .friction(0.9)                            		//[0,1] default 0.9, velocity decay after tick
		    .linkStrength(0)                          		//[0,1]  default 1
		    .gravity(0)                            			//the force to drag nodes to the enter
		    .size([windowWidth, windowHeight])
		    //.theta(0)
		    .on("tick",tick);
		/*
		forceCluster= d3.layout.force()           			//the force-layout for clusters
		    .size([windowWidth, windowHeight])
		    .gravity(0.01)
		    .friction(0.7)
		    .charge(-1500)
		    .on("tick",tickCluster);
		*/
		linkData = [];
		nodeData = [];
		prePosition = new Map();

		document.getElementById("mainContainer").onwheel = mouseScroll;
	}

	//draw component and deal with trasition process
	//index indicate which day's data is used to execute transition
	function transit(index){
		setCluster(index);
		setNode(index);
		setLink();

		force.nodes(nodeData)
			.links(linkData)
			.start();

		/*forceCluster.nodes(clusterData)
			.start();*/

		if (++index < dailyData.length){
			setTimeout(function(){
				resetData();
				transit(index);
			}, 3000);
		}
	}

	//reset data for next iteration
	function resetData(){
		prePosition.clear();
		nodeData.forEach(function(d){
			prePosition.set(d.id, {
				x : d.x,
				y : d.y,
			})
		})
	}

	//draw link
	function setLink(){
		link = link.data(linkData,function(d,i){        //give new loading data to edges
	        return d.source.id + "-" + d.target.id;
	    });

	    link.enter()                                  //for new added edges, assign attribute
	        .append("line")
	        .attr("class", "link")
	        .attr("stroke", function(d){
	            var fraction = linkColorScale(Math.ceil(d.nodeWeight));
	            return d3.hsl((fraction * 360) ,1 , 0.5);
	        })
	   
	    link.exit()                                   //remove edges are not appear in json file
	        .transition() 
	        .duration(200)
	        .attr("stroke-opacity", 0)
	        .remove();

	    link.moveToBack();
	}

	//draw nodes
	function setNode(index){
		nodeData = dailyData[index].nodes;

		node = node.data(nodeData,function(d){            	//give new loading data to nodes
	        return d.id;    
	    });

	    node.enter()                                       	//for new added node assign attributes
	        .append("circle")
	        .attr("class", "node")
	        .attr("class","comet")
	        .attr("fill", function(d, i){
	        	//return cScale(i);
	            return "url(#grad" + i + ")";
	        })
	        .attr("r", function(d){
	            return 1;
	        })
	        .call(force.drag);

	    node.each(function(d){
	    	d.radius = nodeRadius;
	    	if (prePosition.has(d.id)){
	    		d.x = prePosition.get(d.id).x;
	    		d.y = prePosition.get(d.id).y;
	    	}
	    	/*d3.select(this)
	    		.attr("cx",windowWidth / 2)
	    		.attr("cy", windowHeight / 2);*/
	    });

	    node.transition()                              		//set transition process, the radius of node from 0 to 5 
	        .duration(300)
	        .attr("r", function(d){
	        	return d.radius;
	        });

	    node.exit()                                        	//remove nodes no longer in the json file
	        .transition()
	        .duration(500)
	        .attr("opacity", 0)
	        .remove();		
	}

	//set parameter of cluster
	function setCluster(index){
		var count = dailyData[index].groupCount;
		cluster.each(function(d, i){
			var r = Math.ceil(Math.sqrt(count[i]) * 5);
			d.radius = Math.max(minClusterRadius, r);
			d3.select(this)
				.attr("r", d.radius);
		})
	}

	//draw clusters
	function initializeCluster(){
		cluster = cluster.data(clusterData, function(d){
			return d.id;
		});
		cluster.enter()
			.append("circle")
			.attr("class","cluster")
	        .attr("fill", "transparent")
	        .attr("stroke", function(d, i){
	            return cScale(d.group);
	        })
	        .attr("stroke-width", 1)   
	        .attr("stroke-opacity", 0.8)
		    .on("mouseover", function(d){
	            var obj = d3.select(this)
	                .attr("stroke-opacity", 1)
	                .attr("stroke-width", 2);
	        }) 
	        .on("mouseout", function(d){
	            var obj = d3.select(this)
	                .attr("stroke-opacity", 0.8)
	                .attr("stroke-width", 1);
	        })
	        //.call(forceCluster.drag);
	    cluster.exit()
	    	.transition()
	    	.duration(500)
	    	.attr("opacity", 0)
	    	.remove();

	    updateCluster();
	}

	//update the coordinate of cluster due to the operation of zoom
	function updateCluster(){
		//set the coordinate of cluster, get from world map's function getClusterCoordinates
	    cluster.each(function(d){
	    	var coord = worldMapInstance.getClusterCoordinates({
	    		"lat" : d.lat,
	    		"long" : d.long
	    	});
	    	console.log(d.label + " coordinate is " + coord[0] + " " + coord[1]);

	    	//coord[0] = Math.random() * windowWidth;
	    	//coord[1] = Math.random() * windowHeight;

	    	d.x = coord[0];
	    	d.y = coord[1];
	    	d3.select(this)
	    		.attr("cx", d.x)
	    		.attr("cy", d.y)
	    })
	}

	//tick function for nodes
	function tick(e) {
	    var k = .1 * e.alpha;                      			// Push nodes toward their designated focus. 
	    nodeData.forEach(function(d, i) {  
	    	var diffx = clusterData[d.cluster].x - d.x;
	    	var diffy = clusterData[d.cluster].y - d.y;    
	        var distance = Math.sqrt(diffx * diffx + diffy * diffy);
	        
	        d.x += diffx * k;
	        d.y += diffy * k;	       
	    });

	    link.attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { return d.target.x; })
	        .attr("y2", function(d) { return d.target.y; });

	    node.attr("cx", function(d) { 
	    		d.x = Math.max(d.radius, Math.min(windowWidth - d.radius, d.x)); 
	    		return d.x;
	    	})
	        .attr("cy", function(d) { 
	        	d.y = Math.max(d.radius, Math.min(windowHeight - d.radius, d.y)); 
	        	return d.y;
	        });
	}   
	
	//tick function for cluster
	function tickCluster(e){
	    cluster.attr("cx", function(d) { 
		    	d.x = Math.max(d.radius, Math.min(windowWidth - d.radius, d.x))
		    	return d.x; 
	    	})
	        .attr("cy", function(d) { 
	        	d.y = Math.max(d.radius, Math.min(windowHeight - d.radius, d.y));
	        	return d.y; 
	       	});
	}

	//move element to the back of its parent's children
	d3.selection.prototype.moveToBack = function() { 
	    return this.each(function() { 
	        var firstChild = this.parentNode.firstChild; 
	        if (firstChild) { 
	            this.parentNode.insertBefore(this, firstChild); 
	        } 
	    });    //move component to the down of svg
	};

	//move element to the top of its parent's children
	d3.selection.prototype.moveToFront = function() {
	  	return this.each(function(){
	    	this.parentNode.appendChild(this);
	  	});   //move component to the up of svg
	};

	//mouse wheel scroll handler
	function mouseScroll(){
		updateCluster();
	}

	//add tail when node moves, the less the second parameter of timer, the smoother the tail
	d3.timer(function(){
	    d3.selectAll(".comet")
	        .each(function(d, i){
	            if (!d.preX){
	                d.preX = d.x;
	                d.preY = d.y;
	            }
	            svg.append("line")
	                .attr("stroke-width", 2)
	                .attr("stroke", cScale(i/*d.color*/))
	                .attr("stroke-opacity", 1)
	                .attr("x1", d.preX)
	                .attr("y1", d.preY)
	                .attr("x2", d.x)
	                .attr("y2", function(){
	                    d.preX = d.x;
	                    d.preY = d.y;
	                    return d.y;
	                })
	                .transition()
	                .duration(700)
	                .attr("stroke-width", 0)
	                .remove();
	        })
	}, 300);

	function generateLayout(data){
		clusterData = data.clusters;
		dailyData = data.dailyData;

		initialize();

		createMap();
		worldMapInstance.generateMap();

		setTimeout(function(d){
			pos.moveToFront();
			initializeCluster();
			transit(0)
		}, 1000);
	}

	//create wolrdMap class and draw map
	function createMap(){
		worldMapInstance = new WorldMap(svg);
	}

	//when move over show the coordinate
	function mousemove(){
		var ary = d3.mouse(this);
		pos.attr("x", ary[0] + 2)
			.attr("y", ary[1] + 2)
			//.attr("x", 100)
			//.attr("y", 100)
			.text(Math.round(ary[0]) + ", " + Math.round(ary[1]))
	}

	//******************** public method below *************************
	this.generateSocialVis = function(path){
		//lode data from input json
		d3.json(path, function(data){		    	
		    console.log(path + " loaded");
		    generateLayout(data);
		});
	}
};

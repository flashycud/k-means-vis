define([
  "d3",
  "./algorithms/kMeans",    //K-means Algorithm class
  "./dataset",              //Dataset handling class
  "./listener",             //Listener class for captureing states
  "./eval"                  //Evaluation class
], function(d3, KMeans, Dataset, Listener, Eval) {

  //main color scales
  var color = d3.scale.ordinal().range([
          d3.rgb('#F72525'),
          d3.rgb('#8EF725'),
          d3.rgb('#258EF7'),
          d3.rgb('#F825F8'),
          d3.rgb('#F8F825'),
          d3.rgb('#25F88F')
        ]),
        colorPoint = d3.scale.ordinal().range([
          d3.rgb('#B24747'),
          d3.rgb('#7DB347'),
          d3.rgb('#477DB3'),
          d3.rgb('#B347B3'),
          d3.rgb('#B3B347'),
          d3.rgb('#477DB3'),
        ]),
        colorArea = d3.scale.ordinal().range([
          d3.rgb('#EDCFCF'),
          d3.rgb('#DEEDCF'),
          d3.rgb('#CFDEED'),
          d3.rgb('#EED0EE'),
          d3.rgb('#EEEED0'),
          d3.rgb('#D0EEDF')
        ]),
        colorBar = d3.scale.ordinal().range([
          d3.rgb('#A0ABDE'),
          d3.rgb('#8FB5C9'),
          d3.rgb('#A6DFDD'),
          d3.rgb('#A6DFB7'),
          d3.rgb('#CADFA6')
        ]);

  //initialize instances
  var dataset = new Dataset(), currDataType = dataset.data_type.clusters,
      listener = new Listener(),
      options = {
        k: 3,
        listener: listener
      },
      kMeans = new KMeans(options);
  //defualt clustering dataset
  kMeans.autoCluster(dataset.generate(0,currDataType));

  //global visualization components
  var main,stepControl,dataControl,paramControl,kMeansCompare;

  //global sizes of components
  var w = 370,
      h = 430;

  var w2 = 618,
      h2 = 125;

  //global svg groups
  var target = d3.select("#cluster-infovis .k-means figure.main-figure"),
      svg = target.append("svg").attr({width: w, height: h}),
      mainG = svg.append("svg:g"),
      stepG = svg.append("svg:g"),
      dataG = svg.append("svg:g"),
      paramG = svg.append("svg:g");
  var target2 = d3.select("#cluster-infovis .k-means figure.extend-figure"),
      svg2 = target2.append("svg").attr({width: w2, height: h2});

  //main drawing handler 
  var drawSvg = function() {
    stepControl = new drawStepControl(stepG, 0, 310, 300, 75);
    kMeansCompare = new drawKMeansCompare(svg2);
    main = new drawMain(mainG, 0, 0, 300, 300);
    dataControl = new drawDataControl(dataG, 310, 75, 60, 225);
    paramControl = new drawParamControl(paramG, 0, 390, 370, 25);

    kMeansCompare.addItem();
  }

  //small multiples drawing handler
  var drawKMeansCompare = function(target){
    var p = 10,
        _w = 618,
        _h = 120;

    var items = [],
        times = [], maxTime = -1,
        evals = [], maxEval = -1, minEval = Infinity, 
        ks = [], maxK = 6,
        maxItems = 5;

    var g = target.append("svg:g").attr("class", "main-group");


    var dataLabel = g.append("svg:text").text("Dataset")
        .style({
          'text-anchor':'middle',
          fill: '#6E6E6E'
        })
        .attr({
          x: _h/2,y:20
        });
    var initLabel = g.append("svg:text").text("Initial Centroids")
        .style({
          'text-anchor':'middle',
          fill: '#6E6E6E'
        })
        .attr({
          x: _h*3/2+p/2,y:20
        });
    var resultlabel = g.append("svg:text").text("Result")
        .style({
          'text-anchor':'middle',
          fill: '#6E6E6E'
        })
        .attr({
          x: _h*5/2+p,y:20
        });

    this.cursorX = p;
    this.addItem = function() {
      var time, states, evalScore, param;
      if(listener.timestamps.length >= 2) {
        time = listener.timestamps[listener.timestamps.length-1] - listener.timestamps[0];
      }
      if(listener.states.length >= 3) {
        states = [listener.states[0], listener.states[1], listener.states[listener.states.length-1]]
      }
      evalScore = Eval.evaluate(listener.states[listener.states.length-1].X, listener.states[listener.states.length-1].clusters, listener.states[listener.states.length-1]. centroids);
      param = {k: options.k};

      items.push({
        time: time,
        states: states,
        evalScore: evalScore,
        param: param
      });
      times.push(time);
      evals.push(Math.round(evalScore*100)/100);
      ks.push(param.k);

      maxTime = -1;
      maxEval = -1;
      minEval = Infinity;

      var _ref;
      while (items.length > 5) {
        _ref = items.splice(0,1);
        _ref = times.splice(0,1);
        _ref = ks.splice(0,1);
        _ref = evals.splice(0,1);
      }
      for(var i=0; i<times.length; i++){
        maxTime = Math.max(maxTime, times[i]);
        maxEval = Math.max(maxEval, evals[i]);
        minEval = Math.min(minEval, evals[i]);
      }

      this.draw();
    }
    this.draw = function() {
      w = _h,
      h = _h,
      p = 10,
      r = 2, rc = 4,
      max = 100,
      min = 0,
      voronoi = d3.geom.voronoi()
        .clipExtent([[0, 0], [w, h]])
        .x(function(d) { return mapRange(d[0]) })
        .y(function(d) { return mapRange(d[1]) });

      // each multiple
      svg2.attr("height", h2*items.length+30);
      var _items = g.selectAll('g.item').data(items);
      _items.enter().append('svg:g')
          .attr({class: "item"});
      _items.each(function(item, item_i) {
            var gs = d3.select(this).selectAll("g.group").data(item.states);
            gs.enter().append("svg:g");
            gs.each(function(state, state_i) {
                  var stateX = state.X,
                      stateCentroids = state.centroids || [],
                      stateClusters = state.clusters || [],
                      stateLabel = state.label;

                  var bg = d3.select(this).selectAll('rect.bg').data([1])
                  bg.enter().append("svg:rect")
                      .attr({
                        class: "bg",
                        width: w,
                        height: h
                      })
                      .style({
                        fill: "#EEE"
                      });

                  var vgroup = d3.select(this).selectAll('g.v-group').data([1])
                  vgroup.enter().append('svg:g').attr("class","v-group");

                  if(stateLabel!=1){
                    var v = d3.select(this).select('g.v-group').selectAll("path.v").data(voronoi(stateCentroids));
                      v.enter().append("svg:path");
                      v.attr({
                            class: "v",
                            d: function(d){ return "M" + d.join("L") + "Z"; }
                          })
                          .style({
                            fill: function(d,i) { return colorArea(i);}
                          });
                      v.exit().remove()
                  }
                  var x = d3.select(this).selectAll("circle.x").data(stateX);
                  x.enter().append("svg:circle")
                  x.attr({
                        class: function(d,i) { return "x x-"+i; },
                        cx: function(d){ return mapRange(d[0]);},
                        cy: function(d){ return mapRange(d[1]);},
                        r: r
                      })
                      .style({
                        fill: "#888"
                      });
                  var c = d3.select(this).selectAll("circle.c").data(stateCentroids);
                  c.enter().append("svg:circle")
                  c.attr({
                        class: "c",
                        cx: function(d){ return mapRange(d[0]);},
                        cy: function(d){ return mapRange(d[1]);},
                        r: rc
                      })
                      .style({
                        fill: function(d,i) { return color(i);},
                        stroke: '#333'
                      });
                  c.exit().remove();
                  for (var _i=0; _i<stateClusters.length; _i++) {
                    for (var _j=0; _j<stateClusters[_i].length; _j++) {
                      var point = d3.select(this).select(".x-"+stateClusters[_i][_j])
                          .style("fill", function() { return colorPoint(_i); });
                    }
                  }
                });
            gs.attr({
                  class: function(d, i) { return "group group-" + i},
                  transform: function(d, i) { return "translate("+(i*(w+p/2))+",0)"}
                });
            gs.exit().remove();

            var barG = d3.select(this).selectAll('g.bar-group').data([1]);
            barG.enter().append('svg:g').attr({"transform":"translate("+(3*w+3*p)+",0)","class":"bar-group"});

            

            var bh = 20, maxbw = 150;

            var bar1G = barG.selectAll('g.bar-group-1').data([1]);
            bar1G.enter().append('svg:g').attr({"transform":"translate("+(7*p-3)+","+(4*p)+")","class":"bar-group-1"});
            var bar2G = barG.selectAll('g.bar-group-2').data([1]);
            bar2G.enter().append('svg:g').attr({"transform":"translate("+(7*p-3)+","+((4*p+p/2)+bh)+")","class":"bar-group-2"});
            var bar3G = barG.selectAll('g.bar-group-3').data([1]);
            bar3G.enter().append('svg:g').attr({"transform":"translate("+(7*p-3)+","+((4*p+p)+2*bh)+")","class":"bar-group-3"});

            var line = barG.selectAll('line.base').data([1]);
            line.enter().append('svg:line').attr({
                  x1: (7*p-3), x2: (7*p-3),
                  y1: 3*p, y2: h-p/2,
                  "class":"base"
                })
                .style({
                  stroke: "#8E8E8E"
                });
            var line2 = barG.selectAll('line.max').data([1]);
            line2.enter().append('svg:line').attr({
                  x1: (7*p-3)+maxbw, x2: (7*p-3)+maxbw,
                  y1: 3*p, y2: h-p/2,
                  "class":"max"
                })
                .style({
                  stroke: "#8E8E8E"
                });

            var bar1 = bar1G.selectAll('rect.bar').data([1]);
            bar1.enter().append('svg:rect');
            bar1.transition().duration(300).attr({
                  class:"bar bar-1",
                  width: function() {
                    var val = ks[item_i];
                    return val*maxbw/maxK;
                  },
                  height:bh
                })
                .style({
                  fill:colorBar(0)
                });
            var bar2 = bar2G.selectAll('rect.bar').data([1]);
            bar2.enter().append('svg:rect');
            bar2.transition().duration(300).attr({
                  class:"bar bar-2",
                  width: function() {
                    var val = times[item_i];
                    // console.log(val);
                    return val*maxbw/maxTime;
                  },
                  height:bh
                })
                .style({
                  fill:colorBar(1)
                });
            var bar3 = bar3G.selectAll('rect.bar').data([1]);
            bar3.enter().append('svg:rect');
            bar3.transition().duration(300).attr({
                  class:"bar bar-3",
                  width: function() {
                    var val = evals[item_i];
                    return (minEval!=maxEval)?(maxEval-val)*maxbw/(maxEval-minEval):maxbw;
                  },
                  height:bh
                })
                .style({
                  fill:colorBar(2)
                });
            
            var kText = bar1G.selectAll('text.label').data([1]);
            kText.enter().append('svg:text')
                .attr({
                  class:'label',
                  x: -p, y: p*3/2,
                  'text-anchor':'end'
                })
                .style({
                  fill: "#888"
                })
                .text("K");
            var timeText = bar2G.selectAll('text.label').data([1]);
            timeText.enter().append('svg:text')
                .attr({
                  class:'label',
                  x: -p, y: p*3/2,
                  'text-anchor':'end'
                })
                .style({
                  fill: "#888"
                })
                .text("Time");
            var evalText = bar3G.selectAll('text.label').data([1]);
            evalText.enter().append('svg:text')
                .attr({
                  class:'label',
                  x: -p, y: p*3/2,
                  'text-anchor':'end'
                })
                .style({
                  fill: "#888"
                })
                .text("Evaluation");

            var kVal = bar1G.selectAll('text.val').data([1]);
            kVal.enter().append('svg:text')
                .attr({
                  class:'val val-1',
                  x: p/2, y: p*3/2,
                  'text-anchor':'start'
                })
                .style({
                  fill: "#444",
                  display: "none"
                });
            kVal.text(ks[item_i]);
            var timeVal = bar2G.selectAll('text.val').data([1]);
            timeVal.enter().append('svg:text')
                .attr({
                  class:'val val-2',
                  x: p/2, y: p*3/2,
                  'text-anchor':'start'
                })
                .style({
                  fill: "#444",
                  display: "none"
                });
            timeVal.text(times[item_i]+"ms");
            var evalVal = bar3G.selectAll('text.val').data([1]);
            evalVal.enter().append('svg:text')
                .attr({
                  class:'val val-3',
                  x: p/2, y: p*3/2,
                  'text-anchor':'start'
                })
                .style({
                  fill: "#444",
                  display: "none"
                });
            evalVal.text(evals[item_i]);


            var overlay = d3.select(this).selectAll('rect.overlay').data([1]);
            overlay.enter().append('rect')
                .attr({
                  width: w*3 + p*3/2,
                  height:_h,
                })
                .style({
                  fill:"transparent"
                })
                .on("mouseover", function() {
                  d3.select(this.parentNode).selectAll('text.val').style({display:null});
                })
                .on("mouseout", function() {
                  d3.select(this.parentNode).selectAll('text.val').style({display:"none"});
                });

            var overlay1 = bar1G.selectAll('rect.bar-overlay').data([1]);
            overlay1.enter().append('svg:rect').attr({
                  class:"bar-overlay",
                  width: _w - (3*w+3*p/2),
                  height:bh+5,
                  x: -80
                })
                .style({
                  fill:"transparent"
                })
                .on("mousemove", function(){
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-3,rect.bar-2')
                      .style("fill","#EEE");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.val-1').style("display", null);
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.min').style("display",null)
                      .text(0);
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.max').style("display",null)
                      .text(maxK)
                })
                .on("mouseout", function(){
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-1')
                      .style("fill",colorBar(0));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-2')
                      .style("fill",colorBar(1));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-3')
                      .style("fill",colorBar(2));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.val-1').style("display", "none");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.min').style("display","none");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.max').style("display","none");
                });
            var overlay2 = bar2G.selectAll('rect.bar-overlay').data([1]);
            overlay2.enter().append('svg:rect').attr({
                  class:"bar-overlay",
                  width: _w - (3*w+3*p/2),
                  height:bh+5,
                  x: -80
                })
                .style({
                  fill:"transparent"
                })
                .on("mousemove", function(){
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-1,rect.bar-3')
                      .style("fill","#EEE");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.val-2').style("display", null);
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.min').style("display",null)
                      .text(0);
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.max').style("display",null)
                      .text(maxTime)
                })
                .on("mouseout", function(){
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-1')
                      .style("fill",colorBar(0));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-2')
                      .style("fill",colorBar(1));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-3')
                      .style("fill",colorBar(2));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.val-2').style("display", "none");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.min').style("display","none");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.max').style("display","none");
                });
            var overlay3 = bar3G.selectAll('rect.bar-overlay').data([1]);
            overlay3.enter().append('svg:rect').attr({
                  class:"bar-overlay",
                  width: _w - (3*w+3*p/2),
                  height:bh+5,
                  x: -80
                })
                .style({
                  fill:"transparent"
                })
                .on("mousemove", function(){
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-1,rect.bar-2')
                      .style("fill","#EEE");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.val-3').style("display", null);
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.min').style("display",null)
                      .text(maxEval);
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.max').style("display",null)
                      .text(minEval);
                })
                .on("mouseout", function(){
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-1')
                      .style("fill",colorBar(0));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-2')
                      .style("fill",colorBar(1));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('rect.bar-3')
                      .style("fill",colorBar(2));
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.val-3').style("display", "none");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.min').style("display","none");
                  d3.select(this.parentNode.parentNode.parentNode.parentNode).selectAll('text.max').style("display","none");
                });

            var min = barG.selectAll('text.min').data([1]);
            min.enter().append('svg:text')
                .attr({
                  class:'min',
                  x: (7*p-3), y: p*3,
                  'text-anchor':'start'
                })
                .style({
                  fill: "#444",
                  display: "none"
                });
            var max = barG.selectAll('text.max').data([1]);
            max.enter().append('svg:text')
                .attr({
                  class:'max',
                  x: (7*p-3) + maxbw, y: p*3,
                  'text-anchor':'end'
                })
                .style({
                  fill: "#444",
                  display: "none"
                });
            
          }); 

      _items.attr({
        transform: function(d, i) {
          return "translate(0,"+(h2*(items.length-i-1)+30) +")";
        }
      });
      _items.exit().remove();



      function mapRange(val) {
        return val / max * (w-2*p) + p;
      }

      
    }
  }

  // Parameter panel drawing handler
  var drawParamControl = function(target, origin_x, origin_y, _w, _h) {
    target.attr("transform", "translate(" + origin_x + "," + origin_y + ")");
    
    var p = 10;

    var bg = target.append("rect")
            .attr({ width: _w, height: _h })
            .style("fill", "#F7F7F7"),
        kText = target.append("text")
            .attr("x", _w - 70)
            .attr("y", _h - p)
            .text("K:"),
        kVal = target.append("text")
            .attr("x", _w - 50)
            .attr("y", _h - p)
            .style("fill", "#B24747")
            .text(3),
        line = target.append("line")
            .attr({
              x1: p,
              x2: 300-p,
              y1: _h/2,
              y2: _h/2
            })
            .style({
              "stroke": "#444",
              "stroke-width": "1px"
            }),
        overlay = target.append("rect")
            .attr({ width: 300-2*p, height: _h, x:p})
            .style({"fill": "transparent", "cursor": "pointer"})
            .on("click", function() {
              var _x = d3.mouse(this)[0]-p,
                  n = Math.floor(_x/(300-2*p)*5);
              control.attr({"x":n*(300-2*p)/5+p})
              kVal.text(n+2);
              options.k = n+2;
              kMeans.setOptions(options);
              kMeans.autoCluster(dataset.generate(0,currDataType));
              main.draw(listener.states.length-1);
              stepControl.draw();
              kMeansCompare.addItem();
            }),
        control = target.append("rect")
            .attr({ width: (300-2*p)/5, height:_h/2, x: 2*(300-2*p)/5+p, y:_h/4})
            .style({"fill": "#B24747", "cursor": "pointer"});


  }

  //Data input control panel drawing handler
  var drawDataControl = function(target, origin_x, origin_y, _w, _h) {
    target.attr("transform", "translate("+origin_x+","+origin_y+")")
    var bg = target.append("rect")
            .attr({ width: _w, height: _h })
            .style("fill", "#F7F7F7");

    this.clusters = target.append("svg:g").attr({"class": "button-group clusters", "transform": "translate(5,5)"}); 
    this.curves = target.append("svg:g").attr({"class": "button-group curves", "transform": "translate(5,60)"}); 
    this.donut = target.append("svg:g").attr({"class": "button-group donut", "transform": "translate(5,115)"}); 
    this.random = target.append("svg:g").attr({"class": "button-group random", "transform": "translate(5,170)"}); 

    this.clusters.append("svg:rect").attr({class:"button",width: 50, height: 50}).style({"stroke":'#333',"fill":"#B24747"});
    this.curves.append("svg:rect").attr({class:"button",width: 50, height: 50}).style({"stroke":'#6E6E6E',"fill":"white"});
    this.donut.append("svg:rect").attr({class:"button",width: 50, height: 50}).style({"stroke":'#6E6E6E',"fill":"white"});
    this.random.append("svg:rect").attr({class:"button",width: 50, height: 50}).style({"stroke":'#6E6E6E',"fill":"white"});

    this.clusters.append("svg:circle").attr({class:"details", r:8, cx:15,cy:15}).style({"fill":"#EEE"});
    this.clusters.append("svg:circle").attr({class:"details", r:8, cx:38,cy:20}).style({"fill":"#EEE"});
    this.clusters.append("svg:circle").attr({class:"details", r:8, cx:25,cy:35}).style({"fill":"#EEE"});

    this.curves.append("svg:path").attr({class:"details", d:"M10,20 Q20,60 30,20"}).style({"stroke":"#6E6E6E", "stroke-width":"2px",  fill:"transparent"});
    this.curves.append("svg:path").attr({class:"details", d:"M20,30 Q30,-10 40,30"}).style({"stroke":"#6E6E6E", "stroke-width":"2px",  fill:"transparent"});
    
    this.donut.append("svg:circle").attr({class:"details", r:18, cx:25,cy:25}).style({"stroke":"#6E6E6E", "stroke-width":"2px", "fill":"transparent"});
    this.donut.append("svg:circle").attr({class:"details", r:10, cx:25,cy:25}).style({"stroke":"#6E6E6E", "stroke-width":"2px", "fill":"transparent"});

    this.random.append("svg:circle").attr({class:"details", r:1, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});
    this.random.append("svg:circle").attr({class:"details", r:2, cx:Math.random()*30+10,cy:Math.random()*30+10}).style({"fill":"#6E6E6E"});

    this.clusters.on("mouseover", function() { 
        d3.select(this).select('.button').style({fill:"#B24747"});
        d3.select(this).selectAll('.details').style({fill:"#EEE"});
      })
      .on("mouseout", function() { 
        if(currDataType!="clusters"){
          d3.select(this).select('.button').style({fill:"transparent"});
          d3.select(this).selectAll('.details').style({fill:"#6E6E6E"});
        }
      })
      .on("click", function() {
        currDataType = dataset.data_type.clusters;
        target.select('.button-group.clusters').on("mouseout").call(this);
        target.select('.button-group.curves').on("mouseout").call(target.select('.button-group.curves')[0][0]);
        target.select('.button-group.donut').on("mouseout").call(target.select('.button-group.donut')[0][0]);
        target.select('.button-group.random').on("mouseout").call(target.select('.button-group.random')[0][0]);
        kMeans.autoCluster(dataset.generate(0,currDataType));
        stepControl.draw();
        main.draw(listener.states.length-1);
        kMeansCompare.addItem();
      });
    this.curves.on("mouseover", function() { 
        d3.select(this).select('.button').style({fill:"#B24747"});
        d3.select(this).selectAll('.details').style({stroke:"#EEE"});
      })
      .on("mouseout", function() { 
        if(currDataType!="curves"){
          d3.select(this).select('.button').style({fill:"transparent"});
          d3.select(this).selectAll('.details').style({stroke:"#6E6E6E"});
        }
      })
      .on("click", function() {
        currDataType = dataset.data_type.curves;
        target.select('.button-group.clusters').on("mouseout").call(target.select('.button-group.clusters')[0][0]);
        target.select('.button-group.curves').on("mouseout").call(this);
        target.select('.button-group.donut').on("mouseout").call(target.select('.button-group.donut')[0][0]);
        target.select('.button-group.random').on("mouseout").call(target.select('.button-group.random')[0][0]);
        kMeans.autoCluster(dataset.generate(0,currDataType));
        stepControl.draw();
        main.draw(listener.states.length-1);
        kMeansCompare.addItem();
      });
    this.donut.on("mouseover", function() { 
        d3.select(this).select('.button').style({fill:"#B24747"});
        d3.select(this).selectAll('.details').style({stroke:"#EEE"});
      })
      .on("mouseout", function() { 
        if(currDataType!="donut"){
          d3.select(this).select('.button').style({fill:"transparent"});
          d3.select(this).selectAll('.details').style({stroke:"#6E6E6E"});
        }
      })
      .on("click", function() {
        currDataType = dataset.data_type.donut;
        target.select('.button-group.clusters').on("mouseout").call(target.select('.button-group.clusters')[0][0]);
        target.select('.button-group.curves').on("mouseout").call(target.select('.button-group.curves')[0][0]);
        target.select('.button-group.donut').on("mouseout").call(this);
        target.select('.button-group.random').on("mouseout").call(target.select('.button-group.random')[0][0]);
        kMeans.autoCluster(dataset.generate(0,currDataType));
        stepControl.draw();
        main.draw(listener.states.length-1);
        kMeansCompare.addItem();
      });
    this.random.on("mouseover", function() { 
        d3.select(this).select('.button').style({fill:"#B24747"});
        d3.select(this).selectAll('.details').style({fill:"#EEE"});
      })
      .on("mouseout", function() { 
        if(currDataType!="random"){
          d3.select(this).select('.button').style({fill:"transparent"});
          d3.select(this).selectAll('.details').style({fill:"#6E6E6E"});
        }
      })
      .on("click", function() {
        currDataType = dataset.data_type.random
        target.select('.button-group.clusters').on("mouseout").call(target.select('.button-group.clusters')[0][0]);
        target.select('.button-group.curves').on("mouseout").call(target.select('.button-group.curves')[0][0]);
        target.select('.button-group.donut').on("mouseout").call(target.select('.button-group.donut')[0][0]);
        target.select('.button-group.random').on("mouseout").call(this);
        kMeans.autoCluster(dataset.generate(0,currDataType));
        stepControl.draw();
        main.draw(listener.states.length-1);
        kMeansCompare.addItem();
      });
  }

  // Step Control panel drawing handler
  var drawStepControl = function(target, origin_x, origin_y,_w,_h) {
    target.attr("transform", "translate("+origin_x+","+origin_y+")")
    var i,_itr;
    var p = 10,
        bh = _h/3;

    var bg = target.append("rect")
              .attr({ width: _w + 70, height: _h })
              .style("fill", "#F7F7F7"),
          stepLabel = target.append("text")
              .attr({x: _w, y: p*2})
              .style("fill", '#B24747')
              .text("Step"),
          iterationLabel = target.append("text")
              .attr({x: _w, y: p*4})
              .text("Iteration");
    var stepsG = target.append("svg:g"),
        stepTextsG = target.append("svg:g"),
        focus = target.append("svg:g").style("display","none"),
        hover = target.append("svg:rect").style({"fill":'#B24747'});
    focus.append("svg:line").attr("class","line-1").style({"stroke-width":'1px',"stroke":'#B24747'});
    focus.append("svg:line").attr("class","line-2").style({"stroke-width":'1px',"stroke":'#B24747'});


    this.draw = function(){
      var itr = [];
      for(i=0, _itr=-1; i<listener.states.length; i++) {
        if(listener.states[i].currentIteration>0){
          if(listener.states[i].currentIteration != _itr) {
            if(itr.length > 0) 
              itr[itr.length-1].push(i-1);
            itr.push([i]);
            _itr = listener.states[i].currentIteration;
          }
          if(listener.states.length-1 == i && itr.length > 0)
            itr[itr.length-1].push(i);
        }
      }
      
      hover.attr("x", _w-p - (_w-2*p)/listener.states.length)
          .attr("width", (_w-2*p)/listener.states.length*0.9);

      var steps = stepsG.selectAll("rect.step")
              .data(listener.states);
      steps.enter().append('svg:rect')
          .attr("class", function(d,i) { return "step step-"+i; });
      steps.attr("y", bh*2)
          .attr("x", function(d,i) {
            return i*(_w-2*p)/listener.states.length + p; 
          })
          .attr("width", (_w-2*p)/listener.states.length*0.9)
          .attr("height", bh)
          .style({
            "fill": "#E7E7E7"
          });
      steps.exit().remove();

      var stepTexts = stepTextsG.selectAll("text.step")
              .data(listener.states);
      stepTexts.enter().append('svg:text')
          .attr("class", function(d,i) { return "step step-"+i; });
      stepTexts.attr("y", p*2)
          .attr("x", function(d,i) {
            return i*(_w-2*p)/listener.states.length + p + (_w-2*p)/listener.states.length/2; 
          })
          .attr("text-anchor", "middle")
          .style({"fill": '#B24747', display: "none"})
          .text(function(d,i) { return i+1; });
      stepTexts.exit().remove();

      var iteration = target.selectAll("line.iteration")
              .data(itr);
      iteration.enter().append('svg:line')
          .attr("class", function(d,i) { return "iteration iteration-"+i; });
      iteration.attr("y1", p*4+5)
          .attr("y2", p*4+5)
          .attr("x1", function(d,i) {
            return d[0]*(_w-2*p)/listener.states.length + p; 
          })
          .attr("x2", function(d,i) {
            return (d[1]+1)*(_w-2*p)/listener.states.length + p - (_w-2*p)/listener.states.length*0.1; 
          })
          .style({
            "stroke": "#444",
            "stroke-width": "1px"
          });
      iteration.exit().remove();
      
      var iterationText = target.selectAll("text.iteration")
              .data(itr);
      iterationText.enter().append('svg:text')
          .attr("class", function(d,i) { return "iteration iteration-"+i; });
      iterationText.attr("y", p*4)
          .attr("x", function(d,i) {
            return (d[0]*(_w-2*p)/listener.states.length + (d[1]+1)*(_w-2*p)/listener.states.length)/2 + p; 
          })
          .style({
            "color": '#444',
            "text-anchor": 'middle'
          })
          .text(function(d,i) {return i+1;});
      iterationText.exit().remove();    

    }

    var overlay = target.append("rect")
        .style("fill", "transparent")
        .attr({ width: _w-2*p-1, height: _h, x:p, y:0})
        .on("mouseover", function(){focus.style("display", null);})
        .on("mouseout", function(){focus.style("display", "none");})
        .on("mousemove", function(){
          var x = d3.mouse(this)[0]-p,
              bw = (_w-2*p)/listener.states.length,
              n = Math.floor(x/bw),
              x0 = n*bw+p;
          hover.attr("x", x0)
              .attr("width", (_w-2*p)/listener.states.length*0.9)
              .attr("height", bh)
              .attr("y", bh*2);
          target.selectAll("text.step").style({display: "none"});
          target.selectAll("text.step-"+n).style({display: null});
          focus.select(".line-1")
              .attr("x1", x0)
              .attr("x2", x0)
              .attr("y1", 0)
              .attr("y2", _h);
          focus.select(".line-2")
              .attr("x1", x0 + bw*0.9)
              .attr("x2", x0 + bw*0.9)
              .attr("y1", 0)
              .attr("y2", _h);

          main.draw(n);
          d3.selectAll('li.step-list')
              .style("background-color", function(d,i) { 
                return (listener.states[n].label == i)? "#DDD": "transparent";
              });
        });
    this.draw();



    function mapRange(val) {
      return val / max * (w-2*p) + p
    }
    
  }
  var drawMain = function(target, origin_x, origin_y, _w,_h) {
    target.attr("transform", "translate("+origin_x+","+origin_y+")");
    var w = _w || 500,
        h = _h || 500,
        p = 10,
        r = 3, rc = 6,
        max = 100,
        min = 0,
        voronoi = d3.geom.voronoi()
          .clipExtent([[0, 0], [w, h]])
          .x(function(d) { return mapRange(d[0]) })
          .y(function(d) { return mapRange(d[1]) });

    var clustersG = target.append("svg:g").attr("class", "clusters"),
        pointsG = target.append("svg:g").attr("class", "points"),
        centroidsG = target.append("svg:g").attr("class", "centroids");

    this.draw = function(n) {
      var ref,
          X = kMeans.X || [],
          centroids = listener.states[n].centroids || [],
          clusters = listener.states[n].clusters || [],
          label = listener.states[n].label || 0;

      // if: init or find minimum mean steps
      if (label==1 || label==3) {
        ref = clustersG.selectAll("path")
            .data([]);
      } else {  
        ref = clustersG.selectAll("path")
            .data(voronoi(centroids));
      }
      
      ref.enter().append("svg:path")
          .attr("class", function(d, i) { return "voronoi-"+i; });
      ref.exit().remove();


      ref.style("fill", function(d, i) { return colorArea(i); })
          .attr("d", function(d) {return "M" + d.join("L") + "Z"; });

      ref = pointsG.selectAll("circle")
          .data(X);
      ref.enter().append("svg:circle")
          .attr("class", function(d, i) { return "point-"+i; });

      ref.attr("cx", function(d) { return mapRange(d[0]); })
          .attr("cy", function(d) { return mapRange(d[1]); })
          .attr("r", r)
          .attr("fill", d3.rgb('#888'))
          .attr("stroke", "none");

      ref = centroidsG.selectAll("circle")
          .data(centroids);
      ref.enter().append("svg:circle")
          .attr("class", function(d, i) { return "centroid-"+i; })
          .attr("r", rc)
          .attr("fill", function(d, i) { return color(i); })
          .attr("stroke", "#3A3A3A");
      ref.exit().remove();

      ref.transition().duration(300).ease(d3.ease('linear'))
          .attr("cx", function(d) { return mapRange(d[0]); })
          .attr("cy", function(d) { return mapRange(d[1]); });



      for (_i=0; _i<clusters.length; _i++) {
        for (_j=0; _j<clusters[_i].length; _j++) {
          var point = pointsG.select(".point-"+clusters[_i][_j])
              .attr("fill", function() { return colorPoint(_i); });
        }
      }
    }

    this.draw(listener.states.length-1);

    function mapRange(val) {
      return val / max * (w-2*p) + p;
    }


  }
  
  //initializing
  drawSvg();
})
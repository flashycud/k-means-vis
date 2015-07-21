define(['d3', 'underscore', 'json!dataset.json'], function(d3, _, data_json) {
  var dataset = function() {
    this.data_type = {
      clusters: 'clusters',
      donut: 'donut',
      random: 'random',
      curves: 'curves'
    }
  }

  dataset.prototype.generate = function(n, type) {
    type = type || this.data_type.clusters;

    var loaded_data = data_json;

    switch (type) {
      case this.data_type.donut: {
        return loaded_data.donut.data;
      }
      case this.data_type.random: {
        var _result = [];
        for(var i=0; i< 300; i++) {
          _result.push([Math.random()*100, Math.random()*100]);
        }
        return _result;
      }
      case this.data_type.curves: {
        return loaded_data.curves.data;
      }
      case this.data_type.clusters:
      default: {
        return loaded_data.clusters.data;
      }
    }
  }
  

  return dataset;
});
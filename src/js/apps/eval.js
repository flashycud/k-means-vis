define(['underscore'], function(_) {
  var evaluate = function(_data, _clusters, _centroids) {
    var internal = internalEvaluate(_data, _clusters, _centroids),
        external = externalEvaluate(_data, _clusters, _centroids);

    return internal;
  }
  var internalEvaluate = function(_data, _clusters, _centroids) {
    //DBI
    var A = _centroids || findCentroids(_data, _clusters),
        S = measureScatter(_data, _clusters, A),
        M = measureSeparation(A),
        R = measureGoodness(S, M),
        DB = 0;

    for (var i=0; i<R.length; i++) {
      var d = 0;
      for (var j=0; j<R.length; j++) {
        d = (d > R[i][j])? d: R[i][j];
      }
      DB += d;
    }
    return DB/A.length;
  }
  var externalEvaluate = function() {
    //Rand
    return null; // no ground truth data
  }

  var findCentroids = function(_data, _clusters) {
    var _result = [], _i, _j;
    for (_i=0; _i < _clusters.length; _i++) {
      var a = [0,0];
      for (_j=0; _j<_clusters[_i].length; _j++) {
        a[0] += _data[_clusters[_i][_j]][0];
        a[1] += _data[_clusters[_i][_j]][1];
      }
      a[0] = a[0]/_clusters[_i].length;
      a[1] = a[1]/_clusters[_i].length;
      _result.push(a);
    }
    return _result;
  }
  var measureScatter = function(_data, _clusters, _centroids) {
    var _result = [], _i, _j, c;
    c = _centroids;
    for (_i=0; _i < _clusters.length; _i++) {
      var a = 0;
      for (_j=0; _j<_clusters[_i].length; _j++) {
        var x = _data[_clusters[_i][_j]][0],
            y = _data[_clusters[_i][_j]][1];
        a += Math.sqrt((x-c[_i][0])*(x-c[_i][0]) + (x-c[_i][1])*(x-c[_i][1]));
      }
      a = a/_clusters[_i].length;
      _result.push(a);
    }
    return _result;
  }
  var measureSeparation = function(_centroids) {
    var _result = [], i, j, c=_centroids;
    for (i=0; i<c.length; i++) {
      var m = [];
      for (j=0; j<c.length; j++) {
        m.push(0);
      }
      _result.push(m);
    }
    for (i=0; i<c.length; i++) {
      for (j=0; j<c.length; j++) {
        _result[i][j] = _result[j][i] = Math.sqrt((c[i][0]-c[j][0])*(c[i][0]-c[j][0]) + (c[i][1]-c[j][1])*(c[i][1]-c[j][1]));
      }
    }
    return _result;
  }
  var measureGoodness = function(_scatter, _separation) {
    var _result = [], i, j, s = _scatter, m = _separation;
    for (i=0; i<s.length; i++) {
      var r = [];
      for (j=0; j<s.length; j++) {
        r.push(0);
      }
      _result.push(r);
    }
    for (i=0; i<s.length; i++) {
      for (j=0; j<s.length; j++) {
        _result[i][j] = _result[j][i] = (m[i][j]!=0)? (s[i] + s[j])/m[i][j]: 0;
      }
    }
    return _result;
  }

  return {
    evaluate: evaluate
  }
});
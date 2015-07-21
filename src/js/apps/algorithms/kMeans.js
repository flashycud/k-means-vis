define(['d3','underscore'], function(d3,_) {
  var options = {
    //default options
    k: 3,
    maxIterations: 100,
    convergenceTest: true,
    tolerance: 1e-3,
    listener: null
  };

  var kMeansCluster = function(_options) {
    this.setOptions(_options);
    this.initialize = kMeansCluster.initializeForgy;
  }

  kMeansCluster.prototype.cluster = function(_data, _options, centroids) {
    this.setOptions(_options);
    var _ref;
    this.X = _data
    this.prevCentroids = [];
    this.clusters = [];
    this.currentIteration = 0;
    this.centroids = [];

    this.saveState(0);
    this.saveTimestamp(0);

    _ref = [this.X.length, this.X[0].length], this.m = _ref[0], this.n = _ref[1];
    if ((this.m == null) || (this.n == null) || this.m < this.options.k || this.n < 1) {
      throw "You must pass more data";
    }
    return this.centroids = centroids || this.initialize(this.X, this.options.k, this.m, this.n);
  };

  kMeansCluster.prototype.step = function() {
    return this.currentIteration++ < this.options.maxIterations;
  };

  kMeansCluster.prototype.autoCluster = function(_data, _options, centroids) {
    var _results;
    this.resetState();
    this.cluster(_data, _options, centroids);
    this.saveState(1);
    this.saveTimestamp(1);
    _results = [];
    while (this.step()) {
      this.findClosestCentroids();
      this.saveState(2);
      this.saveTimestamp(2);
      this.moveCentroids();
      this.saveState(3);
      this.saveTimestamp(3);
      if (this.hasConverged()) {
        break;
      } else {
        _results.push(void 0);
      }
    }
    this.saveState(4);
    this.saveTimestamp(4);
    return _results;
  };

  kMeansCluster.initializeForgy = function(X, K, m, n) {
    var k, _i, _results, _ref;
    _results = [];
    for (k = _i = 0; 0 <= K ? _i < K : _i > K; k = 0 <= K ? ++_i : --_i) {
      _ref = X[Math.floor(Math.random() * m)];
      _results.push([_ref[0],_ref[1]]);
    }
    return _results;
  };

  kMeansCluster.initializeInRange = function(X, K, m, n) {
    var d, i, k, max, min, x, _i, _j, _k, _l, _len, _len1, _m, _results;
    for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
      min = Infinity;
    }
    for (i = _j = 0; 0 <= n ? _j < n : _j > n; i = 0 <= n ? ++_j : --_j) {
      max = -Infinity;
    }
    for (_k = 0, _len = X.length; _k < _len; _k++) {
      x = X[_k];
      for (i = _l = 0, _len1 = x.length; _l < _len1; i = ++_l) {
        d = x[i];
        min[i] = Math.min(min[i], d);
        max[i] = Math.max(max[i], d);
      }
    }
    _results = [];
    for (k = _m = 0; 0 <= K ? _m < K : _m > K; k = 0 <= K ? ++_m : --_m) {
      _results.push((function() {
        var _n, _results1;
        _results1 = [];
        for (d = _n = 0; 0 <= n ? _n < n : _n > n; d = 0 <= n ? ++_n : --_n) {
          _results1.push(Math.random() * (max[d] - min[d]) + min[d]);
        }
        return _results1;
      })());
    }
    return _results;
  };

  kMeansCluster.prototype.findClosestCentroids = function() {
    var c, cMin, i, j, k, min, r, x, xMin, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2, _results;
    if (this.options.convergenceTest) {
      this.prevCentroids = (function() {
        var _i, _len, _ref, _results;
        _ref = this.centroids;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          r = _ref[_i];
          _results.push(r.slice(0));
        }
        return _results;
      }).call(this);
    }
    this.clusters = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.options.k; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push([]);
      }
      return _results;
    }).call(this);
    _ref = this.X;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) { // all X
      x = _ref[i];
      cMin = 0;
      xMin = Infinity;
      _ref1 = this.centroids;
      for (j = _j = 0, _len1 = _ref1.length; _j < _len1; j = ++_j) { // all Cent
        c = _ref1[j];
        min = 0;
        for (k = _k = 0, _ref2 = x.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; k = 0 <= _ref2 ? ++_k : --_k) {
          min += (x[k] - c[k]) * (x[k] - c[k]);
        }
        if (min < xMin) {
          cMin = j;
          xMin = min;
        }
      }
      _results.push(this.clusters[cMin].push(i));
    }
    return _results;
  };

  kMeansCluster.prototype.moveCentroids = function() {
    var cl, d, i, j, sum, _i, _len, _ref, _results;
    _ref = this.clusters;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      cl = _ref[i];
      if (cl.length < 1) {
        continue;
      }
      _results.push((function() {
        var _j, _k, _len1, _ref1, _results1;
        _results1 = [];
        for (j = _j = 0, _ref1 = this.n; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
          sum = 0;
          for (_k = 0, _len1 = cl.length; _k < _len1; _k++) {
            d = cl[_k];
            sum += this.X[d][j];
          }
          _results1.push(this.centroids[i][j] = sum / cl.length);
        }
        return _results1;
      }).call(this));
    }
    return _results;
  };

  kMeansCluster.prototype.hasConverged = function() {
    var absDelta, i, j, _i, _j, _ref, _ref1;
    if (!this.options.convergenceTest) {
      return false;
    }
    for (i = _i = 0, _ref = this.n; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      for (j = _j = 0, _ref1 = this.m; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
        absDelta = Math.abs(this.prevCentroids[i][j] - this.centroids[i][j]);
        if (this.options.tolerance > absDelta) {
          return true;
        }
      }
    }
    return false;
  };

  kMeansCluster.prototype.setOptions = function(_options) {
    this.options = this.options || options;
    this.options = _.extend (this.options, _options);
  }

  kMeansCluster.prototype.resetState = function() {
    if (this.options.listener) {
      this.options.listener.resetState();
    }
  }
  kMeansCluster.prototype.saveTimestamp = function(label) {
    if (this.options.listener) {
      this.options.listener.markTime(label);
    }
  }
  kMeansCluster.prototype.saveState = function(label) {
    if (this.options.listener) {
      var X, centroids, clusters, label, currentIteration;
      X = this.X;
      if (this.centroids) {
        centroids = (function() {
          var _i, _len, _ref, _results, _r;
          _ref = this.centroids;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            _r = _ref[_i];
            _results.push(_r.slice(0));
          }
          return _results;
        }).call(this);
      }
      if (this.clusters) {
        clusters = (function() {
          var _i, _len, _ref, _results, _r;
          _ref = this.clusters;
          if (_ref && _ref.length > 0){
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              _r = _ref[_i];
              _results.push(_r.slice(0));
            }
          }
          return _results;
        }).call(this);
      }
      currentIteration = this.currentIteration;

      var state = {
        X: X,
        centroids: centroids,
        clusters: clusters,
        label: label,
        currentIteration: currentIteration
      }
      this.options.listener.listen(state);
    }
  }

  return kMeansCluster
});
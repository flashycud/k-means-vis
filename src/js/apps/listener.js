define([],function(){
  var listener = function() {
    this.resetState();
  }

  listener.prototype.listen = function(state) {
    this.states.push(state);
  }
  listener.prototype.markTime = function(state) {
    this.timestamps.push((Date.now)? Date.now(): (new Date()).getTime());
  }
  listener.prototype.resetState = function() {
    this.states = [];
    this.timestamps = [];
  }
  return listener
});
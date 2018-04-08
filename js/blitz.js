/***
 * Blitz Class
***/

var Blitz = function() {
  this.id = 'blitz';
  this.html = undefined;
}

Blitz.prototype.rollDice = function() {
  this.execute();
}

Blitz.prototype.execute = function() {
  gGame.actions.blitzPlayer = gGame.selectedPlayer;
  gGame.actions.next();
}

Blitz.prototype.undo = function() {
  this.html.remove();
}

Blitz.prototype.print = function() {
}

Blitz.prototype.toString = function() {
  return 'Blitz';
}

Blitz.prototype.button = function() {
  if(this.html == undefined) {
    this.html = $('<button class="bb-button">' + this + '</button>');
  }
  return this.html;
}


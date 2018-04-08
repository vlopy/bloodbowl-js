/***
 * StandUp Class
***/

var StandUp = function() {
  this.id = 'standup';
  this.html = undefined;
  this.player = gGame.selectedPlayer;
}

StandUp.prototype.rollDice = function() {
  this.execute();
}

StandUp.prototype.execute = function() {
  this.player.moveAction = true;
  this.player.state = 'standing';
  this.player.square.html.removeClass('down');
  gGame.actions.next();
}

StandUp.prototype.undo = function() {
  this.html.remove();
}

StandUp.prototype.print = function() {
}

StandUp.prototype.toString = function() {
  return 'Stand Up';
}

StandUp.prototype.button = function() {
  if(this.html == undefined) {
    this.html = $('<button class="bb-button">' + this + '</button>');
  }
  return this.html;
}


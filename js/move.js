/***
 * Move Class
***/

var Move = function(startSquare) {
  this.id = 'move';
  this.html = undefined;
  this.squares = [];
  this.player = gGame.selectedPlayer;
  this.start = startSquare;
}

Move.prototype.lastSquare = function() {
  return this.squares[this.squares.length - 1];
}

Move.prototype.addSquare = function(sq) {
  if(this.squares.length == 0) {
    if(distance(this.start, sq) > 1) {
      console.log('The square is too far from the player');
      return false;
    } else {
      this.squares.push(sq);
      return true;
    }
  } else {
    if(distance(this.lastSquare(), sq) > 1) {
      console.log('The square is too far from the last square');
      return false;
    } else {
      this.squares.push(sq);
      return true;
    }
  }
}

Move.prototype.rollDice = function() {
  // No dice to roll for move actions
  this.execute();
}

Move.prototype.execute = function() {
  var my_player = this.player;
  my_player.moveAction = true;
  this.squares.forEach(function(s) {
    my_player.mv--;
    my_player.square.removePlayer();
    s.unprint();
    s.addPlayer(my_player, '');
  });
  gGame.actions.next();
}

Move.prototype.undo = function() {
  this.squares.forEach(function(s) {
    s.unprint();
  });
  this.html.remove();
}

Move.prototype.size = function() {
  return this.squares.length;
}

Move.prototype.toString = function() {
  return 'Move (' + this.squares.length + ')';
}

Move.prototype.button = function() {
  if(this.html == undefined) {
    this.html = $('<button class="bb-button">' + this + '</button>');
  }
  return this.html;
}

Move.prototype.print = function() {
  var my_id = this.id;
  this.squares.forEach(function(s) {
    s.html.append('<img src="images/' + my_id + '.png" class="moving-square">');
  });
}


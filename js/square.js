/***
 * Square Class
***/

var Square = function(x, y, endZoneTeam) {
  this.x = x;
  this.y = y;
  // Detect squares not in the field
  this.out = false;
  // There is a player on the square
  this.player = undefined;
  // If true, get path in selectedPath
  this.move = false;
  // True, the ball is on the square
  this.ball = false;
  // The HTML code of this square
  this.html = $('<div class="square" onclick="selectSquare('+ x + ', ' + y + ')"></div>');
  // Define the end zones of the field
  this.touchdownTeam = endZoneTeam;
}

Square.prototype.hasPlayer = function() {
  return this.player != undefined;
}

Square.prototype.showCoords = function() {
  this.html.append(this.x + ', ' + this.y);
}

Square.prototype.removePlayer = function() {
  var stateClass = '', my_class;
  if(this.player != undefined) {
    my_class = this.html.attr('class').replace('square','').trim();
    if(my_class.length > 0) {
      stateClass = my_class;
    }
    this.html.attr('class', 'square');
    this.player.square = undefined;
    this.player = undefined;
    this.html.find('img').remove();
  }
  return stateClass;
}

Square.prototype.addBall = function() {
  if(this.player == undefined) {
    gGame.teamWithBall = undefined;
    this.ball = true;
    this.html.addClass('w-ball');
  }
}

Square.prototype.removeBall = function() {
  this.ball = false;
  this.html.removeClass('w-ball');
}

Square.prototype.addPlayer = function(my_player, stateClass) {
  var old_square = my_player.square, imageString, myTeam = gGame.team(my_player.team).desc;
  // Delete the player of the field
  if(old_square != undefined) {
    old_square.removePlayer();
  }
  // Add the player to the new square
  this.player = my_player;
  my_player.square = this;
  if(my_player.ball) {
    this.html.append(
      '<img src="images/coins/' + myTeam.color + '/' + this.player.number + '.png">' +
      '<img src="images/positions/' + this.player.position +
      '-ball.png" class="player-position" ' +
      'onclick="selectPlayer(' + this.x + ', ' + this.y + '); event.stopPropagation();" ' +
      'onmouseover="stats(' + this.x + ', ' + this.y + ')">')
      .css('opacity', 0.3).fadeTo(300, 1);
  } else {
    this.html.append(
      '<img src="images/coins/' + myTeam.color + '/' + this.player.number + '.png">' +
      '<img src="images/positions/' + this.player.position + 
      '.png" class="player-position" ' +
      'onclick="selectPlayer(' + this.x + ', ' + this.y + '); event.stopPropagation();" ' +
      'onmouseover="stats(' + this.x + ', ' + this.y + ')">')
      .css('opacity', 0.3).fadeTo(300, 1);
  }
  if(this.player == gGame.selectedPlayer) {
    this.selectPlayer();
  }
  if(stateClass.length > 0) {
    this.html.addClass(stateClass);
  }
  this.isTouchdown();
}

Square.prototype.isTouchdown = function() {
  var isHT = gGame.isHalfTime();
  if(this.player != undefined && this.player.ball && this.player.team == this.touchdownTeam) {
    comments('<h2>Touchdown!!</h2>');
    gGame.currentTeam().score++;
    gGame.newRound();
    if(!isHT) {
      gGame.field.reset();
      gGame.kickOff();
      // Add the ball
      gGame.addBall();
      // End of the kick off phase
      gGame.isKickOff = false;
      // Start the new team turn
      gGame.prepareTeams();
    }
  }
}

Square.prototype.selectPlayer = function() {
  this.html.append('<img src="images/selected-player.png" class="selected-player" \
      onclick="unselectPlayer(); event.stopPropagation();">');
}

Square.prototype.unselectPlayer = function() {
  this.html.find('.selected-player').remove();
  gGame.selectedPlayer = undefined;
  gGame.actions.path = undefined;
}

Square.prototype.unprint = function() {
  this.move = false;
  this.html.find('img').remove('.moving-square');
}

Square.prototype.inField = function(x, y, validSquares) {
  var my_field = gGame.field;
  if(x >= 0 && x < my_field.xMax && y >= 0 && y < my_field.yMax) {
    validSquares.push(my_field.square(x, y));
  }
}

Square.prototype.aroundSquares = function() {
  var squares = [], field = gGame.field;
  this.inField(this.x - 1, this.y - 1, squares);
  this.inField(this.x - 1, this.y, squares);
  this.inField(this.x - 1, this.y + 1, squares);
  this.inField(this.x, this.y - 1, squares);
  this.inField(this.x, this.y + 1, squares);
  this.inField(this.x + 1, this.y - 1, squares);
  this.inField(this.x + 1, this.y, squares);
  this.inField(this.x + 1, this.y + 1, squares);
  return squares;
}

Square.prototype.aroundPlayers = function(team_player) {
  var players = [];
  this.aroundSquares().forEach(function(s) {
    if(s.hasPlayer() && s.player.team != team_player.name && s.player.state == 'standing') {
      players.push(s.player);
    }
  });
  return players;
}

Square.prototype.ballRebound = function() {
  var d8 = new Dice(1), my_field = gGame.field, catchAction, dest, xDest, yDest;
  this.removeBall();
  d8.rollD8('Ball Rebound');
  switch(d8.result[0]) {
    case 1:
      xDest = this.x + 1;
      yDest = this.y - 1;
      break;
    case 2:
      xDest = this.x + 1;
      yDest = this.y;
      break;
    case 3:
      xDest = this.x + 1;
      yDest = this.y + 1; 
      break;
    case 4:
      xDest = this.x;
      yDest = this.y - 1;
      break;
    case 5:
      xDest = this.x;
      yDest = this.y + 1;
      break;
    case 6:
      xDest = this.x - 1;
      yDest = this.y - 1; 
      break;
    case 7:
      xDest = this.x - 1;
      yDest = this.y;
      break;
    case 8:
      xDest = this.x - 1;
      yDest = this.y + 1;
      break;
  }
  d8.comments('Ball Rebound');
  if(xDest >= 0 && xDest < my_field.xMax && yDest >= 0 && yDest < my_field.yMax) {
    dest = my_field.square(xDest, yDest);
  } else {
    dest = new OutSquare(this.x, this.y);
  }
  if(dest.hasPlayer()) {
    if(dest.player.state == 'standing' && gGame.actions.down.indexOf(dest.player) == -1) {
      if(gGame.isKickOff) {
        // The game is not started, kick off
        new Catch(dest.player, 'other').rollDice();
      } else {
        gGame.actions.append(new Catch(dest.player, 'other'));
      }
    } else {
      dest.ballRebound();
    }
  } else {
    dest.addBall();
  }
}

Square.prototype.toString = function() {
  return '(x: ' + this.x + ', y: ' + this.y + ')';
}


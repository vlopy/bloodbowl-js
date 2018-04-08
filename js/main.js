// Global variables
var gGame = undefined;

// Distance between 2 squares
function distance(square1, square2) {
  var xfar, yfar;
  xfar = square1.x - square2.x;
  yfar = square1.y - square2.y;
  if(xfar < 0) {
    xfar *= -1; 
  }
  if(yfar < 0) {
    yfar *= -1; 
  }
  if(yfar > xfar) {
    return yfar;
  } else {
    return xfar;
  }
}

function selectSquare(x, y) {
  var square = gGame.field.square(x, y);
  var sPlayer = gGame.selectedPlayer;
  var actionStack = gGame.actions;
  if(sPlayer != undefined) {
    if(square.move) {
      // Nothing to do
    } else {
      if(actionStack.path == undefined) {
        actionStack.path = new Path();
        if(actionStack.path.compute(square)) {
          addMovingAction();
        } else {
          // No solution
          actionStack.path = undefined;
          actionStack.undo();
          console.log('no solution');
        }
      } else {
        // A moving action already exists
        if(actionStack.path.newTarget(square)) {
          addMovingAction();
        } else {
          // Unreachable square
          actionStack.path = undefined;
          actionStack.undo();
        }
      }
    }
  }
}

function selectPlayer(x, y) {
  var my_square = gGame.field.square(x, y), sPlayer = gGame.selectedPlayer, opponent = my_square.player;
  var actionStack = gGame.actions;
  if(sPlayer != undefined && sPlayer.ball && opponent.team == sPlayer.team) {
    if(distance(sPlayer.square, opponent.square) == 1 ||
        (actionStack.path != undefined && 
          distance(actionStack.path.lastSquare(), opponent.square) == 1)) {
      // Detect Hand-off action
      if(actionStack.handoff) {
        alert('Only one hand-off per turn');
      } else {
        actionStack.append(new Throwing(opponent, true));
      }
    } else {
      // Detect a throwing action
      if(actionStack.pass) {
        alert('Only one pass per turn');
      } else {
        actionStack.append(new Throwing(opponent, false));
      }
    }
  } else if(gGame.hasTurn(my_square.player)) {
    // The player can play its turn (my team and standing state)
    if(gGame.selectedPlayer != undefined) {
      if(!unselectPlayer()) {
        unselectPlayer();
      }
    }
    gGame.selectedPlayer = my_square.player;
    my_square.selectPlayer();
    if(gGame.selectedPlayer.state == 'down') {
      actionStack.append(new StandUp());
    }
  } else {
    // The player is not allowed to play, try to fight him
    if(sPlayer != undefined && (
      !(sPlayer.moveAction || sPlayer.throwingAction || sPlayer.blockAction)
      || actionStack.blitzPlayer == sPlayer) &&
        sPlayer.team != opponent.team && opponent.state == 'standing') {
      // Try to fight with the opponent player
      if(distance(sPlayer.square, opponent.square) == 1 ||
          (actionStack.path != undefined && 
            distance(actionStack.path.lastSquare(), opponent.square) == 1)) {
        actionStack.append(new Block(sPlayer, opponent));
      }
    }
  }
}

function unselectPlayer() {
  var sPlayer = gGame.selectedPlayer;
  if(gGame.actions.undo()) {
    gGame.actions.path = undefined;
    return false;
  } else {
    if(sPlayer.moveAction || sPlayer.blockAction || sPlayer.throwingAction) {
      gGame.endTurn();
    } else {
      sPlayer.square.unselectPlayer();
    }
    return true;
  }
}

function addMovingAction() {
  var blitzDetected = false, previousSquare = gGame.selectedPlayer.square, detectedPlayers;
  var playerMv = gGame.selectedPlayer.mv - gGame.selectedPlayer.sprint;
  var move = new Move(previousSquare);
  var actionStack = gGame.actions;
  actionStack.undo();
  // Analyze the move to detect dodge, sprint, catch...
  actionStack.path.squares().forEach(function(s) {
    // Detect tackle zones
    if(previousSquare.aroundPlayers(gGame.currentTeam()).length > 0) {
      detectedPlayers = true;
    } else {
      detectedPlayers = false;
    }
    // Decrease the player movement
    playerMv--;
    // Detect dodges
    if(detectedPlayers) {
      if(move.size() > 0) {
        actionStack.append(move);
      }
      if(playerMv >= 0) {
        actionStack.append(new Dodge(previousSquare, s));
        move = new Move(s);
      } else {
        alert('Not enough movement to dodge!');
        actionStack.undo();
        actionStack.path = undefined;
      }
    } else {
      // Detect sprints (Go For It)
      if(playerMv < 0) {
        if(move.size() > 0) {
          actionStack.append(move);
        }
        actionStack.append(new Sprint(previousSquare, s));
        move = new Move(s);
      }
      if(move.start != s) {
        move.addSquare(s);
      }
    }
    // Take the ball
    if(s.ball) {
      if(move.size() > 0) {
        actionStack.append(move);
      }
      actionStack.append(new Catch(gGame.selectedPlayer, 'pick'));
      move = new Move(s);
    }
    // Update the previous square location
    previousSquare = s;
  });
  if(move.size() > 0) {
    actionStack.append(move);
  }
}

// Start a new round
function endTeamTurn() {
  gGame.newRound();
}

function stats(x, y) {
  $('#stats').html(gGame.field.square(x, y).player.stats());
}

function comments(msg) {
  $('#comments').prepend(msg + '<br/>');
}

// Entry Point
function match() {
  gGame = new Game('OrclandRaiders', 'ReiklandReavers');
  gGame.field.showCoords();
  gGame.kickOff(function() {
    // Add the ball
    gGame.addBall();
    // End of the kick off phase
    gGame.isKickOff = false;
    // Start the new team turn
    gGame.prepareTeams();
  });
}


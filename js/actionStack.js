/***
 * ActionStack Class
***/
var ActionStack = function() {
  // The HTML to display the actions
  this.div = $('#actions');
  // The list of actions to execute
  this.stack = [];
  // The action in progress
  this.current = undefined;
  // The block action
  this.block = undefined;
  // The blitz player during the team turn
  this.blitzPlayer = undefined;
  // True, the handoff action is executed
  this.handoff = false;
  // True, the pass action is executed
  this.pass = false;
  // The list of squares used to move the selected player
  this.path = undefined;
  // An action failure involves a turnover
  this._turnover = false;
  // The team with the ball at the beginning of the player turn
  this.teamWithBall = undefined;
  // Players will be down at the end of the player turn
  this.down = []
}

ActionStack.prototype.execute = function() {
  if(this.stack.length > 0) {
    this.teamWithBall = gGame.teamWithBall;
    this.path = undefined;
    this.next();
  }
}

ActionStack.prototype.next = function() {
  if(this.stack.length > 0) {
    // Execute the first action
    this.div.children().first().remove();
    this.current = this.stack.shift();
    this.current.rollDice();
  } else {
    // Execute down actions
    if(this.down.length > 0) {
      this.downPlayers();
    }
    // Detect end of turn and turnover
    if(this._turnover || 
      (this.teamWithBall == gGame.currentTeam() && gGame.teamWithBall != gGame.currentTeam())) {
      gGame.newRound();
    } else {
      // Detect end of the turn
      if(gGame.selectedPlayer != undefined && !gGame.selectedPlayer.ball &&
        (gGame.selectedPlayer.mv == 0 && !gGame.selectedPlayer.ball ||
          gGame.selectedPlayer.mv == gGame.selectedPlayer.sprint &&
          gGame.selectedPlayer.aroundMe().length > 0 ||
        this.pass ||
        this.handoff ||
        gGame.selectedPlayer.blockAction && this.blitzPlayer != gGame.selectedPlayer)) {
        gGame.endTurn();
      }
    }
  }
}

ActionStack.prototype.downPlayers = function() {
  var ballSquare = undefined;
  this.down.forEach(function(p) {
    if(p.ball) {
      ballSquare = p.square;
      comments(p + ' drops the ball!');
      p.dropBall();
    }
    p.down(0, 0);
  });
  this.down = [];
  if(ballSquare != undefined) {
    ballSquare.ballRebound();
  }
  gGame.actions.next();
}

ActionStack.prototype.turnover = function() {
  this._turnover = true;
  this.undo();
}

ActionStack.prototype.executeCurrent = function() {
  if(this.current != undefined) {
    this.current.execute();
  }
}

ActionStack.prototype.reRoll = function() {
  if(this.current != undefined) {
    this.current.rollDice();
  }
}

ActionStack.prototype.append = function(action) {
  var removed = [], my_stack = this.stack;
  if(action.id != 'standup' && gGame.selectedPlayer.state == 'down' && this.noStandUp()) {
    this.prepend(new StandUp());
  }
  if(action.id == 'block') {
    if(my_stack.length > 0 && this.noBlitz()) {
        this.div.css('background', 'yellow');
        if(!this.prepend(new Blitz())) {
          return false;
        }
    }
    this.block = action;
  }
  if(action.id == 'handoff' || action.id == 'pass') {
    my_stack.forEach(function(a) {
      if(a.id == 'handoff' || a.id == 'pass') {
        a.undo();
        my_stack.remove(a);
      }
    });
  }
  action.print();
  my_stack.push(action);
  this.div.append(action.button());
  return true;
}

ActionStack.prototype.prepend = function(action) {
  var addCatch = true, my_stack = this, movement, i, replayActions = [];
  var sprintSquare, replay, sPlayer = gGame.selectedPlayer;
  if(action.id == 'blitz' && this.blitzPlayer != undefined && this.blitzPlayer != sPlayer) {
    this.undo();
    this.path = undefined;
    alert('Only one blitz per turn!');
    return false;
  } else {
    if(action.id == 'blitz') {
      // Remove one point of the movement used by the blitz action
      movement = sPlayer.mv - 1;
      // Count the number of movement points required
      this.stack.forEach(function(a) {
        switch(a.id) {
          case 'move':
            movement -= a.size();
            break;
          case 'dodge':
          case 'sprint':
            movement--;
            break;
        }
      });
      if(movement >= 0) {
        if(movement < sPlayer.sprint) {
          // Add the blitz action
          this.stack.unshift(action);
          this.div.prepend(action.button());
          // Replay the stack actions to add sprints
          do {
            replay = this.stack.pop();
            replayActions.push(replay);
            replay.undo();
            if(replay.id == 'dodge') {
              this.undo();
              this.path = undefined;
              alert('Not enougth movement to execute the blitz action (Sprints are not allowed after dodging)');
              return false;
            }
          } while(replay.id != 'move');
          // Do not replay the move action
          replayActions.pop();
          // Remove the last square of the move
          sprintSquare = replay.squares.pop();
          if(replay.size() > 0) {
            this.append(replay);
            this.append(new Sprint(replay.lastSquare(), sprintSquare));
          } else {
            // Get the target square of the previous action (dodge)
            this.append(new Sprint(replayActions[replayActions.length - 1].target, sprintSquare));
          }
          replayActions.forEach(function(r) {
            my_stack.append(r);
          });
          return true;
        }
      } else {
        this.undo();
        this.path = undefined;
        alert('Not enougth movement to execute the blitz action');
        return false;
      }
    }
    if(action.id == 'catch') {
      // Detect the same catch in the action stack
      this.stack.forEach(function(a) {
        if(a.id == 'catch' && a.player == action.player) {
          addCatch = false;
        }
      });
    }
    if(addCatch) {
      this.stack.unshift(action);
      this.div.prepend(action.button());
      return true;
    } else {
      return false;
    }
  }
}

ActionStack.prototype.undo = function() {
  var undone = false;
  this.stack.forEach(function(a) {
    undone = true;
    a.undo();
  });
  this.stack = [];
  this.div.css('background', 'white');
  return undone;
}

ActionStack.prototype.reset = function() {
  this.undo();
  this.down = [];
  this.block = undefined;
  this.path = undefined;
  this.blitzPlayer = undefined;
  this.handoff = false;
  this.pass = false;
  this._turnover = false;
  this.div.css('background', 'white');
}

ActionStack.prototype.noStandUp = function() {
  var result = true;
  this.stack.forEach(function(a) {
    if(a.id == 'standup') {
      result = false;
    }
  });
  return result;
}

ActionStack.prototype.noBlitz = function() {
  var result = true;
  this.stack.forEach(function(a) {
    if(a.id == 'blitz') {
      result = false;
    }
  });
  return result;
}

ActionStack.prototype.noCatch = function() {
  var result = true;
  this.stack.forEach(function(a) {
    if(a.id == 'catch') {
      result = false;
    }
  });
  return result;
}


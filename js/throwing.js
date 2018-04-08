/***
 * Throwing Class
***/

var Throwing = function(receiver, handOff) {
  if(handOff) {
    this.id = 'handoff';
  } else {
    this.id = 'pass';
  }
  this.html = undefined;
  this.dice = new Dice(1);
  this.thrower = gGame.selectedPlayer;
  this.receiver = receiver;
  this.dest = receiver.square;
  this.start = gGame.actions.path == undefined ?
    gGame.selectedPlayer.square : gGame.actions.path.lastSquare();
  this.modifier = this.passModifier();
}

Throwing.prototype.rollDice = function() {
  var rbutton = $('#re-roll'), disableReroll = true, result, modified;
  if(this.id == 'handoff') {
    this.success = 'handoff';
    // No roll for handoff
    disableReroll = true;
  } else {
    if(this.reroll == undefined) {
      if(this.thrower.skills.indexOf('pass') == -1) {
        if(gGame.reroll > 0) {
          disableReroll = false;
          rbutton.text('Re-Roll (team)');
          this.reroll = 'team';
          rbutton.show();
        } else {
          rbutton.hide();
        }
      } else {
        disableReroll = false;
        this.reroll = 'skill';
        rbutton.text('Re-Roll (skill)');
        rbutton.show();
      }
    } else {
      if(this.reroll == 'team') {
        gGame.useReRoll(this.thrower.team);
      }
      rbutton.hide();
    }
    this.dice.rollD6(this.thrower + ': throw the ball');
    result = this.dice.result[0];
    modified = result + this.modifier;
    if(result == 1 || modified < 2) {
      $('#dices').css('background', 'orange');
      this.success = 'fumble';
    } else if(result == 6) {
      $('#dices').css('background', 'green');
      this.success = 'catch';
    } else if(modified + this.thrower.agility > 6) {
      $('#dices').css('background', 'green');
      this.success = 'catch';
    } else {
      $('#dices').css('background', 'orange');
      this.success = 'inaccurate';
    }
  }
  if(disableReroll) {
    this.execute();
  }
}

Throwing.prototype.execute = function() {
  this.dice.empty();
  this.thrower.throwingAction = true;
  this.thrower.dropBall();
  switch(this.success) {
    case 'handoff':
      gGame.actions.handoff = true;
      this.handoff();
      break;
    case 'catch':
      this.dice.comments(this.thrower + ': throw a perfect pass');
      gGame.actions.pass = true;
      this.handoff();
      break;
    case 'inaccurate':
      this.dice.comments(this.thrower + ': throw a inaccurate pass');
      gGame.actions.pass = true;
      this.inaccurate();
      break;
    case 'fumble':
      this.dice.comments(this.thrower + ': fumble the pass');
      gGame.actions.pass = true;
      this.fumble();
      break;
  }
}

Throwing.prototype.fumble = function() {
  // The ball goes away
  this.thrower.square.ballRebound();
  // Turnover
  gGame.actions.turnover();
  gGame.actions.next();
}

Throwing.prototype.inaccurate = function() {
  var d8 = new Dice(3), xscatter = 0, yscatter = 0, dest;
  comments('The thrower throws a scattered pass!');
  d8.rollD8('Scattered pass').result.forEach(function(d) {
    switch(d) {
      case 1:
        xscatter++;
        yscatter--;
        break;
      case 2:
        xscatter++;
        break;
      case 3:
        xscatter++;
        yscatter++;
        break;
      case 4:
        yscatter--;
        break;
      case 5:
        yscatter++;
        break;
      case 6:
        xscatter--;
        yscatter--;
        break;
      case 7:
        xscatter--;
        break;
      case 8:
        xscatter--;
        yscatter++;
        break;
    }
  });
  d8.comments('Scrattered pass');
  // Place the ball in the scattered square
  dest =  gGame.field.square(this.receiver.square.x + xscatter, this.receiver.square.y + yscatter);
  if(dest.hasPlayer()) {
    gGame.actions.append(new Catch(dest.player, 'other'));
  } else {
    dest.addBall();
  }
  gGame.actions.next();
}

Throwing.prototype.handoff = function() {
  if(this.thrower.ball) {
    this.thrower.dropBall();
  }
  // The receiver catches the ball
  gGame.actions.prepend(new Catch(this.receiver, 'pass'));
  gGame.actions.next();
}

Throwing.prototype.passModifier= function() {
  var xDelta = this.start.x - this.dest.x;
  var yDelta = this.start.y - this.dest.y;
  var distance = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
  if(distance < 4) {
    return 1;
  } else if(distance < 8) {
    return 0;
  } else if(distance < 12) {
    return -1;
  } else {
    return -2;
  }
}

Throwing.prototype.undo = function() {
  this.html.remove();
}

Throwing.prototype.toString = function() {
  var passString;
  if(this.id == 'handoff') {
    return 'Hand-off';
  } else {
    switch(this.modifier) {
      case 1:
        passString = 'quick';
        break;
      case 0:
        passString = 'short';
        break;
      case -1:
        passString = 'long';
        break;
      case -2:
        passString = 'bomb';
        break;
    }
    return 'Pass (' + passString + ')';
  }
}

Throwing.prototype.print = function() {
}

Throwing.prototype.button = function() {
  if(this.html == undefined) {
    this.html = $('<button class="bb-button">' + this + '</button>');
  }
  return this.html;
}


/***
 * Catch Class
***/

var Catch = function(my_player, catchType) {
  this.id = 'catch';
  this.player = my_player;
  // 'pick': pick up the ball, 'catch': catch a perfect pass, 'other': other situations
  this.type = catchType;
  this.html = undefined;
  this.dice = new Dice(1);
  this.success = undefined;
  this.reroll = undefined;
}

Catch.prototype.rollDice = function() {
  var rbutton = $('#re-roll'), modifier = 0, skill = undefined, result;
  var disableReroll = true;
  switch(this.type) {
    case 'pick':
      modifier = 1;
      skill = 'sure hands';
      break;
    case 'pass':
      modifier = 1;
      skill = 'catch';
      break;
    default:
      modifier = 0;
      skill = 'catch';
      break;
  }
  if(this.reroll == undefined) {
    if(this.player.skills.indexOf(skill) == -1) {
      if(gGame.reroll && gGame.currentTeam() == this.player.team) {
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
      gGame.useReRoll(this.player.team);
    }
    rbutton.hide();
  }
  if(this.type == 'pick') {
    // The player must pick up the ball otherwise there is a turnover
    gGame.actions.teamWithBall = this.player.team;
    this.dice.rollD6(this.player + ': pick up the ball');
  } else {
    this.dice.rollD6(this.player + ': catch the ball');
  }
  result = this.dice.result[0];
  if(result == 1) {
    $('#dices').css('background', 'orange');
    this.success = false;
  } else if(result == 6) {
    $('#dices').css('background', 'green');
    this.success = true;
  } else if(result + this.player.agility + modifier > 6) {
    $('#dices').css('background', 'green');
    this.success = true;
  } else {
    $('#dices').css('background', 'orange');
    this.success = false;
  }
  if(gGame.isKickOff || disableReroll) {
    this.execute();
  }
}

Catch.prototype.execute = function() {
  if(this.success) {
    if(this.type == 'pick') {
      this.dice.comments(this.player  + ': pick up the ball');
    } else {
      this.dice.comments(this.player  + ': catch the ball');
    }
    this.player.catchBall();
  } else {
    if(this.type == 'pick') {
      gGame.actions.turnover();
    }
    this.dice.comments(this.player  + ': drop the ball');
    this.player.square.ballRebound();
  }
  gGame.actions.next();
}

Catch.prototype.undo = function() {
  this.html.remove();
}

Catch.prototype.print = function() {
}

Catch.prototype.toString = function() {
  return 'Catch';
}

Catch.prototype.button = function() {
  if(this.html == undefined) {
    this.html = $('<button class="bb-button">' + this + '</button>');
  }
  return this.html;
}


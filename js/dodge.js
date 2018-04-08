/***
 * Dodge Class
***/

var Dodge = function(startSquare, targetSquare) {
  this.id = 'dodge';
  this.html = undefined;
  this.reroll = undefined;
  this.player = gGame.selectedPlayer;
  this.start = startSquare;
  this.target = targetSquare;
  this.dice = new Dice(1);
}

Dodge.prototype.rollDice = function() {
  var rbutton = $('#re-roll'), disableReroll = true;
  if(this.reroll == undefined) {
    if(this.player.skills.indexOf('dodge') == -1) {
      if(gGame.reroll) {
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
  this.dice.rollD6(this.player + ': dodge');
  if(this.dice.result[0] + this.player.agility + 1 > 6) {
    $('#dices').css('background', 'green');
    this.success = true;
  } else {
    $('#dices').css('background', 'orange');
    this.success = false;
  }
  if(disableReroll) {
    this.execute();
  }
}

Dodge.prototype.execute = function() {
  this.player.moveAction = true;
  this.player.mv--;
  if(this.success) {
    this.dice.comments(this.player + ': sneak away');
  } else {
    this.dice.comments(this.player + ': dodge failed');
    gGame.actions.down.push(this.player);
    gGame.actions.turnover();
  }
  this.player.square.removePlayer();
  this.target.unprint();
  this.target.addPlayer(this.player, '');
  gGame.actions.next();
}

Dodge.prototype.undo = function() {
  this.target.unprint();
  this.html.remove();
}

Dodge.prototype.toString = function() {
  return 'Dodge';
}

Dodge.prototype.button = function() {
  if(this.html == undefined) {
    this.html = $('<button class="bb-button">' + this + '</button>');
  }
  return this.html;
}

Dodge.prototype.print = function() {
  this.target.html.append('<img src="images/dodge.png" class="moving-square">');
}


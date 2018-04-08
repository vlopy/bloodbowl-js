/***
 * Sprint Class
***/

var Sprint = function(startSquare, targetSquare) {
  this.id = 'sprint';
  this.html = undefined;
  this.reroll = undefined;
  this.player = gGame.selectedPlayer;
  this.start = startSquare;
  this.target = targetSquare;
  this.dice = new Dice(1);
}

Sprint.prototype.rollDice = function() {
  var rbutton = $('#re-roll'), disableReroll = true;
  if(this.reroll == undefined) {
    if(this.player.skills.indexOf('sure feet') == -1) {
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
  this.dice.rollD6(this.player + ': sprint');
  if(this.dice.result[0] == 1) {
    $('#dices').css('background', 'orange');
    this.success = false;
  } else {
    $('#dices').css('background', 'green');
    this.success = true;
  }
  if(disableReroll) {
    this.execute();
  }
}

Sprint.prototype.execute = function() {
  this.dice.empty();
  this.player.moveAction = true;
  this.player.mv--;
  this.player.square.removePlayer();
  this.target.unprint();
  this.target.addPlayer(this.player, '');
  if(this.success) {
    this.dice.comments(this.player + ': go for it');
  } else {
    this.dice.comments(this.player + ': sprint failed');
    gGame.actions.down.push(this.player);
    gGame.actions.turnover();
  }
  gGame.actions.next();
}

Sprint.prototype.undo = function() {
  this.target.unprint();
  this.html.remove();
}

Sprint.prototype.toString = function() {
  return 'Sprint';
}

Sprint.prototype.button = function() {
  if(this.html == undefined) {
    this.html = $('<button class="bb-button">' + this + '</button>');
  }
  return this.html;
}

Sprint.prototype.print = function() {
  this.target.html.append('<img src="images/sprint.png" class="moving-square">');
}


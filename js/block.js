/***
 * Block Class
**/

var Block = function(attackerPlayer, defenderPlayer) {
  this.id = 'block';
  this.html = undefined;
  //this.down = [];
  this.attacker = attackerPlayer;
  this.defender = defenderPlayer;
  this.diceNb = attackerPlayer.fight(defenderPlayer);
  if(this.diceNb > 0) {
    this.dice = new Dice(this.diceNb);
  } else {
    this.dice = new Dice(this.diceNb * -1);
  }
}

Block.prototype.rollDice = function() {
  var rbutton = $('#re-roll'), disableReroll = true;
  if(this.reroll == undefined) {
    if(gGame.reroll) {
      disableReroll = false;
      rbutton.text('Re-Roll (team)');
      this.reroll = 'team';
      rbutton.show();
    } else {
      rbutton.hide();
    }
  } else {
    if(this.reroll == 'team') {
      gGame.useReRoll(this.attacker.team);
    }
    rbutton.hide();
  }
  if(this.diceNb < 0) {
    $('.dices-class').css('background', gGame.teams[this.defender.team].color);
  } else if(this.diceNb > 1) {
    $('.dices-class').css('background', gGame.teams[this.attacker.team].color);
  }
  this.dice.rollBlockDice(this.attacker + ' VS ' + this.defender);
  if(disableReroll) {
    this.execute();
  }
}

Block.prototype.removeOtherDices = function(keep) {
  var my_dice = this.dice, idx = 0;
  my_dice.result.forEach(function(r) {
    if(r != keep) {
      my_dice.result.splice(idx, 1);
    }
    idx++;
  });
  if(my_dice.result.length > 1) {
    // Same dices, keep only one dice
    my_dice.result = my_dice.result.slice(0, 1);
  }
  this.execute();
}

Block.prototype.execute = function() {
  var my_block = this;
  this.dice.comments(this.attacker + ' block: ');
  this.attacker.blockAction = true;
  // Add the dices in the GUI
  if(this.dice.result.length == 1) {
    switch(this.dice.result[0]) {
      case 'attacker-down':
        gGame.actions.block.attackerDown();
        break;
      case 'both-down':
        gGame.actions.block.bothDown();
        break;
      case 'pushed':
        gGame.actions.block.pushed();
        break;
      case 'defender-stumbles':
        gGame.actions.block.defenderStumbles();
        break;
      case 'defender-down':
        gGame.actions.block.defenderDown();
        break;
    }
  } else {
    this.dice.result.forEach(function(d) {
      switch(d) {
        case 'attacker-down':
          my_block.addLinks('attacker-down', 'gGame.actions.block.attackerDown()');
          break;
        case 'both-down':
          my_block.addLinks('both-down', 'gGame.actions.block.bothDown()');
          break;
        case 'pushed':
          my_block.addLinks('pushed', 'gGame.actions.block.pushed()');
          break;
        case 'defender-stumbles':
          my_block.addLinks('defender-stumbles', 'gGame.actions.block.defenderStumbles()');
          break;
        case 'defender-down':
          my_block.addLinks('defender-down', 'gGame.actions.block.defenderDown()');
          break;
      }
    });
  }
  // Hide buttons to force users to click on dice results
  this.dice.hideButtons();
}

Block.prototype.addLinks = function(dice, link) {
  $('#dices').append('<button class="bb-button" onclick="' + link + '">' + dice + '</button>');
}

Block.prototype.attackerDown = function() {
  $('.dices-class').css('background', '#EAEAEA');
  this.dice.empty();
  gGame.actions.turnover();
  gGame.actions.down.push(this.attacker);
  gGame.actions.downPlayers();
}

Block.prototype.defenderDown = function() {
  $('.dices-class').css('background', '#EAEAEA');
  this.dice.empty();
  gGame.actions.down.push(this.defender);
  this.attacker.push(this.defender);
}

Block.prototype.bothDown = function() {
  $('.dices-class').css('background', '#EAEAEA');
  this.dice.empty();
  if(this.attacker.skills.indexOf('block') == -1) {
    gGame.actions.turnover();
    gGame.actions.down.push(this.attacker);
  }
  if(this.defender.skills.indexOf('block') == -1) {
    gGame.actions.down.push(this.defender);
  }
  gGame.actions.downPlayers();
}

Block.prototype.defenderStumbles = function() {
  $('.dices-class').css('background', '#EAEAEA');
  this.dice.empty();
  if(this.defender.skills.indexOf('dodge') == -1) {
    // Defender does not have the dodge skill => defender is down
    gGame.actions.down.push(this.defender);
  }
  this.attacker.push(this.defender);
}

Block.prototype.pushed = function() {
  $('.dices-class').css('background', '#EAEAEA');
  this.dice.empty();
  this.attacker.push(this.defender);
}

Block.prototype.print = function() {
}

Block.prototype.undo = function() {
  this.html.remove();
}

Block.prototype.toString = function() {
  return 'Block (' + this.diceNb + ')';
}

Block.prototype.button = function() {
  if(this.html == undefined) {
    this.html = $('<button class="bb-button">' + this + '</button>');
  }
  return this.html;
}


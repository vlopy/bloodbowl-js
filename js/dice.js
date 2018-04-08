/***
 * Dice Class
***/

var Dice = function(diceNb) {
  this.diceNb = diceNb;
  this.result = undefined;
  this.blockDice = false;
}

Dice.prototype.rollD6 = function(msg) {
  this.rollDice(6, msg);
  return this;
}

Dice.prototype.rollD8 = function(msg) {
  this.rollDice(8, msg);
  return this;
}

Dice.prototype.rollBlockDice = function(msg) {
  this.blockDice = true;
  return this.rollD6(msg);
}

Dice.prototype.rollDice = function(base, msg) {
  this.showButtons();
  var i, images = '', numberResult, my_dice = this;
  this.result = [];
  for(i = 0; i < this.diceNb; i++) {
    this.result.push(Math.floor(Math.random() * base) + 1);
  }
  $('#dice-question').html(msg);
  $('#dices').empty();
  if(this.blockDice) {
    // Transform dice numbers to block results
    numberResult = this.result.slice();
    this.result = [];
    numberResult.forEach(function(r) {
      var buttonText;
      switch(r) {
        case 1:
          buttonText = 'attacker-down';
          break;
        case 2:
          buttonText = 'both-down';
          break;
        case 3:
        case 4:
          buttonText = 'pushed';
          break;
        case 5:
          buttonText = 'defender-stumbles';
          break;
        case 6:
          buttonText = 'defender-down';
          break;
      }
      my_dice.result.push(buttonText);
      $('#dices').append('<button class="bb-button" onclick="gGame.actions.block.removeOtherDices(\'' +
        buttonText + '\')">' + buttonText + '</button>');
    });
  } else {
    this.result.forEach(function(r) {
      $('#dices').append('<button class="bb-button">' + r + '</button>');
    });
  }
}

Dice.prototype.rollSum = function(msg) {
  var i, d, images = '';
  this.result = 0;
  for(i = 0; i < this.diceNb; i++) {
    d = Math.floor(Math.random() * 6) + 1;
    if(msg != undefined) {
      images += '<img src="images/dices/' + d +'.png">&nbsp;';
    }
    this.result += d;
  }
  if(msg != undefined) {
    comments(msg + '&nbsp;' + images);
  }
  return this;
}

Dice.prototype.showButtons = function() {
  $('#re-roll').show();
  $('#execute-actions').show();
}

Dice.prototype.hideButtons = function() {
  $('#re-roll').hide();
  $('#execute-actions').hide();
}

Dice.prototype.empty = function() {
  this.hideButtons();
  $('#dices').css('background', 'white');
  $('#dices').empty();
  $('#dice-question').html('');
}

Dice.prototype.comments = function(msg) {
  var images = '';
  this.empty();
  this.result.forEach(function(r) {
    images += '<img src="images/dices/' + r +'.png">&nbsp;';
  });
  comments(msg + '&nbsp;' + images);
}


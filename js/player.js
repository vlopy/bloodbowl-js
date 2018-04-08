/***
 * Player Class
***/

var Player = function(pTeam, pName, pNumber, pPosition, pMovement,
  pStrength, pAgility, pArmor, pSkills) {
  this.team = pTeam;
  this.number = pNumber;
  this.position = pPosition;
  this.name = pName;
  this.movement = pMovement;
  this.strength = pStrength;
  this.agility = pAgility;
  this.armor = pArmor;
  this.skills = pSkills;
  // Available movement for the turn, sprints excluded
  this.mv = 0;
  // Available sprints for every turn
  if(this.skills.indexOf('sprint') == -1) {
    this.sprint = 2;
  } else {
    this.sprint = 3;
  }
  // States: substitute, injured, knockout, standing, down, stunned
  this.state = 'substitute';
  // The placement of the player on the field
  this.square = undefined;
  // True => the player holds the ball
  this.ball = false;
  // True => the player has performed a move action
  this.moveAction = false;
  // True => the player has performed a handoff or pass action
  this.throwingAction = false;
  // True => the player has performed a block action
  this.blockAction = false;
  // Used when the player pushes another player
  this.pushedSquares = [];
  this.pushedPlayer = [];
}

Player.prototype.toString = function() {
  return this.name + '(' + this.team + '_' + this.number + ')';
}

Player.prototype.newTurn = function() {
  this.moveAction = false;
  this.throwingAction = false;
  this.blockAction = false;
  this.pushedSquares = [];
  this.pushedPlayer = [];
  // Set the movement available for the turn with sprints
  switch(this.state) {
    case 'standing':
      this.mv = this.movement + this.sprint;
      break;
    case 'down':
      this.square.html.addClass('down');
      if(this.movement > 3) {
        this.mv = this.movement - 3 + this.sprint;
      } else {
        this.mv = this.sprint;
      }
      break;
    case 'stunned':
      this.state = 'down';
      this.mv = 0;
      break;
  }
}

// Fight opponent players
// return the number of dices (negative results => the opponent chooses the dice)
Player.prototype.fight = function(opponent) {
  var modifiedStrength = this.strength + this.fightAssist(opponent);
  if(modifiedStrength == opponent.strength) {
    return 1;
  } else {
    if(modifiedStrength < opponent.strength) {
      if(modifiedStrength * 2 < opponent.strength) {
        return -3;
      } else {
        return -2;
      }
    } else {
      if(modifiedStrength > opponent.strength * 2) {
        return 3;
      } else {
        return 2;
      }
    }
  }
}

// Opponents around me except the opponent in args
Player.prototype.aroundMe = function(opponent) {
  var attacker = this, players = [];
  this.square.aroundSquares().forEach(function(s) {
    if(s.hasPlayer() && s.player.team != attacker.team && s.player != opponent
        && s.player.state == 'standing') {
      players.push(s.player);
    }
  });
  return players;
}

// Return the number of assists in the fight
Player.prototype.fightAssist = function(defender) {
  var attacker = this, opponentAssist = 0, teamAssist = 0;
  var blitzSquare = gGame.moving != undefined ? gGame.moving.lastSquare() : undefined;
  var oldSquare = undefined;
  if(blitzSquare != undefined) {
    blitzSquare = gGame.field.square(blitzSquare.x, blitzSquare.y);
    // fake the player is on the blitz square
    oldSquare = attacker.square;
    oldSquare.player = undefined;
    blitzSquare.player = attacker;
    attacker.square = blitzSquare;
  }
  attacker.aroundMe(defender).forEach(function(opponent) {
    if(opponent.aroundMe(attacker).length == 0) {
      opponentAssist++;
    }
  });
  defender.aroundMe(attacker).forEach(function(opponent) {
    if(opponent.aroundMe(defender).length == 0) {
      teamAssist++;
    }
  });
  if(oldSquare != undefined) {
    // Reverse the fake
    oldSquare.player = attacker;
    blitzSquare.player = undefined;
    attacker.square = oldSquare;
  }
  return teamAssist - opponentAssist;
}

// The player is down, return the player if he loses the ball
Player.prototype.down = function(armorModifier, injuryModifier) {
  var dice = new Dice(2);
  var result;
  if(this.state == 'standing') {
    result = dice.rollSum('Armor Roll: ').result + armorModifier
    // Modify the player state
    this.state = 'down';
    this.square.html.addClass('down');
    if(result > this.armor) {
      this.injuryRoll(injuryModifier);
    }
  }
}

Player.prototype.injuryRoll = function(modifier) {
  var removed = false, dice = new Dice(2);
  var result = dice.rollSum('Injury Roll: ').result + modifier;
  if(this.state == 'substitute') {
    removed = true;
  }
  if(result > 9) {
    comments(this + ' is injured!');
    this.state = 'injured';
    removed = true;
  } else if(dices > 7) {
    comments(this + ' is knockout!');
    this.state = 'knockout';
    removed = true;
  } else {
    comments(this + ' is stunned!');
    this.state = 'stunned';
    this.square.html.addClass('stunned');
  }
  if(removed) {
    this.remove();
  }
}

// The player follows an opponent
Player.prototype.follow = function(defender, oldDefenderSquare) {
  $('#dice-question').html(this + ' follows ' + defender + '?');
  $('#dices').empty();
  $('#dices').append('<button class="bb-button" onclick="followThePlayer(' +
    this.square.x + ', ' + this.square.y + ', ' +
    oldDefenderSquare.x + ',' + oldDefenderSquare.y + ')">Yes</button>');
  $('#dices').append('<button class="bb-button" onclick="cancelFollow()">No</button>');
}

function cancelFollow() {
  new Dice(1).empty();
  gGame.actions.downPlayers();
}
// Move the player to the opponent square
function followThePlayer(xAttacker, yAttacker, x, y) {
  var attackerSquare = gGame.field.square(xAttacker, yAttacker);
  var attacker = attackerSquare.player;
  var stateClass = attackerSquare.removePlayer();
  var futureSquare = gGame.field.square(x, y);
  if(futureSquare.ball) {
    gGame.actions.append(new Catch(attacker, 'other'));
  }
  new Dice(1).empty();
  futureSquare.addPlayer(attacker, stateClass);
  gGame.actions.downPlayers();
}

Player.prototype.computePushSquares = function(defender, checkFunction) {
  var xDefender = defender.square.x, yDefender = defender.square.y;
  var xAttacker = this.square.x, yAttacker = this.square.y;
  this.pushedSquares = [], outSquareNb = 0;
  // Compute target squares
  if(yDefender == yAttacker) {
    if(xDefender > xAttacker) {
      checkFunction(this, xDefender + 1, yDefender - 1);
      checkFunction(this, xDefender + 1, yDefender);
      checkFunction(this, xDefender + 1, yDefender + 1);
    }
    if(xDefender < xAttacker) {
      checkFunction(this, xDefender - 1, yDefender - 1);
      checkFunction(this, xDefender - 1, yDefender);
      checkFunction(this, xDefender - 1, yDefender + 1);
    }
  } else {
    // yDefender != yAttacker
    if(xDefender == xAttacker) {
      if(yDefender > yAttacker) {
        checkFunction(this, xDefender - 1, yDefender + 1);
        checkFunction(this, xDefender, yDefender + 1);
        checkFunction(this, xDefender + 1, yDefender + 1);
      }
      if(yDefender < yAttacker) {
        checkFunction(this, xDefender - 1, yDefender - 1);
        checkFunction(this, xDefender, yDefender - 1);
        checkFunction(this, xDefender + 1, yDefender - 1);
      }
    } else {
      // xDefender != xAttacker
      if(xDefender < xAttacker) {
        if(yDefender < yAttacker) {
          checkFunction(this, xDefender - 1, yDefender - 1);
          checkFunction(this, xDefender - 1, yDefender);
          checkFunction(this, xDefender, yDefender - 1);
        } else {
          // yDefender > yAttacker
          checkFunction(this, xDefender - 1, yDefender);
          checkFunction(this, xDefender - 1, yDefender + 1);
          checkFunction(this, xDefender, yDefender + 1);
        }
      } else {
        // xDefender > xAttacker
        if(yDefender < yAttacker) {
          checkFunction(this, xDefender, yDefender - 1);
          checkFunction(this, xDefender + 1, yDefender - 1);
          checkFunction(this, xDefender + 1, yDefender);
        } else {
          // yDefender > yAttacker
          checkFunction(this, xDefender + 1, yDefender);
          checkFunction(this, xDefender + 1, yDefender + 1);
          checkFunction(this, xDefender, yDefender + 1);
        }
      }
    }
  }
  // Remove outSquares if there are normal squares
  this.pushedSquares.forEach(function(ps) {
    if(ps.out) {
      outSquareNb++
    }
  });
  if(outSquareNb > 0) {
    if(outSquareNb == this.pushedSquares.length) {
      // Keep only one outSquare
      this.pushedSquares = this.pushedSquares.slice(0, 1);
    } else {
      this.pushedSquares = this.pushedSquares.filter(item => item.out == undefined);
    }
  }
}

function checkPushSquare(player, x, y) {
  var my_field = gGame.field, sq;
  if(x < my_field.xMax && x >= 0 && y < my_field.yMax && y >= 0) {
    // The square exist in the field
    sq = my_field.square(x, y);
    if(!sq.hasPlayer()) {
      player.pushedSquares.push(my_field.square(x, y));
    }
  } else {
    // Push the player outside the field
    player.pushedSquares.push(new OutSquare(player.x, player.y));
  }
}

function checkPushSquareWithPlayer(player, x, y) {
  var my_field = gGame.field, sq;
  if(x < my_field.xMax && x >= 0 && y < my_field.yMax && y >= 0) {
    sq = my_field.square(x, y);
    player.pushedSquares.push(my_field.square(x, y));
  }
}

// The player pushes an opponent
Player.prototype.push = function(defender) {
  var xDefender = defender.square.x, yDefender = defender.square.y;
  var xAttacker = this.square.x, yAttacker = this.square.y;
  var pushedIdx, lastSquare;
  this.computePushSquares(defender, checkPushSquare);
  pushedIdx = 0;
  if(this.pushedSquares.length == 0) {
    this.computePushSquares(defender, checkPushSquareWithPlayer);
  }
  if(this.pushedSquares.length == 1) {
    pushedSquare(xAttacker, yAttacker, xDefender, yDefender, 0);
  } else {
    this.pushedSquares.forEach(function(s) {
      if(s.hasPlayer()) {
        s.html.append('<div class="pushed-square w-player" onclick="pushedSquare(' + 
          xAttacker + ', ' + yAttacker + ', ' + xDefender + ', ' + yDefender + ', ' + pushedIdx 
          + '); event.stopPropagation();"></div>');
      } else {
        s.html.append('<div class="pushed-square" onclick="pushedSquare(' + 
          xAttacker + ', ' + yAttacker + ', ' + xDefender + ', ' + yDefender + ', ' + pushedIdx 
          + '); event.stopPropagation();"></div>');
      }
      pushedIdx++;
    });
  }
}

// Move the player in (xDefender, yDefender) to the square from the pushedIdx index
function pushedSquare(xAttacker, yAttacker, xDefender, yDefender, pushedIdx) {
  var field = gGame.field;
  var attacker = field.square(xAttacker, yAttacker).player;
  var defender = field.square(xDefender, yDefender).player;
  var s = attacker.pushedSquares[pushedIdx];
  // Remember information for multiple pushes
  defender.pushedPlayer = [];
  defender.pushedPlayer.push(attacker);
  defender.pushedPlayer.push(s);
  // Remove the pushed squares
  attacker.pushedSquares.forEach(function(ps) {
    ps.html.children('.pushed-square').remove();
  });
  if(s.hasPlayer()) {
    defender.push(s.player);
  } else {
    movePushedPlayers(defender);
  }
}

// Move the pushed players in the 
function movePushedPlayers(defender) {
  var lastSquare = defender.square;
  var stateClass = lastSquare.removePlayer();
  var pushedSquare = defender.pushedPlayer[1];
  if(pushedSquare.ball) {
    if(defender.state == 'standing' && gGame.actions.down.indexOf(defender) == -1) {
      gGame.actions.append(new Catch(defender, 'other'));
    } else {
      pushedSquare.ballRebound();
    }
  }
  pushedSquare.addPlayer(defender, stateClass);
  // Is the attacker (who pushes me) has been pushed ?
  if(defender.pushedPlayer[0].pushedPlayer.length > 0) {
    // Move my attacker
    movePushedPlayers(defender.pushedPlayer[0]);
  } else {
    // Follow the defender
    defender.pushedPlayer[0].follow(defender, lastSquare);
  }
}

Player.prototype.remove = function() {
  var dice, result;
  if(this == gGame.selectedPlayer) {
    this.square.unselectPlayer();
  }
  this.square.removePlayer();
  // Check the player state
  switch(this.state) {
    case 'down':
    case 'standing':
    case 'stunned':
      this.state = 'substitute';
      comments('The player is a substitute');
      break;
    case 'knockout':
      comments('The player needs to rest');
      break;
    case 'injured':
      dice = new Dice(1);
      result = dice.rollD6('Injury Roll');
      if(result < 4) {
        comments('Nothing bad, just a severe commotion');
      } else {
        comments('The player misses the next game');
        if(result == 6) {
          comments('Sincere condolences, the player is dead');
        } else {
          result = dice.rollD8('Traumatism Roll');
          switch(result) {
            case 1:
            case 2:
              dice.comments('The player suffers from trauma');
              break;
            case 3:
            case 4:
              dice.comments('The player loses 1 point of movement');
              break;
            case 5:
            case 6:
              dice.comments('The player loses 1 point of armor');
              break;
            case 7:
              dice.comments('The player loses 1 point of agility');
              break;
            case 8:
              dice.comments('The player loses 1 point of strength');
              break;
          }
        }
      }
      break;
  }
}

Player.prototype.catchBall = function() {
  gGame.teamWithBall = this.team;
  this.ball = true;
  this.square.removeBall();
  this.square.html.find('.player-position')
    .attr('src', 'images/positions/' + this.position + '-ball.png'); 
  this.square.isTouchdown();
}

Player.prototype.dropBall = function() {
  this.ball = false;
  this.square.html.find('.player-position')
    .attr('src', 'images/positions/' + this.position + '.png'); 
  gGame.teamWithBall = undefined;
}

Player.prototype.stats = function() {
  return '<table class="player-stats"><caption>' + this.name + ' (' + this.team + ')' +
    '</caption>' + 
    '<tbody>' +
    '<tr><td>Race</td><td>' + gGame.teams[this.team].race + '</td>' +
    '<tr><td>Position</td><td>' + this.position + '</td>' +
    '<tr><td>Movement</td><td>' + this.movement + '</td>' +
    '<tr><td>Strength</td><td>' + this.strength + '</td>' +
    '<tr><td>Agility</td><td>' + this.agility + '</td>' +
    '<tr><td>Armor</td><td>' + this.armor + '</td>' +
    '<tr><td>Skills</td><td>' + this.skills + '</td>' +
    '</tbody></table>';
}


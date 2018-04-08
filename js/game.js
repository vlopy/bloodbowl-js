/***
 * Game Class
***/

var Game = function(homeTeam, visitorTeam) {
  // The field of the game (array of squares)
  this.field = new Field(26, 15, homeTeam, visitorTeam);
  // The team reroll for this turn
  this.reroll = true;
  // True => throwing the ball is allowed
  this.pass = true;
  // True => the handoff is available
  this.handoff = true;
  // The players who are available to do something during the team turn
  this.playerTurns = [];
  // The Fighting action
  this.fighting = undefined;
  // The Throwing action
  this.throwing = undefined;
  // The selected player
  this.selectedPlayer = undefined;
  // The team that starts the macth
  this.firstTeamToPlay = undefined;
  // The team with the ball when players hold the ball
  this.teamWithBall = undefined;
  // The action stack
  this.actions = new ActionStack();
  // The teams
  this.teams = {};
  // The home team use the left part of the field
  this.teams[homeTeam] = { 'name': homeTeam, 'players': [], 'score': 0 };
  // The visitor team use the right part of the field
  this.teams[visitorTeam] = { 'name': visitorTeam, 'players': [], 'score': 0 };
  // The number of turn
  this.turnNb = 1;
  // Kick off phase, do not try to append catch actions on ball rebounds
  this.isKickOff = false;
  // The half time turn number
  this.halfTimeNb = 4;
}

Game.prototype.addBall = function() {
  var d6 = new Dice(1), d8 = new Dice(1);
  var ballSquare, xDis, yDis, squareDis, catchAction, result;
  if(this._currentTeam == undefined) {
    if(this.firstTeamToPlay == Object.keys(this.teams)[0]) {
      ballSquare = this.field.square(6, 7);
    } else {
      ballSquare = this.field.square(19, 7);
    }
  } else {
    if(this._currentTeam == Object.keys(this.teams)[0]) {
      ballSquare = this.field.square(6, 7);
    } else {
      ballSquare = this.field.square(19, 7);
    }
  }
  result = d8.rollD8('Dispersion roll: ').result[0];
  switch(result) {
    case 1:
      xDis = -1;
      yDis = -1;
      break;
    case 2:
      xDis = 0;
      yDis = -1;
      break;
    case 3:
      xDis = 1;
      yDis = -1;
      break;
    case 4:
      xDis = -1;
      yDis = 0;
      break;
    case 5:
      xDis = 1;
      yDis = 0;
      break;
    case 6:
      xDis = -1;
      yDis = 1;
      break;
    case 7:
      xDis = 0;
      yDis = 1;
      break;
    case 8:
      xDis = 1;
      yDis = 1;
      break;
  }
  d8.comments('Dispersion roll: ');
  d6.rollD6('Power roll: ');
  d6.comments('Power roll: ');
  squareDis = this.field.square(ballSquare.x + d6.result[0] * xDis, ballSquare.y + d6.result[0] * yDis);
  if(squareDis.hasPlayer()) {
    catchAction = new Catch(squareDis.player, 'other');
    catchAction.rollDice();
  } else {
    squareDis.addBall();
  }
}

Game.prototype.addStandingPlayer = function(my_player, x, y) {
  if(my_player.team == Object.keys(this.teams)[0]) {
    // Place players of the home team (using the left part of the field)
    this.field.square(x, y).addPlayer(my_player, '');
  } else {
    // Place players of the visitor team (using the right part of the field)
    this.field.square(this.field.xMax - 1 - x, y).addPlayer(my_player, '');
  }
  my_player.state = 'standing';
}

Game.prototype.currentTeam = function() {
  return this._currentTeam;
}

Game.prototype.opponentTeam = function() {
  var names = Object.keys(this.teams);
  if(this._currentTeam == names[0]) {
    return names[1];
  } else {
    return names[0];
  }
}

Game.prototype.useReRoll = function(teamName) {
  var my_team = this.teams[teamName];
  my_team.reroll--;
  this.reroll = false;
  my_team.html.html(my_team.reroll);
}

Game.prototype.kickOff = function(callback) {
  var d6 = new Dice(4);
  this.isKickOff = true;
  // Choose the team that starts the match
  if(this.firstTeamToPlay == undefined) {
    d6.rollD6('Select the first team to play: ');
    d6.comments('Select the first team to play: ');
    if(d6.result[0] + d6.result[1] < d6.result[2] + d6.result[3]) {
      this.firstTeamToPlay = Object.keys(this.teams)[1];
      this._currentTeam = undefined;
    } else {
      this.firstTeamToPlay = Object.keys(this.teams)[0];
      this._currentTeam = undefined;
    }
  }
  // Load players of every team
  $.each(this.teams, function(teamName, desc) {
    $.getJSON('config/' + teamName + '/roster.json', function(data1) {
      var placementJSON;
      if(teamName == Object.keys(gGame.teams)[0]) {
        $('#home-score').html(desc.score);
        $('#home-score').css('background', data1.color);
        desc.html = $('#home-reroll');
      } else {
        $('#visitor-score').html(desc.score);
        $('#visitor-score').css('background', data1.color);
        desc.html = $('#visitor-reroll');
      }
      desc.html.css('background', data1.color);
      desc.html.html(data1.reroll);
      desc.reroll = data1.reroll;
      desc.race = data1.race;
      desc.color = data1.color;
      if(gGame._currentTeam == undefined) {
        gGame._currentTeam = gGame.firstTeamToPlay;
        if(teamName == gGame.firstTeamToPlay) {
          placementJSON = 'attack.json';
        } else {
          placementJSON = 'defence.json';
        }
      } else {
        if(teamName == gGame._currentTeam) {
          placementJSON = 'attack.json';
        } else {
          placementJSON = 'defence.json';
        }
      }
      $.getJSON('config/' + teamName + '/' + placementJSON, function(data2) {
        if(desc.players.length == 0) {
          // Beginning of the match, create players
          data1.players.forEach(function(p) {
            var position, my_player = new Player(teamName, p.name, p.number, p.position,
              p.movement, p.strength, p.agility, p.armor, p.skills);
            desc.players.push(my_player);
            // Place the players
            position = data2[p.number];
            if(position != undefined) {
              gGame.addStandingPlayer(my_player, position.x, position.y);
            }
          });
        } else {
          // Use the existing players
          desc.players.forEach(function(p) {
            if(p.state == 'standing' || p.state == 'down' || p.state == 'stunned') {
              //TODO: KO
              p.state = 'substitute';
            }
            // Place the players
            position = data2[p.number];
            if(position != undefined) {
              gGame.addStandingPlayer(p, position.x, position.y);
            }
          });
        }
        // After parsing the last team position file
        if(teamName == Object.keys(gGame.teams)[1]) {
          callback();
        }
      });
    });
  });
}

Game.prototype.newRound = function() {
  // Clean the turn variables
  if(this.selectedPlayer != undefined) {
    this.selectedPlayer.square.unselectPlayer();
  }
  this.actions.reset();
  // Delete the dice buttons
  new Dice(1).hideButtons();
  // Prepare the teams to play
  if(this._currentTeam != this.firstTeamToPlay && this.turnNb == 2  * this.halfTimeNb) {
    comments('<h3>End of the match!</h3>');
    this.field.reset();
  } else if(this._currentTeam != this.firstTeamToPlay && this.turnNb == this.halfTimeNb) {
    comments('<h3>Half Time!</h3>');
    // Choose the team that receives the ball
    this.firstTeamToPlay = this._currentTeam;
    this._currentTeam = undefined;
    // Reset all squares and players
    this.field.reset();
    this.turnNb++;
    $('#turn-counter').html(this.turnNb);
    // Play the kick-off
    this.kickOff(function() {
      // Add the ball
      gGame.addBall();
      // End of the kick off phase
      gGame.isKickOff = false;
      // Start the new team turn
      gGame.prepareTeams();
    });
  } else {
    // Remove the end turn background
    this.teams[this._currentTeam].players.forEach(function(p) {
      if(p.state == 'standing' && p.square != undefined) {
        p.square.html.removeClass('completedTurn');
      }
    });
    // Select the team
    this._currentTeam = this.opponentTeam();
    // Update the team turn number
    if(this._currentTeam == this.firstTeamToPlay) {
      this.turnNb++;
      $('#turn-counter').html(this.turnNb);
    }
    this.prepareTeams();
  }
}

Game.prototype.prepareTeams = function() {
  var my_game = this;
  // Enable the team reroll
  if(this.teams[this._currentTeam].reroll > 0) {
    this.reroll = true;
  } else {
    this.reroll = false;
  }
  // Update the player list
  this.playerTurns = [];
  this.teams[this._currentTeam].players.forEach(function(p) {
    if(p.state == 'standing' || p.state == 'down' || p.state == 'stunned') {
      if(p.state == 'down') {
        p.square.html.attr('class', 'square down');
      }
      if(p.state != 'stunned') {
        my_game.playerTurns.push(p);
      }
      p.newTurn();
    }
  });
  comments('<b>' + this._currentTeam + ' plays with ' + this.playerTurns.length + ' players</b>');
  $('#turn-counter').css('background', this.teams[this._currentTeam].color);
}

Game.prototype.hasTurn = function(player) {
  return this.playerTurns.indexOf(player) > -1;
}

Game.prototype.endTurn = function() {
  var sPlayer = this.selectedPlayer;
  sPlayer.square.unselectPlayer();
  sPlayer.square.html.addClass('completedTurn');
  this.playerTurns = this.playerTurns.filter(p => p != sPlayer);
  if(this.playerTurns.length == 0) {
    this.newRound();
  } else {
    // Delete the dice buttons
    new Dice(1).hideButtons();
  }
}

Game.prototype.selectAttackTeam = function() {
  var temp = this.attackTeam, d6 = new Dice(4);
  if(this.attackTeam == undefined) {
  } else {
    this.attackTeam = this.defenceTeam;
    this.defenceTeam = temp;
  }
}


var OutSquare = function(xSquare, ySquare) {
  this.out = true;
  this.field = gGame.field;
  this.x = xSquare;
  this.y = ySquare;
  // Execute CSS operations on a div not included in the HTML page
  this.html = $('<div>');
  this.player = undefined;
}

OutSquare.prototype.hasPlayer = function() {
  return false;
}

OutSquare.prototype.addPlayer = function(outPlayer) {
  var withBall = outPlayer.ball, pSquare = outPlayer.square;
  outPlayer.ball = false;
  this.player = outPlayer;
  this.player.square = this;
  comments(this.player + ' is pushed to the crowd');
  this.player.state = 'substitute';
  this.player.injuryRoll(0);
  if(withBall) {
    this.addBall();
  }
}

OutSquare.prototype.removePlayer = function() {
  this.player.square = undefined;
}

OutSquare.prototype.addBall = function() {
  var d6 = new Dice(3), xCrowd, yCrowd, power = 0;
  d6.rollD6('The crowd throws the ball in the field: ');
  d6.comments('The crowd throws the ball in the field: ');
  if(this.y == 0) {
    yCrowd = 1;
  } else {
    yCrowd = -1;
  }
  switch(d6.result[0]) {
    case 1:
    case 2:
      if(this.y == 0) {
        xCrowd = 1;
      } else {
        xCrowd = -1;
      }
      break;
    case 3:
    case 4:
      xCrowd = 0;
      break;
    case 5:
    case 6:
      if(this.y == 0) {
        xCrowd = -1;
      } else {
        xCrowd = 1;
      }
      break;
  }
  // Remove the first square
  power = d6.result[1] + d6.result[2] - 1;
  this.field.square(this.x + xCrowd * power, this.y + yCrowd * power).addBall();
}


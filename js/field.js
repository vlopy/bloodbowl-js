/***
 * Field Class
***/

var Field = function(x_max, y_max, homeTeam, visitorTeam) {
  var i, j, square, field = $('#field');
  battlefield = [];
  this.xMax = x_max;
  this.yMax = y_max;
  for(j = 0; j < this.yMax; j++) {
    for(i = 0; i < this.xMax; i++) {
      if(j == 0) {
        // Create a new line
        battlefield[i] = [];
      }
      // Create the square (check if the square is in the end zone)
      if(i == this.xMax - 1) {
        square = new Square(i, j, homeTeam.name);
      } else if(i == 0) {
        square = new Square(i, j, visitorTeam.name);
      } else {
        square = new Square(i, j, undefined);
      }
      // End Zones
      if(i == 0) {
        square.html.css('border-left', '1px solid white');
        square.html.css('border-right', '1px dotted white');
      }
      if(i == 25) {
        square.html.css('border-right', '1px solid white');
        square.html.css('border-left', '1px dotted white');
      }
      // Middle of the field
      if(i == 12) {
        square.html.css('border-right', '1px solid white');
      }
      // Left of the field
      if(j == 0) {
        square.html.css('border-top', '1px solid white');
      }
      // Right of the field
      if(j == 14) {
        square.html.css('border-bottom', '1px solid white');
      }
      // Side of the field
      if(j == 10) {
        square.html.css('border-bottom', '1px dotted white');
      }
      if(j == 3) {
        square.html.css('border-bottom', '1px dotted white');
      }
      battlefield[i][j] = square;
      field.append(square.html);
    }
  }
}

Field.prototype.square = function(x, y) {
  return battlefield[x][y];
}

Field.prototype.showCoords = function() {
  var i, j;
  for(i = 0; i < this.xMax; i++) {
    for(j = 0; j < this.yMax; j++) {
      battlefield[i][j].showCoords();
    }
  }
}

Field.prototype.reset = function() {
  var i, j, sq;
  for(j = 0; j < this.yMax; j++) {
    for(i = 0; i < this.xMax; i++) {
      sq = this.square(i, j);
      if(sq.hasPlayer()) {
        sq.player.ball = false;
        sq.removePlayer();
      }
      sq.removeBall();
    }
  }
}


/***
 * Path Class
***/

var Path = function() {
  this.field = gGame.field;
  this.sPlayer = gGame.selectedPlayer;
  this.start = this.sPlayer.square;
  // Add 2 sprints to the player movement
  this.playerMv = this.sPlayer.mv;
  this.visited = [];
  this.solution = undefined;
  // The move action fails
  this.failed = false;
}

Path.prototype.compute = function(target) {
  var sol;
  if(this.playerMv >= distance(this.start, target)) {
    this.solution = new Solution(target);
    return this.goForward();
  } else {
    return false;
  }
}

Path.prototype.newTarget = function(target) {
  if(this.playerMv >= distance(this.start, target)) {
    this.solution.xtarget = target.x;
    this.solution.ytarget = target.y;
    return this.goForward();
  } else {
    return false;
  }
}

Path.prototype.goForward= function() {
  var found = undefined, my_path = this, exploring = [];
  exploring.push(this.solution);
  // Compute the path that leads to the target square
  while(exploring.length > 0 && found == undefined) {
    exploring.forEach(function(s) {
      if(!my_path.nextSquare(s)) {
        s.corrupted = true;
      }
      if(s.check()) {
        found = s;
      }
    });
    // Remove corrupted solutions
    exploring = exploring.filter(item => item.corrupted != true);
  }
  if(found == undefined) {
    this.solution = undefined;
    return false;
  } else {
    this.solution = found;
    return true;
  }
}

Path.prototype.isVisited = function(sq) {
  return this.visited.indexOf(sq) != -1;
}

Path.prototype.lastSquare = function() {
  if(this.solution.size() > 0) {
    return this.solution.lastSquare();
  } else {
    return undefined;
  }
}

Path.prototype.nextSquare = function(solution) {
  var sq;
  if(solution.size() == this.playerMv) {
    return false;
  }
  if(solution.size() == 0) {
    lastSquare = this.start;
  } else {
    lastSquare = solution.lastSquare();
  }
  if(lastSquare.x < solution.xtarget) {
    if(lastSquare.y < solution.ytarget) {
      sq = this.field.square(lastSquare.x + 1, lastSquare.y + 1);
    } else if(lastSquare.y > solution.ytarget) {
      sq = this.field.square(lastSquare.x + 1, lastSquare.y - 1);
    } else {
      sq = this.field.square(lastSquare.x + 1, lastSquare.y);
    }
    if(this.checkSquare(sq)) {
      solution.addSquare(sq);
      this.visited.push(sq);
      return true;
    }
  }
  if(lastSquare.x > solution.xtarget) {
    if(lastSquare.y < solution.ytarget) {
      sq = this.field.square(lastSquare.x - 1, lastSquare.y + 1);
    } else if(lastSquare.y > solution.ytarget) {
      sq = this.field.square(lastSquare.x - 1, lastSquare.y - 1);
    } else {
      sq = this.field.square(lastSquare.x - 1, lastSquare.y);
    }
    if(this.checkSquare(sq)) {
      solution.addSquare(sq);
      this.visited.push(sq);
      return true;
    }
  }
  if(lastSquare.y < solution.ytarget) {
    sq = this.field.square(lastSquare.x, lastSquare.y + 1);
    if(this.checkSquare(sq)) {
      solution.addSquare(sq);
      this.visited.push(sq);
      return true;
    }
  }
  if(lastSquare.y > solution.ytarget) {
    sq = this.field.square(lastSquare.x, lastSquare.y - 1);
    if(this.checkSquare(sq)) {
      solution.addSquare(sq);
      this.visited.push(sq);
      return true;
    }
  }
  return false;
}

Path.prototype.checkSquare = function(square) {
  return square != undefined && square.x < this.field.xMax && square.y < this.field.yMax 
    && !this.isVisited(square) && !square.hasPlayer();
}

Path.prototype.squares = function() {
  if(this.solution != undefined) {
    return this.solution.squares;
  } else {
    return [];
  }
}

Path.prototype.isEmpty = function() {
  return this.solution.size() > 0;
}

/***
 * Solution Class
***/
var Solution = function(square) {
  this.field = gGame.field;
  this.squares = [];
  this.xtarget = square.x;
  this.ytarget = square.y;
  this.corrupted = false;
}

Solution.prototype.addSquare = function(sq) {
  this.squares.push(sq);
}

Solution.prototype.lastSquare = function() {
  return this.squares[this.squares.length - 1];
}

Solution.prototype.check = function() {
  var lastSquare = this.lastSquare();
  return lastSquare.x == this.xtarget && lastSquare.y == this.ytarget;
}

Solution.prototype.size = function() {
  return this.squares.length;
}


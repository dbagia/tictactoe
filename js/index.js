var choices = ["O", "X"];
//*****************************************************************************
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
//*****************************************************************************
$("#UserChoiceContainer").modal('show');

var Player = function(moves, choice) {

  this.moves = moves;
  this.choice = choice;

}
var player = {

  moves:[],

  choice:''


}

var game = {

  size:0,

  arr:[],

  user: new Player([], 2), //Object.create(player),

  comp:  new Player([], 1), //Object.create(player),

  init:function(boardSize){
      this.size = boardSize;
      
      this.arr = [];
      //the array to be pushed into each element of cellMatrix
      var interimArray = new Array();

      //push the intermimArray into cellMatrix size times
      for (var i = 0; i < this.size; i++) {

        interimArray = new Array();
         //pad zeroes into the interim array
        for (var j = 0; j < this.size; j++) {

          interimArray.push(i * +this.size + j);

        }

        this.arr.push(interimArray);

      } //for

  },/**/

  getChoice: function(userType) {

    return this[userType].choice;

  }

};

var board = {

  id: "game-container",

  cellTemplateId: "cell_template",

  boardSize:3,

  boardDimension: 480,

  rowHeight: 0,

  boxWidth: 0,

  boxHeight: 0,

  cellTop:0,

  gameStatusHolder:null,
 
  choiceContainer:null,

  init:function(){   

    this.gameStatusHolder = document.querySelector("#game-status");
    
    this.choiceContainer = $("#choice-container");
    
    this.rowHeight = this.boxWidth = this.boxHeight = this.boardDimension/this.boardSize;

    this.cellTop = this.boxHeight/2 - 16;

    game.init(this.boardSize);

    this.render(game.arr);

    this.addEventHandlers();
      
    }, //init

    render: function(boardMatrix) {

      var dataObject = this;
      dataObject.arr = boardMatrix;

      //The below code should be moved to gameBoard Object
      var ctx = new Stamp.Context();
      var expanded = Stamp.expand(ctx.import(this.cellTemplateId), dataObject);
      Stamp.appendChildren(document.getElementById(this.id), expanded);

    }, //render

    addEventHandlers: function() {

        $('#'+this.id).on("click", ".box", this.boardClicked);

        $('#btn-restart').on("click",null, this.reset.bind(this));
      
        this.choiceContainer.on("click","button",function(e){
          
          var button = e.target;
          var buttonId = button.id;
          
          if(buttonId === "btn-x") {
            //user has chosen x
            choices = ["O", "X"];
            
          } else if(buttonId === "btn-o") {
            
            choices = ["X", "O"];
            
          }
          
          $("#UserChoiceContainer").modal('hide');
          
        });
    
    },

    boardClicked: function(e) {

      //TODO: don't allow user to click the same cell again

      if(sState.hasOwnProperty("winner")) {

        if(sState.winner !== 0) {

          return;

        }
      }

      var position = +this.id;
      //this.firstChild.innerHTML = choices[game.getChoice("user") - 1]; //this.id;
      if(sState.board[position] === 0) {

        sState.board[position] = players.min;
        updateGameBoard(sState);
        sState.turn = players.min;
        computersTurn();

      }
      
      //sState.turn = players.max;
    
    },

    reset: function() {
      var resetState = {};
      resetState.board = [0,0,0,0,0,0,0,0,0];
      resetState.turn = players.min;

      sState = resetState;

      this.gameStatusHolder.innerHTML = '';
      updateGameBoard(resetState);
      
    }

};

board.init();

var sState = {
	board:[0,0,0,0,0,0,0,0,0],//[0,1,2,1,0,2,2,0,1],
	turn:0,
	winner:0,
	scores:[]
};

var players = {
	max: 1, //O
	min: 2 //X
};



function cloneObject(o) {

	var newO = {};

	var keys = Object.keys(o);
	var key = "";

	for(var i = 0; i < keys.length; i++ ) {

		key = keys[i];

		if(Array.isArray(o[key])) {

			newO[key] = clone(o[key]);

		} else {

			newO[key] = o[key];

		}

	}

	return newO;

}

//generate all possible Next States of the current state
function generateNextStates(vState) {
	var nextStates = [];
	var newState = null;
	var emptyPositions = getEmptyPositions(vState);
	var nextTurn = vState.turn === players.max? players.min : players.max;

	emptyPositions.map(function(pos){

		newState = cloneObject(vState);

		newState.turn = nextTurn;

		takeMove(newState, pos);

		nextStates.push(newState);

	});

	return nextStates;
}

function calculateBestMoveFor(vState) {

	var nextStates  = null;
	var scores = [];
	var currentTurn = vState.turn;
	var currentBoard = vState.board;
	var currentScore = vState.turn === players.max? -1000:1000;

	if(hasWon(players.max, vState.board) || hasWon(players.min, vState.board) || isTerminal(vState)) {

		//game ends calculate the score
		if(hasWon(players.max, vState.board)) {

			currentScore = 10;
		} else if(hasWon(players.min, vState.board)) {

			currentScore = -10;
		} else if(isTerminal(vState)) {

			currentScore = 0;
		}

		return {score: currentScore, state: vState };

	} else {

		nextStates = generateNextStates(vState);

		scores = nextStates.map(function(nextState){

			return calculateBestMoveFor(nextState);

		});

		scores.sort(function(a,b) {

			return b.score - a.score;

		});

		

		if(vState.turn === players.max) {

			//maximise
			return {score: scores[scores.length-1].score, state: vState }; //scores[scores.length-1].state };

		} else {

			return {score: scores[0].score, state: vState } //scores[0].state };
		}


	}

}

function computersTurn() {

	var nextStates  = null;
	var targetState = null;
	var actionTaken = false;

	nextStates = generateNextStates(sState);

	//console.log(nextStates);

	var minimaxStates = nextStates.map(function(nextState){

		 return calculateBestMoveFor(nextState);

	});

	minimaxStates.sort(function(a,b){

		if(b.score > a.score) {
			return 1;
		} 
		if(b.score < a.score) {

			return -1;
		}

		return 0;
		//b.score - a.score;
	});

	

	if(Array.isArray(minimaxStates)) {

		if(minimaxStates.length > 0) {

			//out of the chosen next states with highest scores, we check if any of those is a terminal winning state for comp. Coz that state will have 
			//the highest priority
			for( var i = 0; i < minimaxStates.length; i++ ) {

				if(hasWon(players.max, minimaxStates[i].state.board)) {

					advanceToNextState(sState, minimaxStates[i].state);

					actionTaken = true;
					break;
				}

			}
			
			if(!actionTaken) {

				targetState = minimaxStates[0].state;
				advanceToNextState(sState, targetState);

			}


		}
	}

}


function advanceToNextState(currentState, targetState){

	var newBoard = clone(targetState.board);

	currentState.board = newBoard;
	currentState.turn = targetState.turn === players.max? players.min : players.max;

	updateGameBoard(currentState);
}

function updateGameBoard(newState){

	var gameStatus = 0;
	var boardCell = null;

	for(var i = 0; i < newState.board.length; i++) {

		boardCell = document.getElementById(''+i).firstChild;

		if(newState.board[i] !== 0) { 

			boardCell.innerHTML = choices[newState.board[i] - 1];//newState.board[i];
		
		} else {

			boardCell.innerHTML = '';
		}	

	}

	gameStatus = hasGameEnded(newState);

	if(gameStatus === players.max) {		
		//max won
		board.gameStatusHolder.innerHTML = "Sorry, you lost!";

	} else if(gameStatus === players.min) {
		//min won
		board.gameStatusHolder.innerHTML = "Congratulations!! You won!";		

	} else if(gameStatus === 0) {

		board.gameStatusHolder.innerHTML = "It's a draw";		
	}

}

function takeMove(mState, i) {

	mState.board[i] = mState.turn;

}

function clone(board) {

	return board.slice(0);

}


function hasGameEnded(vState) {

	if(isTerminal(vState)) {

		return 0; //game draw hua

	} else if(hasWon(players.max, vState.board)) {

		vState.winner = players.max;
		return players.max;

	} else if(hasWon(players.min, vState.board)) {

		vState.winner = players.min;
		return players.min;
	} else {

		vState.winner = 0;
		return -1;
	}

	
}

function isTerminal(state) {

	for(var i = 0; i < state.board.length; i++) {

		if(state.board[i] === 0) {
			return false;
		}
	}
	return true;
}


function hasWon(player, board) {

	 if (
        (board[0] == player && board[1] == player && board[2] == player) ||
        (board[3] == player && board[4] == player && board[5] == player) ||
        (board[6] == player && board[7] == player && board[8] == player) ||
        (board[0] == player && board[3] == player && board[6] == player) ||
        (board[1] == player && board[4] == player && board[7] == player) ||
        (board[2] == player && board[5] == player && board[8] == player) ||
        (board[0] == player && board[4] == player && board[8] == player) ||
        (board[2] == player && board[4] == player && board[6] == player)
        ) {
        return true;
    } else {
        return false;
    }

}


function getEmptyPositions(mState) {

	var emptyPositions = [];

	for( var i = 0; i < mState.board.length; i++ ) {

		if(mState.board[i] === 0) {
			emptyPositions.push(i);
		}

	}

	return emptyPositions;

}

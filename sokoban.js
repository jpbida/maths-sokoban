var sokoban = { },
Constants = function(initialGridSize, initialCanvasWidth){
	this.gridSize = initialGridSize;
	this.blockWidth = initialCanvasWidth/initialGridSize,
	this.directions = {
		UP: 0,
		DOWN: 1,
		LEFT: 2,
		RIGHT: 3,
	};
},
Sokoban = function() {
	var canvas = document.getElementById('canvas'),
	context = canvas.getContext('2d'),
	objects,
	player,

	init = function() {
		var deadblocks, deadblock, moveableblocks, moveableblock;
		sokoban.constants = new Constants(10, 600);
		objects = new Objects();

		deadblocks = [
			{ x:0, y:0 },
			{ x:1, y:0 },
			{ x:2, y:0 },
			{ x:0, y:1 },
			{ x:1, y:1 },
			{ x:2, y:1 },
			{ x:0, y:2 },
			{ x:1, y:2 },
			{ x:2, y:2 },
			{ x:7, y:0 },
			{ x:8, y:0 },
			{ x:9, y:0 },
			{ x:7, y:1 },
			{ x:8, y:1 },
			{ x:9, y:1 },
			{ x:7, y:2 },
			{ x:8, y:2 },
			{ x:9, y:2 },
			{ x:0, y:7 },
			{ x:1, y:7 },
			{ x:2, y:7 },
			{ x:0, y:8 },
			{ x:1, y:8 },
			{ x:2, y:8 },
			{ x:0, y:9 },
			{ x:1, y:9 },
			{ x:2, y:9 },
			{ x:7, y:7 },
			{ x:8, y:7 },
			{ x:9, y:7 },
			{ x:7, y:8 },
			{ x:8, y:8 },
			{ x:9, y:8 },
			{ x:7, y:9 },
			{ x:8, y:9 },
			{ x:9, y:9 }
		];
		for(var i =0; i < deadblocks.length; i++) {
			deadblock = new sokoban.drawable.DeadBlock();
			deadblock.putAt(deadblocks[i].x, deadblocks[i].y);
			objects.push(deadblock);
		}

		player = new sokoban.drawable.Player();
		player.putAt(8,5);
		objects.push(player);

		var t = new sokoban.drawable.Target(5);
		t.putAt(9,3);
		objects.push(t);

		t = new sokoban.drawable.Target(9);
		t.putAt(0,6);
		objects.push(t);

		// 1,1,2,3,6
		moveableblocks = [
			{ x:4, y:1, value:1 },
			{ x:6, y:8, value:1 },
			{ x:2, y:5, value:2 },
			{ x:2, y:6, value:3 },
			{ x:8, y:4, value:6 }
		];
		for(var i = 0; i < moveableblocks.length; i++ ) {
			moveableblock = new sokoban.drawable.MovableBlock(moveableblocks[i].value);
			moveableblock.putAt(moveableblocks[i].x, moveableblocks[i].y);
			objects.push(moveableblock);
		}

		var plus = new sokoban.drawable.MathBlock('+', function(a,b) {
			return parseInt(a) + parseInt(b);
		});
		plus.putAt(3,3);
		objects.push(plus);

		var times = new sokoban.drawable.MathBlock('x', function(a,b) {
			return parseInt(a) * parseInt(b);
		});
		times.putAt(4,4);
		objects.push(times);

		var minus = new sokoban.drawable.MathBlock('-', function(a,b) {
			return parseInt(a) - parseInt(b);
		});
		minus.putAt(5,5);
		objects.push(minus);

		redraw();
		bindListeners();
	},
	redraw = function() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		drawGridLines();
		objects.drawAll();
	},
	drawGridLines = function() {
		var gradient=context.createLinearGradient(0,0,600, 600);
		gradient.addColorStop("0","#999");
		gradient.addColorStop("0.5","#aaa");
		gradient.addColorStop("1.0","#777");
		context.strokeStyle=gradient;
		context.lineWidth=0.5;
		for(var x = 600/sokoban.constants.gridSize; x < 600; x += 600/sokoban.constants.gridSize) {
			context.beginPath();
			context.moveTo(x, 0);
			context.lineTo(x, 600);
			context.stroke();
			context.closePath();
		}
		for(var y = 600/sokoban.constants.gridSize; y < 600; y += 600/sokoban.constants.gridSize) {
			context.beginPath();
			context.moveTo(0, y);
			context.lineTo(600, y);
			context.stroke();
			context.closePath();
		}
	},
	Objects = function() {
		var objectList = [];
		this.push = function(ob) {
			objectList.push(ob);
		};
		this.pop = function(ob) {
			// deletes object(s) at specified object's position
			// a math block with an operand shares same position as operand; both will be deleted
			var tempList = [];
			var currentObject;
			for(var i = 0; i < objectList.length; i ++) {
				currentObject = objectList[i];
				if((currentObject.gX !== ob.gX) || (currentObject.gY !== ob.gY)) {
					tempList.push(currentObject);
				}
			}
			objectList = tempList;
		};
		this.list = function() {
			return objectList;
		};
		this.objAt = function(x, y) {
			// returns the object at the specified position.
			// when a mathblock has an operand, the returned object is the mathblock.
			// the operand can be accessed from block.operand
			var currentObject;
			for(var i = 0; i < objectList.length; i ++) {
				currentObject = objectList[i];
				if(currentObject.gX === x && currentObject.gY === y) {
					if(currentObject.type === 'movableblock' && currentObject.isOperand) {
						//skip, so that the mathblock is returned instead
					}
					else {
						return currentObject;
					}
				}
			}
			return undefined;
		};
		this.drawAll = function() {
			for(var i = 0; i < objectList.length; i ++) {
				objectList[i].draw();
			}
		};
	};
	move = function(direction) {
		var newX = player.gX, newY = player.gY, pushTargetX = player.gX, pushTargetY = player.gY, objectAtNewPos, objectAtPushTarget, mathResultBlock;
		if(direction === sokoban.constants.directions.UP) {
			newY = newY - 1;
			pushTargetY = newY - 1;
		}
		else if(direction === sokoban.constants.directions.DOWN) {
			newY = newY + 1;
			pushTargetY = newY + 1;
		}
		else if(direction === sokoban.constants.directions.LEFT) {
			newX = newX - 1;
			pushTargetX = newX - 1;
		}
		else if(direction === sokoban.constants.directions.RIGHT) {
			newX = newX + 1;
			pushTargetX = newX + 1;
		}
		if(!((newX >= 0) && (newY >=0) && (newX < sokoban.constants.gridSize) && (newY < sokoban.constants.gridSize))) {
			// don't allow user to go off grid
			return;
		}
		objectAtNewPos = objects.objAt(newX, newY);
		objectAtPushTarget = objects.objAt(pushTargetX, pushTargetY);
		if(typeof objectAtNewPos === 'undefined') {
			// empty space, move on
			player.putAt(newX, newY);
			redraw();
			return;
		}
		else {
			if(objectAtNewPos.type === 'deadblock') {
				return;
			}
			else if(objectAtNewPos.type === 'target') {
				return;
			}
			else if(objectAtNewPos.type === 'target') {
				return;
			}
			else if(objectAtNewPos.type === 'mathblock') {
				return;
			}
		}
		// Player is trying to push a moveable block
		if(!((pushTargetX >= 0) && (pushTargetY >=0) && (pushTargetX < sokoban.constants.gridSize) && (pushTargetY < sokoban.constants.gridSize))) {
			// don't allow user to push moveable block off grid
			return;
		}
		if(typeof objectAtPushTarget === 'undefined') {
			// empty space, allow push
			objectAtNewPos.putAt(pushTargetX, pushTargetY);
			player.putAt(newX, newY);
			redraw();
			return;
		}
		if(objectAtPushTarget.type === 'target' && !objectAtPushTarget.satisfied) {
			if(objectAtPushTarget.value === objectAtNewPos.value) {
				// success, mark target as happy and delete moveable block
				objectAtPushTarget.satisfied = true;
				objects.pop(objectAtNewPos);
				player.putAt(newX, newY);
				redraw();
				return;
			}
		}
		if(objectAtPushTarget.type === 'mathblock') {
			if(objectAtPushTarget.hasOperand) {
				// TODO
				mathResultBlock = new sokoban.drawable.MovableBlock();
				mathResultBlock.value = objectAtPushTarget.applyOperation(objectAtNewPos);
				objects.pop(objectAtPushTarget);
				objects.pop(objectAtNewPos);
				mathResultBlock.putAt(pushTargetX, pushTargetY);
				objects.push(mathResultBlock);
				player.putAt(newX, newY);
				redraw();
				return;
			}
			else {
				objectAtPushTarget.hasOperand = true;
				objectAtPushTarget.operand = objectAtNewPos;
				objectAtNewPos.putAt(pushTargetX, pushTargetY);
				objectAtNewPos.isOperand = true;
				player.putAt(newX, newY);
				redraw();
				return;
			}
		}
	},
	navigationKeypressHandler = function(e) {
		if(e.which === 119) {
			move(sokoban.constants.directions.UP);
		}
		else if(e.which === 115) {
			move(sokoban.constants.directions.DOWN);
		}
		else if(e.which === 97) {
			move(sokoban.constants.directions.LEFT);
		}
		else if(e.which === 100) {
			move(sokoban.constants.directions.RIGHT);
		}
	},
	bindListeners = function() {
		$(document).keypress(navigationKeypressHandler);
	};
	sokoban.drawable = {};
	sokoban.drawable.DeadBlock = function() {
		this.type = 'deadblock';
		this.draw = function() {
			var gradient=context.createLinearGradient(0,0,600, 600);
			context.fillStyle=gradient;
			context.beginPath();
			gradient.addColorStop("0","#333");
			gradient.addColorStop("1","#555");
			context.moveTo(this.pX, this.pY);
			context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY);
			context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY + sokoban.constants.blockWidth);
			context.lineTo(this.pX, this.pY + sokoban.constants.blockWidth);
			context.lineTo(this.pX, this.pY);
			context.fill();
		};
	};
	sokoban.drawable.Player = function() {
		this.type='player';
		this.draw = function() {
			var gradient=context.createLinearGradient(0,0,600, 600);
			context.fillStyle=gradient;
			context.beginPath();
			gradient.addColorStop("0","#933");
			gradient.addColorStop("1","#933");
			context.moveTo(this.pX, this.pY);
			context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY);
			context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY + sokoban.constants.blockWidth);
			context.lineTo(this.pX, this.pY + sokoban.constants.blockWidth);
			context.lineTo(this.pX, this.pY);
			context.fill();
		};
	};
	sokoban.drawable.Target = function(val) {
		this.value = val;
		this.type = 'target';
		this.satisfied = false;
		this.draw = function() {
			var gradient=context.createLinearGradient(0,0,600, 600);
			if(this.satisfied) {
				gradient.addColorStop("0","#fc0");
				gradient.addColorStop("1","#fc0");
			}
			else {
				gradient.addColorStop("0","#794");
				gradient.addColorStop("1","#794");
			}
			context.strokeStyle=gradient;
			context.fillStyle=gradient;
			context.lineWidth=3;
			context.beginPath();
			context.moveTo(this.pX, this.pY);
			context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY);
			context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY + sokoban.constants.blockWidth);
			context.lineTo(this.pX, this.pY + sokoban.constants.blockWidth);
			context.lineTo(this.pX, this.pY);
			context.stroke();
			if(this.satisfied) {
				context.fill();
				context.closePath();
				gradient.addColorStop("0","#fff");
				gradient.addColorStop("1","#fff");
				context.fillStyle = gradient;
			}
			else {
				context.closePath();
			}
			context.beginPath();
			context.lineWidth=1.5;
			context.font="60px Sans-Serif";
			context.fillStyle = gradient;
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			if(this.satisfied) {
				context.fillText(this.value, this.pX + (sokoban.constants.blockWidth / 2), this.pY + (sokoban.constants.blockWidth / 2));
			}
			else {
				context.strokeText(this.value, this.pX + (sokoban.constants.blockWidth / 2), this.pY + (sokoban.constants.blockWidth / 2));
			}
			context.closePath();
		};
	};
	sokoban.drawable.MovableBlock = function(val) {
		this.value = val;
		this.type = 'movableblock';
		this.isOperand = false;
		this.draw = function() {
			if(this.isOperand) {
				//delegate draw to math block
				return;
			}
			var gradient=context.createLinearGradient(0,0,600, 600);
			gradient.addColorStop("0","#794");
			gradient.addColorStop("1","#794");
			context.fillStyle=gradient;
			context.lineWidth=3;
			context.beginPath();
			context.moveTo(this.pX, this.pY);
			context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY);
			context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY + sokoban.constants.blockWidth);
			context.lineTo(this.pX, this.pY + sokoban.constants.blockWidth);
			context.lineTo(this.pX, this.pY);
			context.fill();
			context.closePath();
			gradient.addColorStop("0","#fff");
			gradient.addColorStop("1","#fff");
			context.beginPath();
			context.lineWidth=1.5;
			context.font="60px Sans-Serif";
			context.fillStyle = gradient;
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText(this.value, this.pX + (sokoban.constants.blockWidth / 2), this.pY + (sokoban.constants.blockWidth / 2));
			context.closePath();
		};
	};
	sokoban.drawable.MathBlock = function(symbol, operation) {
		this.symbol = symbol;
		this.type = 'mathblock';
		this.hasOperand = false;
		this.operation = operation;
		this.operand;
		this.applyOperation = function(otherBlock) {
			return this.operation(this.operand.value, otherBlock.value);
		}
		this.draw = function() {
			var gradient=context.createLinearGradient(0,0,600, 600);
			if(this.hasOperand) {
				gradient.addColorStop("0","#ebe");
				gradient.addColorStop("1","#ebe");
				context.strokeStyle=gradient;
				context.fillStyle=gradient;
				context.lineWidth=3;
				context.beginPath();
				context.moveTo(this.pX, this.pY);
				context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY);
				context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY + sokoban.constants.blockWidth);
				context.lineTo(this.pX, this.pY + sokoban.constants.blockWidth);
				context.lineTo(this.pX, this.pY);
				context.fill();
				context.closePath();
				gradient=context.createLinearGradient(0,0,600, 600);
				gradient.addColorStop("0","#fff");
				gradient.addColorStop("1","#fff");
				context.beginPath();
				context.lineWidth=1.5;
				context.font="20px Sans-Serif";
				context.fillStyle = gradient;
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillText(this.operand.value + '' + this.symbol + '_', this.pX + (sokoban.constants.blockWidth / 2), this.pY + (sokoban.constants.blockWidth / 2));
				context.closePath();
			}
			else {
				gradient.addColorStop("0","#bbd");
				gradient.addColorStop("1","#bbd");
				context.strokeStyle=gradient;
				context.fillStyle=gradient;
				context.lineWidth=3;
				context.beginPath();
				context.moveTo(this.pX, this.pY);
				context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY);
				context.lineTo(this.pX + sokoban.constants.blockWidth, this.pY + sokoban.constants.blockWidth);
				context.lineTo(this.pX, this.pY + sokoban.constants.blockWidth);
				context.lineTo(this.pX, this.pY);
				context.fill();
				context.closePath();
				gradient=context.createLinearGradient(0,0,600, 600);
				gradient.addColorStop("0","#fff");
				gradient.addColorStop("1","#fff");
				context.beginPath();
				context.lineWidth=1.5;
				context.font="60px Sans-Serif";
				context.fillStyle = gradient;
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillText(this.symbol, this.pX + (sokoban.constants.blockWidth / 2), this.pY + (sokoban.constants.blockWidth / 2));
				context.closePath();
			}
		};
	};
	sokoban.drawable.DeadBlock.prototype = Drawable.prototype;
	sokoban.drawable.Player.prototype = Drawable.prototype;
	sokoban.drawable.Target.prototype = Drawable.prototype;
	sokoban.drawable.MovableBlock.prototype = Drawable.prototype;
	sokoban.drawable.MathBlock.prototype = Drawable.prototype;
	init();
},
Drawable = function() { };
Drawable.prototype.putAt = function(x, y) {
	this.gX = x;
	this.gY = y;
	this.pX = x * sokoban.constants.blockWidth;
	this.pY = y * sokoban.constants.blockWidth;
};
Drawable.prototype.type = 'drawable';

$(function() {
	sokoban.game = new Sokoban();
});

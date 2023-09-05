//--------------------------------------------------------------------------------------------------------------------------------|Player Section
class PlayerClass {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.occupiedCell = {x: 0, y: 0};
    this.previousOccupiedCell = {x: 0, y: 0};
    this.radius = 0.12;
    this.diameter = this.radius * 2;
    this.radius_cellSize = this.radius * cellSize;
    this.diameter_cellSize = this.diameter * cellSize;

    this.angle = this.lookAngle = toRadians(0);
    // lookAngle always == angle, just added so a consistent name could be used in the weapon system.
    this.verticalAngle = toRadians(0);
    this.jumpHeight = 0;
    this.jumpStop = false;
    this.verticalVelocity = 0;
    this.g = -0.0018 * screenW * cellSize;
    this.jumpVelocity = -22 * this.g;
    // Note: 'g' is based off screenW as fov will alter height of walls based on screenW

    this.speed = 0;
    this.strafeSpeed = 0;
    this.moveSpeed = 0.036 * cellSize;
    this.angleMoveSpeed = Math.round(Math.sqrt((this.moveSpeed * this.moveSpeed) / 2) * 1000) / 1000;
    this.sprintSpeed = this.moveSpeed * 1.7;
    this.angleSprintSpeed = Math.round(Math.sqrt((this.sprintSpeed * this.sprintSpeed) / 2) * 1000) / 1000;
    this.rotSpeed = 0;

    this.dead = false;
    this.healthMax = 100;
    this.bonusHealthMax = 200;
    this.health = 100;
    this.armorMax = 100;
    this.bonusArmorMax = 100;
    this.armor = 15;
    this.inventory = []; // now initiated in this.init
    this.heldItem;
    // visible and state added to conform with entitiesWithinSegment function
    this.visible = true;
    this.state = null;

    // Invincibility Timer
    this.iTimer = TimerFactory.newTimer(128);
    this.iTimer.pauseUpdate(true);
    this.i = false;

    // Weapons slots used by weapon pickups to know relevant inventory index.
    this.weaponSlots = {"pistol": 0, "machineGun": 1, "shotgun": 2};
  }


  init() { // called by start button in menusAndUi.js/menu_main/init
    // this.inventory = [new PlayerWeapon_HitscanPistol(this), new PlayerWeapon_ProjectileMachineGun(this), new PlayerWeapon_HitscanShotgun(this), new PlayerWeapon_ProjectileShotgun(this)];
    this.inventory = [new PlayerWeapon_HitscanPistol(this), null, new PlayerWeapon_ProjectileShotgun(this)];
    this.heldItem = this.inventory[0];
  }


  update(timeDelta) {
    if (this.dead) { return; }
    playerMoveCheck();

    const mul = timeDelta / logicTick;
    this.movement(mul);
    this.verticalVelocityUpdate(mul);
  }


  movement(mul) {
    this.angle += this.rotSpeed;
    this.angle = roundRadian(this.angle);
    this.lookAngle = this.angle;

    const moveStep = mul * this.speed;
    const strafeStep = mul * this.strafeSpeed;
    const strafeAngle = roundRadian(this.angle-halfPi);
    var newX = this.x;
    var newY = this.y;

    newX += Math.cos(this.angle) * moveStep;
    newY += Math.sin(this.angle) * moveStep;
    newX += Math.cos(strafeAngle) * strafeStep;
    newY += Math.sin(strafeAngle) * strafeStep;

    var pos = checkCollision(this.x/cellSize,this.y/cellSize, newX/cellSize,newY/cellSize, this.diameter);
    this.x = pos.x;
    this.y = pos.y;

    this.occupiedCell.x = Math.floor(this.x / cellSize);
    this.occupiedCell.y = Math.floor(this.y / cellSize);
    if (this.occupiedCell.x != this.previousOccupiedCell.x || this.occupiedCell.y != this.previousOccupiedCell.y) {
      itemPickupCheck(this);
      mapTriggerCheck(this);
    }
    this.previousOccupiedCell = {x: this.occupiedCell.x, y: this.occupiedCell.y};
  }


  verticalVelocityUpdate(mul) {
    if (this.verticalVelocity == 0) { return; }
    var newJumpHeight = this.jumpHeight + (this.verticalVelocity * mul);

    if (newJumpHeight > 0) {
      this.jumpHeight = newJumpHeight;
      this.verticalVelocity += this.g * mul;
    } else {
      this.jumpHeight = 0;
      this.verticalVelocity = 0;
    }

    if (this.jumpHeight <= 0) {
      this.jumpHeight = 0;
      this.verticalVelocity = 0;
    }
  }


  jump() {
    if (this.jumpHeight > 0) { return; }
    this.verticalVelocity = this.jumpVelocity;
  }


  useHeldItem() {
    if (player.dead) { return; }
    this.heldItem.use(this);
  }


  hit(damage) {
    if (this.iTimer.isFinished()) {
      this.iTimer.pauseUpdate(true);
      this.iTimer.reset();
      this.i = false;
    }

    if (this.dead || this.i || cheats.godMode) { return; }

    if (this.armor > 0) {
      let armorDamage = Math.floor(damage / 3);
      if (armorDamage > this.armor) { armorDamage = this.armor; }
      this.armor -= Math.ceil(armorDamage * 0.8);
      this.health -= (damage - armorDamage);
    } else {
      this.health -= damage;
    }

    this.iTimer.pauseUpdate(false);
    this.i = true;

    if (this.health <= 0) {
      this.dead = true;
      document.exitPointerLock();
    }
  }


  useRaycast() {
    var _rayData = castSingleRay(this, this.angle);
    if (_rayData.distance > cellSize * 2) { return; }

    let cellX = _rayData.mapCell.x;
    let cellY = _rayData.mapCell.y;
    if (wallTriggerMap[cellY][cellX] == null) { return; }
    if (wallTriggerMap[cellY][cellX].disabled) { return; }

    if (_rayData.vertical) {
      var dirIndex = _rayData.right ? 3 : 1;
    } else {
      var dirIndex = _rayData.up ? 2 : 0;
    }
    if (!wallTriggerMap[cellY][cellX].directions[dirIndex]) { return; }

    wallTriggerMap[cellY][cellX].execute();
  }
}

const player = new PlayerClass();




//--------------------------------------------------------------------------------------------------------------------------------|Collision Functions
function outOfMapBounds(x, y) {
  return x < 0 || x >= mapWidth || y < 0 || y >= mapHeight;
}

function collidesWithMap(x, y) {
  // x = Math.floor(x/cellSize);
  // y = Math.floor(y/cellSize);
  if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) { return true; }

  var x = Math.floor(x);
  var y = Math.floor(y);
  // Prototype map data to objects change.
  // if (currentMap[y][x] != 0 && currentMap[y][x].type == null) { return true; }
  // else if (currentMap[y][x].type != 0) { return true; }
  if (currentMap[y][x] != 0) { return true; }
  if (spriteMap[y][x] && spriteMap[y][x].block) { return true; }

  return false;
  //return x < 0 || x >= mapWidth || y < 0 || y >= mapHeight || currentMap[y][x] != 0 || (spriteMap[y][x] && spriteMap[y][x].block);
}

function checkCollision(fromX,fromY, toX,toY, radius) {
  var pos = { x: fromX, y: fromY };
  var toX = toX, toY = toY;

  if (toY<0 || toY>=mapHeight || toX<0 || toX>=mapWidth) { return pos; }

  var blockX = Math.floor(toX);
  var blockY = Math.floor(toY);

  if (collidesWithMap(blockX,blockY)) {
    /*
    if (!collidesWithMap(blockX-1,blockY)) { // if cell to left == 0
      return {x: (blockX-radius)*cellSize, y: pos.y*cellSize};
    }
    if (!collidesWithMap(blockX-1,blockY-1)) { // if cell to top-left == 0
      return {x: (blockX-radius)*cellSize, y: (blockY-radius)*cellSize};
    }
    if (!collidesWithMap(blockX,blockY-1)) { // if cell to top == 0
      return {x: pos.x*cellSize, y: (blockY-radius)*cellSize};
    }
    if (!collidesWithMap(blockX+1,blockY-1)) { // if cell to top-right == 0
      return {x: (blockX+1+radius)*cellSize, y: (blockY-radius)*cellSize};
    }
    if (!collidesWithMap(blockX+1,blockY)) { // if cell to right == 0
      return {x: (blockX+1+radius)*cellSize, y: pos.y*cellSize};
    }
    if (!collidesWithMap(blockX+1,blockY+1)) { // if cell to bottom-right == 0
      return {x: (blockX+1+radius)*cellSize, y: (blockY+1+radius)*cellSize};
    }
    if (!collidesWithMap(blockX,blockY+1)) { // if cell to bottom == 0
      return {x: pos.x*cellSize, y: (blockY+1+radius)*cellSize};
    }
    if (!collidesWithMap(blockX-1,blockY+1)) { // if cell to bottom-left == 0
      return {x: (blockX-radius)*cellSize, y: (blockY+1+radius)*cellSize};
    }
    */
    return {x: pos.x*cellSize, y: pos.y*cellSize};
  }

  pos.x = toX;
  pos.y = toY;
  var blockTop = collidesWithMap(blockX,blockY-1);
  var blockBottom = collidesWithMap(blockX,blockY+1);
  var blockLeft = collidesWithMap(blockX-1,blockY);
  var blockRight = collidesWithMap(blockX+1,blockY);

  if (blockTop != 0 && toY-blockY < radius) { toY = pos.y = blockY + radius; }
  if (blockBottom != 0 && blockY+1-toY < radius) { toY = pos.y = blockY + 1 - radius; }
  if (blockLeft != 0 && toX-blockX < radius) { toX = pos.x = blockX + radius; }
  if (blockRight != 0 && blockX+1-toX < radius) { toX = pos.x = blockX + 1 - radius; }

  // is tile to the top-left a wall
  if (collidesWithMap(blockX-1,blockY-1) != 0 && !(blockTop != 0 && blockLeft != 0)) {
    var dx = toX - blockX;
    var dy = toY - blockY;
    if (dx*dx+dy*dy < radius*radius) {
      if (dx*dx > dy*dy) {
        toX = pos.x = blockX + radius;
      } else {
        toY = pos.y = blockY + radius;
      }
    }
  }
  // is tile to the top-right a wall
  if (collidesWithMap(blockX+1,blockY-1) != 0 && !(blockTop != 0 && blockRight != 0)) {
		var dx = toX - (blockX+1);
		var dy = toY - blockY;
		if (dx*dx+dy*dy < radius*radius) {
			if (dx*dx > dy*dy) {
				toX = pos.x = blockX + 1 - radius;
			} else {
				toY = pos.y = blockY + radius;
      }
		}
	}
	// is tile to the bottom-left a wall
	if (collidesWithMap(blockX-1,blockY+1) != 0 && !(blockBottom != 0 && blockLeft != 0)) {
		var dx = toX - blockX;
		var dy = toY - (blockY+1);
		if (dx*dx+dy*dy < radius*radius) {
			if (dx*dx > dy*dy) {
				toX = pos.x = blockX + radius;
			} else {
				toY = pos.y = blockY + 1 - radius;
      }
		}
	}
	// is tile to the bottom-right a wall
	if (collidesWithMap(blockX+1,blockY+1) != 0 && !(blockBottom != 0 && blockRight != 0)) {
		var dx = toX - (blockX+1);
		var dy = toY - (blockY+1);
		if (dx*dx+dy*dy < radius*radius) {
			if (dx*dx > dy*dy) {
				toX = pos.x = blockX + 1 - radius;
			} else {
				toY = pos.y = blockY + 1 - radius;
      }
		}
	}

  pos.x *= cellSize;
  pos.y *= cellSize;
  return pos;
}




//--------------------------------------------------------------------------------------------------------------------------------|Event Listeners
document.addEventListener('keydown', (e) => {
  if (e.key == 'Tab' || e.key == 'F11' || e.key == ' ') {
    e.preventDefault();
  }
  if (e.key == "g") { // TODO: remove
    popupText.newMsg("This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message. This is a test message.", 4096);
    popupText.newMsg("This is a test message - two.");
    popupText.newMsg("This is a test message - three.");
  }

  // Weapon Swapping Section
  switch (e.key.toLowerCase()) {
    case controlKeys.action_activate:
      player.useRaycast();
      break;
    case controlKeys.weapon_switch1:
      if (player.inventory[0] == null) { return; }
      player.heldItem = player.inventory[0];
      break;
    case controlKeys.weapon_switch2:
      if (player.inventory[1] == null) { return; }
      player.heldItem = player.inventory[1];
      break;
    case controlKeys.weapon_switch3:
      if (player.inventory[2] == null) { return; }
      player.heldItem = player.inventory[2];
      break;
    case controlKeys.weapon_switch4:
      if (player.inventory[3] == null) { return; }
      player.heldItem = player.inventory[3];
      break;
  }
});


document.addEventListener('keyup', (e) => {
  if (e.key == "Escape" || e.key.toLowerCase() == controlKeys.ui_pause) {
    // closes menus
    if (menu_options.visible) {
      menu_options.toggle(false);
      optionsToLocalStorage();
      return;
    }
    if (menu_graphics.visible) {
      menu_graphics.toggle(false);
      graphicsToLocalStorage();
      return;
    }
    if (menu_controls.visible) {
      if (!menu_controls.remapPopup.visible) {
        menu_controls.toggle(false);
        controlsToLocalStorage();
      }
      return;
    }
    pauseUpdate();
  } else if (e.key == "F11") {
    toggleFullscreen();
  } else if (e.key == "`" && options.mapEditorEnabled) {
    toggleMapEditor();
  }
});


// keyMap based off code from: https://stackoverflow.com/a/12444641
var keyMap = {};
onkeydown = onkeyup = function(e) {
  var eKey = e.key.toLowerCase();
  if (Object.values(controlKeys).includes(eKey)) {
    keyMap[Object.keys(controlKeys).find(key => controlKeys[key] === eKey)] = e.type == 'keydown';
  }

  // if (!pause) { playerMoveCheck(); }
}

function playerMoveCheck() {
  if (keyMap.look_recenter) { player.verticalAngle = 0; }
  if (keyMap.move_jump) { player.jump(); }

  if (keyMap.look_turnLeft && !keyMap.look_turnRight) {
    player.rotSpeed = toRadians(-3.8 * options.horizontalMouseSensitivity);
  } else if (keyMap.look_turnRight && !keyMap.look_turnLeft) {
    player.rotSpeed = toRadians(3.8 * options.horizontalMouseSensitivity);
  } else {
    player.rotSpeed = 0;
  }

  if (options.alwaysSprint && keyMap.move_sprint) {
    var moveSpeed = player.moveSpeed;
    var angleMoveSpeed = player.angleMoveSpeed;
  } else if (options.alwaysSprint) {
    var moveSpeed = player.sprintSpeed;
    var angleMoveSpeed = player.angleSprintSpeed;
  } else if (keyMap.move_sprint) {
    var moveSpeed = player.sprintSpeed;
    var angleMoveSpeed = player.angleSprintSpeed;
  } else {
    var moveSpeed = player.moveSpeed;
    var angleMoveSpeed = player.angleMoveSpeed;
  }

  if (keyMap.move_yNeg && keyMap.move_yPos) {
    player.speed = 0;
    if (keyMap.move_xNeg && !keyMap.move_xPos) {
      player.strafeSpeed = moveSpeed;
    } else if (keyMap.move_xPos && !keyMap.move_xNeg) {
      player.strafeSpeed = -moveSpeed;
    } else {
      player.strafeSpeed = 0;
    }
  } else if (keyMap.move_xNeg && keyMap.move_xPos) {
    player.strafeSpeed = 0;
    if (keyMap.move_yNeg && !keyMap.move_yPos) {
      player.speed = moveSpeed;
    } else if (keyMap.move_yPos && !keyMap.move_yNeg) {
      player.speed = -moveSpeed;
    } else {
      player.speed = 0;
    }
  } else if (keyMap.move_yNeg && keyMap.move_xNeg) {
    player.speed = angleMoveSpeed;
    player.strafeSpeed = angleMoveSpeed;
  } else if (keyMap.move_yNeg && keyMap.move_xPos) {
    player.speed = angleMoveSpeed;
    player.strafeSpeed = -angleMoveSpeed;
  } else if (keyMap.move_yPos && keyMap.move_xNeg) {
    player.speed = -angleMoveSpeed;
    player.strafeSpeed = angleMoveSpeed;
  } else if (keyMap.move_yPos && keyMap.move_xPos) {
    player.speed = -angleMoveSpeed;
    player.strafeSpeed = -angleMoveSpeed;
  } else if (keyMap.move_yNeg) {
    player.speed = moveSpeed;
    player.strafeSpeed = 0;
  } else if (keyMap.move_yPos) {
    player.speed = -moveSpeed;
    player.strafeSpeed = 0;
  } else if (keyMap.move_xNeg) {
    player.strafeSpeed = moveSpeed;
    player.speed = 0;
  } else if (keyMap.move_xPos) {
    player.strafeSpeed = -moveSpeed;
    player.speed = 0;
  } else {
    player.speed = 0;
    player.strafeSpeed = 0;
  }
}


document.addEventListener('mousemove', (e) => {
  // Stop mouse movement if pointer isn't locked.
  // if (document.pointerLockElement === null) { return; }
  if (pause || player.dead) { return; }

  var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
  var movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

  player.angle += toRadians(movementX * 0.4 * options.horizontalMouseSensitivity);

  if (!options.lockVerticalLook) {
    player.verticalAngle -= toRadians(movementY * 0.65 * options.verticalMouseSensitivity);

    // Limit player's verticle view angle.
    if (player.verticalAngle > halfPi) {
      player.verticalAngle = halfPi;
    } else if (player.verticalAngle < -halfPi) {
      player.verticalAngle = -halfPi;
    }
  }
});


document.addEventListener('click', (e) => {
  if (pause || player.dead) { return; }
  overlayCanvas.requestPointerLock();
  // if (e.button == lmbNum) { player.useHeldItem(); }
  // useHeldItem currently handled by check in logicloop
});


document.addEventListener("mousedown", (e) => {
  if (e.button == lmbNum) { lmbIsDown = true; }
  if (e.button == rmbNum) { rmbIsDown = true; }
});
document.addEventListener("mouseup", (e) => {
  if (e.button == lmbNum) { lmbIsDown = false; }
  if (e.button == rmbNum) { rmbIsDown = false; }
});


document.addEventListener('contextmenu', (e) => {
  // Prevents right mouse click context menu.
  e.preventDefault();
});


window.addEventListener('blur', (e) => {
  // Ensures player stops moving if a key is held when window losses focus, and pauses the game.
  keyMap = {};
  playerMoveCheck();
  if (!pause) { pauseUpdate(true); }
});


document.addEventListener('pointerlockchange', (e) => {
  // Ensures player won't continue moving if a key is held when pointer lock is exited.
  if (document.pointerLockElement === null || document.mozPointerLockElement === null || document.webkitPointerLockElement === null) {
    keyMap = {};
    playerMoveCheck();
  }
});




//--------------------------------------------------------------------------------------------------------------------------------|Mobile Controls Section
// mobileAndTabletCheck code is from: detectmobilebrowsers.com
// Which I found about here: stackoverflow.com/a/11381730
/*window.mobileAndTabletCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  console.log("Mobile = " + check);
  return check;
};
options.mobileControls = mobileAndTabletCheck();


var lastTouch;
var touchStart;
document.addEventListener("touchmove", function (e) {
  //e.preventDefault();
  if (options.mobileControls && !pause) {
    //console.log(e.changedTouches[0].identifier);
    //console.log(e.touches[0].pageX + " | " + touches[0].pageX);

    if (touchStart.pageX >= center.x) {
      const diff = lastTouch.pageX - e.touches[0].pageX;
      player.angle += toRadians(diff*options.touchSensitivity);
      lastTouch = e.touches[0];
    }
  }
});


document.addEventListener("touchstart", function (e) {
  //e.preventDefault();
  if (options.mobileControls && !pause) {
    lastTouch = e.touches[0];
    touchStart = e.touches[0];
  }
});*/

//  developer.mozilla.org/en-US/docs/Web/API/Touch_events/Using_Touch_Events
//  developer.mozilla.org/en-US/docs/Web/API/TouchEvent/changedTouches
//  stackoverflow.com/questions/13863974/rotate-element-based-on-touch-event
//* developer.mozilla.org/en-US/docs/Web/API/Touch_events
//  developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch

// Add joystick? (jsfiddle.net/aa0et7tr/5/)

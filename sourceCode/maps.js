//--------------------------------------------------------------------------------------------------------------------------------|Map Item/Sprite Section
/* Item Types:
0 - tablechairs
1 - armor
2 - plantgreen
3 - lamp
4 - manaOrb
5 - leaves
*/
// Creates spriteMap
function init_sprites(spriteMapData) {
  spriteMap = [];
  for (var y=0; y<mapHeight; y++) {
    spriteMap[y] = [];
  }

  for (var i=0; i<spriteMapData.length; i++) {
    var sprite = spriteMapData[i];

    sprite.visible = false;
    sprite.textureRef = itemTypes[sprite.type].texture;
    sprite.block = itemTypes[sprite.type].block;
    sprite.loot = itemTypes[sprite.type].loot;
    if (sprite.loot) { sprite.lootData = itemTypes[sprite.type].lootData; }
    sprite.spriteState = 0;
    sprite.alpha = 1;

    spriteMap[sprite.y][sprite.x] = sprite;
    // x and y adjusted to conform with enemy and projectile position values for combined rendering
    sprite.x = (sprite.x + 0.5) * cellSize;
    sprite.y = (sprite.y + 0.5) * cellSize;
  }
}


// Checks if the player's occupied cell contains a lootable item,
// then triggers appropriate action and deletes volatile items.
function itemPickupCheck(playerRef=player) {
  let cellX = playerRef.occupiedCell.x;
  let cellY = playerRef.occupiedCell.y;
  let spriteCell = spriteMap[cellY][cellX];

  if (spriteCell == null) { return; }
  if (!spriteCell.loot) { return; }

  switch (spriteCell.lootData.type) {
    case 'health':
      // If player health >= max health: don't give health or remove the item.
      if (playerRef.health >= playerRef.healthMax) { return; }
      playerRef.health += spriteCell.lootData.value;
      if (playerRef.health > playerRef.healthMax) { playerRef.health = playerRef.healthMax; }
      break;

    case 'bonusHealth':
      // If player health >= max bonus health: don't give health or remove the item.
      if (playerRef.health >= playerRef.bonusHealthMax) { return; }
      playerRef.health += spriteCell.lootData.value;
      if (playerRef.health > playerRef.bonusHealthMax) { playerRef.health = playerRef.bonusHealthMax; }
      break;

    case 'armor':
      // If player armor >= max armor: don't give armor or remove the item.
      if (playerRef.armor >= playerRef.armorMax) { return; }
      playerRef.armor += spriteCell.lootData.value;
      if (playerRef.armor > playerRef.armorMax) { playerRef.armor = playerRef.armorMax; }
      break;

    case 'armor':
      // If player armor >= max bonus armor: don't give armor or remove the item.
      if (playerRef.armor >= playerRef.bonusArmorMax) { return; }
      playerRef.armor += spriteCell.lootData.value;
      if (playerRef.armor > playerRef.bonusArmorMax) { playerRef.armor = playerRef.bonusArmorMax; }
      break;

    case 'weapon':
      var weaponSlot = playerRef.weaponSlots[spriteCell.lootData.value];
      // if player inventory slot has something in it: return
      if (playerRef.inventory[weaponSlot] != null) { return; }
      switch (spriteCell.lootData.value) {
        case 'shotgun':
          playerRef.inventory[weaponSlot] = new PlayerWeapon_ProjectileShotgun(playerRef);
          playerRef.heldItem = playerRef.inventory[weaponSlot];
          break;
        case 'machineGun':
          playerRef.inventory[weaponSlot] = new PlayerWeapon_ProjectileMachineGun(playerRef);
          playerRef.heldItem = playerRef.inventory[weaponSlot];
          break;
        default:
          console.error("Invalid lootData.value given for type == 'weapon' | Given value: " + spriteCell.lootData.value);
      }
      break;

    default:
      console.error("Invalid lootData.type for spriteMap[" + cellY + "][" + cellX + "] | Given value: " + spriteCell.lootData.type);
  }

  // Remove item from spriteMap if its volatile.
  if (spriteCell.lootData.volatile) { spriteMap[cellY][cellX] = null; }
}


// Called in getVCollision and getHCollision
function updateSpriteDistance(cellX,cellY, playerRef=player) {
  let dx = (cellX + 0.5) * cellSize - playerRef.x;
  let dy = (cellY + 0.5) * cellSize - playerRef.y;
  this.dx = dx;
  this.dy = dy;
  this.distance = Math.sqrt(dx*dx + dy*dy);
}




//--------------------------------------------------------------------------------------------------------------------------------|Prototype Transparent Wall Functions
function init_transparentWallMap(transparentWallMapData) {
  spriteMap = [];
  for (var y=0; y<mapHeight; y++) {
    spriteMap[y] = [];
  }

  for (var i=0; i<spriteMapData.length; i++) {
    var sprite = spriteMapData[i];

    sprite.visible = false;
    sprite.textureRef = itemTypes[sprite.type].texture;
    sprite.block = itemTypes[sprite.type].block;
    sprite.loot = itemTypes[sprite.type].loot;
    if (sprite.loot) { sprite.lootData = itemTypes[sprite.type].lootData; }
    sprite.spriteState = 0;
    sprite.alpha = 1;

    spriteMap[sprite.y][sprite.x] = sprite;
    // x and y adjusted to conform with enemy and projectile position values for combined rendering
    sprite.x = (sprite.x + 0.5) * cellSize;
    sprite.y = (sprite.y + 0.5) * cellSize;
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Prototype Decal System
// Creates decalMap
function init_decals(decalMapData) {
  decalMap = [];
  for (var y=0; y<mapHeight; y++) {
    decalMap[y] = [];
  }
  if (decalMapData.length <=0) { return; }

  for (var i=0; i<decalMapData.length; i++) {
    var decal = decalMapData[i];

    decal.visible = false;
    decal.textureRef = decalTypes[decal.type].texture;
    decal.spriteState = 0;
    decal.alpha = 1;

    decalMap[decal.y][decal.x] = decal;
    // x and y adjusted to conform with enemy and projectile position values for combined rendering
    // decal.x = (decal.x + 0.5) * cellSize;
    // decal.y = (decal.y + 0.5) * cellSize;
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Map Triggers System
class MapTrigger {
  constructor(x,y, volatile, events=[],eventArgs=[], conditions=[],conditionArgs=[]) {
    this.x = x;
    this.y = y;
    // If a trigger is volatile it will be deleted after triggering once.
    this.volatile = volatile;
    // Function reference(s) called when trigger is executed.
    this.events = events;
    // Array(s) of argument values for event function(s).
    this.eventArgs = eventArgs;

    for (var i=0; i<this.events.length; i++) {
      if (typeof this.eventArgs[i] == 'undefined') {
        this.eventArgs[i] = [];
      }
    }

    // Trigger will only execute if condition(s) return true.
    this.conditions = conditions;
    // Array(s) of argument values for condition function(s).
    this.conditionArgs = conditionArgs;

    for (var i=0; i<this.conditions.length; i++) {
      let _condition = this.conditions[i];
      if (typeof _condition == 'boolean') {
        _condition = () => { return _condition; }
      } else if (typeof _condition == 'undefined') {
        _condition = () => { return true; }
      }

      if (typeof this.conditionArgs[i] == 'undefined') {
        this.conditionArgs[i] = [];
      }
    }
  }

  execute() {
    // Stops trigger from executing if conditions are unfullfilled.
    let conditionResult = this.conditions.every((condition, index) => {
      return condition(...this.conditionArgs[index]);
    });
    if (!conditionResult) { return; }
    console.log(this);

    // Executes event functions.
    for (var i=0; i<this.events.length; i++) {
      this.events[i](...this.eventArgs[i]);
    }

    // If volatile: Sets own position within triggerMap to null, effectively deleting it.
    if (this.volatile) { triggerMap[this.y][this.x] = null; }
  }
}


// Note: Small limitation of the map trigger system is that two triggers cannot occupy the same cell.
var triggerMap = [];

// Creates triggerMap
function init_triggerMap(triggers) {
  triggerMap = [];
  for (var y=0; y<mapHeight; y++) {
    triggerMap[y] = [];
  }

  for (var i=0; i<triggers.length; i++) {
    var trigger = triggers[i];
    triggerMap[trigger.y][trigger.x] = trigger;
  }
}

// Creates trigger objects for .json loaded maps.
function init_triggers(_triggerData) {
  if (_triggerData.length <= 0) {
    init_triggerMap([]);
    return;
  }
  let _triggers = [];

  for (var i=0; i<_triggerData.length; i++) {
    let _t = _triggerData[i];

    // Create function pointers for events.
    let _events = [];
    let _eventArgs = [];
    for (var j=0; j<_t[3].length; j+=2) {
      if (_t[3][j] == 'teleportPlayer') {
        _events.push(teleportPlayer);
      } else if (_t[3][j] == 'mapTransition') {
        _events.push(mapTransition);
      } else if (_t[3][j] == 'spawnEnemies') {
        _events.push(spawnEnemies);
      } else if (_t[3][j] == 'editMap') {
        _events.push(editMap);
      } else if (_t[3][j] == 'displayMsg') {
        _events.push(displayMsg);
      }

      _eventArgs.push(_t[3][j+1]);
    }

    // Create function pointers for conditions.
    let _conditions = []
    let _conditionArgs = [];
    if (_t.length > 4) {
      for (var j=0; j<_t[4].length; j+=2) {
        if (_t[4][j] == 'allEnemiesDead') {
          _conditions.push(allEnemiesDead);
        }

        if (_t[4][j+1] == null) {
          _conditionArgs.push([]);
        } else {
          _conditionArgs.push(_t[4][j+1]);
        }
      }
    }

    _triggers.push(new MapTrigger(_t[0],_t[1], _t[2], _events,_eventArgs, _conditions,_conditionArgs));
  }

  init_triggerMap(_triggers);
}
// TODO: Change .json storage of trigger data to be an object similar to wall trigger data.

// Called near the end of player's movement method.
// Checks if player's occupied cell holds a trigger, and executes the trigger if it does.
function mapTriggerCheck(playerRef=player) {
  let cellX = playerRef.occupiedCell.x;
  let cellY = playerRef.occupiedCell.y;
  if (triggerMap[cellY][cellX] != null) { triggerMap[cellY][cellX].execute(); }
}




//--------------------------------------------------------------------------------------------------------------------------------|Wall Triggers System
class WallTrigger {
  constructor(x,y, directions, togglable, volatile, texName_off, texName_on, events=[],eventArgs=[], conditions=[],conditionArgs=[]) {
    this.x = x;
    this.y = y;
    // Array determining which sides of the wall are interactable [up, right, down, left].
    this.directions = directions;
    // If a trigger is togglable it can be activated & deactivated any number of times.
    this.togglable = togglable;
    // If a trigger is volatile it will be deleted after triggering once.
    this.volatile = volatile;
    // State controls if the trigger is switched on or off.
    this.state = false;
    this.textureName_off = texName_off;
    this.textureName_on = texName_on;
    // Function reference(s) called when trigger is executed.
    this.events = events;
    // Array(s) of argument values for event function(s).
    this.eventArgs = eventArgs;

    for (var i=0; i<this.events.length; i++) {
      if (typeof this.eventArgs[i] == 'undefined') {
        this.eventArgs[i] = [];
      }
    }

    // Trigger will only execute if condition(s) return true.
    this.conditions = conditions;
    // Array(s) of argument values for condition function(s).
    this.conditionArgs = conditionArgs;

    for (var i=0; i<this.conditions.length; i++) {
      let _condition = this.conditions[i];
      if (typeof _condition == 'boolean') {
        _condition = () => { return _condition; }
      } else if (typeof _condition == 'undefined') {
        _condition = () => { return true; }
      }

      if (typeof this.conditionArgs[i] == 'undefined') {
        this.conditionArgs[i] = [];
      }
    }
  }

  execute() { // TODO: Allow for toggled off events.
    if (this.togglable) {
      // if togglable: toggle state, & if new state is off: return (prevent event execution)
      this.state = !this.state;
      if (!this.state) { return; }
    } else if (!this.state) {
      // if not togglable & off: turn on
      this.state = true;
    } else {
      // else (if not togglable & on): return (prevent event execution).
      return;
    }

    // Stops trigger from executing if conditions are unfullfilled.
    let conditionResult = this.conditions.every((condition, index) => {
      return condition(...this.conditionArgs[index]);
    });
    if (!conditionResult) { return; }
    console.log(this);

    // Executes event functions.
    for (var i=0; i<this.events.length; i++) {
      this.events[i](...this.eventArgs[i]);
    }

    // If volatile: Sets own position within wallTriggerMap to null, effectively deleting it.
    // Note: This also means it will no longer be rendered.
    if (this.volatile) { wallTriggerMap[this.y][this.x] = null; }
  }
}


// Creates wallTriggerMap
var wallTriggerMap = [];
function init_wallTriggerMap(triggers) {
  if (triggers == null) { return; }
  wallTriggerMap = [];
  for (var y=0; y<mapHeight; y++) {
    wallTriggerMap[y] = [];
  }

  for (var i=0; i<triggers.length; i++) {
    var trigger = triggers[i];
    wallTriggerMap[trigger.y][trigger.x] = trigger;
  }
}


function init_wallTriggers0(_triggerData) {
  if (_triggerData.length <= 0) {
    init_wallTriggerMap([]);
    return;
  }
  let _triggers = [];

  for (var i=0; i<_triggerData.length; i++) {
    let _t = _triggerData[i];

    // Create function pointers for events.
    let _events = [];
    let _eventArgs = [];
    for (var j=0; j<_t[4].length; j+=2) {
      if (_t[4][j] == 'teleportPlayer') {
        _events.push(teleportPlayer);
      } else if (_t[4][j] == 'mapTransition') {
        _events.push(mapTransition);
      } else if (_t[4][j] == 'spawnEnemies') {
        _events.push(spawnEnemies);
      } else if (_t[4][j] == 'editMap') {
        _events.push(editMap);
      } else if (_t[4][j] == 'displayMsg') {
        _events.push(displayMsg);
      }

      _eventArgs.push(_t[4][j+1]);
    }

    // Create function pointers for conditions.
    let _conditions = []
    let _conditionArgs = [];
    if (_t.length > 5) {
      for (var j=0; j<_t[5].length; j+=2) {
        if (_t[5][j] == 'allEnemiesDead') {
          _conditions.push(allEnemiesDead);
        }

        if (_t[5][j+1] == null) {
          _conditionArgs.push([]);
        } else {
          _conditionArgs.push(_t[5][j+1]);
        }
      }
    }

    _triggers.push(new WallTrigger(_t[0],_t[1], _t[2], _t[3], _events,_eventArgs, _conditions,_conditionArgs));
  }

  init_wallTriggerMap(_triggers);
}

function init_wallTriggers(_triggerData) {
  if (_triggerData.length <= 0) {
    init_wallTriggerMap([]);
    return;
  }
  let _triggers = [];

  for (var i=0; i<_triggerData.length; i++) {
    let _t = _triggerData[i];

    // Create function pointers for events.
    let _events = [];
    let _eventArgs = [];
    for (var j=0; j<_t.events.length; j+=2) {
      if (_t.events[j] == 'teleportPlayer') {
        _events.push(teleportPlayer);
      } else if (_t.events[j] == 'mapTransition') {
        _events.push(mapTransition);
      } else if (_t.events[j] == 'spawnEnemies') {
        _events.push(spawnEnemies);
      } else if (_t.events[j] == 'editMap') {
        _events.push(editMap);
      } else if (_t.events[j] == 'displayMsg') {
        _events.push(displayMsg);
      }

      _eventArgs.push(_t.events[j+1]);
    }

    // Create function pointers for conditions.
    let _conditions = []
    let _conditionArgs = [];
    if (_t.conditions != null) {
      for (var j=0; j<_t.conditions.length; j+=2) {
        if (_t.conditions[j] == 'allEnemiesDead') {
          _conditions.push(allEnemiesDead);
        }

        if (_t.conditions[j+1] == null) {
          _conditionArgs.push([]);
        } else {
          _conditionArgs.push(_t.conditions[j+1]);
        }
      }
    }

    _triggers.push(new WallTrigger(_t.x,_t.y, _t.directions, _t.togglable, _t.volatile, _t.textureName_off,_t.textureName_on, _events,_eventArgs, _conditions,_conditionArgs));
  }

  init_wallTriggerMap(_triggers);
}




//--------------------------------------------------------------------------------------------------------------------------------|Trigger Event Functions
function teleportPlayer(xVal,x, yVal,y, angleVal,angle) {
// function teleportPlayer(x,y, angle) {
  /*player.x = x * cellSize;
  player.y = y * cellSize;
  player.angle = toRadians(angle);
  let ocx = Math.floor(x/cellSize);
  let ocy = Math.floor(y/cellSize);
  player.occupiedCell = {x: ocx, y: ocy};
  player.previousOccupiedCell = {x: ocx, y: ocy};*/

  if (xVal=="absolute" || xVal=='a') { player.x = x * cellSize; }
  else if (xVal=="relative" || xVal=='r') { player.x += x * cellSize; }

  if (yVal=="absolute" || yVal=='a') { player.y = y * cellSize; }
  else if (yVal=="relative" || yVal=='r') { player.y += y * cellSize; }

  if (angleVal=="absolute" || angleVal=='a') { player.angle = toRadians(angle); }
  else if (angleVal=="relative" || angleVal=='r') { player.angle += toRadians(angle); }

  let ocx = Math.floor(player.x/cellSize);
  let ocy = Math.floor(player.y/cellSize);
  player.occupiedCell = {x: ocx, y: ocy};
  player.previousOccupiedCell = {x: ocx, y: ocy};
}
// Note: This still doesn't work very well for repeatable back and forth teleportation.

function mapTransition(mapDataName) {
  // mapDataOptions[mapDataName].transitionTo();
  const urlParams = new URLSearchParams({ map: mapDataName });
  window.location.href='./game.html?' + urlParams.toString();
}

function spawnEnemies(...enemyData) { // list of numbers representing (enemyType, x, y, lookAngle)
  for (var i=0; i<enemyData.length; i+=4) {
    newEnemy(enemyData[i], enemyData[i+1],enemyData[i+2], enemyData[i+3]);
  }
}

function editMap(...editData) { // list of numbers representing (wallType, x, y)
  for (var i=0; i<editData.length; i+=3) {
    currentMap[editData[i+2]][editData[i+1]] = editData[i];
  }
}

function displayMsg(...msgs) {
  for (var i=0; i<msgs.length; i+=2) {
    console.log("%c" + msgs[i], msgs[i+1]);
    popupText.newMsg(msgs[i]);
    // popupText.container.style = msgs[i+1];
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Trigger Condition Functions
function allEnemiesDead() {
  if (enemies.length <= 0) { return true; }
  return enemies.every((enemy, index) => {
    return enemy.state == 'dead' ? true : false;
  });
}




//--------------------------------------------------------------------------------------------------------------------------------|Map System Class
class MapData {
  constructor(id, wallData, triggerData, wallTriggerData, itemData, enemyData, playerData, floorColors, ceilingColors, fogColor) {
    // Used to set URL param.
    this.id = id;
    // 2D array determining wall locations.
    this.wallData = wallData;
    // Array containing a MapTrigger object for each trigger.
    this.triggerData = triggerData;
    this.wallTriggerData = wallTriggerData;
    // Array containing an object for each environment sprite/item.
    this.itemData = itemData;
    // Array containing an array for each enemy.
    this.enemyData = enemyData;
    // Object containing player start conditions (location, weapons, health, etc.).
    this.playerData = playerData;
    // Arrays contining position (0-1) and color code (hex string) for floor and ceiling gradients.
    this.floorColors = floorColors;
    this.ceilingColors = ceilingColors;
    this.fogColor = fogColor;
  }

  init() {
    if (mapInitiated) { return; }
    console.log("Loaded Map [%c%s" + "%c]: %o", 'color: #62cad4', this.id, '', this);

    currentMap = this.wallData;
    mapWidth = currentMap[0].length;
    mapHeight = currentMap.length;

    init_triggerMap(this.triggerData);
    init_wallTriggerMap(this.wallTriggerData);

    init_sprites(this.itemData);

    init_enemies(this.enemyData);

    player.x = this.playerData.x * cellSize;
    player.y = this.playerData.y * cellSize;
    player.angle = toRadians(this.playerData.angle);

    if (this.floorColors) { floorColors = this.floorColors; }
    if (this.ceilingColors) { ceilingColors = this.ceilingColors; }
    if (this.fogColor) { colors.fog = this.fogColor; }

    mapInitiated = true;
    setTimeout(startGame, 5);
  }

  transitionTo() {
    const urlParams = new URLSearchParams({ map: this.id });
    window.location.href='./game.html?' + urlParams.toString();
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Maps and Associated Data
var defaultMap = [
  [1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1]
];

var testHallwayMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
var mapTriggers_infinitHallwayTest = [
  new MapTrigger(21,1, false, [teleportPlayer],[ ['r',-11,'r',0,'r',0] ]),
];

var wallHeightTestMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  // [1, 0, 0, 2, 1, 3, 1, 4, 1, 3, 1, 2, 1, 4, 1, 1, 4, 1, 3, 1, 2, 1, 3, 1, 4, 1, 3, 1, 2, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 2, 1, 3, 1, 4, 1, 3, 1, 2, 1, 4, 1, 1, 4, 1, 3, 1, 2, 1, 3, 1, 4, 1, 3, 1, 2, 1, 1, 1]
];

var miscTestMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 3, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
var mapItems_miscTestMap = [
  {type: "leaves", x:  1, y:  1},
  {type: "leaves", x:  8, y:  1},
  {type: "leaves", x: 10, y:  1},
  {type: "leaves", x: 12, y:  1},
  {type: "leaves", x: 14, y:  1},
  {type: "leaves", x: 16, y:  1},
  {type: "leaves", x: 18, y:  1},
  {type: "leaves", x: 20, y:  1},

  {type: "leaves", x:  4, y: 11},
];

var largeMapTest = [
  [4, 4, 4, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1],
  [4, 0, 0, 0, 0, 0, 0, 2, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [4, 0, 4, 4, 4, 1, 1, 1, 1, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
  [4, 0, 0, 0, 0, 4, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1],
  [4, 0, 0, 0, 0, 0, 4, 4, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [4, 0, 0, 0, 0, 0, 4, 0, 4, 4, 1, 0, 0, 0, 1, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1],
  [4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 1, 0, 0, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1],
  [4, 4, 4, 4, 0, 4, 4, 0, 0, 0, 4, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 3],
  [4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 3],
  [4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1],
  [4, 0, 0, 0, 0, 4, 4, 4, 0, 4, 4, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1],
  [4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1],
  [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1],
  [1, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1],
  [1, 3, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1],
  [1, 0, 0, 3, 3, 0, 0, 1, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1],
  [1, 0, 0, 3, 3, 0, 0, 1, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 4, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 4, 4, 4, 4, 4, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 4, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1],
  [1, 0, 0, 4, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 4, 0, 0, 0, 4, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 4, 0, 0, 0, 4, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 4, 0, 3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 4, 0, 0, 4, 0, 0, 1, 0, 0, 1, 4, 4, 0, 4, 4, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 4, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 3, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
var mapTriggers_largeMapTest = [
  new MapTrigger(13,12, false, [spawnEnemies],[ [0,13,11,0, 0,13,12,0, 0,13,13,0] ]),
  new MapTrigger(13,21, true,
    [ teleportPlayer, spawnEnemies ],
    [ ['a',13,'a',12,'r',0], [0,13,20,0, 0,13,21,0, 0,13,22,0] ],
    [ allEnemiesDead ],
    [ [] ]
  ),
]; // (x,y, volatile, events,eventArgs, conditions,conditionArgs)
var mapItems_largeMapTest = [
  // Armor near cells in beginning "building"
  {type: "armor", x: 10, y:  1},
  {type: "armor", x: 12, y:  1},
  {type: "armor", x: 10, y:  3},

  // Top left map items
  {type: "tablechairs", x:  2, y:  4},
  {type: "tablechairs", x:  4, y:  4},
  {type: "lamp", x:  1, y:  6},
  {type: "lamp", x:  2, y:  8},
  {type: "plantgreen", x:  1, y: 11},

  // Starting "room"
  {type: "lamp", x: 11, y: 19},
  {type: "tablechairs", x: 14, y: 19},
  {type: "armor", x: 10, y: 14},
  {type: "armor", x: 15, y: 14},
  {type: "armor", x: 10, y: 24},
  {type: "plantgreen", x:  8, y: 17},
  {type: "plantgreen", x: 17, y: 17},
  {type: "plantgreen", x:  8, y: 21},
  {type: "plantgreen", x: 17, y: 21},

  {type: "pickup_manaOrb", x: 16, y: 24},
];
var mapEnemiesData_largeMapTest = [
  // [0,  12.5,   17.5],
  // [0,  12.5,   16.5],
  [0, 12.5, 15.5,    0],
  [0,  2,   10,      0],
  [0,  1.5,  6,      0],
  [0,  4,   30,      0],
  [0, 11,    2,      0],
  [0, 35,    3,      0],
  [0, 49,    2,      0],
  [0, 22,    4,      0],
  [0, 37,   25,      0],
  [0, 38.5, 30.5,    0],
  [0, 46.5, 24.5,    0],
  [0, 43.5, 12.5,    0],
];// [type, x, y]

var currentMap = defaultMap;
var mapWidth = currentMap[0].length;
var mapHeight = currentMap.length;
var transparentWallMap;




//--------------------------------------------------------------------------------------------------------------------------------|Map System Objects
const mapDataOptions = { // (id, wallData, triggerData, wallTriggerData, itemData, enemyData, playerData)
  defaultMap: new MapData('defaultMap', defaultMap, [], [], [], [], {x: 3, y: 3, angle: 0}),
  largeTestMap: new MapData(
    'testMap',
    largeMapTest,
    mapTriggers_largeMapTest,
    [],
    mapItems_largeMapTest,
    mapEnemiesData_largeMapTest,
    {x: 13, y: 19.5, angle: -90}
  ),
  miscTestMap: new MapData(
    'miscTestMap',
    miscTestMap,
    [],
    [],
    mapItems_miscTestMap,
    [],
    // {x: 8.5, y: 7, angle: -90}
    {x: 9.19, y: 5.66, angle: -90}
  ),
  testHallwayMap: new MapData(
    'testHallwayMap',
    testHallwayMap,
    [],
    mapTriggers_infinitHallwayTest,
    [], [],
    {x: 1.5, y: 1.5, angle: 0}
  ),
  wallHeightTestMap: new MapData(
    'wallHeightTestMap',
    wallHeightTestMap,
    [], [], [],
    [
      // [0, 2, 7],
      // [0, 3, 7],
      // [0, 4, 7],
      // [0, 5, 7],
      // [0, 6, 7],
      // [0, 7, 7],
      // [0, 8, 7],
    ],
    {x: 7.5, y: 1.5, angle: 90}
  ),
}




//--------------------------------------------------------------------------------------------------------------------------------|JSON File Reading
function loadJSON(url, success, error) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    if (xhr.status === 404) {
      if (error) { error(xhr); }
      xhr.abort();
    } else if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        if (success) { success(JSON.parse(xhr.responseText)); }
      } else {
        if (error) { error(xhr); }
        xhr.abort();
      }
    }
  };

  xhr.open("GET", url, true);
  xhr.send();
}


function mapDataLoadError(xhr, mapId) {
  if (mapInitiated) { return; }
  console.error(xhr);

  if (mapDataOptions[mapId]) {
    console.error("Map data JSON load error - map data object referenced");
    mapDataOptions[mapId].init();
  } else {
    console.error("Map data JSON load error - default map loaded");
    mapDataOptions['defaultMap'].init();
  }
}


function init_mapData() {
  if (mapInitiated) { return; }
  console.log("Loaded Map [%c%s" + "%c]: %o", 'color: #62cad4', this.id, '', this);

  // if (this.wallData_string != null) {
  //   currentMap = stringMapToArray(this.wallData_string);
  // } else {
    currentMap = this.wallData;
  // }
  mapWidth = currentMap[0].length;
  mapHeight = currentMap.length;

  init_triggers(this.triggerData);
  init_wallTriggers(this.wallTriggerData);

  init_sprites(this.itemData);

  init_enemies(this.enemyData);

  player.x = this.playerData.x * cellSize;
  player.y = this.playerData.y * cellSize;
  player.angle = toRadians(this.playerData.angle);

  if (this.floorColors) { floorColors = this.floorColors; }
  if (this.ceilingColors) { ceilingColors = this.ceilingColors; }
  if (this.fogColor) { colors.fog = this.fogColor; }

  mapInitiated = true;
  setTimeout(startGame, 5);
}




const mapCharRef = {
  i: 8,
  c: 9
};

function stringMapToArray(stringMap) {
  let arrayMap = [];
  for (var y=0; y<stringMap.length; y++) {
    let stringRow = stringMap[y];
    let arrayRow = [];
    for (var x=0; x<stringRow.length; x++) {
      let c = stringRow[x];
      if (c == " ") { continue; }
      if (mapCharRef[c] != null) {
        var _type = mapCharRef[c];
      } else {
        var _type = parseInt(c);
      }

      let _wall = {
        type: _type
      };
      arrayRow.push(_wall);
    }
    arrayMap.push(arrayRow);
  }
  return arrayMap;
}

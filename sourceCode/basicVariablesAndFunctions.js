//--------------------------------------------------------------------------------------------------------------------------------|Variable Section
var screenW = window.innerWidth-1;
var screenH = window.innerHeight-4;
var mapInitiated = false;
const docStyle = getComputedStyle(document.body);

var options = {
  minimap: true,
  minimap_debug: false, // TODO: Make sure this is disabled before sharing.
  minimapScale: 0.75,
  minimapCellSize: 0, // options.minimapScale * cellSize
  minimapOffset: {x: 0, y: 0},
  minimapOpacity: 0.8,
  minimapRenderRays: true,

  crosshair: true,
  crosshairR: 2,
  crosshairD: 0,
  compass: true,
  fpsCounter: true,
  overlayElements: true,

  fullscreen: false,
  mapEditorEnabled: true,
  mobileControls: false,
  // fov, fontSize, and lineWidth now updated by initGame.js/init().
  fov: 70, // player fov
  lineWidth: screenW > 960 ? 2 : 2,     // changes width/number of "strips" drawn
  fontSize: Math.floor(screenW * 0.022),

  touchSensitivity: 0.2,
  horizontalMouseSensitivity: 0.36,
  verticalMouseSensitivity: 0.34,
  lockVerticalLook: false,
  noFog: false,
  alwaysSprint: false
};
// Object.entries(options).forEach((item, i) => { console.log(item); });

options.crosshairD = options.crosshairR*2;
screenW = Math.floor(screenW / options.lineWidth) * options.lineWidth;
var center = {x: screenW*0.5, y: screenH*0.5}
/*if (options.crosshair) {
  document.getElementById('testCursor').style.display = 'block';
} else {
  document.getElementById('testCursor').style.display = 'none';
}*/

var cheats = {
  godMode: false, // TODO: Make sure this is disabled before sharing.
};

var colors = {
  wallDefault: "#282828",
  floorTop: "#2e3933",
  floorBottom: "#4e584f",
  ceilingTop: "#748cbb",
  ceilingBottom: "#b1d4e9",
  fog: "#b1cee0",
  wall: "#309db4",
  wallDark: "#406068",
  rays: "#ffa600",
  overlayTextFill: "#1a1a1a",
  overlayTextStroke: "#b8b8b8",
  crosshair: "#f0f0f0e0",
};

var floorColors = [0, "#4e584f", 1, "#2e3933"];
var ceilingColors = [0.2, "#748cbb", 1, "#b1d4e9"];

var fontSizes = {
  timer: options.fontSize * 0.7,
  health: options.fontSize * 1.2,
  tempDeath: options.fontSize * 6,
  fps: options.fontSize * 0.7,
};




//--------------------------------------------------------------------------------------------------------------------------------|Mathmatical Constant Variables
const twoPi = Math.PI * 2;
const halfPi = Math.PI * 0.5;
const cellSize = 18;
const fiveCellSize = cellSize * 5;
const playerSize = 8;
const playerCollisionSize = 0.2;
const textureRez = 64;              // standard texture pixel resolution (assumes square textures)
var fov = toRadians(options.fov);   // player fov
var halfFov = fov * 0.5;

// Now initiated by initGame.js/init().
// const viewDist = center.x / Math.tan(fov / 2);
// const heightOffsetMult = screenH / toRadians(45);
// const halfHeightOffsetMult = heightOffsetMult * 0.5;
// const numOfRays = Math.floor(screenW / options.lineWidth);
// const angleStep = fov / numOfRays;




//--------------------------------------------------------------------------------------------------------------------------------|Control Variables
var pause = true;
var lmbNum = 0;
var rmbNum = 2;
var lmbIsDown = false;
var rmbIsDown = false;
var mapEditorVisible = false;

var controlDefaults = {
  move_yNeg: 'w',
  move_xNeg: 'a',
  move_yPos: 's',
  move_xPos: 'd',
  move_sprint: 'shift',
  move_jump: ' ',
  look_recenter: 'z',
  look_turnLeft: 'arrowleft',
  look_turnRight: 'arrowright',
  action_activate: 'e',
  action_primaryAttack: 'f',
  // action_secondaryAttack: '?',
  weapon_switch1: '1',
  weapon_switch2: '2',
  weapon_switch3: '3',
  weapon_switch4: '4',
  ui_pause: 'tab'
};

var controlKeys = {
  move_yNeg: 'w',
  move_xNeg: 'a',
  move_yPos: 's',
  move_xPos: 'd',
  move_sprint: 'shift',
  move_jump: ' ',
  look_recenter: 'z',
  look_turnLeft: 'arrowleft',
  look_turnRight: 'arrowright',
  action_activate: 'e',
  action_primaryAttack: 'f',
  // action_secondaryAttack: '?',
  weapon_switch1: '1',
  weapon_switch2: '2',
  weapon_switch3: '3',
  weapon_switch4: '4',
  ui_pause: 'tab'
};

document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;




//--------------------------------------------------------------------------------------------------------------------------------|Loop Variables
const logicTick = 12;
var lastLogicLoopTime = 0;
var totalLogicTicks = 0;
const renderTick = 20; // 40 = ~25 fps
var lastRenderLoopTime = 0;
// var totalRenderTicks = 0;

var zBuffer = [];
function clearZBuffer() { // Also initiates zBuffer.
  for (var i=0; i<screenH; i++) {
    //zBuffer[i] = Array.apply(null, Array(numOfRays));
    zBuffer[i] = Array.apply(null, Array(numOfRays)).map(function() { return {distance: null, r: 0, g: 0, b: 0, a:0}; });
  }
}
// clearZBuffer();  // Initiated by initGame.js/init() (if this was being used, which it currently isn't)




//--------------------------------------------------------------------------------------------------------------------------------|Various Data Arrays
var spriteMap = [];
var visibleSprites = [];
var decalMap = [];
// var oldVisibleSprites = [];
var enemies = [];
var visibleEnemies = [];
var projectiles = [];
var combinedSprites = [];




//--------------------------------------------------------------------------------------------------------------------------------|Canvas Declaration
var canvas, context, overlayCanvas, overlayContext;
// offscreen canvas/context and screenImgData used for zBuffer rendering method.
// var offscreenContext, screenImgData, screenImgWidth, screenImgLength;

// Initiated by initGame.js/init()
function init_canvases() {
  canvas = document.createElement("canvas");
  canvas.setAttribute("width", screenW);
  canvas.setAttribute("height", screenH);
  canvas.setAttribute("z-index", "-2");
  canvas.style.position = "absolute";
  canvas.style.top = 0;
  canvas.style.left = 0;
  // document.body.appendChild(canvas);
  document.getElementById('canvasContainer').appendChild(canvas);
  context = canvas.getContext("2d",  { alpha: false });

  overlayCanvas = document.createElement("canvas");
  overlayCanvas.setAttribute("width", screenW);
  overlayCanvas.setAttribute("height", screenH);
  overlayCanvas.setAttribute("z-index", "2");
  overlayCanvas.style.position = "absolute";
  overlayCanvas.style.top = 0;
  overlayCanvas.style.left = 0;
  // document.body.appendChild(overlayCanvas);
  document.getElementById('canvasContainer').appendChild(overlayCanvas);
  overlayContext = overlayCanvas.getContext("2d");

  // canvas.offscreenCanvas = document.createElement("canvas");
  // canvas.offscreenCanvas.width = canvas.width / options.lineWidth;
  // canvas.offscreenCanvas.height = canvas.height;
  // offscreenContext = canvas.offscreenCanvas.getContext("2d");


  // Disable image smoothing of canvas contexts for pixel perfect image rendering.
  context.webkitImageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false;
  overlayContext.webkitImageSmoothingEnabled = false;
  overlayContext.mozImageSmoothingEnabled = false;
  overlayContext.imageSmoothingEnabled = false;
  // offscreenContext.webkitImageSmoothingEnabled = false;
  // offscreenContext.mozImageSmoothingEnabled = false;
  // offscreenContext.imageSmoothingEnabled = false;


  // screenImgData = offscreenContext.createImageData(canvas.width / options.lineWidth, canvas.height);
  // screenImgWidth = screenImgData.width;
  // screenImgLength = screenImgData.data.length;
}




//--------------------------------------------------------------------------------------------------------------------------------|Math/Helper Functions
function fixFishEye(distance, angle, playerAngle) {
  let diff = playerAngle - angle;
  return distance * Math.cos(diff);
}


function toRadians(deg) { return (deg * Math.PI) / 180; }

function roundRadian(num) { return ((num % twoPi) + twoPi) % twoPi; }


function sqr(num) { return num * num; }

function distanceSquared(x1,y1, x2,y2) { return sqr(x2 - x1) + sqr(y2 - y1); }

function distance(x1,y1, x2,y2) { return Math.sqrt(distanceSquared(x1,y1, x2,y2)); }


function getAngle(x1,y1, x2,y2) {
  let adj = x2 - x1;
  let opp = y2 - y1;
  return adj >= 0
    ? ( Math.atan(opp/adj) % twoPi + twoPi ) % twoPi
    : ( Math.atan(opp/adj) % twoPi + twoPi ) % twoPi - Math.PI;
}


function toHex(decimal) { // TODO: Check if this is still being used anywhere.
  let dec = Math.floor(parseFloat(decimal));
  if (dec < 10) {
    return "0" + dec;
  } else if (dec < 16 && dec >= 10) {
    return "0" + dec.toString(16);
  } else {
    return dec.toString(16);
  }
}


// Distance to segment function based off: https://stackoverflow.com/a/1501725
// Finds shortest distance between a point and a line segment. line1 and line2 represent the end points of the line segment.
function distToSegmentSquared(point, line1,line2) {
  let lineLength2 = distanceSquared(line1.x,line1.y, line2.x,line2.y);
  if (lineLength2 == 0) { return distanceSquared(point.x,point.y, line1.x,line1.y); }

  let t = ((point.x - line1.x) * (line2.x - line1.x) + (point.y - line1.y) * (line2.y - line1.y)) / lineLength2;
  t = Math.max(0, Math.min(1, t));

  return distanceSquared(point.x,point.y, line1.x + t * (line2.x - line1.x), line1.y + t * (line2.y - line1.y));
}

function distToSegment(point, line1,line2) { return Math.sqrt(distToSegmentSquared(point, line1,line2)); }


function average(array) { return array.reduce((a, b) => a + b) / array.length; }


function randomInRange(min, max) { return Math.random() * (max - min) + min; }




//--------------------------------------------------------------------------------------------------------------------------------|Timer Factory
// TimerFactory allows for all timers to updated uniformly.
const TimerFactory = {
  allTimers: [],

  newTimer: function(duration) {
    let _newTimer = new Timer(duration);
    this.allTimers.push(_newTimer);
    return _newTimer;
  },

  newSingleActionTimer: function(duration, action, actionArgs) {
    let _newTimer = new SingleActionTimer(duration, action, actionArgs);
    this.allTimers.push(_newTimer);
    return _newTimer;
  },

  newLoopingTimer: function(duration) {
    let _newTimer = new LoopingTimer(duration);
    this.allTimers.push(_newTimer);
    return _newTimer;
  },

  newActionLoopingTimer: function(duration, action, actionArgs) {
    let _newTimer = new ActionLoopingTimer(duration, action, actionArgs);
    this.allTimers.push(_newTimer);
    return _newTimer;
  },


  // Iterates over every timer within this.allTimers
  forEachTimer: function(action) {
    for (var i=0; i<this.allTimers.length; i++) {
      action.call(this.allTimers[i]);
    }
  },

  // Update every timer within this.allTimers
  updateAllTimers: function(timeDelta) {
    this.forEachTimer(function() { this.update(timeDelta); });
  },

  // Deletes inputted timer from this.allTimers - Doesn't fully delete object if another reference to it exists.
  deleteTimer: function(timerObj) {
    let i = this.allTimers.indexOf(timerObj);
    if (i == -1) { return false; }
    this.allTimers.splice(i, 1);
  }
};




//--------------------------------------------------------------------------------------------------------------------------------|Timer Classes
class Timer {
  constructor(duration) {
    this.time = duration;
    this.duration = duration;
    this.pause = false;
    this.progress = 0;
  }

  update(timeDelta) {
    if (this.pause) { return; }
    this.time -= timeDelta;

    if (this.time <= 0) {
      this.progress = 1;
    } else {
      this.progress = -1 * (this.time / this.duration - 1);
    }
  }

  isFinished() {
    if (this.time <= 0) {
      return true;
    } else {
      return false;
    }
  }

  newDuration(duration) {
    this.duration = duration;
    this.time = duration;
    this.progress = 0;
  }

  reset() {
    this.time = this.duration;
    this.progress = 0;
  }

  pauseUpdate(override) {
    if (typeof override == 'boolean') { this.pause = override; }
    else { this.pause = !this.pause; }
  }
}


// Note: An object cannot fully delete itself, if an additional reference outside the TimerFactory exists.
class SingleActionTimer extends Timer {
  constructor(duration, action, actionArgs = []) {
    super(duration);
    // Function reference that will be called when the timer finishes.
    this.action = action;
    // Array of argument values for action function.
    this.actionArgs = actionArgs;
  }

  update(timeDelta) {
    if (this.pause) { return; }
    this.time -= timeDelta;

    if (this.time <= 0) {
      this.action(...this.actionArgs);
      TimerFactory.deleteTimer(this);
    } else {
      this.progress = -1 * (this.time / this.duration - 1);
    }
  }
}


// Note: Only resets if 'isFinished' is called, this prevents the timer from reseting without the appropriate action being executed.
class LoopingTimer extends Timer {
  constructor(duration) {
    super(duration);
    this.iterations = 0;
  }

  isFinished() {
    if (this.time <= 0) {
      this.reset();
      this.iterations++;
      return true;
    } else {
      return false;
    }
  }
}


class ActionLoopingTimer extends LoopingTimer {
  constructor(duration, action, actionArgs = []) {
    super(duration);
    // Function reference that will be called when the timer finishes.
    this.action = action;
    // Array of argument values for action function.
    this.actionArgs = actionArgs;
  }

  update(timeDelta) {
    if (this.pause) { return; }
    this.time -= timeDelta;

    if (this.time <= 0) {
      this.reset();
      this.iterations++;
      this.action(...this.actionArgs);
    } else {
      this.progress = -1 * (this.time / this.duration - 1);
    }
  }
}

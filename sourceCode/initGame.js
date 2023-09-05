function init() {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop)
  }); // Get URL search parameters.

  if (params.screenW == null) {
    screenW = screenWidth = window.innerWidth;
  } else {
    screenW = screenWidth = params.screenWidth;
  } // TODO: Setting screen size via params not currently implemented.
  if (params.screenH == null) {
    screenH = screenHeight = window.innerHeight;
  } else {
    screenH = screenHeight = params.screenHeight;
  }


  options.fov = screenW > 1440 ? 70 : 60;
  options.fontSize = Math.floor(screenW * 0.022);
  options.lineWidth = 4;
  screenW = Math.floor(screenW / options.lineWidth) * options.lineWidth;
  center = {x: screenW*0.5, y: screenH*0.5}

  heightOffsetMult = screenH / toRadians(45);
  halfHeightOffsetMult = heightOffsetMult * 0.5;
  numOfRays = Math.floor(screenW / options.lineWidth);
  angleStep = fov / numOfRays;

  init_canvases(); // Creates canvases and sets various properties.
  // clearZBuffer();

  overlayCanvas.requestPointerLock = overlayCanvas.requestPointerLock || overlayCanvas.mozRequestPointerLock || overlayCanvas.webkitRequestPointerLock;


  // Initiate mapData set based on URL parameter.
  if (params.map == null) {
    console.error("Map parameter == null - default map loaded");
    mapDataOptions['defaultMap'].init();
  } else {
    loadJSON('./mapData/' + params.map + '.json',
      (data) => { init_mapData.call(data); },
      (xhr) => { mapDataLoadError(xhr, params.map); }
    );
  }

  init_heldItemRenderData();
  playerHud.init();
  player.init();
  // updateOptionValues();

  // startGame now called by init_mapData() or MapData.init(), which itself is called by the above loadJSON call
  // setTimeout(startGame, 5);
}


function startGame() {
  if (document.readyState !== 'complete') {
    setTimeout(startGame, 5);
    return;
  }

  updateOptionValues();

  if (options.mapEditorEnabled) {
    init_mapEditor();
  } else {
    localStorage.removeItem('mapEditorReturn');
  }

  document.getElementById('simpleLoadingScreen').style.display = 'none';

  logicLoop();
  renderLoop(window.performance.now());
  pauseUpdate(false);
}

setTimeout(init, 5);




//--------------------------------------------------------------------------------------------------------------------------------|Update Option Values
function updateOptionValues() {
  var lsOptions = JSON.parse(localStorage.getItem('generalOptions'));
  var lsGraphics = JSON.parse(localStorage.getItem('graphicOptions'));
  var lsControls = JSON.parse(localStorage.getItem('controlOptions'));

  options.minimap = lsOptions.toggleMinimap;
  options.minimapScale = lsOptions.minimapScale;
  options.minimapCellSize = lsOptions.minimapScale * cellSize;
  minimapWidth = options.minimapCellSize * currentMap[0].length;
  minimapHeight = options.minimapCellSize * currentMap.length;
  options.minimapOpacity = lsOptions.minimapOpacity;

  options.compass = lsOptions.toggleCompass;
  options.crosshair = lsOptions.toggleCrosshair;
  /*if (lsOptions.toggleCrosshair) {
    document.getElementById('testCursor').style.display = 'block';
  } else {
    document.getElementById('testCursor').style.display = 'none';
  }*/
  options.fpsCounter = lsOptions.toggleFpsCounter;
  options.horizontalMouseSensitivity = lsOptions.horizontalMouseSensitivity;
  options.verticalMouseSensitivity = lsOptions.verticalMouseSensitivity;
  options.lockVerticalLook = lsOptions.toggleLockVerticalLook;
  if (options.lockVerticalLook) { player.verticalAngle = 0; }
  options.alwaysSprint = lsOptions.toggleAlwaysSprint;


  // TODO: Changing lineWidtyh breaks sprite rendering.
  // options.lineWidth = lsGraphics.lineWidth;
  // screenW = Math.floor(screenW / options.lineWidth) * options.lineWidth;
  // numOfRays = Math.floor(screenW / options.lineWidth);

  options.fov = lsGraphics.fov;
  fov = toRadians(options.fov);
  halfFov = fov * 0.5;
  viewDist = (center.x / Math.tan(fov / 2)) * 1.12;
  angleStep = fov / numOfRays;
  options.noFog = !lsGraphics.fog;


  if (lsControls !== null) {
    Object.entries(lsControls).forEach((item, i) => { controlKeys[item[0]] = item[1]; });
  }
}

//--------------------------------------------------------------------------------------------------------------------------------|Logic Loop
function logicLoop() {
  if (!pause) {
    var now = window.performance.now();
    var timeDelta = now - lastLogicLoopTime;
    var cycleDelay = logicTick;
    if (timeDelta > cycleDelay) {
      cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay));
    }

    TimerFactory.updateAllTimers(timeDelta);

    // player.movement(timeDelta);
    player.update(timeDelta);
    enemyUpdates(timeDelta, now);
    projectileUpdates(timeDelta);

    updateOverlayParticles(timeDelta);
    updateWorldParticles(timeDelta);

    // itemPickupCheck();

    // TODO: This probably should be done by an event listener or something?
    if (lmbIsDown) { player.useHeldItem(); }

    setTimeout(logicLoop, cycleDelay);
    totalLogicTicks++;
    lastLogicLoopTime = now;
  }
}



var logicToRenderLog = [];
//--------------------------------------------------------------------------------------------------------------------------------|Render Loop
function renderLoop(timeStamp) {
  var now = window.performance.now();
  // var now = timeStamp;
  var timeDelta = now - lastRenderLoopTime;
  var cycleDelay = renderTick;
  if (timeDelta > cycleDelay) {
    cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay));
  }

  context.globalAlpha = 1;
  if (!pause) {
    clearScreen();
    clearOverlayScreen();
    clearSprites();
    // clearZBuffer();

    var rays = getRays();
    renderScene(rays);

    combinedSprites = sortedSprites_combined(visibleSprites, enemies, worldParticles, projectiles);
    renderSprites_combined(rays, combinedSprites);


    //--------------------------------|FPS Display Update
    if (options.fpsCounter) { fpsDisplay.update(timeDelta); }

    //--------------------------------|Overlay Elements
    if (options.overlayElements) { renderOverlayElements(rays); }

    while (logicToRenderLog.length > 0) {
      logicToRenderLog[0].fnc();
      logicToRenderLog.splice(0, 1);
    } // TODO: remove
  }


  if (mapEditorVisible) { // Detects if map editor should be closed.
    if (!JSON.parse(localStorage.getItem('mapEditorReturn')).visible) { toggleMapEditor(); }
  }


  // requestAnimationFrame seems less smooth than setTimeout, even if it can get a higher frame rate
  setTimeout(renderLoop, cycleDelay);
  // window.requestAnimationFrame(renderLoop);
  // totalRenderTicks++;
  lastRenderLoopTime = now;
}




//--------------------------------------------------------------------------------------------------------------------------------|Render Relevant Functions
function clearScreen() {
  context.fillStyle = "#222";
  context.fillRect(0, 0, screenW, screenH);
}


function clearOverlayScreen() {
  overlayContext.clearRect(0, 0, screenW, screenH);
}


function pauseUpdate(override) {
  if (player.dead) {
    if (pause) { pause = false; }
    return;
  }

  if (menu_options.visible || menu_controls.visible) { return; }
  if (typeof override == 'boolean') {
    pause = override;
  } else {
    pause = !pause;
  }

  if (pause) {
    menu_pause.toggle(true);
    document.exitPointerLock();
  } else {
    menu_pause.toggle(false);
    overlayCanvas.requestPointerLock();
    playerMoveCheck();
    lastLogicLoopTime = window.performance.now();
    logicLoop();
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Ray Casting Section
function getVCollision(angle, origin) {
  // const right = Math.abs(Math.floor((angle - halfPi) / Math.PI) % 2);
  const right = (angle > 1.5 * Math.PI || angle < halfPi);

  // x & y
  const firstX = right
    ? Math.floor(origin.x / cellSize) * cellSize + cellSize
    : Math.floor(origin.x / cellSize) * cellSize;
  const firstY = origin.y + (firstX - origin.x) * Math.tan(angle);

  // dx & dy
  const xA = right ? cellSize : -cellSize;
  const yA = xA * Math.tan(angle);

  let wall;
  let nextX = firstX;
  let nextY = firstY;
  var cellX, cellY;


  while (!wall) {
    cellX = right
     ? Math.floor(nextX / cellSize)
     : Math.floor(nextX / cellSize) - 1;
    cellY = Math.floor(nextY / cellSize);

    // if this point is outside of map bounds: do nothing
    if (outOfMapBounds(cellX, cellY)) { break; }


    // Sprite visibility detection
    const spriteMapCell = spriteMap[cellY][cellX];
    if (spriteMapCell && !spriteMapCell.visible) {
      spriteMapCell.visible = true;
      updateSpriteDistance.call(spriteMapCell, cellX,cellY, player);
      visibleSprites.push(spriteMapCell);
    }


    wall = currentMap[cellY][cellX];
    if (typeof wall == "object") { wall = wall.type; }
    if (!wall) { // if this cell is a 0 (empty)
      nextX += xA;
      nextY += yA;
    }
  }


  let mapCell = { x: cellX, y:cellY };
  const dist = distance(origin.x, origin.y, nextX, nextY);

  return {
    angle: angle,
    distance: dist,
    vertical: true,
    right: right,
    up: false,
    wallType: wall,
    // wall: currentMap[cellY][cellX],
    hit: nextY / cellSize,
    mapCell: mapCell
  };
}


function getHCollision(angle, origin) {
  // const up = Math.abs(Math.floor(angle / Math.PI) % 2);
  const up = (angle < 0 || angle > Math.PI);

  const firstY = up
    ? Math.floor(origin.y / cellSize) * cellSize
    : Math.floor(origin.y / cellSize) * cellSize + cellSize;
  const firstX = origin.x + (firstY - origin.y) / Math.tan(angle);

  const yA = up ? -cellSize : cellSize;
  const xA = yA / Math.tan(angle);

  let wall;
  let nextX = firstX;
  let nextY = firstY;
  var cellX, cellY;


  while (!wall) {
    cellX = Math.floor(nextX / cellSize);
    cellY = up
      ? Math.floor(nextY / cellSize) - 1
      : Math.floor(nextY / cellSize);

    // if this point is outside of map bounds: do nothing
    if (outOfMapBounds(cellX, cellY)) { break; }


    // Sprite visibility detection
    const spriteMapCell = spriteMap[cellY][cellX];
    if (spriteMapCell && !spriteMapCell.visible) {
      spriteMapCell.visible = true;
      updateSpriteDistance.call(spriteMapCell, cellX,cellY, player);
      visibleSprites.push(spriteMapCell);
    }


    wall = currentMap[cellY][cellX];
    if (typeof wall == "object") { wall = wall.type; }
    if (!wall) { // if this cell is a 0 (empty)
      nextX += xA;
      nextY += yA;
    }
  }


  let mapCell = { x: cellX, y:cellY };
  const dist = distance(origin.x, origin.y, nextX, nextY);

  return {
    angle: angle,
    distance: dist,
    vertical: false,
    right: false,
    up: up,
    wallType: wall,
    // wall: currentMap[cellY][cellX],
    hit: nextX / cellSize,
    mapCell: mapCell
  };
}


function castRay(angle, rayId) {
  var angle = roundRadian(angle);
  const vCollision = getVCollision(angle, {x: player.x, y: player.y});
  const hCollision = getHCollision(angle, {x: player.x, y: player.y});
  return hCollision.distance >= vCollision.distance ? vCollision : hCollision;
}


function getRays() {
  const initialAngle = player.angle - halfFov;

  return Array.from({ length: numOfRays }, (_, i) => {
    const angle = initialAngle + (i * angleStep);
    const ray = castRay(angle, i);
    return ray;
  });
}




//--------------------------------------------------------------------------------------------------------------------------------|Single Ray Cast
function castSingleRay(owner, angleInput) {
  var angle = roundRadian(angleInput);
  const vCollision = getVCollision(angle, {x: owner.x, y: owner.y});
  const hCollision = getHCollision(angle, {x: owner.x, y: owner.y});

  var returnVal;
  var hitCell;
  var endPoint;

  if (hCollision.distance >= vCollision.distance)
  {
    hitCell = vCollision.mapCell;

    if (vCollision.right) {
      endPoint = { x: hitCell.x, y: vCollision.hit };
    } else {
      endPoint = { x: hitCell.x + 1, y: vCollision.hit };
    }

    returnVal = vCollision;
  }
  else
  {
    hitCell = hCollision.mapCell;

    if (hCollision.up) {
      endPoint = { x: hCollision.hit, y: hitCell.y + 1 };
    } else {
      endPoint = { x: hCollision.hit, y: hitCell.y };
    }

    returnVal = hCollision;
  }

  var wallType = returnVal.wallType;
  returnVal.endPoint = endPoint;


  // Draws line representing the ray onto the minimap.
  // Note: Seems to render under ray casts drawn in renderMinimap when it shouldn't, and results seem erratic.
  if (options.minimap_debug) {
    logicToRenderLog.push({ fnc: function() {
      context.strokeStyle = "#e300ff";
      context.beginPath();
      context.moveTo(options.minimapOffset.x + owner.x * options.minimapScale, options.minimapOffset.y + owner.y * options.minimapScale);
      context.lineTo(options.minimapOffset.x + endPoint.x * options.minimapCellSize, options.minimapOffset.y + endPoint.y * options.minimapCellSize);
      context.closePath();
      context.stroke();
    } });
  } // TODO: remove


  // Cycles type of wall hit - just used to check which wall is hit.
  /*if (wallType < 4 && owner == player) { // TODO: remove
    currentMap[hitCell.y][hitCell.x]++;
  } else if (owner == player) {
    currentMap[hitCell.y][hitCell.x] = 1;
  }*/

  // return hCollision.distance >= vCollision.distance ? vCollision : hCollision;
  return returnVal;
}




//--------------------------------------------------------------------------------------------------------------------------------|Entities Within Line Segment
function entitiesWithinSegment(line1,line2, owner, entities) {
  var entitiesInRange = [];

  for (var i=0; i<entities.length; i++) {
    var entity = entities[i];

    // Continue to next entity if it's the owner of this line.
    if (entity == owner) { continue; }
    // Continue to next enemy if not visible.
    if (!entity.visible) { continue; }

    // Continue to next entity if this one is 'dead' or 'flinching'.
    // if (entity.state == 'dead' || entity.state == 'flinching') { continue; }
    if (entity.state == 'dead') { continue; }

    // Calculate distance and if it's <= entity.radius push a reference into entitiesInRange array.
    var distToLine = distToSegment({x: entity.x, y: entity.y}, line1,line2);
    if (distToLine <= entity.radius_cellSize) { entitiesInRange.push(entity); }
    // Note: Enemies get added to array furthest to closest.
  }

  // Sort entities by distance to line starting point (farthest to nearest).
  // return sortByDistance(entitiesInRange, line1);
  return entitiesInRange;
}


function sortByDistance(entities, point) {
  // If entities is an empty array, return an empty array.
  if (entities.length <= 0) { return []; }
  // If there is only one object in entities, return entities.
  if (entities.length == 1) { return entities; }

  // Calulate the (squared) distance to inputted point for each entity, creating a new array
  // which holds objects with a reference to the relevant entity, and the calculated distance.
  var entityDistances = [];
  for (var i=0; i<entities.length; i++) {
    let entity = entities[i];
    let dx = entity.x - point.x;
    let dy = entity.y - point.y;

    entityDistances.push({entityRef: entity, distanceSquared: dx*dx + dy*dy});
  }

  // Sort new array by distance (farthest to nearest).
  // Note: In testing with player shooting enemies, they seemed to always already be correctly sorted.
  // So it's possible this could be omitted, at least for player owned projectiles.
  // However, further testing is needed first.
  entityDistances.sort((a, b) => { return b.distanceSquared - a.distanceSquared; });

  // Create new array of sorted entity references from the sorted entityDistances.
  var sortedEntities = entityDistances.map(a => a.entityRef);
  return sortedEntities;
}

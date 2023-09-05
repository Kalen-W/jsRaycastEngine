//--------------------------------------------------------------------------------------------------------------------------------|Wall/Floor/Sky Rendering
function renderScene(rays) {
  // viewDist = (center.x / Math.tan(fov / 2)) * 1.1;
  var heightOffset = player.verticalAngle * heightOffsetMult;
  var halfHeightOffset = player.verticalAngle * halfHeightOffsetMult;

  renderFloor(halfHeightOffset);
  renderSky(halfHeightOffset);

  for (var i=0; i<rays.length; i++) {
    var ray = rays[i];
    if (ray.wallType == 0) { continue; }

    if (wallTypes[ray.wallType] == null) {
      var wallType = wallTypes[1];
    } else {
      var wallType = wallTypes[ray.wallType];
    }
    // const wallType = wallTypes[ray.wallType];
    const dist = fixFishEye(ray.distance, ray.angle, player.angle);
    const jumpHeight = player.jumpHeight / dist;
    const wallHeight = Math.round( (viewDist * cellSize + jumpHeight) / dist );
    // const wallHeight = (fiveCellSize / dist) * 277;
    // I honestly have no idea what wall height equation to use.

    var sx = 0;
    var sy = 0;
    var top = Math.round(center.y - (wallHeight - heightOffset - jumpHeight) / 2);
    const textureRez = wallType.atlas.texture.rez;
    const textureX = Math.floor(ray.hit % 1 * textureRez);

    // Uses dark texture variant if this is the left or bottom side of the wall.
    if (ray.vertical) {
      sx = ray.right ? textureRez + textureX : textureX;
    } else {
      sx = ray.up ? textureRez + textureX : textureX;
    }
    sx += wallType.atlas.offset.x;
    sy = wallType.atlas.offset.y;

    context.globalAlpha = 1;
    // context.drawImage(wallsImg, sx,sy, 1,textureRez, i*options.lineWidth,top, options.lineWidth,wallHeight);
    context.drawImage(wallType.atlas.texture.img, sx,sy, 1,textureRez, i*options.lineWidth,top, options.lineWidth,wallHeight);


    // Wall Trigger Rendering
    var _wallTrigger = wallTriggerMap[ray.mapCell.y][ray.mapCell.x];
    if (_wallTrigger != null) {
      if (ray.vertical) {
        var dirIndex = ray.right ? 3 : 1;
      } else {
        var dirIndex = ray.up ? 2 : 0;
      }
      if (_wallTrigger.directions[dirIndex] == 1) {
        if (!_wallTrigger.state) {
          context.drawImage(itemTypes[_wallTrigger.textureName_off].texture.img, textureX,0, 1,textureRez, i*options.lineWidth,top, options.lineWidth,wallHeight);
        } else {
          context.drawImage(itemTypes[_wallTrigger.textureName_on].texture.img, textureX,0, 1,textureRez, i*options.lineWidth,top, options.lineWidth,wallHeight);
        }
      }
    }


    // Prototype fog effect
    if (options.noFog || dist < 220) { continue; }

    let a = Math.pow(1.002, dist-220) - 1;
    if (a > 1) {
      a = 0.99;
    } else if (a <= 0) {
      continue;
    }

    context.globalAlpha = a;
    context.fillStyle = colors.fog;
    context.fillRect(i*options.lineWidth,center.y*0.92 + halfHeightOffset + jumpHeight/2, options.lineWidth,center.y*0.16);
  }
  context.globalAlpha = 1;
}


// I assume doing 2 gradients that cover half the screen each would be better for performance than drawing one for each ray?
function renderFloor(halfHeightOffset) {
  var floorGradient = context.createLinearGradient(0,screenH, 0,-center.y + halfHeightOffset);
  // floorGradient.addColorStop(0, colors.floorBottom);
  // floorGradient.addColorStop(1, colors.floorTop);
  for (var i=0; i<floorColors.length; i+=2) {
    floorGradient.addColorStop(floorColors[i], floorColors[i+1]);
  }

  context.fillStyle = floorGradient;
  context.fillRect(0,screenH, screenW,-center.y + halfHeightOffset);
}


function renderSky(halfHeightOffset) {
  var ceilingGradient = context.createLinearGradient(0,0, 0,center.y + halfHeightOffset);
  // ceilingGradient.addColorStop(0.2, colors.ceilingTop);
  // ceilingGradient.addColorStop(1, colors.ceilingBottom);
  for (var i=0; i<ceilingColors.length; i+=2) {
    ceilingGradient.addColorStop(ceilingColors[i], ceilingColors[i+1]);
  }

  context.fillStyle = ceilingGradient;
  context.fillRect(0,0, screenW,center.y + halfHeightOffset);
}




//--------------------------------------------------------------------------------------------------------------------------------|Sprite Sorting
// Determines distance of each sprite, then orders them from furthest to closest.
function sortedSprites_combined(sprites, enemies, particles, projectiles) {
  let combinedSprites = sprites.concat(enemies, particles, projectiles);

  for (var i=0; i<combinedSprites.length; i++) {
    let sprite = combinedSprites[i];

    // Remove sprite if it has no texture reference.
    if (sprite.textureRef == null) {
      sprite.visible = false;
      combinedSprites.splice(i, 1);
      i--;
      continue;
    }

    let dx = sprite.dx;
    let dy = sprite.dy;
    // Distance is now calculated seperately for every type of entity.

    var angle = Math.atan2(dy, dx) - player.angle;
    if (angle < -Math.PI) { angle += twoPi }
    if (angle >= Math.PI) { angle -= twoPi }

    // Determines at what angle sprites will not be rendered. - larger range given to closer sprites
    if (sprite.distance <= 40) {
      var angleCutoff = fov * 0.88;
    } else if (sprite.distance <= 100) {
      var angleCutoff = fov * 0.62;
    } else {
      var angleCutoff = fov * 0.56;
    }

    // TODO: This prevents sprites outside the player's view from rendering, however,
    // sprites behind walls will still render. Also, this makes sprites on the sprite map
    // basically get checked if they're within view twice, and this method is inferior.
    // Remove sprite if it's outside the player's view.
    if (angle < -angleCutoff || angle > angleCutoff) {
      sprite.visible = false;
      combinedSprites.splice(i, 1);
      i--;
    } else { sprite.visible = true; }
  }
  return combinedSprites.sort((a, b) => { return b.distance - a.distance; });
}




//--------------------------------------------------------------------------------------------------------------------------------|Sprite Clearing
// TODO: Not certain if this is even needed anymore, but it may be best for performance if this is implemented for all sprites.
// Creates oldVisibleSprites then clears visibleSprites.
function clearSprites_combined() { // Not currently used
  oldVisibleSprites = [];
  for (var i=0; i<visibleSprites.length; i++) {
    var sprite = visibleSprites[i];
    oldVisibleSprites[i] = sprite;
    sprite.visible = false;
  }
  visibleSprites = [];
}


function clearSprites() {
  // oldVisibleSprites = [];
  for (var i=0; i<visibleSprites.length; i++) {
    var sprite = visibleSprites[i];
    // oldVisibleSprites[i] = sprite;
    sprite.visible = false;
  }
  visibleSprites = [];
}


function clearEnemies() {
  for (var i=0; i<visibleEnemies.length; i++) {
    var enemy = visibleEnemies[i];
    enemy.visible = false;
  }
  visibleEnemies = [];
}




//--------------------------------------------------------------------------------------------------------------------------------|Sprite Rendering
function renderSprites_combined(rays, spriteArray) {
  var combinedSprites = spriteArray;
  var heightOffset = player.verticalAngle * heightOffsetMult;

  for (var i=0; i<combinedSprites.length; i++) {
    var sprite = combinedSprites[i];
    var img = sprite.textureRef.img;
    var textureRez = sprite.textureRef.rez;

    var dx = sprite.dx;
    var dy = sprite.dy;
    var dist = sprite.distance;
    var spriteAngle = Math.atan2(dy, dx) - player.angle;

    var size = (viewDist * cellSize) / (Math.cos(spriteAngle) * dist);
    // if (sprite.textureRef.rez > sprite.textureRef.width) {
    //   size *= (sprite.textureRef.width / sprite.textureRef.rez);
    // }
    size = size - (size % options.lineWidth); // Aligns sprite with ray lines.
    if (size <= 0) { continue; } // if size <= 0: go to next loop iteration

    const jumpHeight = player.jumpHeight / dist;
    // TODO: Sprite location doesn't look quite right at a distance when viewed at an angle or when rotating.
    var x = Math.tan(spriteAngle) * viewDist;

    // Centers smaller sprites
    if (sprite.textureRef.rez > sprite.textureRef.width) { x += size / 4; }

    var screenXPos = Math.round( center.x + x - size / 2 );
    screenXPos -= (screenXPos % options.lineWidth); // Aligns sprite with ray lines.
    var screenXPosEnd = screenXPos + size;

    if (screenXPos >= screenW) { continue; }
    if (screenXPosEnd < 0) { continue; }

    var top = Math.round( center.y - (size - heightOffset - jumpHeight) / 2 );

    // Moves smaller sprites to the floor
    if (sprite.textureRef.rez > sprite.textureRef.width) { top += size / 2; }
    // Height modifier used by particles - moves top relative to size.
    if (sprite.heightMod != null) { top -= size * sprite.heightMod; }

    var rayDists = [];
    var previousRayDist = null;


    for (var xPos = screenXPos<0 ? 0 : screenXPos; xPos<screenXPosEnd; xPos+=options.lineWidth) {
      if (xPos >= screenW) { break; }

      // Compares current sprite screen position to the aligned ray.
      // rayDist == true if sprite should be behind the wall strip
      var rayDist = rays[xPos / options.lineWidth].distance < dist;

      // If rayDist != previousRayDist an object, with rayDist and xPos, is added to rayDists.
      // Fist iteration will always be added to rayDists (because its compared to null).
      if (rayDist != previousRayDist) {
        rayDists.push({dist: rayDist, x: xPos});
        // context.fillStyle = "#eb00ff";
        // context.fillRect(xPos,0, 1,screenH);
      }

      previousRayDist = rayDist;
    }


    const lastRayDist = rayDists[rayDists.length - 1];
    var textureX = sprite.spriteState * textureRez;
    var dx = screenXPos;
    var sWidth = textureRez;
    var dWidth = size;


    if (rayDists.length == 1) {
      // If rayDists.length == 1 it's either completely visible or completely hidden.
      if (rayDists[0].dist) { continue; }
    } else if (rayDists.length > 2) {
      // This functions the same as the rayDists.length > 1 block, but might be slightly faster?
      if (rayDists[0].dist) {
        dx = rayDists[1].x;
        textureX = ((dx - screenXPos) / size * textureRez) + (sprite.spriteState * textureRez);
        dWidth = lastRayDist.x - rayDists[1].x;
        sWidth = (dWidth / size) * textureRez;
      } else {
        // TODO: I probably won't fix this, but, in the case of ray dists = [false, true, false],
        // a mid section of the sprite should be cut out, which would likely mean drawing two images.
        // This would likely look awkward, so, I'm just drawing the entire sprite in these cases.
      }
    } else if (rayDists.length > 1) {
      if (rayDists[0].dist) {
        dx = rayDists[1].x;
        textureX = ((dx - screenXPos) / size * textureRez) + (sprite.spriteState * textureRez);
        dWidth = size - (dx-screenXPos);
        sWidth = (dWidth / size) * textureRez;
        // if (textureX > 64) { continue; }
      }

      if (lastRayDist.dist == true) {
        sWidth = ((lastRayDist.x - dx) / size) * textureRez;
        dWidth = lastRayDist.x - dx;
      }
    }

    /*context.fillStyle = "#ffffff";
    context.fillRect(dx,top, dWidth,size);
    context.fillStyle = "#00ffff";
    context.fillRect(screenXPos,0, 1,screenH);
    context.fillRect(screenXPosEnd,0, 1,screenH);
    context.fillStyle = "#ffff00";
    context.fillRect(dx,0, 1,screenH);
    context.fillRect(dx + dWidth,0, 1,screenH);*/


    // Prototype fog effect
    if (!options.noFog && dist > 140) {
      let a = (Math.pow(1.002, dist-140) - 2) * -1;
      a = sprite.alpha - (1 - a);
      if (a > 1) {
        a = 1;
      } else if (a <= 0) {
        continue;
      }
      context.globalAlpha = a;
    } else {
      context.globalAlpha = sprite.alpha;
    }


    context.drawImage(img, textureX,0, sWidth,textureRez, dx,top, dWidth,size);
  }
  context.globalAlpha = 1;
}




//--------------------------------------------------------------------------------------------------------------------------------|Prototype Z Buffer Rendering
// Z-Buffer version of renderScene - Not currently used
function renderScene_zBuffer(rays) {
  renderFloor();
  renderSky();

  var heightOffset = player.verticalAngle * heightOffsetMult;

  for (var i=0; i<rays.length; i++) {
    var ray = rays[i];
    const dist = fixFishEye(ray.distance, ray.angle, player.angle);
    var jumpHeight = player.jumpHeight / dist;
    const wallHeight = Math.round( ((viewDist * cellSize) + jumpHeight) / dist );
    var sx = 0;
    var sy = 0;
    var top = Math.round( center.y - ((wallHeight - heightOffset - jumpHeight) / 2) );

    const textureX = Math.floor(ray.hit % 1 * textureRez);
    if (ray.vertical) {
      sx = ray.right ? textureRez + textureX : textureX;
    } else {
      sx = ray.up ? textureRez + textureX : textureX;
    }
    if (ray.wallType <= 4) {
      sy = textureRez * (ray.wallType - 1);
    } else {
      sy = wallTypes[ray.wallType].texture.offset.y;
    }


    for (var row = top<0 ? 0 : top; row < top+wallHeight; row++) {
      if (row >= screenH) { break; }
      //var yPos = Math.floor( ((row - top) / wallHeight) * textureRez ) + (textureRez * (ray.wallType - 1));
      var yPos = Math.floor( ((row - top) / wallHeight) * textureRez ) + sy;
      var p = (wallsImgData.width * yPos * 4) + (sx * 4);

      /*zBuffer[row][i].distance = dist;
      zBuffer[row][i].r = wallsImgData.data[x];
      zBuffer[row][i].g = wallsImgData.data[x + 1];
      zBuffer[row][i].b = wallsImgData.data[x + 2];
      zBuffer[row][i].a = wallsImgData.data[x + 3];*/

      zBuffer[row][i] = {
        distance: dist,
        r: wallsImgData.data[p],
        g: wallsImgData.data[p + 1],
        b: wallsImgData.data[p + 2],
        a: wallsImgData.data[p + 3]
      };
      // if (row == 0) { console.log(row + " | " + i); }
    }
  }

  zBufferToImgData();
  //context.putImageData(screenImgData, 0,0);
  offscreenContext.putImageData(screenImgData, 0,0);
  context.drawImage(canvas.offscreenCanvas, 0,0, screenImgWidth,screenH, 0,0, screenW,screenH);
}


// Z-Buffer version of renderSprites - Not currently used
function renderSprites_zBuffer(rays) {
  sortSprites(visibleSprites);

  var heightOffset = player.verticalAngle * heightOffsetMult;

  for (var i=0; i<visibleSprites.length; i++) {
    var sprite = visibleSprites[i];
    // var img = itemTypes[sprite.type].texture.img;

    var dx = sprite.dx;
    var dy = sprite.dy;
    var dist = sprite.distance;
    var spriteAngle = Math.atan2(dy, dx) - player.angle;
    var size = (viewDist * cellSize) / (Math.cos(spriteAngle) * dist);
    size = size - (size % options.lineWidth); // Aligns sprite with ray lines.

    if (size <= 0) { continue; } // if size <= 0: go to next loop iteration

    var jumpHeight = player.jumpHeight / dist;
    var x = Math.tan(spriteAngle) * viewDist;
    var screenXPos = Math.round(center.x + x - size / 2);
    screenXPos = screenXPos - (screenXPos % options.lineWidth); // Aligns sprite with ray lines.

    var screenXPosEnd = screenXPos + size;
    var top = Math.round( center.y - ((size - heightOffset - jumpHeight) / 2) );


    // Iterates over sprite x position drawing the sprite one strip at a time.
    for (var strip = screenXPos<0 ? 0 : screenXPos; strip < screenXPosEnd; strip++) {
      // Ensures a strip isn't drawn if its off screen.
      if (strip >= screenW / options.lineWidth) { break; }
      // Ensures a strip isn't drawn if the (wall) ray it aligns with is closer to the player.
      var rayI = strip / options.lineWidth;
      if (rays[rayI].distance < dist) { continue; }

      // Determines which column of the texture to draw.
      var textureX = Math.floor( ((strip - screenXPos) / size) * textureRez );
      // Draws the strip
      //context.drawImage(img, textureX,0, 1,textureRez, strip,top, options.lineWidth,size);


      for (var row = top<0 ? 0 : top; row < top+size; row++) {
        if (row >= screenH) { break; }
        var yPos = Math.floor( ((row - top) / size) * textureRez );
        var p = (spriteImgData_armor.width * yPos * 4) + (textureX * 4);

        zBuffer[row][strip/options.lineWidth] = {
          distance: dist,
          // r: wallsImgData.data[p],
          // g: wallsImgData.data[p + 1],
          // b: wallsImgData.data[p + 2],
          // a: wallsImgData.data[p + 3]
          r: wallsImgData.data[255],
          g: wallsImgData.data[88],
          b: wallsImgData.data[44],
          a: wallsImgData.data[255]
        };
        // if (row == 0) { console.log(row + " | " + strip/options.lineWidth); }
      }
    }
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Minimap Rendering
const rayLength = playerSize * 2;
function renderMinimap(posX=0, posY=0, scale=0.5, rays) {
  // var posX = posX - player.x * scale * 0.5;
  // var posY = posY - player.y * scale * 0.5;
  const mmCellSize = options.minimapCellSize;
  overlayContext.globalAlpha = options.minimapOpacity;

  // Background color
  overlayContext.fillStyle = "#121212e6";
  overlayContext.fillRect(posX,posY, minimapWidth, minimapHeight);

  // Displays map cells
  overlayContext.fillStyle = "#999";
  for (var y=0; y<currentMap.length; y++) {
    for (var x=0; x<currentMap[y].length; x++) {
      // Prototype map data to objects change.
      // if (!currentMap[y][x] && currentMap[y][x].type == null) { continue; }
      // else if (!currentMap[y][x].type) { continue; }
      if (!currentMap[y][x]) { continue; }
      overlayContext.fillRect(posX + x * mmCellSize, posY + y * mmCellSize, mmCellSize, mmCellSize);
    }
  }

  // Displays enemy locations and directions
  for (var i=0; i<enemies.length; i++) {
    let enemy = enemies[i];
    if (enemy.distance > 96) { continue; }
    overlayContext.fillStyle = "#9e4737";
    overlayContext.fillRect(
      posX + enemy.x * scale - enemy.radius_cellSize,
      posY + enemy.y * scale - enemy.radius_cellSize,
      enemy.diameter_cellSize,
      enemy.diameter_cellSize
    );
  }

  // Displays player location
  overlayContext.fillStyle = "#367aa1";
  overlayContext.fillRect(
    posX + player.x * scale - player.radius_cellSize,
    posY + player.y * scale - player.radius_cellSize,
    player.diameter_cellSize,
    player.diameter_cellSize
  );

  // Displays player direction with short line
  overlayContext.strokeStyle = "#4380ac";
  overlayContext.beginPath();
  overlayContext.moveTo(posX + player.x * scale, posY + player.y * scale);
  overlayContext.lineTo(
    posX + (player.x + Math.cos(player.angle) * rayLength) * scale,
    posY + (player.y + Math.sin(player.angle) * rayLength) * scale
  );
  overlayContext.closePath();
  overlayContext.stroke();

  overlayContext.globalAlpha = 1;
}




function renderMinimap_debug(posX=0, posY=0, scale=0.5, rays) {
  const mmCellSize = options.minimapCellSize;
  overlayContext.globalAlpha = options.minimapOpacity;

  // Background color
  overlayContext.fillStyle = "#121212e6";
  overlayContext.fillRect(posX,posY, minimapWidth, minimapHeight);

  // Displays map cells
  overlayContext.fillStyle = "#999";
  for (var y=0; y<currentMap.length; y++) {
    for (var x=0; x<currentMap[y].length; x++) {
      if (!currentMap[y][x]) { continue; }
      overlayContext.fillRect(posX + x * mmCellSize, posY + y * mmCellSize, mmCellSize, mmCellSize);
    }
  }

  // Displays ray casts
  if (options.minimapRenderRays) {
    overlayContext.strokeStyle = colors.rays;
    for (var i=0; i<rays.length; i++) {
      let ray = rays[i];
      overlayContext.beginPath();
      overlayContext.moveTo(posX + player.x * scale, posY + player.y * scale);
      overlayContext.lineTo(
        posX + (player.x + Math.cos(ray.angle) * ray.distance) * scale,
        posY + (player.y + Math.sin(ray.angle) * ray.distance) * scale
      );
      overlayContext.closePath();
      overlayContext.stroke();
    }
  }

  // Displays enemy locations and directions
  for (var i=0; i<enemies.length; i++) {
    let enemy = enemies[i];
    overlayContext.fillStyle = "#9e4737";
    overlayContext.fillRect(
      posX + enemy.x * scale - enemy.radius_cellSize,
      posY + enemy.y * scale - enemy.radius_cellSize,
      enemy.diameter_cellSize,
      enemy.diameter_cellSize
    );

    overlayContext.strokeStyle = "#f43b1a";
    overlayContext.beginPath();
    overlayContext.moveTo(posX + enemy.x * scale, posY + enemy.y * scale);
    overlayContext.lineTo(
      posX + (enemy.x + Math.cos(enemy.lookAngle) * rayLength) * scale,
      posY + (enemy.y + Math.sin(enemy.lookAngle) * rayLength) * scale
    );
    overlayContext.closePath();
    overlayContext.stroke();
  }

  // Displays player location
  overlayContext.fillStyle = "#367aa1";
  overlayContext.fillRect(
    posX + player.x * scale - player.radius_cellSize,
    posY + player.y * scale - player.radius_cellSize,
    player.diameter_cellSize,
    player.diameter_cellSize
  );

  // Displays player direction with short line
  overlayContext.strokeStyle = "#4380ac";
  overlayContext.beginPath();
  overlayContext.moveTo(posX + player.x * scale, posY + player.y * scale);
  overlayContext.lineTo(
    posX + (player.x + Math.cos(player.angle) * rayLength) * scale,
    posY + (player.y + Math.sin(player.angle) * rayLength) * scale
  );
  overlayContext.closePath();
  overlayContext.stroke();

  // Displays projectile locations
  overlayContext.fillStyle = "#ff00ff";
  for (var i=0; i<projectiles.length; i++) {
    let projectile = projectiles[i];
    overlayContext.fillRect(
      posX + projectile.x * scale - projectile.radius_cellSize * 2,
      posY + projectile.y * scale - projectile.radius_cellSize * 2,
      projectile.diameter_cellSize * 2,
      projectile.diameter_cellSize * 2
    );
  }

  overlayContext.globalAlpha = 1;
}

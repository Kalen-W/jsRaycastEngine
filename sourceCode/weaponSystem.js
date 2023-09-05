//--------------------------------------------------------------------------------------------------------------------------------|Base Weapon Class
// Set projectile damage when it's spawned instead of defining it within projTypes?
class Weapon {
  constructor(owner, damage, pierceAmount, projType, useTime) {
    this.owner = owner;
    this.damage = damage;
    this.pierceAmount = pierceAmount;
    this.projType = projType;
    // this.animationTimer = TimerFactory.newTimer(450);
    this.animationTimer = TimerFactory.newActionLoopingTimer(useTime, function(){this.resetTimer()}.bind(this));
    this.animationTimer.pauseUpdate(true);
    this.firing = false;
  }

  resetTimer() {
    this.animationTimer.reset();
    this.animationTimer.pauseUpdate(true);
    this.firing = false;
  } // TODO: Don't have the timer reset if the fire button is still held down.

  use() {
    if (this.firing) { return; }
    this.firing = true;
    this.animationTimer.pauseUpdate(false);
    this.attack();
  }

  hitscanAttack(angle=this.owner.lookAngle, xOff=0, yOff=0) {
    let owner = this.owner; // TODO: Make offset relative to angle.
    var _rayData = castSingleRay({x:owner.x+xOff, y:owner.y+yOff}, angle);
    var entitiesInRange = entitiesWithinSegment({x: owner.x, y: owner.y}, {x: _rayData.endPoint.x*cellSize, y: _rayData.endPoint.y*cellSize}, owner, enemies.concat([player]));

    if (entitiesInRange.length <= 0) { return; }
    entitiesInRange = sortByDistance(entitiesInRange, {x: owner.x, y: owner.y});

    // Enemies get added to array from furthest to closest, so hit detection works through the array backwards.
    var pierceCount = -1;
    for (var i=entitiesInRange.length-1; i>=0; i--) {
      entitiesInRange[i].hit(this.damage);
      pierceCount++;
      if (pierceCount >= this.pierceAmount) { break; }
    }
  }

  projectileAttack(angle=this.owner.lookAngle, xOff=0, yOff=0) {
    projectiles.push(new Projectile(this.owner, this.projType, this.damage, angle, xOff,yOff));
  } // (owner, type, damage, angle, xOffset,yOffset)
}




//--------------------------------------------------------------------------------------------------------------------------------|Base Player Weapon Class
class PlayerWeapon extends Weapon {
  constructor(owner, renderData, damage, pierceAmount, projType, useTime) {
    // (owner, damage, pierceAmount, projType, useTime)
    super(owner, damage, pierceAmount, projType, useTime);
    this.x = renderData.x;
    this.y = renderData.y;
    this.texture = renderData.texture;
    this.scaleFac = renderData.scaleFac;
    this.totalStates = renderData.totalStates;
    this.state = 0;

    this.particleStates = renderData.particleStates;
    this.particleData = renderData.particleData;
    this.particleSpawn = {x: center.x, y: this.y + (40 * this.scaleFac)};
    this.particleSpawnLog = [];
  }

  use() { // Note: Other than clearing particleSpawnLog this is the same as the parent use method.
    if (this.firing) { return; }
    this.firing = true;
    this.animationTimer.pauseUpdate(false);
    this.attack();

    // Clears particleSpawnLog
    this.particleSpawnLog.splice(0,this.particleSpawnLog.length);
  }

  render(ctx) {
    if (this.firing) {
      this.useAnimation();
    } else {
      this.state = 0;
    }
    let rez = this.texture.rez;
    let sx = rez * this.state;
    ctx.drawImage(this.texture.img, sx,0, rez,rez, this.x,this.y, rez*this.scaleFac,rez*this.scaleFac);
  }

  useAnimation() {
    this.state = Math.floor(this.animationTimer.progress * this.totalStates);

    for (var i=0; i<this.particleStates.length; i++) {
      if (this.particleSpawnLog[i] == true) { return; }

      if (this.state == this.particleStates[i]) {
        if (typeof this.particleData[i] == 'undefined') {
          var _data = this.particleData[0];
        } else {
          var _data = this.particleData[i];
        }
        // (x,y, amount, type)
        createOverlayParticles(this.particleSpawn.x+_data[0], this.particleSpawn.y+_data[1], _data[2], _data[3]);
        this.particleSpawnLog[i] = true;
      }
    }
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Enemy Weapon Classes
class Weapon_HitscanPistol extends Weapon {
  constructor(owner) {
    // (owner, damage, pierceAmount, projType, useTime)
    super(owner, 6, 0, null, 450);
  }

  attack() {
    this.hitscanAttack(this.owner.lookAngle);
  }
}


class Weapon_ProjectilePistol extends Weapon {
  constructor(owner) {
    // (owner, damage, pierceAmount, projType, useTime)
    super(owner, 8, null, 0, 450);
  }

  attack() {
    this.projectileAttack(this.owner.lookAngle);
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Player Weapon Classes
// TODO: Balance weapon damage.
class PlayerWeapon_HitscanPistol extends PlayerWeapon {
  constructor(owner) {
    // (owner, renderData, damage, pierceAmount, projType, useTime)
    super(owner, heldItemRenderData.pistol, 7, 1, null, 440);
  }

  attack() {
    this.hitscanAttack(this.owner.lookAngle);
  }
}


class PlayerWeapon_ProjectilePistol extends PlayerWeapon {
  constructor(owner) {
    // (owner, renderData, damage, pierceAmount, projType, useTime)
    super(owner, heldItemRenderData.pistol, 9, null, 0, 440);
  }

  attack() {
    this.projectileAttack(this.owner.lookAngle);
  }
}


class PlayerWeapon_HitscanShotgun extends PlayerWeapon {
  constructor(owner) {
    // (owner, renderData, damage, pierceAmount, projType, useTime)
    super(owner, heldItemRenderData.shotgun, 8, 0, null, 800);
  }

  attack() {
    this.hitscanAttack(this.owner.lookAngle + randomInRange(-0.04, -0.02));
    this.hitscanAttack(this.owner.lookAngle + randomInRange(-0.04, -0.02));

    this.hitscanAttack(this.owner.lookAngle + randomInRange(-0.02, 0.02));
    this.hitscanAttack(this.owner.lookAngle + randomInRange(-0.02, 0.02));

    this.hitscanAttack(this.owner.lookAngle + randomInRange(0.02, 0.04));
    this.hitscanAttack(this.owner.lookAngle + randomInRange(0.02, 0.04));
  }
}


class PlayerWeapon_ProjectileShotgun extends PlayerWeapon {
  constructor(owner) {
    // (owner, renderData, damage, pierceAmount, projType, useTime)
    super(owner, heldItemRenderData.shotgun, 12, null, 1, 800);
  }

  attack() {
    // Left
    this.projectileAttack(this.owner.lookAngle + randomInRange(-0.06, -0.025));
    this.projectileAttack(this.owner.lookAngle + randomInRange(-0.06, -0.025));
    // Center
    this.projectileAttack(this.owner.lookAngle + randomInRange(-0.025,  0.025));
    this.projectileAttack(this.owner.lookAngle + randomInRange(-0.025,  0.025));
    // Right
    this.projectileAttack(this.owner.lookAngle + randomInRange( 0.025,  0.06));
    this.projectileAttack(this.owner.lookAngle + randomInRange( 0.025,  0.06));
  }
}


class PlayerWeapon_ProjectileMachineGun extends PlayerWeapon {
  constructor(owner) {
    // (owner, renderData, damage, pierceAmount, projType, useTime)
    super(owner, heldItemRenderData.machineGun, 8, null, 0, 200);
  }

  attack() {
    this.projectileAttack(this.owner.lookAngle);
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Held Item Render Data
const heldItemRenderData = {
  pistol: {scaleFac: 12, totalStates: 5,
    particleStates: [2], particleData: [[0,0, 6, 'smoke']],
    texture: TextureFactory.newTexture("weaponSprites/wolfensteinWeapon-pistol.png", 64,64)
  },
  machineGun: {scaleFac: 16, totalStates: 5,
    particleStates: [2], particleData: [[0,0, 6, 'smoke']],
    texture: TextureFactory.newTexture("weaponSprites/wolfensteinWeapon-machineGun.png", 64,64)
  },
  shotgun: {scaleFac: 16, totalStates: 5,
    particleStates: [2], particleData: [[0,0, 6, 'smoke']],
    texture: TextureFactory.newTexture("weaponSprites/wolfensteinWeapon-pistol.png", 64,64)
  },
};


// Called by initGame.js/init()
// Sets x and y screen position data with relation to screen size.
function init_heldItemRenderData() {
  Object.entries(heldItemRenderData).forEach((item, i) => {
    let rez = item[1].texture.rez;
    item[1].x = (center.x - rez * 0.5 * item[1].scaleFac) - (item[1].texture.w * item[1].scaleFac * 0.5) / rez;
    item[1].y = screenH - rez * item[1].scaleFac;
  });
}




//--------------------------------------------------------------------------------------------------------------------------------|Projectile Types
const projectileTypes = [
  {speed: 0.3, pierceAmount: 1, radius: 0.04, texture: TextureFactory.newTexture("weaponSprites/simpleProjectile-brass.png", 32,32)},
  {speed: 0.26, pierceAmount: 0, radius: 0.04, texture: TextureFactory.newTexture("weaponSprites/simpleProjectile-steel.png", 32,32)},
];




//--------------------------------------------------------------------------------------------------------------------------------|Projectile Class
class Projectile {
  constructor(owner, type, damage, angle, xOffset,yOffset) {
    this.owner = owner;
    this.x = owner.x + xOffset; // TODO: Make projectile offset relative to the angle.
    this.y = owner.y + yOffset;
    this.textureRef = projectileTypes[type].texture;
    this.spriteState = 0;
    this.alpha = 1;

    this.speed = projectileTypes[type].speed * cellSize;
    this.damage = damage;
    this.pierceAmount = projectileTypes[type].pierceAmount;
    this.pierceCount = -1;
    this.radius = projectileTypes[type].radius;
    this.radius_cellSize = projectileTypes[type].radius * cellSize;
    this.diameter_cellSize = projectileTypes[type].radius * 2 * cellSize;

    this.moveAngle = angle;
    this.relevant = true;
    this.hitEntities = [];

    this.rayData = castSingleRay(owner, angle);
    this.endX = this.rayData.endPoint.x * cellSize;
    this.endY = this.rayData.endPoint.y * cellSize;
    this.xDir = this.x >= this.endX ? -1 : 1;
    this.yDir = this.y >= this.endY ? -1 : 1;
  }

  update(timeDelta) {
    updateDistance.call(this, player);
    this.movement(timeDelta);
    // this.collisionCheck();
  }

  movement(timeDelta) {
    var mul = timeDelta / logicTick;
    var moveStep = mul * this.speed;
    var newX = this.x;
    var newY = this.y;

    newX += Math.cos(this.moveAngle) * moveStep;
    newY += Math.sin(this.moveAngle) * moveStep;

    // Checks if projectile has passed the end point calulated by ray cast on creation.
    if (((this.xDir == -1 && this.x <= this.endX) || (this.xDir == 1 && this.x >= this.endX))
    && ((this.yDir == -1 && this.y <= this.endY) || (this.yDir == 1 && this.y >= this.endY))) {
      this.relevant = false;
    } else {
      this.collisionCheck(newX, newY);
      if (!this.relevant) { return; }
      this.x = newX;
      this.y = newY;
    }
    /*
    // Test extra wall collision checks
    var midX = this.x + (newX - this.x) / 2;
    var midY = this.y + (newY - this.y) / 2;
    var quarterX = this.x + (midX - this.x) / 2;
    var quarterY = this.y + (midY - this.y) / 2;
    var threeQuarterX = midX + (newX - midX) / 2;
    var threeQuarterY = midY + (newY - midY) / 2;

    // Update: Extra collision checks seem to help, but projectiles can still clip through corners.
    // Best solution would probably be to copy raycasting used for wall rendering.
    if (collidesWithMap(newX/cellSize, newY/cellSize) || collidesWithMap(midX/cellSize, midY/cellSize) || collidesWithMap(quarterX/cellSize, quarterY/cellSize) || collidesWithMap(threeQuarterX/cellSize, threeQuarterY/cellSize)) {
      this.relevant = false;
    } else {
      this.collisionCheck(newX, newY);
      if (!this.relevant) { return; }
      this.x = newX;
      this.y = newY;
    }
    */
  }

  collisionCheck(newX, newY) {
    // Get array of enemies within line segment (starting point = current position and end point = new position).
    var entitiesInRange = entitiesWithinSegment({x: this.x, y: this.y}, {x: newX, y: newY}, this.owner, enemies.concat([player]));

    if (entitiesInRange.length <= 0) { return; }
    entitiesInRange = sortByDistance(entitiesInRange, {x: this.x, y: this.y});

    if (this.pierceAmount == 0) {
      entitiesInRange[entitiesInRange.length-1].hit(this.damage);
      this.relevant = false;
      return;
    }

    // Enemies get added to array from furthest to closest, so hit detection works through the array backwards.
    for (var i=entitiesInRange.length-1; i>=0; i--) {
      // Prevents an entity from getting hit by the same projectile twice.
      if (this.hitEntities.length > 0) {
        if (this.hitEntities.includes(entitiesInRange[i])) { continue; }
      }

      entitiesInRange[i].hit(this.damage);
      this.pierceCount++;
      this.hitEntities.push(entitiesInRange[i]);

      if (this.pierceCount >= this.pierceAmount) {
        this.relevant = false;
        break;
      }
    }
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Projectile Functions
function projectileUpdates(timeDelta) {
  if (projectiles.length <= 0) { return; }

  for (var i=0; i<projectiles.length; i++) {
    projectiles[i].update(timeDelta);

    // Removes projectile if it's no longer relevant, i.e. it hits a wall, enemy, or the player.
    if (!projectiles[i].relevant) {
      projectiles.splice(i, 1);
      // Decreases i so that next projectile doesn't get skipped over.
      i--;
    }
  }
}

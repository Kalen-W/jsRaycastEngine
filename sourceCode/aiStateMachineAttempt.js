// https://github.com/jakesgordon/javascript-state-machine
//--------------------------------------------------------------------------------------------------------------------------------|Class / State Machine Factory
var EnemySmAi = StateMachine.factory({
  init: 'idle',
  /* States:
     - idle       (listening for events that will awaken it)
     - pursuing   (moves directly towards target after awakening)
     - wandering  (moves in a random direction)
     - dead       (stops all actions when health <= 0)
     - flinching  (pauses all actions when damaged)
     - meleeing   (performs a melee attack)
     - ranging    (performs a range attack)
  */
  transitions: [
    {name: 'awaken',    from: 'idle',                    to: 'pursuing'},                // awakened by event                 =  begins 'pursuing'
    {name: 'changeDir', from: 'pursuing',                to: 'wandering'},               // pursuit path is blocked           =  begins 'wandering'
    {name: 'changeDir', from: 'wandering',               to: 'pursuing'},                // wandered for x time / saw target  =  resumes 'pursuing'
    {name: 'sleep',     from: ['pursuing', 'wandering'], to: 'idle'},                    // target is lost or killed          =  returns to 'idle'

    {name: 'die',       from: '*',                       to: 'dead'},                    // health <= 0                       =  becomes 'dead'
    {name: 'flinch',    from: '*',                       to: 'flinching'},               // takes damage                      =  begins 'flinching'
    {name: 'flinched',  from: 'flinching',               to: function(s) { return s; }}, // flinched for x time               =  resumes previous state (inputted)

    {name: 'attack',    from: 'pursuing',                to: function(s) { return s; }}, // target within range               =  begins 'meleeing' / 'ranging' (inputted)
    {name: 'attacked',  from: ['meleeing', 'ranging'],   to: function(s) { return s; }}  // finished attack                   =  continues attack if in range, else resumes pursuing
  ],
  // Note: 'flinching' can be entered from 'dead', this may need changed, or could be used for some effect when hitting a dead ai.


  data: function(id, type, x,y, lookAngle=0) {
    return {
      // id is equal to the order enemies were initiated, and should act as a unique identifier.
      id: id,
      // type is used to reference enemyTypes for various stats.
      type: type,
      // textureRef used for sprite rendering
      textureRef: enemyTypes[type].texture,
      x: x * cellSize,
      y: y * cellSize,
      radius: enemyTypes[type].radius,
      diameter: enemyTypes[type].radius * 2,
      radius_cellSize: enemyTypes[type].radius * cellSize,
      diameter_cellSize: enemyTypes[type].radius * 2 * cellSize,

      // Holds a state name reference so that after flinching it can return to it's previous state.
      flinchedReturnState: '',
      // Determines how long the flinch state lasts.
      flinchTimer: TimerFactory.newTimer(176),
      // Determines how long the wander state lasts.
      wanderTimer: TimerFactory.newTimer(2048),
      // Determines duration/speed of death animation.
      deathAniTimer: TimerFactory.newTimer(512),
      // Determines duration/speed of range attack state/animation.
      rangeTimer_looping: TimerFactory.newLoopingTimer(512),
      attackTimer: TimerFactory.newTimer(1024),
      // Determines how long it will continue pursuing/wandering without direct line of sight to target.
      pursueTimer: TimerFactory.newTimer(4096),

      // Reference to current attack target. Currently referenced, but never changes.
      target: player,

      speed: 0,
      strafeSpeed: 0,
      moveSpeed: enemyTypes[type].moveSpeed,
      angleMoveSpeed: Math.round(Math.sqrt((enemyTypes[type].moveSpeed * enemyTypes[type].moveSpeed) / 2) * 1000) / 1000,
      rotSpeed: enemyTypes[type].rotSpeed,
      // Direction ai is moving.
      moveAngle: toRadians(0),
      // Direction ai is looking/attacking.
      lookAngle: toRadians(lookAngle),
      directTargetSight: false,
      lookingAtTarget: false,

      spriteState: 0,
      totalSpriteStates: enemyTypes[type].totalSpriteStates,
      // Duration of each walk cycle frame.
      walkCycleTime: enemyTypes[type].walkCycleTime,
      // Number of walk cycle frames.
      numWalkSprites: enemyTypes[type].numWalkSprites,
      // Initial walk cycle frame position on texture atlas.
      walkSpriteOffset: enemyTypes[type].walkSpriteOffset,
      spriteStates: enemyTypes[type].spriteStates,

      health: enemyTypes[type].health,
      // heldItem: new Weapon_HitscanPistol(this),
      heldItem: new Weapon_ProjectilePistol(this),
      visible: false,
      alpha: 1,

      // patrolPoints: [[12, 11, false], [13, 4, false], [10, 3, false]],
      patrolPoints: null,
      attackRange: 14 * cellSize,
      detectionRange: 16 * cellSize,
    }
  },


  methods: {
    //--------------------------------|Testing Console Log Methods
    /*
    onAwaken:    function() { console.log("Enemy[" + this.id + "] - awaken    [" + this.state + "]"); },
    onChangeDir: function() { console.log("Enemy[" + this.id + "] - changeDir [" + this.state + "]"); },
    onSleep:     function() { console.log("Enemy[" + this.id + "] - sleep     [" + this.state + "]"); },
    onDie:       function() { console.log("Enemy[" + this.id + "] - die       [" + this.state + "]"); },
    */
    //--------------------------------|Lifecycle Observer Methods
    onFlinch: function(lc) {
      // console.log("Enemy[" + this.id + "] - flinch    [" + this.state + "]");
      if (lc.from == 'flinching') {
        this.flinchedReturnState = 'pursuing';
      } else {
        this.flinchedReturnState = lc.from;
      }
      this.flinchTimer.reset();
      // this.spriteState = 9;
    },
    onFlinched: function() {
      // console.log("Enemy[" + this.id + "] - flinched  [" + this.state + "]");
      this.spriteState = 0;
    },
    onWandering: function() { // TODO: Make sure the new angle isn't similar to the current one.
      this.moveAngle = Math.random() * twoPi;
      this.wanderTimer.reset();
    },
    onAttack: function() {
      // console.log("Enemy[" + this.id + "] - attack    [" + this.state + "]");
      // this.attackTimer.reset();
      // this.spriteState = 12;
    },
    onAttacked: function() {
      // console.log("Enemy[" + this.id + "] - attacked  [" + this.state + "]");
      this.attackTimer.reset();
      // this.spriteState = 11;
    },


    //--------------------------------|Custom Methods
    initiate: function() {
      this.flinchTimer.pauseUpdate(true);
      this.wanderTimer.pauseUpdate(true);
      this.deathAniTimer.pauseUpdate(true);
      this.rangeTimer_looping.pauseUpdate(true);
      this.attackTimer.pauseUpdate(true);
      this.pursueTimer.pauseUpdate(true);
    },


//--------------------------------------------------------------------------------------------------------------------------------|SM - Update State
    updateState: function(timeDelta) {
      // If idle, close to target and has line of sight on target or looking at target or very close to target: awaken
      if (this.state == 'idle') {
        if ((this.distance < this.detectionRange && this.directTargetSight) || this.lookingAtTarget) {
          this.awaken();
          return;
        }
      }

      if (this.state == 'pursuing') {
        // TODO: ai melee attack

        // If pursuing, close to target, and has line of sight: range attack the target
        if (this.distance < this.attackRange && this.lookingAtTarget) {
          this.attack('ranging');
          return;
        }

        // If far from target and no line of sight: walk straight for a bit, then wander
        if (this.distance > 8 && !this.directTargetSight) {
          if (this.pursueTimer.pause) {
            this.pursueTimer.pauseUpdate(false);
          } else if (this.pursueTimer.isFinished()) {
            this.changeDir();
            this.pursueTimer.reset();
            this.pursueTimer.pauseUpdate(true);
          }
          return;
        }
      }

      if (this.state == 'wandering') {
        // If line of sight on target: begin pursuing (+ reset and pause wanderTimer)
        if (this.directTargetSight) {
          this.changeDir();
          this.wanderTimer.reset();
          this.wanderTimer.pauseUpdate(true);
          return;
        }

        // If wander timer ends without seeing the player: sleep
        if (this.wanderTimer.pause) {
          this.wanderTimer.pauseUpdate(false);
        } else if (this.wanderTimer.isFinished()) {
          this.sleep();
          this.wanderTimer.reset();
          this.wanderTimer.pauseUpdate(true);
        }
      }
      // Note - Outside state transitions:
      // - if hit while idle: pursue (and then flinch)
      // - onFlinched: return to previous state
      // - onAttacked if lookingAtTarget: attack again, else: pursue
    },


//--------------------------------------------------------------------------------------------------------------------------------|SM - State Behavior
    stateBehavior: function(timeDelta) {
      if (this.state == 'idle') {
        // Prototype Patrol Point System
        /*
        if (this.patrolPoints == null) { return; }
        var patrolTarget = null;
        for (var i=0; i<this.patrolPoints.length; i++) {
          if (!this.patrolPoints[i][2]) {
            patrolTarget = this.patrolPoints[i];
            break;
          }
        }
        if (patrolTarget == null) {
          for (var i=0; i<this.patrolPoints.length; i++) { this.patrolPoints[i][2] = false; }
          this.patrolPoints.reverse();
          patrolTarget = this.patrolPoints[0];
        }

        let _dx = this.x - (patrolTarget[0] + 0.5) * cellSize;
        let _dy = this.y - (patrolTarget[1] + 0.5) * cellSize;
        this.moveAngle = Math.atan2(_dy, _dx);
        this.speed = this.moveSpeed;
        this.movement(timeDelta);
        if (Math.floor(this.x/cellSize) == patrolTarget[0] && Math.floor(this.y/cellSize) == patrolTarget[1]) { patrolTarget[2] = true; }
        */
        return;
      }

      if (this.state == 'flinching') {
        if (this.flinchTimer.pause) {
          this.flinchTimer.pauseUpdate(false);
        } else if (this.flinchTimer.isFinished()) {
          this.flinchTimer.reset();
          this.flinchTimer.pauseUpdate(true);
          this.flinched(this.flinchedReturnState);
        }
        return;
      }

      if (this.state == 'ranging') {
        if (this.attackTimer.pause) {
          this.attackTimer.pauseUpdate(false);
          this.rangeAttack();
        } else if (this.attackTimer.isFinished()) {
          this.attackTimer.reset();
          this.attackTimer.pauseUpdate(true);
          // this.rangeAttack();
          if (this.lookingAtTarget) {
            this.attacked('ranging');
          } else {
            this.attacked('pursuing');
          }
        }
        return;
      }

      if (this.state == 'pursuing' || this.state == 'wandering') {
        this.speed = this.moveSpeed;
        // this.spriteState = Math.floor((now % this.walkCycleTime) / (this.walkCycleTime / this.numWalkSprites)) + this.walkSpriteOffset;
        this.movement(timeDelta);
      }
    },


//--------------------------------------------------------------------------------------------------------------------------------|SM - Line Of Sight
    lineOfSight: function(angle) {
      let rayData = castSingleRay(this, angle);
      let targetDetection = entitiesWithinSegment({x: this.x, y: this.y}, {x: rayData.endPoint.x*cellSize, y: rayData.endPoint.y*cellSize}, this, [this.target]);
      if (targetDetection.length <= 0) {
        return false;
      } else {
        return true;
      }
    },


//--------------------------------------------------------------------------------------------------------------------------------|SM - Movement
    movement: function(timeDelta) {
      // if (this.state == 'dead' || this.state == 'idle') { return; }

      this.moveAngle = roundRadian(this.moveAngle);
      const mul = timeDelta / logicTick;
      const moveStep = mul * this.speed;
      var newX = this.x;
      var newY = this.y;

      newX += Math.cos(this.moveAngle + Math.PI) * moveStep;
      newY += Math.sin(this.moveAngle + Math.PI) * moveStep;

      // if (this.state == 'pursuing' && collidesWithMap(newX/cellSize, newY/cellSize)) {
      //   this.changeDir();
      //   return;
      // }

      var pos = checkCollision(this.x/cellSize,this.y/cellSize, newX/cellSize,newY/cellSize, this.diameter);

      // if (this.state == 'pursuing' && (pos.x != newX && pos.y != newY)) {
      //   this.changeDir();
      //   // return;
      // }

      this.x = pos.x;
      this.y = pos.y;
    },


//--------------------------------------------------------------------------------------------------------------------------------|SM - Hit
    hit: function(damage) {
      // Note: Returning if flinching makes the ai invincible while flinching.
      // if (this.state == 'flinching') { return; }
      if (this.state == 'idle') { this.awaken(); }

      this.health -= damage;
      if (this.health <= 0) {
        this.die();
        this.spriteState = 4;
        this.deathAnimation();
        // this.deathAniTimer.pauseUpdate(false);
      } else {
        this.flinch();
      }
    },


    rangeAttack: function() {
      this.heldItem.use(this);
    },


    deathAnimation: function() {
      // TODO: Find a way to do death animation without setTimeout.
      // Potentially through a new 'dying' state?
      this.spriteState += 1;

      if (this.spriteState >= 8) {
        createWorldParticles(this.x,this.y, 0.4, 4, 'gibs');
        this.spriteState = 10;
        return;
      }

      setTimeout(this.deathAnimation.bind(this), 108);
    },


//--------------------------------------------------------------------------------------------------------------------------------|SM - Update Angles
    updateAngles: function() {
      if (this.state == 'dead' || this.state == 'flinching') {
        this.directTargetSight = false;
        return;
      }

      let toTargetAngle = Math.atan2(this.dy, this.dx) + Math.PI;
      this.directTargetSight = this.lineOfSight(toTargetAngle);
      if (this.directTargetSight){ this.moveAngle = Math.atan2(this.dy, this.dx); }

      if (this.state == 'idle') { return; }

      //----------------|Look Angle Section
      let _aTargetAngle = toTargetAngle - this.lookAngle;
      let _bTargetAngle = toTargetAngle - this.lookAngle + twoPi;
      let _cTargetAngle = toTargetAngle - this.lookAngle - twoPi;
      let _aTargetAngle_abs = Math.abs(_aTargetAngle);
      let _bTargetAngle_abs = Math.abs(_bTargetAngle);
      let _cTargetAngle_abs = Math.abs(_cTargetAngle);

      if (_cTargetAngle_abs < _bTargetAngle_abs && _cTargetAngle_abs < _aTargetAngle_abs) {
        var targetDirection = _cTargetAngle;
      } else if (_bTargetAngle_abs < _cTargetAngle_abs && _bTargetAngle_abs < _aTargetAngle_abs) {
        var targetDirection = _bTargetAngle;
      } else {
        var targetDirection = _aTargetAngle;
      }

      if (targetDirection > 0) {
        this.lookAngle += this.rotSpeed;
      } else {
        this.lookAngle -= this.rotSpeed;
      }
      this.lookAngle = roundRadian(this.lookAngle);

      //----------------|Looking At Target Section
      if (!this.directTargetSight) {
        this.lookingAtTarget = false;
      } else if (Math.abs(targetDirection) < 0.03) {
        this.lookAngle = toTargetAngle;
        this.lookingAtTarget = true;
      } else {
        this.lookingAtTarget = false;
      }
    },


//--------------------------------------------------------------------------------------------------------------------------------|SM - Update Sprite State
    updateSpriteState: function(now) {
      /*if (this.state == 'dead') {
        console.log("deathAniTimer.time = " + this.deathAniTimer.time);
        if (this.deathAniTimer.pause) {
          this.deathAniTimer.pauseUpdate(false);
          console.log("deathAniTimer unpaused");
        } else if (this.deathAniTimer.isFinished()) {
          createWorldParticles(this.x,this.y, 1, 4, 'gibs');
          this.spriteState = 10;
          this.deathAniTimer.pauseUpdate(true);
        } else {
          this.spriteState = Math.floor(this.deathAniTimer.progress * this.spriteStates.deathFrames.length) + this.spriteStates.deathFrames[0];
          console.log(this.spriteState);
        }
        return;
      }*/

      if (this.state == 'pursuing' || this.state == 'wandering' || (this.state == 'idle' && this.patrolPoints != null)) {
        this.spriteState = Math.floor((now % this.walkCycleTime) / (this.walkCycleTime / this.numWalkSprites)) + this.walkSpriteOffset;
        return;
      }

      if (this.state == 'ranging') {
        if (this.attackTimer.progress < 0.25) {
          this.spriteState = this.spriteStates.attacking;
        } else {
          this.spriteState = this.spriteStates.attacked;
        }
        return;
      }

      if (this.spriteStates[this.state] != null) {
        this.spriteState = this.spriteStates[this.state];
        return;
      }
    }
  }
});




//--------------------------------------------------------------------------------------------------------------------------------|Enemy Types and Map Enemies
const enemyTypes = [
  {
    health: 20,
    radius: 0.18,
    moveSpeed: 0.02 * cellSize,
    rotSpeed: 0.06,
    totalSpriteStates: 13,
    walkCycleTime: 900,
    numWalkSprites: 4,
    walkSpriteOffset: 1,
    spriteStates: {'idle': 0, 'flinching': 9, 'attacking': 12, 'attacked': 11, deathFrames: [4,5,6,7,8]},
    texture: TextureFactory.newTexture('enemySprites/guard.png', 64,64)
  },
  /*{
    moveSpeed: 0.05 * cellSize,
    rotSpeed: 0.02,
    totalStates: 1,
    walkCycleTime: 900,
    numWalkSprites: 1,
    walkSpriteOffset: 0,
    health: 12,
    radius: 0.2,
    texture: TextureFactory.newtexture("environmentSprites/armor.png", 64,64)
  },*/
];




// Called by initGame.js/init()
function init_enemies(enemyMapData) {
  enemies = [];
  for (var i=0; i<enemyMapData.length; i++) {
    let enemyData = enemyMapData[i];
    newEnemy(enemyData[0], enemyData[1], enemyData[2], enemyData[3]);
  }
}


var previousEnemyId = -1;

function newEnemy(type, x,y, lookAngle=0) {
  if (type >= enemyTypes.length) {
    console.error("Invalid enemy type given. Given value: " + type);
    return;
  }
  previousEnemyId++;
  let _newEnemy = new EnemySmAi(previousEnemyId, type, x,y, lookAngle);
  _newEnemy.initiate();
  enemies.push(_newEnemy);
}




//--------------------------------------------------------------------------------------------------------------------------------|Enemy Update Function
function enemyUpdates(timeDelta, now) {
  for (var i=0; i<enemies.length; i++) {
    var enemy = enemies[i];
    updateDistance.call(enemy, this.target);
    // if (enemy.state == 'dead' || enemy.distance > 32*cellSize) { continue; }
    // if (enemy.deathAniTimer.isFinished() || enemy.distance > 32*cellSize) { continue; }
    if (enemy.state != 'dead' && enemy.distance <= 32*cellSize) {
      enemy.updateAngles();
      enemy.updateState(timeDelta);
      enemy.stateBehavior(timeDelta);
    }
    enemy.updateSpriteState(now);
  }
}


function updateDistance(targetRef=player) {
  let dx = this.x - targetRef.x;
  let dy = this.y - targetRef.y;
  this.dx = dx;
  this.dy = dy;
  this.distance = Math.sqrt(dx*dx + dy*dy);
}

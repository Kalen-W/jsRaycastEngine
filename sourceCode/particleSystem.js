//--------------------------------------------------------------------------------------------------------------------------------|Variables
var overlayParticles = [];
var worldParticles = [];
var maxParticles = 512;




//--------------------------------------------------------------------------------------------------------------------------------|Particle Types
const particleTypes = {
  /*test: {
    vxRange: 1.2, vxStart: -0.6,
    vyRange: -4, vyStart: -4,
    gravity: 0.08,
    alphaStart: 255,
    decayRate: 0.4,
    alphaEnd: 5,
    widthRange: 12, widthStart: 2,
    heightRange: 'width', heightStart: 'width',
    color: '#458095',
    texture: null,
  },*/
  smoke: {
    vxRange: 12, vxStart: -6,
    vyRange: -16, vyStart: -2,
    vzRange: 12, vzStart: -6,
    gravity: -0.2, // -0.4
    alphaStart: 0.96, // 240
    decayRate: 0.044, // 10
    alphaEnd: 0,
    widthRange: 32, widthStart: 20,
    heightRange: 'width', heightStart: 'width',
    color: '#5d6c6f',
    texture: null,
  },
  gibs: {
    vxRange: 0.4, vxStart: -0.2,
    vyRange: 0.4, vyStart: -0.2,
    vzRange: 0.08, vzStart: -0.04,
    gravity: -0.002, // -0.02
    alphaStart: 0.98, // 250
    decayRate: 0.004, // 4
    alphaEnd: 0,
    color: null,
    texture: TextureFactory.newTexture("enemySprites/gibs-test.png", 64,64),
  },
};




//--------------------------------------------------------------------------------------------------------------------------------|Base Particle Class
class Particle {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = particleTypes[type];
    this.textureRef = particleTypes[type].texture;
    this.spriteState = 0;

    this.vx = (Math.random() * this.type.vxRange) + this.type.vxStart; // velocity - x
    this.vy = (Math.random() * this.type.vyRange) + this.type.vyStart; // velocity - y

    this.alpha = this.type.alphaStart;
    this.relevant = true;

    this.width = Math.floor(Math.random() * this.type.widthRange) + this.type.widthStart;
    if (this.type.heightRange == 'width') {
      this.height = this.width;
    } else {
      this.height = Math.floor(Math.random() * this.type.heightRange) + this.type.heightStart;;
    }

    this.halfWidth = this.width * 0.5;
    this.halfHeight = this.height * 0.5;
  }

  update(timeDelta) {
    var mul = timeDelta / logicTick;
    this.x += this.vx * mul;
    this.y += this.vy * mul;
    this.alpha -= this.type.decayRate * mul;
    if (this.alpha < 0) { this.alpha = 0; }
    if (this.alpha <= this.type.alphaEnd) { this.relevant = false; }

    this.velocityUpdate(mul);
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Overlay Particle Class
class OverlayParticle extends Particle {
  constructor(x, y, type) {
    super(x, y, type);
  }

  render() {
    if (this.textureRef == null) {
      overlayContext.lineWidth = 0;
      overlayContext.strokeStyle = '#00000000';
      overlayContext.fillStyle = this.type.color;
      overlayContext.globalAlpha = this.alpha;
      overlayContext.fillRect(this.x-this.halfWidth,this.y-this.halfHeight, this.width,this.height);
    } else {
      overlayContext.globalAlpha = this.alpha;
      overlayContext.drawImage(this.textureRef.img, this.x-this.halfWidth,this.y-this.halfHeight, this.width,this.height);
    }
  }

  velocityUpdate(mul) {
    if (this.y >= screenH) {
      this.y = screenH;
      this.vy *= -0.8;
      this.vx *= 0.996;
      return;
    }

    this.vy += this.type.gravity * mul;
  }

  bounce() {
    if (this.vx < 2) {
      this.vx *= 1.004;
    }

    if (this.y >= screenH) {
      this.y = screenH;
      this.vy *= -1;
    } else if (this.y <= 0) {
      this.vy *= -1;
    }

    if (this.x <= 0 || this.x >= screenW) {
      this.vx *= -1;
    }
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|World Particle Class
class WorldParticle extends Particle {
  constructor(x, y, heightLevel, type) {
    super(x, y, type);
    this.vz = (Math.random() * this.type.vzRange) + this.type.vzStart; // velocity - z
    this.heightMod = heightLevel;
    this.distance;
  }

  velocityUpdate(mul) {
    this.vz += this.type.gravity * mul;
    this.heightMod += this.vz;

    if (this.heightMod <= 0) {
      this.heightMod = 0;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.vz *= -0.4;
    }
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Create Paticles
function createOverlayParticles(x, y, amount, type) {
  if (overlayParticles.length > maxParticles) { return; }

  for (var i=0; i<amount; i++) {
    overlayParticles.push( new OverlayParticle(x, y, type) );
  }
}


function createWorldParticles(x, y, heightLevel, amount, type) {
  if (worldParticles.length > maxParticles) { return; }

  for (var i=0; i<amount; i++) {
    worldParticles.push( new WorldParticle(x, y, heightLevel, type) );
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Update Particles
function updateOverlayParticles(timeDelta) {
  if (overlayParticles.length <= 0) { return; }

  for (var i=0; i<overlayParticles.length; i++) {
    let particle = overlayParticles[i];
    if (!pause) { particle.update(timeDelta); }
    // particle.render();

    if (!particle.relevant) {
      overlayParticles.splice(i, 1);
      i--;
    }
  }
}


function renderOverlayParticles() {
  if (overlayParticles.length <= 0) { return; }

  for (var i=0; i<overlayParticles.length; i++) {
    overlayParticles[i].render();
  }
  overlayContext.globalAlpha = 1;
}


function updateWorldParticles(timeDelta) {
  if (worldParticles.length <= 0) { return; }

  for (var i=0; i<worldParticles.length; i++) {
    let particle = worldParticles[i];
    updateDistance.call(particle, player);
    if (!pause) { particle.update(timeDelta); }

    if (!particle.relevant) {
      worldParticles.splice(i, 1);
      i--;
    }
  }
}

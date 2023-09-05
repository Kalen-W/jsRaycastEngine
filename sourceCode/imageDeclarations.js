//--------------------------------------------------------------------------------------------------------------------------------|texture Class
const TextureFactory = {
  allTextures: [],
  animationArray_125: [],
  animationArray_500: [],
  animationArray_1000: [],

  newTexture: function(relLink, width, height, resolution) {
    if (typeof resolution == 'undefined') {
      var rez = width;
    } else {
      var rez = resolution;
    }

    // A new texture will only be created if it doesn't already exist, otherwise, it will simply return the pre-existing texture.
    let dupTest = this.duplicateTest(relLink, rez);
    if (dupTest != false) { return dupTest; }

    let _newTexture = new Texture(relLink, width, height, rez);
    this.allTextures.push(_newTexture);
    return _newTexture;
  },

  newAnimatedTexture: function(textureArray, changeFreq, resolution) {
    if (typeof resolution == 'undefined') {
      var rez = textureArray[0].rez;
    } else {
      var rez = resolution;
    }

    // A new animated texture will only be created if it doesn't already exist, otherwise, it will simply return the pre-existing animated texture.
    let dupTest = this.duplicateTest_animated(textureArray, changeFreq, rez);
    if (dupTest != false) { return dupTest; }

    let _newTexture = new AnimatedTexture(textureArray, changeFreq, rez);
    this.allTextures.push(_newTexture);

    // Add texture to animation arrays for updating
    if (changeFreq == 125) {
      this.animationArray_125.push(_newTexture);
    } else if (changeFreq == 500) {
      this.animationArray_500.push(_newTexture);
    } else if (changeFreq == 1000) {
      this.animationArray_1000.push(_newTexture);
    } else {
      console.error("Invalid change frequency given in TextureFactory.newAnimatedTexture(). Given value: " + changeFreq);
    }

    return _newTexture;
  },


  forEachTexture: function(action) {
    for (var i=0; i<this.allTextures.length; i++) {
      action.call(this.allTextures[i]);
    }
  },

  // Not currently used.
  /*everyTexture: function(action) {
    return this.allTextures.every((item, index) => {
      return action.call(item);
    });
  },*/


  // Duplicate tests return false if there is no duplicate texture, otherwise, the pre-existing texture is returned.
  duplicateTest: function(relLink, resolution) {
    var _img = new Image(resolution, resolution);
    _img.src = "./assets/textures/" + relLink;

    var _return = false;
    for (var i=0; i<this.allTextures.length; i++) {
      let tex = this.allTextures[i];
      if (tex.img.src == _img.src && tex.rez == resolution) {
        _return = tex;
        break;
      }
    }
    return _return;
  },

  duplicateTest_animated: function(textureArray, changeFreq, resolution) {
    if (changeFreq == 125) {
      var aniArray = this.animationArray_125;
    } else if (changeFreq == 500) {
      var aniArray = this.animationArray_500;
    } else if (changeFreq == 1000) {
      var aniArray = this.animationArray_1000;
    } else {
      console.error("Invalid AnimatedTexture changeFreq given. Given value: " + changeFreq);
      return null;
    }

    var _return = false;
    for (var i=0; i<aniArray.length; i++) {
      let ani = aniArray[i];
      if (ani.frames == textureArray && ani.rez == resolution) {
        _return = ani;
        break;
      }
    }
    return _return;
  },


  // Texture Animation Section
  updateTimers: {
    _125: TimerFactory.newActionLoopingTimer(125, ()=>{TextureFactory.updateFunctions._125()}),
    _500: TimerFactory.newActionLoopingTimer(500, ()=>{TextureFactory.updateFunctions._500()}),
    _1000: TimerFactory.newActionLoopingTimer(1000, ()=>{TextureFactory.updateFunctions._1000()}),
  },

  updateFunctions: {
    _125: function() {
      for (var i=0; i<TextureFactory.animationArray_125.length; i++) {
        TextureFactory.animationArray_125[i].updateFrame();
      }
    },
    _500: function() {
      for (var i=0; i<TextureFactory.animationArray_500.length; i++) {
        TextureFactory.animationArray_500[i].updateFrame();
      }
    },
    _1000: function() {
      for (var i=0; i<TextureFactory.animationArray_1000.length; i++) {
        TextureFactory.animationArray_1000[i].updateFrame();
      }
    }
  }
};


class Texture {
  constructor(relLink, width, height, resolution) {
    if (typeof width == 'undefined') {
      this.img = new Image(textureRez, textureRez);
    } else {
      this.img = new Image(width, height);
    }

    this.img.src = "./assets/textures/" + relLink;
    this.w = this.width = this.img.width;
    this.h = this.height = this.img.height;
    this.rez = this.resolution = resolution;
  }
}


class AnimatedTexture {
  constructor(textureArray, changeFreq, resolution) {
    // this.img = new Image(textureRez, textureRez);

    this.frames = textureArray;
    this.totalFrames = textureArray.length - 1;
    this.currentFrame = 0;
    this.changeFreq = changeFreq;
    // this.img.src = this.frames[0].img.src;
    this.img = this.frames[0].img;

    this.w = this.width = this.frames[0].w;
    this.h = this.height = this.frames[0].h;
    this.rez = this.resolution = resolution;
  }

  updateFrame(frame=null) {
    if (frame != null) {
      this.currentFrame = frame;
    } else {
      if (this.currentFrame < this.totalFrames) {
        this.currentFrame++;
      } else {
        this.currentFrame = 0;
      }
    }

    let _frame = this.frames[this.currentFrame];
    // this.img.src = this.frames[this.currentFrame].img.src;
    this.img = _frame.img;
    this.w = this.width = _frame.w;
    this.h = this.height = _frame.h;
    this.rez = this.resolution = _frame.rez;
  }
}




// https://stackoverflow.com/a/68319943
// /** @param {string} source */
async function imageDataFromSource(source) {
  const image = Object.assign(new Image(), { src: source });
  await new Promise(resolve => image.addEventListener('load', () => resolve()));
  const ctx = Object.assign(document.createElement('canvas'), {
    width: image.width,
    height: image.height
  }).getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height);
}

// var wallsImgData;
async function initImgData() {
  // wallsImgData = await imageDataFromSource('./assets/textures/wallsTest.png');
  // spriteImgData_armor = await imageDataFromSource('./assets/textures/environmentSprites/armor.png');
  // console.log(wallsImgData);
}


// https://stackoverflow.com/a/28405765

// const screenImgData = offscreenContext.createImageData(canvas.width, canvas.height);
// const screenImgData = offscreenContext.createImageData(canvas.width / options.lineWidth, canvas.height);
// const screenImgWidth = screenImgData.width;
// const screenImgLength = screenImgData.data.length;

function zBufferToImgData() {
  // for (var i=0; i<screenImgLength; i+=4 * options.lineWidth) {
  for (var i=0; i<screenImgLength; i+=4) {
    var row = Math.floor((i / 4) / screenImgWidth);
    // var col = ((i / 4) % screenImgWidth) / options.lineWidth;
    var col = ((i / 4) % screenImgWidth);
    var pixel = zBuffer[row][col];

    if (typeof pixel == 'undefined') {
      console.error("invalid zBuffer reference while converting to image");
      console.error("screenImgData index: " + i + " | zBuffer row: " + row + " - zBuffer column: " + col);
      continue;
    }
    if (pixel.a == 0) {
      screenImgData.data[i + 3] = 0;
      continue;
    }

    /*for (var x=0; x<options.lineWidth; x++) {
      screenImgData.data[i + x * 4] = pixel.r;
      screenImgData.data[i + x * 4 + 1] = pixel.g;
      screenImgData.data[i + x * 4 + 2] = pixel.b;
      screenImgData.data[i + x * 4 + 3] = pixel.a;
    }*/

    screenImgData.data[i] = pixel.r;
    screenImgData.data[i + 1] = pixel.g;
    screenImgData.data[i + 2] = pixel.b;
    screenImgData.data[i + 3] = pixel.a;
    /*screenImgData.data[i + 4] = pixel.r;
    screenImgData.data[i + 5] = pixel.g;
    screenImgData.data[i + 6] = pixel.b;
    screenImgData.data[i + 7] = pixel.a;
    screenImgData.data[i + 8] = pixel.r;
    screenImgData.data[i + 9] = pixel.g;
    screenImgData.data[i + 10] = pixel.b;
    screenImgData.data[i + 11] = pixel.a;
    screenImgData.data[i + 12] = pixel.r;
    screenImgData.data[i + 13] = pixel.g;
    screenImgData.data[i + 14] = pixel.b;
    screenImgData.data[i + 15] = pixel.a;*/
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Animated Texture Frames
const manaOrbFrames = [
  TextureFactory.newTexture('itemSprites/manaOrb/manaOrb-frame1.png', 64,64),
  TextureFactory.newTexture('itemSprites/manaOrb/manaOrb-frame2.png', 64,64),
  TextureFactory.newTexture('itemSprites/manaOrb/manaOrb-frame3.png', 64,64),
  TextureFactory.newTexture('itemSprites/manaOrb/manaOrb-frame4.png', 64,64),
  TextureFactory.newTexture('itemSprites/manaOrb/manaOrb-frame5.png', 64,64),
  TextureFactory.newTexture('itemSprites/manaOrb/manaOrb-frame6.png', 64,64),
  TextureFactory.newTexture('itemSprites/manaOrb/manaOrb-frame7.png', 64,64),
  TextureFactory.newTexture('itemSprites/manaOrb/manaOrb-frame8.png', 64,64)
];

const healthPackFrames = [
  TextureFactory.newTexture('itemSprites/healthPack/tempHealthPack-frame1.png', 32,32, 64),
  TextureFactory.newTexture('itemSprites/healthPack/tempHealthPack-frame2.png', 32,32, 64),
  TextureFactory.newTexture('itemSprites/healthPack/tempHealthPack-frame3.png', 32,32, 64),
  TextureFactory.newTexture('itemSprites/healthPack/tempHealthPack-frame4.png', 32,32, 64)
];

const aniTestWallFrames = [
  TextureFactory.newTexture('wallTextures/walls.png', 128,256, 64),
  TextureFactory.newTexture('wallTextures/newWallTextures.png', 128,128, 64),
  TextureFactory.newTexture('wallTextures/newWallTextures.png', 128,128, 64),
  TextureFactory.newTexture('wallTextures/newWallTextures.png', 128,128, 64),
  TextureFactory.newTexture('wallTextures/walls.png', 128,256, 64)
];




//--------------------------------------------------------------------------------------------------------------------------------|Walls
const wallsImg = TextureFactory.newTexture('wallTextures/walls.png', 128,256, 64);
const customWalls = TextureFactory.newTexture('wallTextures/newWallTextures.png', 128,128, 64);
const aniTestWalls = TextureFactory.newAnimatedTexture(aniTestWallFrames, 500); // TODO: remove


const wallTypes = [
  { /*              Placeholder - 0 = no wall, so this should never get referenced              */ }, // 0
  {atlas: {texture: wallsImg,     offset: {x:   0, y:   0}}, block: true,  heightMod: 1, opacity: 1}, // 1 - blue bricks
  {atlas: {texture: wallsImg,     offset: {x:   0, y:  64}}, block: true,  heightMod: 1, opacity: 1}, // 2 - blue brick jail
  {atlas: {texture: wallsImg,     offset: {x:   0, y: 128}}, block: true,  heightMod: 1, opacity: 1}, // 3 - stone
  {atlas: {texture: wallsImg,     offset: {x:   0, y: 192}}, block: true,  heightMod: 1, opacity: 1}, // 4 - wood
  {atlas: {texture: customWalls,  offset: {x:   0, y:   0}}, block: true,  heightMod: 1, opacity: 1}, // 5 - leaves
  {atlas: {texture: customWalls,  offset: {x:   0, y:  64}}, block: true,  heightMod: 1, opacity: 1}, // 6 - crate
  {atlas: {texture: customWalls,  offset: {x:   0, y: 128}}, block: true,  heightMod: 1, opacity: 1}, // 7 - cobblestone
];




//--------------------------------------------------------------------------------------------------------------------------------|Item Types
const itemTypes = {
  "tablechairs": {
    block: true,  loot: false,
    texture: TextureFactory.newTexture("environmentSprites/tablechairs.png", 64,64)
  },
  "armor": {
    block: true,  loot: false,
    texture: TextureFactory.newTexture("environmentSprites/armor.png", 64,64)
  },
  "plantgreen": {
    block: true,  loot: false,
    texture: TextureFactory.newTexture("environmentSprites/plantgreen.png", 64,64)
  },
  "lamp": {
    block: false, loot: false,
    texture: TextureFactory.newTexture("environmentSprites/lamp.png", 64,64)
  },
  "leaves": {
    block: false, loot: false,
    texture: TextureFactory.newTexture("environmentSprites/transparentLeaves.png", 64,64)
  },
  "supportBeam": {
    block: false, loot: false,
    texture: TextureFactory.newTexture("environmentSprites/supportBeam-temp.png", 64,64)
  },
  "ironBars": {
    block: true, loot: false,
    texture: TextureFactory.newTexture("environmentSprites/ironBars-temp.png", 64,64)
  },
  "counter": {
    block: true, loot: false,
    texture: TextureFactory.newTexture("environmentSprites/counter-temp.png", 64,64)
  },

  "wallLever_up": {
    block: true, loot: false,
    texture: TextureFactory.newTexture("environmentSprites/wallLever-up.png", 64,64)
  },
  "wallLever_down": {
    block: true, loot: false,
    texture: TextureFactory.newTexture("environmentSprites/wallLever-down.png", 64,64)
  },
  "mapExit_tunnel": {
    block: true, loot: false,
    texture: TextureFactory.newTexture("environmentSprites/levelExit-tunnel-temp.png", 64,64)
  },

  "pickup_manaOrb": {
    block: false, loot: true,
    texture: TextureFactory.newAnimatedTexture(manaOrbFrames, 125),
    lootData: {volatile: true, type: 'armor', value: 15}
  },
  "pickup_healthPack": {
    block: false, loot: true,
    texture: TextureFactory.newAnimatedTexture(healthPackFrames, 500),
    lootData: {volatile: true, type: 'bonusHealth', value: 40}
  },
  "pickup_machineGun": {
    block: false, loot: true,
    texture: TextureFactory.newTexture("weaponSprites/weaponPickup-machineGun.png", 64,64),
    lootData: {volatile: true, type: 'weapon', value: 'machineGun'}
  },
};




//--------------------------------------------------------------------------------------------------------------------------------|Prototype Decal Types
const decalTypes = [
  {texture: TextureFactory.newTexture("weaponSprites/testSimpleProjectile.png", 32,32)}, // 0
];

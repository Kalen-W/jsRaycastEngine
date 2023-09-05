//--------------------------------------------------------------------------------------------------------------------------------|Overlay Elements
function renderOverlayElements(rays) {
  if (player.dead && !menu_gameOver.visible) {
    menu_gameOver.toggle(true);
    return;
  }

  overlayContext.font = options.fontSize + "px VT323, Monospace";
  overlayContext.fillStyle = colors.overlayTextFill;
  overlayContext.lineWidth = 2;
  overlayContext.strokeStyle = colors.overlayTextStroke;

  renderOverlayParticles();

  if (options.minimap_debug) {
    renderMinimap_debug(options.minimapOffset.x, options.minimapOffset.y, options.minimapScale, rays);
  } else if (options.minimap) {
    renderMinimap(options.minimapOffset.x, options.minimapOffset.y, options.minimapScale, rays);
  }
  if (options.compass) { renderCompass(player.angle) };
  playerHud.render();
  // Css div now used as crosshair
  if (options.crosshair) { renderCrosshair(); }

  player.heldItem.render(overlayContext);
  if (options.fpsCounter) { fpsDisplay.render(); }
}


const fpsDisplay = {
  x: 6,
  y: 2,
  displayNum: 0,
  updateFreq: Math.round(100 / logicTick),
  displayAverage: false,
  averageArray: [],
  averageTime: 10000 / renderTick, // Used to create running average of fps

  update: function(timeDelta) {
    if (this.displayAverage) {
      if (this.averageArray.length >= this.averageTime) { this.averageArray.splice(0, 1); }
      this.averageArray.push(1000 / timeDelta);
    }

    if (totalLogicTicks % this.updateFreq != 0) { return; }

    if (this.displayAverage) {
      this.displayNum = average(this.averageArray).toFixed(1);
    } else {
      this.displayNum = (1000 / timeDelta).toFixed(1);
    }
  },

  render: function() {
    overlayContext.font = fontSizes.fps + "px VT323, Monospace";
    overlayContext.fillStyle = colors.overlayTextFill;
    overlayContext.lineWidth = 2;
    overlayContext.strokeStyle = colors.overlayTextStroke;
    overlayContext.textAlign = "start";
    overlayContext.textBaseline = "top";

    overlayContext.strokeText(this.displayNum, this.x, this.y);
    overlayContext.fillText(this.displayNum, this.x, this.y);
  },
};


function renderTimer(timerObj, x = screenW-16, y = 12) {
  let milliseconds = timerObj.time;

  if (timerObj.time <= 0) {
    overlayContext.font = fontSizes.timer + "px VT323, Monospace";
    overlayContext.textAlign = "end";
    overlayContext.textBaseline = "top";

    overlayContext.strokeText("Timer: 00:00:00", x, y);
    overlayContext.fillText("Timer: 00:00:00", x, y);
    return;

    // milliseconds = Math.abs(milliseconds);
    // var prefix = "-";
  }/* else {
    var prefix = "";
  }*/

  let hoursTotal = milliseconds / 3600000;
  let hours = Math.floor(hoursTotal);
  let minutesTotal = (hoursTotal - hours) * 60;
  let minutes = Math.floor(minutesTotal);
  let secondsTotal = (minutesTotal - minutes) * 60;
  let seconds = Math.floor(secondsTotal);

  let hoursDisplay = hours<10 ? "0" + hours : hours;
  let minutesDisplay = minutes<10 ? "0" + minutes : minutes;
  let secondsDisplay = seconds<10 ? "0" + seconds : seconds;

  overlayContext.font = fontSizes.timer + "px VT323, Monospace";
  overlayContext.textAlign = "end";
  overlayContext.textBaseline = "top";

  // overlayContext.strokeText("Timer: " + prefix + hoursDisplay + ":" + minutesDisplay + ":" + secondsDisplay, x, y);
  // overlayContext.fillText("Timer: " + prefix + hoursDisplay + ":" + minutesDisplay + ":" + secondsDisplay, x, y);
  overlayContext.strokeText("Timer: " + hoursDisplay + ":" + minutesDisplay + ":" + secondsDisplay, x, y);
  overlayContext.fillText("Timer: " + hoursDisplay + ":" + minutesDisplay + ":" + secondsDisplay, x, y);
}


const compDir = [
  0.125*Math.PI, 1.875*Math.PI,
  0.375*Math.PI,
  0.625*Math.PI,
  0.875*Math.PI,
  1.125*Math.PI,
  1.375*Math.PI,
  1.46875*Math.PI,
  1.53125*Math.PI,
  1.6875*Math.PI,
  1.875*Math.PI
];
function renderCompass(angle) {
  var compassDirection;
  if (angle<compDir[0] || angle>=compDir[1]) {
    compassDirection = "|----[E]----|";
  } else if (angle<compDir[2]) {
    compassDirection = "E]----|----[S";
  } else if (angle<compDir[3]) {
    compassDirection = "|----[S]----|";
  } else if (angle<compDir[4]) {
    compassDirection = "S]----|----[W";
  } else if (angle<compDir[5]) {
    compassDirection = "|----[W]----|";
  } else if (angle<compDir[6]) {
    compassDirection = "--[W]----|---";
  } else if (angle<compDir[7]) {
    compassDirection = "---|----[N]--";
  } else if (angle<compDir[8]) {
    compassDirection = "|----[N]----|";
  } else if (angle<compDir[9]) {
    compassDirection = "--[N]----|---";
  } else if (angle<compDir[10]) {
    compassDirection = "---|----[E]--";
  } else {
    compassDirection = "Error";
    console.error("renderCompass statement defaulted - angle = " + angle);
  }

  overlayContext.font = options.fontSize + "px VT323, Monospace";
  overlayContext.fillStyle = colors.overlayTextFill;
  overlayContext.lineWidth = 2;
  overlayContext.strokeStyle = colors.overlayTextStroke;

  overlayContext.textAlign = "center";
  overlayContext.textBaseline = "top";
  overlayContext.strokeText(compassDirection, center.x, 6);
  overlayContext.fillText(compassDirection, center.x, 6);
}


function renderCrosshair() {
  // overlayContext.textAlign = "center";
  // overlayContext.textBaseline = "middle";
  overlayContext.fillStyle = colors.crosshair;
  // overlayContext.fillText("+", center.x, center.y);
  overlayContext.fillRect(center.x-options.crosshairR, center.y-options.crosshairR, options.crosshairD, options.crosshairD);
}




//--------------------------------------------------------------------------------------------------------------------------------|Player HUD
const playerHud = {
  playerRef: player,
  colors: {
    healthNum_outline: '#151414',
    healthNum_fill: '#6e2727',
    healthBar_outline: '#151414',
    healthBar_full: '#8c2020',
    healthBar_overcharge: '#bcc21e',
    healthBar_empty: '#463535',
    armorNum_outline: '#121018',
    armorNum_fill: '#5247ac',
  },
  healthBarPos: {
    x: 16,
    y: screenH-32,
    width: 256,
    height: 16,
    outlineSize: 2
  },
  opacities: {
    health: 0.6,
  },

  init: function() {
    this.healthBarPos.y = screenH - 32;
    this.healthBarPos.outlineX = this.healthBarPos.x - this.healthBarPos.outlineSize * 0.5;
    this.healthBarPos.outlineY = this.healthBarPos.y - this.healthBarPos.outlineSize * 0.5;
    this.healthBarPos.outlineWidth = this.healthBarPos.width + this.healthBarPos.outlineSize;
    this.healthBarPos.outlineHeight = this.healthBarPos.height + this.healthBarPos.outlineSize;
  },

  renderHealthNum: function() {
    overlayContext.font = fontSizes.health + "px VT323, Monospace";
    overlayContext.textAlign = "left";
    overlayContext.textBaseline = "bottom";
    overlayContext.fillStyle = this.colors.healthNum_fill;
    overlayContext.strokeStyle = this.colors.healthNum_outline;
    overlayContext.globalAlpha = this.opacities.health;
    overlayContext.strokeText(this.playerRef.health, 20, screenH-42);
    overlayContext.fillText(this.playerRef.health, 20, screenH-42);
  },

  renderHealthBar: function() {
    overlayContext.globalAlpha = this.opacities.health;

    if (this.playerRef.health > this.playerRef.healthMax) {
      var emptyColor = this.colors.healthBar_full;
      var fullColor = this.colors.healthBar_overcharge;
      var overchargeAdjust = 100;
    } else {
      var emptyColor = this.colors.healthBar_empty;
      var fullColor = this.colors.healthBar_full;
      var overchargeAdjust = 0;
    }

    overlayContext.fillStyle = emptyColor;
    overlayContext.fillRect(
      this.healthBarPos.x,
      this.healthBarPos.y,
      this.healthBarPos.width,
      this.healthBarPos.height
    );

    overlayContext.fillStyle = fullColor;
    overlayContext.fillRect(
      this.healthBarPos.x,
      this.healthBarPos.y,
      this.healthBarPos.width * ((this.playerRef.health - overchargeAdjust) / this.playerRef.healthMax),
      this.healthBarPos.height
    );

    overlayContext.strokeStyle = this.colors.healthBar_outline;
    overlayContext.lineWidth = this.healthBarPos.outlineSize;
    overlayContext.strokeRect(
      this.healthBarPos.outlineX,
      this.healthBarPos.outlineY,
      this.healthBarPos.outlineWidth,
      this.healthBarPos.outlineHeight
    );
    overlayContext.lineWidth = 0;
  },

  renderArmorNum: function() {
    overlayContext.font = fontSizes.health + "px VT323, Monospace";
    overlayContext.textAlign = "left";
    overlayContext.textBaseline = "bottom";
    overlayContext.fillStyle = this.colors.armorNum_fill;
    overlayContext.strokeStyle = this.colors.armorNum_outline;
    overlayContext.globalAlpha = this.opacities.health;
    overlayContext.strokeText(this.playerRef.armor, 20, screenH-84);
    overlayContext.fillText(this.playerRef.armor, 20, screenH-84);
  },

  render: function() {
    this.renderHealthNum();
    this.renderHealthBar();
    this.renderArmorNum();
    overlayContext.globalAlpha = 1;
  }
};




//--------------------------------------------------------------------------------------------------------------------------------|Graphics Menu
const menu_graphics = {
  visible: false,
  screenOverlay: document.getElementById('screenOverlay-graphicsMenu'),
  closeBtn: document.getElementById('btn-menu-close-graphics'),
  contents: document.getElementById('menu-graphics-contents'),

  options: [
    {name: 'fov', type: 'slider', element: document.getElementById('slider-menu-graphics-fov'), valueElement: document.getElementById('optionSliderDisplayValue-fov'), value: 70},
    // {name: 'lineWidth', type: 'slider', element: document.getElementById('slider-menu-graphics-lineWidth'), valueElement: document.getElementById('optionSliderDisplayValue-lineWidth'), value: 4},
    {name: 'fog', type: 'checkbox', element: document.getElementById('toggle-menu-graphics-fog'), value: true},
  ],


  init: function() {
    this.closeBtn.addEventListener('click', function() {
      this.toggle(false);
      graphicsToLocalStorage();
    }.bind(this));

    // Assigns oninput event listener to each options element to update its value property.
    for (var i=0; i<this.options.length; i++) {
      let option = this.options[i];
      option.element.oninput = function() {
        if (this.type == 'checkbox') {
          this.value = this.element.checked;
        } else if (this.type == 'slider') {
          this.value = this.element.value;
          this.valueElement.innerHTML = this.element.value;
        }
      }.bind(option)
    }
  },

  toggle: function(override) {
    if (typeof override == 'boolean') {
      this.visible = override;
    } else {
      this.visible = !this.visible;
    }

    if (this.visible) {
      this.screenOverlay.style.display = 'flex';
    } else {
      this.screenOverlay.style.display = 'none';
    }
  },

  // Changes the element value to match the object's value property. Used after values are imported from local storage.
  updateOptions: function() {
    for (var i=0; i<this.options.length; i++) {
      let option = this.options[i];

      if (option.type == 'checkbox') {
        option.element.checked = option.value;
      } else if (option.type == 'slider') {
        option.element.value = option.value;
        option.valueElement.innerHTML = option.value;
      }
    }
  },
};




//--------------------------------------------------------------------------------------------------------------------------------|Options Menu
const menu_options = {
  visible: false,
  screenOverlay: document.getElementById('screenOverlay-optionsMenu'),
  closeBtn: document.getElementById('btn-menu-close-options'),
  contents: document.getElementById('menu-options-contents'),

  options: [
    {name: 'toggleMinimap', type: 'checkbox', element: document.getElementById('toggle-menu-options-minimap'), value: false},
    {name: 'minimapScale', type: 'slider', element: document.getElementById('slider-menu-options-minimapScale'), valueElement: document.getElementById('optionSliderDisplayValue-minimapScale'), value: 0.5},
    {name: 'minimapOpacity', type: 'slider', element: document.getElementById('slider-menu-options-minimapOpacity'), valueElement: document.getElementById('optionSliderDisplayValue-minimapOpacity'), value: 0.8},
    {name: 'toggleCompass', type: 'checkbox', element: document.getElementById('toggle-menu-options-compass'), value: true},
    {name: 'toggleCrosshair', type: 'checkbox', element: document.getElementById('toggle-menu-options-crosshair'), value: true},
    {name: 'toggleFpsCounter', type: 'checkbox', element: document.getElementById('toggle-menu-options-fpsCounter'), value: true},
    {name: 'horizontalMouseSensitivity', type: 'slider', element: document.getElementById('slider-menu-options-horizontalMouseSensitivity'), valueElement: document.getElementById('optionSliderDisplayValue-horizontalMouseSensitivity'), value: 0.36},
    {name: 'verticalMouseSensitivity', type: 'slider', element: document.getElementById('slider-menu-options-verticalMouseSensitivity'), valueElement: document.getElementById('optionSliderDisplayValue-verticalMouseSensitivity'), value: 0.34},
    {name: 'toggleLockVerticalLook', type: 'checkbox', element: document.getElementById('toggle-menu-options-lockVerticalLook'), value: false},
    {name: 'toggleAlwaysSprint', type: 'checkbox', element: document.getElementById('toggle-menu-options-alwaysSprint'), value: false}
  ],


  init: function() {
    this.closeBtn.addEventListener('click', function() {
      this.toggle(false);
      optionsToLocalStorage();
    }.bind(this));

    for (var i=0; i<this.options.length; i++) {
      let option = this.options[i];
      option.element.oninput = function() {
        if (this.type == 'checkbox') {
          this.value = this.element.checked;
        } else if (this.type == 'slider') {
          this.value = this.element.value;
          this.valueElement.innerHTML = this.element.value;
        }
      }.bind(option)
    }
  },

  toggle: function(override) {
    if (typeof override == 'boolean') {
      this.visible = override;
    } else {
      this.visible = !this.visible;
    }

    if (this.visible) {
      this.screenOverlay.style.display = 'flex';
    } else {
      this.screenOverlay.style.display = 'none';
    }
  },

  updateOptions: function() {
    for (var i=0; i<this.options.length; i++) {
      let option = this.options[i];

      if (option.type == 'checkbox') {
        option.element.checked = option.value;
      } else if (option.type == 'slider') {
        option.element.value = option.value;
        option.valueElement.innerHTML = option.value;
      }
      // console.log(option.name + " == " + option.value);
    }
  },
};




//--------------------------------------------------------------------------------------------------------------------------------|Controls Menu
const menu_controls = {
  visible: false,
  screenOverlay: document.getElementById('screenOverlay-controlsMenu'),
  closeBtn: document.getElementById('btn-menu-close-controls'),
  contents: document.getElementById('menu-controls-contents'),
  resetBtn: document.getElementById('btn-menu-controls-resetKeybinds'),

  options: [
    {name: 'move_yNeg', element: document.getElementById('btn-menu-controls-move_yNeg'), value: 'w'},
    {name: 'move_xNeg', element: document.getElementById('btn-menu-controls-move_xNeg'), value: 'a'},
    {name: 'move_yPos', element: document.getElementById('btn-menu-controls-move_yPos'), value: 's'},
    {name: 'move_xPos', element: document.getElementById('btn-menu-controls-move_xPos'), value: 'd'},
    {name: 'move_sprint', element: document.getElementById('btn-menu-controls-move_sprint'), value: 'shift'},
    {name: 'move_jump', element: document.getElementById('btn-menu-controls-move_jump'), value: ' '},

    {name: 'look_recenter', element: document.getElementById('btn-menu-controls-look_recenter'), value: 'z'},
    {name: 'look_turnLeft', element: document.getElementById('btn-menu-controls-look_turnLeft'), value: 'arrowleft'},
    {name: 'look_turnRight', element: document.getElementById('btn-menu-controls-look_turnRight'), value: 'arrowright'},

    {name: 'action_activate', element: document.getElementById('btn-menu-controls-action_activate'), value: 'e'},
    {name: 'action_primaryAttack', element: document.getElementById('btn-menu-controls-action_primaryAttack'), value: 'f'},
    // {name: 'action_secondaryAttack', element: document.getElementById('btn-menu-controls-action_secondaryAttack'), value: '?'},
    {name: 'ui_pause', element: document.getElementById('btn-menu-controls-ui_pause'), value: 'tab'},

    {name: 'weapon_switch1', element: document.getElementById('btn-menu-controls-weapon_switch1'), value: '1'},
    {name: 'weapon_switch2', element: document.getElementById('btn-menu-controls-weapon_switch2'), value: '2'},
    {name: 'weapon_switch3', element: document.getElementById('btn-menu-controls-weapon_switch3'), value: '3'},
    {name: 'weapon_switch4', element: document.getElementById('btn-menu-controls-weapon_switch4'), value: '4'}
  ],

  remapPopup: {
    visible: false,
    container: document.getElementById('menu-controls-popup-inputRemap'),
    currentInput: null,
    toggle: function(override) {
      if (typeof override == 'boolean') {
        this.visible = override;
      } else {
        this.visible = !this.visible;
      }

      if (this.visible) {
        this.container.style.display = 'flex';
      } else {
        this.container.style.display = 'none';
        this.currentInput = null;
      }
    },
  },

  resetPopup: {
    visible: false,
    container: document.getElementById('popup-container-controls-resetKeybinds'),
    noBtn: document.getElementById('btn-popup-no-controls-resetKeybinds'),
    yesBtn: document.getElementById('btn-popup-yes-controls-resetKeybinds'),
    toggle: function(override) {
      if (typeof override == 'boolean') {
        this.visible = override;
      } else {
        this.visible = !this.visible;
      }

      if (this.visible) {
        this.container.style.display = 'flex';
      } else {
        this.container.style.display = 'none';
      }
    },
  },


  init: function() {
    this.closeBtn.addEventListener('click', function() {
      this.toggle(false);
      controlsToLocalStorage();
    }.bind(this));

    this.resetBtn.addEventListener('click', function() {
      this.resetPopup.toggle(true);
    }.bind(this));

    this.resetPopup.noBtn.addEventListener('click', function() {
      this.resetPopup.toggle(false);
    }.bind(this));

    this.resetPopup.yesBtn.addEventListener('click', function() {
      this.resetKeybinds();
      this.resetPopup.toggle(false);
    }.bind(this));


    for (var i=0; i<this.options.length; i++) {
      var btn = this.options[i];
      btn.element.addEventListener('click', function() {
        this.element.blur();
        menu_controls.remapPopup.currentInput = this;
        menu_controls.remapPopup.toggle(true);
      }.bind(btn));
    }
  },

  toggle: function(override) {
    if (typeof override == 'boolean') {
      this.visible = override;
    } else {
      this.visible = !this.visible;
    }

    if (this.visible) {
      this.screenOverlay.style.display = 'flex';
    } else {
      this.screenOverlay.style.display = 'none';

      // Ensures the reset popup is closed when this menu is closed.
      this.resetPopup.toggle(false);
    }
  },

  // Changes the element value to match the object's value property. Used after values are imported from local storage.
  updateOptions: function() {
    for (var i=0; i<this.options.length; i++) {
      let option = this.options[i];

      if (option.value == ' ') {
        option.element.innerHTML = 'space';
      } else {
        option.element.innerHTML = option.value;
      }
      // console.log(option.name + " == " + option.value);
    }
  },

  resetKeybinds: function() {
    for (var i=0; i<this.options.length; i++) {
      let option = this.options[i];
      option.value = controlDefaults[option.name];

      if (option.value == ' ') {
        option.element.innerHTML = 'space';
      } else {
        option.element.innerHTML = option.value;
      }
    }
  },
};




//--------------------------------------------------------------------------------------------------------------------------------|Pause Menu
const menu_pause = {
  visible: false,
  screenOverlay: document.getElementById('screenOverlay-pause'),
  mainContainer: document.getElementById('menu-pause'),
  buttonContainer: document.getElementById('menu-pause-buttonContainer'),
  resumeContainer: document.getElementById('menu-pause-resumeContainer'),
  mainMenuBtn: document.getElementById('btn-menu-pause-mainMenu'),
  resetBtn: document.getElementById('btn-menu-pause-reset'),
  graphicsBtn: document.getElementById('btn-menu-pause-graphics'),
  optionsBtn: document.getElementById('btn-menu-pause-options'),
  controlsBtn: document.getElementById('btn-menu-pause-controls'),
  resumeBtn: document.getElementById('btn-menu-pause-resume'),

  mainMenuPopup: {
    visible: false,
    container: document.getElementById('popup-container-mainMenu'),
    noBtn: document.getElementById('btn-popup-no-mainMenu'),
    yesBtn: document.getElementById('btn-popup-yes-mainMenu'),
    toggle: function(override) {
      if (typeof override == 'boolean') {
        this.visible = override;
      } else {
        this.visible = !this.visible;
      }

      if (this.visible) {
        this.container.style.display = 'flex';
      } else {
        this.container.style.display = 'none';
      }
    },
  },

  resetPopup: {
    visible: false,
    container: document.getElementById('popup-container-reset'),
    noBtn: document.getElementById('btn-popup-no-reset'),
    yesBtn: document.getElementById('btn-popup-yes-reset'),
    toggle: function(override) {
      if (typeof override == 'boolean') {
        this.visible = override;
      } else {
        this.visible = !this.visible;
      }

      if (this.visible) {
        this.container.style.display = 'flex';
      } else {
        this.container.style.display = 'none';
      }
    },
  },

  init: function() {
    this.resumeBtn.addEventListener('click', function() {
      this.toggle(false);
      pauseUpdate(false);
    }.bind(this));

    this.mainMenuBtn.addEventListener('click', function() {
      if (menu_pause.mainMenuPopup.visible) { return; }
      if (menu_pause.resetPopup.visible) { return; }
      this.mainMenuPopup.toggle(true);
    }.bind(this));
    this.mainMenuPopup.noBtn.addEventListener('click', function() {
      this.mainMenuPopup.toggle(false);
    }.bind(this));
    this.mainMenuPopup.yesBtn.addEventListener('click', function() {
      window.location.href = './index.html';
    });

    this.resetBtn.addEventListener('click', function() {
      if (menu_pause.mainMenuPopup.visible) { return; }
      if (menu_pause.resetPopup.visible) { return; }
      this.resetPopup.toggle(true);
    }.bind(this));
    this.resetPopup.noBtn.addEventListener('click', function() {
      this.resetPopup.toggle(false);
    }.bind(this));
    this.resetPopup.yesBtn.addEventListener('click', function() {
      location.reload();
    });

    this.graphicsBtn.addEventListener('click', function() {
      if (menu_pause.mainMenuPopup.visible) { return; }
      if (menu_pause.resetPopup.visible) { return; }
      menu_graphics.toggle(true);
    });
    this.optionsBtn.addEventListener('click', function() {
      if (menu_pause.mainMenuPopup.visible) { return; }
      if (menu_pause.resetPopup.visible) { return; }
      menu_options.toggle(true);
    });
    this.controlsBtn.addEventListener('click', function() {
      if (menu_pause.mainMenuPopup.visible) { return; }
      if (menu_pause.resetPopup.visible) { return; }
      menu_controls.toggle(true);
    });
  },

  toggle: function(override) {
    if (typeof override == 'boolean') {
      this.visible = override;
    } else {
      this.visible = !this.visible;
    }

    if (this.visible) {
      this.screenOverlay.style.display = 'block';
    } else {
      this.screenOverlay.style.display = 'none';

      // Ensures the reset & mainMenu popups are closed when the pause menu is closed.
      this.mainMenuPopup.toggle(false);
      this.resetPopup.toggle(false);
    }
  },
};




//--------------------------------------------------------------------------------------------------------------------------------|Game Over Screen
const menu_gameOver = {
  visible: false,
  screenOverlay: document.getElementById('screenOverlay-gameOver'),
  restartBtn: document.getElementById('btn-menu-gameOver-restart'),
  mainMenuBtn: document.getElementById('btn-menu-gameOver-mainMenu'),

  init: function() {
    this.restartBtn.addEventListener('click', function() {
      location.reload();
    });
    this.mainMenuBtn.addEventListener('click', function() {
      window.location.href = './index.html';
    });
  },

  toggle: function(override) {
    if (typeof override == 'boolean') {
      this.visible = override;
    } else {
      this.visible = !this.visible;
    }

    if (this.visible) {
      this.screenOverlay.style.display = 'flex';
    } else {
      this.screenOverlay.style.display = 'none';
    }
  },
};




//--------------------------------------------------------------------------------------------------------------------------------|Local Storage Functions
function optionsToLocalStorage() {
  var generalOptions = {};
  for (var i=0; i<menu_options.options.length; i++) {
    let option = menu_options.options[i];
    generalOptions[option.name] = option.value;
  }
  localStorage.setItem('generalOptions', JSON.stringify(generalOptions));

  updateOptionValues();
}

function graphicsToLocalStorage() {
  var graphicOptions = {};
  for (var i=0; i<menu_graphics.options.length; i++) {
    let option = menu_graphics.options[i];
    graphicOptions[option.name] = option.value;
  }
  localStorage.setItem('graphicOptions', JSON.stringify(graphicOptions));

  updateOptionValues();
}

function controlsToLocalStorage() {
  var controlOptions = {};
  for (var i=0; i<menu_controls.options.length; i++) {
    let option = menu_controls.options[i];
    controlOptions[option.name] = option.value;
  }
  localStorage.setItem('controlOptions', JSON.stringify(controlOptions));

  updateOptionValues();
}


function localStorageToOptions() {
  var lsOptions = JSON.parse(localStorage.getItem('generalOptions'));
  // if no options are saved to local storage - skip this function
  if (lsOptions === null) { return; }

  for (var i=0; i<menu_options.options.length; i++) {
    let option = menu_options.options[i];
    if (!lsOptions.hasOwnProperty(option.name)) { continue; }
    option.value = lsOptions[option.name];
  }
  menu_options.updateOptions();
}

function localStorageToGraphics() {
  var lsOptions = JSON.parse(localStorage.getItem('graphicOptions'));
  // if no options are saved to local storage - skip this function
  if (lsOptions === null) { return; }

  for (var i=0; i<menu_graphics.options.length; i++) {
    let option = menu_graphics.options[i];
    if (!lsOptions.hasOwnProperty(option.name)) { continue; }
    option.value = lsOptions[option.name];
  }
  menu_graphics.updateOptions();
}

function localStorageToControls() {
  var lsOptions = JSON.parse(localStorage.getItem('controlOptions'));
  // if no options are saved to local storage - skip this function
  if (lsOptions === null) { return; }

  for (var i=0; i<menu_controls.options.length; i++) {
    let option = menu_controls.options[i];
    if (!lsOptions.hasOwnProperty(option.name)) { continue; }
    option.value = lsOptions[option.name];
  }
  menu_controls.updateOptions();
}




//--------------------------------------------------------------------------------------------------------------------------------|Init Menus
function init_menus() {
  menu_graphics.init();
  menu_options.init();
  menu_controls.init();
  menu_pause.init();
  menu_gameOver.init();

  localStorageToGraphics();
  localStorageToOptions();
  localStorageToControls();
}
init_menus();


// Controls input remapping
document.addEventListener('keyup', function(e) {
  // if (!this.visible) { return; }
  if (!this.remapPopup.visible) { return; }

  if (e.key == 'Escape') {
    this.remapPopup.toggle(false);
  } else {
    this.options[this.options.indexOf(this.remapPopup.currentInput)].value = e.key.toLowerCase();

    if (e.key == ' ') {
      this.options[this.options.indexOf(this.remapPopup.currentInput)].element.innerHTML = 'space';
    } else {
      this.options[this.options.indexOf(this.remapPopup.currentInput)].element.innerHTML = e.key.toLowerCase();
    }

    this.remapPopup.toggle();
  }
}.bind(menu_controls));




//--------------------------------------------------------------------------------------------------------------------------------|Popup Text
/*function popupText(text) {
  overlayContext.fillStyle = colors.overlayTextFill;
  overlayContext.lineWidth = 2;
  overlayContext.strokeStyle = colors.overlayTextStroke;
  overlayContext.textAlign = "center";
  overlayContext.textBaseline = "top";
  overlayContext.fillStyle = colors.overlayTextFill;
  overlayContext.strokeText(text, center.x, 128);
  overlayContext.fillText(text, center.x, 128);
}*/

const popupText = {
  container: document.getElementById('popupTextContainer'),
  timer: null,
  msgLog: [],
  colors: {
    "bg": docStyle.getPropertyValue("--popupText-color-bg"),
    "text": docStyle.getPropertyValue("--popupText-color-text"),
    "stroke": docStyle.getPropertyValue("--popupText-color-stroke")
  },

  init: function() {
    this.timer = TimerFactory.newActionLoopingTimer(512, popupText.updateElement);
    this.emptyContainerUpdate();
  },

  newMsg: function(text, duration=null) {
    if (duration == null) { duration = text.length * 148; }
    this.msgLog.push({"text": text, "duration": duration});
    if (this.msgLog.length == 1) {
      this.changeMsg();
      this.timer.pauseUpdate(false);
    }
  },

  changeMsg: function() {
    this.container.style.background = this.colors.bg;
    this.container.style.color = this.colors.text;
    this.container.style.webkitTextStroke = "2px " + this.colors.stroke;
    this.container.style.borderRadius = "0.14em";

    if (this.msgLog[0].text.length >= 512) {
      this.container.style.fontSize = "2.6rem";
      this.container.style.bottom = "4px";
    } else {
      this.container.style.fontSize = "3.2rem";
      this.container.style.bottom = "5rem";
    }

    this.container.innerHTML = this.msgLog[0].text;
    this.timer.newDuration(this.msgLog[0].duration);
    console.log(this.msgLog[0].text);
  },

  emptyContainerUpdate: function () {
    this.timer.pauseUpdate(true);
    // this.container.innerHTML = "&nbsp";
    this.container.style.background = "#00000000";
    this.container.style.color = "#00000000";
    this.container.style.webkitTextStroke = "2px #00000000";
    this.container.style.borderRadius = "8em";
    this.container.style.fontSize = "0.1rem";
  }
};

// updateElement declared outside object for self referencing binding.
popupText.updateElement = function() {
  this.msgLog.splice(0, 1);
  if (this.msgLog.length < 1) {
    this.emptyContainerUpdate();
    return;
  }
  this.changeMsg();
}.bind(popupText);

popupText.init();

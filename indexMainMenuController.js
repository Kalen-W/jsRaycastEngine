//--------------------------------------------------------------------------------------------------------------------------------|Main Menu
const menu_main = {
  visible: false,
  screenOverlay: document.getElementById('screenOverlay-mainMenu'),
  title: document.getElementById('menu-main-title'),
  buttonContainer: document.getElementById('menu-main-buttonContainer'),
  startBtn: document.getElementById('btn-menu-main-start'),
  graphicsBtn: document.getElementById('btn-menu-main-graphics'),
  optionsBtn: document.getElementById('btn-menu-main-options'),
  controlsBtn: document.getElementById('btn-menu-main-controls'),
  quitBtn: document.getElementById('btn-menu-main-quit'),

  init: function() {
    this.startBtn.addEventListener('click', function() {
      graphicsToLocalStorage();
      optionsToLocalStorage();
      controlsToLocalStorage();
      menu_levelSelect.toggle(true);
    });

    this.graphicsBtn.addEventListener('click', function() {
      menu_graphics.toggle(true);
    });
    this.optionsBtn.addEventListener('click', function() {
      menu_options.toggle(true);
    });
    this.controlsBtn.addEventListener('click', function() {
      menu_controls.toggle(true);
    });
    this.quitBtn.addEventListener('click', function() {
      window.close();
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




//--------------------------------------------------------------------------------------------------------------------------------|Level Select Menu
const menu_levelSelect = {
  visible: false,
  screenOverlay: document.getElementById('screenOverlay-levelSelect'),
  closeBtn: document.getElementById('btn-menu-close-levelSelect'),

  levels: [ // TODO: Dynamically create elements for this array.
    {name: 'suburbIntro', element: document.getElementById('menu-levelSelect-levelContainer-suburbIntro')},
    {name: 'strongholdDungeon', element: document.getElementById('menu-levelSelect-levelContainer-strongholdDungeon')},
    {name: 'theMine', element: document.getElementById('menu-levelSelect-levelContainer-theMine')},
    {name: 'largeTestMap', element: document.getElementById('menu-levelSelect-levelContainer-largeTestMap')},
    {name: 'miscTestMap', element: document.getElementById('menu-levelSelect-levelContainer-miscTestMap')},
    {name: 'wallHeightTestMap', element: document.getElementById('menu-levelSelect-levelContainer-miscTestingMap')},
  ],

  init: function() {
    this.closeBtn.addEventListener('click', function() {
      this.toggle(false);
    }.bind(this));

    // Assigns oninput event listener to each options element to update its value property.
    for (var i=0; i<this.levels.length; i++) {
      let level = this.levels[i];
      level.element.addEventListener('click', function() {
        const urlParams = new URLSearchParams({map: this.name});
        window.location.href='./game.html?' + urlParams.toString();
      }.bind(level));
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

  remapPopup: { // Remapping controlled by event listener near bottom of this file.
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




//--------------------------------------------------------------------------------------------------------------------------------|Local Storage Functions
function optionsToLocalStorage() {
  var generalOptions = {};

  for (var i=0; i<menu_options.options.length; i++) {
    let option = menu_options.options[i];
    // if (option.value == generalOptions[option.name]) { continue; }
    generalOptions[option.name] = option.value;
  }
  localStorage.setItem('generalOptions', JSON.stringify(generalOptions));
}

function graphicsToLocalStorage() {
  var graphicOptions = {};

  for (var i=0; i<menu_graphics.options.length; i++) {
    let option = menu_graphics.options[i];
    graphicOptions[option.name] = option.value;
  }
  localStorage.setItem('graphicOptions', JSON.stringify(graphicOptions));
}

function controlsToLocalStorage() {
  var controlOptions = {};

  for (var i=0; i<menu_controls.options.length; i++) {
    let option = menu_controls.options[i];
    controlOptions[option.name] = option.value;
  }
  localStorage.setItem('controlOptions', JSON.stringify(controlOptions));
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
  menu_main.init();
  menu_levelSelect.init();
  menu_graphics.init();
  menu_options.init();
  menu_controls.init();
  // menu_pause.init();

  localStorageToOptions();
  localStorageToGraphics();
  localStorageToControls();
}
init_menus();



document.addEventListener('keydown', (e) => {
  if (e.key == 'Tab' && menu_controls.visible) {
    e.preventDefault();
  }
});


document.addEventListener('keyup', function(e) {
  if (e.key == ' ') { e.preventDefault(); }
  // closes menus
  if (e.key == 'Escape') {
    if (menu_graphics.visible) { menu_graphics.toggle(false); }
    if (menu_options.visible) { menu_options.toggle(false); }
    if (menu_controls.visible && !menu_controls.remapPopup.visible) { menu_controls.toggle(false); }
  }
});


// Controls input remapping
document.addEventListener('keyup', function(e) {
  if (!this.remapPopup.visible) { return; }
  if (e.key == 'Escape') {
    this.remapPopup.toggle(false);
    return;
  }

  this.options[this.options.indexOf(this.remapPopup.currentInput)].value = e.key.toLowerCase();
  // this.options[this.options.indexOf(this.remapPopup.currentInput)].element.innerHTML = e.code;

  if (e.key == ' ') {
    this.options[this.options.indexOf(this.remapPopup.currentInput)].element.innerHTML = 'space';
  } else {
    this.options[this.options.indexOf(this.remapPopup.currentInput)].element.innerHTML = e.key.toLowerCase();
  }

  this.remapPopup.toggle();
}.bind(menu_controls));
// TODO: Add support for binding mouse buttons.

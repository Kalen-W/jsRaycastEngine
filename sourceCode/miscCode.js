// XCVIII
// 06-18-2022

// This project is based off the following tutorial: youtu.be/5nSFArCgCXA
// This tutorial's code can also be found on GitHub: github.com/satansdeer/raycaster

// Additional features, such as wall texture rendering, figured out with the assistance of the additional following tutorials:
// dev.opera.com/articles/3d-games-with-canvas-and-raycasting-part-1/
// permadi.com/1996/05/ray-casting-tutorial-table-of-contents/
// lodev.org/cgtutor/raycasting.html

// To Do:
// ================================
// Sky and floor texture rendering
// Fix sprite/enemy rendering (so they don't appear to slide when rotating)
// Distance based texture altering (making textures darker if further away) - ?
// Rework sprite collision (make it circular / distance based)
// Touchscreen control options
// Gamepad API (developer.mozilla.org/en-US/docs/Web/API/Gamepad_API) - ?

// Notable Bugs:
// ================================
// Changing to a map larger than the current one breaks the game.
// Map items/sprites and enemies aren't correctly cleared when changing maps.
// -- Both above bugs are circumvented by simply changing URL param and reloading the page.




//--------------------------------------------------------------------------------------------------------------------------------|Options Functions
// toggleFullscreen code is from: w3schools.com/howto/howto_js_fullscreen.asp
function toggleFullscreen() {
  var elem = document.documentElement;
  /*options.fullscreen = !options.fullscreen;
  if (options.fullscreen) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }*/

  if (document.fullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } else {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }
}


function init_mapEditor() {
  // Saves currentMap to localStorage and creates mapEditor IFrame.
  localStorage.setItem('mapEditorReturn', JSON.stringify(
    { visible: false, mapData: currentMap }
  ));
  mapEditor = document.getElementById('mapEditor-container');
  mapEditorFrame = document.createElement('iframe');

  mapEditorFrame.src = './mapEditor/mapEditor.html';
  mapEditorFrame.id = 'mapEditor-frame';
  mapEditorFrame.style.position = 'absolute';
  mapEditorFrame.style.left = '0px';
  mapEditor.appendChild(mapEditorFrame);
}


function toggleMapEditor() {
  mapEditorVisible = !mapEditorVisible;
  console.log("mapEditorVisible = " + mapEditorVisible);

  if (mapEditorVisible) {
    pauseUpdate(true);
    localStorage.setItem('mapEditorReturn', JSON.stringify(
      { visible: true, mapData: currentMap }
    ));

    mapEditor.style.display = "block";
    mapEditorFrame.contentWindow.focus();
  } else {
    var mapEditorReturn = JSON.parse(localStorage.getItem('mapEditorReturn'));
    currentMap = mapEditorReturn.mapData;

    window.focus();
    mapEditor.style.display = "none";
    pauseUpdate(false);
  }
}

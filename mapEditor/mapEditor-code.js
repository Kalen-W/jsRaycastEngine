//--------------------------------------------------------------------------------------------------------------------------------|Variables
var lines = [];
const mapTable = document.getElementById("mapTable");
const printDiv = document.getElementById("printDiv");
const printDiv_inner = document.getElementById("printDiv-inner");

const numChangeOptions = [
  document.getElementById('numChange-0'),
  document.getElementById('numChange-1'),
  document.getElementById('numChange-2'),
  document.getElementById('numChange-3'),
  document.getElementById('numChange-4'),
  document.getElementById('numChange-5'),
  document.getElementById('numChange-6'),
  document.getElementById('numChange-7')
];

var printDivVisible = false;
var numChange = 1;

var rmbNum = 2;
var lmbNum = 0;
var mouseLeftIsDown = false;
var mouseRightIsDown = false;




//--------------------------------------------------------------------------------------------------------------------------------|Create Table
function createTable(array) {
  array.forEach((item, i) => {
    lines[i] = document.createElement("tr");
    item.forEach((item2, i2) => {
      var cell = document.createElement("td");
      // Prototype map data to objects change.
      // cell.classList.add('cell-' + item2.type);
      // cell.innerHTML = item2.type;
      cell.classList.add('cell-' + item2);
      cell.innerHTML = item2;


      cell.onmousedown = function(e) {
        // console.log(i2 + " - " + i);
        if (e.button == rmbNum) {
          if (currentMap[i][i2] == 0) { return; }

          cell.classList.remove('cell-' + this.innerHTML);
          currentMap[i][i2] = 0;
          cell.classList.add('cell-' + 0);
          this.innerHTML = 0;
        } else if (e.button == lmbNum) {
          if (currentMap[i][i2] == numChange) { return; }

          cell.classList.remove('cell-' + this.innerHTML);
          currentMap[i][i2] = numChange;
          cell.classList.add('cell-' + numChange);
          this.innerHTML = numChange;
        }
      };


      cell.onmouseover = function(e) {
        if (mouseRightIsDown) {
          if (currentMap[i][i2] == 0) { return; }

          cell.classList.remove('cell-' + this.innerHTML);
          currentMap[i][i2] = 0;
          cell.classList.add('cell-' + 0);
          this.innerHTML = 0;
        }else if (mouseLeftIsDown) {
          if (currentMap[i][i2] == numChange) { return; }

          cell.classList.remove('cell-' + this.innerHTML);
          currentMap[i][i2] = numChange;
          cell.classList.add('cell-' + numChange);
          this.innerHTML = numChange;
        }
      }


      var xPos = i2;
      var yPos = i;
      if (i2 < 10) { xPos = "0" + i2; }
      if (i < 10) { yPos = "0" + i; }
      cell.title = "x: " + xPos + "  |  y: " + yPos;
      lines[i].appendChild(cell);
    });

    lines[i].id = "line" + i;
    mapTable.appendChild(lines[i]);
  });
}




//--------------------------------------------------------------------------------------------------------------------------------|Print Div Section
function printTable(array) {
  var outputText = "[\n";
  for (var row=0; row<array.length; row++) {
    outputText += "  [";
    for (var col=0; col<array[row].length; col++) {
      outputText += array[row][col];
      if (col < array[row].length-1) { outputText += ", "; }
    }

    if (row < array.length-1) { outputText += "],\n";
    } else { outputText += "]\n"; }
  }
  outputText += "];";
  return outputText;
}


function movePrintDiv() {
  printDivVisible = !printDivVisible;
  console.log("printDivVisible = " + printDivVisible);
  if (printDivVisible) {
    //printDiv_inner.innerHTML = printTable(currentMap);
    printDiv_inner.value = printTable(currentMap);
    printDiv_inner.select();

    printDiv.style['left'] = "0%";
    //printDiv.style['opacity'] = "100%";
    //printDiv.style['background'] = "#2f3336f0";
    document.documentElement.style.setProperty('--printDiv-hoverTrans', 'translateX(0)');
    document.documentElement.style.setProperty('--printDiv-hoverColor', '#2a2e30f0');
    document.documentElement.style.setProperty('--printDiv-color', '#2a2e30f0');
    //document.documentElement.style.setProperty('--printDiv-hoverOpacity', '100%');
    //document.documentElement.style.setProperty('--printDiv-transitionTime', '1.4s');
  } else {
    printDiv.style['left'] = "-98.5%";
    //printDiv.style['opacity'] = "20%";
    //printDiv.style['background'] = "#9090901c";
    document.documentElement.style.setProperty('--printDiv-hoverTrans', 'translateX(1.4%)');
    document.documentElement.style.setProperty('--printDiv-hoverColor', '#90909034');
    document.documentElement.style.setProperty('--printDiv-color', '#9090901c');
    //document.documentElement.style.setProperty('--printDiv-hoverOpacity', '38%');
    //document.documentElement.style.setProperty('--printDiv-transitionTime', '.4s');
  }
}


function stopMovePrintDiv(e) {
  if (printDivVisible) { e.stopPropagation(); }
}




//--------------------------------------------------------------------------------------------------------------------------------|Options Section
function setNumChange(num) {
  if (num == numChange) { return; }

  numChangeOptions[numChange].style['border'] = '1px solid #919a9e88';
  numChangeOptions[num].style['border'] = '2px solid #ced8dc98';

  numChange = num;
}




//--------------------------------------------------------------------------------------------------------------------------------|Event Listeners
document.addEventListener("mousedown", (e) => {
  if (e.button == rmbNum) { mouseRightIsDown = true; }
  if (e.button == lmbNum) { mouseLeftIsDown = true; }
});
document.addEventListener("mouseup", (e) => {
  if (e.button == rmbNum) { mouseRightIsDown = false; }
  if (e.button == lmbNum) { mouseLeftIsDown = false; }
});


document.addEventListener("keyup", (e) => {
  if (e.key == "0") {
    setNumChange(0);
  } else if (e.key == "1") {
    setNumChange(1);
  } else if (e.key == "2") {
    setNumChange(2);
  } else if (e.key == "3") {
    setNumChange(3);
  } else if (e.key == "4") {
    setNumChange(4);
  } else if (e.key == "5") {
    setNumChange(5);
  } else if (e.key == "6") {
    setNumChange(6);
  } else if (e.key == "7") {
    setNumChange(7);
  } else if (e.key == "`" && inIframe()) {
    // Sets currentMap to localStorage, which is read to update the game's map.
    var mapEditorReturn = { visible: false, mapData: currentMap };
    localStorage.setItem('mapEditorReturn', JSON.stringify(mapEditorReturn));
  }
});


document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});




//--------------------------------------------------------------------------------------------------------------------------------|Displayed as Nested Iframe Section
function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
  return false;
}


var closeBtn = {
  visible: inIframe(),
};


function createCloseBtn() {
  if (closeBtn.visible) {
    closeBtn.element = document.createElement('button');
    closeBtn.element.id = 'closeBtn';
    closeBtn.element.innerHTML = 'X';
    closeBtn.element.classList.add('alignItems');

    closeBtn.element.addEventListener('click', (e) => {
      // Sets currentMap to localStorage, which is read to update the game's map.
      var mapEditorReturn = { visible: false, mapData: currentMap };
      localStorage.setItem('mapEditorReturn', JSON.stringify(mapEditorReturn));
    });

    document.body.appendChild(closeBtn.element);
  }
}




//--------------------------------------------------------------------------------------------------------------------------------|Initialization
function init() { // ran by body's onload event
  if (inIframe()) { // Retrieves currentMap from local storage.
    var mapEditorReturn = JSON.parse(localStorage.getItem('mapEditorReturn'));
    if (typeof mapEditorReturn.mapData != 'undefined') {
      currentMap = mapEditorReturn.mapData;
    } else {
      console.error("No valid map data");
    }
  }

  createTable(currentMap);
  createCloseBtn();
  // setNumChange(0);
  document.getElementById('numChange-1').style['border'] = '2px solid #ced8dc98';
}

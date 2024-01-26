// Get html elements
const canvas = document.getElementById("renderer");
const ctx = canvas.getContext("2d");

const typeText = document.querySelector("#type");

// Constants
const ZOOM_SPEED = 1;
const EXPORT_CELL_SIZE = 25;

// Variables
let camX = 0;
let camY = 0;

let selectedColor = "#000000";
let selectedType = 0;
let onPalette = false;

// Mouse
let mouseX = 0;
let mouseY = 0;
let mouseLeft = false;
let mouseRight = false;
let mouseCamOffsetX = 0;
let mouseCamOffsetY = 0;

let coordX = 0;
let coordY = 0;

let shiftLeft = false;

let map = [];
let bigBlocks;
let bigLineBlocks
let CellSize = 30;

let materialTypes = [[1, "stone"], [2, "dirt"], [3, "grass"], [4, "sand"], [201, "concrete wall"], [602, "road"]];
let materials = [["gray", 1], ["saddlebrown", 2], ["green", 3], ["yellow", 4], ["gray", 201],
["graytext", 602], ["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0],
["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0],
["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0], ["#000000", 0]];

let HTMLpalette = "";
for (let material of materials) {
    HTMLpalette += `<button onclick="selectedColor = '${material[0]}'; selectedType = ${material[1]}"
    style="background-color: ${material[0]}"></button>`;
}
document.querySelector("#palette").innerHTML = HTMLpalette;

// Functions
function getCellIndex(x, y) {
    for (let i = 0; i < map.length; i++) {
        if (map[i][0][0] === x && map[i][0][1] === y) {
            return i;
        }
    }

    return null;
}

function getBigBlockIndex(x, y) {
    for (let i = 0; i < bigBlocks.length; i++) {
        if (bigBlocks[0] === x && bigBlocks[1] === y) {
            return i;
        }
    }

    return null;
}

function placePixel(x, y) {
    let index = getCellIndex(x, y);
    if (index !== null) {
        if (selectedColor !== "#000000") {
            map[index][1] = selectedColor;
            map[index][2] = selectedType
        } else {
            map.splice(index, 1);  
        }
    } else if (selectedColor !== "#000000") {
        map.push([[x, y], selectedColor, selectedType]);
    }
}

function getCode() {
    let string = "";
    for (let block of bigBlocks) {
        string += `{"x" : ${block[0] * EXPORT_CELL_SIZE},"y" : ${block[1] * EXPORT_CELL_SIZE}, "width" : ${block[2] * EXPORT_CELL_SIZE}, "height" : ${block[3] * EXPORT_CELL_SIZE},"type" : ${block[4]}},`;
    }
    return string;
}

function isABloc(x, y, type = null) {
    for (let element of map) {
        if (element[0][0] === x && element[0][1] === y && (element[2] === type || type === null)) {
            return true;
        }
    }
    
    return false;
}

function exportMap() {
    console.log(JSON.stringify(map));
}

function importMap(mapString) {
    map = JSON.parse(mapString);
}

// Import the map from the local storage
let storedMap = localStorage.getItem("map");
if (storedMap != null) {
    map = JSON.parse(storedMap);
}
   

// Loop function
setInterval(() => {
    bigBlocks = [];
    bigLineBlocks = [];
    
    // Create lines
    for (let element of map) {
        if (!isABloc(element[0][0] - 1, element[0][1], element[2])) {
            let endFound = false;
            let lenght = 0;
            while (!endFound) {
                lenght ++;
                if (!isABloc(element[0][0] + lenght, element[0][1], element[2])) {
                    endFound = true;
                }
            }
            bigLineBlocks.push([element[0][0], element[0][1], lenght, 1, element[2]]);
        }
    }

    // Delete useless lines
    for (let i = 0; i < bigLineBlocks.length; i++) {
        let isOnTop = true;
        for (let j = 0; j < bigLineBlocks.length; j ++) {
            if (bigLineBlocks[j][2] === bigLineBlocks[i][2] && bigLineBlocks[j][1] + 1 === bigLineBlocks[i][1] &&
                bigLineBlocks[j][0] === bigLineBlocks[i][0] && bigLineBlocks[j][4] === bigLineBlocks[i][4]) {
                isOnTop = false;
            }
        }
        if (isOnTop) {
            bigBlocks.push(bigLineBlocks[i]);
        }
    }

    // Create big blocks
    for (let i = 0; i < bigBlocks.length; i++) {
        let endFound = false;
        let lenght = 0;
        while (!endFound) {
            lenght ++;
            for (let j = bigBlocks[i][0]; j < bigBlocks[i][0] + bigBlocks[i][2]; j ++) {
                if (!isABloc(j, bigBlocks[i][1] + lenght, bigBlocks[i][4])) {
                    endFound = true;
                }
            }
            if (isABloc(bigBlocks[i][0] - 1, bigBlocks[i][1] + lenght, bigBlocks[i][4]) ||
            isABloc(bigBlocks[i][0] + bigBlocks[i][2], bigBlocks[i][1] + lenght, bigBlocks[i][4])) {
                endFound = true
            }
        }
        bigBlocks[i][3] = lenght;
    }

    // Store the map
    localStorage.setItem("map", JSON.stringify(map));
    
    if((mouseLeft && shiftLeft) || mouseRight) {
        camX = mouseX + mouseCamOffsetX;
        camY = mouseY + mouseCamOffsetY;
    } else if (mouseLeft && !onPalette) {
        // Draw
        placePixel(coordX, coordY);
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Draw the map
    for (let block of bigBlocks) {
        for (let material of materials) {
            if (material[1] === block[4]) {
                ctx.fillStyle = material[0];
                break;
            }
        }

        ctx.fillRect(block[0] * CellSize + camX, block[1] * CellSize + camY, block[2] * CellSize, block[3] * CellSize);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 5;
        ctx.strokeRect(block[0] * CellSize + camX, block[1] * CellSize + camY, block[2] * CellSize, block[3] * CellSize);
    }

    // Mouse
    ctx.strokeStyle = "white";
    ctx.fillStyle = selectedColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(coordX * CellSize + camX, coordY * CellSize + camY, CellSize, CellSize);
    ctx.fillRect(coordX * CellSize + camX + CellSize / 3, coordY * CellSize + camY + CellSize / 3, CellSize / 3, CellSize / 3);

    // Type of the selected material
    if (selectedType === 0) {
        typeText.innerHTML = "Erase";
    } else {
        for (let type of materialTypes) {
            if (type[0] === selectedType) {
                typeText.innerHTML = type[1];
                break;
            }
        }
    }
});

document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    coordX = Math.floor((mouseX - camX) / CellSize);
    coordY = Math.floor((mouseY - camY) / CellSize);
    document.querySelector("#coordinates").innerHTML = `${coordX} : ${coordY}`;
});

document.addEventListener("mousedown", (e) => {
    if (e.which === 1) {
        mouseLeft = true;
        mouseCamOffsetX = camX - mouseX;
        mouseCamOffsetY = camY - mouseY;
    }
    if (e.which === 3) {
        mouseRight = true;
        mouseCamOffsetX = camX - mouseX;
        mouseCamOffsetY = camY - mouseY;
    }
});

document.addEventListener("keydown", (e) => {
    if (e.code === "ShiftLeft") {
        shiftLeft = true;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ShiftLeft") {
        shiftLeft = false;
    }
});

document.addEventListener("mouseup", (e) => {
    if (e.which === 1) {
        mouseLeft = false;
    }
    if (e.which === 3) {
        mouseRight = false;
    }
});

document.addEventListener("wheel", (e) => {
    let previousMouseX =  (mouseX - camX) / CellSize;
    let previousMouseY =  (mouseY - camY) / CellSize;
    CellSize -= e.deltaY / 100 * ZOOM_SPEED;
    if (CellSize < 3) {
        CellSize = 3;
    }
    let nowMouseX = (mouseX - camX) / CellSize;
    let nowMouseY = (mouseY - camY) / CellSize;
    camX += (nowMouseX - previousMouseX) * CellSize;
    camY += (nowMouseY - previousMouseY) * CellSize;
    coordX = Math.floor((mouseX - camX) / CellSize);
    coordY = Math.floor((mouseY - camY) / CellSize);
    document.querySelector("#coordinates").innerHTML = `${coordX} : ${coordY}`;
});

document.querySelector("#palette").addEventListener("mouseenter", () => {
    onPalette = true;
});

document.querySelector("#palette").addEventListener("mouseleave", () => {
    onPalette = false;
});

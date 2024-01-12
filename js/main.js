/**
 * GTA - 2D main script
 * @version 1.0.0
 */

"use strict";

//#region Constants

// Get the canvas
const CANVAS = document.querySelector("canvas");
const CTX = CANVAS.getContext("2d");

// Player
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;

const PLAYER_MAX_SPEED = 5;
const PLAYER_FRAME_TO_MAX_SPEED = 100;
const PLAYER_FRAME_TO_STOP = 50;

// Camera
const CAMERA_MOVE_DIVIDER = 10;

const RENDER_DISTANCE = 1000; // Maximal distance where elements are rendered

// Delta-time
const DEFAULT_FPS = 60;

//#endregion

//#region class

class Player {
    x = 0;
    y = 0;
}

//#endregion

//#region Global-variables

// Get the map from map.json
import mapJson from "./map.json" assert {type: "json"};

// Player
let player = new Player();
let playerHorizontalSpeed = 0;
let playerVerticalSpeed = 0;

// Inputs
let leftPressed = false;
let rightPressed = false;
let forwardPressed = false;
let backwardPressed = false;


// Camera
let cameraX = 0;
let cameraY = 0;

// Delta-time
let deltaTime = 1;
let lastTick = performance.now();

//#endregion

//#region Functions

/**
 * Display all the elements in the range of the render distance.
 */
function displayElementsInRange() {
    // Get the elements in range
    let elementsInRange = [];
    for (let element of mapJson.elements) {
        if (Math.sqrt(Math.pow(element.x - player.x + PLAYER_WIDTH / 2, 2) +
            Math.pow(element.y - player.y + PLAYER_HEIGHT / 2, 2)) <= RENDER_DISTANCE) {
            elementsInRange.push(element);
        }
    }

    // Display the elements in range
    for (let element of elementsInRange) {
        // Get the texture of the element
        let color = "";
        switch (element.type) {
            case 1: color = "gray"; break;
            case 2: color = "saddlebrown"; break;
            case 3: color = "green"; break;
        }

        // Display the element
        CTX.fillStyle = color;
        CTX.fillRect(element.x - cameraX, element.y - cameraY, element.width, element.height);
    }
}

/**
 * Adapt the canvas size to the window size
 */
function updateCanvasSize() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
}

/**
 * Display the player on the canvas
 */
function drawPlayer() {
    CTX.fillStyle = "black";
    CTX.fillRect(player.x - cameraX, player.y - cameraY, PLAYER_WIDTH, PLAYER_HEIGHT);
}

/**
 * Move the player according to the player's inputs
 */
function movePlayer() {
    // Left
    if (leftPressed && playerHorizontalSpeed > -PLAYER_MAX_SPEED) {
        playerHorizontalSpeed -= PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED;
    }

    // Right
    if (rightPressed && playerHorizontalSpeed < PLAYER_MAX_SPEED) {
        playerHorizontalSpeed += PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED;
    }

    // Forward
    if (forwardPressed && playerVerticalSpeed > -PLAYER_MAX_SPEED) {
        playerVerticalSpeed -= PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED;
    }

    // Backward
    if (backwardPressed && playerVerticalSpeed < PLAYER_MAX_SPEED) {
        playerVerticalSpeed += PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED;
    }

    // When we don't move, reduce speed
    if (!leftPressed && !rightPressed && !forwardPressed && !backwardPressed) {
        // Horizontal
        if (Math.abs(playerHorizontalSpeed) < PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED) {
            playerHorizontalSpeed = 0;
        } else {
            playerHorizontalSpeed += PLAYER_MAX_SPEED /
                PLAYER_FRAME_TO_STOP * (playerHorizontalSpeed > 0 ? -1 : 1);
        }

        // Vertical
        if (Math.abs(playerVerticalSpeed) < PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED) {
            playerVerticalSpeed = 0;
        } else {
            playerVerticalSpeed += PLAYER_MAX_SPEED /
                PLAYER_FRAME_TO_STOP * (playerVerticalSpeed > 0 ? -1 : 1);
        }
    }

    player.x += playerHorizontalSpeed * deltaTime;
    player.y += playerVerticalSpeed * deltaTime;
}

// Main function
function tick() {
    // Delta-time
    deltaTime = (performance.now() - lastTick) / (1000 / DEFAULT_FPS);
    lastTick = performance.now();

    // Update the size of the canvas
    updateCanvasSize();

    // Update camera position
    cameraX += (player.x + PLAYER_WIDTH / 2 - CANVAS.width  / 2 - cameraX) / CAMERA_MOVE_DIVIDER * deltaTime;
    cameraY += (player.y + PLAYER_HEIGHT / 2 - CANVAS.height / 2 - cameraY) / CAMERA_MOVE_DIVIDER * deltaTime;

    // Display the map
    displayElementsInRange();

    // Move the player
    movePlayer();

    // Draw the player
    drawPlayer();
}

//#endregion

// Sort the map by the z-index of the elements
mapJson.elements.sort((a, b) => {
    return a.z_index - b.z_index;
});

// Start the game loop
setInterval(tick, 0)

//#region Inputs

// Detect if a key is pressed
document.addEventListener("keydown", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        leftPressed = true;
    }

    // Right
    if (e.key === "d"|| e.key === "D" || e.key === "ArrowRight") {
        rightPressed = true;
    }

    // Forward
    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        forwardPressed = true;
    }

    // Backward
    if (e.key === "s" ||e.key === "S" || e.key === "ArrowDown") {
        backwardPressed = true;
    }
});

// Detect if a key is released
document.addEventListener("keyup", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        leftPressed = false;
    }

    // Right
    if (e.key === "d"|| e.key === "D" || e.key === "ArrowRight") {
        rightPressed = false;
    }

    // Forward
    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        forwardPressed = false;
    }

    // Backward
    if (e.key === "s" ||e.key === "S" || e.key === "ArrowDown") {
        backwardPressed = false;
    }
});

//#endregion

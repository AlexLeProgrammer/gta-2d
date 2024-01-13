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

const PLAYER_MAX_SPEED = 3;
const PLAYER_FRAME_TO_MAX_SPEED = 100;
const PLAYER_FRAME_TO_STOP = 50;

// Camera
const CAMERA_MOVE_DIVIDER = 10;

const RENDER_DISTANCE = 1000; // Maximal distance where elements are rendered

// Delta-time
const DEFAULT_FPS = 60;

// Cars
const CAR_RANGE = 50;

//#endregion

//#region class

/**
 * Represent a player.
 */
class Player {
    x = 0;
    y = 0;
    carDrivingIndex = -1; // -1 : no car
}

/**
 * Represent a car.
 */
class Car {
    x = 0;
    y = 0;
    width;
    height;
    rotation; // Degrees
    color;
    maxSpeed;
    frameToMaxSpeed;
    frameToStop;
    rotationSpeed; // Degrees / frame

    constructor(x = 0, y = 0, rotation = 0, color = "black", width = 50, height = 100,
                maxSpeed = 10, frameToMaxSpeed = 100, frameToStop = 50, rotationSpeed = 5) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.color = color;
        this.width = width;
        this.height = height;
        this.maxSpeed = maxSpeed;
        this.frameToMaxSpeed = frameToMaxSpeed;
        this.frameToStop = frameToStop;
        this.rotationSpeed = rotationSpeed;
    }
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

let interactKeyPressed = false; // If the player press the key E

// Camera
let cameraX = 0;
let cameraY = 0;

// Delta-time
let deltaTime = 1;
let lastTick = performance.now();

// Cars
let cars = [
    new Car(300, 0, 0, "black"),
    new Car(300, 200, 0, "greenyellow")
];

//#endregion

//#region Functions

/**
 * Calculate the distance between 2 points.
 * @param x1 The location in the X axis of the first point.
 * @param y1 The location in the Y axis of the first point.
 * @param x2 The location in the X axis of the second point.
 * @param y2 The location in the Y axis of the second point.
 * @return The distance between the two point in parameters.
 */
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/**
 * Display all the elements in the range of the render distance.
 */
function drawElementsInRange() {
    // Get the elements in range
    let elementsInRange = [];
    for (let element of mapJson.elements) {
        if (calculateDistance(player.x, player.y, element.x, element.y) <= RENDER_DISTANCE) {
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
}

/**
 * Adapt the canvas size to the window size.
 */
function updateCanvasSize() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
}

/**
 * Display the player on the canvas.
 */
function drawPlayer() {
    CTX.fillStyle = "black";
    CTX.fillRect(player.x - cameraX, player.y - cameraY, PLAYER_WIDTH, PLAYER_HEIGHT);
}

/**
 * Move the player according to the player's inputs.
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
    if ((!leftPressed && !rightPressed && !forwardPressed && !backwardPressed) ||
        (leftPressed && rightPressed) || (forwardPressed && backwardPressed)) {
        // Horizontal
        if (!forwardPressed && Math.abs(playerHorizontalSpeed) < PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED) {
            playerHorizontalSpeed = 0;
        } else {
            playerHorizontalSpeed += PLAYER_MAX_SPEED /
                PLAYER_FRAME_TO_STOP * (playerHorizontalSpeed > 0 ? -1 : 1);
        }

        // Vertical
        if (!leftPressed && Math.abs(playerVerticalSpeed) < PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED) {
            playerVerticalSpeed = 0;
        } else {
            playerVerticalSpeed += PLAYER_MAX_SPEED /
                PLAYER_FRAME_TO_STOP * (playerVerticalSpeed > 0 ? -1 : 1);
        }
    }

    player.x += playerHorizontalSpeed * deltaTime;
    player.y += playerVerticalSpeed * deltaTime;
}

/**
 * Draw all the cars in the range of the render distance.
 */
function drawCarsInRange() {
    for (let car of cars) {
        if (calculateDistance(player.x, player.y, car.x, car.y) <= RENDER_DISTANCE) {
            CTX.fillStyle = car.color;
            if (car.rotation !== 0) {
                // Rotate the car
                CTX.translate(-cameraX, -cameraY);
                CTX.translate(car.x + car.width / 2, car.y + car.height / 2);
                CTX.rotate(car.rotation * Math.PI / 180);
                CTX.translate(-(car.x + car.width / 2), -(car.y + car.height / 2));
                CTX.fillRect(car.x, car.y, car.width, car.height);
                CTX.translate(car.x + car.width / 2, car.y + car.height / 2);
                CTX.rotate(-car.rotation * Math.PI / 180);
                CTX.translate(-(car.x + car.width / 2), -(car.y + car.height / 2));
                CTX.translate(cameraX, cameraY);
            } else {
                CTX.fillRect(car.x - cameraX, car.y - cameraY, car.width, car.height);
            }
        }
    }
}

/**
 * Get in the nearest car if it's in the car range
 */
function getInTheNearestCar() {
    if (cars.length > 0) {
        // Find the nearest car
        let minDist = calculateDistance(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2,
            cars[0].x + cars[0].width / 2, cars[0].y + cars[0].height / 2);
        let minDistIndex = 0;
        for (let i = 0; i < cars.length; i++) {
            let dist = calculateDistance(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2,
                cars[i].x + cars[i].width / 2, cars[i].y + cars[i].height / 2);
            if (dist < minDist) {
                minDist = dist;
                minDistIndex = i;
            }
        }

        // Check if the car is range to get in
        if (minDist <= CAR_RANGE) {
            player.carDrivingIndex = minDistIndex;
        }
    }
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
    drawElementsInRange();

    // Display the cars
    drawCarsInRange()

    // Get the nearest car
    if (interactKeyPressed && player.carDrivingIndex === -1) {
        getInTheNearestCar();
    } else if (interactKeyPressed) {
        player.carDrivingIndex = -1;
    }

    if (player.carDrivingIndex === -1) {
        // Move the player if he isn't in a car
        movePlayer();

        // Draw the player if he isn't in a car
        drawPlayer();
    } else {
        // TODO : driveCar()
    }

    // Reset interacting value
    interactKeyPressed = false;
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

    // Interact
    if (e.key === "e" ||e.key === "E") {
        interactKeyPressed = true;
    }
});

//#endregion

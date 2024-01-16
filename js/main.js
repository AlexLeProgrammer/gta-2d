/**
 * GTA - 2D main script
 * @version 1.0.0
 */

"use strict";

//#region Constants

// Get the map from map.json
const MAP = await fetch('json/map.json').then((response) => response.json());

// Get the car models from car_models.json
const CAR_MODELS = await fetch('json/car_models.json').then((response) => response.json());

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

// Map

// Types of map element bounds
const MAP_TYPE_NO0COLLISIONS = [1, 200];
const MAP_TYPE_COLLISIONS = [201, 400];
const MAP_TYPE_AREA = [401, 600];
const MAP_TYPE_ROAD = [601, 800];

// Cars
const CAR_RANGE = 50;
const ROADS_TIMES_FASTER = 2;

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
    x;
    y;
    rotation; // Degrees
    speed = 0;
    width;
    height;
    maxSpeed;
    frameToMaxSpeed;
    frameToStop;
    rotationSpeed; // Degrees / frame
    texture;

    constructor(x = 0, y = 0, rotation = 0, modelIndex = null) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;

        // Get data from the selected model
        this.width = CAR_MODELS[modelIndex].width;
        this.height = CAR_MODELS[modelIndex].height;
        this.maxSpeed = CAR_MODELS[modelIndex].maxSpeed;
        this.frameToMaxSpeed = CAR_MODELS[modelIndex].frameToMaxSpeed;
        this.frameToStop = CAR_MODELS[modelIndex].frameToStop;
        this.rotationSpeed = CAR_MODELS[modelIndex].rotationSpeed;
        this.texture = CAR_MODELS[modelIndex].texture;
    }
}

//#endregion

//#region Global-variables

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
    new Car(300, 0, 0, 0),
    new Car(300, 200, 0, 1)
];

//#endregion

//#region Functions

/**
 * Calculate the distance between 2 points.
 * @param x1 The location in the X axis of the first point.
 * @param y1 The location in the Y axis of the first point.
 * @param x2 The location in the X axis of the second point.
 * @param y2 The location in the Y axis of the second point.
 * @return {number} The distance between the two point in parameters.
 */
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/**
 * Convert degrees to radians.
 * @param degrees Number of degrees.
 * @return {number} The degrees in parameters converted in radians.
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Rotate a point around another.
 * @param x Coordinate of the point to rotate in the X axis.
 * @param y Coordinate of the point to rotate in the Y axis.
 * @param centerX Coordinate of the center in the X axis.
 * @param centerY Coordinate of the center in the Y axis.
 * @param rotation Degrees of the rotation.
 * @return {number[]} The rotated point location.
 */
function getRotatedPoint(x, y, centerX, centerY, rotation) {
    return [
        (x - centerX) * Math.cos(degToRad(rotation)) - (y - centerY) * Math.sin(degToRad(rotation)) + centerX,
        (x - centerX) * Math.sin(degToRad(rotation)) + (y - centerY) * Math.cos(degToRad(rotation)) + centerY
    ];
}

/**
 * Display all the elements in the range of the render distance.
 */
function drawElementsInRange() {
    for (let element of MAP) {
        if (calculateDistance(player.x, player.y, element.x, element.y) <= RENDER_DISTANCE +
            Math.sqrt(Math.pow(element.width, 2) + Math.pow(element.height, 2))) {
            // Get the texture of the element
            let color = "";
            switch (element.type) {
                // No collisions
                case 1: color = "gray"; break;
                case 2: color = "saddlebrown"; break;
                case 3: color = "green"; break;

                // With collisions
                case 201: color = "gray"; break;

                // Road
                case 602: color = "GrayText"; break;
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
    if (leftPressed && !rightPressed && playerHorizontalSpeed > -PLAYER_MAX_SPEED) {
        playerHorizontalSpeed -= PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED;
    }

    // Right
    if (rightPressed && !leftPressed && playerHorizontalSpeed < PLAYER_MAX_SPEED) {
        playerHorizontalSpeed += PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED;
    }

    // Forward
    if (forwardPressed && !backwardPressed && playerVerticalSpeed > -PLAYER_MAX_SPEED) {
        playerVerticalSpeed -= PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED;
    }

    // Backward
    if (backwardPressed && !forwardPressed && playerVerticalSpeed < PLAYER_MAX_SPEED) {
        playerVerticalSpeed += PLAYER_MAX_SPEED / PLAYER_FRAME_TO_MAX_SPEED;
    }

    // When we don't move, reduce speed
    // Horizontal
    if ((leftPressed && rightPressed) || (!leftPressed && !rightPressed)) {
        if (Math.abs(playerHorizontalSpeed) < PLAYER_MAX_SPEED / PLAYER_FRAME_TO_STOP) {
            playerHorizontalSpeed = 0;
        } else {
            playerHorizontalSpeed += PLAYER_MAX_SPEED /
                PLAYER_FRAME_TO_STOP * (playerHorizontalSpeed > 0 ? -1 : 1);
        }
    }

    // Vertical
    if ((forwardPressed && backwardPressed) || (!forwardPressed && !backwardPressed)) {
        if (Math.abs(playerVerticalSpeed) < PLAYER_MAX_SPEED / PLAYER_FRAME_TO_STOP) {
            playerVerticalSpeed = 0;
        } else {
            playerVerticalSpeed += PLAYER_MAX_SPEED /
                PLAYER_FRAME_TO_STOP * (playerVerticalSpeed > 0 ? -1 : 1);
        }
    }


    // Modify forces if there is a wall and apply it to the player

    // Horizontal
    let nearestWallDistanceX = playerHorizontalSpeed === 0 ? null : getNearestWallDistance(player.x, player.y,
        PLAYER_WIDTH, PLAYER_HEIGHT, playerHorizontalSpeed > 0 ? 1 : -1, false);

    if (nearestWallDistanceX !== null && Math.abs(playerHorizontalSpeed * deltaTime) > nearestWallDistanceX) {
        playerHorizontalSpeed = 0;
        player.x += nearestWallDistanceX * (playerHorizontalSpeed > 0 ? 1 : -1);
    } else {
        // Apply the force to the player
        player.x += playerHorizontalSpeed * deltaTime;
    }

    // Vertical
    let nearestWallDistanceY = playerVerticalSpeed === 0 ? null : getNearestWallDistance(player.x, player.y,
        PLAYER_WIDTH, PLAYER_HEIGHT, playerVerticalSpeed > 0 ? 1 : -1, true);

    if (nearestWallDistanceY !== null && Math.abs(playerVerticalSpeed * deltaTime) > nearestWallDistanceY) {
        playerVerticalSpeed = 0;
    } else {
        // Apply the force to the player
        player.y += playerVerticalSpeed * deltaTime;
    }
}

/**
 * Draw all the cars in the range of the render distance.
 */
function drawCarsInRange() {
    for (let car of cars) {
        if (calculateDistance(player.x, player.y, car.x, car.y) <= RENDER_DISTANCE) {
            if (car.rotation !== 0) {
                // Rotate / translate the canvas
                CTX.translate(-cameraX, -cameraY);
                CTX.translate(car.x + car.width / 2, car.y + car.height / 2);
                CTX.rotate(degToRad(car.rotation));
                CTX.translate(-(car.x + car.width / 2), -(car.y + car.height / 2));

                // Draw the car
                for (let rectangle of car.texture) {
                    CTX.fillStyle = rectangle.color;
                    CTX.fillRect(car.x + rectangle.x, car.y + rectangle.y, rectangle.width, rectangle.height);
                }

                // Restore the canvas to the initial position / rotation
                CTX.translate(car.x + car.width / 2, car.y + car.height / 2);
                CTX.rotate(-degToRad(car.rotation));
                CTX.translate(-(car.x + car.width / 2), -(car.y + car.height / 2));
                CTX.translate(cameraX, cameraY);
            } else {
                for (let rectangle of car.texture) {
                    CTX.fillStyle = rectangle.color;
                    CTX.fillRect(car.x + rectangle.x - cameraX, car.y + rectangle.y - cameraY, rectangle.width, rectangle.height);
                }
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

/**
 * Move the player and the car that he is in.
 */
function driveCar() {
    // Left
    if (leftPressed && !rightPressed && cars[player.carDrivingIndex].speed !== 0) {
        cars[player.carDrivingIndex].rotation -= cars[player.carDrivingIndex].rotationSpeed *
            Math.abs(cars[player.carDrivingIndex].speed / cars[player.carDrivingIndex].maxSpeed) * deltaTime;
    }

    // Right
    if (rightPressed && !leftPressed && cars[player.carDrivingIndex].speed !== 0) {
        cars[player.carDrivingIndex].rotation += cars[player.carDrivingIndex].rotationSpeed *
            Math.abs(cars[player.carDrivingIndex].speed / cars[player.carDrivingIndex].maxSpeed) * deltaTime;
    }

    // Forward
    let carOnRoad = isOnRoad(cars[player.carDrivingIndex].x, cars[player.carDrivingIndex].y,
        cars[player.carDrivingIndex].width, cars[player.carDrivingIndex].height);
    if (forwardPressed && !backwardPressed && ((carOnRoad && cars[player.carDrivingIndex].speed >
        -cars[player.carDrivingIndex].maxSpeed) || (!carOnRoad  && cars[player.carDrivingIndex].speed >
        -cars[player.carDrivingIndex].maxSpeed / ROADS_TIMES_FASTER))) {
        cars[player.carDrivingIndex].speed -= (carOnRoad ? cars[player.carDrivingIndex].maxSpeed :
            cars[player.carDrivingIndex].maxSpeed / ROADS_TIMES_FASTER) / cars[player.carDrivingIndex].frameToMaxSpeed;
    }

    // Backward
    if (backwardPressed && !forwardPressed && ((carOnRoad && cars[player.carDrivingIndex].speed <
        cars[player.carDrivingIndex].maxSpeed) || (!carOnRoad  && cars[player.carDrivingIndex].speed <
        cars[player.carDrivingIndex].maxSpeed / ROADS_TIMES_FASTER))) {
        cars[player.carDrivingIndex].speed += (carOnRoad ? cars[player.carDrivingIndex].maxSpeed :
            cars[player.carDrivingIndex].maxSpeed / ROADS_TIMES_FASTER) / cars[player.carDrivingIndex].frameToMaxSpeed;
    }

    // When we don't move, reduce speed
    // Vertical
    if ((forwardPressed && backwardPressed) || (!forwardPressed && !backwardPressed) || (!carOnRoad && cars[player.carDrivingIndex].speed >
        cars[player.carDrivingIndex].maxSpeed / ROADS_TIMES_FASTER)) {
        if (Math.abs(cars[player.carDrivingIndex].speed) < cars[player.carDrivingIndex].maxSpeed / cars[player.carDrivingIndex].frameToStop) {
            cars[player.carDrivingIndex].speed = 0;
        } else {
            cars[player.carDrivingIndex].speed += cars[player.carDrivingIndex].maxSpeed /
                cars[player.carDrivingIndex].frameToStop * (cars[player.carDrivingIndex].speed > 0 ? -1 : 1);
        }
    }

    // Modify forces if there is a wall and apply it to the car
    let newRotation = Math.abs(cars[player.carDrivingIndex].rotation % 180);
    let rotatedCarPoints = [
        getRotatedPoint(cars[player.carDrivingIndex].x, cars[player.carDrivingIndex].y,
    cars[player.carDrivingIndex].x + cars[player.carDrivingIndex].width / 2, cars[player.carDrivingIndex].y +
            cars[player.carDrivingIndex].height / 2, cars[player.carDrivingIndex].rotation),
        getRotatedPoint(cars[player.carDrivingIndex].x + cars[player.carDrivingIndex].width, cars[player.carDrivingIndex].y,
            cars[player.carDrivingIndex].x + cars[player.carDrivingIndex].width / 2, cars[player.carDrivingIndex].y +
            cars[player.carDrivingIndex].height / 2, cars[player.carDrivingIndex].rotation),
        getRotatedPoint(cars[player.carDrivingIndex].x + cars[player.carDrivingIndex].width,
            cars[player.carDrivingIndex].y + cars[player.carDrivingIndex].height,
            cars[player.carDrivingIndex].x + cars[player.carDrivingIndex].width / 2, cars[player.carDrivingIndex].y +
            cars[player.carDrivingIndex].height / 2, cars[player.carDrivingIndex].rotation),
        getRotatedPoint(cars[player.carDrivingIndex].x, cars[player.carDrivingIndex].y + cars[player.carDrivingIndex].height,
            cars[player.carDrivingIndex].x + cars[player.carDrivingIndex].width / 2, cars[player.carDrivingIndex].y +
            cars[player.carDrivingIndex].height / 2, cars[player.carDrivingIndex].rotation),
    ];

    // Horizontal
    let xSpeed = -Math.sin(degToRad(cars[player.carDrivingIndex].rotation)) * cars[player.carDrivingIndex].speed * deltaTime;
    let direction = xSpeed > 0 ? 1 : -1;
    let nearestWallDistanceX;

    // Calculate the nearest wall distance on the X axis
    if (xSpeed !== 0) {
        if (newRotation === 0) {
            nearestWallDistanceX = getNearestWallDistance(cars[player.carDrivingIndex].x, cars[player.carDrivingIndex].y,
                cars[player.carDrivingIndex].width, cars[player.carDrivingIndex].height, direction, false);
        } else if (newRotation === 90) {
            nearestWallDistanceX = getNearestWallDistance(cars[player.carDrivingIndex].x, cars[player.carDrivingIndex].y,
                cars[player.carDrivingIndex].height, cars[player.carDrivingIndex].width, direction, false);
        } else if (cars[player.carDrivingIndex].speed <= 0) {
            // Forward
            if ((newRotation > 90 && cars[player.carDrivingIndex].rotation >= 0) ||
                (newRotation < 90 && cars[player.carDrivingIndex].rotation < 0)) {
                nearestWallDistanceX = getNearestWallDistance(rotatedCarPoints[0][0], rotatedCarPoints[0][1], 1, 1, direction, false);

                if (nearestWallDistanceX === null) {
                    nearestWallDistanceX = getNearestWallDistance(rotatedCarPoints[1][0], rotatedCarPoints[1][1], 1, 1, direction, false);
                }
            } else {
                nearestWallDistanceX = getNearestWallDistance(rotatedCarPoints[1][0], rotatedCarPoints[1][1], 1, 1, direction, false);

                if (nearestWallDistanceX === null) {
                    nearestWallDistanceX = getNearestWallDistance(rotatedCarPoints[0][0], rotatedCarPoints[0][1], 1, 1, direction, false);
                }
            }
        } else {
            // Backward
            if ((newRotation > 90 && cars[player.carDrivingIndex].rotation >= 0) ||
                (newRotation < 90 && cars[player.carDrivingIndex].rotation < 0)) {
                nearestWallDistanceX = getNearestWallDistance(rotatedCarPoints[2][0], rotatedCarPoints[2][1], 1, 1, direction, false);

                if (nearestWallDistanceX === null) {
                    nearestWallDistanceX = getNearestWallDistance(rotatedCarPoints[3][0], rotatedCarPoints[3][1], 1, 1, direction, false);
                }
            } else {
                nearestWallDistanceX = getNearestWallDistance(rotatedCarPoints[3][0], rotatedCarPoints[3][1], 1, 1, direction, false);

                if (nearestWallDistanceX === null) {
                    nearestWallDistanceX = getNearestWallDistance(rotatedCarPoints[2][0], rotatedCarPoints[2][1], 1, 1, direction, false);
                }
            }
        }
    } else {
        nearestWallDistanceX = null;
    }

    if (nearestWallDistanceX !== null && Math.abs(xSpeed) > nearestWallDistanceX) {
        cars[player.carDrivingIndex].speed = 0;
        cars[player.carDrivingIndex].x += nearestWallDistanceX * direction;
    } else {
        // Apply the force to the car
        cars[player.carDrivingIndex].x += xSpeed;
    }

    // Vertical
    let ySpeed = Math.cos(degToRad(cars[player.carDrivingIndex].rotation)) * cars[player.carDrivingIndex].speed * deltaTime;
    direction = ySpeed > 0 ? 1 : -1;
    let nearestWallDistanceY;

    // Calculate the nearest wall distance on the Y axis
    if (xSpeed !== 0) {
        if (newRotation === 0) {
            nearestWallDistanceY = getNearestWallDistance(cars[player.carDrivingIndex].x, cars[player.carDrivingIndex].y,
                cars[player.carDrivingIndex].width, cars[player.carDrivingIndex].height, direction, true);
        } else if (newRotation === 90) {
            nearestWallDistanceY = getNearestWallDistance(cars[player.carDrivingIndex].x, cars[player.carDrivingIndex].y,
                cars[player.carDrivingIndex].height, cars[player.carDrivingIndex].width, direction, true);
        } else if (cars[player.carDrivingIndex].speed <= 0) {
            // Forward
            if ((newRotation > 90 && cars[player.carDrivingIndex].rotation >= 0) ||
                (newRotation < 90 && cars[player.carDrivingIndex].rotation < 0)) {
                nearestWallDistanceY = getNearestWallDistance(rotatedCarPoints[1][0], rotatedCarPoints[1][1], 1, 1, direction, true);

                if (nearestWallDistanceY === null) {
                    nearestWallDistanceY = getNearestWallDistance(rotatedCarPoints[0][0], rotatedCarPoints[0][1], 1, 1, direction, true);
                }
            } else {
                nearestWallDistanceY = getNearestWallDistance(rotatedCarPoints[0][0], rotatedCarPoints[0][1], 1, 1, direction, true);

                if (nearestWallDistanceY === null) {
                    nearestWallDistanceY = getNearestWallDistance(rotatedCarPoints[1][0], rotatedCarPoints[1][1], 1, 1, direction, true);
                }
            }
        } else {
            // Backward
            if ((newRotation > 90 && cars[player.carDrivingIndex].rotation >= 0) ||
                (newRotation < 90 && cars[player.carDrivingIndex].rotation < 0)) {
                nearestWallDistanceY = getNearestWallDistance(rotatedCarPoints[3][0], rotatedCarPoints[3][1], 1, 1, direction, true);

                if (nearestWallDistanceY === null) {
                    nearestWallDistanceY = getNearestWallDistance(rotatedCarPoints[2][0], rotatedCarPoints[2][1], 1, 1, direction, true);
                }
            } else {
                nearestWallDistanceY = getNearestWallDistance(rotatedCarPoints[2][0], rotatedCarPoints[2][1], 1, 1, direction, true);

                if (nearestWallDistanceY === null) {
                    nearestWallDistanceY = getNearestWallDistance(rotatedCarPoints[3][0], rotatedCarPoints[3][1], 1, 1, direction, true);
                }
            }
        }
    } else {
        nearestWallDistanceY = null;
    }

    if (nearestWallDistanceY !== null && Math.abs(ySpeed) > nearestWallDistanceY) {
        cars[player.carDrivingIndex].speed = 0;
        cars[player.carDrivingIndex].y += nearestWallDistanceY * direction;
    } else {
        // Apply the force to the car
        cars[player.carDrivingIndex].y += ySpeed;
    }

    // Teleport the player in the middle off the car
    player.x = cars[player.carDrivingIndex].x + cars[player.carDrivingIndex].width / 2 - PLAYER_WIDTH / 2;
    player.y = cars[player.carDrivingIndex].y + cars[player.carDrivingIndex].height / 2 - PLAYER_HEIGHT / 2;
}

/**
 * Get the index of the nearest wall in the X axis.
 * @param x Position of the rectangle in the X axis.
 * @param y Position of the rectangle in the Y axis.
 * @param width Width of the rectangle.
 * @param height Height of the rectangle.
 * @param direction The direction of the detection, -1 for left / forward, 1 for right / backward.
 * @param axis The axis of detection, false : X, true : Y.
 * @return Null if the distance isn't valid else the distance between
 * the rectangle in parameters and the nearest wall.
 */
function getNearestWallDistance(x, y, width, height, direction, axis) {
    let minDist = null;
    for (let element of MAP) {
        if (element.type >= MAP_TYPE_COLLISIONS[0] && element.type <= MAP_TYPE_COLLISIONS[1]) {
            if (axis) {
                // Vertical
                if (direction === 1 && element.y >= y + height - 1 && x + width > element.x &&
                    x < element.x + element.width && (element.y - y - height < minDist || minDist === null)) {
                    minDist = element.y - y - height;
                } else if (direction === -1 && element.y + element.height <= y + 1 && x + width > element.x &&
                    x < element.x + element.width && (y - element.y - element.height < minDist || minDist === null)) {
                    minDist = y - element.y - element.height;
                }
            } else {
                // Horizontal
                if (direction === 1 && element.x >= x + width && y + height > element.y &&
                    y < element.y + element.height && (element.x - x - width < minDist || minDist === null)) {
                    minDist = element.x - x - width;
                } else if (direction === -1 && element.x + element.width <= x && y + height > element.y &&
                    y < element.y + element.height && (x - element.x - element.width < minDist || minDist === null)) {
                    minDist = x - element.x - element.width;
                }
            }
        }
    }

    return minDist === null ? null : minDist;
}

/**
 * Search if the rectangle in parameters
 * @param x Position of the rectangle in the X axis.
 * @param y Position of the rectangle in the Y axis.
 * @param width Width of the rectangle.
 * @param height Height of the rectangle.
 * @return {boolean} If the rectangle is on a road.
 */
function isOnRoad(x, y, width, height) {
    let centerX = x + width / 2;
    let centerY = y + height / 2;
    for (let element of MAP) {
        if (element.type >= MAP_TYPE_ROAD[0] && element.type <= MAP_TYPE_ROAD[1] &&
        centerX > element.x && centerX < element.x + element.width &&
        centerY > element.y && centerY < element.y + element.height) {
            return true;
        }
    }
    return false;
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
        cars[player.carDrivingIndex].speed = 0;
        player.carDrivingIndex = -1;
    }

    if (player.carDrivingIndex === -1) {
        // Move the player if he isn't in a car
        movePlayer();

        // Draw the player if he isn't in a car
        drawPlayer();
    } else {
        // Drive the car of the player
        driveCar();
    }

    // Reset interacting value
    interactKeyPressed = false;
}

//#endregion

// Sort the map by the z-index of the elements
MAP.sort((a, b) => {
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

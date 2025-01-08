import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';

const { Audio, AudioListener, AudioLoader } = THREE;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const listener = new AudioListener();
camera.add(listener);

const sound = new Audio(listener);
const audioLoader = new AudioLoader();

let leftAudioBuffer, rightAudioBuffer;
audioLoader.load('assets/ocean-waves-112906.mp3', function(buffer) {
    leftAudioBuffer = buffer;
});
audioLoader.load('assets/sound-effect-seagulls-157829.mp3', function(buffer) {
    rightAudioBuffer = buffer;
});

let currentAudioSide = null; 
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

function resumeAudioContext() {
    audioContext.resume().then(() => {
        console.log('AudioContext resumed');
    });
}

document.addEventListener('click', resumeAudioContext);

function handleAudioChange(event) {
    const mousePosition = event.clientX / window.innerWidth;

    if (mousePosition < 0.5) {
        if (currentAudioSide !== "left") {
            sound.stop();

            if (leftAudioBuffer) {
                sound.setBuffer(leftAudioBuffer);
                sound.setLoop(true);  
                sound.setVolume(1.0);
                sound.play();
            }
            currentAudioSide = "left";
        }
    } 
    else {
        if (currentAudioSide !== "right") {
            sound.stop();

            if (rightAudioBuffer) {
                sound.setBuffer(rightAudioBuffer);
                sound.setLoop(true);  
                sound.setVolume(1.0);
                sound.play();
            }
            currentAudioSide = "right";
        }
    }
}

document.addEventListener('click', handleAudioChange);

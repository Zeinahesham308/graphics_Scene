
//my island code
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, stats;
let camera, scene, renderer;
let controls, water, sun;

init();

function init() {
    container = document.getElementById('container');

    // Renderer setup
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    container.appendChild(renderer.domElement);

    // Scene setup
    scene = new THREE.Scene();

    // Camera setup
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 30, 100);

    // Sun setup
    sun = new THREE.Vector3();


// // Create an island group
const islandGroup = new THREE.Group();

// // Load sand model
// const sandLoader = new GLTFLoader().setPath('sand_dunes_gltf/');
// sandLoader.load('scene.gltf', (gltf) => {
//     const sand = gltf.scene;
//     sand.scale.set(15, 15, 15); // Scale as needed
//     sand.position.set(0, 1, 0); // Base of the island
//     islandGroup.add(sand);
// });

// // Load grass model
// const grassLoader = new GLTFLoader().setPath('grassparts/');
// grassLoader.load('scene.gltf', (gltf) => {
//     const grass = gltf.scene;
//     grass.scale.set(12, 12, 12); // Slightly smaller than sand
//     grass.position.set(0, 5, 0); // Slightly above the sand
//     islandGroup.add(grass);
// });

// // Load palm tree model
// const palmLoader = new GLTFLoader().setPath('palm_1_gltf/');
// palmLoader.load('scene.gltf', (gltf) => {
//     const palm = gltf.scene;
//     palm.scale.set(0.1, 0.1, 0.1); // Adjust tree size
//     palm.position.set(3, 2, 3); // Position a tree
//     islandGroup.add(palm);

//     // Optionally clone and position more trees
//     for (let i = 0; i < 3; i++) {
//         const clone = palm.clone();
//         clone.position.set(Math.random() * 10 - 5, 2, Math.random() * 10 - 5);
//         islandGroup.add(clone);
//     }
// });

// // Position the island group
// islandGroup.position.set(0, 0, 0); // Adjust to place the island above the water
// scene.add(islandGroup);
// Create a circular base for the island
const islandBase = new THREE.CircleGeometry(80, 70); // Radius 15, 32 segments
const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3 }); // Sand color
const sandBase = new THREE.Mesh(islandBase, baseMaterial);
sandBase.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
sandBase.position.y = 0.5; // Slightly above water level
scene.add(sandBase);

// Load sand model and place it on the base    //0xA78262  this is same color of snad 
const sandLoader = new GLTFLoader().setPath('sand_dunes_gltf/');
sandLoader.load('scene.gltf', (gltf) => {
    const sand = gltf.scene;
    sand.scale.set(15, 7, 15); // Scale as needed
    sand.position.set(0, 0, 0); // Base of the island
    islandGroup.add(sand);
});

// Scatter grass models across the sand
const grassLoader = new GLTFLoader().setPath('grassparts/');
grassLoader.load('scene.gltf', (gltf) => {
    const grass = gltf.scene;

    for (let i = 0; i < 500; i++) { // Adjust number of grass patches
        const clone = grass.clone();
        clone.scale.set(10, 10, 10); // Adjust size of grass
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 80; // Random radius within the sand base
        clone.position.set(
            Math.cos(angle) * radius, // X-coordinate
            1, // Slightly above the sand
            Math.sin(angle) * radius  // Z-coordinate
        );
        islandGroup.add(clone);
    }
});



const palmLoader = new GLTFLoader().setPath('palm_1_gltf/');
palmLoader.load('scene.gltf', (gltf) => {
    const palm = gltf.scene;

    // Outer and inner radii for palm placement
    const outerRadius = 58; // Outer row radius
    const innerRadius = 50; // Inner row radius

    // Define angle range for the half-circle closer to the boat
    const startAngle = -Math.PI / 2; // -90 degrees
    const endAngle = Math.PI / 2;   // 90 degrees

    const palmCount = 16; // Number of palms per row (increased for more density)

    for (let i = 0; i < palmCount; i++) {
        const angle = startAngle + (i / (palmCount - 1)) * (endAngle - startAngle);

        // Outer row palms
        const outerClone = palm.clone();
        outerClone.scale.set(0.1, 0.1, 0.1); // Adjust size of the palms
        outerClone.position.set(
            Math.cos(angle) * outerRadius, // X-coordinate
            2, // Place it on the sand level
            Math.sin(angle) * outerRadius  // Z-coordinate
        );
        outerClone.rotation.y = angle + Math.PI / 2; // Rotate palms to face outward
        islandGroup.add(outerClone);

        // Inner row palms
        const innerClone = palm.clone();
        innerClone.scale.set(0.1, 0.1, 0.1); // Adjust size of the palms
        innerClone.position.set(
            Math.cos(angle) * innerRadius, // X-coordinate
            2, // Place it on the sand level
            Math.sin(angle) * innerRadius  // Z-coordinate
        );
        innerClone.rotation.y = angle + Math.PI / 2; // Rotate palms to face outward
        islandGroup.add(innerClone);
    }
});


// Add the island group to the scene
islandGroup.position.set(0, 0, 0); // Adjust to place the island above the water
scene.add(islandGroup);

// Load the human model
const humanLoader = new GLTFLoader().setPath('free_download_athletic_african_man_walking_223_gltf/');
humanLoader.load('scene.gltf', (gltf) => {
    const human = gltf.scene;

    // Ensure the human model casts and receives shadows
    human.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // Scale and position the human model on the island
    human.scale.set(0.1, 0.1, 0.1); // Adjust size
    human.position.set(0, 1, 0); // Place on the sand

    // Add the human model to the island group
    islandGroup.add(human);

    // Set up animation
    const mixer = new THREE.AnimationMixer(human);
    const walkAnimation = gltf.animations.find((clip) => clip.name.toLowerCase().includes('walk')); // Find walk animation
    if (walkAnimation) {
        const action = mixer.clipAction(walkAnimation);
        action.play(); // Play the walking animation
    }

    // Animate the human moving forward
    const clock = new THREE.Clock();
    function animateHuman() {
        const delta = clock.getDelta(); // Time between frames
        if (mixer) mixer.update(delta); // Update animation

        // Move the human model forward (adjust speed as needed)
        human.position.x += 0.02; // Adjust this value for speed
        requestAnimationFrame(animateHuman);
    }

    animateHuman();
});

// Load boat GLTF model
const boatLoader = new GLTFLoader().setPath('herculaneum_boat_roman_boat_gltf/');
boatLoader.load('scene.gltf', (gltf) => {
    const boat = gltf.scene;

    // Ensure the boat model casts and receives shadows
    boat.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // Position the boat beside the island on the water
    boat.position.set(-30, 0, 85); // Adjust as needed to place it near the island
    boat.scale.set(5, 5, 5); // Adjust the size of the boat
    scene.add(boat);

    console.log('Boat loaded successfully');
});

// Load GLTF model for birds
const birdLoader = new GLTFLoader().setPath('birds_gltf/');
birdLoader.load('scene.gltf', (gltf) => {
    const birds = gltf.scene;

    // Adjust the position, scale, and rotation of the birds
    birds.scale.set(5, 5, 5); // Adjust size of the birds
    birds.position.set(0, 50, 0); // Place the birds high above the island
    birds.rotation.y = Math.PI; // Rotate if needed to match desired orientation

    // Add animation mixer for bird flying animation
    const mixer = new THREE.AnimationMixer(birds);
    gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play(); // Play all available animations
    });

    // Add birds to the scene
    scene.add(birds);

    // Store mixer for updates in the animation loop
    const clock = new THREE.Clock(); // Create a clock to manage animation timing
    function updateBirdAnimation() {
        const delta = clock.getDelta(); // Get the time elapsed since the last frame
        mixer.update(delta); // Update the mixer with the delta time
    }

    // Extend the render function to update bird animations
    const originalRender = render;
    render = function () {
        updateBirdAnimation(); // Update bird animations
        originalRender(); // Call the original render function
    };

    console.log('Birds loaded and flying animation added successfully');
});
// butterflyy
const butterflyLoader = new GLTFLoader().setPath('butterflies/');
butterflyLoader.load('scene.gltf', (gltf) => {
    const butterflyModel = gltf.scene;

    const butterflyGeometry = butterflyModel.children[0].geometry;
    const butterflyMaterial = butterflyModel.children[0].material;

    const butterflyCount = 200; // Number of butterflies
    const butterflies = new THREE.InstancedMesh(butterflyGeometry, butterflyMaterial, butterflyCount);

    const positions = []; // Store positions for animation

    for (let i = 0; i < butterflyCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 30; // Keep them closer to the center
        const height = Math.random() * 10 + 30; // Higher above the grass (15-25 units)

        const position = new THREE.Vector3(
            Math.cos(angle) * radius, 
            height, // Higher position to be visible
            Math.sin(angle) * radius
        );

        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(position.x, position.y, position.z);

        const rotation = new THREE.Matrix4().makeRotationY(Math.random() * Math.PI * 2);
        const scale = new THREE.Matrix4().makeScale(0.5, 0.5, 0.5); // Increased size (0.5 instead of 0.1)

        matrix.multiply(rotation);
        matrix.multiply(scale);

        butterflies.setMatrixAt(i, matrix);
        positions.push(position); // Save initial positions
    }

    butterflies.castShadow = true;
    butterflies.receiveShadow = false; // Butterflies don't need to receive shadows
    scene.add(butterflies);

    // Animate butterflies
    const clock = new THREE.Clock();
    function animateButterflies() {
        const time = clock.getElapsedTime();

        for (let i = 0; i < butterflyCount; i++) {
            const position = positions[i];
            const matrix = new THREE.Matrix4();

            // Update position with a sine wave motion
            const offsetY = Math.sin(time * 2 + i) * 0.5; // Flapping effect
            const offsetX = Math.sin(time + i) * 0.2;     // Horizontal drift
            const offsetZ = Math.cos(time + i) * 0.2;     // Horizontal drift

            position.y += offsetY * 0.01; // Slight vertical motion
            position.x += offsetX * 0.01; // Slight horizontal motion
            position.z += offsetZ * 0.01; // Slight horizontal motion

            matrix.makeTranslation(position.x, position.y, position.z);
            const rotation = new THREE.Matrix4().makeRotationY(time + i);
            matrix.multiply(rotation);

            butterflies.setMatrixAt(i, matrix);
        }

        butterflies.instanceMatrix.needsUpdate = true; // Update instance matrix
    }

    renderer.setAnimationLoop(() => {
        animateButterflies();
        render();
    });
});


    // Water setup
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', (texture) => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );

    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Skybox setup
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 2,
        azimuth: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();

    let renderTarget;

    function updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        sky.material.uniforms['sunPosition'].value.copy(sun);
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();

        if (renderTarget !== undefined) renderTarget.dispose();

        sceneEnv.add(sky);
        renderTarget = pmremGenerator.fromScene(sceneEnv);
        scene.add(sky);

        scene.environment = renderTarget.texture;
    }

    updateSun();

    // Orbit controls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 1.5, 0); // Focus on giraffe
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    controls.update();

    // Stats setup
    stats = new Stats();
    container.appendChild(stats.dom);

    // GUI setup
    const gui = new GUI();

    const folderSky = gui.addFolder('Sky');
    folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun);
    folderSky.add(parameters, 'azimuth', -180, 180, 0.1).onChange(updateSun);
    folderSky.open();

    const waterUniforms = water.material.uniforms;

    const folderWater = gui.addFolder('Water');
    folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale');
    folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
    folderWater.open();

    // Window resize event
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    render();
    stats.update();
}

function render() {
    water.material.uniforms['time'].value += 1.0 / 60.0;
    renderer.render(scene, camera);
}

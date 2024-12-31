import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import GUI from 'lil-gui';




let isNightMode = false; // Initial mode
let nightModeProgress = 0; // 0: day, 1: night
const transitionSpeed = 0.005; // Speed of transition
let isTransitioning = false; // To check if currently transitioning


let scene, camera, renderer, water,dolphin,plants,lightningBolt,Yacht;
let thunderLight, thunderSound, thunderParams,cloud;
let lightningEnabled = true; // Default state for the GUI toggle

// let clock = new THREE.Clock();
// let frame = 0;
const movingClouds = [];
const minSpacing = 500; // Minimum spacing between clouds

function addCloud() {
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('models/cloud2/scene.gltf', (gltf) => {
    const cloud = gltf.scene; // Use a local variable here
    cloud.scale.set(200, 200, 200); // Adjust scale as needed

    // Generate a random position ensuring spacing
    let position;
    do {
      position = {
        x: Math.random() * 10000 - 5000, // Random x position (-5000 to 5000)
        y: Math.random() * 2000 + 500,   // Random y position (500 to 2500)
        z: Math.random() * 10000 - 5000  // Random z position (-5000 to 5000)
      };
    } while (!isPositionValid(position));

    cloud.position.set(position.x, position.y, position.z);

    scene.add(cloud);

    // Add motion properties for each cloud
    cloud.userData.speed = Math.random() * 0.2 + 0.05; // Random speed (0.05 to 0.25)
    cloud.userData.direction = Math.random() > 0.5 ? 1 : -1; // Random direction (1 or -1)
    movingClouds.push(cloud); // Store for animation
  });
}

function isPositionValid(position) {
  for (const cloud of movingClouds) {
    const dx = position.x - cloud.position.x;
    const dy = position.y - cloud.position.y;
    const dz = position.z - cloud.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance < minSpacing) {
      return false; // Too close to an existing cloud
    }
  }
  return true; // Position is valid
}



function addSeaCliff() {
  const gltfLoader = new GLTFLoader();

  // Load the sea cliff model
  gltfLoader.load('models/sea cliff/scene.gltf', (gltf) => {
    const cliff = gltf.scene;

    // Adjust the scale and position of the cliff
    cliff.scale.set(1, 1, 1); // Adjust the scale as needed
    cliff.position.set(-1000, 0, -100); // Position it near the water level
    cliff.castShadow = true; // Enable shadows
    cliff.receiveShadow = true;

    // Add the cliff to the scene
    //scene.add(cliff);
  }, undefined, (error) => {
    console.error('Error loading the sea cliff model:', error);
  });
}


function animateClouds() {
  movingClouds.forEach((cloud) => {
    cloud.position.x += cloud.userData.speed * cloud.userData.direction; // Move cloud
    if (cloud.position.x > 500) {
      cloud.position.x = -500; // Reset position when out of bounds
    } else if (cloud.position.x < -500) {
      cloud.position.x = 500; // Loop back from the other side
    }
  });
}


// Add multiple clouds
function addMultipleClouds(count) {
  for (let i = 0; i < count / 2; i++) {
    addCloud(1);  // Add clouds in the positive direction
    addCloud(-1); // Add clouds in the negative direction
  }
}
  function addMultipleDocks(count, spacing) {
    const gltfLoader = new GLTFLoader();
    // Load the dock model once
    gltfLoader.load('models/dock/scene.gltf', (gltf) => {
      for (let i = 0; i < count; i++) {
        const dock = gltf.scene.clone(); // Clone the dock model
  
        // Adjust scale and position
        dock.scale.set(50, 50, 50);
        dock.position.set(i * spacing - (count * spacing) / 2, 20, 1000); // Arrange in a line with spacing
        dock.castShadow = true;
        dock.receiveShadow = true;
  
        // Add each dock to the scene
        scene.add(dock);
      }
    }, undefined, (error) => {
      console.error('Error loading the dock model:', error);
    });
  }
  
function init() {
  // Scene
  scene = new THREE.Scene();
  //scene.fog = new THREE.FogExp2(0x001e0f, 0.0003)
  // Camera
  const waterLevel = 50; // Desired water level
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(0, waterLevel, 200); // Set initial position at water level


  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Enable shadows
  document.body.appendChild(renderer.domElement);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Limit vertical movement (lock at water level)
  controls.minPolarAngle = Math.PI / 3; // Limit to horizontal and above
  controls.maxPolarAngle = Math.PI / 2; // Lock to horizontal view
  controls.target.set(0, waterLevel, 0); // Focus at the water level
  controls.update();

  // Limit zoom levels
controls.minDistance = 5000; // Minimum zoom (closest to the scene)
controls.maxDistance = 5000; // Maximum zoom (distance from water level)


  // Skybox
  const loader = new THREE.CubeTextureLoader();
  const skyboxTexture = loader.load([
    'skybox/vz_clear_right.png',
    'skybox/vz_clear_left.png',
    'skybox/vz_clear_up.png',
    'skybox/vz_clear_down.png',
    'skybox/vz_clear_front.png',
    'skybox/vz_clear_back.png',
  ]);
  scene.background = skyboxTexture;





  // Water Geometry and Shader
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 128, 128);
  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(1, 1, 0), // Direction of light for reflections
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: false, // Skybox doesn’t use fog
  });
  water.rotation.x = -Math.PI / 2; // Lay the water horizontally
  water.position.y = 0; // Place the water at ground level
  scene.add(water);







  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);
  // Lighting
// Directional light for shadows and highlights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright directional light
directionalLight.position.set(200, 200, 100); // Position above and in front
directionalLight.castShadow = true;
scene.add(directionalLight);




  // Load Dolphin Model
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('models/dolphin/scene.gltf', (gltf) => {
    dolphin = gltf.scene;
  
    // Scale and position the dolphin
    dolphin.scale.set(10, 10, 10);
    dolphin.position.set(120, waterLevel, -50);
  
    // Rotate the dolphin if necessary
    dolphin.rotation.y = Math.PI; // Face the correct direction
  
    // Ensure the dolphin can receive and cast light
    dolphin.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true; // Enable shadow casting
        child.receiveShadow = true; // Enable shadow receiving
        if (child.material) {
          child.material.side = THREE.DoubleSide; // Ensure both sides are visible
        }
      }
    });
    
    scene.add(dolphin);
  });





  // gltfLoader.load('models/plants/scene.gltf', (gltf) => {
  //   for (let i = 0; i < 5; i++) {
  //     const plants = gltf.scene.clone(); // Clone the plants model
  
  //     // Randomize position for each instance
  //     plants.position.set(
  //       Math.random() * 1000 - 250, // Random x position
  //       0,                        // At water level
  //       Math.random() * 500 - 250 // Random z position
  //     );
  
  //     plants.scale.set(200, 200, 200); // Scale the plants
  //     plants.castShadow = true;     // Enable shadows
  
  //     scene.add(plants); // Add plants to the scene
  //   }
  // });

  addMultipleClouds(200);
  //addSeaCliff(); // Add the sea cliff
 addMultipleDocks(9,1000);

 thunderLight = new THREE.SpotLight(0xffffff, 0, 500, Math.PI / 4, 1, 2);
 thunderLight.position.set(0, 500, 0);
 thunderLight.castShadow = true;
 thunderLight.target.position.set(0, 0, 0);
 scene.add(thunderLight);
 scene.add(thunderLight.target);

 // Thunder sound
 const listener = new THREE.AudioListener();
 camera.add(listener);
 const audioLoader = new THREE.AudioLoader();
 thunderSound = new THREE.PositionalAudio(listener);
 audioLoader.load('sounds/thunder.mp3', (buffer) => {
   thunderSound.setBuffer(buffer);
   thunderSound.setRefDistance(20);
   thunderSound.setVolume(1);
 });
 scene.add(thunderSound);

 // Load the lightning bolt model
 gltfLoader.load('models/flash/scene.gltf', (gltf) => {
   lightningBolt = gltf.scene;
   lightningBolt.scale.set(500, 500, 500);
   lightningBolt.visible = false; // Hide by default
   scene.add(lightningBolt);
 });

 // GUI controls
 addThunderControls();


 
addYacht(-800, -50, 2); // Smaller yacht
//addPool(-500, -600, 100); // Smaller pool

addMultiplePools(7, 800, -200, -200, 100);
addRain();
startNightModeToggle();

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  //const deltaTime = clock.getDelta(); // Time since the last frame
  // Animate Water
  if (water.material.uniforms['time']) {
    water.material.uniforms['time'].value += 0.09; // Increment time for water ripple animation
  }
  // Animate Dolphin every other frame
  if (dolphin) {
    const time = performance.now() * 0.001;

    dolphin.position.y = Math.sin(time * 2) * 30;
    dolphin.position.z = Math.cos(time * 2) * 50;

    if (dolphin.position.y > 0) {
      dolphin.rotation.x = dolphin.position.y / 150;
    } else {
      dolphin.rotation.x = -dolphin.position.y / 150;
    }

    dolphin.position.x += 0.3;
    if (dolphin.position.x > 200) {
      dolphin.position.x = -200;
    }
  }
  if(plants){plants.position.y += Math.sin(performance.now() * 0.001) * 0.1; // Floating animation
    plants.rotation.y = Math.random() * Math.PI * 2; // Random rotation

  }

   // Animate clouds
   animateClouds();
  //frame++;
  animateRain(); // Animate the rain
  renderer.render(scene, camera);
}

function addThunderControls() {
  const gui = new GUI();

  thunderParams = {
    lightIntensity: 10,
    thunderDelay: 1000,
    thunderVolume: 0.8,
    enableThunder: true,
  };

  // Enable or disable thunder
  gui.add(thunderParams, 'enableThunder').name('Enable Thunder').onChange((value) => {
    lightningEnabled = value;
  });

  // Adjust lightning intensity
  gui.add(thunderParams, 'lightIntensity', 0, 50, 1).onChange((value) => {
    thunderLight.intensity = value;
  });

  // Adjust thunder volume
  gui.add(thunderParams, 'thunderVolume', 0, 1, 0.1).onChange((value) => {
    thunderSound.setVolume(value);
  });

  // Trigger thunder manually
  gui.add({ triggerThunder }, 'triggerThunder').name('Play Thunder');
}

function triggerThunder() {
  if (!lightningEnabled || !lightningBolt) return;

  // Show the lightning bolt
  lightningBolt.visible = true;

  // Flash effect
  thunderLight.intensity = thunderParams.lightIntensity;

  // Hide lightning bolt after 200ms
  setTimeout(() => {
    lightningBolt.visible = false;
    thunderLight.intensity = 0;
  }, 200);

  // Play thunder sound after a delay
  setTimeout(() => {
    if (thunderSound.isPlaying) thunderSound.stop();
    thunderSound.play();
  }, thunderParams.thunderDelay);
}
function addYacht(positionX = 0, positionZ = 0, scale = 5) {
  const gltfLoader = new GLTFLoader();

  // Load the yacht model
  gltfLoader.load('models/yacht/scene.gltf', (gltf) => {
    Yacht = gltf.scene;

    // Adjust scale and position of the yacht
    Yacht.scale.set(scale, scale, scale);
    Yacht.position.set(positionX, 400, positionZ); // Place on water level (y = 0)
    Yacht.castShadow = true; // Enable shadows
    Yacht.receiveShadow = true;

    // Ensure materials receive shadows and adjust lighting properties
    Yacht.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Add the yacht to the scene
    scene.add(Yacht);
  }, undefined, (error) => {
    console.error('Error loading the yacht model:', error);
  });
}

function addPool(positionX = 0, positionZ = 0, scale = 5) {
  const gltfLoader = new GLTFLoader();

  // Load the pool model
  gltfLoader.load('models/pool/scene.gltf', (gltf) => {
    const pool = gltf.scene;

    // Adjust scale and position of the pool
    pool.scale.set(scale, scale, scale);
    pool.position.set(positionX, -60, positionZ); // Place on water level (y = 0)
    pool.castShadow = true; // Enable shadows
    pool.receiveShadow = true;

    // Ensure materials receive shadows and adjust lighting properties
    pool.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Add the pool to the scene
    scene.add(pool);
  }, undefined, (error) => {
    console.error('Error loading the pool model:', error);
  });
}



function addMultiplePools(count, spacing, startX = 0, startZ = 0, scale = 5) {
  const gltfLoader = new GLTFLoader();

  gltfLoader.load('models/pool/scene.gltf', (gltf) => {
    for (let i = 0; i < count; i++) {
      const pool = gltf.scene.clone(); // Clone the pool model for each instance

      // Adjust scale and position for each pool
      pool.scale.set(scale, scale, scale);
      pool.position.set(startX + i * spacing, -60, startZ); // Constant spacing along the X-axis
      pool.castShadow = true;
      pool.receiveShadow = true;

      // Ensure materials receive shadows
      pool.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add the pool to the scene
      scene.add(pool);
    }
  }, undefined, (error) => {
    console.error('Error loading the pool model:', error);
  });
}

let rainParticles; // Global variable to store the rain particle system

function addRain() {
  const rainGeometry = new THREE.BufferGeometry();
  const rainCount = 10000; // Number of rain particles
  const positions = new Float32Array(rainCount * 3); // Each particle has x, y, z

  for (let i = 0; i < rainCount; i++) {
    positions[i * 3] = Math.random() * 2000 - 1000; // x position
    positions[i * 3 + 1] = Math.random() * 2000;    // y position
    positions[i * 3 + 2] = Math.random() * 2000 - 1000; // z position
  }

  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa, // Light gray
    size: 0.5,       // Adjust size of raindrops
    transparent: true,
    opacity: 0.7,
  });

  rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  scene.add(rainParticles);
}

function animateRain() {
  if (!rainParticles) return;

  const positions = rainParticles.geometry.attributes.position.array;

  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] -= 2; // Move rain particle downward

    // Reset rain particle to the top when it falls below a certain level
    if (positions[i + 1] < 0) {
      positions[i + 1] = 2000;
    }
  }

  rainParticles.geometry.attributes.position.needsUpdate = true;
}

function transitionToNightMode(targetNightMode) {
  isTransitioning = true;
  const targetProgress = targetNightMode ? 1 : 0;

  function updateTransition() {
    if (Math.abs(nightModeProgress - targetProgress) < 0.01) {
      nightModeProgress = targetProgress;
      isTransitioning = false;
      return;
    }

    // Gradually move nightModeProgress towards targetProgress
    nightModeProgress += (targetProgress - nightModeProgress) * transitionSpeed;

    // Update scene properties based on progress
    updateNightModeProperties(nightModeProgress);

    requestAnimationFrame(updateTransition);
  }

  updateTransition();
}

function updateNightModeProperties(progress) {
  // Update water color
  const dayWaterColor = new THREE.Color(0x001e0f);
  const nightWaterColor = new THREE.Color(0x000033);
  const currentWaterColor = dayWaterColor.clone().lerp(nightWaterColor, progress);
  water.material.uniforms['waterColor'].value.copy(currentWaterColor);

  // Update sun color
  const daySunColor = new THREE.Color(0xffffff);
  const nightSunColor = new THREE.Color(0x111122);
  const currentSunColor = daySunColor.clone().lerp(nightSunColor, progress);
  water.material.uniforms['sunColor'].value.copy(currentSunColor);

  // Update light intensity
  directionalLight.intensity = 1 - progress; // Day: 1, Night: 0
  ambientLight.intensity = 0.5 - 0.4 * progress; // Day: 0.5, Night: 0.1

  // Update cloud visibility
  movingClouds.forEach((cloud) => {
    cloud.visible = progress < 0.5; // Fully hidden at night
  });

  // Update skybox or background
  if (progress > 0.5) {
    scene.background = new THREE.Color(0x000011); // Switch to dark background
  } else {
    const loader = new THREE.CubeTextureLoader();
    const skyboxTexture = loader.load([
      'skybox/vz_clear_right.png',
      'skybox/vz_clear_left.png',
      'skybox/vz_clear_up.png',
      'skybox/vz_clear_down.png',
      'skybox/vz_clear_front.png',
      'skybox/vz_clear_back.png',
    ]);
    scene.background = skyboxTexture; // Restore daytime skybox
  }
}
function startNightModeToggle() {
  setInterval(() => {
    if (!isTransitioning) {
      isNightMode = !isNightMode;
      transitionToNightMode(isNightMode);
    }
  }, Math.random() * 4000 + 3000); // Random interval between 3s and 7s
}



init();
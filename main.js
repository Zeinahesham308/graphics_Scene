import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import Stats from "three/addons/libs/stats.module.js";
import GUI from 'lil-gui';
import { VolumetricFire } from "./CustomFire";



let stats;
let isNightMode = false; // Initial mode
let nightModeProgress = 0; // 0: day, 1: night
let transitionSpeed = isNightMode ? 0.05 : 0.01; // Speed of transition
let isTransitioning = false; // To check if currently transitioning


let scene, camera, renderer, water,dolphin,plants,lightningBolt,Yacht;
let thunderLight, thunderSound, thunderParams,cloud;
let lightningEnabled = true; // Default state for the GUI toggle
let fire;
var clock = new THREE.Clock();

// let clock = new THREE.Clock();
// let frame = 0;
const movingClouds = [];
const minSpacing = 500; // Minimum spacing between clouds

const fires = []; // Array to store all fire instances

function addFire()
{
  VolumetricFire.texturePath = "./fire_textures/";
  var fireWidth = 2;
  var fireHeight = 4;
  var fireDepth = 2;
  var sliceSpacing = 0.5;

  fire = new VolumetricFire(
    fireWidth,
    fireHeight,
    fireDepth,
    sliceSpacing,
    camera
  );
  scene.add(fire.mesh);
  // you can set position, rotation and scale
  // fire.mesh accepts THREE.mesh features
  fire.mesh.position.set(0, 55, 750);
  //addCampFire(-200, 220, 20);
  //fire.mesh.position.set(0, 30, 150);
  fire.mesh.scale.x = 20;
  fire.mesh.scale.y = 20;
  fire.mesh.scale.z = 20;
}

function addCampFire(positionX = 0, positionZ = 0, scale = 1) {
  const gltfLoader = new GLTFLoader();

  // Load the campfire model
  gltfLoader.load('models/campfire/scene.gltf', (gltf) => {
    const campFire = gltf.scene;

    // Scale and position the campfire
   
    campFire.position.set(positionX, 15, positionZ); // Place on the ground level
    campFire.scale.set(scale, scale, scale);
    campFire.castShadow = true; // Enable shadows
    campFire.receiveShadow = true;

    // Ensure all parts of the campfire cast and receive shadows
    campFire.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Add flickering flame effect if the model includes an emissive material
    // function animateFlame() {
    //   campFire.traverse((child) => {
    //     if (child.isMesh && child.material && child.material.emissive) {
    //       child.material.emissiveIntensity = 1 + Math.random() * 0.5;
    //     }
    //   });
    //   requestAnimationFrame(animateFlame);
    // }
    //animateFlame();

    // Add the campfire to the scene
    scene.add(campFire);
  }, undefined, (error) => {
    console.error('Error loading the campfire model:', error);
  });
}



function addIsland()
{
  const islandGroup = new THREE.Group();

  const islandBase = new THREE.CircleGeometry(1500, 1400); // Radius 15, 32 segments
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3 }); // Sand color
  const sandBase = new THREE.Mesh(islandBase, baseMaterial);
  sandBase.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
  sandBase.position.y = 0.5; // Slightly above water level
  sandBase.position.z=-2500;
  sandBase.position.x=1000;
  scene.add(sandBase);
  
// // Load sand model and place it on the base    //0xA78262  this is same color of snad 
// const sandLoader = new GLTFLoader().setPath('sand_dunes_gltf/');
// sandLoader.load('scene.gltf', (gltf) => {
//     const sand = gltf.scene;
//     sand.scale.set(15, 7, 15); // Scale as needed
//     sand.position.set(0, 0, 0); // Base of the island
//     islandGroup.add(sand);
// });
  // Scatter grass models across the sand
const grassLoader = new GLTFLoader().setPath('grassparts/');
grassLoader.load('scene.gltf', (gltf) => {
    const grass = gltf.scene;

    for (let i = 0; i < 1; i++) { // Adjust number of grass patches
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
    const outerRadius = 800; // Outer row radius
    const innerRadius = 1000; // Inner row radius

    // Define angle range for the half-circle closer to the boat
    const startAngle = -Math.PI / 2; // -90 degrees
    const endAngle = Math.PI / 2;   // 90 degrees

    const palmCount = 30; // Number of palms per row (increased for more density)

    for (let i = 0; i < palmCount; i++) {
        const angle = startAngle + (i / (palmCount - 1)) * (endAngle - startAngle);

        // Outer row palms
        const outerClone = palm.clone();
        outerClone.scale.set(1, 1, 1); // Adjust size of the palms
        outerClone.position.set(
            Math.cos(angle) * outerRadius, // X-coordinate
            2, // Place it on the sand level
            Math.sin(angle) * outerRadius  // Z-coordinate
        );
        outerClone.rotation.y = angle + Math.PI / 2; // Rotate palms to face outward
        islandGroup.add(outerClone);

        // Inner row palms
        const innerClone = palm.clone();
        innerClone.scale.set(1, 1, 1); // Adjust size of the palms
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
islandGroup.position.set(1000, 0, -2500); // Adjust to place the island above the water
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
    human.scale.set(0.6, 0.6, 0.6); // Adjust size
    human.position.set(0, 1, 0); // Place on the sand

    // Add the human model to the island group
    islandGroup.add(human);
  });
}







function addMultipleBoats(count, spacing, startX = 0, startZ = 0, scale = 5) {
  const gltfLoader = new GLTFLoader();

  gltfLoader.load('models/boat/scene.gltf', (gltf) => {
    for (let i = 0; i < count; i++) {
      const boat = gltf.scene.clone(); // Clone the boat model for each instance

      // Adjust the scale and position for each boat
      boat.scale.set(scale, scale, scale);
      boat.position.set(startX + i * spacing, 0, startZ); // Adjust position based on spacing
      boat.castShadow = true;
      boat.receiveShadow = true;

      // Ensure materials receive shadows
      boat.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add the boat to the scene
      scene.add(boat);
    }
  }, undefined, (error) => {
    console.error('Error loading the boat model:', error);
  });
}
function addGrassField(positionX = 0, positionZ = 0, fieldWidth = 500, fieldDepth = 500, grassScale = 5, grassCount = 100, palmCount = 5, palmScale = 10) {
  const gltfLoader = new GLTFLoader();

  // Load the grass model
  gltfLoader.load('models/field/scene.gltf', (gltf) => {
    for (let i = 0; i < grassCount; i++) {
      const grass = gltf.scene.clone(); // Clone the grass model for each instance

      // Randomize position within the specified field area
      const randomX = positionX + Math.random() * fieldWidth - fieldWidth / 2;
      const randomZ = positionZ + Math.random() * fieldDepth - fieldDepth / 2;

      // Adjust scale and position for each grass instance
      grass.scale.set(grassScale, grassScale, grassScale);
      grass.position.set(randomX, 0, randomZ); // Place on ground level (y = 0)
      grass.castShadow = true;
      grass.receiveShadow = true;

      // Ensure materials receive shadows
      grass.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add the grass to the scene
      scene.add(grass);
    }
  }, undefined, (error) => {
    console.error('Error loading the grass model:', error);
  });

  // Add palm trees
  for (let i = 0; i < palmCount; i++) {
    const randomX = positionX + Math.random() * fieldWidth - fieldWidth / 2;
    const randomZ = positionZ + Math.random() * fieldDepth - fieldDepth / 2;

    addPalm(randomX, randomZ, palmScale);
  }
}


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
    cloud.position.x += cloud.userData.speed*1.5 * cloud.userData.direction; // Move cloud
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
  
  function addPalm(positionX = 0, positionZ = 0, scale = 10) {
    const gltfLoader = new GLTFLoader();
  
    // Load the palm model
    gltfLoader.load('models/palms/scene.gltf', (gltf) => {
      const palm = gltf.scene;
  
      // Adjust scale and position of the palm
      palm.scale.set(scale, scale, scale);
      palm.position.set(positionX, 0, positionZ); // Place on ground level (y = 0)
      palm.castShadow = true; // Enable shadows
      palm.receiveShadow = true;
  
      // Ensure materials receive shadows
      palm.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
  
      // Add the palm to the scene
      scene.add(palm);
    }, undefined, (error) => {
      console.error('Error loading the palm model:', error);
    });
  }






// Add dancing character
// Add dancing character with movement
function addHipHopDancer(positionX = 0, positionY = 0, positionZ = 0, scale = 5) {
  const loader = new FBXLoader(); // Use FBXLoader for .fbx files

  // Load the HipHopDancing FBX file
  loader.load(
    'models/dance/HipHopDancing.fbx', 
    (fbx) => {
      // Scale and position the dancer
      fbx.scale.set(scale, scale, scale);
      fbx.position.set(positionX, positionY, positionZ); // Position based on input

      // Ensure all parts of the dancer model cast and receive shadows
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add the dancer to the scene
      scene.add(fbx);
      console.log('HipHopDancing model added to the scene.');

      // Add animation mixer for movement
      const mixer = new THREE.AnimationMixer(fbx);

      // Load animations embedded in the FBX file
      if (fbx.animations && fbx.animations.length > 0) {
        const action = mixer.clipAction(fbx.animations[0]);
        action.play();
      } else {
        console.warn('No animations found in the FBX file.');
      }

      // Update the animation in the main render loop
      const clock = new THREE.Clock();

      function animateDancer() {
        const delta = clock.getDelta(); // Get time delta for smooth animation
        mixer.update(delta); // Update animation mixer
        requestAnimationFrame(animateDancer); // Loop animation
      }

      animateDancer(); // Start the animation loop
    },
    (xhr) => {
      console.log(`HipHopDancing model loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
    },
    (error) => {
      console.error('Error loading the HipHopDancing model:', error);
    }
  );
}
function addBeachChairs(positionX = 0, positionZ = 0, spacing = 10, count = 5, scale = 1) {
  const loader = new GLTFLoader(); // Use GLTFLoader for .gltf files

  // Load the beach chair model
  loader.load(
    'models/beach chairs/scene.gltf',
    (gltf) => {
      for (let i = 0; i < count; i++) {
        const beachChair = gltf.scene.clone(); // Clone the chair for each instance

        // Scale and position the chair
        beachChair.scale.set(scale, scale, scale);
        beachChair.position.set(positionX + i * spacing, 5, positionZ); // Line them up with spacing
        beachChair.castShadow = true; // Enable shadows
        beachChair.receiveShadow = true;

        // Ensure all parts of the chair model cast and receive shadows
        beachChair.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add the chair to the scene
        scene.add(beachChair);
      }
      console.log('Beach chairs added to the scene.');
    },
    (xhr) => {
      console.log(`Beach chair model loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
    },
    (error) => {
      console.error('Error loading the beach chair model:', error);
    }
  );
}
function addDecor( positionX = 0, positionY = 0, positionZ = 0, scale = 1, count = 1, spacingX = 10, spacingZ = 10) {
  const loader = new GLTFLoader(); // Use GLTFLoader for .gltf files

  loader.load(
    'models/decor/scene.gltf', // Path to the decor model
    (gltf) => {
      for (let i = 0; i < count; i++) {
        const decorItem = gltf.scene.clone(); // Clone the decor model for each instance

        // Calculate positions for multiple decor items
        const offsetX = i * spacingX;
        const offsetZ = i * spacingZ;

        // Scale and position the decor item
        decorItem.scale.set(scale, scale, scale);
        decorItem.position.set(positionX + offsetX, positionY, positionZ + offsetZ);
        decorItem.castShadow = true; // Enable shadows
        decorItem.receiveShadow = true;

        // Ensure all parts of the decor model cast and receive shadows
        decorItem.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add the decor item to the scene
        scene.add(decorItem);
      }
      console.log(`Decor items   added to the scene.`);
    },
    (xhr) => {
      console.log(`Decor model loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
    },
    (error) => {
      console.error(`Error loading the decor model :`, error);
    }
  );
}
function addRust( positionX = 0, positionY = 0, positionZ = 0, scale = 1, count = 1, spacingX = 10, spacingZ = 10) {
  const loader = new GLTFLoader(); // Use GLTFLoader for .gltf files

  loader.load(
    'models/rust/scene.gltf', // Path to the rust model
    (gltf) => {
      for (let i = 0; i < count; i++) {
        const rustObject = gltf.scene.clone(); // Clone the rust model for each instance

        // Calculate positions for multiple rust objects
        const offsetX = i * spacingX;
        const offsetZ = i * spacingZ;

        // Scale and position the rust object
        rustObject.scale.set(scale, scale, scale);
        rustObject.position.set(positionX + offsetX, positionY, positionZ + offsetZ);
        rustObject.castShadow = true; // Enable shadows
        rustObject.receiveShadow = true;

        // Ensure all parts of the rust model cast and receive shadows
        rustObject.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add the rust object to the scene
        scene.add(rustObject);
      }
      console.log(`Rust objects from  added to the scene.`);
    },
    (xhr) => {
      console.log(`Rust model loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
    },
    (error) => {
      console.error(`Error loading the rust model from :`, error);
    }
  );
}


function addSpeakers( 
  positionX = 0, 
  positionY = 0, 
  positionZ = 0, 
  scale = 1, 
  count = 1, 
  spacingX = 10, 
  spacingZ = 10, 
  rotationX = 0, 
  rotationY = 0, 
  rotationZ = 0
) {
  const loader = new GLTFLoader(); // Use GLTFLoader for .gltf files

  loader.load(
   'models/speakers/scene.gltf', // Path to the speaker model
    (gltf) => {
      for (let i = 0; i < count; i++) {
        const speaker = gltf.scene.clone(); // Clone the speaker model for each instance

        // Calculate positions for multiple speakers
        const offsetX = i * spacingX;
        const offsetZ = i * spacingZ;

        // Scale and position the speaker
        speaker.scale.set(scale, scale, scale);
        speaker.position.set(positionX + offsetX, positionY, positionZ + offsetZ);
        speaker.rotation.set(rotationX, rotationY, rotationZ); // Set rotation angles
        speaker.castShadow = true; // Enable shadows
        speaker.receiveShadow = true;

        // Ensure all parts of the speaker model cast and receive shadows
        speaker.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add the speaker to the scene
        scene.add(speaker);

        // Add a spotlight for each speaker
        const speakerLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 1, 2); // White spotlight
        speakerLight.position.set(positionX + offsetX, positionY + 10, positionZ + offsetZ); // Place light above speaker
        speakerLight.target.position.set(positionX + offsetX, positionY, positionZ + offsetZ); // Aim light at the speaker
        speakerLight.castShadow = true; // Enable shadows from the light

        // Add the light and its target to the scene
        scene.add(speakerLight);
        scene.add(speakerLight.target);
      }
      console.log('Speakers with lights and rotation added to the scene.');
    },
    (xhr) => {
      console.log(`Speaker model loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
    },
    (error) => {
      console.error('Error loading the speaker model:', error);
    }
  );
}


  
function init() {

  // Initialize stats
  stats = new Stats();
  stats.showPanel(0); // 0: FPS, 1: ms/frame, 2: memory
  document.body.appendChild(stats.dom);




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
//controls.minDistance = 5000; // Minimum zoom (closest to the scene)
controls.maxDistance = 5100; // Maximum zoom (distance from water level)


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
////////////




//////////




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


 
//addYacht(-800, -50, 2); // Smaller yacht
//addPool(-500, -600, 100); // Smaller pool

addMultiplePools(7, 800, -200, -200, 100);
addRain();
//startNightModeToggle();
addMultipleBoats(2, 4000, -1000, -2000, 150); // Adds 5 boats with spacing of 300 units along the x-axis
//addGrassField(1500, 3000, 50, 50, 7, 1);




addFire();
//addCampFire(-200, 220, 20); // Adds a campfire at (100, 200) with scale 2
addIsland();
addCampFire(-200, 220, 20);


addHipHopDancer(0, 8,225, 0.5); // Example: Places the dancer at (0, -200) with scale 10
addBeachChairs(-300, -2500, 200, 10, 100); // Adds 10 chairs with 15 units of spacing, scaled by 2
addDecor(0, 0, -3000, 5, 1,0, 500); // Adds 5 decor items spaced 20 units apart
//function addDecor( positionX = 0, positionY = 0, positionZ = 0, scale = 1, count = 1, spacingX = 10, spacingZ = 10)
addRust(-4000, -299, -3500, 50, 2, 200); // Adds 5 rust objects spaced 20 units apart
//function addRust( positionX = 0, positionY = 0, positionZ = 0, scale = 1, count = 1, spacingX = 10, spacingZ = 10)
//addSpeakers(-300, 0, -3000, 5, 1,0, 500);


addSpeakers(600, 0, -3500, 5, 1, 1,15, 0, Math.PI / 2, 0); 
// Rotates speakers 45 degrees around the X-axis and 90 degrees around the Y-axis


// function addSpeakers( 
//   positionX = 0, 
//   positionY = 0, 
//   positionZ = 0, 
//   scale = 1, 
//   count = 1, 
//   spacingX = 10, 
//   spacingZ = 10, 
//   rotationX = 0, 
//   rotationY = 0, 
//   rotationZ = 0
// )


animate();




}







function animate() {


  stats.begin(); // Start monitoring FPS
  
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


   //animate fire
  var elapsed = clock.getElapsedTime();
  fire.update(elapsed);


  // const elapsed = clock.getElapsedTime();

  // // Update all fire instances
  // fires.forEach((fire) => {
  //   fire.update(elapsed);
  // });
  

  //frame++;
  animateRain(); // Animate the rain
  renderer.render(scene, camera);
  stats.end(); // End monitoring FPS
  requestAnimationFrame(animate);
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
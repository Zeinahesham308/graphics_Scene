import {
    PlaneGeometry,
    ShaderMaterial,
    InstancedMesh,
    Object3D,
    Vector3,
    Color,
    MathUtils,
  } from 'three';
  
  class Grass {
    constructor(scene, options = {}) {
      this.scene = scene;
      this.grassCount = options.grassCount || 10000;
      this.islandRadius = options.islandRadius || 15;
      this.color = options.color || 0x32cd32; // Default grass green
      this.windStrength = options.windStrength || 0.02;
      this.grassBlades = null;
  
      this.initGrass();
    }
  
    initGrass() {
      // Grass Blade Geometry
      const bladeGeometry = new PlaneGeometry(0.2, 1); // Single blade of grass
      const grassMaterial = new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          windStrength: { value: this.windStrength },
          color: { value: new Color(this.color) },
        },
        vertexShader: /* glsl */ `
          uniform float time;
          uniform float windStrength;
  
          varying vec3 vColor;
  
          void main() {
            vec3 transformed = position;
            transformed.x += sin(time + position.y * 10.0) * windStrength;
            transformed.z += cos(time + position.y * 10.0) * windStrength;
  
            vColor = color;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 color;
          varying vec3 vColor;
  
          void main() {
            gl_FragColor = vec4(vColor * color, 1.0);
          }
        `,
        side: 2, // Double side rendering
      });
  
      // Instanced Grass
      const grassMesh = new InstancedMesh(bladeGeometry, grassMaterial, this.grassCount);
      const dummy = new Object3D();
  
      for (let i = 0; i < this.grassCount; i++) {
        const angle = Math.random() * Math.PI * 2; // Random angle
        const radius = Math.random() * this.islandRadius;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
  
        dummy.position.set(x, 0.1, z); // Slightly above ground
        dummy.rotation.y = Math.random() * Math.PI; // Random rotation
        const scale = 0.5 + Math.random() * 0.5; // Random scale
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
  
        grassMesh.setMatrixAt(i, dummy.matrix);
      }
  
      grassMesh.castShadow = true;
      grassMesh.receiveShadow = true;
      this.grassBlades = grassMesh;
  
      this.scene.add(grassMesh);
    }
  
    updateGrass(deltaTime) {
      if (this.grassBlades) {
        this.grassBlades.material.uniforms.time.value += deltaTime;
        this.grassBlades.instanceMatrix.needsUpdate = true;
      }
    }
  }
  
  export { Grass };
  
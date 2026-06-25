'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Track mouse coordinates
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates around center (-1 to 1)
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Setup Three.js Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create programmatically-generated circular star texture
    const createStarTexture = () => {
      const starCanvas = document.createElement('canvas');
      starCanvas.width = 16;
      starCanvas.height = 16;
      const ctx = starCanvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(starCanvas);
    };

    const starTexture = createStarTexture();

    // Star Count and Setup
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);
    const twinkleSpeeds = new Float32Array(starCount);
    const twinklePhases = new Float32Array(starCount);

    // Store positions and colors in arrays for CPU updates
    const starPoints: THREE.Vector3[] = [];
    const starColors: THREE.Color[] = [];

    // Real stellar temperature spectral colors
    const colorPalette = [
      new THREE.Color('#9bb0ff'), // 50% Blue-white (O/B type stars)
      new THREE.Color('#ffffff'), // 20% Pure white (A type stars)
      new THREE.Color('#fff4ea'), // 15% Warm yellow-white (F/G type stars)
      new THREE.Color('#ffd2a1'), // 10% Orange (K type stars)
      new THREE.Color('#ff8a80'), // 5% Soft Red (M type stars)
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribute stars in a large box volume
      const x = (Math.random() - 0.5) * 1400;
      const y = (Math.random() - 0.5) * 1000;
      // Spread along Z to create depth layer parallax
      const z = (Math.random() - 0.5) * 1200 - 100;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      starPoints.push(new THREE.Vector3(x, y, z));

      // 5% of stars are extra large, bright "Hero" stars. The rest are standard.
      const isHero = Math.random() < 0.05;
      if (isHero) {
        sizes[i] = Math.random() * 8.0 + 8.0; // Size 8px to 16px (before distance scaling)
      } else {
        sizes[i] = Math.random() * 4.5 + 2.5; // Size 2.5px to 7px (before distance scaling)
      }

      // Choose color based on weighted distribution
      const rand = Math.random();
      let selectedColor = colorPalette[0]; // Default blue-white
      if (rand > 0.5 && rand <= 0.7) selectedColor = colorPalette[1]; // White
      else if (rand > 0.7 && rand <= 0.85) selectedColor = colorPalette[2]; // Yellow-white
      else if (rand > 0.85 && rand <= 0.95) selectedColor = colorPalette[3]; // Orange
      else if (rand > 0.95) selectedColor = colorPalette[4]; // Red

      colors[i * 3] = selectedColor.r;
      colors[i * 3 + 1] = selectedColor.g;
      colors[i * 3 + 2] = selectedColor.b;

      starColors.push(selectedColor);

      // Twinkle properties
      twinkleSpeeds[i] = Math.random() * 1.6 + 0.4;
      twinklePhases[i] = Math.random() * Math.PI * 2;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
    starGeometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));

    // Custom Shader Material for GPU Twinkling and Star Colors
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: starTexture },
        time: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute float twinkleSpeed;
        attribute float twinklePhase;
        attribute vec3 color;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          // Compute wave opacity based on time, phase, and speed
          vOpacity = 0.35 + 0.65 * sin(time * twinkleSpeed + twinklePhase);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Scale size by distance to camera (using a larger 750.0 factor for enhanced visibility)
          gl_PointSize = size * (750.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          // Combine star core color and dynamic opacity
          gl_FragColor = vec4(vColor, vOpacity) * texColor;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const starParticles = new THREE.Points(starGeometry, starMaterial);
    scene.add(starParticles);

    // Setup Line Geometry for Constellation Web effect
    const maxLines = 150;
    const linePositions = new Float32Array(maxLines * 2 * 3);
    const lineColors = new Float32Array(maxLines * 2 * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35, // Slightly higher opacity for visibility
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const constellationLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(constellationLines);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      
      // Update uniform for GPU twinkling
      starMaterial.uniforms.time.value = elapsedTime;

      // Smoothly interpolate mouse coordinates for lazy/fluid motion (lerp)
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // Subtle camera parallax: camera moves opposite to mouse pointer
      camera.position.x = mouseX * 85;
      camera.position.y = mouseY * 85;
      camera.lookAt(scene.position);

      // Slow, majestic celestial rotation of the starfield
      starParticles.rotation.y = elapsedTime * 0.005;
      starParticles.rotation.x = elapsedTime * 0.002;
      
      // Constellation Web Calculation
      // Project 2D mouse position to 3D space at Z layer depth
      const tempV = new THREE.Vector3(mouseX, mouseY, 0.5);
      tempV.unproject(camera);
      const dir = tempV.sub(camera.position).normalize();
      // Intersect with plane at Z=0 (average star plane)
      const distance = -camera.position.z / dir.z;
      const mouse3D = camera.position.clone().add(dir.multiplyScalar(distance));

      // Rotate mouse coordinates backwards by the star particles' rotation
      // to align mouse search space with the rotated stars
      const invRot = new THREE.Euler(
        -starParticles.rotation.x,
        -starParticles.rotation.y,
        0,
        'XYZ'
      );
      mouse3D.applyEuler(invRot);

      // Find stars near the mouse
      const activeStars: number[] = [];
      const hoverRadius = 180; // slightly wider hover range

      for (let i = 0; i < starCount; i++) {
        const star = starPoints[i];
        const dist = mouse3D.distanceTo(star);
        if (dist < hoverRadius) {
          activeStars.push(i);
        }
      }

      // Draw constellation connections between nearby stars in the active region
      let lineIndex = 0;
      const positionsAttr = lineGeometry.attributes.position as THREE.BufferAttribute;
      const colorsAttr = lineGeometry.attributes.color as THREE.BufferAttribute;
      const posArray = positionsAttr.array as Float32Array;
      const colArray = colorsAttr.array as Float32Array;

      // Reset lines
      positionsAttr.needsUpdate = true;
      colorsAttr.needsUpdate = true;

      // Connect active stars to each other if they are close
      for (let i = 0; i < activeStars.length && lineIndex < maxLines; i++) {
        const idxA = activeStars[i];
        const starA = starPoints[idxA];
        const colorA = starColors[idxA];

        for (let j = i + 1; j < activeStars.length && lineIndex < maxLines; j++) {
          const idxB = activeStars[j];
          const starB = starPoints[idxB];
          const colorB = starColors[idxB];

          const distAB = starA.distanceTo(starB);
          if (distAB < 95) {
            // Draw segment A-B
            const pIndexA = lineIndex * 2 * 3;
            const pIndexB = (lineIndex * 2 + 1) * 3;

            // Apply star group rotation to lines so they line up with rotated stars
            const rotStarA = starA.clone().applyEuler(starParticles.rotation);
            const rotStarB = starB.clone().applyEuler(starParticles.rotation);

            posArray[pIndexA] = rotStarA.x;
            posArray[pIndexA + 1] = rotStarA.y;
            posArray[pIndexA + 2] = rotStarA.z;

            posArray[pIndexB] = rotStarB.x;
            posArray[pIndexB + 1] = rotStarB.y;
            posArray[pIndexB + 2] = rotStarB.z;

            // Dynamic opacity based on proximity to mouse
            const distMouseA = mouse3D.distanceTo(starA);
            const distMouseB = mouse3D.distanceTo(starB);
            const avgDist = (distMouseA + distMouseB) / 2;
            const intensity = Math.max(0, 1 - avgDist / hoverRadius);

            // Set color based on star color, blending into the web
            colArray[pIndexA] = colorA.r * intensity * 0.6;
            colArray[pIndexA + 1] = colorA.g * intensity * 0.6;
            colArray[pIndexA + 2] = colorA.b * intensity * 0.75; // slightly blue-boosted glow

            colArray[pIndexB] = colorB.r * intensity * 0.6;
            colArray[pIndexB + 1] = colorB.g * intensity * 0.6;
            colArray[pIndexB + 2] = colorB.b * intensity * 0.75;

            lineIndex++;
          }
        }
      }

      lineGeometry.setDrawRange(0, lineIndex * 2);
      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      // Dispose materials & geometries
      starGeometry.dispose();
      starMaterial.dispose();
      starTexture.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="star-field" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {/* Nebula glow blobs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '20%', left: '10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '60%', right: '15%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.015) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

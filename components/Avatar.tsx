'use client';

import React, { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  useGLTF, 
  useAnimations, 
  Float, 
  ContactShadows, 
  Environment,
  PresentationControls
} from '@react-three/drei';
import * as THREE from 'three';

// Detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const KalamModel = ({ isTalking, isMobile }: { isTalking: boolean; isMobile: boolean }) => {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF('/model.glb');
  const { actions, names } = useAnimations(animations, group);

  // Procedural Animation Refs
  const headRef = useRef<THREE.Object3D | null>(null);
  const leftEyeRef = useRef<THREE.Object3D | null>(null);
  const rightEyeRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Disable shadows on mobile for performance
        child.castShadow = !isMobile;
        child.receiveShadow = !isMobile;
        
        if (child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.roughness = 0.3;
          material.metalness = 0.6;
          material.color.setHex(0xbababa);
          
          if (!material.map) {
             material.emissive = new THREE.Color(0x3b82f6);
             material.emissiveIntensity = 0.05;
          }
          material.needsUpdate = true;
        }
        
        const name = child.name.toLowerCase();
        if (name.includes('head') || name.includes('skull') || name.includes('face') || name.includes('neck')) {
          headRef.current = child;
        }
        if (name.includes('eye_l') || name.includes('left_eye') || name.includes('eye01')) {
          leftEyeRef.current = child;
        }
        if (name.includes('eye_r') || name.includes('right_eye') || name.includes('eye02')) {
          rightEyeRef.current = child;
        }
      }
    });

    if (names.length > 0) {
      const idle = names.find(n => n.toLowerCase().includes('idle')) || names[0];
      actions[idle]?.fadeIn(0.5).play();
    }
  }, [scene, actions, names, isMobile]);

  // Throttle frame updates on mobile (run every other frame)
  const frameCount = useRef(0);
  
  useFrame((state) => {
    frameCount.current++;
    // On mobile, skip every other frame for performance
    if (isMobile && frameCount.current % 2 !== 0) return;
    
    const t = state.clock.getElapsedTime();

    // Procedural blink
    const blink = Math.sin(t * 0.5) > 0.98 ? 0.05 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blink, 0.2);
    if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blink, 0.2);

    // Procedural talk
    if (isTalking && headRef.current) {
      headRef.current.position.y = Math.abs(Math.sin(t * 15)) * 0.02;
    }

    // Natural swaying — always active so the model feels alive
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.4) * 0.05;
      group.current.position.y = -1.8 + Math.sin(t * 1.2) * 0.04;
    }
  });

  return <primitive ref={group} object={scene} scale={isMobile ? 1.6 : 2} position={[0, -1.8, 0]} />;
};

export default function AvatarScene({ isTalking = false }: { isTalking?: boolean }) {
  const isMobile = useIsMobile();

  return (
    <div className="avatar-layer">
      <Canvas
        camera={{ position: [0, 1.5, isMobile ? 5.5 : 4.5], fov: isMobile ? 40 : 35 }}
        shadows={!isMobile}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        performance={{ min: 0.5 }}
        gl={{ 
          antialias: !isMobile,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#050508']} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <spotLight 
            position={[5, 10, 5]} 
            angle={0.25} 
            penumbra={1} 
            intensity={2} 
            castShadow={!isMobile}
            shadow-mapSize={isMobile ? 512 : 1024}
          />
          <directionalLight position={[-3, 5, 2]} intensity={1.5} color="#ffffff" />
          
          {/* Scientific rim lighting */}
          <pointLight position={[2, 1, 3]} color="#3b82f6" intensity={3} />
          {!isMobile && <pointLight position={[-2, 1, -2]} color="#6366f1" intensity={2} />}
          
          <PresentationControls
            global
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 6, Math.PI / 6]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
          >
            {isMobile ? (
              <KalamModel isTalking={isTalking} isMobile={isMobile} />
            ) : (
              <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <KalamModel isTalking={isTalking} isMobile={isMobile} />
              </Float>
            )}
          </PresentationControls>

          {!isMobile && (
            <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={8} blur={3} far={4} />
          )}
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}

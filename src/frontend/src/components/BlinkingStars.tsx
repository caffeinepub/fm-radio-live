import { memo, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BlinkingStars = memo(() => {
    const pointsRef = useRef<THREE.Points>(null);
    const starCount = 800; // Optimized count for performance

    // Generate star positions with individualized animation parameters
    const { geometry, phases, speeds } = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const colors = new Float32Array(starCount * 3);
        const phaseArray = new Float32Array(starCount);
        const speedArray = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            // Distribute stars evenly across the sky sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const distance = 100 + Math.random() * 150;

            const i3 = i * 3;
            positions[i3] = distance * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = distance * Math.cos(phi);

            // Small star sizes for subtle appearance
            sizes[i] = 0.3 + Math.random() * 0.5;
            
            // Soft color variation
            const colorVariation = Math.random();
            if (colorVariation < 0.7) {
                // Pure white stars (70%)
                colors[i3] = 1.0;
                colors[i3 + 1] = 1.0;
                colors[i3 + 2] = 1.0;
            } else if (colorVariation < 0.85) {
                // Soft blue-white stars (15%)
                colors[i3] = 0.85;
                colors[i3 + 1] = 0.92;
                colors[i3 + 2] = 1.0;
            } else {
                // Soft warm-white stars (15%)
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.95;
                colors[i3 + 2] = 0.88;
            }

            // Individual phase and speed for natural blinking
            phaseArray[i] = Math.random() * Math.PI * 2;
            speedArray[i] = 0.2 + Math.random() * 0.5;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        return { geometry: geo, phases: phaseArray, speeds: speedArray };
    }, []);

    // Smooth blinking animation
    useFrame((state) => {
        if (pointsRef.current && pointsRef.current.material) {
            const material = pointsRef.current.material as THREE.PointsMaterial;
            const time = state.clock.elapsedTime;
            
            // Soft, gentle intensity
            const baseOpacity = 0.2 + 0.1 * Math.sin(time * 0.15);
            material.opacity = baseOpacity;

            // Update individual star sizes for soft twinkling
            const sizes = geometry.getAttribute('size') as THREE.BufferAttribute;
            for (let i = 0; i < starCount; i++) {
                const phase = phases[i];
                const speed = speeds[i];
                const twinkle = 0.7 + 0.3 * Math.sin(time * speed + phase);
                sizes.setX(i, (0.3 + Math.random() * 0.5) * twinkle);
            }
            sizes.needsUpdate = true;
        }
    });

    return (
        <points ref={pointsRef} geometry={geometry} renderOrder={-1}>
            <pointsMaterial
                size={0.5}
                vertexColors
                transparent
                opacity={0.25}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={true}
            />
        </points>
    );
});

BlinkingStars.displayName = 'BlinkingStars';

export default BlinkingStars;

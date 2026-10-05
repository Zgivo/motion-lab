"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Points } from "three";

function Field({ speed, pointerX, pointerY }: { speed: number; pointerX: number; pointerY: number }) {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(900);
    for (let index = 0; index < data.length; index += 3) {
      const angle = index * 0.19;
      const radius = 0.65 + ((index / 3) % 40) / 32;
      data[index] = Math.cos(angle) * radius;
      data[index + 1] = Math.sin(angle * 1.17) * radius * .62;
      data[index + 2] = Math.sin(angle * .43) * .8;
    }
    return data;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed * .22;
    ref.current.rotation.x += (pointerY * .18 - ref.current.rotation.x) * .04;
    ref.current.rotation.z += (pointerX * .16 - ref.current.rotation.z) * .04;
  });

  return <points ref={ref}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#d7ff45" size={0.035} sizeAttenuation transparent opacity={0.92} />
  </points>;
}

export default function ParticleScene({ speed, pointerX, pointerY }: { speed: number; pointerX: number; pointerY: number }) {
  return <Canvas camera={{ position: [0, 0, 4], fov: 48 }} dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: "high-performance" }}>
    <Field speed={speed} pointerX={pointerX} pointerY={pointerY} />
  </Canvas>;
}

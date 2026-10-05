"use client";

// Adapted from DavidHDev/react-bits Lanyard (MIT):
// https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/Lanyard
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, type RapierRigidBody } from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import "./Lanyard.css";

const MODEL = "/lanyard/card.glb";
const STRAP = "/lanyard/signature-band.png";
const PORTRAIT = "/images/krishank-portrait.png";

function Band({ onReady }: { onReady: () => void }) {
  const fixed = useRef<RapierRigidBody>(null!), j1 = useRef<RapierRigidBody>(null!), j2 = useRef<RapierRigidBody>(null!), j3 = useRef<RapierRigidBody>(null!), card = useRef<RapierRigidBody>(null!);
  const geometry = useMemo(() => new MeshLineGeometry(), []);
  const material = useMemo(() => {
    const result = new MeshLineMaterial({ color: "white", lineWidth: 1, resolution: new THREE.Vector2(1000, 1000) });
    result.depthTest = false;
    return result;
  }, []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(Array.from({ length: 4 }, () => new THREE.Vector3())), []);
  const lerped = useRef([new THREE.Vector3(.5, 4, 0), new THREE.Vector3(1, 4, 0)]);
  const offset = useRef<THREE.Vector3 | null>(null);
  const [dragging, setDragging] = useState(false);
  const { gl, camera, size } = useThree();
  const { nodes, materials } = useGLTF(MODEL);
  const strap = useTexture(STRAP), portrait = useTexture(PORTRAIT);
  const meshes = nodes as Record<string, THREE.Mesh>;
  const finishes = materials as Record<string, THREE.MeshStandardMaterial>;

  // Preserve the baked edges of the GLB atlas; replace only the face UVs.
  const atlas = useMemo(() => {
    const base = finishes.base.map;
    if (!base?.image || !portrait.image) return null;
    const image = portrait.image as CanvasImageSource & { width: number; height: number };
    const { width, height } = base.image as { width: number; height: number };
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(base.image as CanvasImageSource, 0, 0, width, height);
    for (const [rx, ry, rw, rh] of [[0, 0, .5, .755], [.5, 0, .5, .757]]) {
      const x = rx * width, y = ry * height, w = rw * width, h = rh * height;
      const scale = Math.max(w / image.width, h / image.height);
      context.save(); context.beginPath(); context.rect(x, y, w, h); context.clip();
      context.drawImage(image, x + (w - image.width * scale) / 2, y + (h - image.height * scale) / 2, image.width * scale, image.height * scale);
      context.restore();
    }
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.flipY = base.flipY;
    result.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return result;
  }, [finishes, portrait, gl]);

  useEffect(() => { if (atlas) onReady(); }, [atlas, onReady]);
  useEffect(() => () => atlas?.dispose(), [atlas]);
  useEffect(() => {
    const map = strap.clone();
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.needsUpdate = true;
    material.map = map;
    material.useMap = 1;
    material.repeat.set(4, 1);
    material.needsUpdate = true;
    return () => { map.dispose(); };
  }, [strap, material]);
  useEffect(() => { material.resolution.set(size.width, size.height); }, [material, size]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); document.body.style.cursor = ""; }, [geometry, material]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.5, 0]]);

  useFrame((state, delta) => {
    if (offset.current && card.current) {
      // Drag on the badge's world plane, rather than using camera distance as a
      // proxy. This remains accurate when the camera is moved closer to frame it.
      const pointer = new THREE.Vector3(state.pointer.x, state.pointer.y, .5).unproject(camera);
      const direction = pointer.sub(camera.position).normalize();
      const target = camera.position.clone().addScaledVector(direction, -camera.position.z / direction.z);
      [card, j1, j2, j3].forEach(body => body.current?.wakeUp());
      card.current.setNextKinematicTranslation(target.sub(offset.current));
    }
    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current) return;
    [j1, j2].forEach((body, index) => {
      const { x, y, z } = body.current!.translation();
      lerped.current[index].lerp(new THREE.Vector3(x, y, z), Math.min(1, delta * 30));
    });
    const a = j3.current.translation(), b = fixed.current.translation();
    curve.points[0].set(a.x, a.y, a.z);
    curve.points[1].copy(lerped.current[1]); curve.points[2].copy(lerped.current[0]);
    curve.points[3].set(b.x, b.y, b.z);
    geometry.setPoints(curve.getPoints(24));
    const spin = card.current.angvel(), rotation = card.current.rotation();
    card.current.setAngvel({ x: spin.x, y: spin.y - rotation.y * .25, z: spin.z }, true);
  });

  const segment = { colliders: false as const, canSleep: true, angularDamping: 4, linearDamping: 4 };
  return <>
    <group position={[0, 4, 0]}>
      <RigidBody ref={fixed} {...segment} type="fixed" />
      <RigidBody ref={j1} {...segment} position={[.5, 0, 0]}><BallCollider args={[.1]} /></RigidBody>
      <RigidBody ref={j2} {...segment} position={[1, 0, 0]}><BallCollider args={[.1]} /></RigidBody>
      <RigidBody ref={j3} {...segment} position={[1.5, 0, 0]}><BallCollider args={[.1]} /></RigidBody>
      <RigidBody ref={card} {...segment} type={dragging ? "kinematicPosition" : "dynamic"} position={[2, 0, 0]}>
        <CuboidCollider args={[.8, 1.125, .01]} />
        <group scale={2.25} position={[0, -1.2, -.05]}
          onPointerOver={() => { document.body.style.cursor = dragging ? "grabbing" : "grab"; }}
          onPointerOut={() => { if (!dragging) document.body.style.cursor = ""; }}
          onPointerDown={event => {
            event.stopPropagation(); (event.target as HTMLElement).setPointerCapture(event.pointerId);
            const origin = card.current?.translation();
            if (origin) offset.current = event.point.clone().sub(new THREE.Vector3(origin.x, origin.y, origin.z));
            setDragging(true); document.body.style.cursor = "grabbing";
          }}
          onPointerUp={event => {
            event.stopPropagation(); (event.target as HTMLElement).releasePointerCapture(event.pointerId);
            offset.current = null; setDragging(false); document.body.style.cursor = "grab";
          }}
          onPointerCancel={() => { offset.current = null; setDragging(false); document.body.style.cursor = ""; }}>
          <mesh geometry={meshes.card.geometry}><meshPhysicalMaterial map={atlas ?? finishes.base.map} clearcoat={1} clearcoatRoughness={.15} roughness={.9} metalness={.8} /></mesh>
          <mesh geometry={meshes.clip.geometry} material={finishes.metal} />
          <mesh geometry={meshes.clamp.geometry} material={finishes.metal} />
        </group>
      </RigidBody>
    </group>
    <mesh geometry={geometry} material={material} frustumCulled={false} />
  </>;
}

function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    // The canvas is 1 / .82 times taller than before; this camera distance
    // makes the desktop badge 2.5x larger without scaling the physics.
    const viewportWidth = window.innerWidth;
    const mobile = viewportWidth <= 760;
    camera.position.set(mobile ? 0 : -1.7, 0, viewportWidth <= 480 ? 13 : mobile ? 11 : 18 / (2.5 * .82));
    camera.lookAt(mobile ? 0 : -1.7, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
}

export default function Lanyard({ onReady, onFailure, active }: { onReady: () => void; onFailure: () => void; active: boolean }) {
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = wrapper.current?.querySelector("canvas");
    if (!canvas) return;
    const lost = () => onFailure();
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [onFailure]);
  return <div ref={wrapper} className="lanyard-canvas" aria-hidden="true">
    <Canvas camera={{ position: [-1.7, 0, 18 / (2.5 * .82)], fov: 35 }} dpr={[1, 1.75]} frameloop={active ? "always" : "never"} gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)} fallback={null}>
      <CameraRig />
      <ambientLight intensity={2.8} /><directionalLight position={[5, 5, 8]} intensity={3} />
      <Suspense fallback={null}><Physics gravity={[0, -40, 0]} timeStep={1 / 60} paused={!active}><Band onReady={onReady} /></Physics></Suspense>
    </Canvas>
  </div>;
}

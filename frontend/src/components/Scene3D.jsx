import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Spline-style ambient background: floating glass shapes, slow drift, scroll parallax. */
export default function Scene3D({ darkMode = false }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const lowPowerDevice = window.matchMedia("(max-width: 768px), (prefers-reduced-motion: reduce)").matches;
    if (lowPowerDevice) return;

    const scene = new THREE.Scene();
    const fogColor = 0x020408;
    scene.fog = new THREE.Fog(fogColor, 12, 42);
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const accent = 0x00e5ff;
    const accent2 = 0x3b82f6;

    const makeGlass = (color, opacity = 0.55) =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.15,
        roughness: 0.08,
        transmission: 0.92,
        thickness: 1.2,
        transparent: true,
        opacity,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 32, 32),
      makeGlass(accent, 0.5)
    );
    sphere.position.set(-5, 1.5, -2);
    group.add(sphere);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.35, 16, 48),
      makeGlass(accent2, 0.45)
    );
    ring.position.set(5, -1, -4);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.8, 1),
      makeGlass(0xc084fc, 0.4)
    );
    blob.position.set(0, -3, -6);
    group.add(blob);

    const particlesGeo = new THREE.BufferGeometry();
    const count = 120;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(
      particlesGeo,
      new THREE.PointsMaterial({
        color: accent,
        size: 0.06,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0x4338ca, 0.4));
    const key = new THREE.DirectionalLight(0xc4b5fd, 1.4);
    key.position.set(6, 8, 10);
    scene.add(key);
    const rim = new THREE.PointLight(accent2, 1.6, 40);
    rim.position.set(-8, -2, 6);
    scene.add(rim);

    let scrollY = 0;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      group.rotation.y = t * 0.12;
      group.rotation.x = Math.sin(t * 0.2) * 0.08;
      sphere.position.y = 1.5 + Math.sin(t * 0.7) * 0.4;
      ring.rotation.z = t * 0.15;
      blob.rotation.y = t * 0.25;
      blob.rotation.x = t * 0.18;
      particles.rotation.y = t * 0.03;

      camera.position.y = scrollY * 0.004 - 1;
      camera.lookAt(0, scrollY * 0.002, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      sphere.geometry.dispose();
      sphere.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      blob.geometry.dispose();
      blob.material.dispose();
      particlesGeo.dispose();
      particles.material.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [darkMode]);

  return (
    <div
      ref={mountRef}
      className="scene-3d-canvas fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}

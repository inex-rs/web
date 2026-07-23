// @deno-types="@types/three"
import type * as ThreeNS from "three";
import { type Component, onCleanup, onMount } from "solid-js";
import { useReducedMotion } from "../lib/media.ts";

const FRAME_SIZE = 2.0;

// Bundled URL (not /public): a missing /public asset falls through to index.html and GLTFLoader parses it as JSON.
const HAMSTER_URL = new URL("../assets/hamster.glb", import.meta.url).href;

export const DeviceModel: Component<{ colour: string; size?: number }> = (
  props,
) => {
  let host: HTMLDivElement | undefined;
  const size = () => props.size ?? 120;
  const reduced = useReducedMotion();

  onMount(() => {
    let cleanup: (() => void) | null = null;
    let disposed = false;

    (async () => {
      const THREE = (await import("three")) as typeof ThreeNS;
      // @deno-types="@types/three/examples/jsm/loaders/GLTFLoader.d.ts"
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader.js"
      );
      if (disposed || !host) return;

      const px = size();
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 4.4);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
      renderer.setSize(px, px, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.domElement.style.width = `${px}px`;
      renderer.domElement.style.height = `${px}px`;
      host.appendChild(renderer.domElement);

      const col = new THREE.Color(props.colour || "#7c3aed");

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const key = new THREE.DirectionalLight(0xffffff, 3.0);
      key.position.set(2.5, 4, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(col.getHex(), 1.6);
      rim.position.set(-3, -1.5, -2);
      scene.add(rim);

      const model = new THREE.Group();
      model.position.y = -0.12;
      scene.add(model);

      const reduce = reduced();
      const t0 = performance.now();
      let raf = 0;
      let onscreen = true;
      const active = () => onscreen && !document.hidden;
      const render = () => renderer.render(scene, camera);
      const tick = (now: number) => {
        const t = (now - t0) / 1000;
        model.rotation.y = t * 0.7;
        model.position.y = -0.12 + Math.sin(t * 1.5) * 0.1;
        model.rotation.x = Math.sin(t * 0.8) * 0.1;
        render();
        raf = active() ? requestAnimationFrame(tick) : 0;
      };
      const start = () => {
        if (!raf && !reduce && active()) raf = requestAnimationFrame(tick);
      };
      const stop = () => {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };

      let root: ThreeNS.Object3D | null = null;

      const loader = new GLTFLoader();
      loader.load(
        HAMSTER_URL,
        (gltf) => {
          if (disposed) {
            disposeScene(gltf.scene);
            return;
          }
          root = gltf.scene;

          const box = new THREE.Box3().setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          const dims = box.getSize(new THREE.Vector3());
          const largest = Math.max(dims.x, dims.y, dims.z) || 1;
          const scale = FRAME_SIZE / largest;
          root.position.sub(center);
          root.position.multiplyScalar(scale);
          root.scale.setScalar(scale);

          model.add(root);
          render();
        },
        undefined,
        (err) => {
          console.error("device-model: failed to load hamster.glb", err);
        },
      );

      const onVisibility = () => (active() ? start() : stop());
      document.addEventListener("visibilitychange", onVisibility);
      const io = new IntersectionObserver((entries) => {
        onscreen = entries[0]?.isIntersecting ?? true;
        if (active()) start();
        else stop();
      });
      io.observe(host);

      if (reduce) {
        model.rotation.y = 0.5;
        render();
      } else {
        start();
      }

      cleanup = () => {
        stop();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        if (root) disposeScene(root);
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch((err) => {
      console.error("device-model: three.js failed to load", err);
    });

    onCleanup(() => {
      disposed = true;
      cleanup?.();
    });
  });

  return (
    <div
      ref={host}
      class="grid place-items-center"
      aria-hidden="true"
      style={{ width: `${size()}px`, height: `${size()}px` }}
    />
  );
};

function disposeScene(root: ThreeNS.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as ThreeNS.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      const m = mat as ThreeNS.MeshStandardMaterial;
      m.map?.dispose();
      m.dispose();
    }
  });
}

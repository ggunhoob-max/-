import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type FinishMode = 'obsidian' | 'chrome' | 'crystal' | 'clay';

interface Hero3DStageProps {
  modelUrl: string;
  themeColor: string;
  finishMode: FinishMode;
  autoRotate: boolean;
  isPlayingAudio: boolean;
  resetSignal: number;
  onLoadProgress?: (progress: number, loaded: boolean, error: string | null) => void;
}

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
const _targetColor = new THREE.Color();
const _dummy = new THREE.Object3D();

function createVinylAlbedoTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, size, size);

    // Subtle concentric vinyl grooves
    for (let r = 64; r < 248; r += 3) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = r % 12 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Center studio label ring
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.fillStyle = '#161b22';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.34)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const Hero3DStage: React.FC<Hero3DStageProps> = ({
  modelUrl,
  themeColor,
  finishMode,
  autoRotate,
  isPlayingAudio,
  resetSignal,
  onLoadProgress,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const themeColorRef = useRef<string>(themeColor);
  const finishModeRef = useRef<FinishMode>(finishMode);
  const autoRotateRef = useRef<boolean>(autoRotate);
  const isPlayingRef = useRef<boolean>(isPlayingAudio);
  const onLoadProgressRef = useRef(onLoadProgress);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const subjectAnchorRef = useRef<THREE.Group | null>(null);
  const materialsMapRef = useRef<Record<FinishMode, THREE.MeshPhysicalMaterial> | null>(null);
  const loadedMeshesRef = useRef<THREE.Mesh[]>([]);
  const isSoftwareGlRef = useRef<boolean>(false);
  const contextLostRef = useRef<boolean>(false);

  useEffect(() => {
    themeColorRef.current = themeColor;
    if (materialsMapRef.current) {
      materialsMapRef.current.crystal.attenuationColor.set(themeColor || '#00CD3C');
    }
  }, [themeColor]);

  useEffect(() => {
    finishModeRef.current = finishMode;
    const map = materialsMapRef.current;
    if (map && loadedMeshesRef.current.length > 0) {
      const targetMat = map[finishMode];
      loadedMeshesRef.current.forEach((mesh) => {
        mesh.material = targetMat;
      });
    }
  }, [finishMode]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isSoftwareGlRef.current && autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    isPlayingRef.current = isPlayingAudio;
  }, [isPlayingAudio]);

  useEffect(() => {
    onLoadProgressRef.current = onLoadProgress;
  }, [onLoadProgress]);

  // Reset camera smoothly via target & camera pos
  useEffect(() => {
    if (resetSignal === 0) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const anchor = subjectAnchorRef.current;
    if (camera && controls && anchor) {
      const isDesktop = (mountRef.current?.clientWidth || window.innerWidth) >= 1024;
      const anchorX = isDesktop ? 1.18 : 0;
      anchor.position.x = anchorX;
      controls.target.set(anchorX, 0.12, 0);
      camera.position.set(anchorX + 0.35, 0.88, isDesktop ? 4.35 : 4.85);
      controls.update();
    }
  }, [resetSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    isSoftwareGlRef.current = isSoftwareGl;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isDesktopInitial = window.innerWidth >= 1024;
    const initialAnchorX = isDesktopInitial ? 1.18 : 0;

    // 1. Scene & Atmospheric Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0e14, 0.045);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(initialAnchorX + 0.35, 0.88, isDesktopInitial ? 4.35 : 4.25);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.outline = 'none';
    container.appendChild(renderer.domElement);

    // WebGL Context Loss/Restore Handling
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLostRef.current = true;
    };
    const handleContextRestored = () => {
      contextLostRef.current = false;
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // 2. Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3. 3-Point Studio Lighting + Theme Accent Rim Lights
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0b0e14, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.6);
    keyLight.position.set(4.5, 6.5, 5.5);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 20;
      keyLight.shadow.camera.left = -3.5;
      keyLight.shadow.camera.right = 3.5;
      keyLight.shadow.camera.top = 3.5;
      keyLight.shadow.camera.bottom = -3.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.1);
    fillLight.position.set(-5.0, 2.8, 3.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(new THREE.Color(themeColorRef.current), 6.5, 18, 1.4);
    rimLight.position.set(initialAnchorX - 1.6, 2.0, -2.5);
    scene.add(rimLight);

    const rimLightRight = new THREE.PointLight(new THREE.Color(themeColorRef.current), 4.0, 14, 1.6);
    rimLightRight.position.set(initialAnchorX + 2.0, 0.8, -1.8);
    scene.add(rimLightRight);

    // 4. Sculptural Material Finishes for Untextured Tripo GLB Mesh
    const finishMaterials: Record<FinishMode, THREE.MeshPhysicalMaterial> = {
      obsidian: new THREE.MeshPhysicalMaterial({
        color: 0x181e29,
        metalness: 0.35,
        roughness: 0.24,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
        iridescence: 0.42,
        iridescenceIOR: 1.45,
        envMapIntensity: 1.45,
      }),
      chrome: new THREE.MeshPhysicalMaterial({
        color: 0xe6edf3,
        metalness: 0.96,
        roughness: 0.14,
        anisotropy: 0.8,
        clearcoat: 0.35,
        envMapIntensity: 1.65,
      }),
      crystal: new THREE.MeshPhysicalMaterial({
        color: 0xeafff5,
        metalness: 0.04,
        roughness: 0.08,
        transmission: isSoftwareGl ? 0 : 0.88,
        transparent: isSoftwareGl,
        opacity: isSoftwareGl ? 0.5 : 1,
        ior: 1.6,
        thickness: 1.4,
        attenuationColor: new THREE.Color(themeColorRef.current),
        attenuationDistance: 1.8,
        clearcoat: 1.0,
        envMapIntensity: 1.5,
      }),
      clay: new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        metalness: 0.04,
        roughness: 0.7,
        clearcoat: 0.08,
        envMapIntensity: 0.9,
      }),
    };
    materialsMapRef.current = finishMaterials;

    // 5. Subject Anchor & Grounded Acoustic Vinyl Pedestal (Composite Group)
    const subjectAnchor = new THREE.Group();
    subjectAnchor.position.set(initialAnchorX, -0.05, 0);
    scene.add(subjectAnchor);
    subjectAnchorRef.current = subjectAnchor;

    const pedestalY = -1.08;
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, pedestalY, 0);
    subjectAnchor.add(pedestalGroup);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.14;
    pedestalGroup.add(shadowPlane);

    // Lower Plinth Disc
    const plinthGeo = new THREE.CylinderGeometry(1.36, 1.46, 0.12, 64);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x11161f,
      metalness: 0.72,
      roughness: 0.36,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -0.06;
    plinthMesh.receiveShadow = !isSoftwareGl;
    pedestalGroup.add(plinthMesh);

    // Vinyl Platter Disc
    const vinylTex = createVinylAlbedoTexture(maxAnisotropy);
    const platterGeo = new THREE.CylinderGeometry(1.22, 1.24, 0.05, 64);
    const platterMat = new THREE.MeshStandardMaterial({
      map: vinylTex,
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.25,
    });
    const platterMesh = new THREE.Mesh(platterGeo, platterMat);
    platterMesh.position.y = 0.025;
    platterMesh.receiveShadow = !isSoftwareGl;
    pedestalGroup.add(platterMesh);

    // Glowing Theme Ring
    const neonRingGeo = new THREE.TorusGeometry(1.25, 0.014, 16, 96);
    const neonRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeColorRef.current),
      emissive: new THREE.Color(themeColorRef.current),
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const neonRing = new THREE.Mesh(neonRingGeo, neonRingMat);
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = 0.045;
    pedestalGroup.add(neonRing);

    // Brushed Steel Outer Trim Ring
    const trimRingGeo = new THREE.TorusGeometry(1.37, 0.012, 16, 96);
    const trimRingMat = new THREE.MeshStandardMaterial({
      color: 0x4b5563,
      metalness: 0.9,
      roughness: 0.22,
    });
    const trimRing = new THREE.Mesh(trimRingGeo, trimRingMat);
    trimRing.rotation.x = Math.PI / 2;
    trimRing.position.y = 0.005;
    pedestalGroup.add(trimRing);

    // Radial Audio Spectrum Bars (InstancedMesh - 48 bars)
    const BAR_COUNT = 48;
    const barGeo = new THREE.BoxGeometry(0.028, 1, 0.028);
    barGeo.translate(0, 0.5, 0); // bottom-center pivot
    const barMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeColorRef.current),
      emissive: new THREE.Color(themeColorRef.current),
      emissiveIntensity: 1.1,
      roughness: 0.3,
      metalness: 0.6,
    });
    const spectrumBars = new THREE.InstancedMesh(barGeo, barMat, BAR_COUNT);
    spectrumBars.frustumCulled = false;
    pedestalGroup.add(spectrumBars);

    // 6. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.autoRotate = !isSoftwareGl && !prefersReducedMotion && autoRotateRef.current;
    controls.autoRotateSpeed = 1.4;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.58;
    controls.target.set(initialAnchorX, 0.12, 0);
    controls.update();
    controlsRef.current = controls;

    // 7. Load User's GLB Model
    const modelPivot = new THREE.Group();
    modelPivot.position.set(0, pedestalY + 0.05, 0);
    subjectAnchor.add(modelPivot);

    let mixer: THREE.AnimationMixer | null = null;
    let loadedRoot: THREE.Object3D | null = null;
    let disposed = false;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;

        const root = gltf.scene;
        loadedRoot = root;
        const collectedMeshes: THREE.Mesh[] = [];

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = !isSoftwareGl;
            mesh.receiveShadow = !isSoftwareGl;
            // Apply calibrated physical finish material when mesh has no texture/vertex color
            const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const hasDiffuseMap = origMat && 'map' in origMat && Boolean((origMat as THREE.MeshStandardMaterial).map);
            const hasVertexColor = Boolean(mesh.geometry?.attributes?.color);
            if (!hasDiffuseMap && !hasVertexColor) {
              mesh.material = finishMaterials[finishModeRef.current];
            }
            collectedMeshes.push(mesh);
          }
        });
        loadedMeshesRef.current = collectedMeshes;

        // Ground bottom-center flush onto vinyl platter surface
        root.updateMatrixWorld(true);
        _box.setFromObject(root);
        _box.getSize(_size);
        _box.getCenter(_center);

        const maxDim = Math.max(_size.x, _size.y, _size.z) || 1;
        const targetHeight = 2.28;
        const scale = targetHeight / maxDim;

        root.scale.setScalar(scale);
        root.position.set(
          -_center.x * scale,
          -_box.min.y * scale, // sits flush on platter (y = 0 in modelPivot)
          -_center.z * scale
        );

        modelPivot.add(root);

        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());
        }

        if (!isSoftwareGl) {
          renderer.compile(scene, camera);
        }

        onLoadProgressRef.current?.(100, true, null);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
          onLoadProgressRef.current?.(pct, false, null);
        }
      },
      (error) => {
        console.error('GLB load failed:', error);
        if (!disposed) {
          onLoadProgressRef.current?.(0, false, '3D 커버 모델을 불러오지 못했습니다.');
        }
      }
    );

    // 8. Responsive Layout Resize (ResizeObserver + Window Resize)
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;
      const isDesk = window.innerWidth >= 1024;
      const anchorX = isDesk ? 1.18 : 0;

      subjectAnchor.position.x = anchorX;
      rimLight.position.x = anchorX - 1.6;
      rimLightRight.position.x = anchorX + 2.0;
      controls.target.set(anchorX, 0.12, 0);

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      if (contextLostRef.current) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (mixer) {
        mixer.update(delta);
      }

      // Subtle vinyl platter rotation when auto-rotating
      if (!prefersReducedMotion && autoRotateRef.current) {
        platterMesh.rotation.y += delta * 0.35;
      }

      // Smoothly damp theme color across rim lights, neon ring, and spectrum bars
      _targetColor.set(themeColorRef.current || '#00CD3C');
      const dampFactor = 1 - Math.exp(-6 * delta);
      rimLight.color.lerp(_targetColor, dampFactor);
      rimLightRight.color.lerp(_targetColor, dampFactor);
      neonRingMat.color.lerp(_targetColor, dampFactor);
      neonRingMat.emissive.lerp(_targetColor, dampFactor);
      barMat.color.lerp(_targetColor, dampFactor);
      barMat.emissive.lerp(_targetColor, dampFactor);

      // Animate radial spectrum equalizer bars around pedestal
      const amp = prefersReducedMotion ? 0.08 : isPlayingRef.current ? 0.28 : 0.14;
      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = (i / BAR_COUNT) * Math.PI * 2;
        const radius = 1.54;
        const wave =
          Math.sin(elapsed * 3.6 + i * 0.55) * 0.5 +
          Math.cos(elapsed * 2.1 - i * 0.3) * 0.5;
        const barH = 0.05 + Math.abs(wave) * amp;

        _dummy.position.set(Math.cos(angle) * radius, 0.01, Math.sin(angle) * radius);
        _dummy.rotation.set(0, -angle, 0);
        _dummy.scale.set(1, barH, 1);
        _dummy.updateMatrix();
        spectrumBars.setMatrixAt(i, _dummy.matrix);
      }
      spectrumBars.instanceMatrix.needsUpdate = true;

      controls.autoRotate = !isSoftwareGl && !prefersReducedMotion && autoRotateRef.current;
      controls.update();

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 10. Cleanup
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      dracoLoader.dispose();

      if (loadedRoot) {
        loadedRoot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
          }
        });
      }

      Object.values(finishMaterials).forEach((m) => m.dispose());
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      plinthGeo.dispose();
      plinthMat.dispose();
      platterGeo.dispose();
      platterMat.dispose();
      vinylTex.dispose();
      neonRingGeo.dispose();
      neonRingMat.dispose();
      trimRingGeo.dispose();
      trimRingMat.dispose();
      barGeo.dispose();
      barMat.dispose();
      spectrumBars.dispose();
      envTarget.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      aria-label="멜론 3D 커버 인터랙티브 스테이지"
    />
  );
};

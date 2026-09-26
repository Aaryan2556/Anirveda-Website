import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { latLongToVector3 } from "../../utils/globeMath";
import { HUBS_DATA, GLOBAL_HUBS, CORRIDORS } from "../../data/globeHubs";

export { HUBS_DATA, GLOBAL_HUBS, CORRIDORS };

/**
 * Locked 60-120 FPS WebGL GeoEarthGlobe Component
 * Features expanded invisible hit-target proxy meshes for 3D pillars,
 * click-vs-drag tolerance pipeline (<8px drift, <350ms duration), and hover cursor feedback.
 *
 * @param {Object} props
 * @param {Object} props.activeHub - Currently focused telemetry hub
 * @param {Function} props.onSelectHub - Hub selection click handler
 * @param {boolean} [props.autoRotate=true] - Auto-rotation flag
 */
export default function GeoEarthGlobe({ activeHub, onSelectHub, autoRotate = true }) {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const globeGroupRef = useRef(null);
  const pillarMeshesRef = useRef([]);
  const isInViewRef = useRef(true);

  const GLOBE_RADIUS = 1.35;
  const FIXED_CAM_DISTANCE = 5.0;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, FIXED_CAM_DISTANCE);

    // Optimized WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minDistance = FIXED_CAM_DISTANCE;
    controls.maxDistance = FIXED_CAM_DISTANCE;
    controls.enableRotate = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xd4af37, 0.4, 20);
    pointLight.position.set(-5, -3, -5);
    scene.add(pointLight);

    // 23.5° Master Tilt Group
    const masterTiltedGroup = new THREE.Group();
    masterTiltedGroup.rotation.z = (23.5 * Math.PI) / 180;
    scene.add(masterTiltedGroup);

    const globeGroup = new THREE.Group();
    masterTiltedGroup.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 1. Deep Obsidian Inner Core Sphere
    const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.995, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x05070b });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 2. Gold Atmospheric Halo
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // Defer heavy dot matrix & country vector border generation until idle
    const scheduleDeferredWork = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));

    const idleCallbackId = scheduleDeferredWork(() => {
      // Golden Dot-Matrix Landmasses
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "https://unpkg.com/three-globe@2.31.1/example/img/earth-dark.jpg";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const cWidth = 360;
        const cHeight = 180;
        canvas.width = cWidth;
        canvas.height = cHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cWidth, cHeight);
        const imgData = ctx.getImageData(0, 0, cWidth, cHeight).data;

        const dotGeo = new THREE.CircleGeometry(0.0095, 6);
        const dotMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          side: THREE.DoubleSide,
        });

        const dotPositions = [];
        const dummy = new THREE.Object3D();

        for (let lat = -90; lat <= 90; lat += 1.8) {
          const radiusAtLat = GLOBE_RADIUS * Math.cos((lat * Math.PI) / 180);
          const circum = 2 * Math.PI * radiusAtLat;
          const lonStep = Math.max(1.8, (360 / circum) * 0.045);

          for (let lon = -180; lon <= 180; lon += lonStep) {
            const u = Math.floor(((lon + 180) / 360) * cWidth);
            const v = Math.floor(((90 - lat) / 180) * cHeight);
            const index = (v * cWidth + u) * 4;

            if (imgData[index] > 55) {
              const pos = latLongToVector3(lat, lon, GLOBE_RADIUS);
              dotPositions.push(pos);
            }
          }
        }

        const instancedMesh = new THREE.InstancedMesh(dotGeo, dotMat, dotPositions.length);
        dotPositions.forEach((pos, i) => {
          dummy.position.copy(pos);
          dummy.lookAt(0, 0, 0);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(i, dummy.matrix);
        });
        instancedMesh.instanceMatrix.needsUpdate = true;
        globeGroup.add(instancedMesh);
      };

      // Crisp Golden Country Vector Borders
      fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
        .then((res) => res.json())
        .then((geojson) => {
          const borderMaterial = new THREE.LineBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.45,
            linewidth: 1,
          });

          const borderGroup = new THREE.Group();

          geojson.features.forEach((feature) => {
            const { type, coordinates } = feature.geometry;

            const renderPolygon = (coords) => {
              const points = [];
              coords.forEach(([lon, lat]) => {
                points.push(latLongToVector3(lat, lon, GLOBE_RADIUS + 0.003));
              });
              if (points.length > 1) {
                const geom = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geom, borderMaterial);
                borderGroup.add(line);
              }
            };

            if (type === "Polygon") {
              coordinates.forEach((ring) => renderPolygon(ring));
            } else if (type === "MultiPolygon") {
              coordinates.forEach((poly) => {
                poly.forEach((ring) => renderPolygon(ring));
              });
            }
          });

          globeGroup.add(borderGroup);
        })
        .catch((err) => console.error("Error loading country borders GeoJSON:", err));
    });

    // 3D Vertical Economic Output Pillars + EXPANDED INVISIBLE HIT-TARGET PROXY MESHES
    const pillarMeshes = [];
    HUBS_DATA.forEach((hub) => {
      const pHeight = hub.height;
      const pos = latLongToVector3(hub.lat, hub.lon, GLOBE_RADIUS, pHeight / 2);

      const pillarGroup = new THREE.Group();
      pillarGroup.position.copy(pos);

      const dummy = new THREE.Object3D();
      dummy.position.copy(pos);
      dummy.lookAt(new THREE.Vector3(0, 0, 0));
      dummy.rotateX(Math.PI / 2);
      pillarGroup.rotation.copy(dummy.rotation);

      // Visible Pillar Cylinder Mesh
      const cylGeo = new THREE.CylinderGeometry(0.016, 0.022, pHeight, 16);
      const cylMat = new THREE.MeshStandardMaterial({
        color: hub.color || 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2,
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.userData = { hub, hubData: hub };
      pillarGroup.add(cylMesh);

      // Visible Pillar Cap Sphere Mesh
      const capGeo = new THREE.SphereGeometry(0.026, 12, 12);
      const capMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(0, pHeight / 2 + 0.01, 0);
      capMesh.userData = { hub, hubData: hub };
      pillarGroup.add(capMesh);

      // Expanded Invisible Bounding Hit-Proxy Cylinder Mesh (3x wider, 1.3x taller)
      const hitGeo = new THREE.CylinderGeometry(0.065, 0.075, pHeight * 1.3, 12);
      const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { hub, hubData: hub };
      pillarGroup.add(hitMesh);

      globeGroup.add(pillarGroup);
      pillarMeshes.push(hitMesh, cylMesh, capMesh);
    });
    pillarMeshesRef.current = pillarMeshes;

    // 3D Bezier Data Corridors
    CORRIDORS.forEach((corridor) => {
      const fromHub = HUBS_DATA.find((h) => h.id === corridor.from);
      const toHub = HUBS_DATA.find((h) => h.id === corridor.to);
      if (!fromHub || !toHub) return;

      const start = latLongToVector3(fromHub.lat, fromHub.lon, GLOBE_RADIUS);
      const end = latLongToVector3(toHub.lat, toHub.lon, GLOBE_RADIUS);

      const distance = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const midLength = mid.length();
      mid.normalize().multiplyScalar(midLength + distance * 0.35);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(36);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.5,
        linewidth: 1.5,
      });
      const curveLine = new THREE.Line(curveGeo, curveMat);
      globeGroup.add(curveLine);
    });

    // Raycasting & Click-vs-Drag Tolerance Pipeline
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownInfo = { x: 0, y: 0, time: 0 };

    const handlePointerDown = (e) => {
      pointerDownInfo = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };
    };

    const handlePointerUp = (e) => {
      const dx = Math.abs(e.clientX - pointerDownInfo.x);
      const dy = Math.abs(e.clientY - pointerDownInfo.y);
      const dt = Date.now() - pointerDownInfo.time;

      // Click Tolerance: Drift < 8px and Duration < 350ms
      if (dx < 8 && dy < 8 && dt < 350) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pillarMeshes);

        if (intersects.length > 0) {
          const hitHub =
            intersects[0].object.userData.hub ||
            intersects[0].object.userData.hubData;
          if (hitHub && onSelectHub) {
            onSelectHub(hitHub);
          }
        }
      }
    };

    // Pointer Hover UX Feedback
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pillarMeshes);

      if (intersects.length > 0) {
        container.style.cursor = "pointer";
      } else {
        container.style.cursor = "grab";
      }
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointermove", handlePointerMove);

    // Viewport IntersectionObserver: halts render loop when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isInViewRef.current) return;

      controls.update();
      if (controls.autoRotate && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += 0.0015;
      }
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointermove", handlePointerMove);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (window.cancelIdleCallback && idleCallbackId) {
        window.cancelIdleCallback(idleCallbackId);
      }
      controls.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSelectHub, autoRotate]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }} className="overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />
    </div>
  );
}
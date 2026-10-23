import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CanonicalStructure, Evidence } from '../core/types';

interface TetrahedronViewportProps {
  structure: CanonicalStructure;
  evidence: Evidence | null;
}

export const TetrahedronViewport: React.FC<TetrahedronViewportProps> = ({
  structure,
  evidence
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 3.5, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 0.6);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 3. Grid Helper
    const grid = new THREE.GridHelper(6, 12, 0x1e293b, 0x0f172a);
    grid.position.y = -1.8;
    scene.add(grid);

    // 4. Group for dynamic elements
    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    // Helper: create text sprite for vertex IDs
    const createTextSprite = (text: string, color: string = '#ffffff') => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.6, 0.3, 1.0);
      return sprite;
    };

    // 5. Draw Canonical Tetrahedron
    const vertexMap = new Map<string, THREE.Vector3>();
    structure.vertices.forEach(v => {
      const pos = new THREE.Vector3(v.coords[0], v.coords[1], v.coords[2]);
      vertexMap.set(v.id, pos);

      // Vertex Sphere
      const sphereGeo = new THREE.SphereGeometry(0.12, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.2,
        roughness: 0.3
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      sceneGroup.add(sphere);

      // Label Sprite
      const sprite = createTextSprite(v.id, '#94a3b8');
      sprite.position.copy(pos).add(new THREE.Vector3(0.15, 0.15, 0.15));
      sceneGroup.add(sprite);
    });

    // Edges
    structure.edges.forEach(([idA, idB]) => {
      const posA = vertexMap.get(idA);
      const posB = vertexMap.get(idB);
      if (posA && posB) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([posA, posB]);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x64748b,
          linewidth: 2,
          transparent: true,
          opacity: 0.8
        });
        const line = new THREE.Line(lineGeo, lineMat);
        sceneGroup.add(line);
      }
    });

    // Semi-transparent faces
    const faceGeo = new THREE.BufferGeometry();
    const v0 = vertexMap.get('v0')!;
    const v1 = vertexMap.get('v1')!;
    const v2 = vertexMap.get('v2')!;
    const v3 = vertexMap.get('v3')!;

    const faceVertices = new Float32Array([
      // face 0-1-2
      v0.x, v0.y, v0.z,  v1.x, v1.y, v1.z,  v2.x, v2.y, v2.z,
      // face 0-2-3
      v0.x, v0.y, v0.z,  v2.x, v2.y, v2.z,  v3.x, v3.y, v3.z,
      // face 0-3-1
      v0.x, v0.y, v0.z,  v3.x, v3.y, v3.z,  v1.x, v1.y, v1.z,
      // face 1-3-2
      v1.x, v1.y, v1.z,  v3.x, v3.y, v3.z,  v2.x, v2.y, v2.z,
    ]);
    faceGeo.setAttribute('position', new THREE.BufferAttribute(faceVertices, 3));
    faceGeo.computeVertexNormals();

    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    sceneGroup.add(faceMesh);

    // 6. Draw Rotation Axis: [1, 1, 1]
    const axisStart = new THREE.Vector3(-2.2, -2.2, -2.2);
    const axisEnd = new THREE.Vector3(2.5, 2.5, 2.5);
    const axisGeo = new THREE.BufferGeometry().setFromPoints([axisStart, axisEnd]);
    const axisMat = new THREE.LineDashedMaterial({
      color: 0xf59e0b, // Amber
      dashSize: 0.15,
      gapSize: 0.08,
      linewidth: 2
    });
    const axisLine = new THREE.Line(axisGeo, axisMat);
    axisLine.computeLineDistances();
    sceneGroup.add(axisLine);

    // Axis Direction Arrow / Cone
    const arrowDir = new THREE.Vector3(1, 1, 1).normalize();
    const arrowHeadGeo = new THREE.ConeGeometry(0.1, 0.25, 16);
    const arrowHeadMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const arrowCone = new THREE.Mesh(arrowHeadGeo, arrowHeadMat);
    arrowCone.position.copy(axisEnd);
    arrowCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDir);
    sceneGroup.add(arrowCone);

    // Axis Label
    const axisLabel = createTextSprite('[1, 1, 1]', '#f59e0b');
    axisLabel.position.copy(axisEnd).add(new THREE.Vector3(0.2, 0.2, 0.2));
    sceneGroup.add(axisLabel);

    // 7. Render Evidence Overlay (Transformed Vertices / Ghost Points)
    if (evidence) {
      const isVerified = evidence.verdict === 'VERIFIED';
      const ghostColor = isVerified ? 0x10b981 : 0xef4444; // Emerald vs Red
      const ghostColorHex = isVerified ? '#10b981' : '#ef4444';

      evidence.transformed_state.forEach((tv, idx) => {
        const tPos = new THREE.Vector3(tv.coords[0], tv.coords[1], tv.coords[2]);

        // Ghost Point Sphere
        const ghostGeo = new THREE.SphereGeometry(0.14, 24, 24);
        const ghostMat = new THREE.MeshStandardMaterial({
          color: ghostColor,
          transparent: true,
          opacity: 0.65,
          emissive: ghostColor,
          emissiveIntensity: 0.3
        });
        const ghostSphere = new THREE.Mesh(ghostGeo, ghostMat);
        ghostSphere.position.copy(tPos);
        sceneGroup.add(ghostSphere);

        // Ghost Label
        const ghostLabel = createTextSprite(`t${idx}`, ghostColorHex);
        ghostLabel.position.copy(tPos).add(new THREE.Vector3(-0.15, -0.15, 0.15));
        sceneGroup.add(ghostLabel);
      });

      // Residual Delta Lines (linking transformed vertex to its matched target canonical vertex)
      evidence.correspondence.forEach(c => {
        const transPos = new THREE.Vector3(c.transformedCoords[0], c.transformedCoords[1], c.transformedCoords[2]);
        const targetPos = c.targetCoords
          ? new THREE.Vector3(c.targetCoords[0], c.targetCoords[1], c.targetCoords[2])
          : new THREE.Vector3(c.originCoords[0], c.originCoords[1], c.originCoords[2]);

        if (c.delta > 0.001) {
          const deltaLineGeo = new THREE.BufferGeometry().setFromPoints([targetPos, transPos]);
          const deltaLineMat = new THREE.LineDashedMaterial({
            color: 0xef4444,
            dashSize: 0.08,
            gapSize: 0.05
          });
          const deltaLine = new THREE.Line(deltaLineGeo, deltaLineMat);
          deltaLine.computeLineDistances();
          sceneGroup.add(deltaLine);
        }
      });
    }

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handling
    let resizeRaf: number | null = null;
    const handleResize = () => {
      if (resizeRaf !== null) {
        cancelAnimationFrame(resizeRaf);
      }
      resizeRaf = requestAnimationFrame(() => {
        if (!container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        if (newWidth === 0 || newHeight === 0) return;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight, false);
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeRaf !== null) {
        cancelAnimationFrame(resizeRaf);
      }
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [structure, evidence]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 bg-[#060913]">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* 3D Viewport CAD Legend */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-2.5 rounded-lg border border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <span className="text-slate-300">Canonical Vertices (v0..v3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-0.5 bg-amber-500" />
          <span className="text-amber-400">Rotation Axis [1, 1, 1]</span>
        </div>
        {evidence && (
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${evidence.verdict === 'VERIFIED' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={evidence.verdict === 'VERIFIED' ? 'text-emerald-400' : 'text-red-400'}>
              Transformed State ({evidence.verdict})
            </span>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-4 pointer-events-none text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        CAD 3D Proj • Orbit / Pan / Zoom
      </div>
    </div>
  );
};

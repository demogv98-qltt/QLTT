// Light blueprint studio: pale ground with a metric grid, soft shadows, a neutral environment for the metals.
// frame(cam) draws one frame. Quality tiers trade pixel ratio and shadow size, not the picture.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export const BG = '#e9eff3';
const D2R = Math.PI / 180;

const GROUND_VERT = /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// metric grid: 0.1 m fine lines, 1 m bold lines, fading into the background
const GROUND_FRAG = /* glsl */ `uniform vec3 uBg; uniform vec3 uLine; varying vec3 vW;
  float line(float v, float w){ float d = abs(fract(v - 0.5) - 0.5); return 1.0 - smoothstep(0.0, w, d); }
  void main(){
    vec2 p = vW.xz;
    float fine = max(line(p.x * 10.0, 0.035 * 10.0 * 0.5), line(p.y * 10.0, 0.035 * 10.0 * 0.5));
    float bold = max(line(p.x, 0.012), line(p.y, 0.012));
    float d = length(p);
    float fade = 1.0 - smoothstep(2.5, 9.0, d);
    float a = (0.16 * fine + 0.55 * bold) * fade;
    vec3 col = mix(uBg * 0.985, uLine, a);
    gl_FragColor = vec4(mix(col, uBg, smoothstep(6.0, 14.0, d)), 1.0);
  }`;

export function createStage(canvas, W, H) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const camera = new THREE.PerspectiveCamera(28, W / H, 0.05, 80);

  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd9e0, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.9);
  sun.position.set(-2.4, 5, 3.2);
  sun.castShadow = true;
  sun.shadow.camera.left = -2.4;
  sun.shadow.camera.right = 2.4;
  sun.shadow.camera.top = 2.4;
  sun.shadow.camera.bottom = -2.4;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 12;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdbeaff, 0.5);
  fill.position.set(3, 2, 2);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, uniforms: {uBg: {value: new THREE.Color(BG)}, uLine: {value: new THREE.Color('#2b8a99')}}}),
  );
  scene.add(ground);
  const shade = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({color: 0x2a4a5a, opacity: 0.22, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}),
  );
  shade.position.y = 0.002;
  shade.receiveShadow = true;
  scene.add(shade);

  const v = new THREE.Vector3();
  const st = {
    THREE, renderer, scene, camera, sun, W, H, pr: 1,
    setQuality({pr, shadow}) {
      st.pr = pr;
      renderer.setPixelRatio(pr);
      renderer.setSize(W, H, false);
      if (sun.shadow.mapSize.x !== shadow) {
        sun.shadow.mapSize.set(shadow, shadow);
        sun.shadow.map?.dispose();
        sun.shadow.map = null;
      }
    },
    /** cam: {az, el (radians), d, tx, ty, tz} */
    frame(cam) {
      const ce = Math.cos(cam.el);
      camera.position.set(cam.tx + cam.d * ce * Math.sin(cam.az), cam.ty + cam.d * Math.sin(cam.el), cam.tz + cam.d * ce * Math.cos(cam.az));
      camera.lookAt(cam.tx, cam.ty, cam.tz);
      camera.updateMatrixWorld(true);
      renderer.render(scene, camera);
    },
    /** world point → stage px (1600×900 CSS space), plus whether it is in front of the camera */
    project(p) {
      v.copy(p).project(camera);
      return {x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, visible: v.z < 1};
    },
  };
  void D2R;
  return st;
}

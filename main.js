let scene, camera, renderer, controls;
let marker = null;
let labels = [];   // store all labels so we can rotate them

//LABELS
function makeLabel(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.font = "64px Arial";
  const padding = 40;
  const textWidth = ctx.measureText(text).width;

  canvas.width = textWidth + padding;
  canvas.height = 128;

  ctx.font = "64px Arial";
  ctx.fillStyle = "white";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padding / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);

  sprite.scale.set(1,1,1);

  return sprite;
}

function init() {

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1000,
    1e9
  );
  camera.position.set(0, -4e7, 2e7);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  // LIGHT (Sun)
  const sunLight = new THREE.PointLight(0xffffff, 5, 0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Load data.json
  fetch("data/zones.json")
    .then(r => r.json())
    .then(data => {

      console.log("data JSON:", data);

      // ---- ZONES ----
      data.zones.forEach(z => {
        const geo = new THREE.SphereGeometry(z.radius, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ 
          color: "white", 
          transparent: true, 
          opacity: 0.1,
          depthTest: false
        });
              
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(z.x, z.y, z.z);
        scene.add(mesh);

        // ---- LABEL ----
        const label = makeLabel(z.name);
        label.position.set(
          z.x,
          z.y + z.radius + (z.radius * 0.3),
          z.z
        );
        scene.add(label);
        labels.push(label);
      });

      // ---- TORUS BELT ----
      function makeTorus(major, minor) {
        const geom = new THREE.TorusGeometry(
          major,
          minor,
          32,
          128
        );

        const mat = new THREE.MeshBasicMaterial({
          color: "white",
          wireframe: false,
          transparent: true,
          opacity: 0.1
        });

        const torus = new THREE.Mesh(geom, mat);
        torus.rotation.x = Math.PI / 2;
        return torus;
      }

      data.belt.forEach(b => {
        const torus = makeTorus(b.major, b.minor);
        scene.add(torus);
      });

    })
    .catch(err => console.error("JSON load error:", err));

  // SOL
  fetch("data/sol.json")
    .then(r => r.json())
    .then(s => {
      const geo = new THREE.SphereGeometry(s.radius, 32, 32);
      const mat = new THREE.MeshBasicMaterial({ color: s.color });
      const sol = new THREE.Mesh(geo, mat);
      sol.position.set(s.x, s.y, s.z);
      scene.add(sol);
    });

  // EARTH
  fetch("data/earth.json")
    .then(r => r.json())
    .then(e => {
      const geo = new THREE.SphereGeometry(e.radius, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color: e.color });
      const earth = new THREE.Mesh(geo, mat);
      earth.position.set(e.x, e.y, e.z);
      scene.add(earth);
    });

  // MARS
  fetch("data/mars.json")
    .then(r => r.json())
    .then(m => {
      const geo = new THREE.SphereGeometry(m.radius, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color: m.color });
      const mars = new THREE.Mesh(geo, mat);
      mars.position.set(m.x, m.y, m.z);
      scene.add(mars);
    });

  // GPS Plot Button
  document.getElementById("plotBtn").onclick = () => {
    const text = document.getElementById("gpsInput").value;
    const coords = parseGPS(text);

    if (!coords) {
      document.getElementById("status").innerText = "Invalid GPS";
      return;
    }

    const [x, y, z] = coords;

    if (marker) scene.remove(marker);

    const geom = new THREE.SphereGeometry(100000, 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color: "lime" });
    marker = new THREE.Mesh(geom, mat);
    marker.position.set(x, y, z);
    scene.add(marker);

    controls.target.set(x, y, z);
    controls.update();
  };

  animate();
}

// ---- GPS PARSER ----
function parseGPS(text) {
  try {
    const parts = text.split(":");
    const x = parseFloat(parts[2]);
    const y = parseFloat(parts[3]);
    const z = parseFloat(parts[4]);
    if (isNaN(x) || isNaN(y) || isNaN(z)) return null;
    return [x, y, z];
  } catch {
    return null;
  }
}

// ---- ANIMATION LOOP ----
function animate() {
  requestAnimationFrame(animate);

  controls.update();

  const camQuat = camera.quaternion;

  labels.forEach(label => {
    // Always face the camera
    label.quaternion.copy(camQuat);

    // ---- CONSTANT SCREEN SIZE ----
    const desiredSize = 100; // pixels on screen

    const dist = camera.position.distanceTo(label.position);
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFOV / 2) * dist;

    const worldPixelRatio = height / window.innerHeight;
    const worldSize = desiredSize * worldPixelRatio;

    label.scale.set(worldSize, worldSize * 0.5, 1);
  });

  renderer.render(scene, camera);
}

window.onload = init;


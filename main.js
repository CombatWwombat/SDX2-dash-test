let scene, camera, renderer, controls;
let marker = null;

async function init() {
  const universe = await fetch("universe.json").then(r => r.json());

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1e9
  );
  camera.position.set(0, -4e7, 2e7);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // Planets
  universe.planets.forEach(p => {
    const geom = new THREE.SphereGeometry(p.radius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: p.color });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(p.x, p.y, p.z);
    scene.add(mesh);

    const label = makeLabel(p.name);
    label.position.set(p.x, p.y + p.radius * 1.2, p.z);
    scene.add(label);
  });

  // Belt
  universe.belts.forEach(b => {
    const geom = new THREE.TorusGeometry(b.major, b.minor, 16, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25
    });
    const torus = new THREE.Mesh(geom, mat);
    torus.rotation.x = Math.PI / 2;
    scene.add(torus);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function makeLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2e6, 2e6, 1);
  return sprite;
}

// GPS input
document.getElementById("plotBtn").onclick = () => {
  const text = document.getElementById("gpsInput").value;
  const coords = parseGPS(text);

  if (!coords) {
    document.getElementById("status").innerText = "Invalid GPS";
    return;
  }

  const [x, y, z] = coords;

  if (marker) scene.remove(marker);

  const geom = new THREE.SphereGeometry(300000, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ color: "lime" });
  marker = new THREE.Mesh(geom, mat);
  marker.position.set(x, y, z);
  scene.add(marker);

  controls.target.set(x, y, z);

  document.getElementById("status").innerText =
    `Plotted at (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`;
};

function parseGPS(text) {
  text = text.replace(/[,:\n]/g, " ");
  const nums = text.split(" ").filter(n => !isNaN(parseFloat(n)));
  if (nums.length < 3) return null;
  return nums.slice(0, 3).map(Number);
}

init();

let scene, camera, renderer, controls;
let marker = null;

function init() {

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1e9
  );
  camera.position.set(0, -4e7, 2e7);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  // Load universe.json
  fetch("universe.json")
    .then(r => r.json())
    .then(data => {

      console.log("Universe JSON:", data);

      // ---- PLANETS ----
      data.planets.forEach(p => {
        const geom = new THREE.SphereGeometry(p.radius, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: p.color });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(p.x, p.y, p.z);
        scene.add(mesh);
      });

      // ---- BELT ----
      data.belt.forEach(b => {
        const beltGeom = new THREE.RingGeometry(b.major, b.minor, 128);
        const beltMat = new THREE.MeshBasicMaterial({
          color: "gray",
          side: THREE.DoubleSide
        });
        const beltMesh = new THREE.Mesh(beltGeom, beltMat);
        beltMesh.rotation.x = Math.PI / 2;
        scene.add(beltMesh);
      });

    })
    .catch(err => console.error("JSON load error:", err));

  // GPS Plot Button
  document.getElementById("plotBtn").onclick = () => {
    const text = document.getElementById("gpsInput").value;
    const coords = parseGPS(text);

    if (!coords) {
      document.getElementById("status").innerText = "Invalid GPS format";
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
    controls.update();
  };

  animate();
}

// ---- GPS PARSER ----
// Accepts Space Engineers GPS format:
// GPS:Name:X:Y:Z:
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
  renderer.render(scene, camera);
}

// ---- START ----
window.onload = init;

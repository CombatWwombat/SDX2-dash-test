let scene, camera, renderer, controls;
let marker = null;

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
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  // LIGHT (required for MeshStandardMaterial)
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(1, 1, 1);
  scene.add(light);

  // Load data.json
  fetch("data.json")
    .then(r => r.json())
    .then(data => {

      console.log("data JSON:", data);

      // ---- PLANETS ----
      data.planets.forEach(p => {
        const geo = new THREE.SphereGeometry(p.radius, 32, 32);
        
        const mat = new THREE.MeshBasicMaterial({ 
          color: p.color, 
          transparent: true, 
          opacity: 0.5,
          depthwrite: false                                 
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(p.x, p.y, p.z);
        scene.add(mesh);
      });

      // ---- TORUS BELT ----
      function makeTorus(major, minor, color="gray") {
        const geom = new THREE.TorusGeometry(
          major,
          minor,
          32,
          128
        );

        const mat = new THREE.MeshBasicMaterial({
          color,
          wireframe: false
          transparent: true,
          opacity: 0.5
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

window.onload = init;

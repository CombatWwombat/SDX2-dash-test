let scene, camera, renderer, controls;
let marker = null;

function makeLabel(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.font = "48px Arial";
  const padding = 40;
  const textWidth = ctx.measureText(text).width;

  canvas.width = textWidth + padding;
  canvas.height = 96;

  ctx.font = "48px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(text, padding / 2, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

  const sprite = new THREE.Sprite(material);

  // scale down so it fits your huge coordinate system
  sprite.scale.set(canvas.width * 1000, canvas.height * 1000, 1);

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

  // LIGHT (required for MeshStandardMaterial)
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(1, 1, 1);
  scene.add(light);

  // Load data.json
  fetch("data/zones.json")
    .then(r => r.json())
    .then(data => {

      console.log("data JSON:", data);

      // ---- ZONES ----
     data.zones.forEach(z => {
      const geo = new THREE.SphereGeometry(z.radius, 32, 32);
      const mat = new THREE.MeshBasicMaterial({ 
        color: z.color, 
        transparent: true, 
        opacity: 0.5,
        depthTest: false
      });
            
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(z.x, z.y, z.z);
      scene.add(mesh);
    
      // ---- LABEL ----
      const label = makeLabel(z.name);
      label.position.set(
        z.x,
        z.y + z.radius + 300000,   // offset above the sphere
        z.z
      );
      scene.add(label);
    });

      // ---- TORUS BELT ----
      function makeTorus(major, minor, color="white") {
        const geom = new THREE.TorusGeometry(
          major,
          minor,
          32,
          128
        );

        const mat = new THREE.MeshBasicMaterial({
          color,
          wireframe: false,
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

    //SOL
    fetch("data/sol.json")
      .then(r => r.json())
      .then(s => {
        const geo = new THREE.SphereGeometry(s.radius, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: s.color });
        const sol = new THREE.Mesh(geo, mat);
        sol.position.set(s.x, s.y, s.z);
        scene.add(sol);
      });
  

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

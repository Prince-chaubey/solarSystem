
        try {
            // Check WebGL support
            if (!WebGLRenderingContext) {
                throw new Error("WebGL not supported in your browser");
            }

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            // created WebGL renderer
            let renderer;
            try {
                renderer = new THREE.WebGLRenderer({ antialias: true });
            } catch (e) {
                document.getElementById('error').textContent = "WebGL failed to initialize: " + e.message;
                document.getElementById('error').style.display = 'block';
                throw e;
            }
            
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0x333333);
            scene.add(ambientLight);

            const sunLight = new THREE.PointLight(0xffffff, 1.5, 100);
            scene.add(sunLight);

            // Camera position
            camera.position.set(-50, 90, 150);

            // Orbit controls for camera
            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // Planets with their properties
            const planetsData = [
                { name: "Mercury", color: 0x8B8B8B, size: 2.5, distance: 10, orbitSpeed: 0.04, rotationSpeed: 0.004 },
                { name: "Venus", color: 0xE6C229, size: 3.0, distance: 15, orbitSpeed: 0.015, rotationSpeed: 0.002 },
                { name: "Earth", color: 0x6B93D6, size: 3.2, distance: 20, orbitSpeed: 0.01, rotationSpeed: 0.02 },
                { name: "Mars", color: 0x993D00, size: 2.8, distance: 25, orbitSpeed: 0.008, rotationSpeed: 0.018 },
                { name: "Jupiter", color: 0xB07F35, size: 5.0, distance: 35, orbitSpeed: 0.002, rotationSpeed: 0.04 },
                { name: "Saturn", color: 0xDCD0A1, size: 4.5, distance: 45, orbitSpeed: 0.0009, rotationSpeed: 0.038, hasRing: true },
                { name: "Uranus", color: 0xC1E3E3, size: 3.8, distance: 55, orbitSpeed: 0.0004, rotationSpeed: 0.03, hasRing: true },
                { name: "Neptune", color: 0x5B5DDF, size: 3.7, distance: 65, orbitSpeed: 0.0001, rotationSpeed: 0.032 }
            ];

            // Created the Sun 
            const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
            const sunMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFFF00,
                emissive: 0xFFFF00,
                emissiveIntensity: 1
            });
            const sun = new THREE.Mesh(sunGeometry, sunMaterial);
            scene.add(sun);
            sunLight.position.set(0, 0, 0);

            // Added stars background
            const starsGeometry = new THREE.BufferGeometry();
            const starsMaterial = new THREE.PointsMaterial({
                color: 0xFFFFFF,
                size: 0.1,
                transparent: true
            });

            const starsVertices = [];
            for (let i = 0; i < 2000; i++) {
                const x = (Math.random() - 0.5) * 2000;
                const y = (Math.random() - 0.5) * 2000;
                const z = (Math.random() - 0.5) * 2000;
                starsVertices.push(x, y, z);
            }

            starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
            const stars = new THREE.Points(starsGeometry, starsMaterial);
            scene.add(stars);

            // Created planets with orbit paths
            const planets = [];
            const orbitPaths = [];

            function createPlanet(planetData) {
                const geometry = new THREE.SphereGeometry(planetData.size, 32, 32);
                const material = new THREE.MeshPhongMaterial({ 
                    color: planetData.color,
                    shininess: 10
                });
                const planetMesh = new THREE.Mesh(geometry, material);
                
                const planetGroup = new THREE.Group();
                planetGroup.add(planetMesh);
                planetMesh.position.x = planetData.distance;
                
                
                if (planetData.hasRing) {
                    const ringGeometry = new THREE.RingGeometry(
                        planetData.size * 1.4, 
                        planetData.size * 2.0, 
                        32
                    );
                    const ringMaterial = new THREE.MeshPhongMaterial({
                        color: 0xDCD0A1,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.8
                    });
                    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                    ring.rotation.x = Math.PI / 2;
                    planetGroup.add(ring);
                }
                
                scene.add(planetGroup);
                
                // Created orbit path
                const orbitGeometry = new THREE.BufferGeometry();
                const orbitMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x333333,
                    transparent: true,
                    opacity: 0.5
                });
                
                const points = [];
                for (let i = 0; i <= 64; i++) {
                    const angle = (i / 64) * Math.PI * 2;
                    points.push(
                        Math.cos(angle) * planetData.distance,
                        0,
                        Math.sin(angle) * planetData.distance
                    );
                }
                
                orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
                const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
                scene.add(orbit);
                orbitPaths.push(orbit);
                
                return {
                    group: planetGroup,
                    mesh: planetMesh,
                    orbitSpeed: planetData.orbitSpeed,
                    rotationSpeed: planetData.rotationSpeed,
                    name: planetData.name
                };
            }

            // Initialized all planets
            planetsData.forEach(data => {
                planets.push(createPlanet(data));
            });

            // Created controls UI
            const planetControlsDiv = document.getElementById('planetControls');
            const speedSliders = [];
            
            planets.forEach((planet, index) => {
                const controlDiv = document.createElement('div');
                controlDiv.className = 'planet-control';
                
                const label = document.createElement('label');
                label.textContent = planet.name;
                label.htmlFor = `speed-${index}`;
                
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = '0';
                slider.max = '200';
                slider.value = (planet.orbitSpeed * 1000).toFixed(0);
                slider.id = `speed-${index}`;
                
                const speedValue = document.createElement('span');
                speedValue.textContent = (planet.orbitSpeed * 100).toFixed(1);
                
                slider.addEventListener('input', () => {
                    const newSpeed = parseInt(slider.value) / 1000;
                    planet.orbitSpeed = newSpeed;
                    speedValue.textContent = (newSpeed * 100).toFixed(1);
                });
                
                controlDiv.appendChild(label);
                controlDiv.appendChild(slider);
                controlDiv.appendChild(speedValue);
                planetControlsDiv.appendChild(controlDiv);
                
                speedSliders.push({
                    slider: slider,
                    valueDisplay: speedValue
                });
            });

            // created Pause/resume functionality
            let isPaused = false;
            document.getElementById('pauseBtn').addEventListener('click', () => {
                isPaused = !isPaused;
                document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
            });

            // created Reset speeds
            document.getElementById('resetBtn').addEventListener('click', () => {
                planets.forEach((planet, index) => {
                    const originalSpeed = planetsData[index].orbitSpeed;
                    planet.orbitSpeed = originalSpeed;
                    speedSliders[index].slider.value = (originalSpeed * 1000).toFixed(0);
                    speedSliders[index].valueDisplay.textContent = (originalSpeed * 100).toFixed(1);
                });
            });

            // created Hide loading indicator
            document.getElementById('loading').style.display = 'none';

            // Added Animation loop
            const animate = () => {
                requestAnimationFrame(animate);
                
                if (!isPaused) {
                    // Rotate planets around the sun
                    planets.forEach(planet => {
                        planet.group.rotation.y += planet.orbitSpeed;
                        planet.mesh.rotation.y += planet.rotationSpeed;
                    });
                    
                    // Rotated the sun
                    sun.rotation.y += 0.001;
                }
                
                controls.update();
                renderer.render(scene, camera);
            };

            // Handled window resize
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            animate();
        } catch (error) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').textContent = "Error: " + error.message;
            document.getElementById('error').style.display = 'block';
            console.error(error);
        }
    
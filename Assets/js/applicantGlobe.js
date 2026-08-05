import { loadDatabase } from './dataService.js';
import { createApplicantGlobeData, countApplicantLocations } from './applicantGlobeData.js';

const EARTH_TEXTURES = {
  color: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
  night: 'https://threejs.org/examples/textures/planets/earth_lights_2048.png'
};
const GLOBE_RADIUS = 100;
const ROTATION_RESUME_DELAY = 3200;
let activeGlobe = null;

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

function showFallback(root, message) {
  root.querySelector('[data-globe-loading]').hidden = true;
  const fallback = root.querySelector('[data-globe-fallback]');
  fallback.querySelector('p').textContent = message;
  fallback.hidden = false;
}

function createGlowTexture(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(135,246,239,.85)');
  gradient.addColorStop(.22, 'rgba(74,207,225,.42)');
  gradient.addColorStop(1, 'rgba(74,207,225,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function latLngToVector3(THREE, lat, lng, altitude = 0) {
  const radius = GLOBE_RADIUS * (1 + altitude);
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createAtmosphere(THREE) {
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.075, 48, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x69dce8) },
      glowStrength: { value: .58 }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      uniform vec3 glowColor;
      uniform float glowStrength;
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDirection)), 2.35);
        gl_FragColor = vec4(glowColor, fresnel * glowStrength);
      }
    `
  });
  return new THREE.Mesh(geometry, material);
}

function openApplicantDetails(applicantId) {
  if (typeof globalThis.openApplicant === 'function') {
    globalThis.openApplicant(applicantId);
    return;
  }
  // Standalone mock fallback; does not define or replace the host function.
  location.href = `../Applicants/applicant-details.html?id=${encodeURIComponent(applicantId)}`;
}

async function mountGlobe(root, points) {
  if (!supportsWebGL()) {
    showFallback(root, '3D view is unavailable in this browser.');
    return null;
  }

  const [THREE, { OrbitControls }] = await Promise.all([
    import('three'),
    import('three/addons/controls/OrbitControls.js')
  ]);

  const host = root.querySelector('#applicant-globe');
  const tooltip = root.querySelector('[data-globe-tooltip]');
  const nameField = tooltip.querySelector('[data-tooltip-name]');
  const cityField = tooltip.querySelector('[data-tooltip-city]');
  const statusField = tooltip.querySelector('[data-tooltip-status]');
  const openButton = tooltip.querySelector('[data-tooltip-open]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 1600);
  camera.position.set(0, 0, 335);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  const pixelRatioLimit = matchMedia('(max-width: 760px)').matches ? 1.2 : 1.5;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelRatioLimit));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.08;
  host.appendChild(renderer.domElement);

  const textureLoader = new THREE.TextureLoader();
  const [earthMap, nightMap] = await Promise.all([
    textureLoader.loadAsync(EARTH_TEXTURES.color),
    textureLoader.loadAsync(EARTH_TEXTURES.night)
  ]);
  earthMap.colorSpace = THREE.SRGBColorSpace;
  nightMap.colorSpace = THREE.SRGBColorSpace;
  earthMap.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 40);
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthMap,
    color: new THREE.Color(0xffffff),
    specular: new THREE.Color(0x3f7891),
    shininess: 9
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);
  const nightMaterial = new THREE.MeshPhongMaterial({
    map: nightMap,
    emissiveMap: nightMap,
    emissive: new THREE.Color(0xd49a50),
    emissiveIntensity: 1.15,
    color: new THREE.Color(0x24364b),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    shininess: 4
  });
  const nightEarth = new THREE.Mesh(earthGeometry, nightMaterial);
  nightEarth.scale.setScalar(1.0005);
  scene.add(nightEarth);
  const atmosphere = createAtmosphere(THREE);
  scene.add(atmosphere);

  const hemisphereLight = new THREE.HemisphereLight(0xc8f5ff, 0x07121d, 1.7);
  scene.add(hemisphereLight);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.45);
  keyLight.position.set(-120, 80, 180);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x5ecde6, 1.15);
  rimLight.position.set(150, -60, -100);
  scene.add(rimLight);

  // A lightweight native star field that is revealed only by the dark theme.
  const starCount = 240;
  const starPositions = new Float32Array(starCount * 3);
  let seed = 24681357;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  for (let index = 0; index < starCount; index += 1) {
    const radius = 470 + random() * 210;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[index * 3 + 1] = radius * Math.cos(phi);
    starPositions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xc7edff,
    size: 1.1,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {
    enableDamping: true,
    dampingFactor: .065,
    enablePan: false,
    minDistance: 220,
    maxDistance: 460,
    rotateSpeed: .55,
    zoomSpeed: .72,
    autoRotate: !reducedMotion,
    autoRotateSpeed: .42
  });

  // A classic pin silhouette: spherical head over an inverted tapered tail.
  const pinHeadGeometry = new THREE.SphereGeometry(2.15, 10, 8);
  pinHeadGeometry.translate(0, 4.25, 0);
  const pinTailGeometry = new THREE.ConeGeometry(1.62, 4.2, 10);
  pinTailGeometry.rotateX(Math.PI);
  pinTailGeometry.translate(0, 2.1, 0);
  const rimHeadGeometry = pinHeadGeometry.clone().scale(1.14, 1.14, 1.14);
  const rimTailGeometry = pinTailGeometry.clone().scale(1.14, 1.08, 1.14);
  const pinMaterial = new THREE.MeshPhongMaterial({
    color: 0x62d8e4,
    emissive: 0x0c718b,
    emissiveIntensity: .28,
    specular: 0xd8ffff,
    shininess: 55
  });
  const rimMaterial = new THREE.MeshBasicMaterial({ color: 0xf2feff });
  const makeInstances = (geometry, material) => {
    const mesh = new THREE.InstancedMesh(geometry, material, points.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    return mesh;
  };
  const pinHead = makeInstances(pinHeadGeometry, pinMaterial);
  const pinTail = makeInstances(pinTailGeometry, pinMaterial);
  const rimHead = makeInstances(rimHeadGeometry, rimMaterial);
  const rimTail = makeInstances(rimTailGeometry, rimMaterial);
  rimHead.renderOrder = rimTail.renderOrder = 1;
  pinHead.renderOrder = pinTail.renderOrder = 2;
  const pinMeshes = [pinHead, pinTail, rimHead, rimTail];
  const hitTargets = [pinHead, pinTail];

  const glowTexture = createGlowTexture(THREE);
  const glowMaterial = new THREE.PointsMaterial({
    map: glowTexture,
    color: 0x68e4eb,
    size: 10,
    sizeAttenuation: true,
    transparent: true,
    opacity: .25,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const markerPositions = points.map(point =>
    latLngToVector3(THREE, point.lat, point.lng, .018)
  );
  const glowPositions = new Float32Array(points.length * 3);
  markerPositions.forEach((position, index) => {
    const glowPosition = position.clone().multiplyScalar(1.032);
    glowPosition.toArray(glowPositions, index * 3);
  });
  const glowGeometry = new THREE.BufferGeometry();
  glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
  const glowPoints = new THREE.Points(glowGeometry, glowMaterial);
  glowPoints.frustumCulled = false;
  scene.add(glowPoints);

  const themeColors = {
    lightPin: new THREE.Color(0xf7fdff),
    darkPin: new THREE.Color(0x42e1f2),
    lightEmissive: new THREE.Color(0x8bcfe3),
    darkEmissive: new THREE.Color(0x00a8d4),
    lightRim: new THREE.Color(0x277da9),
    darkRim: new THREE.Color(0xf2feff),
    lightGlow: new THREE.Color(0x65dce8),
    darkGlow: new THREE.Color(0x28d9ff),
    lightAtmosphere: new THREE.Color(0x72dce7),
    darkAtmosphere: new THREE.Color(0x247cd9),
    lightEarth: new THREE.Color(0xf4fff5),
    darkEarth: new THREE.Color(0x557287),
    lightSky: new THREE.Color(0xd9f8ff),
    darkSky: new THREE.Color(0x16354f),
    lightGround: new THREE.Color(0x2b6c73),
    darkGround: new THREE.Color(0x03070e)
  };
  let themeMix = document.documentElement.classList.contains('dark') ? 1 : 0;
  let themeFrom = themeMix;
  let themeTarget = themeMix;
  let themeChangeStarted = performance.now() - 400;
  let themeDirty = true;
  const onThemeChanged = event => {
    const nextTarget = typeof event.detail?.isDark === 'boolean'
      ? Number(event.detail.isDark)
      : Number(document.documentElement.classList.contains('dark'));
    if (nextTarget === themeTarget) return;
    themeFrom = themeMix;
    themeTarget = nextTarget;
    themeChangeStarted = performance.now();
    themeDirty = true;
    requestFrame();
  };
  document.addEventListener('themeChanged', onThemeChanged);

  function updateTheme(now) {
    if (!themeDirty) return;
    const progress = Math.min(1, (now - themeChangeStarted) / 400);
    const eased = progress * progress * (3 - 2 * progress);
    themeMix = THREE.MathUtils.lerp(themeFrom, themeTarget, eased);
    nightMaterial.opacity = themeMix;
    starMaterial.opacity = THREE.MathUtils.lerp(0, .72, themeMix);
    nightEarth.visible = themeMix > .001;
    stars.visible = themeMix > .001;
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.12, .86, themeMix);
    hemisphereLight.intensity = THREE.MathUtils.lerp(2.05, .72, themeMix);
    hemisphereLight.color.copy(themeColors.lightSky).lerp(themeColors.darkSky, themeMix);
    hemisphereLight.groundColor.copy(themeColors.lightGround).lerp(themeColors.darkGround, themeMix);
    keyLight.intensity = THREE.MathUtils.lerp(2.8, 1.28, themeMix);
    rimLight.intensity = THREE.MathUtils.lerp(.72, 1.65, themeMix);
    earthMaterial.color.copy(themeColors.lightEarth).lerp(themeColors.darkEarth, themeMix);
    pinMaterial.color.copy(themeColors.lightPin).lerp(themeColors.darkPin, themeMix);
    pinMaterial.emissive.copy(themeColors.lightEmissive).lerp(themeColors.darkEmissive, themeMix);
    pinMaterial.emissiveIntensity = THREE.MathUtils.lerp(.1, .62, themeMix);
    rimMaterial.color.copy(themeColors.lightRim).lerp(themeColors.darkRim, themeMix);
    glowMaterial.color.copy(themeColors.lightGlow).lerp(themeColors.darkGlow, themeMix);
    atmosphere.material.uniforms.glowColor.value
      .copy(themeColors.lightAtmosphere).lerp(themeColors.darkAtmosphere, themeMix);
    atmosphere.material.uniforms.glowStrength.value = THREE.MathUtils.lerp(.52, .82, themeMix);
    if (progress === 1) themeDirty = false;
  }

  const transform = new THREE.Object3D();
  const upAxis = new THREE.Vector3(0, 1, 0);
  const markerNormals = markerPositions.map(position => position.clone().normalize());
  const markerOrientations = markerNormals.map(normal =>
    new THREE.Quaternion().setFromUnitVectors(upAxis, normal)
  );
  function updateMarkers(elapsed = 0, activeIndex = -1) {
    markerPositions.forEach((position, index) => {
      const floatAmount = reducedMotion ? 0 : (Math.sin(elapsed * 1.25 + index * .73) + 1) * .18;
      const scale = index === activeIndex ? 1.13 : 1;
      transform.position.copy(position).addScaledVector(markerNormals[index], floatAmount);
      transform.quaternion.copy(markerOrientations[index]);
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      pinMeshes.forEach(mesh => mesh.setMatrixAt(index, transform.matrix));
    });
    pinMeshes.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
  }
  updateMarkers(0);
  const animateAllMarkers = !reducedMotion && points.length <= 300;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  let hoveredIndex = -1;
  let selectedIndex = -1;
  let selectedPoint = null;
  let resumeTimer = 0;
  let showTimer = 0;
  let hideTimer = 0;
  let frameId = 0;
  let disposed = false;
  let inViewport = true;
  let pointerInside = false;
  let pointerDirty = false;
  let lastRaycastAt = 0;
  let lastMarkerUpdateAt = -Infinity;
  let lastTooltipPlacementAt = 0;
  let viewportWidth = 1;
  let viewportHeight = 1;
  let tooltipWidth = 252;
  let tooltipHeight = 180;
  const projectedMarker = new THREE.Vector3();
  const pointerDownAt = new THREE.Vector2();

  function requestFrame() {
    if (disposed || !inViewport || document.hidden || frameId) return;
    frameId = requestAnimationFrame(render);
  }

  function pauseRotation() {
    controls.autoRotate = false;
    clearTimeout(resumeTimer);
    requestFrame();
  }
  function scheduleRotation() {
    if (reducedMotion) return;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      controls.autoRotate = true;
      requestFrame();
    }, ROTATION_RESUME_DELAY);
  }
  controls.addEventListener('start', pauseRotation);
  controls.addEventListener('end', scheduleRotation);

  renderer.domElement.addEventListener('pointermove', event => {
    pointer.x = event.offsetX / viewportWidth * 2 - 1;
    pointer.y = -(event.offsetY / viewportHeight) * 2 + 1;
    pointerInside = true;
    pointerDirty = true;
    requestFrame();
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    pointer.set(2, 2);
    pointerInside = false;
    pointerDirty = true;
    scheduleTooltipHide();
  });
  renderer.domElement.addEventListener('pointerdown', event => {
    pointerDownAt.set(event.clientX, event.clientY);
  });
  renderer.domElement.addEventListener('pointerup', event => {
    if (hoveredIndex < 0 || pointerDownAt.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 6) return;
    clearTimeout(showTimer);
    showTooltip(hoveredIndex);
  });
  tooltip.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer);
    pauseRotation();
  });
  tooltip.addEventListener('mouseleave', () => {
    scheduleTooltipHide();
    scheduleRotation();
  });
  openButton.addEventListener('click', () => {
    if (selectedPoint) openApplicantDetails(selectedPoint.applicantId);
  });

  function showTooltip(index) {
    clearTimeout(hideTimer);
    selectedIndex = index;
    selectedPoint = points[index];
    nameField.textContent = selectedPoint.name;
    cityField.textContent = selectedPoint.city;
    statusField.textContent = selectedPoint.status;
    tooltip.classList.add('is-visible');
    tooltipWidth = tooltip.offsetWidth || 252;
    tooltipHeight = tooltip.offsetHeight || 180;
    placeTooltip(performance.now(), true);
  }

  function scheduleTooltipHide() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (tooltip.matches(':hover')) return;
      selectedIndex = -1;
      selectedPoint = null;
      tooltip.classList.remove('is-visible');
    }, 120);
  }

  function updateHover() {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitTargets, false)[0];
    const nextIndex = Number.isInteger(hit?.instanceId) ? hit.instanceId : -1;
    if (nextIndex === hoveredIndex) return false;
    hoveredIndex = nextIndex;
    renderer.domElement.style.cursor = hoveredIndex >= 0 ? 'pointer' : '';
    clearTimeout(showTimer);
    if (hoveredIndex < 0) {
      scheduleTooltipHide();
      return true;
    }
    clearTimeout(hideTimer);
    showTimer = setTimeout(() => showTooltip(hoveredIndex), 100);
    return true;
  }

  function placeTooltip(now = performance.now(), force = false) {
    if (!selectedPoint || selectedIndex < 0) return;
    if (!force && now - lastTooltipPlacementAt < 48) return;
    lastTooltipPlacementAt = now;
    projectedMarker.copy(markerPositions[selectedIndex]).project(camera);
    const x = (projectedMarker.x * .5 + .5) * viewportWidth;
    const y = (-projectedMarker.y * .5 + .5) * viewportHeight;
    const halfWidth = Math.min(126, tooltipWidth / 2 || 126);
    tooltip.style.left = `${Math.max(halfWidth + 12, Math.min(viewportWidth - halfWidth - 12, x))}px`;
    tooltip.style.top = `${Math.max(12, Math.min(viewportHeight - 12, y))}px`;
    const showBelow = y < tooltipHeight + 34;
    tooltip.classList.toggle('is-below', showBelow);
  }

  function resize() {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    viewportWidth = width;
    viewportHeight = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    pointerDirty = true;
    requestFrame();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  const renderVisibilityObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => {
        inViewport = Boolean(entry?.isIntersecting);
        if (inViewport) requestFrame();
        else if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      }, { rootMargin: '80px 0px' })
    : null;
  renderVisibilityObserver?.observe(root);
  const onVisibilityChange = () => {
    if (document.hidden && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else {
      requestFrame();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  const animationStartedAt = performance.now();
  function render(now) {
    frameId = 0;
    if (disposed) return;
    const elapsed = Math.max(0, now - animationStartedAt) / 1000;
    updateTheme(now);
    const glowBase = THREE.MathUtils.lerp(.16, .3, themeMix);
    glowMaterial.opacity = reducedMotion ? glowBase : glowBase + Math.sin(elapsed * 1.25) * .04;
    controls.update();
    let hoverChanged = false;
    if (pointerDirty || (pointerInside && now - lastRaycastAt >= 80)) {
      pointerDirty = false;
      lastRaycastAt = now;
      hoverChanged = updateHover();
    }
    if (hoverChanged || lastMarkerUpdateAt < 0 || (animateAllMarkers && now - lastMarkerUpdateAt >= 50)) {
      lastMarkerUpdateAt = now;
      updateMarkers(elapsed, hoveredIndex);
    }
    placeTooltip(now);
    renderer.render(scene, camera);
    requestFrame();
  }
  requestFrame();
  root.querySelector('[data-globe-loading]').hidden = true;
  host.setAttribute('aria-busy', 'false');

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(resumeTimer);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      document.removeEventListener('themeChanged', onThemeChanged);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver.disconnect();
      renderVisibilityObserver?.disconnect();
      controls.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      earthMap.dispose();
      nightMap.dispose();
      nightMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      atmosphere.geometry.dispose();
      atmosphere.material.dispose();
      pinHeadGeometry.dispose();
      pinTailGeometry.dispose();
      rimHeadGeometry.dispose();
      rimTailGeometry.dispose();
      pinMaterial.dispose();
      rimMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      glowTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
    }
  };
}

export async function initApplicantGlobe() {
  const root = document.querySelector('[data-applicant-globe-section]');
  if (!root || activeGlobe) return activeGlobe;
  const database = await loadDatabase();
  const points = createApplicantGlobeData(database);
  root.querySelector('[data-globe-count]').textContent = points.length.toLocaleString();
  root.querySelector('[data-location-count]').textContent =
    countApplicantLocations(points).toLocaleString();

  const start = async () => {
    if (activeGlobe) return;
    try {
      activeGlobe = await mountGlobe(root, points);
    } catch (error) {
      console.error('Applicant globe could not load:', error);
      showFallback(root, 'The interactive globe could not be loaded. Applicant data is still available above.');
    }
  };
  if (!('IntersectionObserver' in window)) {
    await start();
    return activeGlobe;
  }
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    const startWhenIdle = () => start();
    if ('requestIdleCallback' in window) {
      requestIdleCallback(startWhenIdle, { timeout: 240 });
    } else {
      requestAnimationFrame(startWhenIdle);
    }
  }, { rootMargin: '80px 0px' });
  observer.observe(root);
  return { dispose: () => observer.disconnect() };
}

addEventListener('pagehide', () => {
  activeGlobe?.dispose?.();
  activeGlobe = null;
}, { once: true });

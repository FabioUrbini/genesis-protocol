/**
 * Custom GLSL shaders for voxel materials
 * Includes fresnel effect, energy veins, and subsurface scattering (SSS)
 */

export const VoxelVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  uniform float time;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const VoxelFragmentShader = `
  uniform vec3 baseColor;
  uniform vec3 emissiveColor;
  uniform float emissiveIntensity;
  uniform float metalness;
  uniform float roughness;
  uniform float time;

  // Fresnel parameters
  uniform float fresnelPower;
  uniform float fresnelIntensity;
  uniform vec3 fresnelColor;

  // Energy vein parameters
  uniform float veinFrequency;
  uniform float veinSpeed;
  uniform float veinIntensity;
  uniform vec3 veinColor;

  // Subsurface scattering parameters
  uniform float sssDistortion;
  uniform float sssPower;
  uniform float sssScale;
  uniform vec3 sssColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  // Simplex noise function for organic patterns
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Fresnel effect
  float fresnel(vec3 viewDir, vec3 normal, float power) {
    float fresnelFactor = abs(dot(viewDir, normal));
    fresnelFactor = clamp(1.0 - fresnelFactor, 0.0, 1.0);
    return pow(fresnelFactor, power);
  }

  // Energy veins using noise
  float energyVeins(vec3 pos, float freq, float t) {
    vec3 p = pos * freq;
    float noise1 = snoise(p + vec3(t, 0.0, 0.0));
    float noise2 = snoise(p * 2.0 + vec3(0.0, t * 1.5, 0.0));
    float noise3 = snoise(p * 4.0 + vec3(0.0, 0.0, t * 2.0));

    float vein = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
    vein = smoothstep(0.3, 0.7, vein);

    return vein;
  }

  // Simple subsurface scattering approximation
  float subsurfaceScattering(vec3 viewDir, vec3 normal, vec3 lightDir) {
    vec3 scatterDir = normalize(lightDir + normal * sssDistortion);
    float scatter = pow(clamp(dot(viewDir, -scatterDir), 0.0, 1.0), sssPower) * sssScale;
    return scatter;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Base color
    vec3 color = baseColor;

    // Fresnel effect
    float fresnelEffect = fresnel(viewDir, normal, fresnelPower);
    vec3 fresnelContribution = fresnelColor * fresnelEffect * fresnelIntensity;

    // Energy veins
    float vein = energyVeins(vWorldPosition, veinFrequency, time * veinSpeed);
    vec3 veinContribution = veinColor * vein * veinIntensity;

    // Subsurface scattering (using view direction as light approximation)
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float sss = subsurfaceScattering(viewDir, normal, lightDir);
    vec3 sssContribution = sssColor * sss;

    // Basic lighting (simple diffuse)
    float diffuse = max(dot(normal, lightDir), 0.0);
    color *= (0.3 + 0.7 * diffuse);

    // Combine all effects
    color += fresnelContribution;
    color += veinContribution;
    color += sssContribution;

    // Emissive
    color += emissiveColor * emissiveIntensity;

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Create shader material with custom parameters
 */
export function createVoxelMaterial(params: {
  baseColor?: THREE.Color;
  emissiveColor?: THREE.Color;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;

  // Fresnel
  fresnelPower?: number;
  fresnelIntensity?: number;
  fresnelColor?: THREE.Color;

  // Energy veins
  veinFrequency?: number;
  veinSpeed?: number;
  veinIntensity?: number;
  veinColor?: THREE.Color;

  // SSS
  sssDistortion?: number;
  sssPower?: number;
  sssScale?: number;
  sssColor?: THREE.Color;
}): THREE.ShaderMaterial {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: params.baseColor || new THREE.Color(0x4a90e2) },
      emissiveColor: { value: params.emissiveColor || new THREE.Color(0x000000) },
      emissiveIntensity: { value: params.emissiveIntensity ?? 0.0 },
      metalness: { value: params.metalness ?? 0.3 },
      roughness: { value: params.roughness ?? 0.7 },
      time: { value: 0 },

      // Fresnel
      fresnelPower: { value: params.fresnelPower ?? 3.0 },
      fresnelIntensity: { value: params.fresnelIntensity ?? 0.5 },
      fresnelColor: { value: params.fresnelColor || new THREE.Color(0x88ccff) },

      // Energy veins
      veinFrequency: { value: params.veinFrequency ?? 2.0 },
      veinSpeed: { value: params.veinSpeed ?? 0.5 },
      veinIntensity: { value: params.veinIntensity ?? 0.3 },
      veinColor: { value: params.veinColor || new THREE.Color(0xff6b35) },

      // SSS
      sssDistortion: { value: params.sssDistortion ?? 0.5 },
      sssPower: { value: params.sssPower ?? 2.0 },
      sssScale: { value: params.sssScale ?? 1.0 },
      sssColor: { value: params.sssColor || new THREE.Color(0xff9966) },
    },
    vertexShader: VoxelVertexShader,
    fragmentShader: VoxelFragmentShader,
  });

  return material;
}

declare module 'three' {
  interface Color {
    // This is just for TypeScript compatibility
  }
}

import * as THREE from 'three';

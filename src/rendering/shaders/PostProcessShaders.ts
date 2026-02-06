/**
 * Custom post-processing shaders
 * Includes SSAO, Depth of Field, Motion Blur, Film Grain, and God Rays
 */

/**
 * SSAO (Screen Space Ambient Occlusion) Shader
 */
export const SSAOShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    tNormal: { value: null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 100.0 },
    resolution: { value: new THREE.Vector2(512, 512) },
    samples: { value: 16 },
    radius: { value: 0.5 },
    intensity: { value: 1.0 },
    bias: { value: 0.01 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform sampler2D tNormal;
    uniform float cameraNear;
    uniform float cameraFar;
    uniform vec2 resolution;
    uniform int samples;
    uniform float radius;
    uniform float intensity;
    uniform float bias;
    varying vec2 vUv;

    // Generate random sample kernel
    vec3 getRandomVec(vec2 uv, float seed) {
      float x = fract(sin(dot(uv + seed, vec2(12.9898, 78.233))) * 43758.5453);
      float y = fract(sin(dot(uv + seed + 0.1, vec2(12.9898, 78.233))) * 43758.5453);
      float z = fract(sin(dot(uv + seed + 0.2, vec2(12.9898, 78.233))) * 43758.5453);
      return normalize(vec3(x, y, z) * 2.0 - 1.0);
    }

    float getDepth(vec2 uv) {
      return texture2D(tDepth, uv).x;
    }

    vec3 getNormal(vec2 uv) {
      return texture2D(tNormal, uv).xyz * 2.0 - 1.0;
    }

    void main() {
      float depth = getDepth(vUv);
      vec3 normal = getNormal(vUv);

      float occlusion = 0.0;

      for (int i = 0; i < 16; i++) {
        vec3 sampleVec = getRandomVec(vUv, float(i));
        sampleVec = normalize(sampleVec + normal);

        vec2 sampleUv = vUv + sampleVec.xy * radius / resolution;
        float sampleDepth = getDepth(sampleUv);

        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(depth - sampleDepth));
        occlusion += (sampleDepth >= depth + bias ? 1.0 : 0.0) * rangeCheck;
      }

      occlusion = 1.0 - (occlusion / float(samples)) * intensity;

      vec4 color = texture2D(tDiffuse, vUv);
      gl_FragColor = vec4(color.rgb * occlusion, color.a);
    }
  `,
};

/**
 * Depth of Field Shader
 */
export const DepthOfFieldShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    focus: { value: 1.0 },
    aperture: { value: 0.025 },
    maxBlur: { value: 1.0 },
    resolution: { value: new THREE.Vector2(512, 512) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float focus;
    uniform float aperture;
    uniform float maxBlur;
    uniform vec2 resolution;
    varying vec2 vUv;

    void main() {
      float depth = texture2D(tDepth, vUv).x;
      float blur = clamp(abs(depth - focus) * aperture, 0.0, maxBlur);

      vec4 color = vec4(0.0);
      float total = 0.0;

      float samples = 16.0;
      float radius = blur;

      for (float angle = 0.0; angle < 6.28318530718; angle += 6.28318530718 / samples) {
        for (float r = 0.0; r <= 1.0; r += 1.0 / 4.0) {
          vec2 offset = vec2(cos(angle), sin(angle)) * r * radius / resolution;
          color += texture2D(tDiffuse, vUv + offset);
          total += 1.0;
        }
      }

      gl_FragColor = color / total;
    }
  `,
};

/**
 * Motion Blur Shader
 */
export const MotionBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    tVelocity: { value: null },
    velocityFactor: { value: 1.0 },
    samples: { value: 8 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tVelocity;
    uniform float velocityFactor;
    uniform int samples;
    varying vec2 vUv;

    void main() {
      vec2 velocity = texture2D(tVelocity, vUv).xy * velocityFactor;

      vec4 color = texture2D(tDiffuse, vUv);

      for (int i = 1; i < 8; i++) {
        float t = float(i) / float(samples);
        vec2 offset = velocity * t;
        color += texture2D(tDiffuse, vUv - offset);
      }

      gl_FragColor = color / float(samples);
    }
  `,
};

/**
 * Film Grain Shader
 */
export const FilmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    intensity: { value: 0.5 },
    grainSize: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    uniform float grainSize;
    varying vec2 vUv;

    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      vec2 uv = vUv * grainSize;
      float grain = random(uv + time) * 2.0 - 1.0;

      color.rgb += grain * intensity;

      gl_FragColor = color;
    }
  `,
};

/**
 * God Rays (Volumetric Lighting) Shader
 */
export const GodRaysShader = {
  uniforms: {
    tDiffuse: { value: null },
    lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
    exposure: { value: 0.5 },
    decay: { value: 0.95 },
    density: { value: 0.8 },
    weight: { value: 0.4 },
    samples: { value: 50 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 lightPosition;
    uniform float exposure;
    uniform float decay;
    uniform float density;
    uniform float weight;
    uniform int samples;
    varying vec2 vUv;

    void main() {
      vec2 deltaTextCoord = vUv - lightPosition;
      vec2 textCoord = vUv;
      deltaTextCoord *= 1.0 / float(samples) * density;

      float illuminationDecay = 1.0;
      vec4 color = texture2D(tDiffuse, vUv);

      for (int i = 0; i < 50; i++) {
        if (i >= samples) break;

        textCoord -= deltaTextCoord;
        vec4 sample = texture2D(tDiffuse, textCoord);

        sample *= illuminationDecay * weight;
        color += sample;

        illuminationDecay *= decay;
      }

      gl_FragColor = color * exposure;
    }
  `,
};

/**
 * Color Grading LUT Shader
 */
export const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    tLUT: { value: null },
    intensity: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tLUT;
    uniform float intensity;
    varying vec2 vUv;

    vec3 applyLUT(vec3 color, sampler2D lut) {
      float lutSize = 16.0;
      float cellSize = 1.0 / lutSize;
      float halfCellSize = cellSize * 0.5;

      float blue = color.b * (lutSize - 1.0);
      float blueFloor = floor(blue);
      float blueFrac = blue - blueFloor;

      vec2 uv1;
      uv1.y = halfCellSize + color.g * (cellSize * (lutSize - 1.0));
      uv1.x = halfCellSize + color.r * (cellSize * (lutSize - 1.0));
      uv1.x += blueFloor * cellSize;

      vec2 uv2 = uv1;
      uv2.x += cellSize;

      vec3 color1 = texture2D(lut, uv1).rgb;
      vec3 color2 = texture2D(lut, uv2).rgb;

      return mix(color1, color2, blueFrac);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec3 gradedColor = applyLUT(color.rgb, tLUT);
      gl_FragColor = vec4(mix(color.rgb, gradedColor, intensity), color.a);
    }
  `,
};

declare module 'three' {
  interface Vector2 {
    // TypeScript compatibility
  }
}

import * as THREE from 'three';

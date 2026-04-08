import * as THREE from 'three';

export interface GalaxyBackgroundOptions {
  width?: number;
  height?: number;
  starCount?: number;
  brightStarCount?: number;
  nebulaCount?: number;
}

export function createGalaxyBackground(options: GalaxyBackgroundOptions = {}): THREE.Texture {
  const width = options.width ?? 1024;
  const height = options.height ?? 1024;
  const starCount = options.starCount ?? 900;
  const brightStarCount = options.brightStarCount ?? 30;
  const nebulaCount = options.nebulaCount ?? 5;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }

  ctx.fillStyle = '#05060d';
  ctx.fillRect(0, 0, width, height);

  const baseGradient = ctx.createRadialGradient(
    width * 0.55,
    height * 0.4,
    width * 0.1,
    width * 0.55,
    height * 0.4,
    width * 0.85
  );
  baseGradient.addColorStop(0, 'rgba(38, 54, 96, 0.7)');
  baseGradient.addColorStop(0.45, 'rgba(12, 18, 40, 0.75)');
  baseGradient.addColorStop(1, 'rgba(5, 6, 13, 1)');
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);

  const nebulaPalette = [
    'rgba(60, 120, 200, 0.18)',
    'rgba(120, 80, 200, 0.14)',
    'rgba(40, 180, 160, 0.12)',
    'rgba(90, 60, 140, 0.16)',
  ];

  for (let i = 0; i < nebulaCount; i++) {
    const radius = (0.25 + Math.random() * 0.45) * width;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const color = nebulaPalette[i % nebulaPalette.length] ?? 'rgba(60, 120, 200, 0.18)';
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 0.2 + Math.random() * 1.0;
    const alpha = 0.25 + Math.random() * 0.75;
    const tint = Math.random();
    const color = tint < 0.7
      ? `rgba(255, 255, 255, ${alpha})`
      : tint < 0.85
        ? `rgba(180, 210, 255, ${alpha})`
        : `rgba(255, 220, 180, ${alpha})`;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < brightStarCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 1.2 + Math.random() * 2.4;
    ctx.save();
    ctx.shadowColor = 'rgba(180, 220, 255, 0.8)';
    ctx.shadowBlur = 8 + Math.random() * 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
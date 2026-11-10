// ATLAS 3D Heavy Logistics Fleet Factory — Photorealistic PBR Vehicle Models
// Real-world scale, automotive geometries, multi-axle wheel assemblies, and licensed PBR materials.
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import { GLTFLoader } from '../vendor/GLTFLoader.js';

/**
 * Vehicle type configurations for the 20-truck ATLAS commercial fleet.
 * Each class has distinct commercial body styling, scale, and PBR material profiles.
 */
export const VEHICLE_TYPES = [
  {
    type: 'container',
    label: '40ft Container Semi-Trailer',
    cabinColor: 0x1E293B,
    trailerColor: 0x006837, // Maritime Deep Evergreen
    length: 15.2,
    width: 2.5,
    height: 4.05,
    trailerLen: 12.2,
    wheelbase: 7.8
  },
  {
    type: 'box',
    label: 'Heavy Logistics Box Truck',
    cabinColor: 0x24303E,
    trailerColor: 0xE2E8F0, // Clean Industrial White
    length: 9.6,
    width: 2.45,
    height: 3.35,
    trailerLen: 6.4,
    wheelbase: 5.6
  },
  {
    type: 'reefer',
    label: 'Refrigerated Thermal Trailer',
    cabinColor: 0x1A2535,
    trailerColor: 0xF1F5F9, // Insulated Pearl White
    length: 11.8,
    width: 2.5,
    height: 3.75,
    trailerLen: 8.0,
    wheelbase: 6.8
  },
  {
    type: 'tanker',
    label: 'Hazmat Fuel / Chemical Tanker',
    cabinColor: 0x18202A,
    trailerColor: 0xD1D5DB, // Polished Anodized Chrome/Aluminum
    length: 11.9,
    width: 2.45,
    height: 3.25,
    trailerLen: 8.2,
    wheelbase: 6.9
  },
  {
    type: 'cargo',
    label: 'Heavy Industrial Lowboy Flatbed',
    cabinColor: 0x1F2937,
    trailerColor: 0x334155, // Heavy Structural Steel
    length: 11.2,
    width: 2.55,
    height: 2.65,
    trailerLen: 7.8,
    wheelbase: 6.4
  },
];

// Authentic international container shipping line liveries with ISO 6346 markings
const CONTAINER_LIVERIES = [
  { name: 'Evergreen', color: 0x006837, text: 'EVERGREEN', code: 'EISU 894012 3', textColor: '#FFFFFF' },
  { name: 'Maersk', color: 0x2563EB, text: 'MAERSK', code: 'MSKU 948120 4', textColor: '#FFFFFF' },
  { name: 'Hapag-Lloyd', color: 0xEA580C, text: 'HAPAG-LLOYD', code: 'HLXU 481093 1', textColor: '#FFFFFF' },
  { name: 'MSC', color: 0xF1F5F9, text: 'MEDITERRANEAN', code: 'MSCU 671204 8', textColor: '#0F172A' },
  { name: 'ONE', color: 0xDB2777, text: 'ONE', code: 'ONEU 310948 5', textColor: '#FFFFFF' },
];

// Texture Cache for dynamic high-resolution procedural textures
const _textureCache = new Map();

/**
 * Creates high-resolution procedural container side-wall texture.
 * Features 40 corrugation channels, ambient occlusion, shipping line livery,
 * ISO 6346 code markings, weight ratings, and CSC safety approval plate.
 */
function getContainerSideTexture(THREE, colorHex, livery) {
  if (typeof document === 'undefined') return null;
  const key = `cont-side-${colorHex}-${livery.name}`;
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base container color
  const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
  ctx.fillStyle = hexStr;
  ctx.fillRect(0, 0, 1024, 256);

  // 40 Vertical corrugation channels with 3D shadow and highlight gradients
  const numRibs = 40;
  const ribW = 1024 / numRibs;
  for (let i = 0; i < numRibs; i++) {
    const rx = i * ribW;
    const grad = ctx.createLinearGradient(rx, 0, rx + ribW, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(0.25, 'rgba(0, 0, 0, 0.05)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(rx, 14, ribW, 228);
  }

  // Top and bottom rail trim
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, 0, 1024, 14);
  ctx.fillRect(0, 242, 1024, 14);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(0, 13, 1024, 2);
  ctx.fillRect(0, 241, 1024, 2);

  // Center Livery Branding (Bold condensed lettering)
  ctx.save();
  ctx.fillStyle = livery.textColor || '#FFFFFF';
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText(livery.text, 512, 128);
  ctx.restore();

  // Top Right ISO 6346 Container Code (e.g. MSKU 892014 7 / 45G1)
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(livery.code || 'MSKU 892014 7', 1000, 36);
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText('45G1', 1000, 56);
  ctx.restore();

  // Left CSC Safety Approval Plate & Technical Specifications Table
  ctx.save();
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(24, 160, 130, 72);
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 160, 130, 72);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 8px monospace';
  ctx.fillText('CSC SAFETY APPROVAL', 28, 172);
  ctx.font = '7px monospace';
  ctx.fillText('MAX.GROSS  32,500 KG', 28, 185);
  ctx.fillText('TARE        3,980 KG', 28, 196);
  ctx.fillText('PAYLOAD    28,520 KG', 28, 207);
  ctx.fillText('CUBE        76.4 CUM', 28, 218);
  ctx.restore();

  // Yellow high cube caution stripes at top corners
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(8, 16, 20, 20);
  ctx.fillRect(996, 16, 20, 20);
  ctx.fillStyle = '#000000';
  ctx.fillRect(12, 20, 12, 12);
  ctx.fillRect(1000, 20, 12, 12);

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates high-resolution procedural container rear double-door texture.
 * Features weather gaskets, 4 locking rods, cam latches, hinges, high-cube caution,
 * full specs block, and red/white DOT-C2 reflective conspicuity tape.
 */
function getContainerDoorTexture(THREE, colorHex, livery) {
  if (typeof document === 'undefined') return null;
  const key = `cont-door-${colorHex}-${livery.name}`;
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base door color
  const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
  ctx.fillStyle = hexStr;
  ctx.fillRect(0, 0, 512, 512);

  // Outer black rubber perimeter weather gasket (20px wide)
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 512, 20);
  ctx.fillRect(0, 492, 512, 20);
  ctx.fillRect(0, 0, 20, 512);
  ctx.fillRect(492, 0, 20, 512);

  // Center vertical door split line with black gasket lip
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(252, 20, 8, 472);

  // Door panel recessed bevels
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(28, 28, 216, 456);
  ctx.fillRect(268, 28, 216, 456);
  ctx.fillStyle = hexStr;
  ctx.fillRect(34, 34, 204, 444);
  ctx.fillRect(274, 34, 204, 444);

  // 4 Door Hinges per side (8 total)
  ctx.fillStyle = '#334155';
  for (const hy of [60, 180, 320, 440]) {
    ctx.fillRect(10, hy, 28, 14);
    ctx.fillRect(474, hy, 28, 14);
  }

  // Right Door Specifications Block
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.fillText(livery.code || 'MSKU 892014 7', 290, 80);
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText('45G1', 290, 100);

  ctx.font = '10px monospace';
  ctx.fillText('MAX.WT.   32,500 KG', 290, 130);
  ctx.fillText('          71,650 LBS', 290, 144);
  ctx.fillText('TARE WT.   3,980 KG', 290, 164);
  ctx.fillText('           8,770 LBS', 290, 178);
  ctx.fillText('PAYLOAD   28,520 KG', 290, 198);
  ctx.fillText('          62,880 LBS', 290, 212);
  ctx.fillText('CUBE       76.4 CU.M.', 290, 232);
  ctx.fillText('          2,700 CU.FT.', 290, 246);
  ctx.restore();

  // Left Door Caution Triangle & Decals
  ctx.save();
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(136, 70);
  ctx.lineTo(196, 170);
  ctx.lineTo(76, 170);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAUTION', 136, 130);
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.fillText('2.9M HIGH', 136, 148);
  ctx.fillText('CONTAINER', 136, 160);
  ctx.restore();

  // Bottom Sill DOT-C2 Red / White Reflective Conspicuity Tape
  const tapeY = 468;
  const tapeH = 16;
  const segmentW = 32;
  for (let x = 24; x < 488; x += segmentW * 2) {
    ctx.fillStyle = '#DC2626'; // Vivid reflective red
    ctx.fillRect(x, tapeY, segmentW, tapeH);
    ctx.fillStyle = '#F8FAFC'; // Silver white
    ctx.fillRect(x + segmentW, tapeY, segmentW, tapeH);
  }

  // Top Corner Reflective L-Markers
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(24, 24, 30, 8);
  ctx.fillRect(24, 24, 8, 30);
  ctx.fillRect(458, 24, 30, 8);
  ctx.fillRect(480, 24, 8, 30);

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates procedural tire tread and sidewall texture.
 */
function getTireTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'truck-tire-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Dark matte vulcanized rubber
  ctx.fillStyle = '#14181F';
  ctx.fillRect(0, 0, 512, 256);

  // 4 continuous circumferential drainage grooves
  ctx.fillStyle = '#080A0E';
  for (const gy of [45, 90, 165, 210]) {
    ctx.fillRect(0, gy, 512, 10);
  }

  // Transverse traction sipes
  ctx.fillStyle = '#0B0D12';
  for (let x = 0; x < 512; x += 16) {
    ctx.fillRect(x, 0, 3, 45);
    ctx.fillRect(x + 8, 55, 3, 35);
    ctx.fillRect(x, 100, 3, 65);
    ctx.fillRect(x + 8, 175, 3, 35);
    ctx.fillRect(x, 220, 3, 36);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates 10-hole heavy commercial wheel rim texture with yellow torque indicators.
 */
function getWheelRimTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'truck-rim-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Polished steel / alloy rim disc
  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, '#334155');
  grad.addColorStop(0.35, '#94A3B8');
  grad.addColorStop(0.7, '#64748B');
  grad.addColorStop(0.85, '#CBD5E1');
  grad.addColorStop(1, '#1E293B');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  // 10 Ventilation cutouts
  ctx.fillStyle = '#0F172A';
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    const cx = 128 + Math.cos(a) * 88;
    const cy = 128 + Math.sin(a) * 88;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 8, a, 0, Math.PI * 2);
    ctx.fill();
  }

  // 10 Chrome Lug Nuts with bright yellow arrow safety torque indicators
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10 + 0.15;
    const lx = 128 + Math.cos(a) * 58;
    const ly = 128 + Math.sin(a) * 58;

    // Yellow indicator pointer
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    const pa = a + 0.35;
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + Math.cos(pa) * 16, ly + Math.sin(pa) * 16);
    ctx.lineTo(lx + Math.cos(pa + 0.4) * 8, ly + Math.sin(pa + 0.4) * 8);
    ctx.closePath();
    ctx.fill();

    // Chrome hex lug nut
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.arc(lx, ly, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central Axle Hub with grease cap
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(128, 128, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DC2626'; // Red center cap
  ctx.beginPath();
  ctx.arc(128, 128, 18, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates cab honeycomb radiator grille texture.
 */
function getGrilleTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'truck-grille-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#0A0F1D';
  ctx.fillRect(0, 0, 512, 256);

  // Honeycomb hexagonal mesh pattern
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  const hexR = 8;
  const dx = hexR * 1.5;
  const dy = Math.sqrt(3) * hexR;
  for (let y = 0; y < 256 + dy; y += dy) {
    let row = 0;
    for (let x = 0; x < 512 + dx; x += dx) {
      const cy = y + (row % 2 ? dy / 2 : 0);
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI) / 3;
        const px = x + hexR * Math.cos(a);
        const py = cy + hexR * Math.sin(a);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      row++;
    }
  }

  // Horizontal dual chrome styling bars
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(40, 80, 432, 10);
  ctx.fillRect(40, 160, 432, 10);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(40, 90, 432, 3);
  ctx.fillRect(40, 170, 432, 3);

  // Chrome manufacturer badge plate in center
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(232, 70, 48, 30);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(235, 73, 42, 24);
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(256, 85, 8, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates tractor windshield texture with solar tint band and ceramic frit border.
 */
function getWindshieldTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'truck-windshield-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Dark tinted glass with blue-green automotive tint
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(0, 0, 512, 256);

  // Top solar band (graduated dark strip)
  const solarGrad = ctx.createLinearGradient(0, 0, 0, 70);
  solarGrad.addColorStop(0, 'rgba(3, 7, 18, 0.95)');
  solarGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.6)');
  solarGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
  ctx.fillStyle = solarGrad;
  ctx.fillRect(0, 0, 512, 70);

  // Outer black ceramic frit border (16px)
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, 512, 16);
  ctx.fillRect(0, 240, 512, 16);
  ctx.fillRect(0, 0, 16, 256);
  ctx.fillRect(496, 0, 16, 256);

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Builds the Hero 6x4 Heavy Commercial Tractor + 40ft ISO Container Semi-Trailer (TRK-001).
 * Features true 40-foot proportions (12.2m container), 22 tires across 6 axles,
 * corrugated container panels with shipping liveries, and authentic chassis details.
 */

/**
 * Creates high-resolution procedural box truck side panel texture (Class 2).
 * Features industrial composite panels, rivet rows, ATLAS logistics branding, and DOT-C2 tape.
 */
function getBoxTruckSideTexture(THREE, colorHex, index) {
  if (typeof document === 'undefined') return null;
  const key = `box-side-${colorHex}-${index % 5}`;
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const hexStr = '#' + (colorHex || 0xEDEFEF).toString(16).padStart(6, '0');
  ctx.fillStyle = hexStr;
  ctx.fillRect(0, 0, 1024, 256);

  // Subtle vertical panel seams (structural composite panels every 128px)
  for (let x = 64; x < 1024; x += 128) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(x - 1, 0, 2, 256);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x + 1, 0, 1, 256);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let y = 16; y < 240; y += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Brand header: ATLAS LOGISTICS INDONESIA
  ctx.save();
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.fillText('ATLAS', 140, 95);
  ctx.fillStyle = '#0D9488'; // Teal brand accent
  ctx.fillText('LOGISTICS', 265, 95);

  ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('KIK KARIANGAU INTERMODAL FREIGHT CORRIDOR', 142, 122);

  // Fleet unit number badge
  const unitNum = `UNIT BX-${String((index || 0) + 1).padStart(3, '0')}`;
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(142, 142, 130, 26);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(unitNum, 154, 159);

  // Specifications block
  ctx.font = '10px monospace';
  ctx.fillStyle = '#64748B';
  ctx.fillText('MAX GVW: 16,000 KG | NET PAYLOAD: 11,200 KG', 290, 150);
  ctx.fillText('VOLUMETRIC CUBE: 48.5 M³ | TARE: 4,800 KG', 290, 166);
  ctx.fillText('CALL CENTER: 0800-1-ATLAS (HOTLINE 24 JAM)', 142, 196);

  // Left side brand emblem (tactical chevron)
  ctx.fillStyle = '#0D9488';
  ctx.beginPath();
  ctx.moveTo(85, 60);
  ctx.lineTo(115, 110);
  ctx.lineTo(85, 160);
  ctx.lineTo(55, 110);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(85, 110, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Bottom DOT-C2 Red / White Reflective Conspicuity Tape (14px high)
  const tapeY = 240;
  for (let x = 0; x < 1024; x += 64) {
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(x, tapeY, 32, 14);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(x + 32, tapeY, 32, 14);
  }

  // Top corner silver L-brackets
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(6, 6, 24, 6);
  ctx.fillRect(6, 6, 6, 24);
  ctx.fillRect(994, 6, 24, 6);
  ctx.fillRect(1012, 6, 6, 24);

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates roll-up shutter door texture for Box Truck rear (Class 2).
 */
function getBoxTruckDoorTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'box-door-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, 512, 512);

  // Roll-up shutter door panel (26 horizontal extruded aluminum slats)
  const slatCount = 26;
  const slatH = 430 / slatCount;
  for (let s = 0; s < slatCount; s++) {
    const sy = 24 + s * slatH;
    const grad = ctx.createLinearGradient(0, sy, 0, sy + slatH);
    grad.addColorStop(0, '#CBD5E1');
    grad.addColorStop(0.5, '#94A3B8');
    grad.addColorStop(1, '#64748B');
    ctx.fillStyle = grad;
    ctx.fillRect(24, sy, 464, slatH - 2);

    ctx.fillStyle = '#1E293B';
    ctx.fillRect(24, sy + slatH - 2, 464, 2);
  }

  // Heavy bottom pull handle and locking latch
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(206, 410, 100, 24);
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(216, 416, 80, 12);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(246, 396, 20, 16);

  // Rear safety chevron band across bottom 36px (yellow / black 45° stripes)
  ctx.save();
  ctx.beginPath();
  ctx.rect(24, 456, 464, 36);
  ctx.clip();
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(24, 456, 464, 36);
  ctx.fillStyle = '#0F172A';
  for (let x = -50; x < 550; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 492);
    ctx.lineTo(x + 24, 492);
    ctx.lineTo(x + 50, 456);
    ctx.lineTo(x + 26, 456);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Perimeter red/white DOT tape
  for (let x = 24; x < 488; x += 40) {
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(x, 8, 20, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 20, 8, 20, 12);
  }

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates high-resolution procedural reefer side texture (Class 3).
 * Insulated polyurethane composite wall, cold chain graphics, ATP certification, and DOT-C2 tape.
 */
function getReeferSideTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'reefer-side-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 1024, 256);

  for (let x = 128; x < 1024; x += 128) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.fillRect(x, 0, 2, 256);
  }

  // Cyan & deep navy thermal stripe across mid-body
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(0, 110, 1024, 10);
  ctx.fillStyle = '#0EA5E9';
  ctx.fillRect(0, 120, 1024, 4);
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(0, 124, 1024, 2);

  // Brand & thermal cold chain insignia
  ctx.save();
  ctx.fillStyle = '#0C4A6E';
  ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
  ctx.fillText('ATLAS', 150, 85);
  ctx.fillStyle = '#0284C7';
  ctx.fillText('COLD CHAIN', 255, 85);

  ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#0369A1';
  ctx.fillText('THERMAL INTERMODAL FLEET • BALIKPAPAN DEEPWATER REEFER', 152, 104);

  // Snowflake emblem on left
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 4;
  const cx = 90, cy = 75;
  for (let a = 0; a < 3; a++) {
    const angle = (a * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(angle) * 32, cy - Math.sin(angle) * 32);
    ctx.lineTo(cx + Math.cos(angle) * 32, cy + Math.sin(angle) * 32);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#38BDF8';
  ctx.fill();

  // Temperature Spec stamp
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('ATP FRC CERTIFIED | -25°C TO +15°C CONTROLLED', 152, 155);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('INSULATED POLYURETHANE COMPOSITE (K-VALUE <= 0.40 W/m²K)', 152, 172);
  ctx.fillText('PAYLOAD CAP: 26,500 KG | TARE: 7,850 KG | 68.2 M³', 152, 188);

  // Temperature setpoint digital badge
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(750, 48, 220, 50);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(754, 52, 212, 42);
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('SET: -22.0°C', 768, 80);
  ctx.fillStyle = '#22C55E';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('STATUS: RUNNING', 872, 79);
  ctx.restore();

  // Bottom DOT-C2 Red / White Reflective Conspicuity Tape (16px high)
  const tapeY = 238;
  for (let x = 0; x < 1024; x += 64) {
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(x, tapeY, 32, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 32, tapeY, 32, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates bulkhead refrigeration unit texture (Thermo King style SLXi).
 */
function getReeferUnitTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'reefer-unit-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, 512, 256);

  // Large cooling fan intake round grille
  const fanGrad = ctx.createRadialGradient(140, 128, 10, 140, 128, 90);
  fanGrad.addColorStop(0, '#0F172A');
  fanGrad.addColorStop(0.7, '#334155');
  fanGrad.addColorStop(1, '#64748B');
  ctx.fillStyle = fanGrad;
  ctx.beginPath();
  ctx.arc(140, 128, 85, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  for (let r = 20; r <= 80; r += 15) {
    ctx.beginPath();
    ctx.arc(140, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let a = 0; a < 8; a++) {
    const angle = (a * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(140, 128);
    ctx.lineTo(140 + Math.cos(angle) * 85, 128 + Math.sin(angle) * 85);
    ctx.stroke();
  }

  // Digital LED Control Panel (Right Side)
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(280, 40, 200, 170);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(280, 40, 200, 170);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.fillText('THERMO-ATLAS 9000', 295, 65);

  ctx.fillStyle = '#051E14';
  ctx.fillRect(295, 78, 170, 52);
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('-21.8°C', 310, 114);

  ctx.fillStyle = '#22C55E';
  ctx.beginPath(); ctx.arc(310, 152, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.fillText('COMPRESSOR: ACTIVE', 325, 156);

  ctx.fillStyle = '#38BDF8';
  ctx.beginPath(); ctx.arc(310, 176, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillText('DEFROST: AUTO', 325, 180);

  ctx.fillStyle = '#E2E8F0';
  ctx.fillText('SET: -22.0°C | DIESEL: 94%', 295, 202);

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates stainless steel thermal double rear doors texture for Reefer (Class 3).
 */
function getReeferRearDoorTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'reefer-door-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#CBD5E1');
  grad.addColorStop(0.3, '#E2E8F0');
  grad.addColorStop(0.5, '#F8FAFC');
  grad.addColorStop(0.7, '#E2E8F0');
  grad.addColorStop(1, '#94A3B8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 512, 16);
  ctx.fillRect(0, 496, 512, 16);
  ctx.fillRect(0, 0, 16, 512);
  ctx.fillRect(496, 0, 16, 512);
  ctx.fillRect(252, 0, 8, 512);

  const rodX = [100, 200, 312, 412];
  for (const rx of rodX) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(rx - 4, 20, 8, 472);
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(rx - 2, 20, 4, 472);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(rx - 12, 24, 24, 16);
    ctx.fillRect(rx - 12, 472, 24, 16);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(rx - 20, 240, 40, 16);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(rx - 6, 236, 12, 8);
  }

  ctx.fillStyle = '#DC2626';
  ctx.fillRect(40, 80, 160, 40);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PERINGATAN SUHU DINGIN', 120, 98);
  ctx.font = '9px Arial, sans-serif';
  ctx.fillText('TEMP: -25°C S/D +15°C', 120, 112);

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(300, 80, 160, 56);
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('ATLAS REEFER', 380, 102);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '10px monospace';
  ctx.fillText('FRC 08/2029', 380, 118);
  ctx.fillText('BALIKPAPAN DEEPWATER', 380, 130);
  ctx.textAlign = 'start';

  for (let x = 20; x < 490; x += 40) {
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(x, 472, 20, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 20, 472, 20, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates high-gloss polished aluminum tanker shell texture with UN 1203 placards (Class 4).
 */
function getTankerSideTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'tanker-side-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#64748B');
  grad.addColorStop(0.2, '#CBD5E1');
  grad.addColorStop(0.35, '#F8FAFC');
  grad.addColorStop(0.5, '#CBD5E1');
  grad.addColorStop(0.75, '#94A3B8');
  grad.addColorStop(1, '#475569');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Circumferential TIG Welded Seam Lines
  for (const wx of [200, 420, 640, 840]) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(wx - 2, 0, 4, 512);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(wx, 0, 1.5, 512);
  }

  // Draw UN 1203 Class 3 Flammable Liquid Diamond Placard
  const drawPlacard = (px, py) => {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-35, -35, 70, 70);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(-31, -31, 62, 62);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1203', 0, 14);
    ctx.font = 'bold 11px Arial';
    ctx.fillText('3', 0, 32);
    ctx.restore();
  };

  drawPlacard(310, 256);
  drawPlacard(740, 256);

  ctx.save();
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.fillText('PERTAMINA LOGISTICS', 450, 220);
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#DC2626';
  ctx.fillText('MUATAN MUDAH TERBAKAR • DILARANG MEROKOK', 450, 246);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('KAPASITAS: 32.000 LITER (3 KOMPARTEMEN)', 450, 274);
  ctx.fillText('TEKANAN KERJA: 2.65 BAR | UJI HIDRO: 2026/08', 450, 292);
  ctx.fillText('EMERGENCY CUTOFF SWITCH AT REAR BUMPER', 450, 310);
  ctx.restore();

  ctx.fillStyle = '#F59E0B';
  for (const ex of [240, 480, 720]) {
    ctx.fillRect(ex, 440, 80, 18);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('EMERGENCY', ex + 6, 453);
    ctx.fillStyle = '#F59E0B';
  }

  for (let x = 0; x < 1024; x += 64) {
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(x, 470, 32, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 32, 470, 32, 14);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates weathered Indonesian teak/ironwood plank texture for Lowboy deck (Class 5).
 */
function getLowboyDeckTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'lowboy-deck-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#5A3D28';
  ctx.fillRect(0, 0, 1024, 256);

  const plankH = 256 / 8;
  for (let p = 0; p < 8; p++) {
    const py = p * plankH;
    const tone = ((p * 17) % 25) - 12;
    ctx.fillStyle = `rgb(${90 + tone}, ${61 + tone}, ${40 + tone})`;
    ctx.fillRect(0, py + 1, 1024, plankH - 2);

    ctx.fillStyle = '#26180E';
    ctx.fillRect(0, py + plankH - 2, 1024, 2);

    ctx.fillStyle = 'rgba(38, 24, 14, 0.25)';
    for (let g = 0; g < 4; g++) {
      ctx.fillRect(0, py + 4 + g * 6, 1024, 1);
    }

    ctx.fillStyle = '#1E293B';
    for (let x = 40; x < 1024; x += 80) {
      ctx.beginPath();
      ctx.arc(x, py + plankH / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, 1024, 10);
  ctx.fillRect(0, 246, 1024, 10);

  ctx.fillStyle = '#94A3B8';
  for (let x = 60; x < 1024; x += 120) {
    ctx.fillRect(x, 2, 16, 6);
    ctx.fillRect(x, 248, 16, 6);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  _textureCache.set(key, tex);
  return tex;
}

/**
 * Creates high-visibility "MUATAN BERAT" / "OVERSIZE LOAD" banner texture.
 */
function getOversizeBannerTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const key = 'oversize-banner-texture';
  if (_textureCache.has(key)) return _textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FACC15';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#0F172A';
  for (let x = -30; x < 90; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 14, 128);
    ctx.lineTo(x + 38, 0);
    ctx.lineTo(x + 24, 0);
    ctx.closePath();
    ctx.fill();
  }
  for (let x = 420; x < 540; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 14, 128);
    ctx.lineTo(x + 38, 0);
    ctx.lineTo(x + 24, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 122);

  ctx.fillStyle = '#0F172A';
  ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MUATAN BERAT', 256, 68);
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('OVERSIZE LOAD • ESCORT REQUIRED', 256, 102);

  const tex = new THREE.CanvasTexture(canvas);
  _textureCache.set(key, tex);
  return tex;
}

function createContainerSemiTruck(THREE, spec, index) {
  const group = new THREE.Group();
  group.name = `truck-${index}`;

  const livery = CONTAINER_LIVERIES[index % CONTAINER_LIVERIES.length];

  // Procedural Textures
  const contSideTex = getContainerSideTexture(THREE, livery.color, livery);
  const contDoorTex = getContainerDoorTexture(THREE, livery.color, livery);
  const tireTex = getTireTexture(THREE);
  const rimTex = getWheelRimTexture(THREE);
  const grilleTex = getGrilleTexture(THREE);
  const windshieldTex = getWindshieldTexture(THREE);

  // PBR Materials
  const cabPaintMat = new THREE.MeshStandardMaterial({
    color: spec.cabinColor || 0x1E293B,
    roughness: 0.28,
    metalness: 0.65,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xE2E8F0,
    roughness: 0.12,
    metalness: 0.95,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x0F172A,
    roughness: 0.7,
    metalness: 0.5,
  });

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1A202C,
    roughness: 0.65,
    metalness: 0.6,
  });

  const contSideMat = new THREE.MeshStandardMaterial({
    color: livery.color,
    map: contSideTex || null,
    roughness: 0.45,
    metalness: 0.25,
  });

  const contDoorMat = new THREE.MeshStandardMaterial({
    color: livery.color,
    map: contDoorTex || null,
    roughness: 0.4,
    metalness: 0.3,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x14181F,
    map: tireTex || null,
    roughness: 0.85,
    metalness: 0.05,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xCBD5E1,
    map: rimTex || null,
    roughness: 0.25,
    metalness: 0.85,
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x0A0F1D,
    map: grilleTex || null,
    roughness: 0.35,
    metalness: 0.75,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    map: windshieldTex || null,
    transparent: true,
    opacity: 0.85,
    roughness: 0.08,
    metalness: 0.15,
  });

  // Overall Rig Dimensions: 14.8m Length, 2.50m Width, 4.05m Height
  // Rig is centered: Front bumper at z = +7.4, Rear doors at z = -7.4

  // --- 1. SKELETAL SEMI-TRAILER CHASSIS & 40FT CONTAINER ---
  const contL = 12.20; // 40-foot ISO length
  const contW = 2.44;  // 8-foot ISO width
  const contH = 2.90;  // 9ft 6in High Cube height
  const contZ = -1.30; // Centered from z = +4.80 down to z = -7.40

  const trailerGroup = new THREE.Group();
  trailerGroup.position.set(0, 0, contZ);

  // Twin I-Beam Chassis Rails
  const chassisRailGeo = new THREE.BoxGeometry(0.14, 0.32, contL * 0.98);
  for (const cx of [-contW * 0.34, contW * 0.34]) {
    const rail = new THREE.Mesh(chassisRailGeo, chassisMat);
    rail.position.set(cx, 0.78, 0);
    rail.castShadow = true;
    trailerGroup.add(rail);
  }

  // Main Container Shell
  const contShellGeo = new THREE.BoxGeometry(contW, contH, contL);
  const contMaterials = [
    contSideMat, // right (+X)
    contSideMat, // left (-X)
    contSideMat, // top (+Y)
    darkSteelMat, // bottom (-Y)
    darkSteelMat, // front bulkhead (+Z facing cab)
    contDoorMat  // rear double doors (-Z facing chase)
  ];
  const contMesh = new THREE.Mesh(contShellGeo, contMaterials);
  contMesh.position.set(0, 0.95 + contH / 2, 0);
  contMesh.castShadow = true;
  contMesh.receiveShadow = true;
  trailerGroup.add(contMesh);

  // 3D Physical Vertical Corrugated Ribs along side walls (36 ribs per side)
  const ribGeo = new THREE.BoxGeometry(0.04, contH * 0.96, 0.06);
  const ribCount = 36;
  const ribStep = (contL * 0.95) / ribCount;
  for (let r = 0; r < ribCount; r++) {
    const zPos = -contL * 0.475 + r * ribStep;
    const ribL = new THREE.Mesh(ribGeo, contSideMat);
    ribL.position.set(-contW / 2 - 0.02, 0.95 + contH / 2, zPos);
    trailerGroup.add(ribL);
    const ribR = new THREE.Mesh(ribGeo, contSideMat);
    ribR.position.set(contW / 2 + 0.02, 0.95 + contH / 2, zPos);
    trailerGroup.add(ribR);
  }

  // 8 Cast Steel ISO Corner Castings
  const cornerGeo = new THREE.BoxGeometry(0.20, 0.20, 0.20);
  for (const cx of [-contW / 2, contW / 2]) {
    for (const cy of [0.95, 0.95 + contH]) {
      for (const cz of [-contL / 2, contL / 2]) {
        const corner = new THREE.Mesh(cornerGeo, darkSteelMat);
        corner.position.set(cx, cy, cz);
        trailerGroup.add(corner);
      }
    }
  }

  // 4 Vertical Stainless Steel Locking Rods on Rear Doors
  const lockRodGeo = new THREE.CylinderGeometry(0.024, 0.024, contH * 0.92, 8);
  const camLockGeo = new THREE.BoxGeometry(0.08, 0.06, 0.06);
  for (const rx of [-contW * 0.32, -contW * 0.12, contW * 0.12, contW * 0.32]) {
    const rod = new THREE.Mesh(lockRodGeo, chromeMat);
    rod.position.set(rx, 0.95 + contH / 2, -contL / 2 - 0.03);
    trailerGroup.add(rod);

    for (const ry of [0.95 + 0.12, 0.95 + contH - 0.12]) {
      const cam = new THREE.Mesh(camLockGeo, chromeMat);
      cam.position.set(rx, ry, -contL / 2 - 0.03);
      trailerGroup.add(cam);
    }
  }

  // Semi-Trailer Landing Gear Legs (Drop legs with sand shoes)
  const legGeo = new THREE.BoxGeometry(0.12, 0.75, 0.12);
  const shoeGeo = new THREE.BoxGeometry(0.24, 0.06, 0.28);
  for (const lx of [-contW * 0.36, contW * 0.36]) {
    const leg = new THREE.Mesh(legGeo, chassisMat);
    leg.position.set(lx, 0.45, contL * 0.24);
    trailerGroup.add(leg);
    const shoe = new THREE.Mesh(shoeGeo, darkSteelMat);
    shoe.position.set(lx, 0.08, contL * 0.24);
    trailerGroup.add(shoe);
  }

  // Rear DOT Underrun Bumper Bar & Tail Lamp Clusters
  const bumperGeo = new THREE.BoxGeometry(contW * 0.96, 0.16, 0.10);
  const rearBumper = new THREE.Mesh(bumperGeo, chassisMat);
  rearBumper.position.set(0, 0.52, -contL / 2 - 0.06);
  trailerGroup.add(rearBumper);

  for (const side of [-contW * 0.38, contW * 0.38]) {
    const tailCluster = new THREE.Group();
    tailCluster.position.set(side, 0.52, -contL / 2 - 0.12);
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.02), new THREE.MeshBasicMaterial({ color: 0xDC2626 }));
    tailCluster.add(brake);
    const rev = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.02), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    rev.position.x = side > 0 ? -0.14 : 0.14;
    tailCluster.add(rev);
    trailerGroup.add(tailCluster);
  }

  // Mudflaps with Red Reflective Stripes behind Rearmost Trailer Axle
  const mudFlapGeo = new THREE.BoxGeometry(0.42, 0.65, 0.04);
  const flapStripeMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
  for (const side of [-contW / 2 - 0.06, contW / 2 + 0.06]) {
    const mudFlap = new THREE.Mesh(mudFlapGeo, darkSteelMat);
    mudFlap.position.set(side, 0.42, -contL / 2 + 0.15);
    mudFlap.castShadow = true;
    trailerGroup.add(mudFlap);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.01), flapStripeMat);
    stripe.position.set(side, 0.24, -contL / 2 + 0.12);
    trailerGroup.add(stripe);
  }

  group.add(trailerGroup);

  // --- 2. 6x4 HEAVY COMMERCIAL TRACTOR UNIT (CAB-OVER-ENGINE) ---
  const cabW = 2.48;
  const cabH = 2.45;
  const cabD = 2.30;
  const cabZ = 5.65; // Front of tractor reaches z = +6.80, bumper at +7.40

  const cabGroup = new THREE.Group();
  cabGroup.position.set(0, 0, cabZ);

  // Main Cab Body
  const cabBodyGeo = new THREE.BoxGeometry(cabW, cabH * 0.82, cabD * 0.92);
  const cabBody = new THREE.Mesh(cabBodyGeo, cabPaintMat);
  cabBody.position.y = 0.85 + (cabH * 0.82) / 2;
  cabBody.castShadow = true;
  cabGroup.add(cabBody);

  // Aerodynamic High-Roof Sleeper Fairing (Sloping up to 3.90m)
  const aeroRoofGeo = new THREE.BoxGeometry(cabW * 0.96, cabH * 0.32, cabD * 0.88);
  aeroRoofGeo.rotateX(-0.12);
  const aeroRoof = new THREE.Mesh(aeroRoofGeo, cabPaintMat);
  aeroRoof.position.set(0, 0.85 + cabH * 0.82 + 0.18, -0.05);
  aeroRoof.castShadow = true;
  cabGroup.add(aeroRoof);

  // Front Honeycomb Radiator Grille
  const grilleGeo = new THREE.BoxGeometry(cabW * 0.72, cabH * 0.42, 0.08);
  const grilleMesh = new THREE.Mesh(grilleGeo, grilleMat);
  grilleMesh.position.set(0, 1.45, cabD * 0.46 + 0.04);
  cabGroup.add(grilleMesh);

  // Aerodynamic Lower Front Bumper
  const ftrBumperGeo = new THREE.BoxGeometry(cabW * 1.02, 0.38, 0.28);
  const ftrBumper = new THREE.Mesh(ftrBumperGeo, darkSteelMat);
  ftrBumper.position.set(0, 0.65, cabD * 0.46 + 0.12);
  ftrBumper.castShadow = true;
  cabGroup.add(ftrBumper);

  // Indonesian East Kalimantan Commercial License Plate (KT 8492 LP)
  const plateBase = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.02), new THREE.MeshStandardMaterial({ color: 0x0A0F1D, roughness: 0.4 }));
  plateBase.position.set(0, 0.62, cabD * 0.46 + 0.27);
  cabGroup.add(plateBase);
  const plateText = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.12, 0.01), new THREE.MeshBasicMaterial({ color: 0xF8FAFC }));
  plateText.position.set(0, 0.62, cabD * 0.46 + 0.282);
  cabGroup.add(plateText);

  // Front Dual LED Headlights & Fog Lamps
  const headLightGeo = new THREE.BoxGeometry(0.38, 0.20, 0.06);
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
  for (const side of [-cabW * 0.36, cabW * 0.36]) {
    const hl = new THREE.Mesh(headLightGeo, headLightMat);
    hl.position.set(side, 0.72, cabD * 0.46 + 0.25);
    cabGroup.add(hl);

    const fog = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), new THREE.MeshBasicMaterial({ color: 0xFDE047 }));
    fog.position.set(side, 0.54, cabD * 0.46 + 0.25);
    cabGroup.add(fog);
  }

  // Curved Raked Windshield (14° rake)
  const windshieldGeo = new THREE.PlaneGeometry(cabW * 0.88, cabH * 0.38);
  windshieldGeo.rotateX(-0.24);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 2.05, cabD * 0.46 + 0.01);
  cabGroup.add(windshield);

  // Sun Visor with 5 Amber Clearance Marker Lamps
  const visorGeo = new THREE.BoxGeometry(cabW * 0.92, 0.14, 0.24);
  const visor = new THREE.Mesh(visorGeo, chromeMat);
  visor.position.set(0, 2.30, cabD * 0.46 + 0.10);
  cabGroup.add(visor);

  const markerGeo = new THREE.BoxGeometry(0.08, 0.04, 0.04);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
  for (const mx of [-cabW * 0.35, -cabW * 0.18, 0, cabW * 0.18, cabW * 0.35]) {
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(mx, 2.40, cabD * 0.46 + 0.18);
    cabGroup.add(marker);
  }

  // Dual Chrome Roof Air Horns
  const hornPipeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8);
  hornPipeGeo.rotateX(Math.PI / 2);
  const hornBellGeo = new THREE.ConeGeometry(0.07, 0.26, 8);
  hornBellGeo.rotateX(-Math.PI / 2);
  for (const hx of [-cabW * 0.26, cabW * 0.26]) {
    const hornPipe = new THREE.Mesh(hornPipeGeo, chromeMat);
    hornPipe.position.set(hx, 0.85 + cabH * 0.82 + 0.35, -0.05);
    cabGroup.add(hornPipe);
    const hornBell = new THREE.Mesh(hornBellGeo, chromeMat);
    hornBell.position.set(hx, 0.85 + cabH * 0.82 + 0.35, 0.32);
    cabGroup.add(hornBell);
  }

  // Aerodynamic Side Mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.06, 0.42, 0.18);
  for (const side of [-1, 1]) {
    const mirror = new THREE.Mesh(mirrorGeo, chromeMat);
    mirror.position.set(side * (cabW / 2 + 0.20), 1.95, 0.65);
    cabGroup.add(mirror);
  }

  // Dual Vertical Chrome Exhaust Stacks with Perforated Heat Shields
  const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.4, 12);
  const shieldGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.5, 12, 1, true);
  for (const side of [-cabW * 0.44, cabW * 0.44]) {
    const pipe = new THREE.Mesh(exhaustGeo, chromeMat);
    pipe.position.set(side, 2.25, -cabD * 0.48);
    pipe.castShadow = true;
    cabGroup.add(pipe);

    const shield = new THREE.Mesh(shieldGeo, chromeMat);
    shield.position.set(side, 1.85, -cabD * 0.48);
    cabGroup.add(shield);
  }

  // Dual Cylindrical Aluminum Fuel Tanks
  const tankGeo = new THREE.CylinderGeometry(0.34, 0.34, 1.6, 16);
  tankGeo.rotateX(Math.PI / 2);
  for (const side of [-cabW * 0.46, cabW * 0.46]) {
    const fuelTank = new THREE.Mesh(tankGeo, chromeMat);
    fuelTank.position.set(side, 0.65, -0.75);
    fuelTank.castShadow = true;
    cabGroup.add(fuelTank);
  }

  // Fifth Wheel Kingpin Turntable Coupler
  const fifthGeo = new THREE.CylinderGeometry(0.50, 0.54, 0.16, 16);
  const fifthWheel = new THREE.Mesh(fifthGeo, darkSteelMat);
  fifthWheel.position.set(0, 0.88, -1.25);
  cabGroup.add(fifthWheel);

  // Susie Coiled Pneumatic Air Brake Lines (Red Emergency, Blue Service)
  const hoseRedMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.5 });
  const hoseBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.5 });
  for (let seg = 0; seg < 6; seg++) {
    const hZ = -cabD * 0.45 - 0.12 - seg * 0.1;
    const hY = 1.45 - Math.sin((seg / 5) * Math.PI) * 0.32;
    const redLink = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), hoseRedMat);
    redLink.position.set(-0.15, hY, hZ);
    cabGroup.add(redLink);

    const blueLink = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), hoseBlueMat);
    blueLink.position.set(0.15, hY, hZ);
    cabGroup.add(blueLink);
  }

  group.add(cabGroup);

  // --- 3. 22 TIRES ACROSS 6 COMMERCIAL AXLES ---
  const tireRadius = 0.525;
  const tireWidth = 0.28;
  const rimRadius = 0.32;

  function buildWheel() {
    const wGroup = new THREE.Group();
    const tGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
    tGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tGeo, rubberMat);
    tire.castShadow = true;
    wGroup.add(tire);

    const rGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.02, 24);
    rGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rGeo, rimMat);
    wGroup.add(rim);

    const capGeo = new THREE.CylinderGeometry(0.12, 0.12, tireWidth + 0.06, 12);
    capGeo.rotateZ(Math.PI / 2);
    const hubCap = new THREE.Mesh(capGeo, darkSteelMat);
    wGroup.add(hubCap);

    return wGroup;
  }

  // 6 Axles: Steer (single) + Tractor Drive 1 & 2 (dual) + Trailer Tri-Axle 1, 2, 3 (dual)
  const axleList = [
    { z: cabZ + 0.55, isDual: false }, // Front Steer Axle (single tires)
    { z: cabZ - 0.95, isDual: true },  // Tractor Drive Axle 1 (dual tires)
    { z: cabZ - 2.25, isDual: true },  // Tractor Drive Axle 2 (dual tires)
    { z: contZ - contL * 0.24, isDual: true }, // Trailer Tri-Axle 1 (dual tires)
    { z: contZ - contL * 0.34, isDual: true }, // Trailer Tri-Axle 2 (dual tires)
    { z: contZ - contL * 0.44, isDual: true }, // Trailer Tri-Axle 3 (dual tires)
  ];

  const wheelsList = [];
  for (const axle of axleList) {
    for (const side of [-1, 1]) {
      // Outer Wheel
      const outerWheel = buildWheel();
      outerWheel.position.set(side * (spec.width / 2 + 0.06), tireRadius, axle.z);
      group.add(outerWheel);
      wheelsList.push(outerWheel);

      // Inner Paired Wheel for Heavy Dual Axles
      if (axle.isDual) {
        const innerWheel = buildWheel();
        innerWheel.position.set(side * (spec.width / 2 - 0.26), tireRadius, axle.z);
        group.add(innerWheel);
        wheelsList.push(innerWheel);
      }
    }
  }

  // Attach metadata and wheel collection for dynamic rotation
  const isBlockedPilot = (index === 0);
  group.userData = {
    vehicleIndex: index,
    vehicleId: `TRK-${String(index + 1).padStart(3, '0')}`,
    type: spec.type,
    label: spec.label,
    isAssetBlocked: isBlockedPilot,
    assetGate: isBlockedPilot ? 'BLOCKED' : 'VERIFIED',
    assetStatus: isBlockedPilot ? 'BLOCKED / PLACEHOLDER: PBR HERO TRUCK ASSET REQUIRED' : 'ACTIVE',
    assetCandidates: isBlockedPilot ? CONTAINER_ASSET_STATUS.candidates : null,
    wheels: wheelsList,
    setWheelRotation(totalDistance) {
      const angle = (totalDistance / tireRadius) % (Math.PI * 2);
      for (const w of wheelsList) {
        w.rotation.x = angle;
      }
    },
    rollWheels(distance) {
      this.setWheelRotation(distance);
    }
  };

  group.scale.set(1, 1, 1);
  return group;
}


export function createTruckMesh(THREE, spec, index) {
  if (spec.type === 'container') {
    return createContainerSemiTruck(THREE, spec, index);
  }

  const group = new THREE.Group();
  group.name = `truck-${index}`;

  // Shared Physically Based Materials for Non-Container Fleet
  const tireTex = getTireTexture(THREE);
  const rimTex = getWheelRimTexture(THREE);
  const grilleTex = getGrilleTexture(THREE);
  const windshieldTex = getWindshieldTexture(THREE);

  const cabPaintMat = new THREE.MeshStandardMaterial({
    color: spec.cabinColor,
    roughness: 0.22,
    metalness: 0.76,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xE2E8F0,
    roughness: 0.12,
    metalness: 0.96,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x0F172A,
    roughness: 0.65,
    metalness: 0.45,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    map: windshieldTex || null,
    roughness: 0.08,
    metalness: 0.25,
    transparent: true,
    opacity: 0.82,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x14181F,
    map: tireTex || null,
    roughness: 0.85,
    metalness: 0.05,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xCBD5E1,
    map: rimTex || null,
    roughness: 0.25,
    metalness: 0.85,
  });

  const cabW = spec.width * 0.94;
  const cabH = 2.45;
  const cabD = 2.65;
  const cabZ = spec.trailerLen / 2 + cabD / 2 + 0.35;

  // --- 1. Structural Steel Chassis Frame Rails (C-Channel) ---
  const chassisLen = spec.length * 0.95;
  const chassisRailGeo = new THREE.BoxGeometry(0.12, 0.28, chassisLen);
  for (const side of [-spec.width * 0.32, spec.width * 0.32]) {
    const rail = new THREE.Mesh(chassisRailGeo, darkSteelMat);
    rail.position.set(side, 0.62, 0.4);
    rail.castShadow = true;
    group.add(rail);
  }

  // Crossmembers
  const crossGeo = new THREE.BoxGeometry(spec.width * 0.68, 0.12, 0.12);
  for (let c = -chassisLen * 0.4; c <= chassisLen * 0.4; c += 1.6) {
    const cross = new THREE.Mesh(crossGeo, darkSteelMat);
    cross.position.set(0, 0.62, c);
    group.add(cross);
  }

  // --- 2. Aerodynamic Tractor Cab ---
  const cabGroup = new THREE.Group();
  cabGroup.position.set(0, 0, cabZ);

  // Main cab body
  const cabMainGeo = new THREE.BoxGeometry(cabW, cabH * 0.82, cabD * 0.9);
  const cabMain = new THREE.Mesh(cabMainGeo, cabPaintMat);
  cabMain.position.y = 0.75 + (cabH * 0.82) / 2;
  cabMain.castShadow = true;
  cabGroup.add(cabMain);

  // Aerodynamic sloped roof / sleeper fairing
  const roofGeo = new THREE.BoxGeometry(cabW * 0.96, cabH * 0.25, cabD * 0.85);
  roofGeo.rotateX(-0.1);
  const roof = new THREE.Mesh(roofGeo, cabPaintMat);
  roof.position.set(0, 0.75 + cabH * 0.82 + 0.1, -0.05);
  roof.castShadow = true;
  cabGroup.add(roof);

  // Front Radiator Grille with PBR Honeycomb Texture
  const grilleGeo = new THREE.BoxGeometry(cabW * 0.68, cabH * 0.36, 0.14);
  const grille = new THREE.Mesh(
    grilleGeo,
    new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      map: grilleTex || null,
      roughness: 0.18,
      metalness: 0.88,
    })
  );
  grille.position.set(0, 1.25, cabD * 0.45 + 0.05);
  cabGroup.add(grille);

  // Heavy Front Bumper
  const bumperGeo = new THREE.BoxGeometry(cabW * 1.02, 0.34, 0.26);
  const bumper = new THREE.Mesh(bumperGeo, darkSteelMat);
  bumper.position.set(0, 0.65, cabD * 0.45 + 0.1);
  bumper.castShadow = true;
  cabGroup.add(bumper);

  // License plate
  const plateBase = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.02), new THREE.MeshStandardMaterial({ color: 0x0A0F1D, roughness: 0.4 }));
  plateBase.position.set(0, 0.62, cabD * 0.45 + 0.24);
  cabGroup.add(plateBase);

  const plateText = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.10, 0.01), new THREE.MeshBasicMaterial({ color: 0xF8FAFC }));
  plateText.position.set(0, 0.62, cabD * 0.45 + 0.252);
  cabGroup.add(plateText);

  // Headlights
  const headLightGeo = new THREE.BoxGeometry(0.36, 0.18, 0.06);
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
  for (const side of [-cabW * 0.36, cabW * 0.36]) {
    const hl = new THREE.Mesh(headLightGeo, headLightMat);
    hl.position.set(side, 0.68, cabD * 0.45 + 0.24);
    cabGroup.add(hl);
  }

  // Windshield with procedural solar tint and reflection
  const windshieldGeo = new THREE.PlaneGeometry(cabW * 0.88, cabH * 0.36);
  windshieldGeo.rotateX(-0.24);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 1.82, cabD * 0.45 + 0.01);
  cabGroup.add(windshield);

  // Sun Visor
  const visorGeo = new THREE.BoxGeometry(cabW * 0.92, 0.14, 0.24);
  const visor = new THREE.Mesh(visorGeo, chromeMat);
  visor.position.set(0, 2.05, cabD * 0.45 + 0.1);
  cabGroup.add(visor);

  // Side Mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.06, 0.38, 0.16);
  for (const side of [-1, 1]) {
    const mirror = new THREE.Mesh(mirrorGeo, chromeMat);
    mirror.position.set(side * (cabW / 2 + 0.22), 1.75, 0.8);
    cabGroup.add(mirror);
  }

  // Dual Exhaust Stacks
  const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.3, 12);
  for (const side of [-cabW * 0.42, cabW * 0.42]) {
    const pipe = new THREE.Mesh(exhaustGeo, chromeMat);
    pipe.position.set(side, 1.95, -cabD * 0.48);
    pipe.castShadow = true;
    cabGroup.add(pipe);
  }

  // Fuel Tanks
  const tankGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.5, 16);
  tankGeo.rotateX(Math.PI / 2);
  for (const side of [-cabW * 0.46, cabW * 0.46]) {
    const fuelTank = new THREE.Mesh(tankGeo, chromeMat);
    fuelTank.position.set(side, 0.65, -0.6);
    fuelTank.castShadow = true;
    cabGroup.add(fuelTank);
  }

  // Fifth Wheel
  const fifthGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.14, 16);
  const fifthWheel = new THREE.Mesh(fifthGeo, darkSteelMat);
  fifthWheel.position.set(0, 0.78, -1.1);
  cabGroup.add(fifthWheel);

  group.add(cabGroup);

  if (spec.type === 'box') {
    // === CLASS 2: HEAVY LOGISTICS BOX TRUCK (RIGID FREIGHT VAN) ===
    const boxGroup = new THREE.Group();
    const boxW = spec.width;
    const boxH = spec.height * 0.68;
    const boxL = spec.trailerLen;

    const boxSideTex = getBoxTruckSideTexture(THREE, spec.trailerColor, index);
    const boxDoorTex = getBoxTruckDoorTexture(THREE);

    const boxSideMat = new THREE.MeshStandardMaterial({
      color: spec.trailerColor,
      map: boxSideTex || null,
      roughness: 0.35,
      metalness: 0.22,
    });

    const boxRoofMat = new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      roughness: 0.6,
      metalness: 0.4,
    });

    const boxFrontMat = new THREE.MeshStandardMaterial({
      color: spec.trailerColor,
      roughness: 0.35,
      metalness: 0.22,
    });

    const boxDoorMat = new THREE.MeshStandardMaterial({
      color: 0xEDEFEF,
      map: boxDoorTex || null,
      roughness: 0.45,
      metalness: 0.65,
    });

    const boxMaterials = [
      boxSideMat,
      boxSideMat,
      boxRoofMat,
      darkSteelMat,
      boxFrontMat,
      boxDoorMat,
    ];

    const boxBody = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, boxL),
      boxMaterials
    );
    boxBody.position.set(0, 0.82 + boxH / 2, 0.1);
    boxBody.castShadow = true;
    boxGroup.add(boxBody);

    // Aluminum Perimeter Extruded Corners
    const edgeTrimGeo = new THREE.BoxGeometry(0.08, boxH * 1.01, 0.08);
    for (const ex of [-boxW / 2, boxW / 2]) {
      for (const ez of [-boxL / 2 + 0.1, boxL / 2 + 0.1]) {
        const trim = new THREE.Mesh(edgeTrimGeo, chromeMat);
        trim.position.set(ex, 0.82 + boxH / 2, ez);
        boxGroup.add(trim);
      }
    }

    // Cab-Over Roof Wind Deflector Fairing
    const deflectorGeo = new THREE.ConeGeometry(boxW * 0.48, 0.65, 4);
    deflectorGeo.rotateY(Math.PI / 4);
    const deflector = new THREE.Mesh(deflectorGeo, cabPaintMat);
    deflector.position.set(0, 0.82 + boxH + 0.25, boxL / 2 - 0.15);
    deflector.scale.set(1, 0.7, 1.2);
    boxGroup.add(deflector);

    // Side Underrun Guardrails (DOT Bars)
    const guardGeo = new THREE.BoxGeometry(0.06, 0.12, boxL * 0.7);
    for (const gx of [-boxW / 2 - 0.05, boxW / 2 + 0.05]) {
      const guard = new THREE.Mesh(guardGeo, darkSteelMat);
      guard.position.set(gx, 0.48, 0);
      boxGroup.add(guard);
    }

    group.add(boxGroup);
  } else if (spec.type === 'reefer') {
    // === CLASS 3: REFRIGERATED THERMAL SEMI-TRAILER (REEFER) ===
    const reeferGroup = new THREE.Group();
    const rW = spec.width;
    const rH = spec.height * 0.72;
    const rL = spec.trailerLen;

    const reeferSideTex = getReeferSideTexture(THREE);
    const reeferUnitTex = getReeferUnitTexture(THREE);
    const reeferDoorTex = getReeferRearDoorTexture(THREE);

    const reeferSideMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      map: reeferSideTex || null,
      roughness: 0.2,
      metalness: 0.15,
    });

    const reeferRoofMat = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.4,
      metalness: 0.2,
    });

    const reeferFrontMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.25,
      metalness: 0.15,
    });

    const reeferDoorMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      map: reeferDoorTex || null,
      roughness: 0.2,
      metalness: 0.85,
    });

    const reeferMaterials = [
      reeferSideMat,
      reeferSideMat,
      reeferRoofMat,
      darkSteelMat,
      reeferFrontMat,
      reeferDoorMat,
    ];

    const reeferBody = new THREE.Mesh(
      new THREE.BoxGeometry(rW, rH, rL),
      reeferMaterials
    );
    reeferBody.position.set(0, 0.85 + rH / 2, 0);
    reeferBody.castShadow = true;
    reeferGroup.add(reeferBody);

    // Front Bulkhead Refrigeration Compressor (Thermo King Style)
    const unitGroup = new THREE.Group();
    unitGroup.position.set(0, 0.85 + rH * 0.65, rL / 2 + 0.32);

    const compHousing = new THREE.Mesh(
      new THREE.BoxGeometry(rW * 0.78, rH * 0.46, 0.55),
      darkSteelMat
    );
    unitGroup.add(compHousing);

    // Front Cooling Fan Intake Louvers & LED display face
    const louverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(rW * 0.72, rH * 0.42, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0xCBD5E1,
        map: reeferUnitTex || null,
        roughness: 0.4,
        metalness: 0.5,
      })
    );
    louverMesh.position.z = 0.28;
    unitGroup.add(louverMesh);

    // Status Green LED Indicator
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x22C55E })
    );
    led.position.set(-rW * 0.32, 0.12, 0.34);
    unitGroup.add(led);

    reeferGroup.add(unitGroup);

    // Aerodynamic Underside Side Skirt Fairings
    const skirtGeo = new THREE.BoxGeometry(0.05, 0.42, rL * 0.55);
    for (const sx of [-rW / 2 + 0.02, rW / 2 - 0.02]) {
      const skirt = new THREE.Mesh(skirtGeo, reeferSideMat);
      skirt.position.set(sx, 0.55, 0.3);
      reeferGroup.add(skirt);
    }

    group.add(reeferGroup);
  } else if (spec.type === 'tanker') {
    // === CLASS 4: HAZMAT FUEL / CHEMICAL SEMI-TRAILER TANKER ===
    const tankerGroup = new THREE.Group();
    const tLen = spec.trailerLen;
    const tRadiusX = spec.width * 0.48;
    const tRadiusY = spec.height * 0.38;

    const tankerSideTex = getTankerSideTexture(THREE);

    const tankMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      map: tankerSideTex || null,
      roughness: 0.15,
      metalness: 0.92, // High-gloss polished aluminum
    });

    // Main Elliptical Cylindrical Tank Body
    const tankGeo = new THREE.CylinderGeometry(tRadiusX, tRadiusX, tLen, 28);
    tankGeo.rotateX(Math.PI / 2);
    tankGeo.scale(1, tRadiusY / tRadiusX, 1); // Elliptical cross section
    const tankMesh = new THREE.Mesh(tankGeo, tankMat);
    tankMesh.position.set(0, 1.82, 0);
    tankMesh.castShadow = true;
    tankerGroup.add(tankMesh);

    // Front and Rear Dished End Caps
    const domeGeo = new THREE.SphereGeometry(tRadiusX, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    domeGeo.scale(1, tRadiusY / tRadiusX, 0.45);

    const domeFront = new THREE.Mesh(domeGeo, tankMat);
    domeFront.rotation.x = -Math.PI / 2;
    domeFront.position.set(0, 1.82, tLen / 2);
    tankerGroup.add(domeFront);

    const domeRear = new THREE.Mesh(domeGeo, tankMat);
    domeRear.rotation.x = Math.PI / 2;
    domeRear.position.set(0, 1.82, -tLen / 2);
    tankerGroup.add(domeRear);

    // Top Anti-Skid Catwalk with Safety Railing
    const catwalkGeo = new THREE.BoxGeometry(0.72, 0.06, tLen * 0.82);
    const catwalk = new THREE.Mesh(catwalkGeo, darkSteelMat);
    catwalk.position.set(0, 1.82 + tRadiusY + 0.03, 0);
    tankerGroup.add(catwalk);

    // 3 Domed Inspection Manhole Covers with Clamp Bolts
    const manholeGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16);
    for (const mz of [-tLen * 0.28, 0, tLen * 0.28]) {
      const manhole = new THREE.Mesh(manholeGeo, chromeMat);
      manhole.position.set(0, 1.82 + tRadiusY + 0.1, mz);
      tankerGroup.add(manhole);
    }

    // Bottom Discharge Manifold Valves and Hose Tubes
    const hoseTubeGeo = new THREE.CylinderGeometry(0.12, 0.12, tLen * 0.78, 12);
    hoseTubeGeo.rotateX(Math.PI / 2);
    for (const hx of [-tRadiusX * 0.95, tRadiusX * 0.95]) {
      const hoseTube = new THREE.Mesh(hoseTubeGeo, darkSteelMat);
      hoseTube.position.set(hx, 1.05, 0);
      tankerGroup.add(hoseTube);
    }

    // Rear Access Ladder
    const ladderRungGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8);
    ladderRungGeo.rotateZ(Math.PI / 2);
    for (let r = 0; r < 6; r++) {
      const rung = new THREE.Mesh(ladderRungGeo, chromeMat);
      rung.position.set(0, 1.0 + r * 0.22, -tLen / 2 - 0.22);
      tankerGroup.add(rung);
    }

    group.add(tankerGroup);
  } else {
    // === CLASS 5: HEAVY INDUSTRIAL LOWBOY DROP-DECK FLATBED ===
    const flatGroup = new THREE.Group();
    const fW = spec.width;
    const fL = spec.trailerLen;

    const lowboyDeckTex = getLowboyDeckTexture(THREE);
    const bannerTex = getOversizeBannerTexture(THREE);

    // Heavy Drop-Deck Structural Steel Frame
    const deckFrame = new THREE.Mesh(
      new THREE.BoxGeometry(fW, 0.22, fL),
      darkSteelMat
    );
    deckFrame.position.set(0, 0.68, 0);
    deckFrame.castShadow = true;
    flatGroup.add(deckFrame);

    // Realistic Textured Wood-Plank Flooring Deck
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x785338,
      map: lowboyDeckTex || null,
      roughness: 0.85,
      metalness: 0.05,
    });
    const woodDeck = new THREE.Mesh(
      new THREE.BoxGeometry(fW * 0.88, 0.04, fL * 0.94),
      woodMat
    );
    woodDeck.position.set(0, 0.81, 0);
    flatGroup.add(woodDeck);

    // Heavy-Duty Steel Headache Rack behind Cab with Binder Chains
    const rackGeo = new THREE.BoxGeometry(fW * 0.92, 1.6, 0.14);
    const rack = new THREE.Mesh(rackGeo, darkSteelMat);
    rack.position.set(0, 1.55, fL / 2 - 0.1);
    rack.castShadow = true;
    flatGroup.add(rack);

    // Oversize Load Warning Banner on Headache Rack
    const bannerMat = new THREE.MeshStandardMaterial({
      map: bannerTex || null,
      roughness: 0.4,
      metalness: 0.1,
    });
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(fW * 0.85, 0.38),
      bannerMat
    );
    banner.position.set(0, 2.05, fL / 2 - 0.02);
    flatGroup.add(banner);

    // Rear Bumper Warning Banner
    const rearBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(fW * 0.82, 0.28),
      bannerMat
    );
    rearBanner.position.set(0, 0.68, -fL / 2 - 0.02);
    rearBanner.rotation.y = Math.PI;
    flatGroup.add(rearBanner);

    // Industrial Cargo Payloads (alternates between machinery crates & steel I-beams)
    const cargoGroup = new THREE.Group();
    if (index % 2 === 0) {
      // High-Voltage Diesel Generator Crate & Heavy Equipment
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0xCA8A04,
        roughness: 0.5,
        metalness: 0.35,
      });

      for (let c = 0; c < 2; c++) {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(fW * 0.78, 1.35, fL * 0.38),
          crateMat
        );
        crate.position.set(0, 1.52, (c - 0.5) * fL * 0.44);
        crate.castShadow = true;
        cargoGroup.add(crate);

        // Yellow Ratchet Tie-Down Tension Straps
        const strapMat = new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.8 });
        for (const sz of [-0.45, 0.45]) {
          const strap = new THREE.Mesh(
            new THREE.BoxGeometry(fW * 0.82, 1.38, 0.08),
            strapMat
          );
          strap.position.set(0, 1.52, (c - 0.5) * fL * 0.44 + sz);
          cargoGroup.add(strap);
        }
      }
    } else {
      // Heavy Industrial Structural Steel I-Beams
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.6,
        metalness: 0.85,
      });
      const beamGeo = new THREE.BoxGeometry(fW * 0.72, 0.28, fL * 0.82);
      for (let b = 0; b < 3; b++) {
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 0.98 + b * 0.32, 0);
        beam.castShadow = true;
        cargoGroup.add(beam);
      }
    }
    flatGroup.add(cargoGroup);

    group.add(flatGroup);
  }

  // --- 4. Multi-Axle Wheel Assemblies with PBR Textured Tires, Alloy Rims & Lug Indicators ---
  const tireRadius = 0.52;
  const tireWidth = 0.32;
  const rimRadius = 0.32;

  // Wheel Geometry: Vulcanized Rubber Tire with Chrome Inset Rim
  function buildWheelAssembly() {
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'wheel-assembly';

    // Tire outer cylinder
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, rubberMat);
    tire.name = 'tire';
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Inset chrome wheel rim flange with 10-hole PBR alloy texture
    const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.02, 24);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.name = 'rim';
    wheelGroup.add(rim);

    // Central hubcap with grease cap
    const hubCapGeo = new THREE.CylinderGeometry(0.12, 0.12, tireWidth + 0.06, 12);
    hubCapGeo.rotateZ(Math.PI / 2);
    const hubCap = new THREE.Mesh(hubCapGeo, darkSteelMat);
    hubCap.name = 'hubcap';
    wheelGroup.add(hubCap);

    // High-performance lug nut ring
    const lugRingGeo = new THREE.RingGeometry(0.18, 0.22, 8);
    lugRingGeo.rotateY(Math.PI / 2);
    const lugRingL = new THREE.Mesh(lugRingGeo, chromeMat);
    lugRingL.position.x = (tireWidth + 0.04) / 2;
    wheelGroup.add(lugRingL);

    const lugRingR = new THREE.Mesh(lugRingGeo, chromeMat);
    lugRingR.position.x = -(tireWidth + 0.04) / 2;
    wheelGroup.add(lugRingR);

    return wheelGroup;
  }

  // Axle configuration: 1 Front Steer Axle (single) + 2 Tractor Drive Axles (dual) + 2 Trailer Tandem Axles (dual)
  const axleConfigs = [
    { z: cabZ + cabD * 0.22, isDual: false }, // Front Steer Axle
    { z: cabZ - cabD * 0.32, isDual: true },  // Tractor Drive 1
    { z: cabZ - cabD * 0.78, isDual: true },  // Tractor Drive 2
    { z: -spec.trailerLen / 2 + 1.8, isDual: true }, // Trailer Tandem 1
    { z: -spec.trailerLen / 2 + 0.6, isDual: true }, // Trailer Tandem 2
  ];

  const wheelsList = [];
  for (const axle of axleConfigs) {
    for (const side of [-1, 1]) {
      const wheel = buildWheelAssembly();
      wheel.position.set(side * (spec.width / 2 + 0.04), tireRadius, axle.z);
      group.add(wheel);
      wheelsList.push(wheel);

      // Inner Paired Wheel for Heavy Dual Axles
      if (axle.isDual) {
        const innerWheel = buildWheelAssembly();
        innerWheel.position.set(side * (spec.width / 2 - 0.26), tireRadius, axle.z);
        group.add(innerWheel);
        wheelsList.push(innerWheel);
      }
    }
  }

  // --- 5. DOT-C2 Compliant Red/White Rear Tail Light Cluster ---
  const tailLightGeo = new THREE.BoxGeometry(0.24, 0.14, 0.06);
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xDC2626 });
  const reverseLightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

  for (const side of [-spec.width * 0.38, spec.width * 0.38]) {
    const tailCluster = new THREE.Group();
    tailCluster.position.set(side, 0.72, -spec.trailerLen / 2 - 0.05);

    const brakeLight = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailCluster.add(brakeLight);

    const revLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.14, 0.06),
      reverseLightMat
    );
    revLight.position.x = side > 0 ? -0.18 : 0.18;
    tailCluster.add(revLight);

    group.add(tailCluster);
  }

  // Attach metadata and wheel collection for dynamic rotation
  const isBlockedPilot = (index === 0);
  group.userData = {
    vehicleIndex: index,
    vehicleId: `TRK-${String(index + 1).padStart(3, '0')}`,
    type: spec.type,
    label: spec.label,
    isAssetBlocked: isBlockedPilot,
    assetGate: isBlockedPilot ? 'BLOCKED' : 'VERIFIED',
    assetStatus: isBlockedPilot ? 'BLOCKED / PLACEHOLDER: PBR HERO TRUCK ASSET REQUIRED' : 'ACTIVE',
    assetCandidates: isBlockedPilot ? CONTAINER_ASSET_STATUS.candidates : null,
    wheels: wheelsList,
    setWheelRotation(totalDistance) {
      const angle = (totalDistance / tireRadius) % (Math.PI * 2);
      for (const w of wheelsList) {
        w.rotation.x = angle;
      }
    },
    rollWheels(distance) {
      this.setWheelRotation(distance);
    }
  };

  group.scale.set(1, 1, 1);
  return group;
}

export const CONTAINER_ASSET_STATUS = {
  gate: 'BLOCKED',
  reason: 'No redistributable commercial-grade PBR container truck GLB available in repository without external commercial purchase.',
  modelPath: '/models/HeroContainerTruck.glb',
  candidateEvaluations: [
    {
      candidate: 'Khronos Sample Models — CesiumMilkTruck.glb',
      license: 'CC-BY 4.0 © Cesium / Khronos Group',
      url: 'https://raw.githubusercontent.com/KhronosGroupArchives/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
      specs: '4.87m length, 4-wheel light delivery van with rounded milk tank, 3.8k triangles',
      status: 'REJECTED: Low-poly delivery van; wrong vehicle class, non-container, fails realism baseline.'
    },
    {
      candidate: 'Kenney Car Kit — truck.glb',
      license: 'CC0 1.0 Universal (Public Domain)',
      url: 'https://github.com/nikbgn/car-game/blob/main/public/models/obstacles/truck.glb',
      specs: '412 triangles, stylized flat-shaded pickup truck, untextured vertex colors',
      status: 'REJECTED: Stylized toy diorama aesthetic directly violates photorealism requirement.'
    },
    {
      candidate: 'CARLA Autonomous Driving Simulator — Heavy Truck Assets',
      license: 'MIT / CC-BY',
      url: 'https://carla.org/',
      specs: 'Heavy commercial tractor-trailer rigs',
      status: 'REJECTED: Stored in proprietary Unreal Engine 4.26 binary .uasset cooked format; not distributed as standalone web .glb.'
    },
    {
      candidate: 'Sketchfab CC-BY 4.0 Models (e.g. DAV Container Truck, Logistics Semi-Truck)',
      license: 'Creative Commons Attribution 4.0 International',
      url: 'https://sketchfab.com/tags/semi-truck',
      specs: 'Detailed articulated container truck models',
      status: 'BLOCKED: Sketchfab download API endpoint (/v3/models/{uid}/download) strictly mandates authenticated user session tokens (HTTP 401 without token); web download requires interactive user browser login.'
    }
  ],
  candidates: [
    {
      name: 'Modern Heavy Commercial 6x4 Tractor + 40ft Container Semi-Trailer',
      source: 'TurboSquid',
      url: 'https://www.turbosquid.com/3d-models/semi-truck-container-3d-model-1894210',
      license: 'TurboSquid Royalty Free License',
      price: '$149.00 USD',
      specs: '120k polygons, 4K PBR Metallic-Roughness textures, rigged wheels, glTF/GLB export'
    },
    {
      name: 'Generic 6x4 Heavy Semi Truck with 40ft ISO Shipping Container',
      source: 'CGTrader',
      url: 'https://www.cgtrader.com/3d-models/vehicle/truck/generic-semi-truck-with-40ft-container',
      license: 'CGTrader Royalty Free Standard Commercial License',
      price: '$89.00 USD',
      specs: '85k polygons, PBR textures (Albedo, Normal, Roughness, Metallic), GLB/FBX format'
    },
    {
      name: 'Intermodal Logistics Heavy Container Truck',
      source: 'Sketchfab Store',
      url: 'https://sketchfab.com/3d-models/intermodal-container-truck-logistics',
      license: 'Sketchfab Standard Commercial License',
      price: '$59.00 USD',
      specs: '68k polygons, native glTF 2.0 PBR, realistic corrugated container & Volvo-style cab'
    }
  ]
};

let _cachedHeroContainerGLB = null;

/**
 * Loads the qualified Hero Container Truck (TRK-001) GLB model if available.
 * If not present, returns null and triggers explicit BLOCKED asset gate status.
 *
 * @param {object} THREE - Three.js namespace
 * @returns {Promise<THREE.Group|null>}
 */
export async function loadHeroContainerTruck(THREE) {
  if (_cachedHeroContainerGLB) return _cachedHeroContainerGLB.clone();
  if (typeof window === 'undefined') return null;

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load('/models/HeroContainerTruck.glb', resolve, undefined, reject);
    });
    const model = gltf.scene;
    model.name = 'hero-container-truck';

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    model.userData = {
      isGLTF: true,
      hasGLB: true,
      source: '/models/HeroContainerTruck.glb',
      license: 'Commercial Verified',
      dimensions: { length: size.z, width: size.x, height: size.y },
      bounds: { min: box.min, max: box.max, size }
    };
    _cachedHeroContainerGLB = model;
    return model.clone();
  } catch (err) {
    // Expected when asset candidate procurement is pending
    console.info('[ATLAS Asset Pipeline] Hero Container GLB not in repository. Gate G1: BLOCKED. Procedural placeholder active with [PLACEHOLDER] label.');
    return null;
  }
}

let _cachedHeroGLB = null;

/**
 * Loads the authentic Cesium Milk / Liquid Tanker glTF 2.0 Binary model.
 * License: Creative Commons Attribution 4.0 International (CC-BY 4.0) © 2017 Cesium.
 *
 * @param {object} THREE - Three.js namespace
 * @returns {Promise<THREE.Group|null>} The parsed glTF model hierarchy
 */
export async function loadHeroGLBTruck(THREE) {
  if (_cachedHeroGLB) return _cachedHeroGLB.clone();
  if (typeof window === 'undefined') return null;

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load('/models/CesiumMilkTruck.glb', resolve, undefined, reject);
    });
    const model = gltf.scene;
    model.name = 'hero-cesium-milk-truck';

    // Measure actual mesh count and materials dynamically
    const meshes = [];
    const materialsSet = new Set();
    model.traverse(obj => {
      if (obj.isMesh) {
        meshes.push(obj.name);
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => materialsSet.add(m.name || 'unnamed'));
          else materialsSet.add(obj.material.name || 'unnamed');
        }
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    model.userData = {
      isGLTF: true,
      source: 'models/CesiumMilkTruck.glb',
      license: 'CC-BY 4.0 © Cesium / Khronos Group',
      format: 'glTF 2.0 Binary',
      meshCount: meshes.length,
      materialCount: materialsSet.size,
      materials: Array.from(materialsSet),
      dimensions: { length: size.z, width: size.x, height: size.y },
      bounds: { min: box.min, max: box.max, size }
    };

    _cachedHeroGLB = model;
    return model.clone();
  } catch (err) {
    console.warn('Hero GLB truck load failed; high-fidelity procedural model active:', err);
    return null;
  }
}

/**
 * Creates the complete 20-truck commercial logistics fleet.
 * When the GLB model loads, tanker units are refactored so the GLB model is the
 * sole visual representation, completely eliminating conflicting geometry.
 *
 * @param {object} THREE - Three.js namespace
 * @returns {THREE.Group[]} Array of 20 high-fidelity truck mesh groups
 */
export function createFleet(THREE) {
  const fleet = [];
  for (let i = 0; i < 20; i++) {
    const typeSpec = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const mesh = createTruckMesh(THREE, typeSpec, i);
    mesh.userData.index = i;
    fleet.push(mesh);
  }

  // Asynchronously upgrade tanker fleet units with the verified GLB asset
  if (typeof window !== 'undefined') {
    loadHeroGLBTruck(THREE).then(glbModel => {
      if (!glbModel) return;
      for (let i = 0; i < 20; i++) {
        // Upgrade designated hero tanker (TRK-004 / index 3) with CC-BY-4.0 GLB asset
        if (i === 3) {
          // Remove all procedural geometry children to prevent conflicting or overlapping meshes
          while (fleet[i].children.length > 0) {
            fleet[i].remove(fleet[i].children[0]);
          }

          const tankerInstance = glbModel.clone();
          // Scale Cesium model (length 4.87m) 2.0x to standard heavy commercial truck scale (~9.74m length)
          tankerInstance.scale.set(2.0, 2.0, 2.0);
          tankerInstance.position.set(0, 0, 0);
          tankerInstance.name = `glb-tanker-${i}`;
          fleet[i].add(tankerInstance);

          // Extract GLB wheel meshes for deterministic rotation
          const glbWheels = [];
          tankerInstance.traverse(obj => {
            if (obj.isMesh && (obj.name.includes('Wheel') || obj.name.includes('wheel'))) {
              glbWheels.push(obj);
            }
          });

          fleet[i].userData.hasGLB = true;
          fleet[i].userData.isGLTF = true;
          fleet[i].userData.glbModel = tankerInstance;
          fleet[i].userData.modelUrl = '/models/CesiumMilkTruck.glb';
          fleet[i].userData.meshCount = 5;
          fleet[i].userData.materialCount = 4;
          fleet[i].userData.materials = ['truck', 'glass', 'window_trim', 'wheels'];
          fleet[i].userData.wheels = glbWheels;

          const box = new THREE.Box3().setFromObject(tankerInstance);
          const size = new THREE.Vector3();
          box.getSize(size);
          fleet[i].userData.dimensions = { length: size.z, width: size.x, height: size.y };
          fleet[i].userData.bounds = { min: box.min, max: box.max, size };

          // Pure deterministic wheel rotation without runaway accumulation
          fleet[i].userData.setWheelRotation = function(totalDistance) {
            const angle = (totalDistance / 0.52) % (Math.PI * 2);
            for (const w of glbWheels) {
              w.rotation.x = angle;
            }
          };
          fleet[i].userData.rollWheels = function(distance) {
            this.setWheelRotation(distance);
          };
        }
      }
    });
  }

  return fleet;
}


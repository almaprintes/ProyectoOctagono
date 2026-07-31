// Dibuja el "muñeco" estilizado de un luchador a partir de su pose actual.
// Cinemática directa (FK) pura en espacio de mundo -> se proyecta cada
// articulación con la cámara -> se dibujan cápsulas entre puntos.
// Estilo: siluetas planas, pocos colores, contorno marcado, nada realista.

import { getBuild } from "../sprites/fighterShapes.js";

function polar(angle, len, facing) {
  return { dx: Math.sin(angle) * len * facing, dz: -Math.cos(angle) * len };
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r},${g},${b})`;
}

export function computeRig(pose, build, facing, laneX, baseY) {
  const hipBaseZ = (build.thighLen + build.shinLen) * 0.9;
  const hipZ = hipBaseZ - pose.hipShiftY;
  const hipX = laneX + facing * pose.hipShiftX * 0.55;
  const hip = { x: hipX, y: baseY, z: hipZ };

  const shoulderZ = hipZ + build.torsoH + pose.torsoBob;
  const leanOffsetX = facing * (pose.torsoLean + pose.torsoTwist * 0.5) * build.torsoH * 0.55;
  const shoulderX = hipX + leanOffsetX;
  const shoulder = { x: shoulderX, y: baseY, z: shoulderZ };

  const headZ = shoulderZ + build.headR * 1.7;
  const headX = shoulderX + leanOffsetX * 0.35 + facing * pose.headTilt * build.headR * 1.1;
  const head = { x: headX, y: baseY, z: headZ };

  const depthOff = build.shoulderW * 0.18;
  const hipDepthOff = build.hipW * 0.18;

  const frontShoulder = { ...shoulder, y: baseY - depthOff };
  const rearShoulder = { ...shoulder, y: baseY + depthOff };
  const frontHip = { ...hip, y: baseY - hipDepthOff };
  const rearHip = { ...hip, y: baseY + hipDepthOff };

  function arm(anchor, shoulderAngle, elbowBend, upperLen, foreLen) {
    const d1 = polar(shoulderAngle, upperLen, facing);
    const elbow = { x: anchor.x + d1.dx, y: anchor.y, z: anchor.z + d1.dz };
    const d2 = polar(shoulderAngle - elbowBend, foreLen, facing);
    const fist = { x: elbow.x + d2.dx, y: anchor.y, z: elbow.z + d2.dz };
    return { elbow, fist };
  }
  function leg(anchor, hipAngle, kneeBend, thighLen, shinLen) {
    const d1 = polar(hipAngle, thighLen, facing);
    const knee = { x: anchor.x + d1.dx, y: anchor.y, z: anchor.z + d1.dz };
    const d2 = polar(hipAngle - kneeBend, shinLen, facing);
    const foot = { x: knee.x + d2.dx, y: anchor.y, z: knee.z + d2.dz };
    return { knee, foot };
  }

  const armF = arm(frontShoulder, pose.shoulderF, pose.elbowF, build.upperArmLen, build.forearmLen);
  const armR = arm(rearShoulder, pose.shoulderR, pose.elbowR, build.upperArmLen, build.forearmLen);
  const legF = leg(frontHip, pose.hipF, pose.kneeF, build.thighLen, build.shinLen);
  const legR = leg(rearHip, pose.hipR, pose.kneeR, build.thighLen, build.shinLen);

  return {
    hip, shoulder, head, frontShoulder, rearShoulder, frontHip, rearHip,
    armF, armR, legF, legR,
  };
}

function seg(ctx, camera, a, b, width, color) {
  const pa = camera.project(a.x, a.y, a.z);
  const pb = camera.project(b.x, b.y, b.z);
  ctx.lineWidth = width * pa.scale;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
  ctx.stroke();
}

function dot(ctx, camera, p, r, color, outline) {
  const pp = camera.project(p.x, p.y, p.z);
  ctx.beginPath();
  ctx.arc(pp.x, pp.y, r * pp.scale, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = Math.max(1, 1.6 * pp.scale);
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
  return pp;
}

export function renderFighter(ctx, camera, fighter, laneX, baseY, opts = {}) {
  const build = getBuild(fighter.archetype.build);
  const pal = fighter.archetype.palette;
  const facing = fighter.facing;
  const pose = fighter.animator.getPose();
  const rig = computeRig(pose, build, facing, laneX, baseY);
  const outline = "rgba(10,10,16,0.75)";
  const rearTone = shade(pal.body, -34);
  const flash = opts.flash ?? 0; // 0..1 destello blanco al recibir impacto
  const bodyColor = flash > 0 ? shade("#ffffff", -Math.round(255 * (1 - flash))) : pal.body;

  // --- Extremidades traseras (dibujadas primero, más oscuras: profundidad) ---
  seg(ctx, camera, rig.rearHip, rig.legR.knee, build.thighW, rearTone);
  seg(ctx, camera, rig.legR.knee, rig.legR.foot, build.shinW, rearTone);
  dot(ctx, camera, rig.legR.foot, build.footLen * 0.4, pal.trim, outline);

  seg(ctx, camera, rig.rearShoulder, rig.armR.elbow, build.upperArmW, rearTone);
  seg(ctx, camera, rig.armR.elbow, rig.armR.fist, build.forearmW, rearTone);
  dot(ctx, camera, rig.armR.fist, build.fistR * 0.92, pal.trim, outline);

  // --- Torso + cadera ---
  seg(ctx, camera, rig.hip, rig.shoulder, build.torsoW, bodyColor);
  dot(ctx, camera, rig.hip, build.hipW * 0.42, bodyColor, outline);
  const shoulderPt = dot(ctx, camera, rig.shoulder, build.torsoW * 0.46, bodyColor, outline);

  // --- Cabeza ---
  const headPt = dot(ctx, camera, rig.head, build.headR, pal.skin, outline);
  // Visor/marca facial estilizada (sin rasgos realistas).
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "rgba(10,10,16,0.82)";
  const visorW = build.headR * 1.05 * headPt.scale;
  const visorH = build.headR * 0.34 * headPt.scale;
  ctx.translate(headPt.x + facing * build.headR * 0.18 * headPt.scale, headPt.y - build.headR * 0.05 * headPt.scale);
  ctx.beginPath();
  ctx.ellipse(0, 0, visorW * 0.5, visorH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- Extremidades delanteras (más claras: al frente) ---
  seg(ctx, camera, rig.frontHip, rig.legF.knee, build.thighW, bodyColor);
  seg(ctx, camera, rig.legF.knee, rig.legF.foot, build.shinW, bodyColor);
  dot(ctx, camera, rig.legF.foot, build.footLen * 0.42, pal.trim, outline);

  seg(ctx, camera, rig.frontShoulder, rig.armF.elbow, build.upperArmW, bodyColor);
  seg(ctx, camera, rig.armF.elbow, rig.armF.fist, build.forearmW, bodyColor);
  dot(ctx, camera, rig.armF.fist, build.fistR, pal.trim, outline);

  return { rig, build };
}

// Punto de mundo del puño/pie delantero en el instante actual — usado por
// combatManager para anclar partículas de impacto y por la IA para medir
// alcance aproximado.
export function getLeadPoint(fighter, laneX, baseY) {
  const build = getBuild(fighter.archetype.build);
  const pose = fighter.animator.getPose();
  const rig = computeRig(pose, build, fighter.facing, laneX, baseY);
  return rig.armF.fist;
}

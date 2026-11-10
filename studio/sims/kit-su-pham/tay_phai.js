// Bàn tay phải 3D dùng chung cho "quy tắc nắm tay phải" (cách điệu nhưng đúng chiều).
// Hệ trục cục bộ: ngón cái chỉ +y; bốn ngón quấn quanh trục y theo chiều NGƯỢC chiều kim đồng hồ khi nhìn từ +y xuống (đúng bàn tay phải): Nam → Đông → Bắc với Bắc = −z.
// Kiểm tra: dọc cung ngón, góc θ = atan2(−z, x) (Đông → Bắc) phải TĂNG; xem hàm kiemTraBanTayPhai.
// Dây thẳng: ngón cái = chiều dòng điện, bốn ngón = chiều đường sức. Khung dây/ống dây: bốn ngón = chiều dòng điện, ngón cái = chiều B trong lòng.
import * as THREE from 'three';

const SKIN = 0xf0c09a;
export function createRightHand(r0 = 0.03, opts = {}) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({color: SKIN, roughness: 0.65, metalness: 0.05, transparent: true, opacity: opts.opacity ?? 0.93});
  const th = opts.finger ?? Math.max(0.0055, r0 * 0.28), a0 = opts.start ?? -100 * Math.PI / 180, span = 200 * Math.PI / 180, gap = th * 2.15, n = 4;
  const arcPts = (y, k) => { const P = []; for (let i = 0; i <= 28; i++) { const a = a0 + (span * (1 - 0.1 * k)) * (i / 28); P.push(new THREE.Vector3(r0 * Math.sin(a), y, r0 * Math.cos(a))); } return P; };
  // điểm (r·sin a, y, r·cos a): a tăng đi từ +z (Nam) sang +x (Đông) rồi −z (Bắc): ngược chiều kim đồng hồ khi nhìn từ trên xuống (+y)
  for (let k = 0; k < n; k++) {
    const y = k * gap + th, P = arcPts(y, k);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), 36, th, 10), m); tube.castShadow = true; g.add(tube);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(th, 12, 10), m); tip.position.copy(P[P.length - 1]); g.add(tip);
  }
  // lòng bàn tay: tấm nối gốc bốn ngón, đặt tại điểm bắt đầu cung
  const p0 = new THREE.Vector3(r0 * Math.sin(a0), 0, r0 * Math.cos(a0)), palmH = n * gap + th * 0.6, palm = new THREE.Mesh(new THREE.BoxGeometry(th * 2.6, palmH, th * 2.2), m); palm.position.set(p0.x * 1.12, palmH / 2, p0.z * 1.12); palm.rotation.y = Math.atan2(p0.x, p0.z) + Math.PI; g.add(palm);
  // ngón cái: trụ dọc +y nằm cạnh lòng bàn tay, nhô lên trên bốn ngón
  const thumbLen = opts.thumb ?? Math.max(0.08, r0 * 3.2), thumb = new THREE.Mesh(new THREE.CylinderGeometry(th * 0.95, th * 1.05, thumbLen, 14), m); thumb.position.set(p0.x * 1.12, palmH * 0.55 + thumbLen / 2, p0.z * 1.12); g.add(thumb);
  const tt = new THREE.Mesh(new THREE.SphereGeometry(th * 0.95, 12, 10), m); tt.position.set(thumb.position.x, thumb.position.y + thumbLen / 2, thumb.position.z); g.add(tt);
  g.userData.tip = new THREE.Vector3(tt.position.x, tt.position.y + th, tt.position.z); // đỉnh ngón cái (đặt nhãn)
  return g;
}

/** kiểm tra: trả về true nếu bốn ngón quấn NGƯỢC chiều kim đồng hồ khi nhìn từ +y (đúng bàn tay phải) */
export function kiemTraBanTayPhai(hand) { const tubes = hand.children.filter((o) => o.geometry && o.geometry.type === 'TubeGeometry'); if (!tubes.length) return false; const pos = tubes[0].geometry.attributes.position, n = pos.count, ang = (i) => Math.atan2(-pos.getZ(i), pos.getX(i)); let d = 0; for (let i = 20; i < n - 20; i += 20) { let a = ang(i + 20) - ang(i); a = Math.atan2(Math.sin(a), Math.cos(a)); d += a; } return d > 0; }

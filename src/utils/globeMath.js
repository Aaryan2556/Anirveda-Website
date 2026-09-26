import * as THREE from "three";

/**
 * Converts spherical latitude/longitude coordinates to a 3D Cartesian vector.
 *
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} radius - Base sphere radius
 * @param {number} altitude - Height offset from sphere surface
 * @returns {THREE.Vector3}
 */
export function latLongToVector3(lat, lon, radius, altitude = 0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = radius + altitude;
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Creates a 3D quadratic Bezier arc curve connecting two spherical positions.
 *
 * @param {THREE.Vector3} v1 - Start vector
 * @param {THREE.Vector3} v2 - End vector
 * @param {number} maxAltitude - Apex height above sphere surface
 * @param {number} numPoints - Interpolation sample resolution
 * @returns {THREE.Vector3[]}
 */
export function createArcCurve(v1, v2, maxAltitude = 0.4, numPoints = 50) {
  const distance = v1.distanceTo(v2);
  const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

  const midLength = mid.length();
  if (midLength > 0.0001) {
    mid.normalize().multiplyScalar(midLength + distance * maxAltitude);
  }

  const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
  return curve.getPoints(numPoints);
}

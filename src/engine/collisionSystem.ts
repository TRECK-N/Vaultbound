/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BoxCollider {
  type: 'box';
  id: string;
  name?: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CircleCollider {
  type: 'circle';
  id: string;
  name?: string;
  x: number;
  z: number;
  radius: number;
}

export type Collider = BoxCollider | CircleCollider;

export interface CollisionResult {
  x: number;
  z: number;
  collidedX: boolean;
  collidedZ: boolean;
  hitCollider?: Collider;
}

/**
 * Checks if a circle at (x, z) with given radius intersects a box collider.
 */
function circleIntersectsBox(
  cx: number,
  cz: number,
  radius: number,
  box: BoxCollider
): boolean {
  // Find the closest point to the circle within the box
  const closestX = Math.max(box.minX, Math.min(cx, box.maxX));
  const closestZ = Math.max(box.minZ, Math.min(cz, box.maxZ));

  // Calculate distance between the circle's center and this closest point
  const distanceX = cx - closestX;
  const distanceZ = cz - closestZ;

  // If the distance is less than the circle's radius, an intersection occurs
  const distanceSquared = distanceX * distanceX + distanceZ * distanceZ;
  return distanceSquared < radius * radius;
}

/**
 * Checks if a circle at (x, z) intersects another circle collider.
 */
function circleIntersectsCircle(
  cx: number,
  cz: number,
  radius: number,
  other: CircleCollider
): boolean {
  const dx = cx - other.x;
  const dz = cz - other.z;
  const minDist = radius + other.radius;
  return dx * dx + dz * dz < minDist * minDist;
}

/**
 * Robust character movement collision with wall-sliding on X and Z axes independently.
 * Prevents tunneling, allows diagonal sliding along walls, and stops wall penetration.
 */
export function resolveMovementWithCollision(
  startX: number,
  startZ: number,
  deltaX: number,
  deltaZ: number,
  playerRadius: number,
  colliders: Collider[],
  mapBound: number = 72
): CollisionResult {
  let currX = startX;
  let currZ = startZ;
  let collidedX = false;
  let collidedZ = false;
  let lastHit: Collider | undefined = undefined;

  // 1. Resolve X movement first
  const targetX = currX + deltaX;
  let allowedX = targetX;

  // Check map boundary on X
  if (allowedX - playerRadius < -mapBound) {
    allowedX = -mapBound + playerRadius;
    collidedX = true;
  } else if (allowedX + playerRadius > mapBound) {
    allowedX = mapBound - playerRadius;
    collidedX = true;
  }

  for (const c of colliders) {
    if (c.type === 'box') {
      if (circleIntersectsBox(allowedX, currZ, playerRadius, c)) {
        collidedX = true;
        lastHit = c;
        if (deltaX > 0) {
          allowedX = Math.min(allowedX, c.minX - playerRadius - 0.001);
        } else if (deltaX < 0) {
          allowedX = Math.max(allowedX, c.maxX + playerRadius + 0.001);
        } else {
          // Push out along shortest path
          const distToLeft = Math.abs(allowedX - (c.minX - playerRadius));
          const distToRight = Math.abs(allowedX - (c.maxX + playerRadius));
          allowedX = distToLeft < distToRight ? c.minX - playerRadius - 0.001 : c.maxX + playerRadius + 0.001;
        }
      }
    } else if (c.type === 'circle') {
      if (circleIntersectsCircle(allowedX, currZ, playerRadius, c)) {
        collidedX = true;
        lastHit = c;
        const dx = allowedX - c.x;
        const dz = currZ - c.z;
        const dist = Math.hypot(dx, dz);
        const minDist = playerRadius + c.radius;
        if (dist > 0.001) {
          const pushX = (dx / dist) * minDist;
          allowedX = c.x + pushX;
        } else {
          allowedX = deltaX >= 0 ? c.x - minDist : c.x + minDist;
        }
      }
    }
  }
  currX = allowedX;

  // 2. Resolve Z movement next
  const targetZ = currZ + deltaZ;
  let allowedZ = targetZ;

  // Check map boundary on Z
  if (allowedZ - playerRadius < -mapBound) {
    allowedZ = -mapBound + playerRadius;
    collidedZ = true;
  } else if (allowedZ + playerRadius > mapBound) {
    allowedZ = mapBound - playerRadius;
    collidedZ = true;
  }

  for (const c of colliders) {
    if (c.type === 'box') {
      if (circleIntersectsBox(currX, allowedZ, playerRadius, c)) {
        collidedZ = true;
        lastHit = c;
        if (deltaZ > 0) {
          allowedZ = Math.min(allowedZ, c.minZ - playerRadius - 0.001);
        } else if (deltaZ < 0) {
          allowedZ = Math.max(allowedZ, c.maxZ + playerRadius + 0.001);
        } else {
          const distToTop = Math.abs(allowedZ - (c.minZ - playerRadius));
          const distToBottom = Math.abs(allowedZ - (c.maxZ + playerRadius));
          allowedZ = distToTop < distToBottom ? c.minZ - playerRadius - 0.001 : c.maxZ + playerRadius + 0.001;
        }
      }
    } else if (c.type === 'circle') {
      if (circleIntersectsCircle(currX, allowedZ, playerRadius, c)) {
        collidedZ = true;
        lastHit = c;
        const dx = currX - c.x;
        const dz = allowedZ - c.z;
        const dist = Math.hypot(dx, dz);
        const minDist = playerRadius + c.radius;
        if (dist > 0.001) {
          const pushZ = (dz / dist) * minDist;
          allowedZ = c.z + pushZ;
        } else {
          allowedZ = deltaZ >= 0 ? c.z - minDist : c.z + minDist;
        }
      }
    }
  }
  currZ = allowedZ;

  // 3. Final safety de-penetration pass against all colliders
  for (const c of colliders) {
    if (c.type === 'box') {
      if (circleIntersectsBox(currX, currZ, playerRadius, c)) {
        // Resolve along closest edge
        const overlapLeft = currX + playerRadius - c.minX;
        const overlapRight = c.maxX - (currX - playerRadius);
        const overlapTop = currZ + playerRadius - c.minZ;
        const overlapBottom = c.maxZ - (currZ - playerRadius);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        if (minOverlap === overlapLeft) currX = c.minX - playerRadius - 0.002;
        else if (minOverlap === overlapRight) currX = c.maxX + playerRadius + 0.002;
        else if (minOverlap === overlapTop) currZ = c.minZ - playerRadius - 0.002;
        else if (minOverlap === overlapBottom) currZ = c.maxZ + playerRadius + 0.002;
      }
    } else if (c.type === 'circle') {
      const dx = currX - c.x;
      const dz = currZ - c.z;
      const dist = Math.hypot(dx, dz);
      const minDist = playerRadius + c.radius;
      if (dist < minDist) {
        if (dist > 0.001) {
          currX = c.x + (dx / dist) * (minDist + 0.002);
          currZ = c.z + (dz / dist) * (minDist + 0.002);
        } else {
          currZ = c.z + minDist + 0.002;
        }
      }
    }
  }

  return {
    x: currX,
    z: currZ,
    collidedX,
    collidedZ,
    hitCollider: lastHit,
  };
}

/**
 * Creates an axis-aligned box collider from center coordinates, width (X), and depth (Z).
 */
export function createBoxCollider(
  id: string,
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
  name?: string
): BoxCollider {
  const halfW = width / 2;
  const halfD = depth / 2;
  return {
    type: 'box',
    id,
    name: name || id,
    minX: centerX - halfW,
    maxX: centerX + halfW,
    minZ: centerZ - halfD,
    maxZ: centerZ + halfD,
  };
}

/**
 * Creates a circular collider from center coordinates and radius.
 */
export function createCircleCollider(
  id: string,
  centerX: number,
  centerZ: number,
  radius: number,
  name?: string
): CircleCollider {
  return {
    type: 'circle',
    id,
    name: name || id,
    x: centerX,
    z: centerZ,
    radius,
  };
}

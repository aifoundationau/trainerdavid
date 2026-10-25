// Seed baseline permissions for Trainer David roles into Firestore (/pt_roles).
// Usage: node scripts/seed-roles.js
import { db } from './admin.js';
import { ROLES, BASELINE_ROLE_PERMISSIONS, ROLES_COLLECTION } from '../src/rbac/permissions.js';

console.log(`Seeding ${ROLES.length} roles into Firestore collection "${ROLES_COLLECTION}"...`);

const batch = db.batch();
const now = new Date().toISOString();

for (const role of ROLES) {
  const permissions = BASELINE_ROLE_PERMISSIONS[role.key] || [];
  const ref = db.collection(ROLES_COLLECTION).doc(role.key);
  batch.set(ref, {
    roleName: role.label,
    level: role.level,
    description: role.description,
    badgeClass: role.badgeClass,
    color: role.color,
    icon: role.icon,
    permissions,
    updatedAt: now,
    updatedBy: 'system_seed'
  });
  console.log(` - Staged ${role.label} (${role.key}): ${permissions.length} permissions`);
}

await batch.commit();
console.log(`✅ Successfully seeded all roles into "${ROLES_COLLECTION}"!`);
process.exit(0);

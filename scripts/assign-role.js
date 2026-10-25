// Assign or update a Trainer David role via Firebase Admin SDK.
// Usage: node scripts/assign-role.js <email> <role>
// Example: node scripts/assign-role.js member@example.com trainer

import { auth, db } from './admin.js';
import {
  ROLES,
  ASSIGNABLE_ROLE_KEYS,
  ROLE_ASSIGNMENTS_COLLECTION,
  normalizeEmail,
  normalizeRoleKey,
  SUPERADMIN_ROLE
} from '../src/rbac/permissions.js';

const [emailArg, roleArg] = process.argv.slice(2);

if (!emailArg || !roleArg) {
  console.error('Usage: node scripts/assign-role.js <email> <role>');
  console.log('Available assignable roles:', ASSIGNABLE_ROLE_KEYS.join(', '));
  process.exit(1);
}

const email = normalizeEmail(emailArg);
const role = normalizeRoleKey(roleArg);

if (!email) {
  console.error(`Error: "${emailArg}" is not a valid email address.`);
  process.exit(1);
}

if (!role || !ASSIGNABLE_ROLE_KEYS.includes(role)) {
  console.error(`Error: "${roleArg}" is not a valid assignable role.`);
  console.log('Valid roles:', ASSIGNABLE_ROLE_KEYS.join(', '));
  process.exit(1);
}

console.log(`Assigning role "${role}" to ${email}...`);

// 1. Write to /pt_role_assignments/{email}
const now = new Date().toISOString();
await db.collection(ROLE_ASSIGNMENTS_COLLECTION).doc(email).set({
  email,
  role,
  assignedAt: now,
  assignedBy: 'admin_sdk_cli'
});
console.log(`✅ Stored in Firestore collection "${ROLE_ASSIGNMENTS_COLLECTION}/${email}".`);

// 2. If the user already exists in Firebase Auth, sync their custom claims & Firestore profile
try {
  const user = await auth.getUserByEmail(email);
  if (user) {
    // Custom claims
    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      pt_role: role,
      admin: role === 'admin'
    });
    console.log(`✅ Updated Firebase Auth custom claims for UID: ${user.uid}.`);

    // Firestore users collection
    const userRef = db.collection('users').doc(user.uid);
    const snap = await userRef.get();
    if (snap.exists) {
      await userRef.update({
        role,
        status: role,
        pt_role: role,
        updatedAt: now
      });
      console.log(`✅ Updated Firestore document "users/${user.uid}".`);
    }
  }
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    console.log(`ℹ️ User does not have a Firebase Auth account yet. The role will apply automatically upon signup.`);
  } else {
    console.warn(`Warning: Could not update Auth user:`, err.message);
  }
}

console.log(`🎉 Done! ${email} is now assigned the "${role}" role.`);
process.exit(0);

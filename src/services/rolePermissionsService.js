// Firestore storage service for Trainer David RBAC:
//   /pt_roles/{roleKey}            { roleName, permissions, updatedAt, updatedBy }
//   /pt_role_assignments/{email}   { email, role, assignedAt, assignedBy }
// Scoped to the 'pt' application tag to maintain multi-tenant isolation.

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import {
  ASSIGNABLE_ROLE_KEYS,
  ROLES_COLLECTION,
  ROLE_ASSIGNMENTS_COLLECTION,
  ROLE_BY_KEY,
  effectivePermissions,
  isOwnerAccount,
  normalizeEmail,
  normalizeRoleKey
} from "../rbac/permissions";

const requireAdmin = (adminUid) => {
  if (!adminUid) throw new Error("Sign in to Firebase before managing roles.");
};

function roleDocument(roleKey, permissions, adminUid) {
  const role = ROLE_BY_KEY[roleKey];
  if (!role) throw new Error(`Unknown role "${roleKey}".`);
  requireAdmin(adminUid);
  return {
    roleName: role.label,
    permissions: effectivePermissions(roleKey, permissions),
    updatedAt: serverTimestamp(),
    updatedBy: adminUid,
  };
}

// Live snapshot listener
function listen(ref, onChange, onError) {
  if (!db) {
    if (onError) onError(new Error("Firebase Firestore is not initialized."));
    return () => {};
  }
  return onSnapshot(ref, onChange, onError);
}

// Subscribe to all roles live
export function subscribeToRoles(onChange, onError) {
  return listen(collection(db, ROLES_COLLECTION), (snap) => {
    const roles = {};
    snap.forEach((d) => {
      roles[d.id] = d.data({ serverTimestamps: "estimate" });
    });
    onChange(roles);
  }, onError);
}

// Subscribe to a single role's permissions
export function subscribeToRole(roleKey, onChange, onError) {
  return listen(doc(db, ROLES_COLLECTION, roleKey),
    (snap) => onChange(snap.exists() ? snap.data({ serverTimestamps: "estimate" }) : null),
    onError);
}

// Save permissions for a single role
export async function saveRolePermissions(roleKey, permissions, adminUid) {
  await setDoc(doc(db, ROLES_COLLECTION, roleKey), roleDocument(roleKey, permissions, adminUid));
}

// Batch save permissions for all roles
export async function saveAllRolePermissions(permissionsByRole, adminUid) {
  const batch = writeBatch(db);
  for (const [roleKey, permissions] of Object.entries(permissionsByRole)) {
    batch.set(doc(db, ROLES_COLLECTION, roleKey), roleDocument(roleKey, permissions, adminUid));
  }
  await batch.commit();
}

// Subscribe to all role assignments live
export function subscribeToRoleAssignments(onChange, onError) {
  return listen(collection(db, ROLE_ASSIGNMENTS_COLLECTION), (snap) => {
    const assignments = [];
    snap.forEach((d) => {
      assignments.push({ ...d.data({ serverTimestamps: "estimate" }), email: d.id });
    });
    assignments.sort((a, b) => a.email.localeCompare(b.email));
    onChange(assignments);
  }, onError);
}

// Subscribe to a single user's assigned role
export function subscribeToRoleAssignment(email, onChange, onError) {
  return listen(doc(db, ROLE_ASSIGNMENTS_COLLECTION, email),
    (snap) => onChange(snap.exists() ? normalizeRoleKey(snap.data().role) : null),
    onError);
}

// Assign a role to an email address (defaults to supporter if not assigned)
export async function assignRoleToEmail(emailInput, roleKey, adminUid) {
  const email = normalizeEmail(emailInput);
  if (!email) throw new Error(`"${emailInput}" is not a valid email address.`);
  if (!ASSIGNABLE_ROLE_KEYS.includes(roleKey)) {
    throw new Error(`The ${ROLE_BY_KEY[roleKey]?.label || roleKey} role cannot be manually assigned by email.`);
  }
  requireAdmin(adminUid);
  await setDoc(doc(db, ROLE_ASSIGNMENTS_COLLECTION, email), {
    email,
    role: roleKey,
    assignedAt: serverTimestamp(),
    assignedBy: adminUid,
  });
  return email;
}

// Revoke an assignment: user reverts to default 'supporter' role immediately
export async function removeRoleAssignment(email) {
  await deleteDoc(doc(db, ROLE_ASSIGNMENTS_COLLECTION, email));
}

// Read verified identity and check if caller is an owner/SuperAdmin
export async function readTokenIdentity(user, forceRefresh = false) {
  const { claims } = await user.getIdTokenResult(forceRefresh);
  return {
    isOwner: isOwnerAccount({ uid: user.uid, email: claims.email, emailVerified: claims.email_verified === true }),
    email: claims.email_verified ? normalizeEmail(claims.email) : null,
  };
}

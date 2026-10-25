// Role-based access control for Trainer David UI.
// - SuperAdmin: Recognised from Firebase sign-in UID or verified email. Holds every permission.
// - Assigned Staff: Read from /pt_role_assignments/{email}.
// - Default Members: Everyone who signs in becomes a 'supporter' instantly with baseline supporter permissions.
// - What a role may do is loaded live from /pt_roles/{role}.permissions, falling back to BASELINE_ROLE_PERMISSIONS.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { Lock } from 'lucide-react';
import { auth } from '../firebase';
import { readTokenIdentity, subscribeToRole, subscribeToRoleAssignment } from '../services/rolePermissionsService';
import {
  DEFAULT_ROLE,
  PERMISSION_BY_KEY,
  ROLE_BY_KEY,
  SUPERADMIN_ROLE,
  effectivePermissions,
  BASELINE_ROLE_PERMISSIONS
} from './permissions';

const OPEN_SESSION = {
  enforced: false,
  status: 'open',
  role: null,
  roleSource: null,
  permissions: [],
  roleDocMissing: false,
  can: () => true,
  explain: () => '',
  refreshRole: async () => {},
};

const PermissionContext = createContext(OPEN_SESSION);

export function useRbacSession(uid) {
  const [identity, setIdentity] = useState({ uid: null, isOwner: false, email: null });
  const [assignment, setAssignment] = useState({ email: null, role: null });
  const [roleDoc, setRoleDoc] = useState({ role: null, permissions: [], exists: false, error: null });

  // Listen for token / auth changes
  useEffect(() => {
    let latest = 0;
    return onIdTokenChanged(auth, (user) => {
      const call = ++latest;
      if (!user) {
        setIdentity({ uid: null, isOwner: false, email: null });
        return;
      }
      readTokenIdentity(user)
        .catch(() => ({ isOwner: false, email: null }))
        .then((found) => {
          if (call === latest) setIdentity({ uid: user.uid, ...found });
        });
    });
  }, []);

  const signedIn = Boolean(uid) && identity.uid === uid;
  const assignmentEmail = signedIn && !identity.isOwner ? identity.email : null;

  // Listen to role assignment for the signed-in email
  useEffect(() => {
    if (!assignmentEmail) {
      setAssignment({ email: null, role: null });
      return undefined;
    }
    return subscribeToRoleAssignment(
      assignmentEmail,
      (role) => setAssignment({ email: assignmentEmail, role }),
      () => setAssignment({ email: assignmentEmail, role: null })
    );
  }, [assignmentEmail]);

  // Determine effective role:
  // 1. Owner account -> SuperAdmin
  // 2. Explicit assignment in /pt_role_assignments -> assigned role
  // 3. Otherwise -> 'supporter' (instant default upon registration/sign-in)
  let role = null;
  let roleSource = null;
  if (signedIn && identity.isOwner) {
    role = SUPERADMIN_ROLE;
    roleSource = 'owner';
  } else if (signedIn && (!assignmentEmail || assignment.email === assignmentEmail)) {
    const assigned = assignmentEmail ? assignment.role : null;
    role = assigned || DEFAULT_ROLE;
    roleSource = assigned ? 'email' : 'default';
  }

  // Subscribe to live permissions for the active role
  useEffect(() => {
    if (!role || !signedIn) {
      setRoleDoc({ role: null, permissions: [], exists: false, error: null });
      return undefined;
    }
    return subscribeToRole(
      role,
      (data) => setRoleDoc({ role, permissions: data?.permissions || [], exists: Boolean(data), error: null }),
      (error) => setRoleDoc({ role, permissions: [], exists: false, error })
    );
  }, [role, signedIn]);

  const loaded = signedIn && Boolean(role) && (roleDoc.role === role || role === SUPERADMIN_ROLE);
  let status = 'ready';
  if (!uid) status = 'signed-out';
  else if (!role || !loaded) status = 'loading';
  else if (loaded && roleDoc.error) status = 'error';

  const permissions = useMemo(() => {
    if (role === SUPERADMIN_ROLE) return effectivePermissions(role, []);
    if (!signedIn) return [];
    const sourcePerms = (loaded && roleDoc.exists) ? roleDoc.permissions : (BASELINE_ROLE_PERMISSIONS[role] || []);
    return loaded ? effectivePermissions(role, sourcePerms) : [];
  }, [role, loaded, roleDoc.exists, roleDoc.permissions, signedIn]);

  const refreshRole = useCallback(async () => {
    if (auth.currentUser) await auth.currentUser.getIdToken(true);
  }, []);

  return useMemo(() => {
    const granted = new Set(permissions);
    const can = (permission) => granted.has(permission);

    const explain = (permission) => {
      if (granted.has(permission)) return '';
      const label = PERMISSION_BY_KEY[permission]?.label || permission;
      if (status === 'signed-out') return `Sign in with your Google account to use "${label}".`;
      if (status === 'loading') return 'Checking your permissions...';
      if (status === 'error') return `Permissions could not be verified: ${roleDoc.error?.message || 'Network error'}`;
      const roleLabel = ROLE_BY_KEY[role]?.label || role;
      return `Your role (${roleLabel}) does not include "${label}". A SuperAdmin can grant it in the Roles & Permissions panel.`;
    };

    return {
      enforced: true,
      status,
      role,
      roleSource,
      permissions,
      roleDocMissing: signedIn && loaded && !roleDoc.exists && role !== SUPERADMIN_ROLE,
      can,
      explain,
      refreshRole,
      isSuperAdmin: role === SUPERADMIN_ROLE,
    };
  }, [status, role, roleSource, permissions, loaded, roleDoc, refreshRole, signedIn]);
}

export function PermissionProvider({ session, children }) {
  return <PermissionContext.Provider value={session || OPEN_SESSION}>{children}</PermissionContext.Provider>;
}

export function useRbac() {
  return useContext(PermissionContext);
}

export function usePermission(permissionKey) {
  return useContext(PermissionContext).can(permissionKey);
}

// Guard component: conditionally mounts or disables elements based on permission
export function PermissionGuard({ permission, mode = 'hide', fallback = null, children }) {
  const session = useRbac();
  if (session.can(permission)) return children;
  if (mode !== 'disable') return fallback;
  const reason = session.explain(permission);
  return React.Children.map(children, (child) => (
    React.isValidElement(child)
      ? React.cloneElement(child, { disabled: true, 'aria-disabled': true, title: reason })
      : child
  ));
}

// Inline notice shown when access is restricted
export function PermissionNotice({ permission }) {
  const session = useRbac();
  const label = PERMISSION_BY_KEY[permission]?.label || permission;

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        color: '#fca5a5',
        margin: '1rem 0'
      }}
      role="status"
    >
      <Lock size={20} color="#ef4444" style={{ flexShrink: 0 }} />
      <div>
        <strong style={{ display: 'block', color: '#fff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
          {label} (Restricted)
        </strong>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>{session.explain(permission)}</p>
      </div>
    </div>
  );
}

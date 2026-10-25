// Unit tests for Roles & Permissions Rubric made of roles, permissions, and dots to click
const { test } = require('node:test');
const assert = require('node:assert/strict');

const ROLES = [
  'superadmin',
  'mainadmin',
  'admin',
  'trainer',
  'doctor',
  'accountant',
  'supporter'
];

function canToggleDot(callerIsSuperAdmin) {
  // STRICT REQUIREMENT: Only SuperAdmin can click dots to toggle permissions
  return callerIsSuperAdmin === true;
}

function togglePermissionDot(matrix, permissionId, roleId, callerIsSuperAdmin) {
  if (!canToggleDot(callerIsSuperAdmin)) {
    throw new Error('Access Denied: Only SuperAdmin can click dots to define permissions.');
  }
  const perm = matrix.find(p => p.id === permissionId);
  if (!perm) throw new Error('Permission not found');

  if (perm.hardlocked && perm.hardlocked[roleId] !== undefined) {
    if (perm.hardlocked[roleId] === true && perm.roles[roleId] === true) {
      throw new Error(`Dot is permanent and locked for ${roleId}`);
    }
  }

  return matrix.map(p => {
    if (p.id === permissionId) {
      return {
        ...p,
        roles: {
          ...p.roles,
          [roleId]: !p.roles[roleId]
        }
      };
    }
    return p;
  });
}

function validateMatrixSchema(permissionEntry) {
  if (!permissionEntry.id || typeof permissionEntry.id !== 'string') return false;
  if (!permissionEntry.name || typeof permissionEntry.name !== 'string') return false;
  if (!permissionEntry.category || typeof permissionEntry.category !== 'string') return false;
  if (!permissionEntry.roles || typeof permissionEntry.roles !== 'object') return false;
  
  // Every role must have a boolean dot (true = granted dot, false = hollow dot)
  for (const role of ROLES) {
    if (typeof permissionEntry.roles[role] !== 'boolean') return false;
  }
  return true;
}

test('roles & permissions rubric includes all platform roles', () => {
  assert.equal(ROLES.length, 7);
  assert.ok(ROLES.includes('superadmin'));
  assert.ok(ROLES.includes('mainadmin'));
  assert.ok(ROLES.includes('admin'));
  assert.ok(ROLES.includes('trainer'));
  assert.ok(ROLES.includes('doctor'));
  assert.ok(ROLES.includes('accountant'));
  assert.ok(ROLES.includes('supporter'));
});

test('only superadmin is authorized to click dots to define the rubric', () => {
  assert.equal(canToggleDot(true), true);
  assert.equal(canToggleDot(false), false);
});

test('matrix permission schema enforces boolean dots for every role (no text inputs)', () => {
  const validEntry = {
    id: 'videos.upload',
    name: 'Upload Masterclasses & Training Videos',
    category: 'Videos & Content',
    roles: {
      superadmin: true,
      mainadmin: true,
      admin: true,
      trainer: true,
      doctor: true,
      accountant: false,
      supporter: false
    }
  };
  assert.ok(validateMatrixSchema(validEntry));

  const invalidEntry = {
    id: 'videos.upload',
    name: 'Upload Videos',
    // Missing roles boolean dots
    roles: { superadmin: true }
  };
  assert.equal(validateMatrixSchema(invalidEntry), false);
});

test('superadmin clicking a dot toggles the permission state', () => {
  const initialMatrix = [
    {
      id: 'videos.set_rate',
      name: 'Charge Custom Video Token Rate',
      category: 'Videos & Content',
      roles: {
        superadmin: true,
        mainadmin: false,
        admin: false,
        trainer: true,
        doctor: true,
        accountant: false,
        supporter: false
      }
    }
  ];

  // SuperAdmin toggles dot for accountant to true
  const updated = togglePermissionDot(initialMatrix, 'videos.set_rate', 'accountant', true);
  assert.equal(updated[0].roles.accountant, true);

  // SuperAdmin clicks dot again to toggle back to false
  const reverted = togglePermissionDot(updated, 'videos.set_rate', 'accountant', true);
  assert.equal(reverted[0].roles.accountant, false);

  // Non-superadmin cannot click dots
  assert.throws(() => {
    togglePermissionDot(initialMatrix, 'videos.set_rate', 'accountant', false);
  }, /Access Denied/);
});

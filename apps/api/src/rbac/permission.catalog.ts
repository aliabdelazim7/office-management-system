/**
 * The permission catalogue is defined once, in `@saas/database`, so the API and
 * the seed script cannot drift apart. This file exists only so call sites can
 * keep importing from a location that reads naturally within the RBAC module.
 */
export {
  PERMISSION_CATALOG,
  ALL_PERMISSION_CODES,
  DEFAULT_ROLE_PERMISSIONS,
  assertCatalogIntegrity,
  type PermissionDefinition,
  type PermissionCode,
} from '@saas/database';

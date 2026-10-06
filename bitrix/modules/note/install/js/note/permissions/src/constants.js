export const LEVEL_NONE = 'none';
export const LEVEL_VIEW = 'view';
export const LEVEL_EDIT = 'edit';
export const LEVEL_MANAGE = 'manage';
export const LEVEL_MODERATE = 'moderate';

// Grant scope (mirrors backend DocumentAccessService): a grant applies to this
// document only, or to this document and its whole subtree. `subtree` is valid
// only with a positive level (view/edit) and gated by the availability flag.
export const SCOPE_DOCUMENT = 'document';
export const SCOPE_SUBTREE = 'subtree';

export const ENTITY_TYPE_USER = 'user';
export const ENTITY_TYPE_DEPARTMENT = 'department';
export const ENTITY_TYPE_PROJECT = 'project';
export const ENTITY_TYPE_META_USER = 'meta-user';

export const META_USER_ALL_USERS = 'all-users';

export const ALL_USERS_SUBJECT_CODE = '*';

export const ENTITY_ICON_MAP = {
	[ENTITY_TYPE_USER]: 'o-person',
	[ENTITY_TYPE_DEPARTMENT]: 'o-department',
	[ENTITY_TYPE_PROJECT]: 'o-group',
	[ENTITY_TYPE_META_USER]: 'o-globe-extranet',
};

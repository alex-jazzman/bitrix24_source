// Entity ids of ui.entity-selector this scenario picks members from.
export const SelectorEntity = Object.freeze({
	User: 'user',
	Project: 'project',
	Department: 'department',
});

export type SelectorEntityValue = (typeof SelectorEntity)[keyof typeof SelectorEntity];

/**
 * The access code prefix and the member type of every entity the selector can express. The types
 * repeat the ones `BaseObject::getMembersOfSharing()` returns (disk/lib/baseobject.php); a chat
 * has no entity behind it and therefore no place here.
 */
export const SelectorEntityInfo = Object.freeze({
	[SelectorEntity.User]: { accessCodePrefix: 'U', memberType: 'users' },
	[SelectorEntity.Project]: { accessCodePrefix: 'SG', memberType: 'groups' },
	[SelectorEntity.Department]: { accessCodePrefix: 'DR', memberType: 'department' },
});

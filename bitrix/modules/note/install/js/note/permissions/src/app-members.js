import { Loc } from 'main.core';
import {
	ALL_USERS_SUBJECT_CODE,
	ENTITY_TYPE_DEPARTMENT,
	ENTITY_TYPE_META_USER,
	ENTITY_TYPE_PROJECT,
	ENTITY_TYPE_USER,
	LEVEL_EDIT,
	LEVEL_MANAGE,
	LEVEL_MODERATE,
	LEVEL_VIEW,
	META_USER_ALL_USERS,
} from './constants';
import type {
	CollectionPermissionsPayload,
	DecodedSubjectCode,
	Member,
	PermissionLevel,
	PopupSaveState,
} from './type';

const ALL_LEVELS: PermissionLevel[] = [LEVEL_MODERATE, LEVEL_MANAGE, LEVEL_EDIT, LEVEL_VIEW];

export class NotePermissionsMembers
{
	createEmptyByLevel(): { [PermissionLevel]: Map<string, Member> }
	{
		const byLevel = {};
		for (const level of ALL_LEVELS)
		{
			byLevel[level] = new Map();
		}

		return byLevel;
	}

	hydrateState(payload: CollectionPermissionsPayload): void
	{
		this.byLevel = this.createEmptyByLevel();

		const permissions = Array.isArray(payload?.permissions) ? payload.permissions : [];
		for (const permission of permissions)
		{
			const subjectCode = String(permission?.subjectCode || '').trim();
			if (!subjectCode || subjectCode === ALL_USERS_SUBJECT_CODE)
			{
				continue;
			}

			const level = this.normalizeLevel(permission?.level);
			if (!level)
			{
				continue;
			}

			const titleHint = String(permission?.name || '');
			this.byLevel[level].set(subjectCode, this.buildMember(subjectCode, titleHint));
		}

		const policyLevel = this.normalizeLevel(payload?.policyLevel);
		if (policyLevel)
		{
			this.byLevel[policyLevel].set(ALL_USERS_SUBJECT_CODE, {
				subjectCode: ALL_USERS_SUBJECT_CODE,
				title: this.getAllEmployeesTitle(),
				entityId: ENTITY_TYPE_META_USER,
				entityItemId: META_USER_ALL_USERS,
			});
		}
	}

	getAllEmployeesTitle(): string
	{
		return Loc.getMessage('NOTE_PERMISSIONS_POPUP_ALL_EMPLOYEES') || '';
	}

	buildMember(subjectCode: string, titleHint: string = ''): Member
	{
		const decoded = this.decodeSubjectCode(subjectCode);

		return {
			subjectCode,
			title: titleHint || subjectCode,
			entityId: decoded?.entityId || '',
			entityItemId: decoded?.entityItemId || '',
		};
	}

	moveMemberToLevel(targetLevel: PermissionLevel, member: Member): void
	{
		for (const level of ALL_LEVELS)
		{
			if (level !== targetLevel && this.byLevel[level]?.has(member.subjectCode))
			{
				this.byLevel[level].delete(member.subjectCode);
			}
		}

		if (this.byLevel[targetLevel])
		{
			this.byLevel[targetLevel].set(member.subjectCode, member);
		}
	}

	removeMemberFromLevel(level: PermissionLevel, subjectCode: string): void
	{
		this.byLevel[level]?.delete(subjectCode);
	}

	findMemberLevel(subjectCode: string): PermissionLevel | null
	{
		for (const level of ALL_LEVELS)
		{
			if (this.byLevel[level]?.has(subjectCode))
			{
				return level;
			}
		}

		return null;
	}

	collectStateForSave(): PopupSaveState
	{
		const byLevel = {};
		for (const level of ALL_LEVELS)
		{
			byLevel[level] = Array.from(this.byLevel[level]?.values?.() || []);
		}

		return {
			name: String(this.popupName || ''),
			byLevel,
		};
	}

	hasModerator(): boolean
	{
		return (this.byLevel[LEVEL_MODERATE]?.size || 0) > 0;
	}

	normalizeLevel(level: mixed): PermissionLevel | ''
	{
		const value = String(level || '').toLowerCase().trim();
		if (ALL_LEVELS.includes(value))
		{
			return value;
		}

		return '';
	}

	decodeSubjectCode(subjectCode: string): DecodedSubjectCode | null
	{
		const normalized = String(subjectCode || '');
		if (normalized === ALL_USERS_SUBJECT_CODE)
		{
			return { entityId: ENTITY_TYPE_META_USER, entityItemId: META_USER_ALL_USERS };
		}

		let match = normalized.match(/^U(\d+)$/);
		if (match)
		{
			return { entityId: ENTITY_TYPE_USER, entityItemId: match[1] };
		}

		match = normalized.match(/^DR(\d+)$/);
		if (match)
		{
			return { entityId: ENTITY_TYPE_DEPARTMENT, entityItemId: match[1] };
		}

		match = normalized.match(/^SG(\d+)$/);
		if (match)
		{
			return { entityId: ENTITY_TYPE_PROJECT, entityItemId: match[1] };
		}

		return null;
	}

	encodeSubjectCode(entityId: string, entityItemId: string): string
	{
		const id = String(entityItemId || '').trim();
		if (!id)
		{
			return '';
		}

		const type = String(entityId || '');
		if (type === ENTITY_TYPE_META_USER && id === META_USER_ALL_USERS)
		{
			return ALL_USERS_SUBJECT_CODE;
		}

		switch (type)
		{
			case ENTITY_TYPE_USER:
				return `U${id}`;
			case ENTITY_TYPE_DEPARTMENT:
			case 'structure-node':
				return `DR${id}`;
			case ENTITY_TYPE_PROJECT:
				return `SG${id}`;
			default:
				return '';
		}
	}
}

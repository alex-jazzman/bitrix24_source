import { Loc } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { NoteAnalytics } from 'note.analytics';
import {
	ALL_USERS_SUBJECT_CODE,
	LEVEL_EDIT,
	LEVEL_MANAGE,
	LEVEL_MODERATE,
	LEVEL_NONE,
	LEVEL_VIEW,
	SCOPE_DOCUMENT,
	SCOPE_SUBTREE,
} from './constants';
import type {
	CollectionPermissionsPayload,
	CollectionPopupOptions,
	CreateCollectionPopupOptions,
	DocumentPopupOptions,
	LevelSection,
	PermissionLevel,
	PopupConfig,
	PopupSaveState,
} from './type';
import type { PermissionsApi } from './permissions-api';

const EVENT_COLLECTION_RENAMED = 'Note:collectionRenamed';

const COLLECTION_SECTION_ORDER: PermissionLevel[] = [
	LEVEL_MODERATE,
	LEVEL_MANAGE,
	LEVEL_VIEW,
];

const DOCUMENT_SECTION_ORDER: PermissionLevel[] = [LEVEL_EDIT, LEVEL_VIEW];

function getMessage(code: string): string
{
	return Loc.getMessage(code) || '';
}

function getLevelTitle(level: PermissionLevel): string
{
	switch (level)
	{
		case LEVEL_MODERATE:
			return getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_MODERATE');
		case LEVEL_MANAGE:
			return getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_EDIT');
		case LEVEL_EDIT:
			return getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_EDIT');
		case LEVEL_VIEW:
			return getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_VIEW');
		default:
			return '';
	}
}

function getLevelHint(level: PermissionLevel, kind: 'collection' | 'document'): string
{
	const suffix = kind === 'document' ? '_DOCUMENT' : '';
	const code = `NOTE_PERMISSIONS_POPUP_HINT_${String(level).toUpperCase()}${suffix}`;

	return getMessage(code);
}

function buildCollectionSections(): LevelSection[]
{
	return COLLECTION_SECTION_ORDER.map((level) => ({
		level,
		title: getLevelTitle(level),
		hintText: getLevelHint(level, 'collection'),
		required: level === LEVEL_MODERATE,
	}));
}

function buildDocumentSections(): LevelSection[]
{
	return DOCUMENT_SECTION_ORDER.map((level) => ({
		level,
		title: getLevelTitle(level),
		hintText: getLevelHint(level, 'document'),
		required: false,
	}));
}

function flattenStateForCollection(state: PopupSaveState): { policyLevel: string, permissions: Array<{ subjectCode: string, level: string }> }
{
	let policyLevel = LEVEL_NONE;
	const permissions = [];
	for (const level of Object.keys(state.byLevel))
	{
		const members = state.byLevel[level] || [];
		for (const member of members)
		{
			if (member.subjectCode === ALL_USERS_SUBJECT_CODE)
			{
				policyLevel = level;
				continue;
			}

			permissions.push({ subjectCode: member.subjectCode, level });
		}
	}

	return { policyLevel, permissions };
}

function flattenStateForDocument(state: PopupSaveState): Array<{ subjectCode: string, level: string, scope: string }>
{
	const permissions = [];
	for (const level of Object.keys(state.byLevel))
	{
		const members = state.byLevel[level] || [];
		for (const member of members)
		{
			if (member.subjectCode === ALL_USERS_SUBJECT_CODE)
			{
				continue;
			}

			// Subtree scope is valid only for positive levels; mirror the backend guard
			// so a malformed level never ships an invalid scope pairing.
			const scope = (member.scope === SCOPE_SUBTREE && (level === LEVEL_VIEW || level === LEVEL_EDIT))
				? SCOPE_SUBTREE
				: SCOPE_DOCUMENT;

			permissions.push({ subjectCode: member.subjectCode, level, scope });
		}
	}

	return permissions;
}

// Collection ACL popup only exposes MODERATE/MANAGE/VIEW sections, so byLevel[EDIT] stays empty
// for collections (backend collection levels: NONE/VIEW/MANAGE/MODERATE). EDIT is folded into
// reductorsCount as a no-loss safeguard. Counts include the ALL_USERS policy subject as-is.
function buildCollectionCreateStats(state: PopupSaveState): Object
{
	const byLevel = state?.byLevel || {};
	const countAt = (level: PermissionLevel): number => (
		Array.isArray(byLevel[level]) ? byLevel[level].length : 0
	);

	// Web-created collection is never an import, so no importType/import counters are sent.
	return {
		admin: countAt(LEVEL_MODERATE),
		reductorsCount: countAt(LEVEL_MANAGE) + countAt(LEVEL_EDIT),
		viewersCount: countAt(LEVEL_VIEW),
		customCount: 0,
	};
}

export function createCollectionEditConfig(
	api: PermissionsApi,
	collectionId: number,
	options: CollectionPopupOptions = {},
): PopupConfig
{
	const initialName = String(options?.collectionName || '');

	return {
		kind: 'collection',
		mode: 'edit',
		targetId: collectionId,
		sections: buildCollectionSections(),
		name: {
			visible: true,
			initialValue: initialName,
			placeholder: getMessage('NOTE_PERMISSIONS_POPUP_NAME_PLACEHOLDER'),
		},
		tagSelectorContext: `NOTE_COLLECTION_PERMISSIONS_${collectionId}`,
		load: () => api.loadCollectionPermissions(collectionId),
		save: async (state: PopupSaveState) => {
			try
			{
				const trimmedName = String(state.name || '').trim();
				const renamed = trimmedName && trimmedName !== initialName.trim();
				if (renamed)
				{
					await api.updateCollection(collectionId, trimmedName);
				}

				const { policyLevel, permissions } = flattenStateForCollection(state);
				await api.saveCollectionPermissions(collectionId, policyLevel, permissions);

				if (renamed)
				{
					EventEmitter.emit(EVENT_COLLECTION_RENAMED, new BaseEvent({
						data: { id: collectionId, name: trimmedName },
					}));
				}

				NoteAnalytics.collectionAccessChanged(true);
			}
			catch (error)
			{
				NoteAnalytics.collectionAccessChanged(false);
				throw error;
			}
		},
		successMessage: getMessage('NOTE_PERMISSIONS_POPUP_SAVE_SUCCESS'),
		errorMessage: getMessage('NOTE_PERMISSIONS_POPUP_SAVE_ERROR'),
		loadErrorMessage: getMessage('NOTE_PERMISSIONS_POPUP_LOAD_ERROR'),
		primaryButtonText: getMessage('NOTE_PERMISSIONS_POPUP_SAVE'),
		dialogTitle: '',
	};
}

export function createCollectionCreateConfig(
	api: PermissionsApi,
	options: CreateCollectionPopupOptions = {},
): PopupConfig
{
	return {
		kind: 'collection',
		mode: 'create',
		targetId: null,
		sections: buildCollectionSections(),
		name: {
			visible: true,
			initialValue: '',
			placeholder: getMessage('NOTE_PERMISSIONS_POPUP_NAME_PLACEHOLDER'),
		},
		tagSelectorContext: 'NOTE_COLLECTION_PERMISSIONS_NEW',
		load: () => {
			const userId = Number(Loc.getMessage('USER_ID'));
			const permissions = [];
			if (Number.isInteger(userId) && userId > 0)
			{
				permissions.push({ subjectCode: `U${userId}`, level: LEVEL_MODERATE, name: '' });
			}

			return Promise.resolve({ permissions, policyLevel: LEVEL_NONE });
		},
		save: async (state: PopupSaveState) => {
			// Single create_collection event by the outcome of both hits (create + save perms).
			// Backend does not emit create_collection for web (removed in P3), so no double-count.
			const stats = buildCollectionCreateStats(state);
			try
			{
				const trimmedName = String(state.name || '').trim();
				const collection = await api.createCollection(trimmedName);
				const collectionId = Number(collection?.id || 0);
				if (!collectionId)
				{
					throw new Error('note.permissions: collection create returned no id');
				}

				const { policyLevel, permissions } = flattenStateForCollection(state);
				try
				{
					await api.saveCollectionPermissions(collectionId, policyLevel, permissions);
				}
				catch (savePermissionsError)
				{
					try
					{
						await api.deleteCollection(collectionId);
					}
					catch (rollbackError)
					{
						// Surface a more specific error so popup can show an extra hint
						rollbackError.noteRollbackFailed = true;
						throw rollbackError;
					}

					throw savePermissionsError;
				}

				NoteAnalytics.collectionCreated(stats, true);

				if (typeof options.onCreated === 'function')
				{
					options.onCreated({
						id: collectionId,
						name: String(collection?.name || trimmedName),
						position: Number(collection?.position || 0),
					});
				}
			}
			catch (error)
			{
				NoteAnalytics.collectionCreated(stats, false);
				throw error;
			}
		},
		successMessage: getMessage('NOTE_PERMISSIONS_POPUP_CREATE_SUCCESS'),
		errorMessage: getMessage('NOTE_PERMISSIONS_POPUP_CREATE_ERROR'),
		loadErrorMessage: getMessage('NOTE_PERMISSIONS_POPUP_LOAD_ERROR'),
		primaryButtonText: getMessage('NOTE_PERMISSIONS_POPUP_CREATE_BUTTON'),
		dialogTitle: '',
	};
}

export function createDocumentEditConfig(
	api: PermissionsApi,
	documentId: number,
	options: DocumentPopupOptions = {},
): PopupConfig
{
	return {
		kind: 'document',
		mode: 'edit',
		targetId: documentId,
		sections: buildDocumentSections(),
		name: {
			visible: false,
			initialValue: String(options?.documentTitle || ''),
			placeholder: '',
		},
		tagSelectorContext: `NOTE_DOCUMENT_PERMISSIONS_${documentId}`,
		load: () => api.loadDocumentPermissions(documentId),
		save: async (state: PopupSaveState) => {
			const permissions = flattenStateForDocument(state);
			try
			{
				await api.saveDocumentPermissions(documentId, permissions);
				NoteAnalytics.documentAccessChanged(true);
			}
			catch (error)
			{
				NoteAnalytics.documentAccessChanged(false);
				throw error;
			}
		},
		successMessage: getMessage('NOTE_PERMISSIONS_POPUP_SAVE_SUCCESS_DOCUMENT'),
		errorMessage: getMessage('NOTE_PERMISSIONS_POPUP_SAVE_ERROR_DOCUMENT'),
		loadErrorMessage: getMessage('NOTE_PERMISSIONS_POPUP_LOAD_ERROR_DOCUMENT'),
		primaryButtonText: getMessage('NOTE_PERMISSIONS_POPUP_SAVE'),
		dialogTitle: getMessage('NOTE_PERMISSIONS_POPUP_TITLE_EDIT_DOCUMENT'),
	};
}

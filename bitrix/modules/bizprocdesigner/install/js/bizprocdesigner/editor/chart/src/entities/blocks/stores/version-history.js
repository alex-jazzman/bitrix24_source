import { Loc, Type } from 'main.core';
import { defineStore } from 'ui.vue3.pinia';

import { editorAPI } from '../../../shared/api';
import { getErrorCode } from '../../../shared/utils/response';
import { isTemplateId } from '../../../shared/utils/template-id';

export type TemplateVersion = {
	id: number,
	versionNumber: number,
	publicationType: number,
	createdTimestamp: ?number,
	authorId: ?number,
	isCurrent: boolean,
};

type VersionHistoryState = {
	versions: Array<TemplateVersion>,
	authorNames: { [string]: string },
	isLoading: boolean,
	errorMessage: ?string,
	selectedVersionId: ?number,
	selectedVersion: ?TemplateVersion,
	lastFetchId: number,
};

const VERSION_NOT_FOUND_ERROR_CODE = 'TEMPLATE_VERSION_NOT_FOUND';

const ERROR_PHRASES = {
	[VERSION_NOT_FOUND_ERROR_CODE]: 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ERROR_VERSION_NOT_FOUND',
	TEMPLATE_HISTORY_UNAVAILABLE: 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ERROR_HISTORY_UNAVAILABLE',
	TEMPLATE_VERSION_CONFLICT: 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ERROR_VERSION_CONFLICT',
	TEMPLATE_RESTORE_UNDO_UNAVAILABLE: 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ERROR_UNDO_UNAVAILABLE',
	ACCESS_DENIED: 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ERROR_ACCESS_DENIED',
	FEATURE_DISABLED: 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ERROR_FEATURE_DISABLED',
};

const COMMON_ERROR_PHRASE = 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ERROR_COMMON';

export function resolveVersionHistoryErrorMessage(error: Error): string
{
	const phraseCode = ERROR_PHRASES[getErrorCode(error)] ?? COMMON_ERROR_PHRASE;

	return Loc.getMessage(phraseCode) ?? '';
}

export const useVersionHistoryStore = defineStore('bizprocdesigner-editor-version-history', {
	state: (): VersionHistoryState => ({
		versions: [],
		authorNames: {},
		isLoading: false,
		errorMessage: null,
		selectedVersionId: null,
		selectedVersion: null,
		lastFetchId: 0,
	}),
	getters:
	{
		currentVersion: (state: VersionHistoryState): ?TemplateVersion => {
			return state.versions.find((version) => version.isCurrent) ?? null;
		},
		selectedAuthorName: (state: VersionHistoryState): string => {
			return state.authorNames[String(state.selectedVersion?.authorId)] ?? '';
		},
		isEmpty: (state: VersionHistoryState): boolean => {
			return !state.isLoading && state.errorMessage === null && state.versions.length === 0;
		},
	},
	actions:
	{
		async loadVersions(templateId: number): Promise<void>
		{
			if (!isTemplateId(templateId))
			{
				return;
			}

			const fetchId = ++this.lastFetchId;
			this.isLoading = true;
			this.errorMessage = null;
			try
			{
				const data = await editorAPI.getTemplateVersions({ templateId });
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.versions = Type.isArray(data?.versions) ? data.versions : [];
				await this.loadAuthorNames(fetchId);
			}
			catch (error)
			{
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.versions = [];
				this.errorMessage = resolveVersionHistoryErrorMessage(error);
			}
			finally
			{
				if (this.lastFetchId === fetchId)
				{
					this.isLoading = false;
				}
			}
		},
		async loadAuthorNames(fetchId: number): Promise<void>
		{
			const authorIds = [...new Set(
				this.versions
					.map((version) => version.authorId)
					.filter((authorId) => Type.isNumber(authorId) && authorId > 0),
			)];

			const names = authorIds.length > 0 ? await editorAPI.fetchUserNames(authorIds) : {};
			if (this.lastFetchId === fetchId)
			{
				this.authorNames = names;
			}
		},
		/**
		 * A version rotated out between the list load and the click is a regular outcome: the list is
		 * reloaded and the user gets the message instead of an error state.
		 */
		async loadVersion(templateId: number, versionId: number): Promise<?Object>
		{
			this.errorMessage = null;
			try
			{
				const data = await editorAPI.getTemplateVersion({ templateId, versionId });
				this.selectVersion(versionId, data?.version);

				return data;
			}
			catch (error)
			{
				const message = resolveVersionHistoryErrorMessage(error);
				if (getErrorCode(error) === VERSION_NOT_FOUND_ERROR_CODE)
				{
					this.clearSelection();
					await this.loadVersions(templateId);
				}

				this.errorMessage = message;

				return null;
			}
		},
		/**
		 * The selection outlives the list: the dialog closes when the version opens on the canvas,
		 * and the version bar keeps showing the version until the user leaves the view mode.
		 */
		selectVersion(versionId: number, version: ?TemplateVersion): void
		{
			const selectedVersion = version ?? this.versions.find((item) => item.id === versionId) ?? null;

			this.selectedVersionId = versionId;
			this.selectedVersion = selectedVersion;
		},
		clearSelection(): void
		{
			this.selectedVersionId = null;
			this.selectedVersion = null;
		},
		// The author names are a user id to name cache: the dialog unmounts as soon as a version opens
		// on the canvas, and the version bar still needs the name of the selection.
		reset(): void
		{
			this.versions = [];
			this.isLoading = false;
			this.errorMessage = null;
			this.lastFetchId++;
		},
	},
});

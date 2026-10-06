import { Loc } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { FileProperties, RootState } from '../types/state';
import { showErrorPopup } from './error-popup';
import {
	extractPreviewRows,
	hasPreviewSchemaMismatch,
	isParsingSettingsError,
	mapHeadersToFieldsSettings,
	requestDatasetView,
} from './dataset-view';

const DEBOUNCE_MS = 400;
const COLUMN_TRIGGER_KEYS: ReadonlyArray<keyof FileProperties> = ['encoding', 'separator', 'firstLineHeader'];

type ReloadMode = 'columns' | 'preview';

export type PreviewReloadControllerOptions = {
	sourceCode: string,
	onReloadStart?: () => void,
	onReloadFinish?: () => void,
};

export class PreviewReloadController
{
	private readonly store: Store<RootState>;

	private readonly sourceCode: string;

	private readonly onReloadStart: (() => void) | null;

	private readonly onReloadFinish: (() => void) | null;

	private unsubscribe: (() => void) | null = null;

	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	private currentRequestId: number = 0;

	private pendingRebuildColumns: boolean = false;

	constructor(store: Store<RootState>, options: PreviewReloadControllerOptions)
	{
		this.store = store;
		this.sourceCode = options.sourceCode;
		this.onReloadStart = options.onReloadStart ?? null;
		this.onReloadFinish = options.onReloadFinish ?? null;
	}

	attach(): void
	{
		this.unsubscribe = (this.store as unknown as {
			subscribe: (cb: (mutation: { type: string, payload?: unknown }) => void) => () => void,
		}).subscribe((mutation) => {
			const mode = this.resolveReloadMode(mutation);
			if (mode === null)
			{
				return;
			}
			if (mode === 'columns')
			{
				this.pendingRebuildColumns = true;
			}
			this.schedule();
		});
	}

	detach(): void
	{
		this.currentRequestId++;
		if (this.unsubscribe)
		{
			this.unsubscribe();
			this.unsubscribe = null;
		}
		if (this.debounceTimer !== null)
		{
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	private resolveReloadMode(mutation: { type: string, payload?: unknown }): ReloadMode | null
	{
		switch (mutation.type)
		{
			case 'setFileProperties':
				if (!this.hasColumnTriggerKey(mutation.payload))
				{
					return null;
				}

				return this.store.getters.isEditMode ? 'preview' : 'columns';
			case 'setDataFormats':
				return 'preview';
			case 'setFieldRowSettings':
				return this.isTypeChange(mutation.payload) ? 'preview' : null;
			default:
				return null;
		}
	}

	private hasColumnTriggerKey(payload: unknown): boolean
	{
		const patch = payload as Partial<FileProperties> | undefined;
		if (!patch)
		{
			return false;
		}

		return COLUMN_TRIGGER_KEYS.some((key) => key in patch);
	}

	private isTypeChange(payload: unknown): boolean
	{
		const settings = (payload as { settings?: Record<string, unknown> } | undefined)?.settings;

		return Boolean(settings) && 'type' in (settings as Record<string, unknown>);
	}

	private schedule(): void
	{
		if (this.debounceTimer !== null)
		{
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			this.reload();
		}, DEBOUNCE_MS);
	}

	async reload(): Promise<void>
	{
		const rebuildColumns = this.pendingRebuildColumns;
		this.pendingRebuildColumns = false;

		const state = this.store.state.config;
		if (this.sourceCode !== 'csv' || !state.fileProperties.fileToken)
		{
			return;
		}

		const requestId = ++this.currentRequestId;
		const requestFileToken = state.fileProperties.fileToken;
		this.store.commit('setPreviewReloading', true);
		// Validation has to run on the reloaded preview, so it is called at the end of this cycle
		// instead of waiting for its own debounce: two cycles show the loader twice.
		this.onReloadStart?.();

		try
		{
			const response = await requestDatasetView(this.store, this.sourceCode, {
				skipExistingSchemaCheck: true,
			});

			if (requestId !== this.currentRequestId || !this.isCurrentFile(requestFileToken))
			{
				return;
			}

			if (rebuildColumns)
			{
				this.store.commit('setFieldsSettings', mapHeadersToFieldsSettings(response?.data?.headers ?? []));
			}
			const hasMismatch = hasPreviewSchemaMismatch(this.store, response);
			this.store.commit('setPreviewSchemaMismatch', hasMismatch);
			this.store.commit('setPreviewData', hasMismatch ? [] : extractPreviewRows(response));
			if (hasMismatch)
			{
				await this.showSchemaMismatchError(requestId, requestFileToken);
			}
		}
		catch (error)
		{
			if (requestId === this.currentRequestId && this.isCurrentFile(requestFileToken))
			{
				this.store.commit('setPreviewData', []);
				if (!isParsingSettingsError(error))
				{
					showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_LOAD'));
				}
			}
		}
		finally
		{
			if (requestId === this.currentRequestId)
			{
				// Order matters: validation raises its own flag before this one drops,
				// so the preview keeps a single uninterrupted loader.
				this.onReloadFinish?.();
				this.store.commit('setPreviewReloading', false);
			}
		}
	}

	private isCurrentFile(fileToken: string): boolean
	{
		return this.store.state.config.fileProperties.fileToken === fileToken;
	}

	private async showSchemaMismatchError(requestId: number, fileToken: string): Promise<void>
	{
		try
		{
			await requestDatasetView(this.store, this.sourceCode);
		}
		catch (error)
		{
			if (requestId === this.currentRequestId && this.isCurrentFile(fileToken))
			{
				showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_LOAD'));
			}
		}
	}
}

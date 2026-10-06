import { ajax } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { RootState, ValidationError } from '../types/state';

const DEBOUNCE_MS = 1500;
const PREVIEW_ROWS_LIMIT = 300;
const TRIGGER_MUTATIONS: ReadonlySet<string> = new Set([
	'setFieldRowSettings',
	'setFieldsSettings',
	'setDataFormats',
	'setFileProperties',
]);

type CheckFileRawError = { message?: string, customData?: { field?: number } };

export type ValidationControllerOptions = {
	sourceCode: string,
};

export class ValidationController
{
	private readonly store: Store<RootState>;

	private readonly sourceCode: string;

	private unsubscribe: (() => void) | null = null;

	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	private currentRequestId: number = 0;

	constructor(store: Store<RootState>, options: ValidationControllerOptions)
	{
		this.store = store;
		this.sourceCode = options.sourceCode;
	}

	attach(): void
	{
		this.unsubscribe = (this.store as unknown as {
			subscribe: (cb: (mutation: { type: string, payload?: unknown }) => void) => () => void,
		}).subscribe((mutation) => {
			if (!TRIGGER_MUTATIONS.has(mutation.type))
			{
				return;
			}
			if (mutation.type === 'setFieldRowSettings' && this.isDescriptionOnly(mutation.payload))
			{
				return;
			}
			this.scheduleValidate();
		});
		this.scheduleValidate();
	}

	private isDescriptionOnly(payload: unknown): boolean
	{
		const settings = (payload as { settings?: Record<string, unknown> } | undefined)?.settings;
		if (!settings)
		{
			return false;
		}
		const keys = Object.keys(settings);

		return keys.length > 0 && keys.every((key) => key === 'description');
	}

	detach(): void
	{
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

	/**
	 * Drops a validation planned by debounce. Used when the caller runs validation itself,
	 * right after the preview is reloaded.
	 */
	cancelScheduled(): void
	{
		if (this.debounceTimer !== null)
		{
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	private scheduleValidate(): void
	{
		this.cancelScheduled();
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			this.validate();
		}, DEBOUNCE_MS);
	}

	async validate(): Promise<void>
	{
		const state = this.store.state.config;

		const hasFile = Boolean(state.fileProperties.fileToken) || state.datasetProperties.id > 0;
		if (this.sourceCode !== 'csv' || state.fieldsSettings.length === 0 || !hasFile)
		{
			this.store.commit('setValidationErrors', []);
			this.store.commit('setValidationLoading', false);

			return;
		}

		const requestId = ++this.currentRequestId;
		const requestFileToken = state.fileProperties.fileToken;
		this.store.commit('setValidationLoading', true);

		try
		{
			const response = await ajax.runAction('biconnector.externalsource.dataset.checkFile', {
				data: {
					type: this.sourceCode,
					rowsLimit: PREVIEW_ROWS_LIMIT,
					fields: {
						fileProperties: state.fileProperties,
						datasetProperties: state.datasetProperties,
						fieldsSettings: state.fieldsSettings,
						dataFormats: state.dataFormats,
					},
				},
			}) as { data?: { checkFileErrors?: Record<string, Array<CheckFileRawError>> } };

			if (requestId !== this.currentRequestId || state.fileProperties.fileToken !== requestFileToken)
			{
				return;
			}

			const raw = response?.data?.checkFileErrors ?? {};
			const firstLineHeader = Boolean(state.fileProperties.firstLineHeader);
			const offset = firstLineHeader ? 2 : 1;
			const errors: Array<ValidationError> = [];
			Object.entries(raw).forEach(([line, errs]) => {
				const rowIndex = Number(line) - offset;
				(errs || []).forEach((e) => {
					errors.push({
						rowIndex,
						fieldIndex: e?.customData?.field ?? -1,
						message: e?.message ?? '',
					});
				});
			});

			this.store.commit('setValidationErrors', errors);
		}
		catch
		{
			if (requestId === this.currentRequestId && state.fileProperties.fileToken === requestFileToken)
			{
				this.store.commit('setValidationErrors', []);
			}
		}
		finally
		{
			if (requestId === this.currentRequestId)
			{
				this.store.commit('setValidationLoading', false);
			}
		}
	}
}

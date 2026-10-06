import { ajax, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { Store } from 'ui.vue3.vuex';
import type { FieldSettings, RootState } from '../types/state';
import { showErrorPopup } from './error-popup';

const LOAD_EVENT = 'biconnector:dataset-import-v2:connection-load';
const SYNC_EVENT = 'biconnector:dataset-import-v2:connection-sync';

type ViewResponseHeader = {
	id?: number,
	visible?: boolean,
	type?: string,
	name?: string,
	externalCode?: string,
	description?: string,
};

type ViewResponse = {
	data?: {
		headers?: Array<ViewResponseHeader>,
		data?: Array<Array<string | number | null>>,
	},
};

export type ConnectionControllerOptions = {
	sourceCode: string,
};

export class ConnectionController
{
	private readonly store: Store<RootState>;

	private readonly sourceCode: string;

	private isLoading: boolean = false;

	private loadHandler: (() => void) | null = null;

	private syncHandler: (() => void) | null = null;

	constructor(store: Store<RootState>, options: ConnectionControllerOptions)
	{
		this.store = store;
		this.sourceCode = options.sourceCode;
	}

	attach(): void
	{
		this.loadHandler = () => { void this.load(); };
		EventEmitter.subscribe(LOAD_EVENT, this.loadHandler);
		this.syncHandler = () => { void this.sync(); };
		EventEmitter.subscribe(SYNC_EVENT, this.syncHandler);

		const connection = this.store.state.config.connectionProperties;
		if (connection?.connectionId && connection?.tableName && !this.store.getters.hasData)
		{
			void this.load();
		}
	}

	detach(): void
	{
		if (this.loadHandler)
		{
			EventEmitter.unsubscribe(LOAD_EVENT, this.loadHandler);
			this.loadHandler = null;
		}

		if (this.syncHandler)
		{
			EventEmitter.unsubscribe(SYNC_EVENT, this.syncHandler);
			this.syncHandler = null;
		}
	}

	async sync(): Promise<void>
	{
		const datasetId = this.store.state.config.datasetProperties.id;
		if (!datasetId || this.isLoading)
		{
			return;
		}

		this.isLoading = true;
		this.store.commit('setValidationLoading', true);

		try
		{
			const response = await ajax.runAction('biconnector.externalsource.dataset.syncField', {
				data: {
					id: datasetId,
				},
			}) as ViewResponse;

			const responseData = response.data;
			if (!responseData)
			{
				return;
			}

			const headers = (responseData.headers ?? []).map(
				(header, index) => this.prepareHeader(header, index),
			);
			this.store.commit('setFieldsSettings', headers);
			this.store.commit('setPreviewData', responseData.data ?? []);
		}
		catch
		{
			// keep current data on sync failure
		}
		finally
		{
			this.isLoading = false;
			this.store.commit('setValidationLoading', false);
		}
	}

	async load(): Promise<void>
	{
		const config = this.store.state.config;
		const connection = config.connectionProperties;
		if (!connection?.connectionId || !connection?.tableName || this.isLoading)
		{
			return;
		}

		this.isLoading = true;
		this.store.commit('setValidationLoading', true);

		try
		{
			const response = await ajax.runAction('biconnector.externalsource.dataset.view', {
				data: {
					type: connection.connectionType || this.sourceCode,
					fields: {
						datasetProperties: config.datasetProperties,
						fieldsSettings: config.fieldsSettings,
						dataFormats: config.dataFormats,
						tableName: connection.tableName,
						connectionType: connection.connectionType,
					},
					sourceId: connection.connectionId,
				},
			}) as ViewResponse;

			const responseData = response.data;
			if (!responseData)
			{
				return;
			}

			const headers = (responseData.headers ?? []).map(
				(header, index) => this.prepareHeader(header, index),
			);
			this.store.commit('setFieldsSettings', headers);
			this.store.commit('setPreviewData', responseData.data ?? []);
		}
		catch (error)
		{
			this.store.commit('setFieldsSettings', []);
			this.store.commit('setPreviewData', []);
			showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_LOAD'));
		}
		finally
		{
			this.isLoading = false;
			this.store.commit('setValidationLoading', false);
		}
	}

	private prepareHeader(header: ViewResponseHeader, index: number): FieldSettings
	{
		return {
			id: header.id ?? 0,
			visible: header.visible ?? true,
			type: header.type ?? 'string',
			name: header.name && header.name.length > 0 ? header.name : `FIELD_${index}`,
			originalName: header.externalCode ?? '',
			externalCode: header.externalCode ?? '',
			description: header.description ?? '',
		};
	}
}

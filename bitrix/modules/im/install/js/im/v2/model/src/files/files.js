import { BuilderModel } from 'ui.vue3.vuex';

import { FileStatus } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { formatFieldsWithConfig } from 'im.v2.model';

import { fileFieldsConfig } from './format/field-config';

import type { JsonObject } from 'main.core';
import type { ImModelFile, ImModelTranscription } from 'im.v2.model';

type FilesState = {
	collection: {
		[fileId: string]: ImModelFile
	},
	temporaryFilesMap: Map<number, string>,
	transcriptions: {
		[fileId: string]: ImModelTranscription,
	},
};

export class FilesModel extends BuilderModel
{
	getName(): string
	{
		return 'files';
	}

	getState(): FilesState
	{
		return {
			collection: {},
			temporaryFilesMap: new Map(),
			transcriptions: {},
		};
	}

	getElementState(): ImModelFile
	{
		return {
			id: 0,
			chatId: 0,
			name: 'File is deleted',
			date: new Date(),
			type: 'file',
			extension: '',
			icon: 'empty',
			isTranscribable: false,
			size: 0,
			image: null,
			status: FileStatus.done,
			progress: 100,
			authorId: 0,
			authorName: '',
			urlPreview: '',
			urlShow: '',
			urlDownload: '',
			viewerAttrs: null,
			isVideoNote: false,
		};
	}

	getGetters(): JsonObject
	{
		return {
			/** @function files/get */
			get: (state: FilesState, getters) => (fileId: number, getTemporary = false): ?ImModelFile => {
				if (!fileId)
				{
					return null;
				}

				if (!getTemporary && !state.collection[fileId])
				{
					return null;
				}

				const file: ?ImModelFile = state.collection[fileId];
				const hasMappedTemporaryFile: boolean = getters.hasMappedTemporaryFile({ serverFileId: fileId });
				if (file && hasMappedTemporaryFile)
				{
					const temporaryFile: ImModelFile = getters.getMappedTemporaryFile({ serverFileId: fileId });

					return {
						...file,
						urlPreview: temporaryFile.urlPreview,
						urlShow: temporaryFile.urlShow,
					};
				}

				return file;
			},
			/** @function files/isInCollection */
			isInCollection: (state: FilesState) => (payload: {fileId: number | string}): boolean => {
				const { fileId } = payload;

				return Boolean(state.collection[fileId]);
			},
			/** @function files/hasMappedTemporaryFile */
			hasMappedTemporaryFile: (state: FilesState) => (payload: {serverFileId: number | string}): boolean => {
				if (state.temporaryFilesMap.has(payload.serverFileId))
				{
					const temporaryFileId: string = state.temporaryFilesMap.get(payload.serverFileId);

					return Object.hasOwn(state.collection, temporaryFileId);
				}

				return false;
			},
			/** @function files/getMappedTemporaryFile */
			getMappedTemporaryFile: (state: FilesState) => (payload: {serverFileId: number}): ?ImModelFile => {
				const { serverFileId } = payload;

				if (state.temporaryFilesMap.has(serverFileId))
				{
					const temporaryFileId: string = state.temporaryFilesMap.get(serverFileId);

					return state.collection[temporaryFileId];
				}

				return null;
			},
			/** @function files/getTranscription */
			getTranscription: (state: FilesState) => (fileId: number): ?ImModelTranscription => {
				return state.transcriptions[fileId] || null;
			},
		};
	}

	getActions(): JsonObject
	{
		return {
			/** @function files/add */
			add: (store, payload: Object) => {
				const preparedFile = { ...this.getElementState(), ...this.formatFields(payload) };

				store.commit('add', { files: [preparedFile] });
			},
			/** @function files/set */
			set: (store, ...payload: Array<JsonObject>) => {
				const files: Array<ImModelFile> = payload.flat().map((file) => {
					return { ...this.getElementState(), ...this.formatFields(file) };
				});

				store.commit('add', { files });
			},
			/** @function files/update */
			update: (store, payload) => {
				const { id, fields } = payload;
				const existingItem = store.state.collection[id];
				if (!existingItem)
				{
					return false;
				}

				store.commit('update', {
					id,
					fields: this.formatFields(fields),
				});

				return true;
			},
			/** @function files/updateWithId */
			updateWithId: (store, payload: {id: string | number, fields: Object}) => {
				const { id, fields } = payload;
				if (!store.state.collection[id])
				{
					return;
				}

				store.commit('updateWithId', {
					id,
					fields: this.formatFields(fields),
				});
			},
			/** @function files/delete */
			delete: (store, payload: {id: string | number}) => {
				const { id } = payload;
				if (!store.state.collection[id])
				{
					return;
				}

				store.commit('delete', { id });
			},
			/** @function files/setTemporaryFileMapping */
			setTemporaryFileMapping: (store, payload: {serverFileId: number, temporaryFileId: string}) => {
				store.commit('setTemporaryFileMapping', payload);
			},
			/** @function files/setTranscription */
			setTranscription: (store, payload: ImModelTranscription) => {
				const { fileId, status, transcriptText, errorCode } = payload;

				store.commit('setTranscription', {
					fileId,
					status,
					transcriptText,
					errorCode,
				});
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): JsonObject
	{
		return {
			add: (state: FilesState, payload: {files: ImModelFile[]}) => {
				payload.files.forEach((file) => {
					state.collection[file.id] = file;
				});
			},
			update: (state: FilesState, payload) => {
				Object.entries(payload.fields).forEach(([key, value]) => {
					state.collection[payload.id][key] = value;
				});
			},
			updateWithId: (state: FilesState, payload: {id: number | string, fields: Object}) => {
				const { id, fields } = payload;
				const currentFile = { ...state.collection[id] };

				delete state.collection[id];
				state.collection[fields.id] = { ...currentFile, ...fields };
			},
			delete: (state: FilesState, payload: {id: number | string}) => {
				Logger.warn('Files model: delete mutation', payload);
				const { id } = payload;
				delete state.collection[id];
			},
			setTemporaryFileMapping: (state: FilesState, payload: {serverFileId: number, temporaryFileId: string}) => {
				state.temporaryFilesMap.set(payload.serverFileId, payload.temporaryFileId);
			},
			setTranscription: (state: FilesState, payload: ImModelTranscription) => {
				state.transcriptions[payload.fileId] = {
					status: payload.status,
					transcriptText: payload.transcriptText,
					errorCode: payload.errorCode,
				};
			},
		};
	}

	formatFields(rawFields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(rawFields, fileFieldsConfig);
	}
}

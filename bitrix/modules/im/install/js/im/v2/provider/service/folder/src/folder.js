import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';
import { FolderManager } from 'im.v2.lib.folder';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';
import { runAction } from 'im.v2.lib.rest';
import { type ImModelFolder, type ImModelFolderChat } from 'im.v2.model';

type FolderFields = {
	title: string,
	dialogIds: string[],
};

type FolderUpdateParams = {
	folderId: number,
	fields: {
		title: string,
		dialogIds: string[] | typeof CLEAR_COMPOSITION_FLAG,
	},
};

const CLEAR_COMPOSITION_FLAG = 'N';

export class FolderService
{
	async add(fields: FolderFields): Promise<ImModelFolder>
	{
		Logger.warn('FolderService: add', fields);

		const queryParams = { data: { fields } };
		const addResult: { folder: ImModelFolder } = await runAction(RestMethod.imV2FolderAdd, queryParams)
			.catch(([error]) => {
				console.error('FolderService: add error:', error);
				throw error;
			});

		const { folder } = addResult;

		await Core.getStore().dispatch('recent/folders/add', folder);

		return folder;
	}

	async update(folderId: number, fields: FolderFields): Promise<ImModelFolder>
	{
		Logger.warn('FolderService: update', folderId, fields);

		const queryParams = { data: prepareUpdateParams(folderId, fields) };
		const updateResult: { folder: ImModelFolder } = await runAction(RestMethod.imV2FolderUpdate, queryParams)
			.catch(([error]) => {
				console.error('FolderService: update error:', error);
				throw error;
			});

		const { folder } = updateResult;

		await Core.getStore().dispatch('recent/folders/update', folder);

		return folder;
	}

	async delete(folderId: number): Promise<void>
	{
		Logger.warn('FolderService: delete', folderId);

		const queryParams = { data: { folderId } };
		await runAction(RestMethod.imV2FolderDelete, queryParams)
			.catch(([error]) => {
				console.error('FolderService: delete error:', error);
				throw error;
			});

		FolderManager.handleOpenedFolder(folderId);

		await Core.getStore().dispatch('recent/folders/delete', { id: folderId });
	}

	async sort(orderedIds: number[]): Promise<void>
	{
		Logger.warn('FolderService: sort', orderedIds);

		const queryParams = { data: { folderIds: orderedIds } };
		await runAction(RestMethod.imV2FolderSort, queryParams)
			.catch(([error]) => {
				console.error('FolderService: sort error:', error);
				throw error;
			});

		await Core.getStore().dispatch('recent/folders/sort', orderedIds);
	}

	async addChats(folderId: number, chats: ImModelFolderChat[]): Promise<void>
	{
		Logger.warn('FolderService: addChats', folderId, chats);

		const queryParams = { data: { folderId, dialogIds: chats.map((chat) => chat.dialogId) } };
		await runAction(RestMethod.imV2FolderAddChats, queryParams)
			.catch(([error]) => {
				console.error('FolderService: addChats error:', error);
				throw error;
			});

		await Core.getStore().dispatch('recent/folders/addChats', { folderId, chats });

		Notifier.folder.onAddChatComplete();
	}
}

const prepareUpdateParams = (folderId: number, fields: FolderFields): FolderUpdateParams => {
	const dialogIds = fields.dialogIds.length > 0 ? fields.dialogIds : CLEAR_COMPOSITION_FLAG;

	return {
		folderId,
		fields: {
			title: fields.title,
			dialogIds,
		},
	};
};

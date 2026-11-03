import { Core } from 'im.v2.application.core';
import { RestMethod, type SystemFolderCodeItem } from 'im.v2.const';
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

// An item of the composite folder setup screen. It carries no texts: the title and the description
// come from the folder object it points at, and the link between the two is `folderId` alone -
// the stored code of the showcase source differs from the one on the wire.
// SystemFolderCodeItem is a client mirror: it can lag behind the server and nothing checks it at runtime.
// Declared here and nowhere else: the shape belongs to the answer of the server, and the screen that
// draws it reads it from here.
export type FolderSourceItem = {
	folderId: number,
	code: SystemFolderCodeItem,
	enabled: boolean,
	togglable: boolean,
};

type FolderSourcesResult = {
	sources: FolderSourceItem[],
	folders: ImModelFolder[],
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
				Notifier.folder.handleCompositionError(error);
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
				Notifier.folder.handleCompositionError(error);
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
				Notifier.folder.handleCompositionError(error);
				throw error;
			});

		await Core.getStore().dispatch('recent/folders/addChats', { folderId, chats });

		Notifier.folder.onAddChatComplete();
	}

	// The answer belongs to the setup screen alone and stays in its local state: the folder registry
	// holds only the folders `Folder.list` gives out, and the codes here are not checked against the
	// client mirror of the system codes.
	async getSources(folderId: number): Promise<FolderSourcesResult>
	{
		Logger.warn('FolderService: getSources', folderId);

		const queryParams = { data: { folderId } };

		return runAction(RestMethod.imV2FolderGetSources, queryParams)
			.catch(([error]) => {
				console.error('FolderService: getSources error:', error);
				Notifier.folder.onSourcesLoadError();
				throw error;
			});
	}

	// `sourceCodes` is the whole set of the sources that stay on, not a delta.
	async updateSources(folderId: number, sourceCodes: SystemFolderCodeItem[]): Promise<void>
	{
		Logger.warn('FolderService: updateSources', folderId, sourceCodes);

		const queryParams = { data: { folderId, sourceCodes } };
		const updateResult: { sourceFolders: SystemFolderCodeItem[] } = await runAction(
			RestMethod.imV2FolderUpdateSources,
			queryParams,
		).catch(([error]) => {
			console.error('FolderService: updateSources error:', error);
			Notifier.folder.onSourcesSaveError();
			throw error;
		});

		// the server normalizes the set silently, so the folder gets the codes of the answer and not
		// the ones sent; the `folderUpdate` push carrying the same set arrives later and repeats this
		const { sourceFolders: codes } = updateResult;

		// An empty set is a legitimate answer, a missing one is no answer at all. The write went through
		// on the server all the same, so the folder is left with the composition it has and the push
		// above brings the new one: a set of nothing here would cost the folder the mark of a composite
		// one, and with it the way back to this very screen.
		if (!Array.isArray(codes))
		{
			return;
		}

		const store = Core.getStore();
		const folder: ImModelFolder = store.getters['recent/folders/getById'](folderId);
		const definition = { ...folder.definition, sourceFolders: codes };

		await store.dispatch('recent/folders/update', { id: folderId, definition });
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

import { post } from '../request';

export type SafeFolder = {
	id: number;
	title: string;
};

export type SafeFolderMoveResult = {
	moved: number[];
	errors: Array<{ documentId: number; code: string }>;
};

export type SafeFolderPeopleResult = {
	people: Array<{ id: number, name: string, photo: string }>,
	total: ?number,
	nextCursor: ?number,
};

export type SafeFolderPage = {
	folders: SafeFolder[],
	total: number,
	nextOffset: number,
};

export class SafeFolderApi
{
	create(title: string): Promise<SafeFolder>
	{
		return post('sign.api_v1.b2e.document.safeFolder.create', { title });
	}

	rename(folderId: number, newTitle: string): Promise<SafeFolder>
	{
		return post('sign.api_v1.b2e.document.safeFolder.rename', { folderId, newTitle });
	}

	// `targetFolderId` is `null` to move the folder content to the root ("no folder");
	// the backend requires it when the folder is not empty.
	delete(folderId: number, targetFolderId: number | null = null): Promise<Object>
	{
		return post('sign.api_v1.b2e.document.safeFolder.delete', { folderId, targetFolderId });
	}

	getListByDepthLevel(depthLevel: number, limit: number = 50, offset: number = 0): Promise<SafeFolderPage>
	{
		return post('sign.api_v1.b2e.document.safeFolder.listByDepthLevel', { depthLevel, limit, offset });
	}

	// `targetFolderId` is `null` for the root ("no folder").
	moveDocuments(documentIds: number[], targetFolderId: number | null): Promise<SafeFolderMoveResult>
	{
		return post('sign.api_v1.b2e.document.safeFolder.moveDocuments', { documentIds, targetFolderId });
	}

	listPeople(
		folderId: number,
		category: string,
		limit: number,
		afterUserId: ?number,
	): Promise<SafeFolderPeopleResult>
	{
		return post(
			'sign.api_v1.b2e.document.safeFolder.listPeople',
			{ folderId, category, limit, afterUserId },
		);
	}
}

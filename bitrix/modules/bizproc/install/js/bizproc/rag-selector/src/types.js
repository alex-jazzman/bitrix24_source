export type KnowledgeBase = {
	uid: KnowledgeBaseUid,
	name: string,
	description: string,
	fileIds: Array<PersistentFileId | TempFileId>,
	fileIdsReplaces: ?FileIdReplaces,
};

export type TempFileId = string;
export type PersistentFileId = number;

export type KnowledgeBaseUid = string;

export type KnowledgeBaseModifyResult = {
	uid: KnowledgeBaseUid,
	fileIds: Array<PersistentFileId>,
	fileIdsReplaces: FileIdReplaces,
};

export type FileIdReplaces = Record<TempFileId, PersistentFileId>;

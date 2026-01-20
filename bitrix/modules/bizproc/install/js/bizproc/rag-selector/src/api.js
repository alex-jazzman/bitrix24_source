import { ajax } from 'main.core';
import type { KnowledgeBase, KnowledgeBaseModifyResult, KnowledgeBaseUid } from './types';

const post = async (action: string, data: Object): Promise<?Array> => {
	const response = await ajax.runAction(`bizproc.v2.Integration.Rag.${action}`, {
		method: 'POST',
		json: data || {},
	});

	if (response.status === 'success')
	{
		return response.data;
	}

	return null;
};

export class KnowledgeBaseApi
{
	static create(
		name: string,
		description: string,
		fileIds: Array<string>,
	): Promise<KnowledgeBaseModifyResult>
	{
		return post('KnowledgeBase.create', { name, description, fileIds });
	}

	static update(
		uid: KnowledgeBaseUid,
		name: string,
		description: string,
		fileIds: Array<string | number>,
	): Promise<KnowledgeBaseModifyResult>
	{
		return post('KnowledgeBase.update', { uid, name, description, fileIds });
	}

	static get(uid: KnowledgeBaseUid): Promise<KnowledgeBase>
	{
		return post('KnowledgeBase.get', { uid });
	}
}

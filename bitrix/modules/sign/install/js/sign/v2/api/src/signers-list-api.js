import { post } from './request';
import type { Template } from './type';

export type { Template };

export class SignersListApi
{
	deleteSignersList(listId: number, notifyError: boolean = true): Promise<void>
	{
		return post('sign.api_v1.b2e.signers.deleteList', { listId }, notifyError);
	}

	copySignersList(listId: number, notifyError: boolean = true): Promise<void>
	{
		return post('sign.api_v1.b2e.signers.copyList', { listId }, notifyError);
	}

	deleteSignersFromList(listId: number, userIds: number[], notifyError: boolean = true): Promise<void>
	{
		return post('sign.api_v1.b2e.signers.deleteSignersFromList', { listId, userIds }, notifyError);
	}

	createList(title: string, notifyError: boolean = true): Promise<void>
	{
		return post('sign.api_v1.b2e.signers.createList', { title }, notifyError);
	}

	renameList(listId: number, title: string, notifyError: boolean = true): Promise<void>
	{
		return post('sign.api_v1.b2e.signers.renameList', { listId, title }, notifyError);
	}

	addSignersToList(listId: number, members: Array<Object>, excludeRejected: boolean = true, notifyError: boolean = true): Promise<void>
	{
		return post('sign.api_v1.b2e.signers.addSignersToList', { listId, members, excludeRejected }, notifyError);
	}
}
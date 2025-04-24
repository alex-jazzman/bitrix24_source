import { VoteApplication } from 'vote.application';
import { type BackendVote } from './type';

export const BackendModuleId = 'im';
export const BackendEntityType = 'Bitrix\\Vote\\Attachment\\ImMessageConnector';

export type EntityAuthParams = {
	moduleId: string,
	entityId: number,
};

export class ImVoteService
{
	#entityId: number;
	#app: VoteApplication = null;

	constructor(entityType: string, entityId: number)
	{
		this.#entityId = entityId;
		this.#app = VoteApplication.init();
	}

	load(): Promise<boolean>
	{
		return new Promise((resolve, reject) => {
			this.#getAttachedVote()
				.then((response) => {
					this.#updateStore(response?.data?.attach);
					resolve(true);
				})
				.catch((response) => reject(response))
			;
		});
	}

	sendVote(ballot: Record<number, number[]>): Promise
	{
		return this.#sendBackendVote(ballot).then((response) => {
			this.#updateStore(response?.data?.attach);

			return response?.data?.attach;
		});
	}

	#getAttachedVote(): Promise
	{
		return BX.ajax.runAction('vote.AttachedVote.get', {
			data: this.#getEntityParams(),
		});
	}

	revokeVote(): Promise<boolean>
	{
		return new Promise((resolve, reject) => {
			this.#sendVoteRevokeRequest()
				.then((response) => {
					this.#updateStore(response?.data?.attach);
					resolve(true);
				})
				.catch((response) => {
					console.error(response.errors[0].code);
					reject(response);
				});
		});
	}

	completeVote(): Promise<boolean>
	{
		return new Promise((resolve, reject) => {
			this.#sendVoteStopRequest()
				.then(() => {
					resolve(true);
				})
				.catch((response) => {
					console.error(response.errors[0].code);
					reject(response);
				});
		});
	}

	#sendVoteStopRequest(): Promise<void>
	{
		return BX.ajax.runAction('vote.AttachedVote.stop', {
			data: this.#getEntityParams(),
		});
	}

	#sendVoteRevokeRequest(): Promise
	{
		return BX.ajax.runAction('vote.AttachedVote.recall', {
			data: this.#getEntityParams(),
		});
	}

	#sendBackendVote(ballot: Record<number, number[]>): Promise
	{
		return BX.ajax.runAction('vote.AttachedVote.vote', {
			data: {
				...this.#getEntityParams(),
				ballot,
			},
		});
	}

	#getEntityParams(): EntityAuthParams
	{
		return {
			moduleId: BackendModuleId,
			entityType: BackendEntityType,
			entityId: this.#entityId,
		};
	}

	#updateStore(payload: ?BackendVote): void
	{
		if (!payload)
		{
			return;
		}

		this.#app.getStore().dispatch('vote/setCurrentUserVotes', payload.userAnswerMap);
		this.#app.getStore().dispatch('vote/addVote', payload);
		this.#app.getStore().dispatch('vote/addQuestion', payload.QUESTIONS);
		this.#app.getStore().dispatch('vote/addAnswer', payload.QUESTIONS);
	}
}

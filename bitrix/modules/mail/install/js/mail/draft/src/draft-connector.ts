import { ajax } from 'main.core';

import { DraftNotFoundError } from './draft-not-found-error';
import type { DraftContext, DraftSaveRequest, DraftView, RunAction } from './types';

export class DraftConnector
{
	#context: DraftContext;
	#runAction: RunAction;

	constructor(context: DraftContext, runAction: RunAction = ajax.runAction)
	{
		this.#context = Object.freeze({ ...context });
		this.#runAction = runAction;
	}

	async config(): Promise<{ available: boolean, retentionDays: number }>
	{
		const response = await this.#runAction('mail.api.draft.config', { method: 'GET' });

		return response.data as { available: boolean, retentionDays: number };
	}

	async save(request: DraftSaveRequest): Promise<DraftView>
	{
		const action = this.#context.contextType === 'crm'
			? 'crm.api.mail.draft.save'
			: 'mail.api.draft.save';
		const response = await this.#runAction(action, {
			data: {
				...this.#getCrmContext(),
				draftId: request.draftId,
				revision: request.revision,
				snapshot: request.snapshot,
			},
		});

		return response.data.draft as DraftView;
	}

	async get(draftId: number): Promise<DraftView>
	{
		// mail.api.draft.get looks up mail drafts only, CRM drafts are addressed by their entity context
		if (this.#context.contextType === 'crm')
		{
			const draft = await this.getByContext();
			if (draft === null)
			{
				throw new DraftNotFoundError('CRM draft was not found.');
			}

			return draft;
		}

		const response = await this.#runAction('mail.api.draft.get', { data: { draftId } });

		return response.data.draft as DraftView;
	}

	async getByContext(): Promise<DraftView | null>
	{
		const response = await this.#runAction('crm.api.mail.draft.getByContext', {
			data: this.#getCrmContext(),
		});

		return response.data.draft as DraftView | null;
	}

	async deleteCurrent(): Promise<boolean>
	{
		const response = await this.#runAction('crm.api.mail.draft.deleteCurrent', {
			data: this.#getCrmContext(),
		});

		return Boolean(response.data.deleted);
	}

	async delete(draftId: number): Promise<boolean>
	{
		const response = await this.#runAction('mail.api.draft.delete', { data: { draftId } });

		return Boolean(response.data.deleted);
	}

	#getCrmContext(): Record<string, number>
	{
		if (this.#context.contextType !== 'crm')
		{
			return {};
		}

		return {
			entityTypeId: Number(this.#context.crmEntityTypeId || 0),
			entityId: Number(this.#context.crmEntityId || 0),
		};
	}
}

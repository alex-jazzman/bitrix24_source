import type { EditActionParams } from '../types';
import { ACTION_TYPE } from '../constants';
import { BaseAction } from './base-action';

export class EditAction extends BaseAction
{
	static getActionId(): string
	{
		return ACTION_TYPE.EDIT;
	}

	async run(): Promise<void>
	{
		await super.run();
		this.#openDesigner();
	}

	setActionParams(params: EditActionParams): void
	{
		this.editUri = params.editUri;
	}

	#openDesigner(): void
	{
		if (!this.editUri)
		{
			return;
		}

		window.open(this.editUri, '_blank');
	}
}

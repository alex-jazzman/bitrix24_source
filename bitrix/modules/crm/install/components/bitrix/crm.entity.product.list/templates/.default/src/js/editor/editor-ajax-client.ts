import {ajax, Text, Type} from 'main.core';
import {EventEmitter} from 'main.core.events';
import type {Editor} from './product-list-editor';

export class EditorAjaxClient
{
	private readonly editor: Editor;
	private readonly pool: Map<string, string> = new Map();

	constructor(editor: Editor)
	{
		this.editor = editor;
	}

	public request(action: string, data: Record<string, any>): void
	{
		const requestKey = Text.getRandom();
		this.pool.set(action, requestKey);

		if (!Type.isPlainObject(data.options))
		{
			data.options = {};
		}
		data.options.ACTION = action;
		data.options.REQUEST_KEY = requestKey;

		ajax.runComponentAction(
			this.editor.getComponentName(),
			action,
			{
				mode: 'class',
				signedParameters: this.editor.getSignedParameters(),
				data: data
			}
		).then(
			(response: any) => this.handleSuccess(response, data.options),
			(response: any) => this.handleFailure(response, data.options)
		);
	}

	public handleSuccess(response: any, requestOptions: Record<string, any>): void
	{
		if (!this.commonCheck(response) || this.pool.get(response.data.action) !== requestOptions.REQUEST_KEY)
		{
			return;
		}

		this.pool.delete(response.data.action);

		EventEmitter.emit(this.editor, 'onAjaxSuccess', response.data.action);

		switch (response.data.action)
		{
			case 'calculateTotalData':
				if (Type.isPlainObject(response.data.result))
				{
					this.editor.totalsService.apply(response.data.result, requestOptions);
				}
				break;

			case 'calculateProductPrices':
				if (Type.isPlainObject(response.data.result))
				{
					this.editor.currencyManager.applyCalculatedPrices(response.data.result);
				}
				break;
		}
	}

	public handleFailure(response: any, requestOptions: Record<string, any>): void
	{
		this.pool.delete(requestOptions.ACTION);
	}

	public commonCheck(response: any): boolean
	{
		if (!Type.isPlainObject(response))
		{
			return false;
		}

		if (!Type.isStringFilled(response.status))
		{
			return false;
		}

		if (response.status !== 'success')
		{
			return false;
		}

		if (!Type.isPlainObject(response.data))
		{
			return false;
		}

		if (!Type.isStringFilled(response.data.action))
		{
			return false;
		}

		if (!('result' in response.data))
		{
			return false;
		}

		return true;
	}
}

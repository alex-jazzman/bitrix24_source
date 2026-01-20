import { Loc, Type } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';

import type {
	ActionConfig,
	BaseActionType,
} from '../types';

import { AJAX_REQUEST_TYPE } from '../constants';

/**
 * @abstract
 */
export class BaseAction
{
	grid: ?BX.Main.grid;
	filter: ?Object;
	showPopups: ?boolean;

	/**
	 * @abstract
	 */
	static getActionId(): string
	{
		throw new Error('not implemented');
	}

	/**
	 * @returns {ActionConfig}
	 */
	getActionConfig(): ActionConfig
	{
		throw new Error('not implemented');
	}

	constructor(params: BaseActionType)
	{
		this.grid = params.grid;
		this.filter = params.filter;
		this.showPopups = params.showPopups ?? true;
	}

	setActionParams(params: Object): void
	{
	}

	getActionData(): Object
	{
		return {};
	}

	async execute(): void
	{
		await this.onBeforeActionRequest();

		const confirmationPopup = this.showPopups
			? this.getConfirmationPopup()
			: null
		;

		if (confirmationPopup)
		{
			confirmationPopup.setOkCallback(async () => {
				confirmationPopup.close();
				await this.run();
			});

			confirmationPopup.show();
		}
		else
		{
			await this.run();
		}
	}

	async run(): void
	{
	}

	async onBeforeActionRequest(): void
	{
	}

	onAfterActionRequest(): void
	{
		this.grid.reload(() => {
			this.grid.tableUnfade();
		});
	}

	async sendActionRequest(): void
	{
		try
		{
			this.grid.tableFade();

			const actionConfig = this.getActionConfig();
			const actionData = this.getActionData();
			const ajaxOptions = {
				...actionConfig.options,
				json: actionData,
				method: 'POST',
			};

			let result = null;

			switch (actionConfig.type)
			{
				case AJAX_REQUEST_TYPE.CONTROLLER:
					result = await BX.ajax.runAction(
						`bizproc.v2.${actionConfig.name}`,
						ajaxOptions,
					);
					break;

				case AJAX_REQUEST_TYPE.COMPONENT:
					result = await BX.ajax.runComponentAction(
						actionConfig.component,
						actionConfig.name,
						ajaxOptions,
					);
					break;

				default:
				{
					const errorMessage = `Unknown action type: ${actionConfig.type}`;
					this.handleError(errorMessage);
				}
			}

			this.handleSuccess(result);
		}
		catch (result)
		{
			this.handleError(result);
		}
		finally
		{
			await this.onAfterActionRequest();
		}
	}

	handleSuccess(result: any): void
	{
	}

	handleError(result: any): void
	{
		BX.UI.Notification.Center.notify({
			content: this.getErrorMessageFromResult(result),
		});
	}

	getConfirmationPopup(): MessageBox | null
	{
		return null;
	}

	getErrorMessageFromResult(result: any): ?string
	{
		if (Type.isStringFilled(result))
		{
			return result;
		}

		if (Type.isStringFilled(result?.errors?.[0]?.message))
		{
			return result.errors[0].message;
		}

		console.error(result);

		return Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR');
	}
}

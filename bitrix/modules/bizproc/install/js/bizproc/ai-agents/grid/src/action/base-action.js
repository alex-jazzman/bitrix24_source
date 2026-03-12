import { Loc } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';
import { AjaxErrorHandler } from '../handler/ajax-error-handler';

import type {
	ActionConfig,
	BaseAjaxResponse,
	GridApiAction,
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
	#ajaxErrorHandler: AjaxErrorHandler;

	constructor()
	{
		this.#ajaxErrorHandler = new AjaxErrorHandler();
	}

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

	setActionParams(params: Object): void
	{
		this.filter = params?.filter;
		this.showPopups = params?.showPopups ?? true;
	}

	setGrid(grid: ?BX.Main.grid): void
	{
		this.grid = grid;
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
	{}

	async onBeforeActionRequest(): void
	{}

	onAfterActionRequest(): void
	{
		this.grid.reload(() => {
			this.grid.tableUnfade();
		});
	}

	async sendActionRequest(): void
	{
		const actionConfig = this.getActionConfig();

		try
		{
			this.grid.tableFade();

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

					this.handleErrorByMessage(actionConfig.name, {
						errors: [
							{
								message: errorMessage,
							},
						],
					});
				}
			}

			this.handleSuccess(result);
		}
		catch (result)
		{
			this.handleError(actionConfig.name, result);
		}
		finally
		{
			await this.onAfterActionRequest();
		}
	}

	handleSuccess(result: any): void
	{
	}

	handleError(action: GridApiAction, response: BaseAjaxResponse): void
	{
		if (
			!response?.errors
			|| response.errors.length === 0
		)
		{
			return;
		}

		this.#ajaxErrorHandler.handle(action, response);
	}

	handleErrorByMessage(action: GridApiAction, message: ?string): void
	{
		const errorMessage = message ?? Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR');

		this.handleError(action, {
			errors: [
				{
					message: errorMessage,
				},
			],
		});
	}

	getConfirmationPopup(): MessageBox | null
	{
		return null;
	}
}

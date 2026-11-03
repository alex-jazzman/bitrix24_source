import { Loc, Text } from 'main.core';
import { UI } from 'ui.notification';

import { gridApi as Api } from '../api';
import { ACTION_TYPE, CHANGE_OWNER_DIALOG_OUTCOME } from '../constants';
import { showChangeOwnerDialog } from '../dialog/change-owner-dialog';
import { RowHelper } from '../row-helper';

import type {
	ChangeOwnerActionParams,
	ChangeOwnerDialogResult,
	FetchAiAgentRowResponse,
} from '../types';

import { BaseAction } from './base-action';

// Template ids whose transfer is currently in flight. A fresh action instance is created per grid
// click, so the guard against a second transfer of the same copy must live outside the instance.
const transfersInFlight: Set<number> = new Set();

/**
 * Hands a launched AI-agent copy over to another employee: asks for the recipient, sends the
 * transfer and reads the row back. Nothing about the transfer is decided here - the right, the
 * eligibility of the recipient and the actuality of the copy all stay on the server.
 */
export class ChangeOwnerAction extends BaseAction
{
	templateId: number = 0;
	expectedOwnerId: number = 0;

	static getActionId(): string
	{
		return ACTION_TYPE.CHANGE_OWNER;
	}

	setActionParams(params: ChangeOwnerActionParams): void
	{
		super.setActionParams(params);

		this.templateId = Text.toInteger(params.templateId);

		// The owner as the grid was rendered with it, passed on as seen: it is the write condition of
		// the request, so an empty one stays 0 and is not guessed at here.
		this.expectedOwnerId = Text.toInteger(params.expectedOwnerId);
	}

	/**
	 * Blocks a second transfer of the same copy while the first one is still going, the way
	 * RestartAction blocks a repeated restart. The release in the finally is correct for the same
	 * reason: the action has no confirmation popup, so super.execute() awaits the whole cycle - the
	 * dialog, the request and the row refresh - and every exit path, a failed dialog included,
	 * releases the guard for the captured id only.
	 */
	async execute(): Promise<void>
	{
		if (!this.templateId || transfersInFlight.has(this.templateId))
		{
			return;
		}

		const capturedTemplateId = this.templateId;
		transfersInFlight.add(capturedTemplateId);

		try
		{
			await super.execute();
		}
		finally
		{
			transfersInFlight.delete(capturedTemplateId);
		}
	}

	async run(): Promise<void>
	{
		const recipientId = await this.#askForRecipient();

		if (!recipientId)
		{
			return;
		}

		await this.#transfer(recipientId);
	}

	/**
	 * The chosen recipient, or null for both outcomes that must leave the agent alone. A cancellation
	 * is silent by contract - no request, no notification, nothing repainted. A dialog that could not
	 * be loaded or rendered is reported instead: the click would otherwise look like a dead menu item.
	 */
	async #askForRecipient(): Promise<?number>
	{
		let result: ChangeOwnerDialogResult = null;

		try
		{
			result = await showChangeOwnerDialog();
		}
		catch
		{
			UI.Notification.Center.notify({
				content: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR'),
			});

			return null;
		}

		return result?.outcome === CHANGE_OWNER_DIALOG_OUTCOME.CONFIRMED
			? result.userId
			: null;
	}

	/**
	 * The row keeps its loading state for the whole write: the transfer takes a lock on a managed
	 * copy, and the menu the click came from is already closed by then.
	 */
	async #transfer(newOwnerId: number): Promise<void>
	{
		const rowHelper = new RowHelper(this.grid);
		const row = rowHelper.getByTemplateId(this.templateId);

		rowHelper.markAsLoading(row);

		try
		{
			let staleData = false;

			const result = await Api.changeOwner(
				this.templateId,
				this.expectedOwnerId,
				newOwnerId,
				() => {
					staleData = true;
				},
			);

			// A refusal arrives as null and is already reported by the api client through the shared
			// error handler, so the row is left exactly as it was. The one exception is a refusal over
			// stale data: the copy was changed or removed meanwhile, so what is on screen is known to
			// be wrong and the list is reloaded on top of the message.
			if (!result)
			{
				if (staleData)
				{
					this.grid?.reload();
				}

				return;
			}

			await this.#refreshRow(rowHelper, row);
		}
		finally
		{
			rowHelper.markAsLoaded(row);
		}
	}

	/**
	 * The transferred row is read back rather than patched from the answer: the transfer changes both
	 * the owner cell and the actions the current user is left with, and the server owns both.
	 *
	 * Anything that stops the point update - a row that has left the grid, a row payload that did not
	 * arrive - falls back to reloading the list. The copy has already changed hands, so keeping the
	 * previous owner on screen as the current one is the single outcome that is not acceptable.
	 */
	async #refreshRow(rowHelper: RowHelper, row: ?BX.Grid.Row): Promise<void>
	{
		const rowData: ?FetchAiAgentRowResponse = row
			? await Api.fetchRow(this.templateId)
			: null
		;

		if (!row || !rowData?.columns)
		{
			this.grid?.reload();

			return;
		}

		rowHelper.update(row, rowData.columns);
		rowHelper.updateActions(row, rowData.actions);
		rowHelper.highlight(row);
	}
}

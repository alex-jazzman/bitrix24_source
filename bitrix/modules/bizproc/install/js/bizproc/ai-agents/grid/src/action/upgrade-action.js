import { ajax, Loc, Tag, Type } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';
import { SetupTemplate, type FieldsSubmitReview } from 'bizproc.setup-template';

import { ACTION_TYPE, AJAX_REQUEST_TYPE, GRID_API_ACTION, UPGRADE_STATUS } from '../constants';
import { RowHelper } from '../row-helper';
import { AjaxErrorHandler } from '../handler/ajax-error-handler';

import type {
	UpgradeActionParams,
	ActionConfig,
	UpgradeActionDataType,
	UpgradeAgentResponse,
	FetchAiAgentRowResponse,
} from '../types';

import { BaseAction } from './base-action';

// Template ids whose review panel is currently open. A fresh action instance is
// created per grid click, so the guard against re-triggering the upgrade while
// the review panel is open must live outside the instance.
const templatesInReview: Set<number> = new Set();

export class UpgradeAction extends BaseAction
{
	templateId: ?number;
	isCustomized: boolean = false;

	static getActionId(): string
	{
		return ACTION_TYPE.UPGRADE;
	}

	async run(): void
	{
		await this.sendActionRequest();
	}

	// Block a second run (and its confirmation popup) while this agent's review
	// panel is already open — the row keeps the "upgrade" action until the
	// upgrade actually completes, so it can otherwise be clicked again.
	async execute(): Promise<void>
	{
		if (this.templateId && templatesInReview.has(this.templateId))
		{
			return;
		}

		await super.execute();
	}

	setActionParams(params: UpgradeActionParams): void
	{
		super.setActionParams(params);

		this.templateId = Number.parseInt(params.templateId, 10);
		this.isCustomized = params.isCustomized === true;
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: AJAX_REQUEST_TYPE.CONTROLLER,
			name: GRID_API_ACTION.UPGRADE,
		};
	}

	getActionData(): UpgradeActionDataType
	{
		const data: UpgradeActionDataType = {
			...super.getActionData(),
		};

		if (!this.templateId || !Type.isNumber(this.templateId))
		{
			return data;
		}

		data.templateId = this.templateId;

		return data;
	}

	getConfirmationPopup(): MessageBox
	{
		return new MessageBox({
			message: this.#buildConfirmationMessage(),
			title: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_CONFIRM_TITLE'),
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_BUTTON_OK'),
			cancelCaption: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_BUTTON_CANCEL'),
			onCancel: (messageBox) => {
				messageBox.close();
			},
		});
	}

	#buildConfirmationMessage(): HTMLElement
	{
		const versionsText = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_CONFIRM_VERSIONS');
		const activeRunsText = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_CONFIRM_ACTIVE_RUNS');

		return Tag.render`
			<div class="bizproc-ai-agents__upgrade-popup">
				<div class="bizproc-ai-agents__upgrade-popup-versions">${versionsText}</div>
				<div class="bizproc-ai-agents__upgrade-popup-active-runs">${activeRunsText}</div>
				${this.#renderCustomizedWarning()}
			</div>
		`;
	}

	#renderCustomizedWarning(): HTMLElement | string
	{
		if (!this.isCustomized)
		{
			return '';
		}

		const warningText = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_CONFIRM_CUSTOMIZED_WARNING');

		return Tag.render`
			<div class="bizproc-ai-agents__upgrade-popup-customized-warning">${warningText}</div>
		`;
	}

	handleSuccess(result: UpgradeAgentResponse): void
	{
		const status = result?.data?.status;

		if (status === UPGRADE_STATUS.NEEDS_REVIEW)
		{
			this.#openReviewMaster(result?.data?.blocks, result?.data?.values);

			return;
		}

		// Defensive fallback: the review contract (V2′) always returns
		// needs_review on the first call, so the master opens above. A backend
		// that has not yet adopted it may still answer `updated` directly — keep
		// refreshing the row so the upgrade degrades gracefully instead of
		// silently doing nothing.
		if (status === UPGRADE_STATUS.UPDATED)
		{
			this.#reloadRow(result?.data?.row);
			this.#notifyUpdated();

			return;
		}

		// Unknown/unexpected status: surface the failure through the standard
		// action error mechanism instead of a silent no-op that leaves the
		// operator without feedback.
		this.handleErrorByMessage(GRID_API_ACTION.UPGRADE);
	}

	#notifyUpdated(): void
	{
		UI.Notification.Center.notify({
			content: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_NOTIFICATION_TITLE'),
		});
	}

	#reloadRow(rowData: ?FetchAiAgentRowResponse): void
	{
		const rowHelper = new RowHelper(this.grid);
		const row = rowHelper.getByTemplateId(this.templateId);

		if (!row || !rowData?.columns)
		{
			this.grid?.reload();

			return;
		}

		rowHelper.update(row, rowData.columns);
		rowHelper.updateActions(row, rowData.actions);
		rowHelper.highlight(row);
	}

	/**
	 * needs_review (V2′): the master always opens so the operator can review and
	 * edit the new version's editable constants — not only when a required
	 * constant is missing. Field defaults are overridden with the current values
	 * the backend echoes (prefill by constant code); the client never recomputes
	 * them. On submit API-01 re-runs with the collected values — no separate
	 * workflow fill session; the server stays the source of truth for atomicity
	 * and validation.
	 */
	#openReviewMaster(blocks: ?Array<Object>, values: ?{ [key: string]: any }): void
	{
		this.#markReviewOpen();

		SetupTemplate.showFieldsSidePanel({
			templateId: this.templateId,
			blocks: this.#applyValues(Type.isArray(blocks) ? blocks : [], values),
			title: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_SETUP_PANEL_TITLE'),
			submitCaption: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_BUTTON_OK'),
			onSubmit: (constantValues) => this.#submitConstants(constantValues),
			// Release the guard once the panel is gone — covers both a completed
			// upgrade (which closes the panel) and a cancelled review.
			onClose: () => this.#markReviewClosed(),
		});
	}

	#markReviewOpen(): void
	{
		templatesInReview.add(this.templateId);
		this.#setRowLoading(true);
	}

	#markReviewClosed(): void
	{
		templatesInReview.delete(this.templateId);
		this.#setRowLoading(false);
	}

	#setRowLoading(isLoading: boolean): void
	{
		const rowHelper = new RowHelper(this.grid);
		const row = rowHelper.getByTemplateId(this.templateId);

		if (isLoading)
		{
			rowHelper.markAsLoading(row);
		}
		else
		{
			rowHelper.markAsLoaded(row);
		}
	}

	/**
	 * Prefill: project the current values the backend echoes onto the blocks by
	 * overriding each constant's default (matched by constant code = item id).
	 * The backend is the source of truth for values — the client only maps them
	 * so the master renders current values instead of template defaults. Items
	 * without a matching value keep their original default. Returns fresh block
	 * objects so the response payload is not mutated.
	 */
	#applyValues(blocks: Array<Object>, values: ?{ [key: string]: any }): Array<Object>
	{
		if (!Type.isPlainObject(values))
		{
			return blocks;
		}

		return blocks.map((block) => ({
			...block,
			items: (block.items ?? []).map((item) => (
				values[item.id] === undefined
					? item
					: { ...item, default: values[item.id] }
			)),
		}));
	}

	/**
	 * Re-run the upgrade with the collected constant values. Resolves:
	 *  - a review payload — repeated needs_review (a required value is still
	 *    missing or a value was rejected), re-render the fields prefilled with
	 *    the values the server echoed and report which constants to fix;
	 *  - `false` — keep the panel open (handled error);
	 *  - null — the upgrade completed, close the panel and refresh the row.
	 */
	async #submitConstants(constantValues: { [key: string]: any }): Promise<?FieldsSubmitReview | boolean>
	{
		try
		{
			const response: UpgradeAgentResponse = await ajax.runAction(
				`bizproc.v2.${GRID_API_ACTION.UPGRADE}`,
				{
					method: 'POST',
					json: {
						templateId: this.templateId,
						constantValues,
					},
				},
			);

			if (response?.data?.status === UPGRADE_STATUS.NEEDS_REVIEW)
			{
				return this.#buildReview(response);
			}

			this.#reloadRow(response?.data?.row);
			this.#notifyUpdated();

			return null;
		}
		catch (error)
		{
			new AjaxErrorHandler().handle(GRID_API_ACTION.UPGRADE, error);

			return false;
		}
	}

	/**
	 * Build the repeated needs_review payload: the blocks prefilled with the
	 * values the server echoed (so input is preserved) plus the constant codes
	 * the server still reports as missing or invalid. An empty blocks set stays
	 * a review (not a silent no-op) so the form can still explain the state.
	 */
	#buildReview(response: UpgradeAgentResponse): FieldsSubmitReview
	{
		const data = response.data;
		const blocks = Type.isArray(data.blocks) ? data.blocks : [];

		return {
			blocks: this.#applyValues(blocks, data.values),
			requiredConstants: Type.isArray(data.requiredConstants) ? data.requiredConstants : [],
			invalidConstants: Type.isArray(data.invalidConstants) ? data.invalidConstants : [],
		};
	}

	onAfterActionRequest(): void
	{
		this.grid?.tableUnfade();
	}
}

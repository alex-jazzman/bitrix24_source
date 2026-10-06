import { Dom, Loc, Type, Text, Tag, Event } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Button, ButtonSize } from 'ui.buttons';
import { Text as TypographyText } from 'ui.system.typography';
import { SetupTemplate } from 'bizproc.setup-template';
import { gridApi as Api } from '../api';
import { EXISTING_RUNS_WARNING_OUTCOME } from '../constants';
import { showExistingRunsWarning } from '../dialog/existing-runs-warning';
import { RowHelper } from '../row-helper';

import type { GridManager } from '../grid-manager';
import type {
	ExistingRunsDecision,
	ExistingRunsWarningOutcome,
	LaunchControlFieldType,
	RagFilesStatusesDataType,
} from '../types';
import { BaseField } from './base-field';

// Template ids whose launch is currently in flight. A fresh field instance is created per grid
// render, so the guard against a duplicate launch of the same template lives outside the instance.
const launchesInFlight: Set<number> = new Set();

// One warning cycle per page, not per template: while the warning is open, a click on another
// template would get showWarning: false (the right is already spent) and would launch an agent
// from under the open dialog.
//
// The guard holds the cycle that owns it and not just a flag: a cycle may release the guard before it
// ends, so two cycles can overlap, and then a finished one must not release a guard that is now held
// by a cycle whose warning is still open.
let warningCycleOwner = null;

// A click dropped by the cycle guard reuses one balloon instead of stacking a new one per click:
// the notification center replaces a balloon with the same id.
const WARNING_CYCLE_NOTIFICATION_ID = 'bizproc-ai-agents-existing-runs-warning-cycle';

const releaseWarningCycle = (cycleToken: Symbol): void => {
	if (warningCycleOwner === cycleToken)
	{
		warningCycleOwner = null;
	}
};

export class LaunchControlField extends BaseField
{
	render(params: LaunchControlFieldType): void
	{
		if (params.ragFilesStatuses && params.ragFilesStatuses.status) {
			this.#renderLaunchedRagFilesStatuses(params.ragFilesStatuses);
		}
		else if (Type.isNumber(params.launchedAt) && params.launchedAt > 0)
		{
			this.#renderLaunchedDate(params.launchedAt);
		}
		else if (Type.isNumber(params.agentId))
		{
			this.#renderLaunchButton(params);
		}
	}

	#renderLaunchButton(params: { agentId: number }): void
	{
		const button = new Button({
			text: Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH'),
			size: ButtonSize.SMALL,
			tag: Button.Tag.DIV,
			useAirDesign: true,
			onclick: async (buttonInstance: Button): Promise<void> => {
				await this.#handleLaunchButtonClick(params.agentId, buttonInstance);
			},
		});

		Dom.attr(button.getContainer(), 'data-test-id', 'bizproc-ai-agents-grid-action-start-button');

		// ui.buttons DIV tag gives tabindex but no role/keyboard handler: add button semantics and Enter/Space activation.
		// A DIV does not convert Enter/Space to click, so click() runs the existing onclick path exactly once.
		const container = button.getContainer();
		Dom.attr(container, 'role', 'button');
		Event.bind(container, 'keydown', (event: KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
			{
				if (event.repeat || button.isWaiting())
				{
					return;
				}

				event.preventDefault();
				container.click();
			}
		});

		this.appendToFieldNode(button.render());
	}

	/**
	 * Pre-flight step between the click and the launch (ALG-03). A decision of "do not show"
	 * keeps the scenario exactly as it was; a warning is shown instead of an immediate launch, and
	 * the agent is created only by the "launch new" action.
	 *
	 * Fail-open into the launch covers exactly the two steps it is meant for - the pre-flight check
	 * and getting an outcome out of the dialog. What the chosen outcome leads to stays outside it:
	 * after "view launched" a failure must not create the agent the user has just declined.
	 *
	 * Waiting and both guards are released in the finally - the warning guard only while this cycle
	 * still owns it: without the finally an exception would leave the button dead until the page is
	 * reloaded.
	 */
	async #handleLaunchButtonClick(templateId: number, buttonInstance: Button): Promise<void>
	{
		// A repeated click on the same row is answered by that row's own waiting state, so it is
		// dropped in silence.
		if (launchesInFlight.has(templateId))
		{
			return;
		}

		if (warningCycleOwner !== null)
		{
			// The cycle owns the whole page while it checks and while its warning is open, and neither
			// of those states is visible on the button of another row: a silent drop would read as a
			// broken button.
			BX.UI.Notification.Center.notify({
				id: WARNING_CYCLE_NOTIFICATION_ID,
				content: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_LAUNCH_BUSY_NOTIFICATION'),
			});

			return;
		}

		const gridManager = this.getGridManager();
		if (!gridManager?.validateAiAgentsAvailableByTariff())
		{
			return;
		}

		const cycleToken = Symbol('existingRunsWarningCycle');

		launchesInFlight.add(templateId);
		buttonInstance.setWaiting(true);

		try
		{
			if (gridManager.isExistingRunsWarningSpent())
			{
				await this.#runStandardLaunch(templateId);

				return;
			}

			warningCycleOwner = cycleToken;

			const decision = await this.#resolveExistingRunsDecision(templateId);

			if (!decision?.showWarning)
			{
				// Either nothing is to be shown or the check failed before anything was shown: the
				// click keeps its original meaning. No warning appears in this cycle either way, so
				// the page stops blocking the other templates for the whole launch.
				releaseWarningCycle(cycleToken);

				await this.#runStandardLaunch(templateId);

				return;
			}

			// The server has spent the right to show the warning; remember it locally so this page
			// stops asking.
			gridManager.markExistingRunsWarningSpent();
			buttonInstance.setWaiting(false);

			const outcome = await this.#resolveWarningOutcome();

			if (outcome === null)
			{
				// Loading or rendering the warning failed: the right to show it is already spent, but
				// the user must not be left with a dead button.
				await this.#runStandardLaunch(templateId);

				return;
			}

			if (outcome === EXISTING_RUNS_WARNING_OUTCOME.VIEW_LAUNCHED)
			{
				await this.#showLaunchedAgents(gridManager, decision.systemCode);
			}
			else if (outcome === EXISTING_RUNS_WARNING_OUTCOME.LAUNCH_NEW)
			{
				await this.#runStandardLaunch(templateId);
			}
		}
		finally
		{
			buttonInstance.setWaiting(false);
			launchesInFlight.delete(templateId);
			releaseWarningCycle(cycleToken);
		}
	}

	/**
	 * A failed check reports "no decision" and not an error: nothing has been shown to the user yet,
	 * so the caller treats it exactly like a decision of "do not show".
	 */
	async #resolveExistingRunsDecision(templateId: number): Promise<?ExistingRunsDecision>
	{
		try
		{
			return await Api.checkExistingRuns(templateId);
		}
		catch
		{
			return null;
		}
	}

	/**
	 * Null means the warning could not be loaded or rendered, which is the only failure the caller is
	 * allowed to answer with the launch. Every value the user can choose - including a cancel - is a
	 * decision and is returned as such.
	 */
	async #resolveWarningOutcome(): Promise<?ExistingRunsWarningOutcome>
	{
		try
		{
			return await showExistingRunsWarning();
		}
		catch
		{
			return null;
		}
	}

	/**
	 * The transition the user chose instead of the launch, and therefore a step that never throws
	 * outwards: the only fallback the caller has is the launch itself, and running it here would
	 * create the very agent the user has just declined.
	 */
	async #showLaunchedAgents(gridManager: GridManager, systemCode: string): Promise<void>
	{
		let isApplied = false;

		try
		{
			isApplied = await gridManager.applyLaunchedAgentsFilter(systemCode);
		}
		catch
		{
			// The transition the user asked for did not happen, and the right to show the warning is
			// spent on the server, so this transition can never be reached again: silence here would
			// leave the click without any answer. The pre-flight check stays silent for the opposite
			// reason - the user asked for nothing there.
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR'),
			});

			return;
		}

		// The hint is asked for only after a confirmed apply: otherwise it would bind to a container
		// the filter is repainting. Onboarding is optional, hence the guarded call.
		if (!isApplied)
		{
			return;
		}

		try
		{
			gridManager.requestFilterHint?.();
		}
		catch
		{
			// The filter is applied and the transition is done - a missing onboarding hint is nothing
			// to report to the user.
		}
	}

	async #runStandardLaunch(templateId: number): Promise<void>
	{
		const grid = this.getGridManager()?.getGrid();
		grid?.tableFade();

		try
		{
			const result = await Api.copyAndStartTemplate(templateId);

			if (!result)
			{
				return;
			}

			const newRowFields = RowHelper.prepareNewRowParams(
				result?.columns,
				result?.actions,
			);

			new RowHelper(grid).addToGrid(newRowFields);

			const setupTemplate = result?.setupTemplateData;
			if (setupTemplate && Type.isObjectLike(setupTemplate))
			{
				SetupTemplate.showSidePanel(setupTemplate);
			}
		}
		catch (error)
		{
			const message = error?.errors?.[0]?.message
				?? Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH_ERROR')
			;

			BX.UI.Notification.Center.notify({ content: message });
		}
		finally
		{
			grid?.tableUnfade();
		}
	}

	#renderLaunchedDate(timestamp: number): void
	{
		const formattedDate = DateTimeFormat.format('j F, G:i', timestamp);

		const dateNode = TypographyText.render(
			formattedDate,
			{
				size: 'xs',
				tag: 'div',
				className: 'launch-control-field-date',
			},
		);

		Dom.attr(dateNode, 'data-test-id', 'bizproc-ai-agents-grid-started-at');

		this.appendToFieldNode(dateNode);
	}

	#renderLaunchedRagFilesStatuses(ragFilesStatuses: ?RagFilesStatusesDataType): void
	{
		if (!ragFilesStatuses || !ragFilesStatuses.status) {
			return;
		}

		const statusNode = TypographyText.render(
			Text.encode(ragFilesStatuses.statusMessage),
			{
				size: 'xs',
				tag: 'span',
				className: 'launch-control-field-rag-files-status',
			},
		);

		const container = Tag.render`<div class="ui-icon-set__scope launch-control-field-rag-files-statuses ${Text.encode(ragFilesStatuses.iconClass)}"></div>`;
		Dom.append(Tag.render`<span class="main-grid-rag-status-icon"></span>`, container);
		Dom.append(statusNode, container);
		if (ragFilesStatuses.descriptionMessage) {
			const fileDesc = ragFilesStatuses.files.map(
				function(file) {
					return `<div style="display: flex; align-items: center; justify-content: space-between;">`
						+ `<div style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;" title="${Text.encode(file.fileName)}">`
						+ Text.encode(file.fileName)
						+ `</div>`
						+ `<i class="ui-icon-set ${Text.encode(file.iconClass)}" title="${Text.encode(file.statusMessage)}" style="fill:white; background-color:white"></i>`
						+ `</div>`;
				},
			).join('');

			const statusHintNode = document.createElement('span');
			Dom.attr(statusHintNode, 'class', 'launch-control-field-rag-files-hint');
			statusHintNode.dataset.hintHtml = true;
			statusHintNode.dataset.hintInteractivity = true;
			statusHintNode.dataset.hint = `<div class=" --ui-context-content-light">`
				+ `<h4>${Text.encode(ragFilesStatuses.statusMessage)}</h4>`
				+ `<div>${fileDesc}</div>`
				+ `<br><hr><br>`
				+ `<div>${Text.encode(ragFilesStatuses.descriptionMessage)}</div>`
				+ `</div>`;

			Dom.append(statusHintNode, container);
		}

		this.appendToFieldNode(container);
		BX.UI.Hint.init(this.getFieldNode());
	}
}

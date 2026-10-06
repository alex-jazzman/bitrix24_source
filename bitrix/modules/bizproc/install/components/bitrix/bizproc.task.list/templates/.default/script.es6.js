import {Dom, Loc, Reflection, Type} from "main.core";
import {TagSelector} from 'ui.entity-selector';
import {announce, enhanceGrid, makeActivatable, subscribeGridUpdated} from 'bizproc.a11y';

const namespace = Reflection.namespace('BX.Bizproc.Component');

class TaskList
{
	#gridId: string;
	#delegateToSelector: TagSelector;
	#delegateToUserId: number = 0;

	constructor(options: {gridId: string})
	{
		this.#gridId = options.gridId;

		this.#initSelectors();
	}

	#initSelectors(): void
	{
		const self = this;

		this.#delegateToSelector = new TagSelector({
			multiple: false,
			tagMaxWidth: 180,
			events: {
				onTagAdd(event)
				{
					self.#delegateToUserId = parseInt(event.getData().tag.getId());

					if (!Type.isInteger(self.#delegateToUserId))
					{
						self.#delegateToUserId = 0;
					}
				},
				onTagRemove()
				{
					self.#delegateToUserId = 0;
				},
			},
			dialogOptions: {
				entities: [
					{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							inviteEmployeeLink: false,
						},
					},
				],
			}
		});
	}

	init(): void
	{
		const delegateToWrapper = document.getElementById('ACTION_DELEGATE_TO_WRAPPER');
		if (delegateToWrapper)
		{
			this.#delegateToSelector.renderTo(delegateToWrapper);
			Dom.attr(delegateToWrapper, {
				role: 'group',
				'aria-label': Loc.getMessage('BPATL_A11Y_DELEGATE_TO_LABEL'),
			});
		}

		this.#enhanceRows();

		this.subscribeGridEvents();
	}

	// init() runs on every Grid::updated and from the reloadTable() callback, so
	// announcing there would speak twice per group action. A single filtered
	// subscription announces the update once, and only for this grid.
	#gridSubscription = null;

	subscribeGridEvents()
	{
		this.unsubscribeGridEvents();
		this.#gridSubscription = subscribeGridUpdated(
			this.#gridId,
			() => announce(Loc.getMessage('BPATL_A11Y_GRID_UPDATED')),
		);
	}

	unsubscribeGridEvents()
	{
		this.#gridSubscription?.destroy();
		this.#gridSubscription = null;
	}

	destroy()
	{
		this.unsubscribeGridEvents();
	}

	#enhanceRows(): void
	{
		const container = this.getGrid()?.getContainer();
		if (!Type.isDomNode(container))
		{
			return;
		}

		enhanceGrid(container, {
			gridId: this.#gridId,
			rowActionsLabel: Loc.getMessage('BPATL_A11Y_ROW_ACTIONS_LABEL'),
			checkboxesFromTitle: true,
		});

		const links = container.querySelectorAll('.bp-task a, .bp-comments a, .bp-btn-panel a');
		links.forEach((link) => {
			if (Dom.hasClass(link, 'bizproc-a11y-focusable'))
			{
				return;
			}
			// rows bind their own inline click; empty handler adds only focus-visible styling
			makeActivatable(link, () => {});
		});

		container.querySelectorAll('.bp-short-process-step').forEach((step) => {
			if (!step.getAttribute('aria-label'))
			{
				Dom.attr(step, 'aria-label', Loc.getMessage('BPATL_A11Y_PROCESS_FACES_LABEL'));
			}
		});

		container.querySelectorAll('img:not([alt])').forEach((image) => {
			// row images are decorative document icons, adjacent text carries the meaning
			Dom.attr(image, 'alt', '');
		});
	}

	applyActionPanelValues(): void
	{
		const grid = this.getGrid()
		const actionsPanel = grid?.getActionsPanel();

		if (grid && actionsPanel)
		{
			const data = {
				['action_all_rows_' + this.#gridId]: actionsPanel.getForAllCheckbox()?.checked ? 'Y' : 'N',
				ACTION_DELEGATE_TO_ID: this.#delegateToUserId,
				ID: grid.getRows().getSelectedIds(),
			};
			for (const [key, value] of Object.entries(actionsPanel.getValues()))
			{
				data[key] = Type.isString(value) ? value.trim().replace(/^['"]+|['"]+$/g, '') : value;
			}

			this.getGrid()?.reloadTable('POST', data, () => this.init());
		}
	}

	reloadGrid()
	{
		const grid = this.getGrid();
		if (grid)
		{
			grid.reload();
		}
	}

	getGrid(): ?BX.Main.grid
	{
		if (this.#gridId)
		{
			return BX.Main.gridManager && BX.Main.gridManager.getInstanceById(this.#gridId);
		}

		return null;
	}
}

namespace.TaskList = TaskList;

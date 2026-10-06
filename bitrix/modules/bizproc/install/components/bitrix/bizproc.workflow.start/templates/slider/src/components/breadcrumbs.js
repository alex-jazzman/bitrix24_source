import { Tag, Text, Type, Dom, Loc } from 'main.core';

import '../css/components/breadcrumbs.css';

type StepId = string;

export type BreadcrumbsData = {
	items: Array<BreadcrumbsItemData>
};

export type BreadcrumbsItemData = {
	id: string,
	text: string,
	active: boolean,
};

export class Breadcrumbs
{
	#items: Map<StepId, BreadcrumbsItemData> = new Map();
	#itemsNode: Map<StepId, HTMLElement> = new Map();

	#sequenceSteps: [] = [];
	#currentStepId: ?StepId = null;

	constructor(config: BreadcrumbsData = {})
	{
		if (!Type.isArrayFilled(config.items))
		{
			throw new TypeError('BX.Bizproc.Workflow.SingleStart.Breadcrumbs: items must be filled array');
		}

		config.items.forEach((item) => {
			this.#items.set(item.id, item);
			this.#sequenceSteps.push(item.id);
			if (item.active)
			{
				this.#currentStepId = item.id;
			}
		});

		if (!Type.isStringFilled(this.#currentStepId) && Type.isStringFilled(this.#sequenceSteps.at(0)))
		{
			this.#currentStepId = this.#sequenceSteps.at(0);
		}
	}

	render(): HTMLElement
	{
		const label = Text.encode(Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_STEPS_LABEL'));

		return Tag.render`
			<div
				class="bizproc__ws_start__breadcrumbs"
				role="group"
				aria-label="${label}"
				data-testid="bizproc-ws-start-steps"
			>
				${[...this.#items.entries()]
					.map(([key, item]) => this.#renderItem(item, key))
				}
			</div>
		`;
	}

	getCurrentStepTitle(): string
	{
		return this.#items.has(this.#currentStepId) ? this.#items.get(this.#currentStepId).text : '';
	}

	#renderItem(item: BreadcrumbsItemData, stepId: StepId): HTMLElement
	{
		if (!this.#itemsNode.has(stepId))
		{
			const node = Tag.render`
				<div
					class="bizproc__ws_start__breadcrumbs-item${item.active ? ' --active' : ''}"
					data-testid="bizproc-ws-start-step-${stepId}"
				>
					<span>${Text.encode(item.text)}</span>
					<span class="ui-icon-set --chevron-right" aria-hidden="true"></span>
				</div>
			`;
			this.#markCurrent(node, item.active);

			this.#itemsNode.set(stepId, node);
		}

		return this.#itemsNode.get(stepId);
	}

	#markCurrent(node: HTMLElement, isCurrent: boolean)
	{
		Dom.attr(node, 'aria-current', isCurrent ? 'step' : null);
	}

	next()
	{
		if (this.#currentStepId)
		{
			const index = this.#sequenceSteps.indexOf(this.#currentStepId);
			if (index !== -1 && Type.isStringFilled(this.#sequenceSteps.at(index + 1)))
			{
				this.#markNotActive(this.#currentStepId);
				this.#markComplete(this.#currentStepId);
				this.#currentStepId = this.#sequenceSteps.at(index + 1);
				this.#markActive(this.#currentStepId);
			}
		}
	}

	back()
	{
		if (this.#currentStepId)
		{
			const index = this.#sequenceSteps.indexOf(this.#currentStepId);
			if (index !== -1 && index - 1 >= 0 && Type.isStringFilled(this.#sequenceSteps.at(index - 1)))
			{
				this.#markNotActive(this.#currentStepId);
				this.#currentStepId = this.#sequenceSteps.at(index - 1);
				this.#markNotComplete(this.#currentStepId);
				this.#markActive(this.#currentStepId);
			}
		}
	}

	#markNotActive(stepId: StepId)
	{
		if (this.#items.has(stepId))
		{
			this.#items.get(stepId).active = false;
			Dom.removeClass(this.#itemsNode.get(stepId), '--active');
			this.#markCurrent(this.#itemsNode.get(stepId), false);
		}
	}

	#markActive(stepId: StepId)
	{
		if (this.#items.has(stepId))
		{
			this.#items.get(stepId).active = true;
			Dom.addClass(this.#itemsNode.get(stepId), '--active');
			this.#markCurrent(this.#itemsNode.get(stepId), true);
		}
	}

	#markComplete(stepId: StepId)
	{
		if (this.#items.has(stepId))
		{
			Dom.addClass(this.#itemsNode.get(stepId), '--complete');
		}
	}

	#markNotComplete(stepId: StepId)
	{
		if (this.#items.has(stepId))
		{
			Dom.removeClass(this.#itemsNode.get(stepId), '--complete');
		}
	}
}

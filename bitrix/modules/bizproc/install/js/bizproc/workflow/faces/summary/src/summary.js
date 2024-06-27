import { Loc, Tag, Type, Text } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Timeline } from 'bizproc.workflow.timeline';

import 'ui.design-tokens';
import 'ui.icons';
import 'ui.icon-set.main';

import './css/style.css';

export type SummaryData = {
	workflowId: string,
	time: ?number,
	workflowIsCompleted: boolean,
	showArrow: boolean,
	showContent: boolean,
	showTitle: boolean,
};

export class Summary
{
	#isFinal: boolean = false;
	#workflowId: string;
	#showArrow: boolean;
	#showContent: boolean;
	#showTitle: boolean;

	constructor(props: SummaryData = {})
	{
		if (!Type.isStringFilled(props.workflowId))
		{
			throw new TypeError('workflowId must be filled string');
		}
		this.#workflowId = props.workflowId;

		if (Type.isBoolean(props.workflowIsCompleted))
		{
			this.#isFinal = props.workflowIsCompleted;
		}

		this.#showArrow = Type.isBoolean(props.showArrow) ? props.showArrow : true;
		this.#showContent = Type.isBoolean(props.showContent) ? props.showContent : true;
		this.#showTitle = Type.isBoolean(props.showTitle) ? props.showTitle : true;

		this.#calculateDurationTexts(props.time);
	}

	#calculateDurationTexts(time)
	{
		const duration = (
			Type.isNumber(time) && this.#showContent
				? DateTimeFormat.format(
					[['s', 'sdiff'], ['i', 'idiff'], ['H', 'Hdiff'], ['d', 'ddiff'], ['m', 'mdiff'], ['Y', 'Ydiff']],
					0,
					time,
				)
				: null
		);

		this.durationTexts = { nameBefore: '', value: '', nameAfter: '' };

		if (duration)
		{
			const pattern = /\d+/;
			const match = duration.match(pattern);
			if (match)
			{
				this.durationTexts.value = String(match[0]);

				const index = duration.indexOf(this.durationTexts.value);
				if (index !== -1)
				{
					this.durationTexts.nameBefore = duration.slice(0, index).trim();
					this.durationTexts.nameAfter = duration.slice(index + this.durationTexts.value.length).trim();
				}
			}
			else
			{
				this.durationTexts.nameAfter = duration;
			}
		}
	}

	render(): HTMLElement
	{
		const title = Loc.getMessage(
			this.#isFinal
				? 'BIZPROC_JS_WORKFLOW_FACES_SUMMARY_TITLE_FINAL'
				: 'BIZPROC_JS_WORKFLOW_FACES_SUMMARY_TITLE'
			,
		);

		if (this.#showContent)
		{
			return Tag.render`
				<div class="bp-workflow-faces__steps-item --result --summary ${this.#showArrow ? '' : '--arrow-hidden'}">
					<div class="bp-workflow-faces__steps-name">
						<span class="bp-workflow-faces__text-area">${this.#showTitle ? Text.encode(title) : ''}</span>
					</div>
					${this.#renderContent()}
					<div class="bp-workflow-faces__steps-duration" onclick="${this.#openTimeline.bind(this)}">
						<a href="#" class="bp-workflow-faces__text-area">
							${Loc.getMessage('BIZPROC_JS_WORKFLOW_FACES_SUMMARY_TIMELINE')}
						</a>
					</div>
				</div>
			`;
		}

		return Tag.render`
			<div class="bp-workflow-faces__steps-item --result --summary --content-hidden"></div>
		`;
	}

	#renderContent(): HTMLElement
	{
		if (this.#isFinal)
		{
			return Tag.render`
				<div class="bp-workflow-faces__steps-summary">
					<div class="bp-workflow-faces__steps-summary-name">${Text.encode(this.durationTexts.nameBefore)}</div>
					<div class="bp-workflow-faces__steps-summary-value">${Text.encode(this.durationTexts.value)}</div>
					<div class="bp-workflow-faces__steps-summary-name">${Text.encode(this.durationTexts.nameAfter)}</div>
				</div>
			`;
		}

		return Tag.render`
			<div class="bp-workflow-faces__steps-users">
				<div class="ui-icon-set --clock-2 bp-workflow-faces__steps-user"></div>
			</div>
		`;
	}

	#openTimeline(event)
	{
		event.preventDefault();
		Timeline.open({ workflowId: this.#workflowId });
	}
}

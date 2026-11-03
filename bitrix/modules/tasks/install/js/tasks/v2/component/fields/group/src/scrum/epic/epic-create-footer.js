import { Tag } from 'main.core';
import { BaseFooter } from 'ui.entity-selector';

export class EpicCreateFooter extends BaseFooter
{
	render(): HTMLElement
	{
		return Tag.render`
			<div
				class="ui-selector-footer-default tasks-v2-group-epic-footer"
				data-testid="tasks-epic-selector-footer"
			>
				<button
					type="button"
					class="ui-selector-footer-link"
					data-testid="tasks-epic-selector-manage-btn"
					onclick="${this.getOption('onManageEpic')}"
				>
					${this.getOption('manageLabel')}
				</button>
				<span class="tasks-v2-group-epic-footer-hint">
					${this.getOption('hint')}
				</span>
			</div>
		`;
	}
}

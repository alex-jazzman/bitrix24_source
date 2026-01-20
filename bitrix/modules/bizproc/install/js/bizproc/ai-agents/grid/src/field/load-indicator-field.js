import { Tag, Dom } from 'main.core';
import { Text as TypographyText } from 'ui.system.typography';

import GridIcons from '../grid-icons';
import type { LoadIndicatorFieldType } from '../types';
import { BaseField } from './base-field';

export class LoadIndicatorField extends BaseField
{
	render(params: LoadIndicatorFieldType): void
	{
		const percentage = Number.isFinite(params?.percentage) ? params.percentage : 0;
		const showPercentage = percentage > 0;
		let percentageNode = null;

		const percentPerBar = 20;
		const activeBarsCount = Math.ceil(percentage / percentPerBar);

		const svgNode = Tag.render`<div>${GridIcons.LOAD}</div>`;

		const bars = svgNode.querySelectorAll('.agent-grid-load-bar');
		bars.forEach((bar, index) => {
			const currentBarIndex = index + 1;
			if (currentBarIndex <= activeBarsCount && percentage > 0)
			{
				Dom.addClass(bar, '--active');
			}

			Dom.style(bar, '--level', currentBarIndex);
		});

		if (showPercentage)
		{
			const percentageNodeText = `${percentage}%`;

			percentageNode = TypographyText.render(
				percentageNodeText,
				{
					size: 'xs',
					accent: false,
					tag: 'div',
					className: 'agent-grid-load-percentage',
				},
			);
		}

		const container = Tag.render`
			<div class="agent-grid-load-indicator">
			  ${percentageNode ?? ''}
			  <div
				class="agent-grid-load-container"
			  >
				${svgNode}
			  </div>
			</div>
		`;

		this.appendToFieldNode(container);
	}
}

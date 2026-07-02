import { Tag, Dom, Loc } from 'main.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip';

import { BaseField } from './base-field';

const statusConfig = {
	P: {
		getMessage: () => Loc.getMessage('MAIL_PASSWORDLESS_GRID_STATUS_PENDING'),
		design: ChipDesign.OutlineSuccess,
	},
	C: {
		getMessage: () => Loc.getMessage('MAIL_PASSWORDLESS_GRID_STATUS_CANCELED'),
		design: ChipDesign.OutlineAlert,
	},
};

export class StatusField extends BaseField
{
	render(params: { status: string }): void
	{
		const config = statusConfig[params.status as keyof typeof statusConfig];
		if (!config)
		{
			return;
		}

		const container = Tag.render`
			<div class="passwordless-grid_status-field-container"></div>
		`;

		const chip = new Chip({
			size: ChipSize.Sm,
			text: config.getMessage() ?? '',
			design: config.design,
			rounded: true,
		});

		Dom.append(chip.render(), container);

		this.appendToFieldNode(container);
	}
}

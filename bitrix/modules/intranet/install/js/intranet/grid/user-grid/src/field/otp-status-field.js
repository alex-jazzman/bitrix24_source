import { Event } from 'main.core';
import { Hint } from 'ui.hint';
import { Outline } from 'ui.icon-set.api.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip';

import { BaseField } from './base-field';

const StatusDesign = {
	enabled: ChipDesign.TintedSuccess,
	update_required: ChipDesign.TintedWarning,
	update_recommended: ChipDesign.Filled,
	enable_required: ChipDesign.TintedAlert,
	disabled: ChipDesign.TintedNoAccent,
};

const otpHint = Hint.createInstance({
	popupParameters: {
		maxWidth: 350,
		offsetLeft: 9,
		offsetTop: 2,
		bindOptions: { forceBindPosition: true },
	},
});

export class OtpStatusField extends BaseField
{
	render(params: {
		status: string,
		label: string,
		hint: string,
	}): void
	{
		const { status, label, hint } = params;
		const design = StatusDesign[status] || StatusDesign.disabled;
		const testId = `intranet-otp-user-list-otp-status-${status ?? 'disabled'}`;

		const chip = new Chip({
			text: label,
			design,
			size: ChipSize.Sm,
			icon: Outline.QUESTION,
			rounded: true,
		});

		const chipElement = chip.render();
		chipElement.setAttribute('data-testid', testId);
		this.appendToFieldNode(chipElement);

		if (hint)
		{
			const iconElement = chipElement.querySelector('.ui-chip-icon');
			if (iconElement)
			{
				iconElement.setAttribute('data-hint', hint);
				iconElement.setAttribute('data-hint-no-icon', '');

				Event.bind(chipElement, 'mouseenter', () => otpHint.show(iconElement, hint, false, true));
				Event.bind(chipElement, 'mouseleave', () => otpHint.hide(iconElement));
			}
		}
	}
}
import { BaseField } from './base-field';
import { Tag, Loc } from 'main.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip';

export type CRMStatusFieldType = {
	enabled: boolean,
}

export class CRMStatusField extends BaseField
{
	render(params: CRMStatusFieldType): void
	{
		const crmStatusContainer = Tag.render`
			<div class="mailbox-grid_active-status-container">
				${this.#getStatusLabel(params.enabled)}
			</div>
		`;

		this.appendToFieldNode(crmStatusContainer);
	}

	#getStatusLabel(active: boolean): HTMLElement
	{
		const text = active
			? Loc.getMessage('MAIL_MAILBOX_LIST_FIELD_CRM_STATUS_ENABLED')
			: Loc.getMessage('MAIL_MAILBOX_LIST_FIELD_CRM_STATUS_DISABLED')
		;

		const design = active
			? ChipDesign.OutlineSuccess
			: ChipDesign.Outline
		;

		return new Chip({
			size: ChipSize.Sm,
			rounded: true,
			text,
			design,
		}).render();
	}
}

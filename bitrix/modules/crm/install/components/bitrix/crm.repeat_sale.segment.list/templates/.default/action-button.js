import { Reflection } from 'main.core';
import { SidePanel } from 'ui.sidepanel';

const namespace = Reflection.namespace('BX.Crm.RepeatSale.SegmentList');

export class ActionButton {

	execute(): void
	{
		if (!SidePanel.Instance)
		{
			console.error('SidePanel.Instance not found');

			return;
		}

		SidePanel.Instance.open(
			`/crm/repeat-sale-segment/details/0/`,
			{
				cacheable: false,
				width: 700,
				allowChangeHistory: false,
			}
		);
	}
}

namespace.ActionButton = ActionButton;

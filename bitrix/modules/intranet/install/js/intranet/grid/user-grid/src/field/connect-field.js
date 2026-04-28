import { BaseField } from './base-field';
import { Loc } from 'main.core';

export type ConnectFieldType = {
	userId: number,
}

export class ConnectField extends BaseField
{
	render(params: ConnectFieldType): void
	{
		const button = new BX.UI.Button({
			text: Loc.getMessage('INTRANET_JS_CONTROL_BUTTON_SEND_MESSAGE'),
			useAirDesign: true,
			style: BX.UI.AirButtonStyle.FILLED,
			size: BX.UI.Button.Size.EXTRA_SMALL,
			onclick: () => {
				top.BXIM?.openMessenger(params.userId);
			},
		});

		button.renderTo(this.getFieldNode());
	}
}

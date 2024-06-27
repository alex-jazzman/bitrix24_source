import { BaseField } from './base-field';
import { Loc, Tag, Dom } from 'main.core';
import { GridManager } from '../grid-manager';
import 'ui.cnt';

export type ActivityFieldType = {
	gridId: string,
	userId: number,
	action: string,
	isExtranet: boolean,
}

export class ActivityField extends BaseField
{
	render(params: ActivityFieldType): void
	{
		let title = '';
		let color = '';

		switch (params.action ?? 'invite')
		{
			case 'accept':
				title = Loc.getMessage('INTRANET_JS_CONTROL_BUTTON_ACCEPT_ENTER');
				color = BX.UI.Button.Color.PRIMARY;
				break;
			case 'invite':
			default:
				title = Loc.getMessage('INTRANET_JS_CONTROL_BUTTON_INVITE_AGAIN');
				color = BX.UI.Button.Color.LIGHT_BORDER;
				break;
		}

		const onclick = () => {
			if (params.action === 'invite')
			{
				button.setWaiting(true);
				GridManager.reinviteAction(params.userId, params.isExtranet).then(() => {
					button.setWaiting(false);
				});
			}
			else if (params.action === 'accept')
			{
				GridManager.getInstance(params.gridId).confirmAction({
					isAccept: true,
					userId: params.userId,
				});
			}
		};

		const counter = Tag.render`
			<div class="ui-counter user-grid_invitation-counter">
				<div class="ui-counter-inner">1</div>
			</div>
		`;

		Dom.append(counter, this.getFieldNode());

		const button = new BX.UI.Button({
			text: title,
			color,
			noCaps: true,
			size: BX.UI.Button.Size.EXTRA_SMALL,
			tag: BX.UI.Button.Tag.INPUT,
			round: true,
			onclick,
		});

		button.renderTo(this.getFieldNode());
	}
}

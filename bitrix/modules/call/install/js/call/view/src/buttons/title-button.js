import { Dom, Loc, Text, Type } from 'main.core';

export class TitleButton
{
	constructor(config)
	{
		this.elements = {
			root: null,
		};

		this.text = Type.isStringFilled(config.text) ? config.text : '';
		this.isGroupCall = config.isGroupCall;
	}

	render()
	{
		this.elements.root = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-title' },
			html: this.getTitle(),
		});

		return this.elements.root;
	}

	getTitle()
	{
		const prettyName = `<span class="bx-messenger-videocall-panel-title-name">${Text.encode(this.text)}</span>`;

		if (this.isGroupCall)
		{
			return Loc.getMessage('IM_M_GROUP_CALL_WITH').replace('#CHAT_NAME#', prettyName);
		}

		return Loc.getMessage('IM_M_CALL_WITH').replace('#USER_NAME#', prettyName);
	}

	update(config)
	{
		this.text = Type.isStringFilled(config.text) ? config.text : '';
		this.isGroupCall = config.isGroupCall;
		this.elements.root.innerHTML = this.getTitle();
	}
}

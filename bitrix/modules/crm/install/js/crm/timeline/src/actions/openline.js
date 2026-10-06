import { Tag } from 'main.core';
import { alert } from 'crm.timeline.dialog';

import Activity from ".//activity";

/** @memberof BX.Crm.Timeline.Actions */
export class OpenLine extends Activity
{
	constructor()
	{
		super();
		this._clickHandler = BX.delegate(this.onClick, this);
		this._button = null;
	}

	getButton()
	{
		return this._button;
	}

	onClick()
	{
		if(typeof(window.top['BXIM']) === 'undefined')
		{
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
			alert({
				content: Tag.render`<div>${this.getMessage("openLineNotSupported")}</div>`,
			});
			return;
		}

		let slug = "";
		const communication = BX.prop.getObject(this._entityData, "COMMUNICATION", null);
		if(communication)
		{
			if(BX.prop.getString(communication, "TYPE") === "IM")
			{
				slug = BX.prop.getString(communication, "VALUE");
			}
		}

		if(slug !== "")
		{
			window.top['BXIM'].openMessengerSlider(slug, {RECENT: 'N', MENU: 'N'});
		}
	}

	doLayout()
	{
		this._button = BX.create("DIV",
			{
				attrs: { className: "crm-entity-stream-content-action-reply-btn" },
				events: { "click": this._clickHandler }
			}
		);
		this._container.appendChild(this._button);
	}

	getMessage(name)
	{
		const m = OpenLine.messages;
		return m.hasOwnProperty(name) ? m[name] : name;
	}

	static create(id, settings)
	{
		const self = new OpenLine();
		self.initialize(id, settings);
		return self;
	}

	static messages = {};
}

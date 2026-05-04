import { Runtime } from 'main.core';

export class Analytics
{
	#isAdmin: boolean;

	constructor(isAdmin: boolean)
	{
		this.#isAdmin = isAdmin ? AnalyticUserRole.ADMIN : AnalyticUserRole.NOT_ADMIN;
	}

	sendSetCustomPreset()
	{
		this.#sendData({
			tool: AnalyticTool,
			category: AnalyticCategory.MENU,
			event: AnalyticEvent.SET,
			type: 'custom',
			c_section: AnalyticSection.MENU,
			p1: this.#isAdmin,
		});
	}

	sendSetPreset(presetId: string, isPersonal: boolean, action)
	{
		this.#sendData({
			type: presetId,
			event: isPersonal ? AnalyticEvent.CHANGE : AnalyticEvent.SELECT,
			tool: AnalyticTool,
			category: isPersonal ? AnalyticCategory.MENU : AnalyticCategory.TOOL,
			c_section: isPersonal ? AnalyticSection.MENU : AnalyticSection.POPUP,
			c_element: action,
			p1: this.#isAdmin,
		});
	}

	sendClose()
	{
		this.#sendData({
			event: AnalyticEvent.SHOW,
			tool: AnalyticTool,
			category: AnalyticCategory.TOOL,
			c_section: AnalyticSection.POPUP,
		});
	}

	#sendData(data: any): void
	{
		Runtime.loadExtension('ui.analytics')
			.then((exports) => {
				exports.sendData(data);
			})
			.catch((err) => {
				console.error(err);
			});
	}
}

const AnalyticCategory = {
	TOOL: 'main_tool',
	MENU: 'main_menu',
};

const AnalyticEvent = {
	SHOW: 'window_show',
	SELECT: 'select',
	CHANGE: 'change',
	SET: 'menu_set',
};

const AnalyticUserRole = {
	ADMIN: 'isAdmin_Y',
	NOT_ADMIN: 'isAdmin_N',
};

const AnalyticSection = {
	POPUP: 'menu_popup',
	PRESET: 'preset',
	QUALIFICATION: 'qualification',
	SETTINGS: 'settings',
	MENU: 'main_menu',
};

export const AnalyticActions = {
	CONFIRM: 'confirm',
	LATER: 'later',
	CLOSE: 'close',
	SAVE: 'save',
	SKIP: 'skip',
};

const AnalyticTool = 'intranet';

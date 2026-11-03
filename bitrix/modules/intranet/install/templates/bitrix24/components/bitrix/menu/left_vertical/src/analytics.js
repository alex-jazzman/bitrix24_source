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

	sendMainToolPickerShown(openingReason: string): void
	{
		this.#sendData({
			event: AnalyticEvent.SHOW,
			tool: AnalyticTool,
			category: AnalyticCategory.TOOL,
			c_section: openingReason === 'auto' ? AnalyticSection.POPUP : AnalyticSection.MENU,
			p1: this.#isAdmin,
			p3: `openingReason_${openingReason}`,
		});
	}

	sendMainToolPickerApplied(presetId: string, applyForAll: boolean, openingReason: string): void
	{
		this.#sendData({
			type: presetId,
			event: applyForAll ? AnalyticEvent.SELECT : AnalyticEvent.CHANGE,
			tool: AnalyticTool,
			category: applyForAll ? AnalyticCategory.TOOL : AnalyticCategory.MENU,
			c_section: openingReason === 'auto' ? AnalyticSection.POPUP : AnalyticSection.MENU,
			c_element: AnalyticActions.CONFIRM,
			p1: this.#isAdmin,
			p2: applyForAll ? 'scope_global' : 'scope_personal',
			p3: `openingReason_${openingReason}`,
		});
	}

	sendMainToolPickerClosed(openingReason: string): void
	{
		this.#sendData({
			event: openingReason === 'auto' ? AnalyticEvent.SELECT : AnalyticEvent.CHANGE,
			tool: AnalyticTool,
			category: openingReason === 'auto' ? AnalyticCategory.TOOL : AnalyticCategory.MENU,
			c_section: openingReason === 'auto' ? AnalyticSection.POPUP : AnalyticSection.MENU,
			c_element: AnalyticActions.CLOSE,
			p1: this.#isAdmin,
			p3: `openingReason_${openingReason}`,
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

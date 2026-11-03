type PopupTrigger = 'hover' | 'click';
type InfoPopupTypeConfig = {
	trigger: PopupTrigger;
	messageCode: string;
};

const infoPopupTypeConfigs: Record<string, InfoPopupTypeConfig> = {
	call: {
		trigger: 'hover',
		messageCode: 'CRM_AI_REPORT_DRAWER_INFO_POPUP_BUTTON_CALL',
	},
	email: {
		trigger: 'hover',
		messageCode: 'CRM_AI_REPORT_DRAWER_INFO_POPUP_BUTTON_EMAIL',
	},
	'open-lines': {
		trigger: 'hover',
		messageCode: 'CRM_AI_REPORT_DRAWER_INFO_POPUP_BUTTON_OPEN_LINES',
	},
};

export function resolveInfoPopupTypeConfig(type: string): InfoPopupTypeConfig
{
	const config = infoPopupTypeConfigs[type];
	if (!config)
	{
		throw new Error(`Unsupported info popup type: ${type}`);
	}

	return config;
}

export function resolveInfoPopupTrigger(type: string): PopupTrigger
{
	return resolveInfoPopupTypeConfig(type).trigger;
}

export function resolveInfoPopupButtonMessageCode(type: string): string
{
	return resolveInfoPopupTypeConfig(type).messageCode;
}

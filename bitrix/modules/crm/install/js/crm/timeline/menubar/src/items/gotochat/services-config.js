import { Loc } from 'main.core';
import { Outline, Social } from 'ui.icon-set.api.core';

import { type ChatService } from './types';

const ServicesConfig: ReadonlyMap<string, ChatService> = new Map([
	[
		'whatsapp',
		{
			id: 'whatsapp',
			connectorId: 'notifications',
			connectLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_WHATSAPP'),
			inviteLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_WHATSAPP'),
			soonLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SOON_WHATSAPP'),
			title: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_WHATSAPP'),
			region: '!ru',
			iconClass: Outline.WHATSAPP,
			checkServiceId: 'virtual_whatsapp',
		},
	],
	[
		'telegrambot',
		{
			id: 'telegrambot',
			connectorId: 'telegrambot',
			connectLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_TELEGRAM'),
			inviteLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_TELEGRAM'),
			title: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_TELEGRAM'),
			iconClass: Outline.TELEGRAM,
		},
	],
	[
		'max',
		{
			id: 'max',
			connectorId: 'max',
			connectLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_MAX'),
			inviteLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_MAX'),
			title: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_MAX'),
			region: ['ru', 'by', 'kz', 'kg', 'tj', 'uz'],
			iconClass: Outline.MAX,
		},
	],
	[
		'ru-whatsapp',
		{
			id: 'ru-whatsapp',
			connectorId: 'notifications',
			connectLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_WHATSAPP'),
			disabledLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_WHATSAPP'),
			inviteLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_WHATSAPP'),
			soonLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SOON_WHATSAPP'),
			disabledHint: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_WHATSAPP_DISABLED_HINT'),
			title: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_WHATSAPP'),
			region: 'ru',
			iconClass: Outline.WHATSAPP,
			checkServiceId: 'virtual_whatsapp',
			hideOnBox: true,
		},
	],
	// [
	// 	'vkgroup',
	// 	{
	// 		id: 'vkgroup',
	// 		connectorId: '',
	// 		connectLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_VK'),
	// 		inviteLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_VK'),
	// 		soonLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SOON_VK'),
	// 		title: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_VK'),
	// 		region: 'ru',
	// 		iconClass: Social.VK,
	// 	},
	// ],
	[
		'facebook',
		{
			id: 'facebook',
			connectorId: '',
			connectLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_FACEBOOK'),
			inviteLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_FACEBOOK'),
			soonLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SOON_FACEBOOK'),
			title: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_FACEBOOK'),
			region: '!ru',
			iconClass: Social.FACEBOOK,
		},
	],
]);

export default ServicesConfig;

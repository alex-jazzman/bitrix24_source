import { Loc } from 'main.core';

import {
	registration as integrationsRegistration,
} from '../../setting/comms/integrations';
import {
	registration as smsMarketplaceRegistration,
} from '../../setting/comms/sms-marketplace';
import {
	registration as mailSendsaveRegistration,
} from '../../setting/comms/mail-sendsave';
import {
	registration as actMarkFwdEmaiOutgoingRegistration,
} from '../../setting/comms/act-mark-fwd-emai-outgoing';
import {
	registration as activityEnableUnconnectedRecipientsRegistration,
} from '../../setting/comms/activity-enable-unconnected-recipients';
import {
	registration as activityOutgoingEmailOwnerTypeRegistration,
} from '../../setting/comms/activity-outgoing-email-owner-type';
import {
	registration as emailServiceCodeAllocationRegistration,
} from '../../setting/comms/email-service-code-allocation';
import {
	registration as enableB24EmailSignRegistration,
} from '../../setting/comms/enable-b24-email-sign';
import {
	registration as mailTrackerRegistration,
} from '../../setting/comms/mail-tracker';
import {
	registration as mailTemplatesRegistration,
} from '../../setting/comms/mail-templates';
import {
	registration as calltoFrmtRegistration,
} from '../../setting/comms/callto-frmt';
import {
	registration as calltoUrlTemplateRegistration,
} from '../../setting/comms/callto-url-template';
import {
	registration as calltoClickHandlerRegistration,
} from '../../setting/comms/callto-click-handler';
import {
	registration as calltoNormalizeNumberRegistration,
} from '../../setting/comms/callto-normalize-number';
import {
	registration as smsLimitsRegistration,
} from '../../setting/comms/sms-limits';
import {
	registration as crmSenderRegistration,
} from '../../setting/comms/crm-sender';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const commsSection: SettingsSectionRegistration = {
	id: 'comms',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_COMMS_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'mail_and_channels',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_MAIL_AND_CHANNELS_TITLE'),
			icon: 'o-open-channels',
			settings: [
				integrationsRegistration,
				smsMarketplaceRegistration,
				mailSendsaveRegistration,
			],
		},
		{
			id: 'emails',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_EMAILS_TITLE'),
			icon: 'o-mail',
			settings: [
				actMarkFwdEmaiOutgoingRegistration,
				activityEnableUnconnectedRecipientsRegistration,
				activityOutgoingEmailOwnerTypeRegistration,
				emailServiceCodeAllocationRegistration,
				enableB24EmailSignRegistration,
				mailTrackerRegistration,
				mailTemplatesRegistration,
			],
		},
		{
			id: 'telephony',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_TELEPHONY_TITLE'),
			icon: 'o-telephony',
			settings: [
				calltoFrmtRegistration,
				calltoUrlTemplateRegistration,
				calltoClickHandlerRegistration,
				calltoNormalizeNumberRegistration,
			],
		},
		{
			id: 'sms',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_SMS_TITLE'),
			icon: 'o-sms',
			settings: [
				smsLimitsRegistration,
			],
		},
		{
			id: 'notifications',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_NOTIFICATIONS_TITLE'),
			icon: 'o-notification',
			settings: [
				crmSenderRegistration,
			],
		},
	],
};

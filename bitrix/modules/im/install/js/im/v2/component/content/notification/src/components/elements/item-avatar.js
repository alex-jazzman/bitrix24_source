import { ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { Type } from 'main.core';

import './css/item-avatar.css';

import type { ImModelUser } from 'im.v2.model';

const NotificationSystemIconClasses = Object.freeze({
	default: '--default',
	biconector: '--bi-constructor',
	app: '--app',
	bizproc: '--bizproc',
	newsfeed: '--newsfeed',
	group: '--group',
	flow: '--flow',
	sign: '--sign',
	videoConf: '--video-conf',
	openLines: '--open-lines',
	voximplant: '--voximplant',
	booking: '--booking',
	calendar: '--calendar',
	b24: '--b24',
	mail: '--mail',
	tariff: '--license',
	disk: '--disk',
	crm: '--crm',
	company: '--company',
	contact: '--contact',
	deal: '--deal',
	lead: '--lead',
	quote: '--quote',
	order: '--order',
	smartProcess: '--smart-process',
	timeline: '--timeline',
	invoice: '--invoice',
});

const NotificationIconModuleClasses = Object.freeze({
	biconector: NotificationSystemIconClasses.biconector,
	bizproc: NotificationSystemIconClasses.bizproc,
	blog: NotificationSystemIconClasses.newsfeed,
	socialnetwork: NotificationSystemIconClasses.group,
	sign: NotificationSystemIconClasses.sign,
	imconnector: NotificationSystemIconClasses.openLines,
	imopenlines: NotificationSystemIconClasses.openLines,
	voximplant: NotificationSystemIconClasses.voximplant,
	voximplantcontroller: NotificationSystemIconClasses.voximplant,
	booking: NotificationSystemIconClasses.booking,
	calendar: NotificationSystemIconClasses.calendar,
	intranet: NotificationSystemIconClasses.b24,
	sender: NotificationSystemIconClasses.mail,
	mail: NotificationSystemIconClasses.mail,
	bitrix24: NotificationSystemIconClasses.tariff,
	disk: NotificationSystemIconClasses.disk,
	crm: NotificationSystemIconClasses.crm,
});

// @vue/component
export const ItemAvatar = {
	name: 'ItemAvatar',
	components: { ChatAvatar },
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	computed: {
		AvatarSize: () => AvatarSize,
		isSystem(): boolean
		{
			return this.userId === 0;
		},
		userId(): string
		{
			return this.notification.authorId;
		},
		userDialogId(): string
		{
			return this.userId.toString();
		},
		user(): ?ImModelUser
		{
			// For now, we don't have a user if it is an OL user.
			return this.$store.getters['users/get'](this.userId);
		},
		systemIconClass(): string
		{
			const systemIcon = this.notification.params?.componentParams?.systemIcon;
			if (Type.isStringFilled(systemIcon))
			{
				return NotificationSystemIconClasses[systemIcon] || NotificationSystemIconClasses.default;
			}

			let moduleId = this.notification.moduleId;
			if (!moduleId) // check push, because in push moduleId is empty, but settingName is filled
			{
				const settingName = this.notification.settingName ?? '';
				moduleId = settingName.split('|')[0].trim();
			}

			return NotificationIconModuleClasses[moduleId] || NotificationSystemIconClasses.default;
		},
	},
	template: `
		<div class="bx-im-content-notification-item-avatar__container">
			<div 
				v-if="isSystem || !user"
				class="bx-im-content-notification-item-avatar__system-icon"
				:class="systemIconClass"
			></div>
			<ChatAvatar 
				v-else 
				:avatarDialogId="userDialogId" 
				:contextDialogId="userDialogId" 
				:size="AvatarSize.M" 
			/>
		</div>
	`,
};

import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { NotificationTypesCodes } from 'im.v2.const';
import { Attach } from 'im.v2.component.elements.attach';
import { Parser } from 'im.v2.lib.parser';
import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';

import { QuickAnswer } from '../../elements/quick-answer';
import { ItemConfirmButtons } from '../../elements/item-confirm-buttons';
import { ItemAvatar } from '../../elements/item-avatar';
import { ItemActions } from '../../elements/item-actions';
import { ItemReaction } from '../../elements/item-reaction';
import { NotificationMenu } from '../../../classes/notification-menu';
import { BaseNotificationItemHeader } from './base-header';
import { NotificationReadService } from '../../../classes/notification-read-service';
import { PlainText } from '../../base/plain';

import type { ImModelNotification, ImModelUser, ImModelNotificationParams } from 'im.v2.model';

import '../../elements/css/item.css';

// @vue/component
export const BaseNotificationItem = {
	name: 'BaseNotificationItem',
	components: {
		ItemAvatar,
		QuickAnswer,
		PlainText,
		ItemConfirmButtons,
		ItemActions,
		ItemReaction,
		Attach,
		BaseNotificationItemHeader,
	},
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	emits: [
		'buttonsClick',
		'confirmButtonsClick',
		'deleteClick',
		'sendQuickAnswer',
		'moreUsersClick',
	],
	computed: {
		NotificationTypesCodes: () => NotificationTypesCodes,
		notificationItem(): ImModelNotification
		{
			return this.notification;
		},
		params(): Object
		{
			return this.notificationItem.params;
		},
		componentParams(): ?ImModelNotificationParams
		{
			return this.notificationItem?.params?.componentParams;
		},
		entity(): ?Object
		{
			return this.componentParams?.entity;
		},
		type(): number
		{
			return this.notification.sectionCode;
		},
		isUnread(): boolean
		{
			return !this.notificationItem.read;
		},
		userData(): ImModelUser
		{
			return this.$store.getters['users/get'](this.notificationItem.authorId, true);
		},
		date(): Date
		{
			return this.notificationItem.date;
		},
		hasQuickAnswer(): boolean
		{
			return Boolean(this.params?.canAnswer === 'Y');
		},
		hasReaction(): boolean
		{
			return Type.isStringFilled(this.entity?.reaction);
		},
		attachList(): ?Array
		{
			return this.params?.attach;
		},
		itemDate(): string
		{
			return DateFormatter.formatByTemplate(this.date, DateTemplate.notification);
		},
		canDelete(): boolean
		{
			return this.notificationItem.sectionCode === NotificationTypesCodes.simple;
		},
		showDetailedBlock(): boolean
		{
			const type = this.entity?.contentType;

			return Boolean(type);
		},
		isSubjectOnly(): boolean
		{
			return this.params?.componentParams?.subject
				&& !this.params?.componentParams?.plainText
				&& !this.entity
			;
		},
	},
	created()
	{
		this.notificationReadService = new NotificationReadService();
		EventEmitter.subscribe(
			NotificationMenu.events.markAsUnreadClick,
			this.markAsUnreadClick,
		);
	},
	beforeUnmount()
	{
		this.notificationReadService.destroy();
		EventEmitter.unsubscribe(
			NotificationMenu.events.markAsUnreadClick,
			this.markAsUnreadClick,
		);
	},
	methods: {
		markAsUnreadClick(event)
		{
			const notificationFromEvent: ImModelNotification = event.getData();

			if (this.notificationItem.id === notificationFromEvent.id)
			{
				this.notificationReadService.changeReadStatus(this.notificationItem.id);
			}
		},
		onConfirmButtonsClick(event): void
		{
			this.$emit('confirmButtonsClick', event);
		},
		onSendQuickAnswer(event): void
		{
			this.$emit('sendQuickAnswer', event);
		},
		onDeleteClick(): void
		{
			this.$emit('deleteClick', this.notificationItem.id);
		},
		onUnsubscribeClick(): void
		{
			this.$emit('unsubscribeClick', this.notificationItem.id);
		},
		onContentClick(event): void
		{
			Parser.executeClickEvent(event, { emitter: this.getEmitter() });
		},
		onMoreUsersClick(event): void
		{
			this.$emit('moreUsersClick', event);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div
			class="bx-im-content-notification-item__container"
			:class="{'--unread': isUnread}"
			:data-test-id="'im-content-notification-item-container-' + notificationItem.id"
		>
			<ItemAvatar :notification="notificationItem"/>
			<div class="bx-im-content-notification-item__content-container" :class="{ '--subject-only': isSubjectOnly }">
				<slot name="header">
					<BaseNotificationItemHeader
						:notification="notificationItem"
						@moreUsersClick="onMoreUsersClick"
					/>
				</slot>
				<ItemActions
					:canDelete="canDelete"
					:notification="notificationItem"
					@deleteClick="onDeleteClick"
					@unsubscribeClick="onUnsubscribeClick"
					@markAsUnreadClick="markAsUnreadClick"
				/>
				<PlainText :notification="notificationItem" />
				<div 
					class="bx-im-content-notification-item-content__container"
					:class="{ '--subject-only': isSubjectOnly }"
					@click="onContentClick"
				>
					<div :class="{ 'bx-im-content-notification-item-content__details': showDetailedBlock }">
						<slot name="content"></slot>
						<ItemReaction v-if="hasReaction" :notification="notificationItem" />
					</div>
					<QuickAnswer
						v-if="hasQuickAnswer"
						:notification="notificationItem"
						@sendQuickAnswer="onSendQuickAnswer"
					/>
					<template v-if="attachList">
						<template v-for="attachItem in attachList">
							<Attach :config="attachItem"/>
						</template>
					</template>
					<ItemConfirmButtons
						v-if="notificationItem.notifyButtons.length > 0"
						@confirmButtonsClick="onConfirmButtonsClick"
						:buttons="notificationItem.notifyButtons"
					/>
					<div class="bx-im-content-notification-item-content__date-container">
						<div class="bx-im-content-notification-item-content__date">{{ itemDate }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
};

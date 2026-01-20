import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { NotificationType } from '../../const/const';
import { DetailedAdditionalText } from './additional-text';

import type { ImModelNotificationParams } from 'im.v2.model';

const gridIconClassesMap = {
	date: OutlineIcons.CALENDAR_WITH_SLOTS,
	place: OutlineIcons.MEETING_POINT,
	repeat: OutlineIcons.REPEAT,
	user: OutlineIcons.PERSON,
	default: OutlineIcons.INFO_CIRCLE,
};

export const NotificationGridItemTypeIcon = Object.freeze({
	user: 'user',
	place: 'place',
	date: 'date',
	repeat: 'repeat',
});

type NotificationGridItemType = {
	title: string,
	value: string,
	type: $Values<typeof NotificationGridItemTypeIcon>
}

// @vue/component
export const DetailedGrid = {
	name: 'DetailedGrid',
	components: { BIcon, DetailedAdditionalText },
	props: {
		notificationParams: {
			type: Object,
			required: true,
		},
	},
	computed: {
		params(): ImModelNotificationParams
		{
			return this.notificationParams;
		},
		notificationType(): ?string
		{
			return this.params.entity?.contentType ?? null;
		},
		content(): Object[]
		{
			return this.params.entity.content;
		},
		isGridType(): boolean
		{
			return this.notificationType === NotificationType.grid;
		},
		items(): Array<NotificationGridItemType>
		{
			return this.content.items;
		},
		formattedItems(): Array<NotificationGridItemType>
		{
			return this.items.map((item) => {
				if (item.type !== 'user')
				{
					return item;
				}

				return {
					...item,
					user: this.$store.getters['users/get'](Number(item.value)),
				};
			});
		},
	},
	methods: {
		getIconClass(itemType: string): string
		{
			return gridIconClassesMap[itemType] || gridIconClassesMap.default;
		},
		getUserImage(item: NotificationGridItemType): Object
		{
			return { backgroundImage: `url('${item.user.avatar}')` };
		},
		getItemValue(item: NotificationGridItemType): string
		{
			if (item.type === 'user' && item.user)
			{
				return item.user.name;
			}

			return item.value;
		},
		isUserHasAvatar(item: NotificationGridItemType): boolean
		{
			return item.type === 'user' && item.user.avatar;
		},
	},
	template: `
		<div v-if="isGridType" class="bx-im-content-notification-item-content__details-block">
			<template v-for="(item, index) in formattedItems" :key="index">
				<div class="bx-im-content-notification-item-content__details-name"> {{ item.title }}</div>
				<div class="bx-im-content-notification-item-content__details-value">
					<template v-if="isUserHasAvatar(item)">
						<span
							class="bx-im-content-notification-item-content__details-icon ui-icon-set --user"
							:style="getUserImage(item)"
						></span>
					</template>
					<template v-else>
						<BIcon
							v-if="getIconClass(item.type)"
							class="bx-im-content-notification-item-content__details-icon"
							:name="getIconClass(item.type)"
							:size="16"
						/>
					</template>
					<span class="bx-im-content-notification-item-content__details-text">{{ getItemValue(item) }}</span>
				</div>
			</template>
		</div>
		<DetailedAdditionalText :notificationParams="notificationParams"/>
	`,
};

import type { ImModelNotificationParams } from 'im.v2.model';

// @vue/component
export const DetailedTitle = {
	name: 'DetailedTitle',
	props: {
		notificationParams: {
			type: Object,
			required: true,
		},
		icon: {
			type: String,
			default: '',
		},
		color: {
			type: String,
			default: '',
		},
	},
	computed: {
		params(): ImModelNotificationParams
		{
			return this.notificationParams;
		},
		title(): string
		{
			return this.params.entity.title || '';
		},
		href(): string
		{
			return this.params.entity.href || '';
		},
		showDetailedTitle(): boolean
		{
			return this.title !== '';
		},
		hasHref(): boolean
		{
			return Boolean(this.href);
		},
	},
	template: `
		<div v-if="showDetailedTitle" class="bx-im-content-notification-item-content__details-header">
			<span
				class="ui-icon-set"
				:class="icon"
				:style="color ? { '--ui-icon-set__icon-color': color } : {}"
			></span>
			<a
				v-if="hasHref"
				:href="href"
				class="bx-im-content-notification-item-content__details-title --line-clamp-2"
			>{{ title }}</a>
			<span
				v-else
				class="bx-im-content-notification-item-content__details-title --line-clamp-2"
			>{{ title }}</span>
		</div>
	`,
};

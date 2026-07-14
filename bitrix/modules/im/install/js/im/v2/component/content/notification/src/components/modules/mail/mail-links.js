import type { ImModelNotificationParams } from 'im.v2.model';

import '../../elements/css/item.css';

// @vue/component
export const DetailedLinks = {
	name: 'DetailedLinks',
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
		links(): Array
		{
			return this.params?.links ?? [];
		},
		hasLinks(): boolean
		{
			return this.links.length > 0;
		},
	},
	methods: {
		getLinkClass(link): Object
		{
			return {
				'bx-im-content-notification-item-content__link': true,
				'--accent': link.accent !== false,
				'--muted': link.accent === false,
			};
		},
	},
	template: `
		<div v-if="hasLinks" class="bx-im-content-notification-item-content__links">
			<a
				v-for="link in links"
				:key="link.href"
				:href="link.href"
				:class="getLinkClass(link)"
			>{{ link.title }}</a>
		</div>
	`,
};

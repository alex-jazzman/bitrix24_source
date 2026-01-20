import { ResourceAvatar } from '../resource-avatar/resource-avatar';

import './resource-info.css';

// @vue/component
export const ResourceInfo = {
	name: 'BookingDetailResourceInfo',
	components: {
		ResourceAvatar,
	},
	props: {
		resource: {
			type: Object,
			required: true,
		},
	},
	computed: {
		avatarUrl(): string | null
		{
			return this.resource?.avatar?.url || null;
		},
		name(): string
		{
			return this.resource.name;
		},
		typeName(): string
		{
			return this.resource.type.name;
		},
	},
	template: `
		<ResourceAvatar :avatarUrl :name />
		<div class="booking-confirm-page__booking-detail_resource-info">
			<div class="booking-confirm-page__booking-detail_resource-name">
				{{ name }}
			</div>
			<div class="booking-confirm-page__booking-detail_resource-title">
				{{ typeName }}
			</div>
		</div>
	`,
};

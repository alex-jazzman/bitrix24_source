import './resource-avatar.css';

// @vue/component
export const ResourceAvatar = {
	name: 'BookingDetailResourceAvatar',
	props: {
		avatarUrl: {
			type: [String, null],
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
	},
	computed: {
		getAvatarUrl(): string {
			return this.avatarUrl || '/bitrix/js/booking/application/confirm-page-public/images/resource-icon.svg';
		},
	},
	template: `
		<div class="booking-confirm-page__booking-detail_resource-avatar">
			<img
				class="booking-confirm-page__booking-detail_resource-avatar-image"
				:src="getAvatarUrl"
				:alt="name"
				draggable="false"
			/>
		</div>
	`,
};

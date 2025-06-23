import './style.css';

// @vue/component
export const UserDetailedInfoItem = {
	name: 'UserDetailedInfoItem',
	props: {
		title: {
			type: String,
			required: true,
		},
	},
	template: `
		<div class="intranet-user-mini-profile__detailed-info-item">
			<div class="intranet-user-mini-profile__detailed-info-item__title">
				{{ title }}
			</div>
			<div class="intranet-user-mini-profile__detailed-info-item__value">
				<slot></slot>
			</div>
		</div>
	`,
};

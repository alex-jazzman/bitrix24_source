import '../css/role-item.css';

import type { ImModelCopilotRole } from 'im.v2.model';

// @vue/component
export const RoleItem = {
	name: 'RoleItem',
	props:
	{
		role: {
			type: Object,
			required: true,
		},
	},
	computed:
	{
		roleItem(): ImModelCopilotRole
		{
			return this.role;
		},
		roleAvatar(): string
		{
			return this.roleItem.avatar.medium;
		},
		roleName(): string
		{
			return this.roleItem.name;
		},
		roleSDescription(): string
		{
			return this.roleItem.desc;
		},
	},
	template: `
		<div class="bx-im-role-item__container">
			<div class="bx-im-role-item__avatar">
				<img :src="roleAvatar" :alt="roleName">
			</div>
			<div class="bx-im-role-item__info">
				<div class="bx-im-role-item__name" :title="roleName">{{ roleName }}</div>
				<div class="bx-im-role-item__description" :title="roleSDescription">{{ roleSDescription }}</div>
			</div>
		</div>
	`,
};

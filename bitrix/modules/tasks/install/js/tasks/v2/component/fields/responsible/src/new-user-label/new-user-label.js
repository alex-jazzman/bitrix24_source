import { Loc } from 'main.core';
import { h, type BitrixVueComponentProps } from 'ui.vue3';
import { UserAvatarListUsers } from 'tasks.v2.component.elements.user-avatar-list';

export const NewUserLabel: BitrixVueComponentProps = h(UserAvatarListUsers, {
	users: [{
		name: Loc.getMessage('TASKS_V2_RESPONSIBLE_NEW_USER'),
		type: 'employee',
	}],
	readonly: true,
});

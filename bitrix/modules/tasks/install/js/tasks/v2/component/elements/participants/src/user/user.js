import { EventEmitter } from 'main.core.events';
import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.system.menu.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EventName, Model } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { UserLabel } from 'tasks.v2.component.elements.user-label';
import { userService } from 'tasks.v2.provider.service.user-service';
import type { UserModel } from 'tasks.v2.model.users';

// @vue/component
export const User = {
	components: {
		HoverPill,
		UserLabel,
		BMenu,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		userId: {
			type: Number,
			required: true,
		},
		canAdd: {
			type: Boolean,
			required: true,
		},
		inline: {
			type: Boolean,
			required: true,
		},
		withClear: {
			type: Boolean,
			required: true,
		},
		withMenu: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['edit', 'remove'],
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		user(): UserModel
		{
			return this.$store.getters[`${Model.Users}/getById`](this.userId);
		},
		menuOptions(): MenuOptions
		{
			const testId = `${this.taskId}-${this.userId}`;

			return {
				id: 'tasks-field-users-menu',
				bindElement: this.$refs.user.$el,
				offsetTop: 8,
				targetContainer: document.body,
				items: [
					{
						title: this.loc('TASKS_V2_USERS_VIEW'),
						icon: Outline.PERSON,
						dataset: {
							id: `UserMenuProfile-${testId}`,
						},
						onClick: this.openProfile,
					},
					...EventEmitter.emit(EventName.UserMenuExternalItems, {
						taskId: this.taskId,
						userId: this.userId,
					}).flat(),
					this.inline && {
						title: this.loc('TASKS_V2_USERS_EDIT'),
						icon: Outline.EDIT_L,
						onClick: this.edit,
					},
					!this.inline && {
						design: MenuItemDesign.Alert,
						title: this.loc('TASKS_V2_USERS_REMOVE'),
						icon: Outline.TRASHCAN,
						dataset: {
							id: `UserMenuRemove-${testId}`,
						},
						onClick: this.remove,
					},
				],
			};
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.withMenu)
			{
				this.isMenuShown = true;

				return;
			}

			if (this.canAdd)
			{
				this.edit();

				return;
			}

			this.openProfile();
		},
		edit(): void
		{
			this.$emit('edit');
		},
		remove(): void
		{
			this.$emit('remove');
		},
		openProfile(): void
		{
			BX.SidePanel.Instance.emulateAnchorClick(userService.getUrl(this.userId));
		},
	},
	template: `
		<HoverPill ref="user" :withClear @clear="remove" @click="handleClick">
			<UserLabel :user/>
		</HoverPill>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};

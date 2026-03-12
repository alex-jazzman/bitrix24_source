import { EventEmitter } from 'main.core.events';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.system.menu.vue';
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
		withClear: {
			type: Boolean,
			required: true,
		},
		withMenu: {
			type: Boolean,
			required: true,
		},
		forceEdit: {
			type: Boolean,
			default: false,
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
			return {
				id: 'tasks-field-users-menu',
				bindElement: this.$refs.user.$el,
				offsetTop: 8,
				targetContainer: document.body,
				items: [
					{
						title: this.loc('TASKS_V2_USERS_VIEW'),
						icon: Outline.PERSON,
						onClick: this.openProfile,
					},
					...this.additionalItems,
				],
			};
		},
		additionalItems(): MenuItemOptions[]
		{
			return EventEmitter.emit(EventName.UserMenuExternalItems, {
				taskId: this.taskId,
				userId: this.userId,
			})
				.filter((value) => Boolean(value))
				.flat()
			;
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.withMenu && this.additionalItems.length > 0)
			{
				this.isMenuShown = true;

				return;
			}

			if (this.canAdd || this.forceEdit)
			{
				this.$emit('edit');

				return;
			}

			this.openProfile();
		},
		openProfile(): void
		{
			BX.SidePanel.Instance.emulateAnchorClick(userService.getUrl(this.userId));
		},
	},
	template: `
		<HoverPill ref="user" :withClear @clear="$emit('remove')" @click="handleClick">
			<UserLabel :user/>
		</HoverPill>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};

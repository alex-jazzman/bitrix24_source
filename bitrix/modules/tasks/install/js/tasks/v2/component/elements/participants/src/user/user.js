import { EventEmitter } from 'main.core.events';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.system.menu.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EventName, Model } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { UserLabel } from 'tasks.v2.component.elements.user-label';
import { userService } from 'tasks.v2.provider.service.user-service';
import type { UserModel } from 'tasks.v2.model.users';

import './user.css';

const userNamePlaceholder = '#VALUE#';

// @vue/component
export const User = {
	name: 'TaskUser',
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
		ariaLabel: {
			type: String,
			default: '',
		},
		userAriaLabelTemplate: {
			type: String,
			default: '',
		},
		ariaHaspopup: {
			type: String,
			default: '',
		},
		ariaExpanded: {
			type: Boolean,
			default: null,
		},
		clearAriaLabel: {
			type: String,
			default: '',
		},
	},
	emits: ['edit', 'remove'],
	data(): Object
	{
		return {
			isMenuShown: false,
			hasExternalItems: false,
		};
	},
	created(): void
	{
		this.refreshExternalItems();
	},
	computed: {
		isViewTrigger(): boolean
		{
			return !this.canAdd && !this.forceEdit && this.withMenu;
		},
		triggerAriaLabel(): string
		{
			if (this.canAdd || this.forceEdit)
			{
				if (this.userAriaLabelTemplate && this.user?.name)
				{
					return this.userAriaLabelTemplate.replace(userNamePlaceholder, this.user.name);
				}

				return this.withUserName(this.ariaLabel);
			}

			return this.isViewTrigger ? (this.user?.name ?? '') : '';
		},
		triggerAriaHaspopup(): string
		{
			if (this.isViewTrigger)
			{
				return this.hasExternalItems ? 'menu' : '';
			}

			return this.triggerAriaLabel ? this.ariaHaspopup : '';
		},
		triggerAriaExpanded(): ?boolean
		{
			if (this.isViewTrigger)
			{
				return this.hasExternalItems ? this.isMenuShown : null;
			}

			return this.triggerAriaLabel ? this.ariaExpanded : null;
		},
		user(): UserModel
		{
			return this.$store.getters[`${Model.Users}/getById`](this.userId);
		},
		clearLabel(): string
		{
			return this.withUserName(this.clearAriaLabel);
		},
		isProfileLink(): boolean
		{
			return !this.canAdd && !this.forceEdit && !this.withMenu;
		},
		profileUrl(): string
		{
			return userService.getUrl(this.userId);
		},
	},
	methods: {
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
					...this.readExternalItems(),
				],
			};
		},
		readExternalItems(): MenuItemOptions[]
		{
			return EventEmitter.emit(EventName.UserMenuExternalItems, {
				taskId: this.taskId,
				userId: this.userId,
			})
				.filter((value) => Boolean(value))
				.flat()
			;
		},
		// Other modules answer this event only after their own async init, which lands well after
		// the card is rendered, so the answer is re-read on every approach instead of being frozen.
		refreshExternalItems(): void
		{
			this.hasExternalItems = this.readExternalItems().length > 0;
		},
		withUserName(label: string): string
		{
			if (label === '' || !this.user?.name)
			{
				return label;
			}

			return `${label}, ${this.user.name}`;
		},
		handleClick(): void
		{
			this.refreshExternalItems();

			if (this.withMenu && this.hasExternalItems)
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
		<HoverPill
			ref="user"
			data-testid="task-participant-pill"
			:data-user-id="userId"
			:withClear
			:withFocusableContent="isProfileLink"
			:ariaLabel="triggerAriaLabel"
			:ariaHaspopup="triggerAriaHaspopup"
			:ariaExpanded="triggerAriaExpanded"
			:clearAriaLabel="clearLabel"
			@clear="$emit('remove')"
			@click="handleClick"
			@mouseenter="refreshExternalItems"
			@focusin="refreshExternalItems"
		>
			<a
				v-if="isProfileLink"
				:href="profileUrl"
				class="tasks-field-user-profile-link"
				data-testid="task-participant-profile-link"
				@click.prevent.stop="openProfile"
			>
				<UserLabel :user/>
			</a>
			<UserLabel v-else :user/>
		</HoverPill>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
		<slot :getUserEl="() => $refs.user?.$el" :user="user"/>
	`,
};

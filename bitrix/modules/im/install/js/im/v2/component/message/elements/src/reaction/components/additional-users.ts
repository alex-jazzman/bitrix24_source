import { defineComponent } from 'ui.vue3';

import { Core } from 'im.v2.application.core';
import { UserListPopup } from 'im.v2.component.elements.user-list-popup';
import { Utils } from 'im.v2.lib.utils';

import { UserService } from '../classes/user-service';

// @vue/component
export const AdditionalUsers = defineComponent({
	components: { UserListPopup } as { UserListPopup: typeof UserListPopup },
	props: {
		messageId: {
			type: [String, Number],
			required: true,
		},
		reaction: {
			type: String,
			required: true,
		},
		show: {
			type: Boolean,
			required: true,
		},
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { userService: UserService | null }
	{
		return {
			userService: null,
		};
	},
	data(): { showPopup: boolean; loadingAdditionalUsers: boolean; additionalUsers: number[] }
	{
		return {
			showPopup: false,
			loadingAdditionalUsers: false,
			additionalUsers: [],
		};
	},
	watch: {
		show(newValue, oldValue)
		{
			if (!oldValue && newValue)
			{
				this.showPopup = true;
				this.loadUsers();
			}
		},
	},
	methods: {
		async loadUsers()
		{
			this.loadingAdditionalUsers = true;

			try
			{
				this.additionalUsers = await this.getUserService().loadFirstPage(this.messageId);
				this.loadingAdditionalUsers = false;
			}
			catch
			{
				this.loadingAdditionalUsers = false;
			}
		},
		async onScroll(event: Event)
		{
			if (!Utils.dom.isOneScreenRemaining(event.target as HTMLElement) || !this.getUserService().hasMoreItemsToLoad())
			{
				return;
			}

			const userIds = await this.getUserService().loadNextPage(this.messageId);

			if (!userIds)
			{
				return;
			}

			this.additionalUsers = [...this.additionalUsers, ...userIds];
		},
		onPopupClose()
		{
			this.showPopup = false;
			this.$emit('close');
		},
		prepareAdditionalUsers(userIds: number[]): number[]
		{
			const firstViewerId = (this as unknown as { dialog: { lastMessageViews: { firstViewer: { userId: number } } } })
				.dialog.lastMessageViews.firstViewer.userId;

			return userIds.filter((userId) => {
				return userId !== Core.getUserId() && userId !== firstViewerId;
			});
		},
		getUserService(): UserService
		{
			if (!this.userService)
			{
				this.userService = new UserService(this.reaction);
			}

			return this.userService;
		},
	},
	template: `
		<UserListPopup
			id="bx-im-message-reaction-users"
			:showPopup="showPopup"
			:loading="loadingAdditionalUsers"
			:userIds="additionalUsers"
			:bindElement="bindElement || {}"
			:withAngle="false"
			:offsetLeft="-112"
			:forceTop="true"
			@close="onPopupClose"
			@scroll="onScroll"
		/>
	`,
});

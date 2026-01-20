import { BaseHeaderMenu } from 'im.v2.component.list.container.elements.base-header-menu';
import { MenuItem } from 'im.v2.component.elements.menu';
import { ChatType } from 'im.v2.const';
import { showReadMessagesConfirm } from 'im.v2.lib.confirm';
import { ChatService } from 'im.v2.provider.service.chat';

// @vue/component
export const HeaderMenu = {
	name: 'HeaderMenu',
	components: { BaseHeaderMenu, MenuItem },
	methods: {
		async onReadAllClick(closeCallback: () => void)
		{
			const confirmResult = await showReadMessagesConfirm(this.loc('IM_LIST_CONTAINER_TASK_HEADER_MENU_READ_ALL_CONFIRM_TEXT'));

			if (!confirmResult)
			{
				return;
			}

			(new ChatService()).readAllByType(ChatType.taskComments);

			closeCallback();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseHeaderMenu>
			<template #menu-items="{ closeCallback }">
				<MenuItem
					:title="loc('IM_LIST_CONTAINER_TASK_HEADER_MENU_READ_ALL')"
					@click="onReadAllClick(closeCallback)"
				/>
			</template>
		</BaseHeaderMenu>
	`,
};

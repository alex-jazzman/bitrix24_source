import { Tag, Loc, Runtime } from 'main.core';
import 'ui.buttons';
import type { Item } from 'ui.entity-selector';

import { Core } from 'im.v2.application.core';
import { ChatAccessManager } from 'im.v2.lib.access';

export const openCallUserSelector = async (params) => {
	const handleAddClick = async () => {
		const selectedItems = dialog.getSelectedItems();

		const preparedItems = prepareUser(selectedItems);

		const userIds = preparedItems.map((item) => String(item.id));
		const canAddChatUsers = await ChatAccessManager.canAddUsers(params.dialogId, userIds);
		if (!canAddChatUsers)
		{
			return;
		}

		params.onSelect({ users: preparedItems });
	};

	const handleCancelCLick = () => {
		dialog.hide();
	};

	const { Dialog } = await Runtime.loadExtension('ui.entity-selector');

	const dialog = new Dialog({
		targetNode: params.bindElement,
		width: 400,
		enableSearch: true,
		dropdownMode: true,
		context: 'IM_CHAT_SEARCH',
		entities: [{
			id: 'user',
			dynamicLoad: true,
			itemOptions: {
				default: {
					linkTitle: '',
					link: '',
				},
			},
			options: {
				inviteEmployeeLink: false,
				'!userId': Core.getUserId(),
			},
			filters: [
				{
					id: 'im.userDataFilter',
				},
			],
		}],
		footer: getFooter(handleAddClick, handleCancelCLick),
		popupOptions: {
			targetContainer: params.targetContainer,
		},
	});
	dialog.show();

	return Promise.resolve({
		close: () => {
			dialog.hide();
		},
	});
};

const prepareUser = (users) => {
	return users.map((user: Item) => {
		return {
			id: user.id,
			name: user.title.text,
			avatar: user.avatar,
			avatar_hr: user.avatar,
			gender: user.customData.get('imUser').GENDER,
		};
	});
};

const getFooter = (handleAddClick, handleCancelCLick) => {
	const addButtonTitle = Loc.getMessage('CALL_LIB_CALL_ADD_BUTTON');
	const cancelButtonTitle = Loc.getMessage('CALL_LIB_CALL_CANCEL_BUTTON');

	return Tag.render`
		<button class="ui-btn ui-btn-xs ui-btn-primary" onclick="${handleAddClick}">${addButtonTitle}</button>
		<button class="ui-btn ui-btn-xs ui-btn-light-border" onclick="${handleCancelCLick}">${cancelButtonTitle}</button>
	`;
};

/* eslint-disable */
(function (main_core, main_core_events, mail_avatar) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Mail.AddressBook');
	const gridId = 'MAIL_ADDRESSBOOK_LIST';
	BX.ready(function () {
		const addContactButton = document.getElementsByClassName('mail-address-book-add-button')[0];
		addContactButton.onclick = () => {
			top.BX.Runtime.loadExtension('mail.dialogeditcontact').then(() => top.BX.Mail.AddressBook.DialogEditContact.openCreateDialog());
		};
		namespace.openEditDialog = function (attributes) {
			top.BX.Runtime.loadExtension('mail.dialogeditcontact').then(() => top.BX.Mail.AddressBook.DialogEditContact.openEditDialog(attributes));
		};
		namespace.openRemoveDialog = function (configContact) {
			top.BX.Runtime.loadExtension('mail.dialogeditcontact').then(() => {
				top.BX.Mail.AddressBook.DialogEditContact.openRemoveDialog(configContact).then(() => reloadGrid(gridId));
			});
		};
		function reloadGrid(gridID) {
			const gridObject = BX.Main.gridManager.getById(gridID);
			if (gridObject.hasOwnProperty('instance')) {
				gridObject.instance.reloadTable('POST');
			}
		}
		mail_avatar.Avatar.replaceTagsWithAvatars({
			className: 'mail-ui-avatar'
		});
		main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
			const [messageEvent] = event.getCompatData();
			if (messageEvent.getEventId() === 'dialogEditContact::reloadList') {
				reloadGrid(gridId);
			}
		});
		main_core_events.EventEmitter.subscribe('Grid::updated', event => {
			const [messageEvent] = event.getCompatData();
			if (messageEvent.containerId === gridId) {
				mail_avatar.Avatar.replaceTagsWithAvatars({
					className: 'mail-ui-avatar'
				});
			}
		});
	});

})(BX, BX.Event, BX.Mail);
//# sourceMappingURL=script.js.map

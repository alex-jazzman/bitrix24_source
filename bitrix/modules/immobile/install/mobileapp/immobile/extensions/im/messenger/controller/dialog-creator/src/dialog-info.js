/**
 * @module im/messenger/controller/dialog-creator/dialog-info
 */
jn.define('im/messenger/controller/dialog-creator/dialog-info', (require, exports, module) => {
	include('media');
	include('InAppNotifier');

	const { Loc } = require('loc');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { EventType, ComponentCode, OpenDialogContextType } = require('im/messenger/const');
	const { getFile } = require('files/entry');
	const { FileConverter } = require('files/converter');
	const { DialogInfoView } = require('im/messenger/controller/dialog-creator/dialog-info/view');
	const { Theme } = require('im/lib/theme');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { runAction } = require('im/messenger/lib/rest');

	class DialogInfo
	{
		static open({ userList, dialogDTO }, parentLayout = null)
		{
			const widget = new DialogInfo(userList, dialogDTO, parentLayout);
			widget.show();
		}

		constructor(userList, dialogDTO, parentLayout)
		{
			this.dialogDTO = dialogDTO;
			this.layout = parentLayout;
			this.view = new DialogInfoView({
				dialogDTO,
				onAvatarSetClick: () => {
					this.showImagePicker();
				},
			});
		}

		show()
		{
			const config = {
				title: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_DIALOG_INFO_TITLE'),
				onReady: (layoutWidget) => {
					this.layout = layoutWidget;
					layoutWidget.showComponent(this.view);
				},
				onError: (error) => reject(error),
			};

			if (this.layout !== null)
			{
				this.layout.openWidget(
					'layout',
					config,
				).then((layoutWidget) => {
					this.configureWidget(layoutWidget);
				});

				return;
			}

			PageManager.openWidget(
				'layout',
				config,
			).then((layoutWidget) => {
				this.configureWidget(layoutWidget);
			});
		}

		configureWidget(layoutWidget)
		{
			layoutWidget.setRightButtons([
				{
					id: 'create',
					name: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_BUTTON_CREATE'),
					callback: () => {
						this.createChat();
					},
					color: Theme.colors.accentMainLink,
				},
			]);
		}

		showImagePicker()
		{
			const items = [
				{
					id: 'mediateka',
					name: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_CAMERA'),
				},
				{
					id: 'camera',
					name: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_MEDIATEKA'),
				},
			];

			dialogs.showImagePicker(
				{
					settings: {
						resize: {
							targetWidth: -1,
							targetHeight: -1,
							sourceType: 1,
							encodingType: 0,
							mediaType: 0,
							allowsEdit: true,
							saveToPhotoAlbum: true,
							cameraDirection: 0,
						},
						editingMediaFiles: false,
						maxAttachedFilesCount: 1,
						attachButton: { items },
					},
				},
				(data) => this.editorFile(data),
			);
		}

		editorFile(data)
		{
			const url = data[0].url;
			media.showImageEditor(url)
				.then((targetFilePath) => this.addFile(targetFilePath))
				.catch((error) => console.error(error))
			;
		}

		addFile(filePath)
		{
			const converter = new FileConverter();

			converter.resize('avatarResize', {
				url: filePath,
				width: 1000,
				height: 1000,
			}).then((path) => {
				getFile(path)
					.then((file) => {
						file.readMode = 'readAsDataURL';
						file.readNext()
							.then((fileData) => {
								if (fileData.content)
								{
									const { content } = fileData;
									this.dialogDTO.setAvatar(content.slice(content.indexOf('base64,') + 7));

									this.dialogDTO.setAvatarPreview(filePath);
									this.view.setAvatar(filePath);
								}
							})
							.catch((e) => console.error(e));
					})
					.catch((e) => console.error(e));
			});
		}

		createChat()
		{
			const users = [];
			if (this.dialogDTO.getRecipientList())
			{
				this.dialogDTO.getRecipientList().forEach((recipient) => {
					users.push(recipient.id);
				});
			}

			const config = {
				TYPE: this.dialogDTO.getType(),
				TITLE: this.dialogDTO.getTitle(),
			};
			if (users.length > 0)
			{
				config.USERS = users;
			}

			if (this.dialogDTO.getAvatar())
			{
				config.AVATAR = this.dialogDTO.getAvatar();
			}

			BX.rest.callMethod('im.chat.add', config)
				.then((result) => {
					const chatId = parseInt(result.data());

					if (chatId > 0)
					{
						this.openDialog(`chat${chatId}`);

						this.layout.close();
					}
				})
				.catch((result) => {
					const error = result.error();
					if (error.ex.error === 'NO_INTERNET_CONNECTION')
					{
						console.error('ChatCreate.event.onChatCreate - error: connection error', error.ex);
						this.alert(Loc.getMessage('IM_CREATE_CONNECTION_ERROR'));
					}
					else
					{
						console.error('ChatCreate.event.onChatCreate - error: we have some problems on server\n', result.answer);
						this.alert(Loc.getMessage('IMMOBILE_DIALOG_CREATOR_API_ERROR'));
					}
				});

			return true;
		}

		alert(message)
		{
			InAppNotifier.showNotification({
				backgroundColor: '#E6000000',
				message,
			});
		}

		openDialog(dialogId)
		{
			runAction('im.v2.Chat.get', {
				data: { dialogId },
			})
				.then((result) => {
					const { chat } = result;
					serviceLocator.get('core').getStore().dispatch('dialoguesModel/set', chat);

					MessengerEmitter.emit(
						EventType.messenger.openDialog,
						{
							dialogId,
							dialogTitleParams: {
								name: chat.name,
								description: this.dialogDTO.getType() === 'CHAT'
									? Loc.getMessage('IMMOBILE_DIALOG_CREATOR_CHAT_NEW_MSGVER_1')
									: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_CHANNEL_NEW_MSGVER_1'),
								avatar: chat.avatar,
								color: chat.color,
							},
							context: OpenDialogContextType.chatCreation,
						},
						ComponentCode.imMessenger,
					);
				}).catch((err) => console.error(err));
		}
	}

	module.exports = { DialogInfo };
});

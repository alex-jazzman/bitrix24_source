/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_activity_fileUploader, main_core, main_popup, ui_buttons) {
	'use strict';

	const SAVE_BUTTON_ID = 'save';
	const CANCEL_BUTTON_ID = 'cancel';
	class FileUploaderPopup {
		#entityTypeId = null;
		#entityId = null;
		#files = [];
		#ownerTypeId = null;
		#ownerId = null;
		#popup = null;
		#fileUploader = null;
		constructor(params) {
			this.#entityTypeId = params.entityTypeId;
			this.#entityId = params.entityId;
			this.#files = main_core.Type.isArrayFilled(params.files) ? params.files : [];
			this.#ownerTypeId = params.ownerTypeId;
			this.#ownerId = params.ownerId;
		}
		show() {
			if (!this.#popup) {
				const htmlStyles = getComputedStyle(document.documentElement);
				const popupPadding = htmlStyles.getPropertyValue('--ui-space-inset-sm');
				const popupPaddingNumberValue = parseFloat(popupPadding) || 12;
				const popupOverlayColor = htmlStyles.getPropertyValue('--ui-color-base-solid') || '#000000';
				this.#popup = new main_popup.Popup({
					className: 'crm-activity__file-uploader-popup',
					closeIcon: true,
					closeByEsc: true,
					padding: popupPaddingNumberValue,
					overlay: {
						opacity: 40,
						backgroundColor: popupOverlayColor
					},
					cacheable: false,
					content: this.#getPopupContent(),
					buttons: this.#getPopupButtons(),
					minWidth: 650,
					width: 650,
					maxHeight: 650
				});
			}
			this.#popup.show();
		}
		#updateFiles() {
			if (this.#getSaveButton()?.getState() === ui_buttons.ButtonState.DISABLED) {
				return;
			}
			this.#getSaveButton()?.setState(ui_buttons.ButtonState.WAITING);
			this.#getCancelButton()?.setState(ui_buttons.ButtonState.DISABLED);
			main_core.ajax.runAction('crm.activity.todo.updateFiles', {
				data: {
					ownerTypeId: this.#ownerTypeId,
					ownerId: this.#ownerId,
					id: this.#entityId,
					fileTokens: this.#fileUploader ? this.#fileUploader.getServerFileIds() : []
				}
			}).then(result => {
				this.#revertButtonsState();
				if (!(result.hasOwnProperty('errors') && result.errors.length)) {
					this.#closePopup();
				}
			}).catch(() => {
				this.#revertButtonsState();
			});
		}
		#revertButtonsState() {
			this.#getSaveButton()?.setState(null);
			this.#getCancelButton()?.setState(null);
		}
		#closePopup() {
			this.#popup?.close();
		}
		#getPopupContent() {
			const uploaderContainer = main_core.Tag.render`<div></div>`;
			const content = main_core.Tag.render`<div class="crm-activity__file-uploader">
			<div class="crm-activity__file-uploader_title">${this.#getPopupTitle()}</div>
			<div class="crm-activity__file-uploader_content">
				${uploaderContainer}
			</div>
		</div>`;
			this.#fileUploader = new crm_activity_fileUploader.FileUploader({
				events: {
					'File:onComplete': event => {
						this.#revertButtonsState();
					},
					'File:onRemove': event => {
						this.#changeUploaderContainerSize();
						this.#revertButtonsState();
					},
					onUploadStart: event => {
						this.#changeUploaderContainerSize();
						this.#getSaveButton()?.setState(ui_buttons.ButtonState.DISABLED);
						this.#getCancelButton()?.setState(ui_buttons.ButtonState.DISABLED);
					}
					// TODO: not implemented yet
					//		'onUploadComplete'
				},
				ownerId: this.#ownerId,
				ownerTypeId: this.#ownerTypeId,
				activityId: this.#entityId,
				files: this.#files
			});
			this.#fileUploader.renderTo(uploaderContainer);
			return content;
		}
		#getSaveButton() {
			return this.#popup?.getButton(SAVE_BUTTON_ID);
		}
		#getCancelButton() {
			return this.#popup?.getButton(CANCEL_BUTTON_ID);
		}
		#getPopupTitle() {
			return main_core.Loc.getMessage('CRM_FILE_UPLOADER_POPUP_TITLE_2');
		}
		#getPopupButtons() {
			return [new ui_buttons.SaveButton({
				id: SAVE_BUTTON_ID,
				round: true,
				state: ui_buttons.ButtonState.DISABLED,
				events: {
					click: this.#updateFiles.bind(this)
				}
			}), new ui_buttons.CancelButton({
				id: CANCEL_BUTTON_ID,
				round: true,
				events: {
					click: this.#closePopup.bind(this)
				},
				text: main_core.Loc.getMessage('CRM_FILE_UPLOADER_POPUP_CANCEL'),
				color: ui_buttons.ButtonColor.LIGHT_BORDER
			})];
		}
		#changeUploaderContainerSize() {
			if (this.#popup) {
				this.#popup.adjustPosition();
			}
		}
	}

	exports.FileUploaderPopup = FileUploaderPopup;

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX.Crm.Activity, BX, BX.Main, BX.UI);
//# sourceMappingURL=file-uploader-popup.bundle.js.map

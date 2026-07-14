/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, main_core, main_popup, ui_dialogs_messagebox, ui_buttons, ui_iconSet_api_core) {
	'use strict';

	var DeleteProjectErrorCode;
	(function (DeleteProjectErrorCode) {
		DeleteProjectErrorCode["AccessDenied"] = "ACCESS_DENIED";
		DeleteProjectErrorCode["TasksNotEmpty"] = "TASKS_NOT_EMPTY";
		DeleteProjectErrorCode["GroupWithFlow"] = "GROUP_WITH_FLOW";
		DeleteProjectErrorCode["DiskNotEmpty"] = "DISK_NOT_EMPTY";
	})(DeleteProjectErrorCode || (DeleteProjectErrorCode = {}));

	class DeleteProjectService {
		static async deleteProject(projectId) {
			try {
				await main_core.ajax.runAction('socialnetwork.V2.Project.delete', {
					json: {
						projectId
					}
				});
				return [undefined, projectId];
			} catch (error) {
				return this.#handleError(error, projectId);
			}
		}
		static async deleteScrum(scrumId) {
			try {
				await main_core.ajax.runAction('socialnetwork.V2.Scrum.delete', {
					json: {
						scrumId
					}
				});
				return [undefined, scrumId];
			} catch (error) {
				return this.#handleError(error, scrumId);
			}
		}
		static #handleError(error, id) {
			if (error instanceof Error) {
				console.error('Delete project service error', error);
				return [error, id];
			}
			if (isAjaxBadResponse(error)) {
				const errorCode = (error.errors[0]?.code || '')?.toUpperCase();
				if (Object.values(DeleteProjectErrorCode).includes(errorCode)) {
					const projectError = new Error(error.errors[0].message);
					projectError.name = errorCode;
					return [projectError, id];
				}
				console.error('Delete project service error response', error.errors[0]);
				return [new Error(error.errors[0]?.message), id];
			}
			console.error('Delete project service error', error);
			return [new Error('Delete project error'), id];
		}
	}
	function isAjaxBadResponse(value) {
		if (!main_core.Type.isPlainObject(value)) {
			return false;
		}
		const candidate = value;
		return candidate.status === 'error' && main_core.Type.isNull(candidate.data) && main_core.Type.isArray(candidate.errors);
	}

	class DeleteProject {
		static async delete(options) {
			const {
				projectId,
				scrumId
			} = options;
			if (!main_core.Type.isNil(projectId)) {
				return DeleteProjectService.deleteProject(projectId);
			}
			if (!main_core.Type.isNil(scrumId)) {
				return DeleteProjectService.deleteScrum(scrumId);
			}
			return [undefined, 0];
		}
	}

	class DeleteProjectPopup {
		#messageBox = null;
		deleteProject(projectId) {
			return this.#delete({
				projectId
			});
		}
		deleteScrum(scrumId) {
			return this.#delete({
				scrumId
			});
		}
		#delete({
			projectId,
			scrumId
		}) {
			return new Promise(resolve => {
				if (!projectId && !scrumId) {
					resolve(false);
					return;
				}
				const cancelButton = new ui_buttons.CancelButton({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					className: 'socialnetwork-delete-project-popup-button',
					text: main_core.Loc.getMessage('SONET_DELETE_PROJECT_POPUP_CANCEL_BUTTON') || '',
					onclick: () => {
						this.#messageBox?.close();
						this.#messageBox = null;
						resolve(false);
					},
					useAirDesign: true
				});
				const yesButton = new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					className: 'socialnetwork-delete-project-popup-button',
					text: main_core.Loc.getMessage('SONET_DELETE_PROJECT_POPUP_CONFIRM_BUTTON') || '',
					onclick: async button => {
						button.setDisabled(true);
						button.setWaiting(true);
						const [error] = await DeleteProject.delete({
							projectId,
							scrumId
						});
						button.setDisabled(false);
						button.setWaiting(false);
						if (error) {
							await this.#showBlockedState(this.#messageBox, this.#getContentByError(error?.name));
						}
						this.#messageBox?.close();
						this.#messageBox = null;
						resolve(!error);
					},
					useAirDesign: true
				});
				this.#messageBox = ui_dialogs_messagebox.MessageBox.create({
					title: main_core.Loc.getMessage('SONET_DELETE_PROJECT_POPUP_CONFIRM_TITLE'),
					modal: true,
					buttons: [cancelButton, yesButton],
					popupOptions: {
						id: `socialnetwork-delete-project-popup-${projectId ?? scrumId}`,
						closeByEsc: true,
						closeIcon: true,
						closeIconSize: main_popup.CloseIconSize.LARGE
					},
					useAirDesign: true
				});
				this.#messageBox.show();
			});
		}
		#showBlockedState(messageBox, content = null) {
			return new Promise(resolve => {
				if (main_core.Type.isNil(content)) {
					resolve();
					return;
				}
				const popup = messageBox.getPopupWindow();
				popup.setTitleBar({
					content: main_core.Tag.render`
					<span class="popup-window-titlebar-text">
						<div class="socialnetwork-delete-project-popup-title">
							<div class="ui-icon-set --${ui_iconSet_api_core.Outline.ALERT_ACCENT} socialnetwork-delete-project-popup-title-icon"></div>
							${main_core.Loc.getMessage('SONET_DELETE_PROJECT_POPUP_BLOCKED_TITLE') ?? ''}
						</div>
					</span>
				`
				});
				popup.setBackground('linear-gradient(147deg, var(--accent-soft-accent-soft-red-1, #FFCDCC) -7.94%, var(--base-base-white-fixed, #FFF) 31.8%)');
				popup.setContent(main_core.Tag.render`
					<span class="socialnetwork-delete-project-popup-content">
						${content}
					</span>
				`);
				messageBox.setButtons(ui_dialogs_messagebox.MessageBoxButtons.CANCEL);
				messageBox.setCancelCaption(main_core.Loc.getMessage('SONET_DELETE_PROJECT_POPUP_BLOCKED_BUTTON') ?? '');
				messageBox.setCancelCallback(() => resolve());
			});
		}
		#getContentByError(errorName = '') {
			const errorNames = [DeleteProjectErrorCode.GroupWithFlow, DeleteProjectErrorCode.TasksNotEmpty, DeleteProjectErrorCode.DiskNotEmpty];
			if (errorNames.includes(errorName)) {
				return main_core.Loc.getMessage('SONET_DELETE_PROJECT_POPUP_BLOCKED_DESCRIPTION') ?? null;
			}
			return null;
		}
	}

	exports.DeleteProjectPopup = DeleteProjectPopup;

})(this.BX.Socialnetwork.V2.Application = this.BX.Socialnetwork.V2.Application || {}, BX, BX.Main, BX.UI.Dialogs, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=delete-project-popup.bundle.js.map

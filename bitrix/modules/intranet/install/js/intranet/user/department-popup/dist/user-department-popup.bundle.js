/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_core_events, main_popup, ui_avatar, ui_buttons, intranet_departmentControl) {
	'use strict';

	class UserDepartmentPopup {
		#popup = null;
		#content;
		#options;
		#department;
		#sendButton;
		constructor(options) {
			this.#options = options;
		}
		show() {
			this.#popup = this.#createPopup();
			this.#popup.show();
		}
		#createPopup() {
			const popup = main_popup.PopupManager.create({
				id: 'user-department-popup',
				closeIcon: false,
				autoHide: false,
				closeByEsc: true,
				padding: 0,
				width: 542,
				height: 357
			});
			popup.setContent(this.#getPopupContent());
			return popup;
		}
		#getPopupContent() {
			const content = this.render();
			return main_core.Tag.render`
			<div class="intranet-user-department-wrapper">
				${this.#renderCloseIcon()}
				${content}
			</div>
		`;
		}
		#renderCloseIcon() {
			const onClick = () => {
				this.#popup.close();
			};
			return main_core.Tag.render`
			<div class="intranet-user-department__close-icon ui-icon-set --cross-30" onclick="${onClick}"></div>
		`;
		}
		render() {
			if (!this.#content) {
				this.#content = this.#renderBlock();
			}
			return this.#content;
		}
		#renderBlock() {
			const modificator = this.#getModificator();
			const departmentControl = this.#isDepartmentControlVisible() ? main_core.Tag.render`
				<div class="intranet-user-department__department">
					${this.#getDepartmentControl().render()}
				</div>
			` : '';
			return main_core.Tag.render`
			<div class="intranet-user-department">
				<div class="intranet-user-department__title">
					${this.#getTitle()}
				</div>
				<div class="intranet-user-department__account">
					<div class="transfer-account transfer-account_${modificator}">
						<div class="transfer-account-avatar">
							${this.#getAvatar().getContainer()}
						</div>
						<div class="transfer-account-data">
							<div class="account-data__name">
								${this.#options.userName}
							</div>
							<div class="account-data__position account-data__position_${modificator}">
								${this.#getPosition()}
							</div>
						</div>
					</div>
				</div>
				${departmentControl}
				<div class="intranet-user-department__action">
					${this.#getSendButton().render()}
					${this.#getCancelButton().render()}
				</div>
			</div>
		`;
		}
		#getAvatar() {
			const options = {
				size: 40,
				userpicPath: this.#options.userPhoto
			};
			let avatar = null;
			switch (this.#options.userType) {
				case 'extranet':
					avatar = new ui_avatar.AvatarRoundExtranet(options);
					break;
				case 'collaber':
					avatar = new ui_avatar.AvatarRoundGuest(options);
					break;
				default:
					avatar = new ui_avatar.AvatarRound(options);
					break;
			}
			return avatar;
		}
		#getDepartmentControl() {
			if (!this.#isDepartmentControlVisible()) {
				return null;
			}
			if (!this.#department) {
				const rootDepartment = this.#options.rootDepartment;
				const description = this.#options.userType === 'visitor' ? main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_DEPARTMENT_DESCRIPTION_EMPLOYEE') : main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_DEPARTMENT_DESCRIPTION');
				this.#department = new intranet_departmentControl.DepartmentControl({
					rootDepartment: main_core.Type.isObject(rootDepartment) ? rootDepartment : null,
					description
				});
				this.#department.subscribe('onChange', this.#onChangeDepartments.bind(this));
			}
			return this.#department;
		}
		#getSendButton() {
			const isDepartmentControlVisible = this.#isDepartmentControlVisible();
			const departmentControl = isDepartmentControlVisible ? this.#getDepartmentControl() : null;
			this.#sendButton ??= new ui_buttons.Button({
				className: 'intranet-user-department__action-send',
				text: this.#getActionButtonText(),
				size: ui_buttons.Button.Size.LARGE,
				style: '--style-filled',
				useAirDesign: true,
				noCaps: true,
				isDependOnTheme: true,
				state: !isDepartmentControlVisible || departmentControl.getValues().length > 0 ? null : ui_buttons.Button.State.DISABLED,
				onclick: () => {
					if (this.#sendButton.getState() === ui_buttons.Button.State.DISABLED) {
						return;
					}
					if (main_core.Type.isFunction(this.#options.sendButtonCallback)) {
						const departmentIds = isDepartmentControlVisible ? departmentControl.getValues() : [];
						this.#options.sendButtonCallback(departmentIds);
						this.#popup?.destroy();
					}
				}
			});
			return this.#sendButton;
		}
		#getCancelButton() {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_CANCEL'),
				size: ui_buttons.Button.Size.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				onclick: () => {
					if (main_core.Type.isFunction(this.#options.closeButtonCallback)) {
						this.#options.closeButtonCallback();
					} else {
						this.#popup.destroy();
					}
				},
				noCaps: true
			});
		}
		#onChangeDepartments(event) {
			if (!this.#isDepartmentControlVisible()) {
				return;
			}
			const {
				tags
			} = event.data;
			const state = tags?.length > 0 ? null : ui_buttons.Button.State.DISABLED;
			this.#getSendButton().setState(state);
		}
		#getModificator() {
			switch (this.#options.userType) {
				case 'visitor':
					return 'visitor';
				case 'collaber':
					return 'collaber';
				case 'integrator':
					return 'integrator';
				default:
					return 'extranet';
			}
		}
		#getTitle() {
			switch (this.#options.userType) {
				case 'visitor':
					return main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_EMPLOYEE_TITLE');
				case 'collaber':
					return main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_COLLABA_TITLE');
				case 'integrator':
					return main_core.Extension.getSettings('intranet.user.department-popup').isRenamedIntegrator === true ? main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_INTEGRATOR_TITLE_RENAMED') : main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_INTEGRATOR_TITLE');
				default:
					return main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_TITLE');
			}
		}
		#getPosition() {
			switch (this.#options.userType) {
				case 'visitor':
					return main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_EMPLOYEE');
				case 'collaber':
					return main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_COLLABER');
				case 'integrator':
					return main_core.Extension.getSettings('intranet.user.department-popup').isRenamedIntegrator === true ? main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_INTEGRATOR_RENAMED') : main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_INTEGRATOR');
				default:
					return main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_EXTRANET');
			}
		}
		#getActionButtonText() {
			if (this.#options.userType === 'visitor') {
				return main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_HIRE');
			}
			return main_core.Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_TRANSFER');
		}
		#isDepartmentControlVisible() {
			return this.#options.showDepartmentControl !== false;
		}
	}

	exports.UserDepartmentPopup = UserDepartmentPopup;

})(this.BX.Intranet.User = this.BX.Intranet.User || {}, BX, BX.Event, BX.Main, BX.UI, BX.UI, BX.Intranet);
//# sourceMappingURL=user-department-popup.bundle.js.map

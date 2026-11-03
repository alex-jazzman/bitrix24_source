/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, ui_buttons, sign_v2_api, sign_type) {
	'use strict';

	class ReminderSelector {
		#api;
		#button;
		#options;
		#chosenTypeId = sign_type.Reminder.none;
		constructor(options = {}) {
			this.#options = options;
			this.#button = this.#getButton();
			this.#api = new sign_v2_api.Api();
			if (!main_core.Type.isUndefined(this.#options.preSelectedType)) {
				this.#chooseTypeById(this.#options.preSelectedType);
			}
		}
		getLayout() {
			return main_core.Tag.render`
				<div class="sign-reminder-selector">
				<span class="sign-reminder-selector__label">
					${main_core.Loc.getMessage('SIGN_V2_REMINDER_SELECTOR_TITLE')}
				</span>
				${this.#button.getContainer()}
			</div>
		`;
		}
		save(documentUid, memberRole) {
			return this.#api.modifyReminderTypeForMemberRole(documentUid, memberRole, this.#chosenTypeId);
		}
		setType(reminderType) {
			this.#chooseTypeById(reminderType);
		}
		#getItems() {
			return this.#getAvailableOptions().map(reminderType => {
				return {
					text: reminderType.name,
					onclick: () => this.#chooseTypeById(reminderType.id)
				};
			});
		}
		#getButton() {
			return new ui_buttons.Button({
				text: this.#getOptionById(sign_type.Reminder.none).name,
				dropdown: true,
				closeByEsc: true,
				autoHide: true,
				autoClose: true,
				color: BX.UI.Button.Color.LIGHT,
				size: BX.UI.Button.Size.SMALL,
				menu: {
					items: this.#getItems()
				},
				className: 'sign-reminder-selector__button'
			});
		}
		#chooseTypeById(reminderTypeId) {
			this.#button.menuWindow.close();
			const option = this.#getOptionById(reminderTypeId);
			if (!option) {
				return;
			}
			this.#button.setText(option.name);
			this.#chosenTypeId = option.id;
		}
		#getOptionById(reminderTypeId) {
			return this.#getAvailableOptions().find(option => option.id === reminderTypeId) ?? null;
		}
		#getAvailableOptions() {
			return [{
				id: sign_type.Reminder.none,
				name: main_core.Loc.getMessage('SIGN_V2_REMINDER_SELECTOR_OPTION_NONE')
			}, {
				id: sign_type.Reminder.oncePerDay,
				name: main_core.Loc.getMessage('SIGN_V2_REMINDER_SELECTOR_OPTION_ONCE_PER_DAY')
			}, {
				id: sign_type.Reminder.twicePerDay,
				name: main_core.Loc.getMessage('SIGN_V2_REMINDER_SELECTOR_OPTION_TWICE_PER_DAY')
			}, {
				id: sign_type.Reminder.threeTimesPerDay,
				name: main_core.Loc.getMessage('SIGN_V2_REMINDER_SELECTOR_OPTION_THREE_TIMES_PER_DAY')
			}];
		}
	}

	exports.ReminderSelector = ReminderSelector;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.UI, BX.Sign.V2, BX.Sign);
//# sourceMappingURL=reminder-selector.bundle.js.map

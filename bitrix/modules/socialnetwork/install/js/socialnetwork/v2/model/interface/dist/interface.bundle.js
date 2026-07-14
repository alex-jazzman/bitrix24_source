/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, ui_vue3_pinia) {
	'use strict';

	const TYPES_PROJECT_WIZARD_ACTION = {
		CREATE: 'TYPE_PROJECT_WIZARD_ACTION_CREATE',
		UPDATE: 'TYPE_PROJECT_WIZARD_ACTION_UPDATE',
		COPY: 'TYPE_PROJECT_WIZARD_ACTION_COPY'
	};

	const useInterfaceStore = ui_vue3_pinia.defineStore('interface', {
		state: () => ({
			currentUserId: 0,
			isOldPortal: false,
			action: '',
			isAccessRestricted: false,
			loading: false,
			validation: {
				title: {
					invalid: false
				}
			},
			copyOptions: {
				tasks: {
					enabled: false,
					robots: false
				},
				disk: {
					enabled: false,
					withFiles: false
				}
			}
		}),
		getters: {
			isActionCreate: state => {
				const action = state.action;
				const isActionFalsy = !action;
				const isActionCreateDirect = action === TYPES_PROJECT_WIZARD_ACTION.CREATE;
				const isActionCreateNew = isActionCreateDirect || isActionFalsy;
				return isActionCreateNew;
			},
			isActionUpdate: state => state.action === TYPES_PROJECT_WIZARD_ACTION.UPDATE,
			isActionCopy: state => state.action === TYPES_PROJECT_WIZARD_ACTION.COPY,
			wizardValidation: state => {
				return {
					invalid: Object.values(state.validation).some(v => v.invalid),
					...state.validation
				};
			}
		},
		actions: {
			init(params) {
				this.$patch({
					isOldPortal: params.isOldPortal,
					action: params.action || '',
					currentUserId: params.currentUserId,
					isAccessRestricted: params.isAccessRestricted
				});
			},
			setValidation(field, props) {
				if (!this.validation[field]) {
					return;
				}
				const fieldValidation = {
					...this.validation[field],
					...props
				};
				fieldValidation.invalid = false;
				const invalid = Object.values(fieldValidation).some(val => val);
				this.validation[field] = {
					...fieldValidation,
					invalid
				};
			}
		}
	});

	exports.TYPES_PROJECT_WIZARD_ACTION = TYPES_PROJECT_WIZARD_ACTION;
	exports.useInterfaceStore = useInterfaceStore;

})(this.BX.Socialnetwork.V2.Model = this.BX.Socialnetwork.V2.Model || {}, BX.Vue3.Pinia);
//# sourceMappingURL=interface.bundle.js.map

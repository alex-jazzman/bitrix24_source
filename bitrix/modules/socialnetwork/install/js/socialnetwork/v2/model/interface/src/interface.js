import { defineStore } from 'ui.vue3.pinia';

import { type Params as CoreParams } from 'socialnetwork.v2.core';
import { type ProjectModel } from 'socialnetwork.v2.model.project';

import { TYPES_PROJECT_WIZARD_ACTION } from './const';
import { type InterfaceModel } from './types';

export const useInterfaceStore = defineStore('interface', {
	state: (): InterfaceModel => ({
		currentUserId: 0,
		isOldPortal: false,
		action: '',
		isAccessRestricted: false,
		loading: false,
		validation: {
			title: {
				invalid: false,
			},
		},
		copyOptions: {
			tasks: {
				enabled: false,
				robots: false,
			},
			disk: {
				enabled: false,
				withFiles: false,
			},
		},
	}),
	getters: {
		isActionCreate: (state): boolean => {
			const action = state.action;
			const isActionFalsy = !action;
			const isActionCreateDirect = action === TYPES_PROJECT_WIZARD_ACTION.CREATE;
			const isActionCreateNew = isActionCreateDirect || isActionFalsy;

			return isActionCreateNew;
		},
		isActionUpdate: (state): boolean => state.action === TYPES_PROJECT_WIZARD_ACTION.UPDATE,
		isActionCopy: (state): boolean => state.action === TYPES_PROJECT_WIZARD_ACTION.COPY,
		wizardValidation: (state) => {
			return {
				invalid: Object.values(state.validation).some((v) => v.invalid),
				...state.validation,
			};
		},
	},
	actions: {
		init(params: CoreParams): void
		{
			this.$patch({
				isOldPortal: params.isOldPortal,
				action: params.action || '',
				currentUserId: params.currentUserId,
				isAccessRestricted: params.isAccessRestricted,
			});
		},
		setValidation(field: $Keys<ProjectModel>, props: { [key: string]: boolean }): void
		{
			if (!this.validation[field])
			{
				return;
			}

			const fieldValidation = {
				...this.validation[field],
				...props,
			};
			fieldValidation.invalid = false;

			const invalid = Object.values(fieldValidation).some((val) => val);
			this.validation[field] = {
				...fieldValidation,
				invalid,
			};
		},
	},
});

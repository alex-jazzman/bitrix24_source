import { type JsonObject } from 'main.core';
import { BuilderModel, type GetterTree, type ActionTree, type MutationTree } from 'ui.vue3.vuex';

import { formatFieldsWithConfig } from '../../../utils/validate';
import { tariffRestrictionsFieldsConfig } from './format/field-config';

export type TariffRestrictions = {
	fullChatHistory: {
		isAvailable: boolean,
		limitDays: number | null,
	},
	collabV2: {
		isAvailable: boolean,
		isCopyAvailable: boolean
	},
};

/* eslint-disable no-param-reassign */
export class TariffRestrictionsModel extends BuilderModel
{
	getState(): TariffRestrictions
	{
		return {
			fullChatHistory: {
				isAvailable: true,
				limitDays: null,
			},
			collabV2: {
				isAvailable: true,
				isCopyAvailable: true,
			},
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function application/tariffRestrictions/get */
			get: (state: TariffRestrictions): TariffRestrictions => {
				return state;
			},
			/** @function application/tariffRestrictions/isHistoryAvailable */
			isHistoryAvailable: (state: TariffRestrictions): boolean => {
				return state.fullChatHistory?.isAvailable ?? false;
			},
			/** @function application/tariffRestrictions/isCollabV2Available */
			isCollabV2Available: (state: TariffRestrictions): boolean => {
				return state.collabV2.isAvailable;
			},
			/** @function application/tariffRestrictions/isCollabV2CopyAvailable */
			isCollabV2CopyAvailable: (state: TariffRestrictions): boolean => {
				return state.collabV2.isCopyAvailable;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function application/tariffRestrictions/set */
			set: (store, payload: JsonObject) => {
				store.commit('set', this.formatFields(payload));
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			set: (state: TariffRestrictions, payload: JsonObject) => {
				Object.entries(payload).forEach(([key, value]) => {
					state[key] = value;
				});
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, tariffRestrictionsFieldsConfig);
	}
}

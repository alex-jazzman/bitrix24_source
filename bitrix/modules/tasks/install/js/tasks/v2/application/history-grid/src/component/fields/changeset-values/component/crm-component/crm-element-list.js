import { Type } from 'main.core';

import { CrmElement } from './crm-element';
import type { CrmChangeset } from './crm-element';

// @vue/component
export const CrmElementList = {
	components: {
		CrmElement,
	},
	props: {
		value: {
			type: String,
			default: '',
		},
	},
	computed: {
		crmItems(): CrmChangeset[] | null
		{
			return JSON.parse(this.value);
		},
		isNotFilled(): boolean
		{
			return Type.isNull(this.crmItems);
		},
		isHidden(): boolean
		{
			return this.crmItems?.length === 0;
		},
	},
	template: `
		<span v-if="isNotFilled"/>
		<span v-else-if="isHidden">{{ loc('TASKS_V2_HISTORY_LOG_HIDDEN_VALUE') }}</span>
		<template v-else v-for="(crmItem, index) of crmItems" :key="index">
			<CrmElement :crmItem/>{{ index < crmItems.length - 1 ? ', ': '' }}
		</template>
	`,
};

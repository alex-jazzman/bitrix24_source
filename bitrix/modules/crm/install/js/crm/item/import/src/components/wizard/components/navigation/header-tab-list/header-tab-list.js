import { BitrixVueComponentProps } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';

import './header-tab-list.css';

export const HeaderTabList: BitrixVueComponentProps = {
	name: 'HeaderTabList',

	components: {
		BIcon,
	},

	props: {
		tabsCount: {
			type: Number,
			required: true,
		},
	},

	template: `
		<div class="crm-item-import__wizard-header-tab-list">
			<template v-for="(_, index) in tabsCount">
				<div class="crm-item-import__wizard-header-tab-item">
					<slot :name="index" />
					<span
						v-if="index < tabsCount - 1"
						class="crm-item-import__wizard-header-tab-delimiter"
					>
						<BIcon
							name="chevron-right"
							:size="12"
							color="var(--ui-color-palette-gray-50)"
						/>
					</span>
				</div>
			</template>
		</div>
	`,
};

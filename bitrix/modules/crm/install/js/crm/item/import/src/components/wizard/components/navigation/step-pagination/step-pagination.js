import { BitrixVueComponentProps } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';

import './step-pagination.css';

export const StepPagination: BitrixVueComponentProps = {
	name: 'StepPagination',

	components: {
		UiButton,
	},

	emits: [
		'next',
		'back',
		'cancel',
		'complete',
		'again',
	],

	props: {
		currentItemId: {
			type: Number,
			required: true,
		},
		itemsCount: {
			type: Number,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: () => false,
		},
		hidden: {
			type: Boolean,
			default: () => false,
		},
	},

	data(): Object
	{
		return {
			AirButtonStyle,
		};
	},

	computed: {
		isProcess(): boolean
		{
			return this.currentItemId < this.itemsCount - 1;
		},

		isFirstStep(): boolean
		{
			return this.currentItemId === 0;
		},
	},

	template: `
		<div class="crm-item-import__wizard-step-pagination" v-if="!hidden">
			<template v-if="isProcess">
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_NEXT')"
					:disabled="disabled"
					:style="AirButtonStyle.FILLED"
					@click="$emit('next')"
				/>
				<template v-if="isFirstStep">
					<UiButton
						:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_CANCEL')"
						:disabled="disabled"
						:style="AirButtonStyle.PLAIN"
						@click="$emit('cancel')"
					/>
				</template>
				<template v-else>
					<UiButton
						:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_BACK')"
						:disabled="disabled"
						:style="AirButtonStyle.PLAIN"
						@click="$emit('back')"
					/>
				</template>
			</template>
			<template v-else>
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_COMPLETE')"
					:disabled="disabled"
					:style="AirButtonStyle.FILLED_SUCCESS"
					@click="$emit('complete')"
				/>
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_AGAIN')"
					:disabled="disabled"
					:style="AirButtonStyle.FILLED"
					@click="$emit('again')"
				/>
			</template>
		</div>
	`,
};

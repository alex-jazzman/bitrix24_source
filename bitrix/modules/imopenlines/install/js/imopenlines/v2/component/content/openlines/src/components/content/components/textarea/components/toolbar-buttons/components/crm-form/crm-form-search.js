import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';

import { type JsonObject } from 'main.core';
import { Utils } from 'im.v2.lib.utils';

// @vue/component
export const CrmFormSearch = {
	name: 'CrmFormSearch',
	components: { BInput },
	emits: ['updateQuery', 'submit'],
	data(): JsonObject
	{
		return {
			query: '',
		};
	},
	computed:
	{
		InputSize: () => InputSize,
		InputDesign: () => InputDesign,
	},
	watch:
	{
		query(value: string): void
		{
			this.$emit('updateQuery', value);
		},
	},
	methods:
	{
		onKeydown(event: KeyboardEvent): void
		{
			if (Utils.key.isCombination(event, 'Enter'))
			{
				this.$emit('submit');
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-imol-crm-form-popup__search">
			<BInput
				v-model="query"
				:design="InputDesign.LightGrey"
				:size="InputSize.Md"
				:placeholder="loc('IMOL_CONTENT_TEXTAREA_CRM_FORM_POPUP_SEARCH_PLACEHOLDER')"
				:title="loc('IMOL_CONTENT_TEXTAREA_CRM_FORM_POPUP_SEARCH_TITLE')"
				@keydown="onKeydown"
			/>
		</div>
	`,
};

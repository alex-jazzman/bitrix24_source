import { BitrixVueComponentProps } from 'ui.vue3';

import './required-mark.css';

export const RequiredMark: BitrixVueComponentProps = {
	name: 'RequiredMark',

	template: `
		<span class="crm-item-import__required-mark" :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_REQUIRED_MARK_HINT')">*</span>
	`,
};

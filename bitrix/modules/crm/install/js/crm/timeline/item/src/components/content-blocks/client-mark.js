import { Text as BText } from 'ui.system.typography.vue';

import { ClientMark as ClientMarkType } from '../enums/client-mark';

// @vue/component
export const ClientMark = {
	components: {
		BText,
	},
	props: {
		mark: {
			type: String,
			default: ClientMarkType.POSITIVE,
			validator: (value) => Object.values(ClientMarkType).includes(value),
		},
		text: {
			type: String,
			default: '',
		},
	},

	computed: {
		clientMarkStyle(): Object
		{
			const map = {
				[ClientMarkType.POSITIVE]: 'crm-timeline__content_color-tinted-success',
				[ClientMarkType.NEUTRAL]: 'crm-timeline__content_color-tinted-warning',
				[ClientMarkType.NEGATIVE]: 'crm-timeline__content_color-tinted-alert',
			};

			return map[this.mark] || '';
		},
	},

	// language=Vue
	template: `
		<BText
			size="xs"
			tag="div"
			:className="clientMarkStyle"
		><span v-html="text"></span></BText>
	`,
};

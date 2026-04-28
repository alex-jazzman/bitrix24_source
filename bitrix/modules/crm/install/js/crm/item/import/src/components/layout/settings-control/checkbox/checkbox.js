import { BitrixVueComponentProps } from 'ui.vue3';
import { RequiredMark } from '../../required-mark/required-mark';

import './checkbox.css';

export const Checkbox: BitrixVueComponentProps = {
	name: 'Checkbox',

	components: {
		RequiredMark,
	},

	props: {
		fieldName: {
			type: String,
			required: true,
		},
		model: {
			type: Object,
			required: true,
		},
		fieldCaption: {
			type: String,
			required: true,
		},
		required: {
			type: Boolean,
			default: () => false,
		},
	},

	computed: {
		checked: {
			get(): boolean
			{
				return Boolean(this.model.get(this.fieldName));
			},
			set(value: boolean): void
			{
				this.model.set(this.fieldName, value);
			},
		},
	},

	template: `
		<div class="crm-item-import__field --checkbox ui-form-row">
			<label class="ui-ctl ui-ctl-checkbox ui-ctl-w100">
				<input type="checkbox" class="ui-ctl-element" :name="fieldName" v-model="checked">
				<div class="ui-ctl-label-text">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</label>
		</div>
	`,
};

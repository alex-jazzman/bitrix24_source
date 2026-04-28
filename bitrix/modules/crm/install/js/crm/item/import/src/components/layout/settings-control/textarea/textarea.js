import { BitrixVueComponentProps } from 'ui.vue3';
import { RequiredMark } from '../../required-mark/required-mark';

import './textarea.css';

export const Textarea: BitrixVueComponentProps = {
	name: 'Textarea',

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
		value: {
			get(): string
			{
				return this.model.get(this.fieldName) ?? '';
			},
			set(value: string): void
			{
				this.model.set(this.fieldName, value);
			},
		},
	},

	template: `
		<div class="crm-item-import__field --textarea ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</div>
			<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
				<textarea class="ui-ctl-element ui-ctl-resize-y" :name="fieldName" v-model="value" />
			</div>
		</div>
	`,
};

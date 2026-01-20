import { EmptyRichLoc } from 'booking.component.help-desk-loc';

import '../css/description-field.css';

// @vue/component
export const DescriptionField = {
	name: 'ResourceDescriptionField',
	components: {
		EmptyRichLoc,
	},
	props: {
		description: {
			type: String,
			default: '',
		},
	},
	emits: ['descriptionUpdate'],
	computed: {
		localDescription: {
			get(): string
			{
				return this.description;
			},
			set(value: string): void
			{
				this.$emit('descriptionUpdate', value);
			},
		},
	},
	template: `
		<div class="ui-form-row booking--rcw--description-field">
			<div class="ui-form-label">
				<label class="ui-ctl-label-text" for="brcw-settings-resource-description">
					{{ loc('BRCW_SETTINGS_CARD_DESCRIPTION_LABEL') }}
				</label>
			</div>
			<div class="ui-form-content booking--rcw--field-with-validation booking--rcw--resource-description">
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<textarea
						data-id="brcw-settings-resource-description-input"
						v-model.trim="localDescription"
						id="brcw-settings-resource-description"
						class="ui-ctl-element"
						:placeholder="loc('BRCW_SETTINGS_CARD_DESCRIPTION_PLACEHOLDER')"
					></textarea>
				</div>
			</div>
		</div>
	`,
};

import { EmptyRichLoc } from 'booking.component.help-desk-loc';
import { UiErrorMessage } from 'booking.component.ui-error-message';

import '../css/name-field.css';

// @vue/component
export const NameField = {
	name: 'ResourceNameField',
	components: {
		UiErrorMessage,
		EmptyRichLoc,
	},
	props: {
		resourceName: { type: String, default: '' },
		invalid: { type: Boolean, default: false },
	},
	emits: ['nameUpdate'],
	computed: {
		localName: {
			get(): string
			{
				return this.resourceName;
			},
			set(value: string): void
			{
				this.$emit('nameUpdate', value);
			},
		},
	},
	template: `
		<div class="ui-form-row booking--rcw--name-field">
			<div class="ui-form-label">
				<label class="ui-ctl-label-text" for="brcw-settings-resource-name">
					{{ loc('BRCW_SETTINGS_CARD_NAME_LABEL') }}
				</label>
			</div>
			<div class="ui-form-content booking--rcw--field-with-validation">
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<input
						data-id="brcw-settings-resource-name-input"
						v-model.trim="localName"
						id="brcw-settings-resource-name"
						type="text"
						class="ui-ctl-element"
						:class="{ '--error': invalid }"
						:placeholder="loc('BRCW_SETTINGS_CARD_NAME_LABEL')"
					/>
				</div>
				<UiErrorMessage
					v-if="invalid"
					:message="loc('BRCW_SETTINGS_CARD_REQUIRED_FIELD')"
				/>
			</div>
		</div>
	`,
};

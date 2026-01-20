import { Model } from 'booking.const';
import { BIcon, Set as IconSet } from 'ui.icon-set.api.vue';
import { Actions } from 'ui.icon-set.api.core';

import { AvatarField } from './components/avatar-field';
import { NameField } from './components/name-field';
import { TypeField } from './components/type-field';
import { DescriptionField } from './components/description-field';
import { TitleLayout } from '../title-layout/title-layout';
import { TextLayout } from '../text-layout/text-layout';

import './base-fields.css';

// @vue/component
export const BaseFields = {
	name: 'ResourceSettingsCardBaseFields',
	components: {
		TitleLayout,
		TextLayout,
		NameField,
		TypeField,
		DescriptionField,
		AvatarField,
		BIcon,
	},
	props: {
		initialResourceName: {
			type: String,
			default: '',
		},
		initialResourceDescription: {
			type: String,
			default: '',
		},
		initialResourceType: {
			type: Object,
			required: true,
		},
		initialResourceAvatarUrl: {
			type: String,
			default: '',
		},
	},
	emits: [
		'nameUpdate',
		'descriptionUpdate',
		'typeUpdate',
		'avatarFileUpdate',
	],
	setup(): { IconSet: IconSet }
	{
		return {
			IconSet,
		};
	},
	data(): Object
	{
		return {
			additionalInfoExpanded: this.initialAdditionalInfoExpanded(),
			Actions,
		};
	},
	computed: {
		invalidResourceName(): boolean
		{
			return this.$store.state[Model.ResourceCreationWizard].invalidResourceName;
		},
		invalidResourceType(): boolean
		{
			return this.$store.state[Model.ResourceCreationWizard].invalidResourceType;
		},
	},
	watch: {
		invalidResourceName(invalid: boolean): void
		{
			if (invalid)
			{
				this.scrollToBaseFieldsForm();
			}
		},
		invalidResourceType(invalid: boolean): void
		{
			if (invalid)
			{
				this.scrollToBaseFieldsForm();
			}
		},
	},
	methods: {
		scrollToBaseFieldsForm(): void
		{
			this.$refs.baseFieldsForm?.scrollIntoView(true, { behavior: 'smooth', block: 'center' });
		},
		initialAdditionalInfoExpanded(): boolean
		{
			return (this.initialResourceAvatarUrl.length > 0 || this.initialResourceDescription.length > 0);
		},
		toggleAdditionalInfo(): void
		{
			this.additionalInfoExpanded = !this.additionalInfoExpanded;
		},
	},
	template: `
		<div ref="baseFieldsForm" class="ui-form resource-creation-wizard__form-settings --base">
			<TitleLayout
				:title="loc('BRCW_SETTINGS_CARD_BASE_TITLE')"
				:icon-type="IconSet.INFO"
			/>
			<TextLayout
				type="BaseFields"
				:text="loc('BRCW_SETTINGS_CARD_BASE_DESCRIPTION')"
			/>
			<div class="ui-form-row-inline booking--rcw--form-row-align">
				<NameField
					:resourceName="initialResourceName"
					:invalid="invalidResourceName"
					@nameUpdate="$emit('nameUpdate', $event)"
				/>
				<TypeField
					:initialTypeId="initialResourceType.typeId"
					:initialTypeName="initialResourceType.typeName"
					:invalid="invalidResourceType"
					@typeUpdate="$emit('typeUpdate', $event)"
				/>
			</div>
			<div class="booking--rcw--additional-info">
				<div class="booking--rcw--additional-info-header" @click="toggleAdditionalInfo">
					<span class="booking--rcw--additional-info-title">
						{{ loc('BRCW_SETTINGS_CARD_ADDITIONAL_INFO_TITLE') }}
					</span>
					<BIcon :name="additionalInfoExpanded ? Actions.CHEVRON_UP : Actions.CHEVRON_DOWN" />
				</div>
				<Transition name="booking--rcw--additional-info">
					<div v-if="additionalInfoExpanded" class="booking--rcw--additional-info-content">
						<AvatarField
							:avatarUrl="initialResourceAvatarUrl"
							@avatarFileUpdate="$emit('avatarFileUpdate', $event)"
						/>
						<DescriptionField
							:description="initialResourceDescription"
							@descriptionUpdate="$emit('descriptionUpdate', $event)"
						/>
					</div>
				</Transition>
			</div>
		</div>
	`,
};

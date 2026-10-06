import { Loc } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { CollapsibleCard } from '../card/collapsible-card';
import { DATASET_NAME_MAX_LENGTH, getDatasetNameError } from '../lib/dataset-name-validation';

export const PropertiesCard = {
	components: { CollapsibleCard },
	inject: ['appParams'],
	setup()
	{
		return {
			DATASET_NAME_MAX_LENGTH,
		};
	},
	data()
	{
		return {
			titleMessage: Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_TITLE'),
			hintMessage: Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_HINT'),
			nameLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_LABEL'),
			descriptionLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_DESCRIPTION_LABEL'),
			nameError: '',
		};
	},
	computed:
	{
		...mapGetters(['isEditMode', 'isReadOnly', 'datasetProperties', 'hasPreview']),
		hint()
		{
			return this.isReadOnly ? '' : this.hintMessage;
		},
		reservedNames()
		{
			return this.appParams?.reservedNames ?? [];
		},
		name: {
			get()
			{
				return this.datasetProperties.name ?? '';
			},
			set(value)
			{
				this.$store.commit('setDatasetProperties', { name: value });
				this.refreshNameError();
			},
		},
		description: {
			get()
			{
				return this.datasetProperties.description ?? '';
			},
			set(value)
			{
				this.$store.commit('setDatasetProperties', { description: value });
			},
		},
	},
	watch:
	{
		name:
		{
			immediate: true,
			handler()
			{
				this.refreshNameError();
			},
		},
		hasPreview()
		{
			this.refreshNameError();
		},
		reservedNames()
		{
			this.refreshNameError();
		},
	},
	methods:
	{
		refreshNameError()
		{
			if (this.isReadOnly || !this.hasPreview)
			{
				this.nameError = '';

				return;
			}

			this.nameError = this.validateName(this.name);
		},
		validateName(value)
		{
			const error = getDatasetNameError(value, this.reservedNames);
			if (error === 'required')
			{
				return Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_REQUIRED');
			}
			if (error === 'tooLong')
			{
				return Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_TOO_LONG')
					.replace('#MAX#', String(DATASET_NAME_MAX_LENGTH));
			}
			if (error === 'badFormat')
			{
				return Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_BAD_FORMAT');
			}
			if (error === 'reserved')
			{
				return Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_RESERVED');
			}

			return '';
		},
	},
	// language=Vue
	template: `
		<CollapsibleCard
			id="properties"
			:title="titleMessage"
			:hint="hint"
			icon-class="--graphs-settings"
			:disabled="!hasPreview"
		>
			<label class="biconnector-dataset-import-v2-card__field">
				<span class="biconnector-dataset-import-v2-card__field-label">{{ nameLabel }}</span>
				<input
					type="text"
					class="biconnector-dataset-import-v2-card__input"
					:class="{ 'biconnector-dataset-import-v2-card__input--error': !!nameError }"
					v-model.trim="name"
					:disabled="isReadOnly"
					:maxlength="DATASET_NAME_MAX_LENGTH"
					autocomplete="off"
				/>
				<span v-if="nameError" class="biconnector-dataset-import-v2-card__field-error">
					{{ nameError }}
				</span>
			</label>
			<label class="biconnector-dataset-import-v2-card__field">
				<span class="biconnector-dataset-import-v2-card__field-label">{{ descriptionLabel }}</span>
				<textarea
					class="biconnector-dataset-import-v2-card__textarea"
					v-model="description"
					rows="3"
					:disabled="isReadOnly"
				></textarea>
			</label>
		</CollapsibleCard>
	`,
};

import { Loc } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { SidePanel } from 'ui.sidepanel';
import { CollapsibleCard } from '../card/collapsible-card';

const DATA_FORMATS_URL = '/bitrix/components/bitrix/biconnector.dataset.import.v2.data-formats/slider.php';

export const FileSettingsCard = {
	components: { CollapsibleCard },
	inject: ['appParams', 'sourceId'],
	data()
	{
		return {
			titleMessage: Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_TITLE'),
			encodingLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_ENCODING'),
			separatorLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_SEPARATOR'),
			firstLineHeaderLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_FIRST_LINE_HEADER'),
			dataFormatsLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_DATA_FORMATS'),
		};
	},
	computed:
	{
		...mapGetters(['isEditMode', 'hasPreview']),
		fileProperties()
		{
			return this.$store.state.config.fileProperties;
		},
		isCsv()
		{
			return this.sourceId === 'csv';
		},
		encoding: {
			get() { return this.fileProperties.encoding; },
			set(value) { this.$store.commit('setFileProperties', { encoding: value }); },
		},
		separator: {
			get() { return this.fileProperties.separator; },
			set(value) { this.$store.commit('setFileProperties', { separator: value }); },
		},
		firstLineHeader: {
			get() { return Boolean(this.fileProperties.firstLineHeader); },
			set(value) { this.$store.commit('setFileProperties', { firstLineHeader: value }); },
		},
		isParsingOptionsEditable()
		{
			return !this.isEditMode || Boolean(this.fileProperties.fileToken);
		},
	},
	methods:
	{
		openDataFormats()
		{
			const params = new URLSearchParams();
			const current = this.$store.state.config.dataFormats || {};
			Object.entries(current).forEach(([key, value]) => {
				params.append(`dataFormats[${key}]`, String(value ?? ''));
			});
			SidePanel.Instance.open(`${DATA_FORMATS_URL}?${params.toString()}`, {
				allowChangeHistory: false,
				cacheable: false,
				width: 630,
			});
		},
	},
	// language=Vue
	template: `
		<CollapsibleCard
			id="file-settings"
			:title="titleMessage"
			icon-class="--o-file-settings"
			:disabled="!hasPreview"
		>
			<template #header-extra>
				<button
					v-if="isCsv"
					type="button"
					class="biconnector-dataset-import-v2-card__header-link ui-typography-text-sm"
					@click="openDataFormats"
				>
					<span class="biconnector-dataset-import-v2-card__header-link-text">{{ dataFormatsLabel }}</span>
					<span class="biconnector-dataset-import-v2-card__header-link-icon ui-icon-set --chevron-right"></span>
				</button>
			</template>
			<div v-if="isCsv" class="biconnector-dataset-import-v2-card__row">
				<label class="biconnector-dataset-import-v2-card__field">
					<span class="biconnector-dataset-import-v2-card__field-label">{{ encodingLabel }}</span>
					<select v-model="encoding" class="biconnector-dataset-import-v2-card__select" :disabled="!isParsingOptionsEditable">
						<option
							v-for="option in (appParams.encodings || [])"
							:key="option.value"
							:value="option.value"
						>{{ option.title }}</option>
					</select>
				</label>
				<label class="biconnector-dataset-import-v2-card__field">
					<span class="biconnector-dataset-import-v2-card__field-label">{{ separatorLabel }}</span>
					<select v-model="separator" class="biconnector-dataset-import-v2-card__select" :disabled="!isParsingOptionsEditable">
						<option
							v-for="option in (appParams.separators || [])"
							:key="option.value"
							:value="option.value"
						>{{ option.title }}</option>
					</select>
				</label>
			</div>
			<label v-if="isCsv" class="biconnector-dataset-import-v2-card__toggle">
				<input
					type="checkbox"
					class="biconnector-dataset-import-v2-card__toggle-input"
					v-model="firstLineHeader"
					:disabled="!isParsingOptionsEditable"
				/>
				<span class="biconnector-dataset-import-v2-card__toggle-track">
					<span class="biconnector-dataset-import-v2-card__toggle-knob"></span>
				</span>
				<span class="biconnector-dataset-import-v2-card__toggle-label">{{ firstLineHeaderLabel }}</span>
			</label>
		</CollapsibleCard>
	`,
};

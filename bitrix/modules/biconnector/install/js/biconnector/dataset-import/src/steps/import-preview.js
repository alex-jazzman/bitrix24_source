import { Loader } from 'main.loader';
import { AppSection } from '../layout/app-section';
import '../css/import-preview.css';
import { PreviewTable } from './import-preview/preview-table';

export const ImportPreview = {
	components: {
		AppSection,
		PreviewTable,
	},
	props: {
		emptyStateText: {
			type: String,
			required: false,
			default: null,
		},
		error: {
			type: String,
			required: false,
			default: '',
		},
		isLoading: {
			type: Boolean,
			required: false,
			default: false,
		},
		needShowHeadersWithEmptyRows: {
			type: Boolean,
			required: false,
			default: false,
		},
		sourceType: {
			type: String,
			required: false,
			default: '',
		},
	},
	computed: {
		isEditMode(): boolean
		{
			return this.$store.getters.isEditMode;
		},
		fields()
		{
			return this.$store.state.config.fieldsSettings;
		},
		rows()
		{
			return this.$store.state.previewData.rows;
		},
		isEverythingHidden()
		{
			return this.fields.length > 0 && this.$store.getters.areNoRowsVisible;
		},
		hasData()
		{
			return this.$store.getters.hasData;
		},
		hasHeaders(): boolean
		{
			return this.fields.length > 0;
		},
		displayedEmptyStateText()
		{
			return this.emptyStateText ?? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_EMPTY_STATE');
		},
		displayedEverythingHiddenText()
		{
			return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_EVERYTHING_HIDDEN');
		},
		columnVisibility()
		{
			return this.$store.getters.columnVisibilityMap;
		},
		isErrorInEditMode()
		{
			return this.hasData && this.error && this.isEditMode;
		},
		isEditModeInitialDataDisplayed()
		{
			return this.isEditMode && !this.$store.state.config.fileProperties.fileToken;
		},
		displayedTitle()
		{
			return this.isEditModeInitialDataDisplayed
				? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_INITIAL_DATA_PREVIEW_TITLE_MSGVER_1')
				: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_TITLE')
			;
		},
		hasDataDisplayedHint()
		{
			return this.isEditModeInitialDataDisplayed
				? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_INITIAL_DATA_PREVIEW_HINT_MSGVER_1')
				: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_HINT_MSGVER_1')
			;
		},
	},
	watch: {
		isLoading(newValue)
		{
			if (this.loader)
			{
				this.loader.destroy();
			}

			if (newValue)
			{
				this.loader = new Loader({
					target: this.$refs.loadingAnchor,
					size: 77,
					color: 'var(--ui-color-primary)',
					strokeWidth: 4,
				});
				this.loader.show();
			}
		},
	},
	// language=Vue
	template: `
		<AppSection
			:title="displayedTitle"
			:custom-classes="['dataset-import-step--full-height', 'dataset-import-step--sticky', 'import-preview']"
		>
			<div class="import-preview__loading" ref="loadingAnchor"></div>
			<template v-if="!isLoading">
				<template v-if="error">
					<div class="import-preview__no-data" v-if="isEverythingHidden">
						<div class="import-preview__no-data-logo"></div>
						<p class="import-preview__no-data-text">{{ displayedEverythingHiddenText }}</p>
					</div>
					<template v-else>
						<div class="import-preview__has-data import-preview__has-data--edit-mode-error" v-if="isEditMode">
							<span class="import-preview__hint">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_HINT_MSGVER_1') }}</span>
							<PreviewTable
								:fields="fields"
								:column-visibility="columnVisibility"
								:source-type="sourceType"
							/>
							<div class="import-preview__edit-mode-error">
								<div class="import-preview__error-logo"></div>
								<p class="import-preview__no-data-text">{{ error }}</p>
							</div>
						</div>
						<div class="import-preview__has-data" v-else>
							<PreviewTable
								:fields="fields"
								:column-visibility="columnVisibility"
								:source-type="sourceType"
							/>
							<div class="import-preview__edit-mode-error">
								<div class="import-preview__error-logo"></div>
								<p class="import-preview__no-data-text">{{ error }}</p>
							</div>
						</div>
					</template>
				</template>
				<template v-else>
					<div class="import-preview__no-data" v-if="isEverythingHidden">
						<div class="import-preview__no-data-logo"></div>
						<p class="import-preview__no-data-text">{{ displayedEverythingHiddenText }}</p>
					</div>
					<div class="import-preview__has-data" v-else-if="hasData">
						<span class="import-preview__hint">{{ hasDataDisplayedHint }}</span>
						<PreviewTable
							:fields="fields"
							:rows="rows"
							:column-visibility="columnVisibility"
							:source-type="sourceType"
						/>
					</div>
					<div class="import-preview__has-data" v-else-if="hasHeaders && needShowHeadersWithEmptyRows">
						<PreviewTable
							:fields="fields"
							:column-visibility="columnVisibility"
							:source-type="sourceType"
						/>
						<div class="import-preview__edit-mode-error">
							<div class="import-preview__no-data-logo"></div>
							<p class="import-preview__no-data-text">{{ displayedEmptyStateText }}</p>
						</div>
					</div>
					<div class="import-preview__no-data" v-else>
						<div class="import-preview__no-data-logo"></div>
						<p class="import-preview__no-data-text">{{ displayedEmptyStateText }}</p>
					</div>
				</template>
			</template>
		</AppSection>
	`,
};

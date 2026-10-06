import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';

import { CollapsibleCard } from '../card/collapsible-card';
import { FieldRowCard } from './field-row-card';

const SYNC_EVENT = 'biconnector:dataset-import-v2:connection-sync';

export const ColumnsCard = {
	components: { CollapsibleCard, FieldRowCard },
	data()
	{
		return {
			titleMessage: Loc.getMessage('DATASET_IMPORT_V2_CARD_COLUMNS_TITLE'),
			hintMessage: Loc.getMessage('DATASET_IMPORT_V2_CARD_COLUMNS_HINT'),
			placeholderMessage: Loc.getMessage('DATASET_IMPORT_V2_CARD_COLUMNS_PLACEHOLDER'),
			syncLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_COLUMNS_SYNC'),
		};
	},
	computed:
	{
		...mapGetters(['isEditMode', 'isReadOnly', 'hasPreview', 'connectionProperties']),
		hint()
		{
			return this.isReadOnly ? '' : this.hintMessage;
		},
		fieldsSettings()
		{
			return this.$store.state.config.fieldsSettings;
		},
		showSync()
		{
			return this.isEditMode && Boolean(this.connectionProperties?.connectionId);
		},
	},
	methods:
	{
		onSync()
		{
			EventEmitter.emit(SYNC_EVENT, {});
		},
	},
	// language=Vue
	template: `
		<CollapsibleCard
			id="columns"
			:title="titleMessage"
			:hint="hint"
			icon-class="--o-set-columns"
			:disabled="!hasPreview"
		>
			<template #header-extra>
				<button
					v-if="showSync"
					type="button"
					class="biconnector-dataset-import-v2-card__header-link ui-typography-text-sm"
					@click="onSync"
				>{{ syncLabel }}</button>
			</template>
			<div v-if="!hasPreview" class="biconnector-dataset-import-v2-card__columns-empty">
				{{ placeholderMessage }}
			</div>
			<div v-else class="biconnector-dataset-import-v2-card__columns-list">
				<FieldRowCard
					v-for="(field, index) in fieldsSettings"
					:key="field.id || index"
					:index="index"
				/>
			</div>
		</CollapsibleCard>
	`,
};

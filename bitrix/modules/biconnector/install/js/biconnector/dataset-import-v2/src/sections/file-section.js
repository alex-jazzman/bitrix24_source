import { Loc } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';

import { showDeleteFileConfirm, showReplaceFileConfirm } from '../app/delete-file-confirm';
import { MascotVideo } from './mascot-video';

export const FileSection = {
	components: { MascotVideo },
	inject: ['sourceId'],
	emits: ['pick-file', 'remove-file'],
	data()
	{
		return {
			titleMessage: Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_TITLE'),
			emptyHint: Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_EMPTY_HINT'),
			browseLabel: Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_BROWSE'),
			replaceLabel: Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_REPLACE'),
			removeHint: Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_REMOVE'),
			dragTitle: Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_DRAG_TITLE'),
			dragHint: Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_DRAG_HINT'),
			isDragging: false,
			dragCounter: 0,
		};
	},
	computed:
	{
		...mapGetters(['isEditMode', 'isUploading', 'uploadStep']),
		loadingMessage()
		{
			const step = Math.max(1, Math.min(3, Number(this.uploadStep) || 1));

			return Loc.getMessage(`DATASET_IMPORT_V2_FILE_SECTION_LOADING_${step}`);
		},
		fileProperties()
		{
			return this.$store.state.config.fileProperties;
		},
		hasLocalFile()
		{
			return Boolean(this.fileProperties.fileToken) || Boolean(this.fileProperties.fileName);
		},
		hasFile()
		{
			return this.hasLocalFile || this.isEditMode;
		},
		fileName()
		{
			return this.fileProperties.fileName || '';
		},
		isCsv()
		{
			return this.sourceId === 'csv';
		},
		canRemoveFile()
		{
			return !this.isEditMode || Boolean(this.fileProperties.fileToken);
		},
	},
	methods:
	{
		onPick()
		{
			if (this.$refs.input)
			{
				this.$refs.input.click();
			}
		},
		onReplace()
		{
			if (!this.hasLocalFile)
			{
				this.onPick();

				return;
			}
			showReplaceFileConfirm({
				fileName: this.fileName,
				onConfirm: () => this.onPick(),
			});
		},
		onRemove(event)
		{
			if (event)
			{
				event.preventDefault();
				event.stopPropagation();
			}
			if (this.isEditMode)
			{
				this.$emit('remove-file');

				return;
			}
			showDeleteFileConfirm({
				fileName: this.fileName,
				onConfirm: () => {
					this.$emit('remove-file');
				},
			});
		},
		onInputChange(event)
		{
			const file = event.target.files?.[0];
			if (file)
			{
				this.$emit('pick-file', file);
			}
			event.target.value = '';
		},
		hasDraggedFiles(event)
		{
			const types = event?.dataTransfer?.types;
			if (!types)
			{
				return false;
			}
			for (let i = 0; i < types.length; i++)
			{
				if (types[i] === 'Files')
				{
					return true;
				}
			}

			return false;
		},
		onDragEnter(event)
		{
			if (!this.hasDraggedFiles(event))
			{
				return;
			}
			event.preventDefault();
			this.dragCounter += 1;
			this.isDragging = true;
		},
		onDragOver(event)
		{
			if (!this.hasDraggedFiles(event))
			{
				return;
			}
			event.preventDefault();
		},
		onDragLeave(event)
		{
			if (!this.hasDraggedFiles(event))
			{
				return;
			}
			event.preventDefault();
			this.dragCounter = Math.max(0, this.dragCounter - 1);
			if (this.dragCounter === 0)
			{
				this.isDragging = false;
			}
		},
		onDrop(event)
		{
			event.preventDefault();
			this.dragCounter = 0;
			this.isDragging = false;
			const file = event.dataTransfer?.files?.[0];
			if (!file)
			{
				return;
			}
			if (this.hasLocalFile)
			{
				showReplaceFileConfirm({
					fileName: this.fileName,
					onConfirm: () => this.$emit('pick-file', file),
				});

				return;
			}
			this.$emit('pick-file', file);
		},
	},
	// language=Vue
	template: `
		<section
			v-if="isCsv"
			class="biconnector-dataset-import-v2-file-section"
			:class="{
				'biconnector-dataset-import-v2-file-section--empty': !hasFile,
				'biconnector-dataset-import-v2-file-section--filled': hasFile,
				'biconnector-dataset-import-v2-file-section--dragging': isDragging,
			}"
			@dragenter="onDragEnter"
			@dragover="onDragOver"
			@dragleave="onDragLeave"
			@drop="onDrop"
		>
			<input
				ref="input"
				type="file"
				accept=".csv"
				class="biconnector-dataset-import-v2-file-section__hidden-input"
				@change="onInputChange"
			/>

			<header class="biconnector-dataset-import-v2-file-section__header">
				<span class="biconnector-dataset-import-v2-file-section__header-icon ui-icon-set --o-attach"></span>
				<span class="biconnector-dataset-import-v2-file-section__header-title ui-typography-text-md">{{ titleMessage }}</span>
				<template v-if="hasFile">
					<span v-if="hasLocalFile" class="biconnector-dataset-import-v2-file-section__chip">
						<span class="biconnector-dataset-import-v2-file-section__chip-icon"></span>
						<span class="biconnector-dataset-import-v2-file-section__chip-name ui-typography-text-sm">{{ fileName }}</span>
						<button
							v-if="canRemoveFile"
							type="button"
							class="biconnector-dataset-import-v2-file-section__chip-remove ui-icon-set --cross-30"
							:title="removeHint"
							@click="onRemove"
						></button>
					</span>
					<span v-if="hasLocalFile" class="biconnector-dataset-import-v2-file-section__divider"></span>
					<button
						type="button"
						class="biconnector-dataset-import-v2-file-section__replace ui-typography-text-sm"
						@click="onReplace"
					>{{ replaceLabel }}</button>
				</template>
			</header>

			<div v-if="!hasFile" class="biconnector-dataset-import-v2-file-section__empty">
				<MascotVideo class="biconnector-dataset-import-v2-file-section__mascot" :playing="isUploading" />
				<p
					class="biconnector-dataset-import-v2-file-section__empty-text ui-typography-text-sm"
					:class="{ 'biconnector-dataset-import-v2-file-section__empty-text--loading': isUploading }"
					role="status"
					aria-live="polite"
				>{{ isUploading ? loadingMessage : emptyHint }}</p>
				<button
					type="button"
					class="biconnector-dataset-import-v2-file-section__browse"
					:class="{ 'biconnector-dataset-import-v2-file-section__browse--loading': isUploading }"
					:disabled="isUploading"
					@click="onPick"
				>
					<template v-if="isUploading">
						<span class="biconnector-dataset-import-v2-file-section__browse-spinner"></span>
					</template>
					<template v-else>
						<span class="biconnector-dataset-import-v2-file-section__browse-icon ui-icon-set --o-attach"></span>
						{{ browseLabel }}
					</template>
				</button>
			</div>

			<div
				v-if="isDragging && !hasFile"
				class="biconnector-dataset-import-v2-file-section__drag-overlay"
			>
				<div class="biconnector-dataset-import-v2-file-section__drag-content">
					<div class="biconnector-dataset-import-v2-file-section__drag-heading">
						<span class="biconnector-dataset-import-v2-file-section__drag-icon ui-icon-set --o-upload-file"></span>
						<span class="biconnector-dataset-import-v2-file-section__drag-title">{{ dragTitle }}</span>
					</div>
					<p class="biconnector-dataset-import-v2-file-section__drag-hint">{{ dragHint }}</p>
				</div>
			</div>
		</section>
	`,
};

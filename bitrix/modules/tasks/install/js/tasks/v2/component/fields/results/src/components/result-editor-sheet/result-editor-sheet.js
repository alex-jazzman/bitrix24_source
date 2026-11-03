import { Text } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';

import { Core } from 'tasks.v2.core';
import { EventName, Model } from 'tasks.v2.const';
import { EntityTypes } from 'tasks.v2.provider.service.file-service';
import { DropZone } from 'tasks.v2.component.drop-zone';
import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { syncBottomSheetModality } from 'tasks.v2.lib.bottom-sheet-aria';
import type { ResultModel } from 'tasks.v2.model.results';

import { ResultEditor } from './result-editor';

// @vue/component
export const ResultEditorSheet = {
	components: {
		BottomSheet,
		DropZone,
		ResultEditor,
	},
	inject: {
		taskId: {},
		embedded: {},
	},
	props: {
		resultId: {
			type: [Number, String],
			required: true,
		},
		showResize: {
			type: Boolean,
			default: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(): void
	{
		return {
			EntityTypes,
		};
	},
	data(): void
	{
		return {
			isResized: false,
			uniqueKey: Text.getRandom(),
			editorTitleId: `tasks-result-editor-title-${Text.getRandom()}`,
		};
	},
	computed: {
		result(): ResultModel
		{
			return this.$store.getters[`${Model.Results}/getById`](this.resultId);
		},
		bottomSheetContainer(): HTMLElement | null
		{
			return document.getElementById(`b24-bottom-sheet-${this.uniqueKey}`) || null;
		},
		isDiskModuleInstalled(): boolean
		{
			return Core.getParams().features.disk;
		},
		shouldShowResize(): boolean
		{
			return this.showResize && !this.embedded;
		},
	},
	mounted(): void
	{
		EventEmitter.subscribe(EventName.OpenResultFromChat, this.handleOpenResultFromMessage);

		void this.$nextTick(this.syncSheetModality);
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe(EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	},
	methods: {
		handleOpenResultFromMessage(event: BaseEvent): void
		{
			const { taskId } = event.getData();

			if (this.taskId === taskId)
			{
				this.$emit('close');
			}
		},
		syncSheetModality(): void
		{
			syncBottomSheetModality(this.$refs.bottomSheet);
		},
	},
	template: `
		<BottomSheet
			ref="bottomSheet"
			:sheetBindProps
			:isExpanded="isResized"
			:padding="0"
			:popupPadding="0"
			:uniqueKey
			:ariaLabelledBy="editorTitleId"
			@close="$emit('close')"
		>
			<ResultEditor
				:resultId
				:isResized
				:content="result.text || ''"
				:showResize="shouldShowResize"
				:titleId="editorTitleId"
				@close="$emit('close')"
				@resize="isResized = !isResized"
			/>
			<DropZone
				v-if="isDiskModuleInstalled"
				:container="bottomSheetContainer || {}"
				:entityId="resultId || 0"
				:entityType="EntityTypes.Result"
			/>
		</BottomSheet>
	`,
};

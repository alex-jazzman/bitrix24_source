import { Text } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { HeadlineMd } from 'ui.system.typography.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { EventName, Model } from 'tasks.v2.const';
import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { highlighter } from 'tasks.v2.lib.highlighter';
import { resultService } from 'tasks.v2.provider.service.result-service';
import type { ResultId } from 'tasks.v2.provider.service.result-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { ResultListItem } from '../result/result-list-item';
import { ResultSkeleton } from '../result/result-skeleton';
import { ResultEditorSheet } from '../result-editor-sheet/result-editor-sheet';
import { ResultListEmpty } from './result-list-empty';

import './result-list-sheet.css';

// @vue/component
export const ResultListSheet = {
	components: {
		BottomSheet,
		BIcon,
		UiButton,
		ResultListItem,
		ResultSkeleton,
		ResultEditorSheet,
		ResultListEmpty,
		HeadlineMd,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		resultId: {
			type: [Number, String],
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): Object
	{
		return {
			editResultId: 0,
			isResultEditorShown: false,
			isResized: false,
		};
	},
	computed: {
		results(): ResultId[]
		{
			return this.task.results;
		},
		loadedResults(): ResultId[]
		{
			return this.results.filter((resultId) => this.isResultLoaded(resultId));
		},
		hasUnloadedResults(): boolean
		{
			return this.results.length !== this.loadedResults.length;
		},
		isEmptyState(): boolean
		{
			return this.results.length === 0;
		},
	},
	watch: {
		async resultId(newResultId: string | number): void
		{
			await this.$nextTick();

			if (newResultId)
			{
				this.focusTo(newResultId);
			}
		},
	},
	mounted(): void
	{
		if (this.hasUnloadedResults)
		{
			void resultService.getAll(this.taskId);
		}

		this.focusTo(this.resultId);

		EventEmitter.subscribe(EventName.ResultAdded, this.handleResultAdded);
		EventEmitter.subscribe(EventName.ResultUpdated, this.handleResultUpdated);
		EventEmitter.subscribe(EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe(EventName.ResultAdded, this.handleResultAdded);
		EventEmitter.unsubscribe(EventName.ResultUpdated, this.handleResultUpdated);
		EventEmitter.unsubscribe(EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	},
	methods: {
		isResultLoaded(resultId: string | number): boolean
		{
			return Boolean(this.$store.getters[`${Model.Results}/getById`](resultId));
		},
		focusTo(resultId: string | number): void
		{
			if (!resultId)
			{
				return;
			}

			const scrollContainer = this.$refs.scrollContainer;
			if (!scrollContainer)
			{
				return;
			}

			const { targetId, offset, shouldHighlight } = this.calculateFocusTarget(resultId);

			this.scrollToTarget(targetId, offset, shouldHighlight);
		},
		calculateFocusTarget(resultId: string | number): {
			targetId: string | number,
			offset: number,
			shouldHighlight: boolean,
		}
		{
			return {
				targetId: resultId,
				offset: 80,
				shouldHighlight: true,
			};
		},
		scrollToTarget(targetId: string | number, offset: number, shouldHighlight: boolean): void
		{
			setTimeout(() => {
				const targetNode = this.$refs.scrollContainer.querySelector(`[data-result-id="${targetId}"]`);
				if (!targetNode)
				{
					return;
				}

				if (shouldHighlight)
				{
					this.highlightResult(targetId);
				}

				this.$refs.scrollContainer.scrollTop = targetNode.offsetTop - offset;
			}, 0);
		},
		highlightResult(targetId: string | number): void
		{
			const highlightElement = this.$refs.scrollContainer.querySelector(`[data-result-id="${targetId}"]`);

			if (highlightElement)
			{
				void highlighter.highlight(highlightElement);
			}
		},
		openAddResultSheet(): void
		{
			this.editResultId = Text.getRandom();

			const payload = {
				id: this.editResultId,
				taskId: this.taskId,
				author: Core.getParams().currentUser,
			};

			void this.$store.dispatch(`${Model.Results}/insert`, payload);

			this.isResultEditorShown = true;
		},
		openEditResult(resultId: number): void
		{
			this.editResultId = resultId;
			this.isResultEditorShown = true;
		},
		closeResultEditor(): void
		{
			this.isResultEditorShown = false;
			this.editResultId = 0;
		},
		handleResultAdded(event: BaseEvent): void
		{
			const { taskId } = event.getData();

			if (taskId !== this.taskId)
			{
				return;
			}

			this.$emit('close');
		},
		handleResultUpdated(event: BaseEvent): void
		{
			const { taskId, resultId } = event.getData();

			if (taskId !== this.taskId)
			{
				return;
			}

			this.focusTo(resultId);
		},
		handleOpenResultFromMessage(event: BaseEvent): void
		{
			const { taskId, resultId } = event.getData();

			if (this.taskId !== taskId || !this.isShown)
			{
				return;
			}

			this.focusTo(resultId);
		},
	},
	template: `
		<BottomSheet
			:sheetBindProps
			:isExpanded="isResized"
			:padding="0"
			:popupPadding="0"
			@close="$emit('close')"
		>
			<div class="tasks-field-results-result-list" ref="main">
				<div class="tasks-field-results-result-list-close-icon">
					<BIcon :name="Outline.CROSS_L" hoverable @click="$emit('close')"/>
				</div>
				<div  v-if="isEmptyState" class="tasks-field-results-result-list-header">
					<HeadlineMd className="tasks-field-results-result-list-title">
						{{ loc('TASKS_V2_RESULT_LIST_EMPTY_TITLE') }}
					</HeadlineMd>
				</div>
				<div class="tasks-field-results-result-list-content" ref="scrollContainer">
					<ResultListEmpty v-if="isEmptyState" @addResult="openAddResultSheet"/>
					<div
						v-else
						v-for="(result, resultIndex) in results"
						:key="result"
						:data-result-id="result"
						class="tasks-field-results-result-item"
					>
						<ResultListItem
							v-if="isResultLoaded(result)"
							:resultId="result"
							listMode
							:showDelimiter="resultIndex !== results.length - 1"
							:isResized
							@edit="openEditResult"
							@resize="isResized = !isResized"
						/>
						<ResultSkeleton v-else/>
					</div>
				</div>
			</div>
			<div
				v-if="!isEmptyState"
				class="tasks-field-results-result-add-button"
			>
				<UiButton
					:text="loc('TASKS_V2_RESULT_ADD')"
					:style="AirButtonStyle.SELECTION"
					:size="ButtonSize.SMALL"
					@click="openAddResultSheet"
				/>
			</div>
			<ResultEditorSheet
				v-if="isResultEditorShown"
				:resultId="editResultId"
				:sheetBindProps
				:showResize="false"
				@close="closeResultEditor"
			/>
		</BottomSheet>
	`,
};

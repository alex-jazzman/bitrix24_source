import { Loc, Type, Text } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { showLimit } from 'tasks.v2.lib.show-limit';

import { mapGetters } from 'ui.vue3.vuex';
import { hint } from 'ui.vue3.directives.hint';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.vue3.components.menu';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import { BIcon, Animated, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.animated';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { EventName, Model, Option } from 'tasks.v2.const';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { Hint } from 'tasks.v2.component.elements.hint';
import { resultService, type ResultId } from 'tasks.v2.provider.service.result-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { stateService } from 'tasks.v2.provider.service.state-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { resultsMeta } from './results-meta';
import { ResultCardItem } from './components/result/result-card-item';
import { ResultRequiredAha } from './components/result-required-aha/result-required-aha';
import { ResultListSheet } from './components/result-list-sheet/result-list-sheet';
import { ResultEditorSheet } from './components/result-editor-sheet/result-editor-sheet';

import './results.css';

// @vue/component
export const Results = {
	name: 'TaskResults',
	components: {
		BIcon,
		BMenu,
		Hint,
		TextMd,
		TextXs,
		ResultCardItem,
		ResultRequiredAha,
		ResultEditorSheet,
		ResultListSheet,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
		isSheetShown: {
			type: Boolean,
			default: false,
		},
		isListSheetShown: {
			type: Boolean,
			default: false,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	setup(): { task: TaskModel }
	{
		return {
			resultsMeta,
			Outline,
			Animated,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
			isLoading: null,
			showCreatorResultHint: false,
			showResponsibleResultHint: false,
			sheetResultId: 0,
		};
	},
	computed: {
		...mapGetters({
			stateFlags: `${Model.Interface}/stateFlags`,
		}),
		requireResult(): boolean
		{
			return this.task?.requireResult || false;
		},
		isCreator(): boolean
		{
			return Core.getParams().currentUser.id === this?.task.creatorId;
		},
		isResponsible(): boolean
		{
			const userId = Core.getParams().currentUser.id;

			return this.task?.responsibleIds?.includes(userId) || this.task?.accomplicesIds.includes(userId);
		},
		containsResults(): boolean
		{
			return this.task.containsResults;
		},
		results(): number[]
		{
			return this.task.results || [];
		},
		hasResults(): boolean
		{
			return this.results.length > 0;
		},
		showMore(): boolean
		{
			return this.results.length > 1;
		},
		lastResultId(): ResultId | null
		{
			return this.hasResults ? this.results[0] : null;
		},
		moreText(): number
		{
			const count = this.results.length - 1;

			return Loc.getMessagePlural('TASKS_V2_RESULT_SHOW_MORE', count, {
				'#COUNT#': count,
			});
		},
		emptyResultTitle(): string
		{
			return this.requireResult
				? Loc.getMessage('TASKS_V2_RESULT_TITLE_REQUIRED')
				: resultsMeta.title
			;
		},
		showMoreIcon(): boolean
		{
			return this.task.rights.edit;
		},
		menuOptions(): MenuOptions
		{
			return {
				id: `result-field-menu-${Text.getRandom()}`,
				bindOptions: { forceBindPosition: true },
				bindElement: this.$refs.moreIcon.$el,
				targetContainer: document.body,
				minWidth: 240,
				offsetLeft: -100,
				items: this.menuItems,
				autoHide: true,
				closeByEsc: true,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				{
					title: this.loc('TASKS_V2_RESULT_ADD'),
					icon: Outline.PLUS_L,
					onClick: this.openAddResultSheet,
					dataset: {
						id: `MenuResultAdd-${this.taskId}`,
					},
				},
				this.requireResult && {
					title: this.loc('TASKS_V2_RESULT_NOT_REQUIRED'),
					design: 'alert',
					icon: Outline.CROSS_L,
					onClick: this.handleUnrequireResult,
					dataset: {
						id: `MenuResultNotRequire-${this.taskId}`,
					},
				},
				!this.requireResult && {
					title: this.loc('TASKS_V2_RESULT_REQUIRE'),
					icon: Outline.WINDOW_FLAG,
					isLocked: this.isLocked,
					onClick: this.handleRequireResult,
					dataset: {
						id: `MenuResultRequire-${this.taskId}`,
					},
				},
			];
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.requiredResult.available;
		},
		featureId(): string
		{
			return Core.getParams().restrictions.requiredResult.featureId;
		},
	},
	watch: {
		requireResult: {
			async handler(newVal): void
			{
				if (newVal)
				{
					await this.$nextTick();

					this.tryShowResultHints();
				}
			},
			deep: true,
		},
	},
	async created(): void
	{
		if (!this.isEdit || !this.containsResults)
		{
			return;
		}

		if (Type.isArrayFilled(this.results))
		{
			return;
		}

		this.isLoading = true;

		await resultService.tail(this.taskId);

		this.isLoading = false;
	},
	mounted(): void
	{
		this.tryShowResultHints();

		EventEmitter.subscribe(EventName.ResultAdded, this.handleHighlightFieldAfterEdit);
		EventEmitter.subscribe(EventName.ResultUpdated, this.handleHighlightFieldAfterEdit);
		EventEmitter.subscribe(EventName.RequiredResultsMissing, this.showResponsibleHint);
		EventEmitter.subscribe(EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe(EventName.ResultAdded, this.handleHighlightFieldAfterEdit);
		EventEmitter.unsubscribe(EventName.ResultUpdated, this.handleHighlightFieldAfterEdit);
		EventEmitter.unsubscribe(EventName.RequiredResultsMissing, this.showResponsibleHint);
		EventEmitter.unsubscribe(EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	},
	methods: {
		openMore(): void
		{
			this.openResultSheet(0);
		},
		handleTitleClick(): void
		{
			if (!this.isLoading)
			{
				this.openAddResultSheet();
			}
		},
		openAddResultSheet(): void
		{
			const id = Text.getRandom();

			const payload = {
				id,
				taskId: this.taskId,
				author: Core.getParams().currentUser,
			};

			void this.$store.dispatch(`${Model.Results}/insert`, payload);

			this.openEditSheet(id);
		},
		handleResponsibleHintButtonClick(): void
		{
			this.handleResponsibleHintClose();
			this.openAddResultSheet();
		},
		handleRequireResult(): void
		{
			if (this.isLocked)
			{
				void showLimit({
					code: `limit_${this.featureId}`,
					bindElement: this.$refs.moreIcon.$el,
					analytics: {
						type: 'limit_tasks_status_summary',
					},
				});

				return;
			}

			this.setRequireResult(true);
		},
		handleUnrequireResult(): void
		{
			this.setRequireResult(false);
		},
		async setRequireResult(requireResult: boolean): void
		{
			void taskService.update(this.taskId, { requireResult });

			if (!this.isEdit)
			{
				await this.$store.dispatch(`${Model.Interface}/updateStateFlags`, { defaultRequireResult: requireResult });

				void stateService.set(this.stateFlags);
			}
		},
		tryShowResultHints(): void
		{
			if (!this.requireResult || this.containsResults)
			{
				return;
			}

			if (
				!this.isEdit
				&& ahaMoments.shouldShow(Option.AhaRequiredResultCreatorPopup)
			)
			{
				ahaMoments.setActive(Option.AhaRequiredResultCreatorPopup);
				this.showCreatorHint();

				return;
			}

			if (
				this.isEdit
				&& this.isResponsible
				&& !this.isCreator
				&& ahaMoments.shouldShow(Option.AhaRequiredResultResponsiblePopup)
			)
			{
				ahaMoments.setActive(Option.AhaRequiredResultResponsiblePopup);

				setTimeout((): void => {
					this.showResponsibleHint();
				}, 2000);
			}
		},
		showCreatorHint(): void
		{
			this.showCreatorResultHint = true;
			this.highlightField();
		},
		showResponsibleHint(): void
		{
			this.showResponsibleResultHint = true;
			this.highlightField();
		},
		handleHighlightFieldAfterEdit(event: BaseEvent): void
		{
			const { taskId } = event.getData();

			if (this.taskId !== taskId)
			{
				return;
			}

			this.highlightField();
		},
		handleCreatorHintClose(): void
		{
			if (!this.showCreatorResultHint)
			{
				return;
			}

			this.showCreatorResultHint = false;
			ahaMoments.setInactive(Option.AhaRequiredResultCreatorPopup);

			ahaMoments.setShown(Option.AhaRequiredResultCreatorPopup);
		},
		handleResponsibleHintClose(): void
		{
			if (!this.showResponsibleResultHint)
			{
				return;
			}

			this.showResponsibleResultHint = false;
			ahaMoments.setInactive(Option.AhaRequiredResultResponsiblePopup);

			if (ahaMoments.shouldShow(Option.AhaRequiredResultResponsiblePopup))
			{
				ahaMoments.setShown(Option.AhaRequiredResultResponsiblePopup);
			}
		},
		handleOpenResultFromMessage(event: BaseEvent): void
		{
			const { taskId, resultId } = event.getData();

			if (this.taskId !== taskId || this.isListSheetShown)
			{
				return;
			}

			this.openResultSheet(resultId);
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
		},
		getRequiredResultAhaWidth(): number
		{
			return Type.isNumber(this.$refs?.resultsContainer?.offsetWidth)
				? Math.min(this.$refs.resultsContainer.offsetWidth, 530)
				: 530
			;
		},
		openEditSheet(resultId: ResultId): void
		{
			this.sheetResultId = resultId;
			this.setSheetShown(true);
		},
		openResultSheet(resultId: ResultId): void
		{
			this.sheetResultId = resultId;
			this.setListSheetShown(true);
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
		setListSheetShown(isShown: boolean): void
		{
			this.$emit('update:isListSheetShown', isShown);
		},
	},
	template: `
		<div
			class="tasks-field-results print-no-box-shadow"
			:data-task-id="taskId"
		>
			<template v-if="lastResultId">
				<div ref="resultsContainer">
					<ResultCardItem
						:resultId="lastResultId"
						@titleClick="openResultSheet"
						@add="openAddResultSheet"
						@edit="openEditSheet"
						@highlightField="highlightField"
					/>
				</div>
				<div class="tasks-field-results-more-container">
					<div
						v-if="showMore"
						class="tasks-field-results-more"
						@click="openMore"
					>
						<div class="tasks-field-results-more-text">{{ moreText }}</div>
						<BIcon
							class="tasks-field-results-title-icon --auto-left print-ignore"
							:name="Outline.CHEVRON_RIGHT_L"
							hoverable
						/>
					</div>
					<div
						class="tasks-field-results-more print-ignore"
						:class="{ '--border': showMore }"
						@click="openAddResultSheet"
					>
						<div class="tasks-field-results-more-text">{{ loc('TASKS_V2_RESULT_ADD_MORE') }}</div>
						<BIcon
							class="tasks-field-results-title-icon --auto-left"
							:name="Outline.PLUS_L"
							hoverable
						/>
					</div>
				</div>
			</template>
			<template v-else>
				<div
					class="tasks-field-results-empty-container"
					:data-task-field-id="resultsMeta.id"
					data-field-container
					ref="resultsContainer"
				>
					<div
						class="tasks-field-results-title"
						@click="handleTitleClick"
					>
						<div
							v-if="isLoading"
							class="tasks-field-results-title-main"
						>
							<BIcon :name="Animated.LOADER_WAIT"/>
							<TextMd accent>{{ loc('TASKS_V2_RESULT_TITLE_LOADING') }}</TextMd>
						</div>
						<div
							v-else
							class="tasks-field-results-title-main"
						>
							<BIcon :name="Outline.WINDOW_FLAG"/>
							<TextMd accent>{{ emptyResultTitle }}</TextMd>
						</div>
						<div class="tasks-field-results-title-actions">
							<BIcon
								v-if="showMoreIcon"
								class="tasks-field-results-title-icon"
								:name="Outline.MORE_L"
								hoverable
								ref="moreIcon"
								@click.stop="isMenuShown = true"
							/>
							<BIcon
								v-else
								class="tasks-field-results-title-icon"
								:name="Outline.PLUS_L"
								hoverable
								:data-task-results-add="resultsMeta.id"
								@click.stop="openAddResultSheet"
							/>
						</div>
					</div>
					<BMenu
						v-if="isMenuShown"
						:options="menuOptions"
						@close="isMenuShown = false"
					/>
				</div>
				<Hint
					v-if="showCreatorResultHint"
					:bindElement="$refs.resultsContainer"
					:options="{ closeIcon: true }"
					@close="handleCreatorHintClose"
				>
					{{ loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_CREATOR') }}
				</Hint>
			</template>
			<ResultRequiredAha
				v-if="showResponsibleResultHint"
				:bindElement="$refs.resultsContainer"
				:popupWidth="getRequiredResultAhaWidth()"
				:hasResults
				@close="handleResponsibleHintClose"
				@addResult="handleResponsibleHintButtonClick"
			/>
		</div>
		<ResultEditorSheet
			v-if="isSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
		<ResultListSheet
			v-if="isListSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="setListSheetShown(false)"
		/>
	`,
};

import { Loc, Type, Text } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { InteractivityChecker } from 'ui.a11y';
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
import { captureFocusTrigger, restoreFocusTrigger } from './lib/results-focus';
import { waitForStableRect, type StableRectWait } from './lib/wait-for-stable-rect';
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
		isTemplate: {},
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
		isAnySheetShown: {
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
			sheetFocusTrigger: null,
		};
	},
	computed: {
		...mapGetters({
			stateFlags: `${Model.Interface}/stateFlags`,
			templateStateFlags: `${Model.Interface}/templateStateFlags`,
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
				bindElement: this.$refs.moreIcon,
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
			const items = [];

			if (!this.isTemplate)
			{
				items.push({
					title: this.loc('TASKS_V2_RESULT_ADD'),
					icon: Outline.PLUS_L,
					onClick: this.openAddResultSheet,
					dataset: {
						id: `MenuResultAdd-${this.taskId}`,
					},
				});
			}

			if (this.requireResult)
			{
				items.push({
					title: this.loc('TASKS_V2_RESULT_NOT_REQUIRED'),
					design: 'alert',
					icon: Outline.CROSS_L,
					onClick: this.handleUnrequireResult,
					dataset: {
						id: `MenuResultNotRequire-${this.taskId}`,
					},
				});
			}
			else
			{
				items.push({
					title: this.loc('TASKS_V2_RESULT_REQUIRE'),
					icon: Outline.WINDOW_FLAG,
					isLocked: this.isLocked,
					onClick: this.handleRequireResult,
					dataset: {
						id: `MenuResultRequire-${this.taskId}`,
					},
				});
			}

			return items;
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
		this.responsibleHintRequestId = 0;
		this.responsibleHintRectWait = null;
		this.responsibleHintTimeoutId = null;
		this.ownsResponsibleAhaMoment = false;
		this.isUnmounted = false;

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
		this.isUnmounted = true;
		this.responsibleHintRequestId++;
		clearTimeout(this.responsibleHintTimeoutId);
		this.cancelResponsibleHintRectWait();
		this.releaseResponsibleAhaMoment();

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
			if (!this.isLoading && !this.isTemplate)
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
					bindElement: this.$refs.moreIcon,
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

			if (this.isEdit)
			{
				return;
			}

			if (this.isTemplate)
			{
				await this.$store.dispatch(`${Model.Interface}/updateTemplateStateFlags`, { defaultRequireResult: requireResult });

				void stateService.setTemplateFlags(this.templateStateFlags);
			}
			else
			{
				await this.$store.dispatch(`${Model.Interface}/updateStateFlags`, { defaultRequireResult: requireResult });

				void stateService.set(this.stateFlags);
			}
		},
		tryShowResultHints(): void
		{
			if (!this.requireResult || this.containsResults || this.isTemplate)
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
				this.ownsResponsibleAhaMoment = true;

				this.responsibleHintTimeoutId = setTimeout(async (): Promise<void> => {
					this.responsibleHintTimeoutId = null;

					const event = new BaseEvent({ data: { taskId: this.taskId } });

					await this.showResponsibleHint(event);

					if (!this.showResponsibleResultHint)
					{
						this.releaseResponsibleAhaMoment();
					}
				}, 2000);
			}
		},
		showCreatorHint(): void
		{
			this.showCreatorResultHint = true;
			this.highlightField();
		},
		async showResponsibleHint(event: BaseEvent): Promise<void>
		{
			const { taskId } = event.getData();

			if (this.taskId !== taskId || this.isUnmounted || this.showResponsibleResultHint)
			{
				return;
			}

			const requestId = ++this.responsibleHintRequestId;
			this.cancelResponsibleHintRectWait();

			await this.$nextTick();

			if (!this.isResponsibleHintRequestAlive(requestId))
			{
				return;
			}

			const resultsContainer = this.$refs.resultsContainer;
			if (!Type.isElementNode(resultsContainer) || !resultsContainer.isConnected)
			{
				return;
			}

			const rectWait = waitForStableRect(resultsContainer);
			this.responsibleHintRectWait = rectWait;

			const isRectStable = await rectWait.promise;
			if (this.responsibleHintRectWait === rectWait)
			{
				this.responsibleHintRectWait = null;
			}

			if (
				!isRectStable
				|| !this.isResponsibleHintRequestAlive(requestId)
				|| this.$refs.resultsContainer !== resultsContainer
			)
			{
				return;
			}

			this.showResponsibleResultHint = true;
			this.highlightField();
		},
		isResponsibleHintRequestAlive(requestId: number): boolean
		{
			return !this.isUnmounted && this.responsibleHintRequestId === requestId;
		},
		cancelResponsibleHintRectWait(): void
		{
			const rectWait: StableRectWait | null = this.responsibleHintRectWait;

			this.responsibleHintRectWait = null;
			rectWait?.cancel();
		},
		releaseResponsibleAhaMoment(): void
		{
			// Only the instance that took the global aha slot may give it back: a stuck slot
			// suppresses every other aha moment on the page.
			if (!this.ownsResponsibleAhaMoment)
			{
				return;
			}

			this.ownsResponsibleAhaMoment = false;
			ahaMoments.setInactive(Option.AhaRequiredResultResponsiblePopup);
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

			this.focusFieldTrigger();
		},
		handleResponsibleHintClose(): void
		{
			if (!this.showResponsibleResultHint)
			{
				return;
			}

			this.showResponsibleResultHint = false;
			this.ownsResponsibleAhaMoment = false;
			ahaMoments.setInactive(Option.AhaRequiredResultResponsiblePopup);

			if (ahaMoments.shouldShow(Option.AhaRequiredResultResponsiblePopup))
			{
				ahaMoments.setShown(Option.AhaRequiredResultResponsiblePopup);
			}

			this.focusFieldTrigger();
		},
		focusFieldTrigger(): void
		{
			const candidates = [...(this.$refs.resultsContainer?.querySelectorAll('button, a') ?? [])];

			candidates.find((node: HTMLElement) => InteractivityChecker.isFocusable(node))?.focus();
		},
		handleFieldMenuClose(): void
		{
			this.isMenuShown = false;
			this.$refs.moreIcon?.focus();
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
			this.sheetFocusTrigger = captureFocusTrigger();
			this.sheetResultId = resultId;
			this.setSheetShown(true);
		},
		openResultSheet(resultId: ResultId): void
		{
			this.sheetFocusTrigger = captureFocusTrigger();
			this.sheetResultId = resultId;
			this.setListSheetShown(true);
		},
		handleEditSheetClose(): void
		{
			this.setSheetShown(false);
			restoreFocusTrigger(this.sheetFocusTrigger);
			this.sheetFocusTrigger = null;
		},
		handleListSheetClose(): void
		{
			this.setListSheetShown(false);
			restoreFocusTrigger(this.sheetFocusTrigger);
			this.sheetFocusTrigger = null;
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
			data-testid="tasks-results"
			:data-task-id="taskId"
			role="group"
			:aria-label="resultsMeta.title"
			ref="resultsContainer"
		>
			<template v-if="lastResultId">
				<ResultCardItem
					:resultId="lastResultId"
					:isAnySheetShown
					@titleClick="openResultSheet"
					@add="openAddResultSheet"
					@edit="openEditSheet"
					@highlightField="highlightField"
				/>
				<div class="tasks-field-results-more-container">
					<button
						v-if="showMore"
						type="button"
						class="tasks-field-results-more"
						data-testid="tasks-results-more-btn"
						@click="openMore"
					>
						<div class="tasks-field-results-more-text">{{ moreText }}</div>
						<BIcon
							class="tasks-field-results-title-icon --auto-left print-ignore"
							:name="Outline.CHEVRON_RIGHT_L"
							hoverable
							aria-hidden="true"
						/>
					</button>
					<button
						type="button"
						class="tasks-field-results-more print-ignore"
						data-testid="tasks-results-add-more-btn"
						:class="{ '--border': showMore }"
						@click="openAddResultSheet"
					>
						<div class="tasks-field-results-more-text">{{ loc('TASKS_V2_RESULT_ADD_MORE') }}</div>
						<BIcon
							class="tasks-field-results-title-icon --auto-left"
							:name="Outline.PLUS_L"
							hoverable
							aria-hidden="true"
						/>
					</button>
				</div>
			</template>
			<template v-else>
				<div
					class="tasks-field-results-empty-container"
					:data-task-field-id="resultsMeta.id"
					data-field-container
				>
					<div
						class="tasks-field-results-title"
						:class="{ '--non-clickable': isTemplate }"
					>
						<button
							type="button"
							class="tasks-field-results-title-main"
							data-testid="tasks-results-title-btn"
							:disabled="isTemplate"
							@click="handleTitleClick"
						>
							<template v-if="isLoading">
								<BIcon :name="Animated.LOADER_WAIT" aria-hidden="true"/>
								<TextMd accent>{{ loc('TASKS_V2_RESULT_TITLE_LOADING') }}</TextMd>
							</template>
							<template v-else>
								<BIcon :name="Outline.WINDOW_FLAG" aria-hidden="true"/>
								<TextMd accent>{{ emptyResultTitle }}</TextMd>
							</template>
						</button>
						<div class="tasks-field-results-title-actions print-ignore">
							<button
								v-if="showMoreIcon"
								type="button"
								class="tasks-field-results-icon-button"
								aria-haspopup="menu"
								data-testid="tasks-results-menu-btn"
								:aria-expanded="isMenuShown ? 'true' : 'false'"
								:aria-label="loc('TASKS_V2_RESULT_FIELD_MENU_LABEL')"
								ref="moreIcon"
								@click.stop="isMenuShown = true"
							>
								<BIcon
									class="tasks-field-results-title-icon"
									:name="Outline.MORE_L"
									hoverable
									aria-hidden="true"
								/>
							</button>
							<button
								v-else
								type="button"
								class="tasks-field-results-icon-button"
								:aria-label="loc('TASKS_V2_RESULT_ADD')"
								:data-task-results-add="resultsMeta.id"
								data-testid="tasks-results-add-btn"
								@click.stop="openAddResultSheet"
							>
								<BIcon
									class="tasks-field-results-title-icon"
									:name="Outline.PLUS_L"
									hoverable
									aria-hidden="true"
								/>
							</button>
						</div>
					</div>
					<BMenu
						v-if="isMenuShown"
						:options="menuOptions"
						@close="handleFieldMenuClose"
					/>
				</div>
				<Hint
					v-if="showCreatorResultHint"
					:bindElement="$refs.resultsContainer"
					:options="{ closeIcon: true, ariaLabel: loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_CREATOR') }"
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
			@close="handleEditSheetClose"
		/>
		<ResultListSheet
			v-if="isListSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="handleListSheetClose"
		/>
	`,
};

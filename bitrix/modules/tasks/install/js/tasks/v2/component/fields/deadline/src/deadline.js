import { Runtime } from 'main.core';
import { DurationFormat } from 'main.date';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { defineAsyncComponent } from 'ui.vue3';
import { Notifier } from 'ui.notification-manager';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextMd, Text2Xs } from 'ui.system.typography.vue';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { EventName, TaskStatus, DeadlineState, Model, Analytics } from 'tasks.v2.const';
import { TaskSettingsPopup } from 'tasks.v2.component.task-settings-popup';
import { SettingsLabel } from 'tasks.v2.component.elements.settings-label';
import { Hint, tooltip } from 'tasks.v2.component.elements.hint';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { calendar } from 'tasks.v2.lib.calendar';
import { deadlineRules, DeadlineSaveStatus, type DeadlineSaveResult } from 'tasks.v2.lib.deadline-rules';
import { analytics } from 'tasks.v2.lib.analytics';
import { onboardingBanners } from 'tasks.v2.lib.onboarding-banners';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { heightTransition } from 'tasks.v2.lib.height-transition';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { DeadlineDefaultView } from './deadline-default-view';
import { DeadlineChipView } from './deadline-chip-view';
import { DeadlinePopup } from './deadline-popup/deadline-popup';
import { DeadlineChangeReasonPopup } from './deadline-change-reason-popup/deadline-change-reason-popup';
import { DeadlineAfterPopup } from './deadline-after-popup/deadline-after-popup';
import { Presets } from './deadline-after-popup/deadline-after-popup-content';
import { deadlineMeta } from './deadline-meta';
import { formatExpiredDuration } from './expired-duration-format';

import './deadline.css';

const unitDurations = DurationFormat.getUnitDurations();

// SC-003: the aha popup UI (popup + css + image asset) is loaded lazily — only a new
// user past the counter threshold ever sees it, so the heavy extension must not sit in
// the hot deadline field's rel. The promise is cached module-wide so many mounted
// deadline fields load the extension at most once. On failure the cached promise is
// dropped (and the error rethrown), so a rejected load is not memoized: a later trigger
// retries instead of re-awaiting a permanently rejected promise. Consumers swallow the
// rejection, so it never surfaces as an unhandled rejection.
let deadlineAhaExtensionPromise = null;
function loadDeadlineAha(): Promise<Object>
{
	deadlineAhaExtensionPromise ??= Runtime
		.loadExtension('tasks.v2.component.onboarding.deadline-aha')
		.catch((error) => {
			deadlineAhaExtensionPromise = null;

			throw error;
		});

	return deadlineAhaExtensionPromise;
}

// SC-001: carries the banner's async-load failure from DeadlineBanner.onError (which has
// no component instance in scope) to the Deadline field's errorCaptured() below. The
// acquireSlot() mutex guarantees at most one banner load is ever in flight, so a single
// module-scoped slot needs no per-instance keying.
let deadlineBannerLoadError = null;

// @vue/component
export const Deadline = {
	components: {
		TextMd,
		Text2Xs,
		Hint,
		HoverPill,
		BIcon,
		DeadlinePopup,
		DeadlineAfterPopup,
		DeadlineChangeReasonPopup,
		SettingsLabel,
		TaskSettingsPopup,
		DeadlineDefaultView,
		DeadlineChipView,
		// SC-001: inline onboarding banner loaded lazily so its extension (popup/css/
		// asset) stays out of the hot deadline field's rel; it renders only once the
		// v-if gate below arms it for a new user (a rare truthy -> falsy deadline change).
		// Built with a raw async component (not BitrixVue.defineAsyncComponent, whose loader
		// swallows load failures) so a failed chunk load reaches onError and frees the
		// onboarding slot the watcher grabbed — otherwise the mutex would suppress
		// SC-002/SC-003 for the whole card session.
		DeadlineBanner: defineAsyncComponent({
			loader: () => Runtime
				.loadExtension('tasks.v2.component.onboarding.deadline-banner')
				.then((exports) => exports.DeadlineBanner),
			onError(error, retry, fail): void
			{
				// The banner chunk failed to load: the async component will never mount and
				// the user can never dismiss it. Release the shared onboarding slot so the
				// mutex stops suppressing SC-002/SC-003 (best-effort, mirrors
				// onboardingBanners.setViewed()). fail() settles the wrapper (nulls Vue's
				// cached request so a later card retries) and routes the error to the
				// Deadline field's errorCaptured(), which disarms this instance's banner.
				onboardingBanners.releaseSlot('deadline');
				deadlineBannerLoadError = error;
				fail(error);
			},
		}),
	},
	directives: { hint },
	inject: {
		analytics: {},
		cardType: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isTemplate: {
			type: Boolean,
			default: false,
		},
		isAutonomous: {
			type: Boolean,
			default: false,
		},
		isHovered: {
			type: Boolean,
			default: false,
		},
		compact: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['isSettingsPopupShown'],
	setup(): Object
	{
		return {
			deadlineMeta,
			DeadlineState,
			deadlineAha: null,
		};
	},
	data(): Object
	{
		return {
			nowTs: Date.now(),
			isFieldHovered: false,
			isPopupShown: false,
			isSettingsPopupShown: false,
			isExceededHintShown: false,
			isChangeReasonPopupShown: false,
			isDeadlineDeniedHintShown: false,
			isDeadlineOnboardingShown: false,
			dateTs: null,
			externalBindElement: null,
			coordinates: null,
			saveCallback: null,
			changeReason: '',
			selectedPreset: null,
		};
	},
	computed: {
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		taskStatus(): string
		{
			return this.task.status;
		},
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		taskDeadline(): ?number
		{
			return deadlineRules.getCurrentDeadline(this.taskId);
		},
		deadlineTs(): number
		{
			return this.dateTs ?? this.taskDeadline;
		},
		expiredDuration(): number
		{
			const isCompleted = this.taskStatus === TaskStatus.Completed
				|| this.taskStatus === TaskStatus.SupposedlyCompleted
			;
			const cannotExpire = this.isTemplate
				|| !this.deadlineTs
				|| this.isFlowFilledOnAdd
				|| isCompleted
			;

			return cannotExpire ? 0 : this.nowTs - this.deadlineTs;
		},
		isExpired(): boolean
		{
			return this.expiredDuration > 0;
		},
		deadlineFormatted(): string
		{
			if (this.isFlowFilledOnAdd)
			{
				return this.loc('TASKS_V2_DEADLINE_AUTO');
			}

			if (!this.deadlineTs)
			{
				return this.loc('TASKS_V2_DEADLINE_EMPTY');
			}

			if (this.isTemplate)
			{
				return calendar.formatDuration(this.deadlineTs, this.task.matchesWorkTime);
			}

			if (this.isExpired && this.compact)
			{
				return this.loc('TASKS_V2_TASK_LIST_DEADLINE_EXPIRED', {
					'#DURATION#': formatExpiredDuration(this.expiredDuration),
				});
			}

			return calendar.formatDateTime(this.deadlineTs);
		},
		deadlineFormattedForPrint(): string
		{
			if (this.isFlowFilledOnAdd)
			{
				return this.loc('TASKS_V2_DEADLINE_AUTO');
			}

			if (!this.deadlineTs)
			{
				return this.loc('TASKS_V2_DEADLINE_EMPTY');
			}

			if (this.isTemplate)
			{
				return calendar.formatDuration(this.deadlineTs, this.task.matchesWorkTime);
			}

			return calendar.formatDateTime(this.deadlineTs);
		},
		bindElement(): HTMLElement
		{
			return this.externalBindElement ?? this.$refs.container;
		},
		isFlowFilledOnAdd(): boolean
		{
			return !this.isEdit && this.task.flowId > 0;
		},
		readonly(): boolean
		{
			if (this.isCompactReadonly)
			{
				return true;
			}

			return !deadlineRules.canChange(this.taskId) || this.isFlowFilledOnAdd;
		},
		isCompactReadonly(): string[]
		{
			return this.compact && [
				TaskStatus.Completed,
				TaskStatus.SupposedlyCompleted,
				TaskStatus.Deferred,
			].includes(this.taskStatus);
		},
		exceededChangeCount(): boolean
		{
			return deadlineRules.isChangeCountExceeded(this.taskId);
		},
		canChangeTooltip(): ?Function
		{
			if (this.isCompactReadonly)
			{
				return null;
			}

			if (
				!this.isEdit
				|| !this.readonly
				|| this.exceededChangeCount
				|| this.task.allowsChangeDeadline
				|| this.isDeadlineDeniedHintShown
			)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_DEADLINE_CAN_CHANGE_HINT'),
				popupOptions: {
					width: 280,
					offsetLeft: this.hintAngleOffset + 3,
				},
			});
		},
		hintBindElement(): HTMLElement
		{
			return this.$refs.deadlineView?.getHintBindElement?.()
				?? this.$refs.container
			;
		},
		hintAngleOffset(): number
		{
			return this.hintBindElement.offsetWidth / 2;
		},
	},
	watch: {
		async isSettingsPopupShown(value): void
		{
			if (this.isTemplate && value === false)
			{
				await this.$nextTick();

				this.recalculateDeadlineAfterFromPresets();
			}

			this.$emit('isSettingsPopupShown', value);
		},
		// SC-001: react to deadline changes.
		'task.deadlineTs': function watchTaskDeadlineTs(value: ?number, oldValue: ?number): void
		{
			// The same component is mounted in compact mode inside V2 list rows
			// (task-line); the inline banner is designed for the card layout only.
			// readonly is excluded too: the banner CTA runs handleClick() -> showPopup() only
			// when !readonly, so arming it in a readonly field would be a no-op that still holds
			// the shared onboarding slot.
			if (this.isTemplate || this.compact || this.readonly)
			{
				return;
			}

			if (!value && oldValue)
			{
				// SC-001 / ALG-01: show inline banner when deadline becomes empty.
				if (
					!this.isDeadlineOnboardingShown
					&& onboardingBanners.shouldShow('deadline')
					&& onboardingBanners.acquireSlot('deadline')
				)
				{
					this.isDeadlineOnboardingShown = true;
				}
			}
			else if (value && this.isDeadlineOnboardingShown)
			{
				// AC-004: hide banner when deadline is actually set.
				this.isDeadlineOnboardingShown = false;
				onboardingBanners.releaseSlot('deadline');
			}
		},
	},
	mounted(): void
	{
		heightTransition.animate(this.$refs.container);
		this.nowTsInterval = setInterval(() => {
			this.nowTs = Date.now();
		}, 1000);

		EventEmitter.subscribe(EventName.OpenDeadlinePicker, this.handleOpenDeadlinePickerEvent);

		// SC-003 (AC-013): show aha popup on the new-task create form only. The
		// !isTemplate && !isEdit && !readonly gate stays here — before any load/allocation —
		// so edit rows, templates and readonly states (e.g. a flow with an auto deadline)
		// never touch the aha extension (RF2-8). Readonly is excluded because the CTA runs
		// handleClick() -> showPopup() only when !readonly, so the aha popup there would be a no-op.
		if (!this.isTemplate && !this.isEdit && !this.readonly)
		{
			void this.tryShowDeadlineAha();
		}
	},
	created(): void
	{
		this.showErrorDebounce = Runtime.debounce(this.showError, 300);

		if (this.isTemplate)
		{
			this.setCurrentPreset();
		}
	},
	updated(): void
	{
		heightTransition.animate(this.$refs.container);
	},
	beforeUnmount(): void
	{
		// Guards the async tryShowDeadlineAha() continuation from creating a popup for a
		// component that has already unmounted (create form closed while loading).
		this.isUnmounted = true;

		clearInterval(this.nowTsInterval);

		EventEmitter.unsubscribe(EventName.OpenDeadlinePicker, this.handleOpenDeadlinePickerEvent);

		// SC-001: release slot if banner is still shown (e.g. component unmounted before user closed it).
		if (this.isDeadlineOnboardingShown)
		{
			onboardingBanners.releaseSlot('deadline');
			this.isDeadlineOnboardingShown = false;
		}

		// SC-003: destroy aha popup (releases slot internally if still shown).
		this.deadlineAha?.destroy();
		this.deadlineAha = null;
	},
	// SC-001: the async banner failed to load (its slot was already freed in
	// DeadlineBanner.onError). Disarm this instance's banner and stop the error here
	// (return false) so it does not reach the global handler. Identity-matched against the
	// banner load error so unrelated descendant errors keep propagating (return true).
	errorCaptured(error): boolean
	{
		const isBannerLoadError = error === deadlineBannerLoadError;

		if (isBannerLoadError)
		{
			deadlineBannerLoadError = null;
			this.isDeadlineOnboardingShown = false;
		}

		return !isBannerLoadError;
	},
	methods: {
		// AC-003: user closed the SC-001 inline banner via × button.
		onDeadlineOnboardingClose(): void
		{
			analytics.sendBannerInteraction(this.analytics, {
				event: Analytics.Event.CloseSuggestBanner,
				element: Analytics.Element.Deadline,
				cardType: this.cardType,
			});

			onboardingBanners.setViewed('deadline');
			this.isDeadlineOnboardingShown = false;
			onboardingBanners.releaseSlot('deadline');
		},
		// SC-001 CTA: user clicked the title → open deadline picker only.
		// Banner is hidden only after deadline is actually set (AC-004), not here.
		onDeadlineOnboardingAction(): void
		{
			analytics.sendBannerInteraction(this.analytics, {
				event: Analytics.Event.ClickSuggestBanner,
				element: Analytics.Element.Deadline,
				cardType: this.cardType,
			});

			this.handleClick();
		},
		// SC-003: lazy-load the aha popup extension, then show it. The lightweight
		// shouldShow() gate runs BEFORE the load so the heavy extension is fetched only
		// for the rare qualifying new user; the slot mutex and its re-check stay inside
		// DeadlineAha.tryShow() so the show sequencing (AC-016) is unchanged.
		async tryShowDeadlineAha(): Promise<void>
		{
			if (!onboardingBanners.shouldShow('deadlineAha'))
			{
				return;
			}

			// SC-003: skip the aha when the auto deadline is off (defaultDeadlineInSeconds <= 0) —
			// its text ("a deadline of #DAYS# days is set automatically") would read "0 days".
			// Gate BEFORE loadDeadlineAha() so the heavy aha extension is never fetched in that
			// case; the getter comes from the already-loaded core (Model.Interface), not the aha
			// extension, so it is safe to read here. The slot mutex and setViewed live inside
			// DeadlineAha.tryShow(), so returning here does not burn the one-shot viewed state:
			// the popup can still show once the auto deadline is enabled.
			const secondsInDay = 86400;
			const deadlineUserOption = Core.getStore().getters[`${Model.Interface}/deadlineUserOption`];
			if (!(Number(deadlineUserOption?.defaultDeadlineInSeconds) > 0))
			{
				return;
			}

			// Best-effort: if the aha popup extension fails to load, silently skip the show
			// (mirrors onboardingBanners.setViewed()); loadDeadlineAha() dropped the cached
			// rejection so a later trigger retries.
			const ahaModule = await loadDeadlineAha().catch(() => null);

			if (!ahaModule || this.isUnmounted)
			{
				return;
			}

			const { DeadlineAha } = ahaModule;

			// SC-003: feed the real default-deadline duration into the aha text
			// (#DAYS# + plural) instead of a hardcoded number.
			const defaultDeadlineDays = Math.round(
				(Number(deadlineUserOption?.defaultDeadlineInSeconds) || 0) / secondsInDay,
			);

			this.deadlineAha = new DeadlineAha(
				this.taskId,
				() => this.hintBindElement,
				// SC-003 CTA: open the default-deadline settings (not the one-off picker for this
				// task) — the popup text promises the deadline is saved for new tasks, which is
				// what TaskSettingsPopup + handleSave persist.
				() => {
					analytics.sendBannerInteraction(this.analytics, {
						event: Analytics.Event.ClickSuggestBanner,
						element: Analytics.Element.Refresh,
						cardType: this.cardType,
					});

					this.isSettingsPopupShown = true;
				},
				// SC-003: genuine close (× / outside click / drag / destroy). DeadlineAha routes
				// the CTA path away from this callback, so one interaction sends exactly one event.
				() => {
					analytics.sendBannerInteraction(this.analytics, {
						event: Analytics.Event.CloseSuggestBanner,
						element: Analytics.Element.Refresh,
						cardType: this.cardType,
					});
				},
				defaultDeadlineDays,
			);

			this.deadlineAha.tryShow();
		},
		handleOpenDeadlinePickerEvent(event: BaseEvent): void
		{
			const { taskId } = event.getData();

			if (String(taskId) === String(this.taskId))
			{
				setTimeout(() => {
					fieldHighlighter.scrollToField(deadlineMeta.id);

					if (!this.readonly)
					{
						this.showPopup();
					}
					else if (this.exceededChangeCount)
					{
						this.isExceededHintShown = true;
					}
					else
					{
						this.isDeadlineDeniedHintShown = true;
					}
				}, 200);
			}
		},
		handleClick(): void
		{
			if (!this.readonly)
			{
				this.showPopup();
			}
		},
		handleApplyPreset(presetId: ?string): void
		{
			this.selectedPreset = Object.values(Presets).find((preset) => preset.id === presetId) ?? null;
		},
		showPopup(bindElement: HTMLElement, coordinates: { x: number, y: number }): void
		{
			this.dateTs = this.deadlineTs;
			this.externalBindElement = bindElement;
			this.coordinates = coordinates;
			this.isPopupShown = true;
		},
		handleCrossClick(): void
		{
			if (deadlineRules.requiresChangeReason(this.taskId))
			{
				this.isChangeReasonPopupShown = true;

				this.saveCallback = this.clearDeadline;
			}
			else
			{
				void this.clearDeadline();
			}
		},
		handleClose(): void
		{
			// A single close is reported twice: once by the popup content and once by main.popup,
			// which fires onPopupClose when the unmounted wrapper destroys the instance. By the
			// second one the save may have already reset dateTs, and an empty dateTs reads as
			// "no deadline" for a template — that is what used to clear a just picked deadline.
			if (!this.isPopupShown)
			{
				return;
			}

			if (deadlineRules.requiresChangeReason(this.taskId) && this.dateTs && this.dateTs !== this.taskDeadline)
			{
				this.isChangeReasonPopupShown = true;

				this.saveCallback = this.saveDeadline;
			}
			else
			{
				void this.saveDeadline();
			}

			this.isPopupShown = false;

			if (this.$refs?.deadlineView)
			{
				this.$refs.deadlineView.focusDeadline();
			}
		},
		async handleChangeReasonPopupClose(): void
		{
			this.isChangeReasonPopupShown = false;

			await this.saveCallback();

			this.saveCallback = null;
		},
		async saveDeadline(): Promise<void>
		{
			const result = await deadlineRules.saveDeadline(this.taskId, {
				deadlineTs: this.dateTs,
				changeReason: this.changeReason,
				deadlineManuallySet: this.resolveDeadlineManuallySet(this.dateTs),
			});

			if (result.status === DeadlineSaveStatus.ReasonRequired)
			{
				this.dateTs = this.taskDeadline;

				return;
			}

			this.handleSaveResult(result);
		},
		async clearDeadline(): Promise<void>
		{
			const result = await deadlineRules.clearDeadline(this.taskId, {
				changeReason: this.changeReason,
				deadlineManuallySet: this.resolveDeadlineManuallySet(0),
			});

			if (result.status === DeadlineSaveStatus.ReasonRequired)
			{
				return;
			}

			this.handleSaveResult(result);

			await this.$nextTick();

			this.$refs.deadlineView?.focusDeadline();
		},
		handleSaveResult(result: DeadlineSaveResult): void
		{
			if (result.status === DeadlineSaveStatus.Failed)
			{
				this.showErrorDebounce(result.errors?.[0]);
			}

			if (result.status !== DeadlineSaveStatus.Skipped || this.dateTs === this.taskDeadline)
			{
				this.dateTs = null;
			}
		},
		// SC-003 (AC-013): record that the user set the deadline through the field while
		// creating a task. Read by the create form's addTask() and forwarded to OnTaskAdd as
		// the manual-deadline marker, so an accepted default auto deadline is not mistaken for
		// a manual one. A cleared deadline (dateTs === 0) is not manual. Only relevant during
		// creation; edit flows never read it, so the field is omitted (not just falsy) for them.
		resolveDeadlineManuallySet(dateTs: number): boolean | void
		{
			if (this.isEdit)
			{
				return undefined;
			}

			// Do not treat the calendar closing on the unchanged auto deadline as a manual set:
			// the flag is true only for a real non-empty change — dateTs > 0 and it differs from
			// the pre-update this.taskDeadline. Once manual it stays manual, so a later no-op
			// close does not demote it back to auto.
			return dateTs > 0 && (this.task.deadlineManuallySet === true || dateTs !== this.taskDeadline);
		},
		recalculateDeadlineAfterFromPresets(): void
		{
			if (!this.selectedPreset)
			{
				return;
			}

			this.dateTs = this.calculateDayDuration() * this.selectedPreset.multiplier;

			void this.saveDeadline();

			this.$refs.deadlineView?.focusDeadline();
		},
		calculateDayDuration(): number
		{
			return this.task?.matchesWorkTime ? calendar.workdayDuration : unitDurations.d;
		},
		setCurrentPreset(): void
		{
			const dayDuration = this.calculateDayDuration();

			this.selectedPreset = Object.values(Presets).find(
				(preset) => this.deadlineTs === dayDuration * preset.multiplier,
			) ?? null;
		},
		showError(error): void
		{
			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-deadline-update-error',
				text: error?.message,
			});
		},
		mouseover(): void
		{
			this.isFieldHovered = true;

			if (this.compact)
			{
				this.isExceededHintShown = true;
			}
		},
		mouseleave(): void
		{
			this.isFieldHovered = false;

			if (this.compact)
			{
				this.isExceededHintShown = false;
			}
		},
	},
	template: `
		<div
			class="tasks-field-deadline-wrapper"
			:data-task-id="taskId"
			:data-task-field-id="deadlineMeta.id"
			:data-task-field-value="task.deadlineTs"
			@mouseover="mouseover"
			@mouseleave="mouseleave"
			ref="container"
		>
			<DeadlineChipView
				v-if="compact"
				v-hint="canChangeTooltip"
				:deadlineFormatted
				:isExpired
				:readonly
				:taskStatus
				:deadlineTs
				:isFlowFilledOnAdd
				:isTemplate
				:isPopupShown
				@click="handleClick"
				ref="deadlineView"
			/>
			<DeadlineDefaultView
				v-else
				v-hint="canChangeTooltip"
				:taskId
				:deadlineFormatted
				:deadlineFormattedForPrint
				:isExpired
				:expiredDuration
				:readonly
				:isPopupShown
				:deadlineTs
				:isFlowFilledOnAdd
				:isTemplate
				:isHovered
				:isFieldHovered
				:isSettingsPopupShown
				@click="handleClick"
				@clear="handleCrossClick"
				@settingsClick="isSettingsPopupShown = true"
				@update:isExceededHintShown="isExceededHintShown = $event"
				ref="deadlineView"
			/>
		</div>
		<DeadlineBanner
			v-if="!compact && isDeadlineOnboardingShown"
			@close="onDeadlineOnboardingClose"
			@action="onDeadlineOnboardingAction"
		/>
		<DeadlinePopup
			v-if="!isTemplate && isPopupShown"
			v-model:deadlineTs="dateTs"
			:taskId
			:bindElement
			:coordinates
			@close="handleClose"
		/>
		<DeadlineAfterPopup
			v-if="isTemplate && isPopupShown"
			v-model:deadlineAfter="dateTs"
			:taskId
			:bindElement
			@update:presetId="handleApplyPreset"
			@close="handleClose"
		/>
		<DeadlineChangeReasonPopup
			v-if="isChangeReasonPopupShown"
			v-model="changeReason"
			:taskId
			:bindElement="$refs.container"
			@close="handleChangeReasonPopupClose"
		/>
		<TaskSettingsPopup v-if="isSettingsPopupShown" @close="isSettingsPopupShown = false"/>
		<Hint
			v-if="exceededChangeCount && isExceededHintShown && !isCompactReadonly"
			:bindElement="hintBindElement"
			:options="{
				maxWidth: 330,
				padding: 12,
				closeIcon: false,
				offsetLeft: hintAngleOffset,
			}"
			@close="isExceededHintShown = false"
		>
			<div class="tasks-field-deadline-exceeded-hint">
				<span>{{ loc('TASKS_V2_DEADLINE_CAN_MAX_CHANGE_HINT_1') }}</span>
				<span>{{ loc('TASKS_V2_DEADLINE_CAN_MAX_CHANGE_HINT_2') }}</span>
			</div>
		</Hint>
		<Hint
			v-if="isDeadlineDeniedHintShown"
			:bindElement="hintBindElement"
			:options="{
				width: 280,
				offsetLeft: hintAngleOffset + 3,
				closeIcon: false,
			}"
			@close="isDeadlineDeniedHintShown = false"
		>
			{{ loc('TASKS_V2_DEADLINE_CAN_CHANGE_HINT') }}
		</Hint>
	`,
};

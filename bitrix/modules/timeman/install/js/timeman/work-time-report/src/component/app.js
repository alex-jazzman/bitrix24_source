import { Loc, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PULL } from 'pull.client';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BasicEditor, TextEditorComponent } from 'ui.text-editor';
import { markRaw } from 'ui.vue3';
import { Avatar as UiAvatar } from 'ui.vue3.components.avatar';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { recordService } from 'timeman.provider.service.record-service';
import { reportService } from 'timeman.provider.service.report-service';
import { fullReportService } from 'timeman.provider.service.full-report-service';

import 'main.loader';
import 'ui.icons.b24';

import { ReportMode } from '../const/report-mode';
import { ReportType, reportTypeFromValue } from '../const/report-type';
import { GptReportCard } from './gpt-report-card';
import { MainLoader } from './main-loader';
import { WorkStatusHeader } from './work-status-header';
import './app.css';

const SAVE_DEBOUNCE_MS = 1000;

// @vue/component
export const App = {
	name: 'WorkTimeReportApp',
	components: {
		GptReportCard,
		MainLoader,
		WorkStatusHeader,
		BIcon,
		UiAvatar,
		UiButton,
		TextEditorComponent,
	},
	props: {
		mode: {
			type: String,
			required: true,
			validator: (value: string): boolean => Object.values(ReportMode).includes(value),
		},
		userId: {
			type: Number,
			default: 0,
		},
		inProgress: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			Loc,
			ButtonSize,
			AirButtonStyle,
			ReportMode,
			Outline,
			BIcon,
		};
	},
	data(): Object
	{
		const isDaily = this.mode === ReportMode.DAILY;

		return {
			loading: true,
			error: false,
			submitting: false,
			reportText: '',
			gptReport: null,
			hasGpt: true,
			reportType: isDaily ? ReportType.DAY : ReportType.WEEK,
			sourceType: 'REPORT',
			planSourceType: 'REPORT',
			resolvedRecordId: 0,
			currentReportId: 0,
			loadedDateFrom: 0,
			loadedDateTo: 0,
			fromUser: null,
			toUser: null,
			commentEditMode: !isDaily || this.inProgress,
			openedAsInProgress: this.inProgress,
			lastSeenState: window.BXTIMEMAN?.DATA?.STATE ?? null,
			isReloadingAfterStop: false,
			dailyReportReady: false,
			isScrolled: false,
			canScrollDown: false,
		};
	},
	computed: {
		isDaily(): boolean
		{
			return this.mode === ReportMode.DAILY;
		},
		isWeekly(): boolean
		{
			return this.mode === ReportMode.WEEKLY;
		},
		isPlan(): boolean
		{
			return this.mode === ReportMode.PLAN;
		},
		titleText(): string
		{
			if (this.isPlan)
			{
				return Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_PLAN_TITLE');
			}

			return Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_TITLE');
		},
		shouldShowGptCard(): boolean
		{
			return this.hasGpt && this.reportType !== ReportType.NONE && !this.openedAsInProgress && !this.isPlan;
		},
		isGptCardLoading(): boolean
		{
			return this.loading && (this.shouldShowGptCard || this.isPlan);
		},
		resolvedDateText(): string
		{
			if (this.loadedDateFrom > 0)
			{
				return this.formatDateRange(this.loadedDateFrom, this.loadedDateTo);
			}

			return '';
		},
	},
	created(): void
	{
		this.saveTimer = null;
		this.dayPlanPullUnsubscribe = null;
		this.editor = markRaw(new BasicEditor({
			placeholder: Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_PLACEHOLDER'),
			minHeight: 120,
			removePlugins: ['Toolbar', 'Image'],
			events: {
				onChange: this.handleEditorChange,
				onBlur: this.handleEditorBlur,
			},
		}));
	},
	mounted(): void
	{
		if (this.isDaily)
		{
			const loadPromise = this.loadDailyReport();
			EventEmitter.subscribe('onTimeManDataRecieved', this.handleTimemanDataChange);

			if (this.openedAsInProgress)
			{
				void loadPromise.then((): void => {
					void this.$nextTick((): void => {
						this.editor?.focus();
					});
				});
			}
		}
		else if (this.isWeekly)
		{
			void this.loadWeeklyReport();
		}
		else if (this.isPlan)
		{
			void this.loadDayPlan();
			EventEmitter.subscribe('onTimeManDataRecieved', this.handleTimemanDataChange);
			this.subscribeToDayPlanReady();
		}

		if (!Type.isUndefined(ResizeObserver) && this.$refs.content)
		{
			this.contentResizeObserver = new ResizeObserver((): void => {
				this.updateScrollFlags();
			});
			this.contentResizeObserver.observe(this.$refs.content);
		}

		this.$nextTick((): void => this.updateScrollFlags());
	},
	beforeUnmount(): void
	{
		this.cancelDebouncedSave();
		EventEmitter.unsubscribe('onTimeManDataRecieved', this.handleTimemanDataChange);
		this.unsubscribeFromDayPlanReady();
		this.contentResizeObserver?.disconnect();
		this.contentResizeObserver = null;
		this.editor?.destroy();
		this.editor = null;
	},
	methods: {
		applyReportData(data: ?Object, typeFallback: string = ReportType.WEEK): void
		{
			if (data)
			{
				if (!this.isReloadingAfterStop)
				{
					this.reportText = data.report ?? '';
				}
				this.gptReport = data.gptReport ?? null;
				this.hasGpt = data.hasGpt ?? true;
				this.loadedDateFrom = Number(data.dateFrom ?? 0);
				this.loadedDateTo = Number(data.dateTo ?? 0);
				this.fromUser = data.fromUser ?? null;
				this.toUser = Array.isArray(data.toUsers) ? (data.toUsers[0] ?? null) : null;
				this.currentReportId = Number(data.id ?? 0);
				this.sourceType = data.type ?? 'REPORT';
			}
			this.reportType = reportTypeFromValue(data?.reportType, typeFallback);

			if (!this.isReloadingAfterStop)
			{
				this.commentEditMode = !this.isDaily || this.openedAsInProgress || (this.reportText?.length ?? 0) > 0;
				this.editor?.setText(this.reportText ?? '');
			}
		},

		startCommentEdit(): void
		{
			this.commentEditMode = true;
			this.$nextTick((): void => {
				this.editor?.focus();
			});
		},

		formatDateRange(fromTs: number, toTs: number): string
		{
			if (!fromTs)
			{
				return '';
			}

			const lang = window.BX?.message?.('LANGUAGE_ID') || 'ru';
			const fmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' });
			const fromText = fmt.format(new Date(fromTs * 1000));

			if (!toTs || fromTs === toTs)
			{
				return fromText;
			}

			return `${fromText} — ${fmt.format(new Date(toTs * 1000))}`;
		},

		resolveUserId(): number
		{
			if (this.userId > 0)
			{
				return this.userId;
			}

			const fromMessage = Type.isFunction(window.BX?.message)
				? window.BX.message('USER_ID')
				: null;

			return Number(fromMessage ?? 0);
		},

		async loadDailyReport(): Promise<void>
		{
			this.loading = true;
			this.error = false;

			try
			{
				const userId = this.resolveUserId();
				if (userId <= 0)
				{
					console.warn('WorkTimeReport.loadDailyReport: cannot resolve current userId');
					this.error = true;

					return;
				}

				const record = await recordService.getCurrentRecord(userId);
				const recordId = Number(record?.id ?? 0);
				this.resolvedRecordId = recordId;

				if (recordId <= 0)
				{
					this.applyReportData(null, ReportType.DAY);

					return;
				}

				const reports = await reportService.getUserReports({ userId, recordId, withAi: true });
				this.applyReportData(reports[0] ?? null, ReportType.DAY);
			}
			catch (error)
			{
				console.error('WorkTimeReport.loadDailyReport failed:', error);
				this.error = true;
			}
			finally
			{
				this.loading = false;
				this.dailyReportReady = !this.error;
			}
		},

		async loadWeeklyReport(): Promise<void>
		{
			this.loading = true;
			this.error = false;

			try
			{
				const data = await fullReportService.getReportToSend();

				this.applyReportData(data, ReportType.WEEK);
			}
			catch (error)
			{
				console.error('WorkTimeReport.loadWeeklyReport failed:', error);
				this.error = true;
			}
			finally
			{
				this.loading = false;
			}
		},

		async loadDayPlan(): Promise<void>
		{
			this.loading = true;
			this.error = false;

			try
			{
				const userId = this.resolveUserId();
				if (userId <= 0)
				{
					console.warn('WorkTimeReport.loadDayPlan: cannot resolve current userId');
					this.gptReport = null;

					return;
				}

				const record = await recordService.getCurrentRecord(userId);
				const recordId = Number(record?.id ?? 0);
				this.resolvedRecordId = recordId;

				if (recordId <= 0)
				{
					this.gptReport = null;

					return;
				}

				const plan = await reportService.getDayPlan(recordId);
				this.applyDayPlan(plan);
			}
			catch (error)
			{
				console.error('WorkTimeReport.loadDayPlan failed:', error);
				this.error = true;
			}
			finally
			{
				this.loading = false;
			}
		},

		applyDayPlan(plan: ?Object): void
		{
			if (plan)
			{
				this.gptReport = plan.report;
				this.planSourceType = plan.sourceType ?? this.planSourceType;
			}
			else
			{
				this.gptReport = null;
			}
		},

		subscribeToDayPlanReady(): void
		{
			if (this.dayPlanPullUnsubscribe)
			{
				return;
			}

			this.dayPlanPullUnsubscribe = PULL.subscribe({
				moduleId: 'timeman',
				command: 'day_plan_ready',
				callback: (params: Object) => {
					void this.handleDayPlanReady(params);
				},
			});
		},

		unsubscribeFromDayPlanReady(): void
		{
			if (Type.isFunction(this.dayPlanPullUnsubscribe))
			{
				this.dayPlanPullUnsubscribe();
			}

			this.dayPlanPullUnsubscribe = null;
		},

		async handleDayPlanReady(params: ?Object): Promise<void>
		{
			const recordId = Number(params?.recordId ?? 0);
			if (recordId <= 0)
			{
				return;
			}

			if (this.resolvedRecordId <= 0)
			{
				await this.loadDayPlan();

				return;
			}

			if (recordId !== this.resolvedRecordId)
			{
				return;
			}

			try
			{
				const plan = await reportService.getDayPlan(this.resolvedRecordId);
				this.applyDayPlan(plan);
			}
			catch (error)
			{
				console.error('WorkTimeReport.handleDayPlanReady failed:', error);
			}
		},

		handleEditorChange(payload: ?Object): void
		{
			if (payload?.isInitialChange)
			{
				return;
			}

			if (!this.isDaily)
			{
				return;
			}

			this.cancelDebouncedSave();
			this.saveTimer = setTimeout(() => {
				void this.saveDailyDraft();
			}, SAVE_DEBOUNCE_MS);
		},

		handleEditorBlur(): void
		{
			if (!this.isDaily)
			{
				return;
			}

			this.cancelDebouncedSave();
			void this.saveDailyDraft();
		},

		cancelDebouncedSave(): void
		{
			if (this.saveTimer)
			{
				clearTimeout(this.saveTimer);
				this.saveTimer = null;
			}
		},

		async saveDailyDraft(): Promise<void>
		{
			if (!this.dailyReportReady)
			{
				return;
			}

			const recordId = Number(this.resolvedRecordId);
			if (!recordId || recordId <= 0)
			{
				return;
			}

			const text = this.editor?.getText() ?? this.reportText ?? '';

			try
			{
				await reportService.saveDailyReport(recordId, text);
			}
			catch (error)
			{
				console.error('WorkTimeReport.saveDailyDraft failed:', error);
			}
		},

		handleClose(): void
		{
			this.$close?.();
		},

		handleContentScroll(): void
		{
			this.updateScrollFlags();
		},

		updateScrollFlags(): void
		{
			const el = this.$refs.content;
			if (!el)
			{
				return;
			}

			this.isScrolled = el.scrollTop > 0;
			this.canScrollDown = (el.scrollTop + el.clientHeight) < (el.scrollHeight - 1);
		},

		handleTimemanDataChange(): void
		{
			const state = window.BXTIMEMAN?.DATA?.STATE;
			if (!state || this.isReloadingAfterStop)
			{
				return;
			}

			const wasClosed = this.lastSeenState === 'CLOSED';
			const isNowClosed = state === 'CLOSED';
			this.lastSeenState = state;

			if (this.isPlan)
			{
				if (isNowClosed)
				{
					this.$close?.();
				}

				return;
			}

			if (this.openedAsInProgress && !wasClosed && isNowClosed)
			{
				this.openedAsInProgress = false;
				this.reportText = this.editor?.getText() ?? this.reportText;
				this.isReloadingAfterStop = true;
				this.cancelDebouncedSave();
				void (async (): Promise<void> => {
					try
					{
						await this.saveDailyDraft();
						await this.loadDailyReport();
					}
					finally
					{
						this.isReloadingAfterStop = false;
					}
				})();

				return;
			}

			if (!this.openedAsInProgress && !isNowClosed)
			{
				this.$close?.();
			}
		},

		postponeAndClose(): void
		{
			this.$close?.();
		},

		async submitWeekly(): Promise<void>
		{
			if (this.submitting)
			{
				return;
			}

			const userId = this.resolveUserId();
			if (userId <= 0)
			{
				console.error('WorkTimeReport.submitWeekly: cannot resolve userId');

				return;
			}

			this.submitting = true;

			try
			{
				const reportText = this.editor?.getText() ?? this.reportText ?? '';

				if (this.currentReportId > 0)
				{
					await fullReportService.submit(this.currentReportId, reportText);
				}
				else
				{
					const created = await fullReportService.add({ userId, reportText });
					const newReportId = Number(created?.id ?? 0);
					if (newReportId <= 0)
					{
						throw new Error('WorkTimeReport.submitWeekly: created report has no id');
					}
					await fullReportService.send(newReportId);
				}

				if (Type.isFunction(window.BX?.onCustomEvent))
				{
					window.BX.onCustomEvent(window, 'OnWorkReportSend', []);
				}

				this.$close?.();
			}
			catch (error)
			{
				console.error('WorkTimeReport.submitWeekly failed:', error);
				this.error = true;
			}
			finally
			{
				this.submitting = false;
			}
		},
	},
	template: `
		<div class="tm-work-time-report">
			<div class="tm-work-time-report__title-row">
				<UiButton
					v-if="isDaily || isPlan"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.CHEVRON_LEFT_L"
					:dataset="{ testid: 'timeman-work-time-report-back-btn' }"
					@click="handleClose"
				>
				</UiButton>
				<div class="tm-work-time-report__title-block">
					<div class="tm-work-time-report__title">
						{{ titleText }}
						<span v-if="resolvedDateText" class="tm-work-time-report__date">{{ resolvedDateText }}</span>
					</div>
				</div>
			</div>
			<div v-if="isWeekly && (fromUser || toUser)" class="tm-work-time-report__people">
				<div v-if="fromUser" class="tm-work-time-report__people-row">
					<UiAvatar
						v-if="fromUser.photo"
						class="tm-work-time-report__people-avatar"
						:options="{ size: 24, userpicPath: fromUser.photo }"
					/>
					<span
						v-else
						class="ui-icon ui-icon-common-user tm-work-time-report__people-avatar"
					><i></i></span>
					<span class="tm-work-time-report__people-name">{{ fromUser.name }}</span>
				</div>
				<BIcon
					:name="Outline.CHEVRON_RIGHT_S"
				/>
				<div v-if="toUser" class="tm-work-time-report__people-row">
					<UiAvatar
						v-if="toUser.photo"
						class="tm-work-time-report__people-avatar"
						:options="{ size: 24, userpicPath: toUser.photo }"
					/>
					<span
						v-else
						class="ui-icon ui-icon-common-user tm-work-time-report__people-avatar"
					><i></i></span>
					<span class="tm-work-time-report__people-name">{{ toUser.name }}</span>
				</div>
			</div>
			<WorkStatusHeader v-if="isDaily || isPlan" />
			<div
				ref="content"
				class="tm-work-time-report__content"
				:class="{ '--scrolled': isScrolled, '--has-more': canScrollDown }"
				@scroll.passive="handleContentScroll"
			>
				<div
					v-if="isReloadingAfterStop || isGptCardLoading"
					class="tm-work-time-report__gpt-card-loader"
				>
					<MainLoader />
				</div>
				<GptReportCard
					v-else-if="shouldShowGptCard"
					:report="gptReport"
					:reportType="reportType"
					:sourceType="sourceType"
				/>
				<GptReportCard
					v-if="isPlan && !loading"
					:isPlan="true"
					:report="gptReport"
					:sourceType="planSourceType"
				/>
				<template v-if="!isPlan && (openedAsInProgress || isReloadingAfterStop || (!loading && !error))">
					<div
						v-if="isDaily && !commentEditMode && !openedAsInProgress"
						class="tm-work-time-report__button-container"
					>
						<UiButton
							class="tm-work-time-report__button"
							:size="ButtonSize.MEDIUM"
							:style="AirButtonStyle.OUTLINE_ACCENT_2"
							:text="Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_WRITE_COMMENT')"
							@click="startCommentEdit"
						/>
					</div>
					<template v-else>
						<div
							v-if="openedAsInProgress"
							class="tm-work-time-report__editor-title"
						>
							{{ Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_DONE_TODAY_TITLE') }}
						</div>
						<div class="tm-work-time-report__editor">
							<div
								v-if="loading && openedAsInProgress"
								class="tm-work-time-report__editor-loader"
							>
								<MainLoader />
							</div>
							<TextEditorComponent :editorInstance="editor" />
						</div>
					</template>
				</template>
			</div>
			<div v-if="isWeekly" class="tm-work-time-report__footer">
				<UiButton
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE"
					:text="Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_BUTTON_POSTPONE')"
					:disabled="submitting"
					@click="postponeAndClose"
				/>
				<UiButton
					:size="ButtonSize.MEDIUM"
					:text="Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_BUTTON_SUBMIT')"
					:loading="submitting"
					:disabled="loading || error"
					@click="submitWeekly"
				/>
			</div>
		</div>
	`,
};

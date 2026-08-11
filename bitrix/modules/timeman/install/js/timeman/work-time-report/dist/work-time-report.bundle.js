/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_vue3, timeman_provider_service_fullReportService, main_core_events, pull_client, ui_iconSet_api_vue, ui_textEditor, ui_vue3_components_avatar, ui_vue3_components_button, timeman_provider_service_recordService, timeman_provider_service_reportService, main_loader, ui_icons_b24, ui_bbcode_formatter_htmlFormatter, main_date, ui_bbcode_parser) {
	'use strict';

	const closeOnSliderOpen = handler => {
		main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpenStart', handler);
		return () => {
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onOpenStart', handler);
		};
	};

	const ReportMode = Object.freeze({
		DAILY: 'daily',
		WEEKLY: 'weekly',
		PLAN: 'plan'
	});

	const ReportType = Object.freeze({
		DAY: 'day',
		WEEK: 'week',
		MONTH: 'month',
		NONE: 'none'
	});
	const reportTypeFromValue = (value, fallback = ReportType.WEEK) => {
		const lowered = String(value ?? '').toLowerCase();
		const known = Object.values(ReportType);
		return known.includes(lowered) ? lowered : fallback;
	};

	const settings$2 = main_core.Extension.getSettings('timeman.work-time-report');
	const AI_TITLE_LOC_KEY_BY_TYPE = {
		[ReportType.DAY]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_DAY',
		[ReportType.WEEK]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_WEEK',
		[ReportType.MONTH]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_MONTH'
	};
	const AUTO_TITLE_LOC_KEY_BY_TYPE = {
		[ReportType.DAY]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_DAY',
		[ReportType.WEEK]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_WEEK',
		[ReportType.MONTH]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_MONTH'
	};
	const AI_TITLE_PENDING_LOC_KEY_BY_TYPE = {
		[ReportType.DAY]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_DAY_PENDING',
		[ReportType.WEEK]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_WEEK_PENDING',
		[ReportType.MONTH]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_MONTH_PENDING'
	};
	const AUTO_TITLE_PENDING_LOC_KEY_BY_TYPE = {
		[ReportType.DAY]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_DAY_PENDING',
		[ReportType.WEEK]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_WEEK_PENDING',
		[ReportType.MONTH]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_MONTH_PENDING'
	};

	// @vue/component
	const GptReportCard = {
		name: 'GptReportCard',
		components: {
			HtmlFormatterComponent: ui_bbcode_formatter_htmlFormatter.HtmlFormatterComponent
		},
		props: {
			report: {
				type: String,
				default: null
			},
			reportType: {
				type: String,
				default: ReportType.WEEK
			},
			sourceType: {
				type: String,
				default: 'REPORT'
			},
			isPlan: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			isAiReport() {
				if (this.sourceType === 'AI_REPORT') {
					return true;
				}
				if (this.sourceType === 'ROBOT_REPORT') {
					return false;
				}
				return Boolean(settings$2.hasAiReportAccess);
			},
			isInProgress() {
				return !this.report?.length;
			},
			rootClass() {
				return {
					'tm-work-time-report-gpt-card--auto': !this.isAiReport
				};
			},
			titleText() {
				if (this.isPlan) {
					let planKey = '';
					if (this.isInProgress) {
						planKey = this.isAiReport ? 'TIMEMAN_WORK_TIME_REPORT_PLAN_GPT_TITLE_PENDING' : 'TIMEMAN_WORK_TIME_REPORT_PLAN_AUTO_TITLE_PENDING';
					} else {
						planKey = this.isAiReport ? 'TIMEMAN_WORK_TIME_REPORT_PLAN_GPT_TITLE' : 'TIMEMAN_WORK_TIME_REPORT_PLAN_AUTO_TITLE';
					}
					return main_core.Loc.getMessage(planKey, {
						'#COPILOT_NAME#': settings$2.copilotName
					});
				}
				let map;
				if (this.isInProgress) {
					map = this.isAiReport ? AI_TITLE_PENDING_LOC_KEY_BY_TYPE : AUTO_TITLE_PENDING_LOC_KEY_BY_TYPE;
				} else {
					map = this.isAiReport ? AI_TITLE_LOC_KEY_BY_TYPE : AUTO_TITLE_LOC_KEY_BY_TYPE;
				}
				const key = map[this.reportType] ?? map[ReportType.WEEK];
				return main_core.Loc.getMessage(key, {
					'#COPILOT_NAME#': settings$2.copilotName
				});
			},
			inProgressText() {
				let key = '';
				if (this.isPlan) {
					key = this.isAiReport ? 'TIMEMAN_WORK_TIME_REPORT_PLAN_GPT_IN_PROGRESS_TEXT' : 'TIMEMAN_WORK_TIME_REPORT_PLAN_AUTO_IN_PROGRESS_TEXT';
				} else {
					key = this.isAiReport ? 'TIMEMAN_WORK_TIME_REPORT_GPT_IN_PROGRESS_TEXT_MSGVER_1' : 'TIMEMAN_WORK_TIME_REPORT_AUTO_IN_PROGRESS_TEXT_MSGVER_1';
				}
				return main_core.Loc.getMessage(key, {
					'#COPILOT_NAME#': settings$2.copilotName
				});
			}
		},
		template: `
		<div class="tm-work-time-report-gpt-card" :class="rootClass">
			<div class="tm-work-time-report-gpt-card__title">
				<span class="tm-work-time-report-gpt-card__title-icon"
							:class="{'--ai-report': isAiReport}"
				></span>
				<span class="tm-work-time-report-gpt-card__title-text"
						:class="{'--ai-report': isAiReport}"
					>
					{{ titleText }}
				</span>
			</div>
			<div v-if="isInProgress" class="tm-work-time-report-gpt-card__in-progress">
				<div class="tm-work-time-report-gpt-card__in-progress-text" v-html="inProgressText"></div>
			</div>
			<div v-else class="tm-work-time-report-gpt-card__body">
				<HtmlFormatterComponent
					v-if="report"
					:bbcode="report"
				/>
				<template v-else>{{ report }}</template>
			</div>
		</div>
	`
	};

	// @vue/component
	const MainLoader = {
		name: 'MainLoader',
		props: {
			size: {
				type: Number,
				default: 48
			}
		},
		computed: {
			wrapperStyle() {
				return {
					width: `${this.size}px`,
					height: `${this.size}px`
				};
			}
		},
		template: `
		<div
			class="main-ui-loader main-ui-loader-inline main-ui-show"
			:style="wrapperStyle"
		>
			<svg class="main-ui-loader-svg" viewBox="25 25 50 50">
				<circle class="main-ui-loader-svg-circle" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"></circle>
			</svg>
		</div>
	`
	};

	// @vue/component
	const WorkStatusHeader = {
		name: 'WorkStatusHeader',
		mounted() {
			this.isUnmounted = false;

			// Dynamic load avoids circular dep — work-status-control-panel already
			// depends on work-time-report at config.php level.
			window.BX?.Runtime?.loadExtension('timeman.work-status-control-panel').then(({
				WorkStatusControlPanel
			}) => {
				const host = this.$refs.host;
				if (!WorkStatusControlPanel || !host || this.isUnmounted || !host.isConnected) {
					return;
				}
				try {
					const node = new WorkStatusControlPanel().renderWorkStatusControlPanel({
						hideOpenPanelButton: true,
						hideOpener: true
					});
					if (node && !this.isUnmounted && host.isConnected) {
						host.appendChild(node);
					}
				} catch (error) {
					console.error('WorkStatusHeader: failed to render WorkStatusControlPanel', error);
				}
			}).catch(error => {
				console.error('WorkStatusHeader: failed to load extension', error);
			});
		},
		beforeUnmount() {
			this.isUnmounted = true;
		},
		template: `<div ref="host" class="tm-work-time-report-header"></div>`
	};

	const SAVE_DEBOUNCE_MS = 1000;

	// @vue/component
	const App = {
		name: 'WorkTimeReportApp',
		components: {
			GptReportCard,
			MainLoader,
			WorkStatusHeader,
			BIcon: ui_iconSet_api_vue.BIcon,
			UiAvatar: ui_vue3_components_avatar.Avatar,
			UiButton: ui_vue3_components_button.Button,
			TextEditorComponent: ui_textEditor.TextEditorComponent
		},
		props: {
			mode: {
				type: String,
				required: true,
				validator: value => Object.values(ReportMode).includes(value)
			},
			userId: {
				type: Number,
				default: 0
			},
			inProgress: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				Loc: main_core.Loc,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ReportMode,
				Outline: ui_iconSet_api_vue.Outline,
				BIcon: ui_iconSet_api_vue.BIcon
			};
		},
		data() {
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
				canScrollDown: false
			};
		},
		computed: {
			isDaily() {
				return this.mode === ReportMode.DAILY;
			},
			isWeekly() {
				return this.mode === ReportMode.WEEKLY;
			},
			isPlan() {
				return this.mode === ReportMode.PLAN;
			},
			titleText() {
				if (this.isPlan) {
					return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_PLAN_TITLE');
				}
				return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_TITLE');
			},
			shouldShowGptCard() {
				return this.hasGpt && this.reportType !== ReportType.NONE && !this.openedAsInProgress && !this.isPlan;
			},
			isGptCardLoading() {
				return this.loading && (this.shouldShowGptCard || this.isPlan);
			},
			resolvedDateText() {
				if (this.loadedDateFrom > 0) {
					return this.formatDateRange(this.loadedDateFrom, this.loadedDateTo);
				}
				return '';
			}
		},
		created() {
			this.saveTimer = null;
			this.dayPlanPullUnsubscribe = null;
			this.editor = ui_vue3.markRaw(new ui_textEditor.BasicEditor({
				placeholder: main_core.Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_PLACEHOLDER'),
				minHeight: 120,
				removePlugins: ['Toolbar', 'Image'],
				events: {
					onChange: this.handleEditorChange,
					onBlur: this.handleEditorBlur
				}
			}));
		},
		mounted() {
			if (this.isDaily) {
				const loadPromise = this.loadDailyReport();
				main_core_events.EventEmitter.subscribe('onTimeManDataRecieved', this.handleTimemanDataChange);
				if (this.openedAsInProgress) {
					void loadPromise.then(() => {
						void this.$nextTick(() => {
							this.editor?.focus();
						});
					});
				}
			} else if (this.isWeekly) {
				void this.loadWeeklyReport();
			} else if (this.isPlan) {
				void this.loadDayPlan();
				main_core_events.EventEmitter.subscribe('onTimeManDataRecieved', this.handleTimemanDataChange);
				this.subscribeToDayPlanReady();
			}
			if (!main_core.Type.isUndefined(ResizeObserver) && this.$refs.content) {
				this.contentResizeObserver = new ResizeObserver(() => {
					this.updateScrollFlags();
				});
				this.contentResizeObserver.observe(this.$refs.content);
			}
			this.$nextTick(() => this.updateScrollFlags());
		},
		beforeUnmount() {
			this.cancelDebouncedSave();
			main_core_events.EventEmitter.unsubscribe('onTimeManDataRecieved', this.handleTimemanDataChange);
			this.unsubscribeFromDayPlanReady();
			this.contentResizeObserver?.disconnect();
			this.contentResizeObserver = null;
			this.editor?.destroy();
			this.editor = null;
		},
		methods: {
			applyReportData(data, typeFallback = ReportType.WEEK) {
				if (data) {
					if (!this.isReloadingAfterStop) {
						this.reportText = data.report ?? '';
					}
					this.gptReport = data.gptReport ?? null;
					this.hasGpt = data.hasGpt ?? true;
					this.loadedDateFrom = Number(data.dateFrom ?? 0);
					this.loadedDateTo = Number(data.dateTo ?? 0);
					this.fromUser = data.fromUser ?? null;
					this.toUser = Array.isArray(data.toUsers) ? data.toUsers[0] ?? null : null;
					this.currentReportId = Number(data.id ?? 0);
					this.sourceType = data.type ?? 'REPORT';
				}
				this.reportType = reportTypeFromValue(data?.reportType, typeFallback);
				if (!this.isReloadingAfterStop) {
					this.commentEditMode = !this.isDaily || this.openedAsInProgress || (this.reportText?.length ?? 0) > 0;
					this.editor?.setText(this.reportText ?? '');
				}
			},
			startCommentEdit() {
				this.commentEditMode = true;
				this.$nextTick(() => {
					this.editor?.focus();
				});
			},
			formatDateRange(fromTs, toTs) {
				if (!fromTs) {
					return '';
				}
				const lang = window.BX?.message?.('LANGUAGE_ID') || 'ru';
				const fmt = new Intl.DateTimeFormat(lang, {
					day: 'numeric',
					month: 'long'
				});
				const fromText = fmt.format(new Date(fromTs * 1000));
				if (!toTs || fromTs === toTs) {
					return fromText;
				}
				return `${fromText} — ${fmt.format(new Date(toTs * 1000))}`;
			},
			resolveUserId() {
				if (this.userId > 0) {
					return this.userId;
				}
				const fromMessage = main_core.Type.isFunction(window.BX?.message) ? window.BX.message('USER_ID') : null;
				return Number(fromMessage ?? 0);
			},
			async loadDailyReport() {
				this.loading = true;
				this.error = false;
				try {
					const userId = this.resolveUserId();
					if (userId <= 0) {
						console.warn('WorkTimeReport.loadDailyReport: cannot resolve current userId');
						this.error = true;
						return;
					}
					const record = await timeman_provider_service_recordService.recordService.getCurrentRecord(userId);
					const recordId = Number(record?.id ?? 0);
					this.resolvedRecordId = recordId;
					if (recordId <= 0) {
						this.applyReportData(null, ReportType.DAY);
						return;
					}
					const reports = await timeman_provider_service_reportService.reportService.getUserReports({
						userId,
						recordId,
						withAi: true
					});
					this.applyReportData(reports[0] ?? null, ReportType.DAY);
				} catch (error) {
					console.error('WorkTimeReport.loadDailyReport failed:', error);
					this.error = true;
				} finally {
					this.loading = false;
					this.dailyReportReady = !this.error;
				}
			},
			async loadWeeklyReport() {
				this.loading = true;
				this.error = false;
				try {
					const data = await timeman_provider_service_fullReportService.fullReportService.getReportToSend();
					this.applyReportData(data, ReportType.WEEK);
				} catch (error) {
					console.error('WorkTimeReport.loadWeeklyReport failed:', error);
					this.error = true;
				} finally {
					this.loading = false;
				}
			},
			async loadDayPlan() {
				this.loading = true;
				this.error = false;
				try {
					const userId = this.resolveUserId();
					if (userId <= 0) {
						console.warn('WorkTimeReport.loadDayPlan: cannot resolve current userId');
						this.gptReport = null;
						return;
					}
					const record = await timeman_provider_service_recordService.recordService.getCurrentRecord(userId);
					const recordId = Number(record?.id ?? 0);
					this.resolvedRecordId = recordId;
					if (recordId <= 0) {
						this.gptReport = null;
						return;
					}
					const plan = await timeman_provider_service_reportService.reportService.getDayPlan(recordId);
					this.applyDayPlan(plan);
				} catch (error) {
					console.error('WorkTimeReport.loadDayPlan failed:', error);
					this.error = true;
				} finally {
					this.loading = false;
				}
			},
			applyDayPlan(plan) {
				if (plan) {
					this.gptReport = plan.report;
					this.planSourceType = plan.sourceType ?? this.planSourceType;
				} else {
					this.gptReport = null;
				}
			},
			subscribeToDayPlanReady() {
				if (this.dayPlanPullUnsubscribe) {
					return;
				}
				this.dayPlanPullUnsubscribe = pull_client.PULL.subscribe({
					moduleId: 'timeman',
					command: 'day_plan_ready',
					callback: params => {
						void this.handleDayPlanReady(params);
					}
				});
			},
			unsubscribeFromDayPlanReady() {
				if (main_core.Type.isFunction(this.dayPlanPullUnsubscribe)) {
					this.dayPlanPullUnsubscribe();
				}
				this.dayPlanPullUnsubscribe = null;
			},
			async handleDayPlanReady(params) {
				const recordId = Number(params?.recordId ?? 0);
				if (recordId <= 0) {
					return;
				}
				if (this.resolvedRecordId <= 0) {
					await this.loadDayPlan();
					return;
				}
				if (recordId !== this.resolvedRecordId) {
					return;
				}
				try {
					const plan = await timeman_provider_service_reportService.reportService.getDayPlan(this.resolvedRecordId);
					this.applyDayPlan(plan);
				} catch (error) {
					console.error('WorkTimeReport.handleDayPlanReady failed:', error);
				}
			},
			handleEditorChange(payload) {
				if (payload?.isInitialChange) {
					return;
				}
				if (!this.isDaily) {
					return;
				}
				this.cancelDebouncedSave();
				this.saveTimer = setTimeout(() => {
					void this.saveDailyDraft();
				}, SAVE_DEBOUNCE_MS);
			},
			handleEditorBlur() {
				if (!this.isDaily) {
					return;
				}
				this.cancelDebouncedSave();
				void this.saveDailyDraft();
			},
			cancelDebouncedSave() {
				if (this.saveTimer) {
					clearTimeout(this.saveTimer);
					this.saveTimer = null;
				}
			},
			async saveDailyDraft() {
				if (!this.dailyReportReady) {
					return;
				}
				const recordId = Number(this.resolvedRecordId);
				if (!recordId || recordId <= 0) {
					return;
				}
				const text = this.editor?.getText() ?? this.reportText ?? '';
				try {
					await timeman_provider_service_reportService.reportService.saveDailyReport(recordId, text);
				} catch (error) {
					console.error('WorkTimeReport.saveDailyDraft failed:', error);
				}
			},
			handleClose() {
				this.$close?.();
			},
			handleContentScroll() {
				this.updateScrollFlags();
			},
			updateScrollFlags() {
				const el = this.$refs.content;
				if (!el) {
					return;
				}
				this.isScrolled = el.scrollTop > 0;
				this.canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
			},
			handleTimemanDataChange() {
				const state = window.BXTIMEMAN?.DATA?.STATE;
				if (!state || this.isReloadingAfterStop) {
					return;
				}
				const wasClosed = this.lastSeenState === 'CLOSED';
				const isNowClosed = state === 'CLOSED';
				this.lastSeenState = state;
				if (this.isPlan) {
					if (isNowClosed) {
						this.$close?.();
					}
					return;
				}
				if (this.openedAsInProgress && !wasClosed && isNowClosed) {
					this.openedAsInProgress = false;
					this.reportText = this.editor?.getText() ?? this.reportText;
					this.isReloadingAfterStop = true;
					this.cancelDebouncedSave();
					void (async () => {
						try {
							await this.saveDailyDraft();
							await this.loadDailyReport();
						} finally {
							this.isReloadingAfterStop = false;
						}
					})();
					return;
				}
				if (!this.openedAsInProgress && !isNowClosed) {
					this.$close?.();
				}
			},
			postponeAndClose() {
				this.$close?.();
			},
			async submitWeekly() {
				if (this.submitting) {
					return;
				}
				const userId = this.resolveUserId();
				if (userId <= 0) {
					console.error('WorkTimeReport.submitWeekly: cannot resolve userId');
					return;
				}
				this.submitting = true;
				try {
					const reportText = this.editor?.getText() ?? this.reportText ?? '';
					if (this.currentReportId > 0) {
						await timeman_provider_service_fullReportService.fullReportService.submit(this.currentReportId, reportText);
					} else {
						const created = await timeman_provider_service_fullReportService.fullReportService.add({
							userId,
							reportText
						});
						const newReportId = Number(created?.id ?? 0);
						if (newReportId <= 0) {
							throw new Error('WorkTimeReport.submitWeekly: created report has no id');
						}
						await timeman_provider_service_fullReportService.fullReportService.send(newReportId);
					}
					if (main_core.Type.isFunction(window.BX?.onCustomEvent)) {
						window.BX.onCustomEvent(window, 'OnWorkReportSend', []);
					}
					this.$close?.();
				} catch (error) {
					console.error('WorkTimeReport.submitWeekly failed:', error);
					this.error = true;
				} finally {
					this.submitting = false;
				}
			}
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
	`
	};

	let locked = false;
	const tryAcquirePopupLock = () => {
		if (locked) {
			return false;
		}
		locked = true;
		return true;
	};
	const releasePopupLock = () => {
		locked = false;
	};

	const settings$1 = main_core.Extension.getSettings('timeman.work-time-report');
	const POPUP_ID_PREFIX = 'timeman-work-time-report';
	const DEFAULT_WIDTH = 600;
	const WEEKLY_WIDTH = 450;
	const MAX_HEIGHT = 850;
	const MAX_HEIGHT_RESERVE = 15;
	let popupCounter = 0;
	class WorkTimeReport {
		#popup = null;
		#app = null;
		#onClose = null;
		#resizeObserver = null;
		#submitted = false;
		#onSentHandler = null;
		#unsubscribeSlider = null;
		open(mode, params = {}) {
			if (!Object.values(ReportMode).includes(mode)) {
				console.error(`WorkTimeReport: unknown mode "${mode}"`);
				return;
			}
			if (this.#popup) {
				this.#popup.show();
				return;
			}
			if (!tryAcquirePopupLock()) {
				params.onClose?.();
				return;
			}
			const userId = Number(params.userId ?? settings$1.currentUserId ?? 0);
			this.#onClose = params.onClose ?? null;
			this.#submitted = false;
			if (main_core.Type.isFunction(window.BX?.addCustomEvent)) {
				this.#onSentHandler = () => {
					this.#submitted = true;
				};
				window.BX.addCustomEvent('OnWorkReportSend', this.#onSentHandler);
			}
			const bindElement = params.bindElement ?? null;
			const isWeekly = mode === ReportMode.WEEKLY;
			const defaultWidth = isWeekly ? WEEKLY_WIDTH : DEFAULT_WIDTH;
			const width = Number(params.width) > 0 ? Number(params.width) : defaultWidth;
			const maxHeight = Math.max(200, (window.innerHeight ?? MAX_HEIGHT) - MAX_HEIGHT_RESERVE);
			popupCounter += 1;
			const popupOptions = {
				id: `${POPUP_ID_PREFIX}-${popupCounter}`,
				bindElement,
				content: '',
				width,
				minHeight: 100,
				maxHeight,
				closeByEsc: true,
				closeIcon: params.closeIcon ?? true,
				autoHide: params.autoHide ?? false,
				angle: false,
				padding: 20,
				className: 'timeman-work-time-report-popup',
				disableScroll: isWeekly,
				events: {
					onPopupAfterClose: () => {
						if (mode === ReportMode.WEEKLY && !this.#submitted) {
							timeman_provider_service_fullReportService.fullReportService.postpone().catch(error => {
								console.error('WorkTimeReport.postpone failed:', error);
							});
						}
						this.#destroy();
					}
				}
			};
			if (isWeekly) {
				popupOptions.overlay = true;
			}
			if (main_core.Type.isNumber(params.offsetTop)) {
				popupOptions.offsetTop = params.offsetTop;
			}
			if (main_core.Type.isNumber(params.offsetLeft)) {
				popupOptions.offsetLeft = params.offsetLeft;
			}
			if (main_core.Type.isBoolean(params.fixed)) {
				popupOptions.fixed = params.fixed;
			}
			this.#popup = new main_popup.Popup(popupOptions);
			this.#popup.show();
			this.#unsubscribeSlider = closeOnSliderOpen(() => {
				this.#popup?.close();
			});
			const container = this.#popup.getContentContainer();
			const app = ui_vue3.BitrixVue.createApp(App, {
				mode,
				userId,
				inProgress: Boolean(params.inProgress)
			});
			const popup = this.#popup;
			app.config.globalProperties.$close = () => {
				popup?.close();
			};
			app.mount(container);
			this.#app = app;
			if (!main_core.Type.isUndefined(ResizeObserver)) {
				this.#resizeObserver = new ResizeObserver(() => {
					this.#popup?.adjustPosition?.();
				});
				this.#resizeObserver.observe(container);
			}
		}
		#destroy() {
			if (this.#unsubscribeSlider) {
				this.#unsubscribeSlider();
				this.#unsubscribeSlider = null;
			}
			if (this.#onSentHandler) {
				if (main_core.Type.isFunction(window.BX?.removeCustomEvent)) {
					window.BX.removeCustomEvent('OnWorkReportSend', this.#onSentHandler);
				}
				this.#onSentHandler = null;
			}
			if (this.#resizeObserver) {
				this.#resizeObserver.disconnect();
				this.#resizeObserver = null;
			}
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
			}
			if (this.#popup) {
				this.#popup.destroy();
				this.#popup = null;
			}
			releasePopupLock();
			if (this.#onClose) {
				try {
					this.#onClose();
				} finally {
					this.#onClose = null;
				}
			}
		}
	}

	const ENTITY_TYPE = 'WORK_REPORT';
	const BLOCK_TAGS = new Set(['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']);
	const collectText = node => {
		const name = node.getName();
		if (name === '#text') {
			return String(node.getContent() ?? '');
		}
		if (name === '#linebreak') {
			return '\n';
		}
		if (name === '#tab') {
			return '\t';
		}
		const inner = node.getChildren().map(collectText).join('');
		if (BLOCK_TAGS.has(name.toLowerCase())) {
			return `${inner}\n`;
		}
		return inner;
	};
	const stripBbcode = text => {
		const preprocessed = String(text).replace(/\[br\s*\/?\]/gi, '\n');
		const root = new ui_bbcode_parser.BBCodeParser().parse(preprocessed);
		return collectText(root).trim();
	};
	const callRest = (method, params) => new Promise(resolve => {
		const rest = window.BX?.rest;
		if (!rest?.callMethod) {
			console.error('discuss-chat: BX.rest is not available');
			resolve(null);
			return;
		}
		rest.callMethod(method, params, result => {
			const error = result?.error?.();
			if (error) {
				console.error(`discuss-chat: ${method} failed`, error);
				resolve(null);
				return;
			}
			resolve(result?.data?.() ?? null);
		});
	});
	const openDiscussChat = async params => {
		const restParams = {
			ENTITY_TYPE,
			ENTITY_ID: String(params.entityId)
		};
		const existing = await callRest('im.chat.get', restParams);
		let chatId = Number(existing?.ID ?? (main_core.Type.isNumber(existing) ? existing : 0));
		if (chatId <= 0) {
			const addParams = {
				USERS: params.userIds,
				...restParams
			};
			if (params.message) {
				const stripped = stripBbcode(params.message);
				if (stripped) {
					addParams.MESSAGE = stripped;
				}
			}
			if (params.title) {
				addParams.TITLE = params.title;
			}
			const created = await callRest('im.chat.add', addParams);
			chatId = Number(created?.ID ?? (main_core.Type.isNumber(created) ? created : 0));
		}
		if (chatId <= 0) {
			console.error('discuss-chat: could not resolve chatId');
			return;
		}
		const dialogId = `chat${chatId}`;
		const messengerHost = resolveMessengerHost();
		if (main_core.Type.isFunction(messengerHost?.BXIM?.openMessenger)) {
			messengerHost.BXIM.openMessenger(dialogId);
			return;
		}
		if (main_core.Type.isFunction(messengerHost?.BX?.MessengerCommon?.openDialog)) {
			messengerHost.BX.MessengerCommon.openDialog(dialogId);
			return;
		}
		console.error('discuss-chat: messenger API not found on window');
	};
	const resolveMessengerHost = () => {
		try {
			if (window.top && window.top !== window && window.top.BXIM) {
				return window.top;
			}
		} catch (e) {
			console.error('discuss-chat: resolveMessengerHost not work');
		}
		return window;
	};

	const APPROVE_MARK = 'G';
	const REJECT_MARK = 'N';
	const normalizeUser = raw => {
		if (!raw) {
			return null;
		}
		const id = Number(raw.id ?? 0);
		const name = raw.name ?? '';
		const photo = raw.photo ?? null;
		if (!id && !name && !photo) {
			return null;
		}
		return {
			id,
			name,
			photo
		};
	};
	const formatDate = (timestamp, {
		forceYear
	} = {}) => {
		if (timestamp <= 0) {
			return '';
		}
		const date = new Date(timestamp * 1000);
		const showYear = forceYear || date.getFullYear() !== new Date().getFullYear();
		const format = main_date.DateTimeFormat.getFormat(showYear ? 'LONG_DATE_FORMAT' : 'DAY_MONTH_FORMAT');
		return main_date.DateTimeFormat.format(format, timestamp);
	};

	// @vue/component
	const ReviewApp = {
		name: 'WorkTimeReportReviewApp',
		components: {
			GptReportCard,
			BIcon: ui_iconSet_api_vue.BIcon,
			UiAvatar: ui_vue3_components_avatar.Avatar,
			UiButton: ui_vue3_components_button.Button,
			HtmlFormatterComponent: ui_bbcode_formatter_htmlFormatter.HtmlFormatterComponent
		},
		props: {
			userId: {
				type: Number,
				required: true
			},
			reportId: {
				type: Number,
				required: true
			},
			currentUserId: {
				type: Number,
				required: true
			}
		},
		setup() {
			return {
				Loc: main_core.Loc,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				loading: true,
				error: false,
				reportData: null,
				currentReportId: this.reportId,
				mark: null,
				approving: false,
				discussing: false,
				isScrolled: false,
				canScrollDown: false
			};
		},
		computed: {
			title() {
				return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_TITLE');
			},
			dateText() {
				return this.formatDateRange(Number(this.reportData?.dateFrom ?? 0), Number(this.reportData?.dateTo ?? 0));
			},
			submittedDate() {
				return formatDate(Number(this.reportData?.reportDate ?? this.reportData?.timestamp ?? 0));
			},
			submittedText() {
				if (!this.submittedDate) {
					return '';
				}
				return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_REVIEW_SUBMITTED').replace('#DATE#', this.submittedDate);
			},
			fromUser() {
				return normalizeUser(this.reportData?.fromUser ?? null);
			},
			isOwnReport() {
				return this.currentUserId > 0 && this.fromUser?.id > 0 && this.currentUserId === this.fromUser.id;
			},
			toUser() {
				const list = this.reportData?.toUsers ?? [];
				return normalizeUser(Array.isArray(list) ? list[0] : null);
			},
			reportText() {
				return this.reportData?.reportPlain ?? this.reportData?.report ?? '';
			},
			bbcodeSource() {
				return this.reportData?.report ?? '';
			},
			isHtmlContent() {
				return /<\s*(div|p|br|a|span|img|table|ul|ol|li|h[1-6])\b/i.test(this.bbcodeSource);
			},
			hasComment() {
				return Boolean(this.bbcodeSource || this.reportText);
			},
			gptReport() {
				return this.reportData?.gptReport ?? this.reportData?.reportExtended ?? null;
			},
			hasGpt() {
				return this.reportData?.hasGpt ?? true;
			},
			reportType() {
				const raw = this.reportData?.reportType;
				return reportTypeFromValue(raw, ReportType.WEEK);
			},
			sourceType() {
				return this.reportData?.type ?? 'REPORT';
			},
			shouldShowGptCard() {
				return this.hasGpt && this.reportType !== ReportType.NONE;
			},
			isApproved() {
				return this.mark === APPROVE_MARK;
			},
			approveButtonStyle() {
				return this.isApproved ? ui_vue3_components_button.AirButtonStyle.PLAIN_ACCENT : ui_vue3_components_button.AirButtonStyle.PLAIN;
			},
			approveButtonIcon() {
				return this.isApproved ? ui_iconSet_api_vue.Solid.LIKE : ui_iconSet_api_vue.Outline.LIKE;
			},
			discussText() {
				return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_REVIEW_DISCUSS');
			}
		},
		mounted() {
			void this.loadWeeklyReport();
			if (!main_core.Type.isUndefined(ResizeObserver) && this.$refs.content) {
				this.contentResizeObserver = new ResizeObserver(() => {
					this.updateScrollFlags();
				});
				this.contentResizeObserver.observe(this.$refs.content);
			}
			this.$nextTick(() => this.updateScrollFlags());
		},
		beforeUnmount() {
			this.contentResizeObserver?.disconnect();
			this.contentResizeObserver = null;
		},
		methods: {
			applyReportData(data) {
				this.reportData = data;
				this.currentReportId = Number(data?.id ?? this.reportId ?? 0);
				this.mark = data?.mark ?? null;
				this.$nextTick(() => this.updateScrollFlags());
			},
			formatDateRange(fromTs, toTs) {
				const fromText = formatDate(fromTs);
				if (!fromText) {
					return '';
				}
				if (!toTs || fromTs === toTs) {
					return fromText;
				}
				return `${fromText} — ${formatDate(toTs)}`;
			},
			async handleApproveToggle() {
				if (this.approving || this.currentReportId <= 0) {
					return;
				}
				const previousMark = this.mark;
				const willApprove = !this.isApproved;
				this.mark = willApprove ? APPROVE_MARK : REJECT_MARK;
				this.approving = true;
				try {
					const ok = willApprove ? await timeman_provider_service_fullReportService.fullReportService.approve(this.currentReportId) : await timeman_provider_service_fullReportService.fullReportService.reject(this.currentReportId);
					if (ok) {
						this.notifyMarkChange();
					} else {
						this.mark = previousMark;
					}
				} catch (error) {
					this.mark = previousMark;
					console.error('ReviewApp.handleApproveToggle failed:', error);
				} finally {
					this.approving = false;
				}
			},
			notifyMarkChange() {
				if (main_core.Type.isFunction(window.BX?.onCustomEvent)) {
					window.BX.onCustomEvent(window, 'onWorkReportMarkChange', [{
						INFO: {
							ID: this.currentReportId,
							MARK: this.mark
						}
					}]);
				}
			},
			collectUserIds() {
				const fromId = Number(this.reportData?.fromUser?.id ?? 0);
				const toList = this.reportData?.toUsers ?? [];
				const toIds = toList.map(user => Number(user?.id ?? 0)).filter(id => id > 0);
				const ids = [];
				if (fromId > 0) {
					ids.push(fromId);
				}
				toIds.forEach(id => {
					if (!ids.includes(id)) {
						ids.push(id);
					}
				});
				return ids;
			},
			buildChatMessage() {
				const parts = [];
				if (this.gptReport) {
					parts.push(this.gptReport);
				}
				if (this.bbcodeSource) {
					parts.push(this.bbcodeSource);
				} else if (this.reportText) {
					parts.push(this.reportText);
				}
				return parts.length > 0 ? parts.join('\n\n') : null;
			},
			buildChatTitle() {
				if (!this.dateText) {
					return null;
				}
				return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_REVIEW_CHAT_TITLE').replace('#DATE#', this.dateText);
			},
			async handleDiscuss() {
				if (this.discussing || this.currentReportId <= 0) {
					return;
				}
				const userIds = this.collectUserIds();
				if (userIds.length === 0) {
					console.error('ReviewApp.handleDiscuss: no userIds resolved');
					return;
				}
				this.discussing = true;
				try {
					await openDiscussChat({
						userIds,
						entityId: this.currentReportId,
						message: this.buildChatMessage(),
						title: this.buildChatTitle()
					});
				} catch (error) {
					console.error('ReviewApp.handleDiscuss failed:', error);
				} finally {
					this.discussing = false;
				}
			},
			handleContentScroll() {
				this.updateScrollFlags();
			},
			updateScrollFlags() {
				const el = this.$refs.content;
				if (!el) {
					return;
				}
				this.isScrolled = el.scrollTop > 0;
				this.canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
			},
			async loadWeeklyReport() {
				this.loading = true;
				this.error = false;
				try {
					const data = await timeman_provider_service_fullReportService.fullReportService.get(this.userId, this.reportId);
					if (!data) {
						this.applyReportData(null);
						this.error = true;
						return;
					}
					this.applyReportData(data);
				} catch (error) {
					console.error('WorkTimeReportReview.loadWeeklyReport failed:', error);
					this.error = true;
				} finally {
					this.loading = false;
				}
			}
		},
		template: `
		<div class="tm-work-time-report">
			<div class="tm-work-time-report__title-row">
				<div class="tm-work-time-report__title-block">
					<div class="tm-work-time-report__title">
						{{ title }}
						<span v-if="dateText" class="tm-work-time-report__date">{{ dateText }}</span>
					</div>
				</div>
			</div>
			<div v-if="submittedText" class="tm-work-time-report__submitted">{{ submittedText }}</div>
			<div v-if="fromUser || toUser" class="tm-work-time-report__people">
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
			<div
				ref="content"
				class="tm-work-time-report__content"
				:class="{ '--scrolled': isScrolled, '--has-more': canScrollDown }"
				@scroll.passive="handleContentScroll"
			>
				<GptReportCard
					v-if="shouldShowGptCard"
					:report="gptReport"
					:reportType="reportType"
					:sourceType="sourceType"
				/>
				<div v-if="hasComment" class="tm-work-time-report__comment">
					<HtmlFormatterComponent
						v-if="bbcodeSource && !isHtmlContent"
						:bbcode="bbcodeSource"
					/>
					<template v-else>{{ reportText }}</template>
				</div>
			</div>
			<div
				v-if="!loading && !error"
				class="tm-work-time-report__footer tm-work-time-report-review__footer"
			>
				<UiButton
					class="tm-work-time-report__footer-discuss-btn"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE_ACCENT_2"
					:text="discussText"
					:loading="discussing"
					@click="handleDiscuss"
				/>
				<UiButton
					v-if="!isOwnReport"
					:size="ButtonSize.MEDIUM"
					:style="approveButtonStyle"
					:left-icon="approveButtonIcon"
					:loading="approving"
					@click="handleApproveToggle"
				/>
				<BIcon
					v-else
					:name="approveButtonIcon"
					:size="24"
					class="tm-work-time-report-review__like-readonly"
					:class="{ '--approved': isApproved }"
				/>
			</div>
		</div>
	`
	};

	const settings = main_core.Extension.getSettings('timeman.work-time-report');
	class WorkTimeReportReview {
		#popup = null;
		#app = null;
		#onClose = null;
		#resizeObserver = null;
		#unsubscribeSlider = null;
		open(userId, reportId) {
			if (!userId || !reportId) {
				console.error('WorkTimeReportReview: userId or reportId is required');
				return;
			}
			if (this.#popup) {
				this.#popup.show();
				return;
			}
			if (!tryAcquirePopupLock()) {
				return;
			}
			this.#popup = new main_popup.Popup({
				id: `timeman-work-time-report-review-${userId}`,
				bindElement: null,
				content: '',
				width: 450,
				minHeight: 100,
				maxHeight: 850,
				closeByEsc: true,
				closeIcon: true,
				autoHide: false,
				angle: false,
				padding: 20,
				overlay: true,
				className: 'timeman-work-time-report-review-popup',
				events: {
					onPopupAfterClose: () => {
						this.#destroy();
					}
				}
			});
			this.#popup.show();
			this.#unsubscribeSlider = closeOnSliderOpen(() => {
				this.#popup?.close();
			});
			const container = this.#popup.getContentContainer();
			const app = ui_vue3.BitrixVue.createApp(ReviewApp, {
				userId,
				reportId,
				currentUserId: settings.currentUserId
			});
			const popup = this.#popup;
			app.config.globalProperties.$close = () => {
				popup?.close();
			};
			app.mount(container);
			this.#app = app;
			if (!main_core.Type.isUndefined(ResizeObserver)) {
				this.#resizeObserver = new ResizeObserver(() => {
					this.#popup?.adjustPosition?.();
				});
				this.#resizeObserver.observe(container);
			}
		}
		#destroy() {
			if (this.#unsubscribeSlider) {
				this.#unsubscribeSlider();
				this.#unsubscribeSlider = null;
			}
			if (this.#resizeObserver) {
				this.#resizeObserver.disconnect();
				this.#resizeObserver = null;
			}
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
			}
			if (this.#popup) {
				this.#popup.destroy();
				this.#popup = null;
			}
			releasePopupLock();
			if (this.#onClose) {
				try {
					this.#onClose();
				} finally {
					this.#onClose = null;
				}
			}
		}
	}

	exports.ReportMode = ReportMode;
	exports.ReportType = ReportType;
	exports.WorkTimeReport = WorkTimeReport;
	exports.WorkTimeReportReview = WorkTimeReportReview;

})(this.BX.Timeman = this.BX.Timeman || {}, BX, BX.Main, BX.Vue3, BX.Timeman.Provider.Service, BX.Event, BX, BX.UI.IconSet, BX.UI.TextEditor, BX.UI.Vue3.Components, BX.Vue3.Components, BX.Timeman.Provider.Service, BX.Timeman.Provider.Service, BX, BX, BX.UI.BBCode.Formatter, BX.Main, BX.UI.BBCode);
//# sourceMappingURL=work-time-report.bundle.js.map

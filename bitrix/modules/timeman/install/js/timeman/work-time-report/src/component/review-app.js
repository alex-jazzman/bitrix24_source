import { Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { HtmlFormatterComponent } from 'ui.bbcode.formatter.html-formatter';
import { BIcon, Outline, Solid } from 'ui.icon-set.api.vue';
import { Avatar as UiAvatar } from 'ui.vue3.components.avatar';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';

import { fullReportService } from 'timeman.provider.service.full-report-service';

import { ReportType, reportTypeFromValue } from '../const/report-type';
import { GptReportCard } from './gpt-report-card';
import { openDiscussChat } from '../discuss-chat-action';
import './review-app.css';

const APPROVE_MARK = 'G';
const REJECT_MARK = 'N';

const normalizeUser = (raw: ?Object): ?Object => {
	if (!raw)
	{
		return null;
	}

	const id = Number(raw.id ?? 0);
	const name = raw.name ?? '';
	const photo = raw.photo ?? null;

	if (!id && !name && !photo)
	{
		return null;
	}

	return { id, name, photo };
};

const formatDate = (timestamp: number, { forceYear }: { forceYear?: boolean } = {}): string => {
	if (timestamp <= 0)
	{
		return '';
	}

	const date = new Date(timestamp * 1000);
	const showYear = forceYear || date.getFullYear() !== new Date().getFullYear();
	const format = DateTimeFormat.getFormat(showYear ? 'LONG_DATE_FORMAT' : 'DAY_MONTH_FORMAT');

	return DateTimeFormat.format(format, timestamp);
};

// @vue/component
export const ReviewApp = {
	name: 'WorkTimeReportReviewApp',
	components: { GptReportCard, BIcon, UiAvatar, UiButton, HtmlFormatterComponent },
	props: {
		userId: {
			type: Number,
			required: true,
		},
		reportId: {
			type: Number,
			required: true,
		},
		currentUserId: {
			type: Number,
			required: true,
		},
	},
	setup(): Object
	{
		return { Loc, ButtonSize, AirButtonStyle, Outline };
	},
	data(): Object
	{
		return {
			loading: true,
			error: false,
			reportData: null,
			currentReportId: this.reportId,
			mark: null,
			approving: false,
			discussing: false,
			isScrolled: false,
			canScrollDown: false,
		};
	},
	computed: {
		title(): string
		{
			return Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_TITLE');
		},
		dateText(): string
		{
			return this.formatDateRange(
				Number(this.reportData?.dateFrom ?? 0),
				Number(this.reportData?.dateTo ?? 0),
			);
		},
		submittedDate(): string
		{
			return formatDate(Number(this.reportData?.reportDate ?? this.reportData?.timestamp ?? 0));
		},
		submittedText(): string
		{
			if (!this.submittedDate)
			{
				return '';
			}

			return Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_REVIEW_SUBMITTED')
				.replace('#DATE#', this.submittedDate);
		},
		fromUser(): ?Object
		{
			return normalizeUser(this.reportData?.fromUser ?? null);
		},
		isOwnReport(): boolean
		{
			return this.currentUserId > 0
				&& this.fromUser?.id > 0
				&& this.currentUserId === this.fromUser.id;
		},
		toUser(): ?Object
		{
			const list = this.reportData?.toUsers ?? [];

			return normalizeUser(Array.isArray(list) ? list[0] : null);
		},
		reportText(): string
		{
			return this.reportData?.reportPlain ?? this.reportData?.report ?? '';
		},
		bbcodeSource(): string
		{
			return this.reportData?.report ?? '';
		},
		isHtmlContent(): boolean
		{
			return /<\s*(div|p|br|a|span|img|table|ul|ol|li|h[1-6])\b/i.test(this.bbcodeSource);
		},
		hasComment(): boolean
		{
			return Boolean(this.bbcodeSource || this.reportText);
		},
		gptReport(): ?string
		{
			return this.reportData?.gptReport ?? this.reportData?.reportExtended ?? null;
		},
		hasGpt(): boolean
		{
			return this.reportData?.hasGpt ?? true;
		},
		reportType(): string
		{
			const raw = this.reportData?.reportType;

			return reportTypeFromValue(raw, ReportType.WEEK);
		},
		sourceType(): string
		{
			return this.reportData?.type ?? 'REPORT';
		},
		shouldShowGptCard(): boolean
		{
			return this.hasGpt && this.reportType !== ReportType.NONE;
		},
		isApproved(): boolean
		{
			return this.mark === APPROVE_MARK;
		},
		approveButtonStyle(): string
		{
			return this.isApproved ? AirButtonStyle.PLAIN_ACCENT : AirButtonStyle.PLAIN;
		},
		approveButtonIcon(): string
		{
			return this.isApproved ? Solid.LIKE : Outline.LIKE;
		},
		discussText(): string
		{
			return Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_REVIEW_DISCUSS');
		},
	},
	mounted(): void
	{
		void this.loadWeeklyReport();

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
		this.contentResizeObserver?.disconnect();
		this.contentResizeObserver = null;
	},
	methods: {
		applyReportData(data: ?Object): void
		{
			this.reportData = data;
			this.currentReportId = Number(data?.id ?? this.reportId ?? 0);
			this.mark = data?.mark ?? null;

			this.$nextTick((): void => this.updateScrollFlags());
		},

		formatDateRange(fromTs: number, toTs: number): string
		{
			const fromText = formatDate(fromTs);
			if (!fromText)
			{
				return '';
			}

			if (!toTs || fromTs === toTs)
			{
				return fromText;
			}

			return `${fromText} — ${formatDate(toTs)}`;
		},

		async handleApproveToggle(): Promise<void>
		{
			if (this.approving || this.currentReportId <= 0)
			{
				return;
			}

			const previousMark = this.mark;
			const willApprove = !this.isApproved;
			this.mark = willApprove ? APPROVE_MARK : REJECT_MARK;
			this.approving = true;

			try
			{
				const ok = willApprove
					? await fullReportService.approve(this.currentReportId)
					: await fullReportService.reject(this.currentReportId);

				if (ok)
				{
					this.notifyMarkChange();
				}
				else
				{
					this.mark = previousMark;
				}
			}
			catch (error)
			{
				this.mark = previousMark;
				console.error('ReviewApp.handleApproveToggle failed:', error);
			}
			finally
			{
				this.approving = false;
			}
		},

		notifyMarkChange(): void
		{
			if (Type.isFunction(window.BX?.onCustomEvent))
			{
				window.BX.onCustomEvent(window, 'onWorkReportMarkChange', [
					{ INFO: { ID: this.currentReportId, MARK: this.mark } },
				]);
			}
		},

		collectUserIds(): number[]
		{
			const fromId = Number(this.reportData?.fromUser?.id ?? 0);
			const toList = this.reportData?.toUsers ?? [];
			const toIds = toList
				.map((user) => Number(user?.id ?? 0))
				.filter((id) => id > 0);

			const ids = [];
			if (fromId > 0)
			{
				ids.push(fromId);
			}
			toIds.forEach((id) => {
				if (!ids.includes(id))
				{
					ids.push(id);
				}
			});

			return ids;
		},

		buildChatMessage(): ?string
		{
			const parts = [];
			if (this.gptReport)
			{
				parts.push(this.gptReport);
			}

			if (this.bbcodeSource)
			{
				parts.push(this.bbcodeSource);
			}
			else if (this.reportText)
			{
				parts.push(this.reportText);
			}

			return parts.length > 0 ? parts.join('\n\n') : null;
		},

		buildChatTitle(): ?string
		{
			if (!this.dateText)
			{
				return null;
			}

			return Loc.getMessage('TIMEMAN_WORK_TIME_REPORT_REVIEW_CHAT_TITLE')
				.replace('#DATE#', this.dateText);
		},

		async handleDiscuss(): Promise<void>
		{
			if (this.discussing || this.currentReportId <= 0)
			{
				return;
			}

			const userIds = this.collectUserIds();
			if (userIds.length === 0)
			{
				console.error('ReviewApp.handleDiscuss: no userIds resolved');

				return;
			}

			this.discussing = true;
			try
			{
				await openDiscussChat({
					userIds,
					entityId: this.currentReportId,
					message: this.buildChatMessage(),
					title: this.buildChatTitle(),
				});
			}
			catch (error)
			{
				console.error('ReviewApp.handleDiscuss failed:', error);
			}
			finally
			{
				this.discussing = false;
			}
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
		async loadWeeklyReport(): Promise<void>
		{
			this.loading = true;
			this.error = false;

			try
			{
				const data = await fullReportService.get(this.userId, this.reportId);
				if (!data)
				{
					this.applyReportData(null);
					this.error = true;

					return;
				}

				this.applyReportData(data);
			}
			catch (error)
			{
				console.error('WorkTimeReportReview.loadWeeklyReport failed:', error);
				this.error = true;
			}
			finally
			{
				this.loading = false;
			}
		},
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
	`,
};

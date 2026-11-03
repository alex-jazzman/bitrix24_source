import { LiveAnnouncer } from 'ui.a11y';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Vue as AlertVue } from 'ui.system.alert';
import { Vue as TypographyVue } from 'ui.system.typography';
import { nextTick } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { RichLoc } from 'ui.vue3.components.rich-loc';

import { type CheckListCompletionSnapshot, type CompletionPromptTitleLink, type PromptDialogState } from 'tasks.v2.lib.check-list-completion-prompt';

import { TestId } from './const';
import { PromptGroup } from './prompt-group';

const { Alert } = AlertVue;
const { HeadlineMd, TextMd } = TypographyVue;

type ComponentThis = {
	hasOverflow: boolean,
	resizeObserver: ResizeObserver | null,
	focusedBeforeLoading: HTMLElement | null,
	snapshot: CheckListCompletionSnapshot,
	state: PromptDialogState,
	title: string,
	titleId: string | null,
	titleLink: CompletionPromptTitleLink | null,
	subtitle: string,
	completeButtonText: string,
	returnButtonText: string,
	onComplete: () => Promise<void> | void,
	onLoadingChange: (loading: boolean) => void,
	onReturn: () => void,
	onCancel: () => void,
	focusDialog: () => void,
	updateOverflow: () => void,
	holdFocus: () => void,
	restoreFocus: () => Promise<void>,
	loc: (code: string, replacements?: Record<string, string | number>) => string,
	$el: HTMLElement,
	$refs: { scrollArea: HTMLElement },
};

// @vue/component
export const PromptContent = {
	name: 'TasksCheckListCompletionContent',
	components: {
		Alert,
		BIcon,
		HeadlineMd,
		PromptGroup,
		RichLoc,
		TextMd,
		UiButton,
	},
	props: {
		snapshot: {
			/** @type CheckListCompletionSnapshot */
			type: Object,
			required: true,
		},
		state: {
			/** @type PromptDialogState */
			type: Object,
			required: true,
		},
		title: {
			type: String,
			required: false,
			default: '',
		},
		titleId: {
			type: String,
			required: false,
			default: null,
		},
		titleLink: {
			/** @type CompletionPromptTitleLink */
			type: Object,
			required: false,
			default: null,
		},
		subtitle: {
			type: String,
			required: false,
			default: '',
		},
		completeButtonText: {
			type: String,
			default: '',
		},
		returnButtonText: {
			type: String,
			default: '',
		},
		onComplete: {
			type: Function,
			default: () => {},
		},
		onLoadingChange: {
			type: Function,
			default: () => {},
		},
		onReturn: {
			type: Function,
			default: () => {},
		},
		onCancel: {
			type: Function,
			default: () => {},
		},
		focusDialog: {
			type: Function,
			default: () => {},
		},
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			TestId,
			Outline,
		};
	},
	data(): Object
	{
		return {
			hasOverflow: false,
		};
	},
	computed: {
		resolvedCompleteButtonText(this: ComponentThis): string
		{
			if (this.state.error)
			{
				return this.loc('TASKS_V2_CHECKLIST_RETRY_BUTTON');
			}

			return this.completeButtonText || this.loc('TASKS_V2_CHECKLIST_COMPLETE_BUTTON');
		},
		resolvedReturnButtonText(this: ComponentThis): string
		{
			return this.returnButtonText || this.loc('TASKS_V2_CHECKLIST_RETURN_BUTTON');
		},
	},
	watch: {
		'state.loading': {
			handler(this: ComponentThis, loading: boolean): void
			{
				if (loading)
				{
					this.holdFocus();
					LiveAnnouncer.announce(this.loc('TASKS_V2_CHECKLIST_COMPLETE_LOADING'), 'polite');

					return;
				}

				void this.restoreFocus();
			},
		},
		'state.error': {
			handler(this: ComponentThis, hasError: boolean): void
			{
				if (hasError)
				{
					LiveAnnouncer.announce(this.loc('TASKS_V2_CHECKLIST_COMPLETE_ERROR'), 'assertive');
				}
			},
		},
	},
	created(this: ComponentThis): void
	{
		this.resizeObserver = null;
		this.focusedBeforeLoading = null;
	},
	mounted(this: ComponentThis): void
	{
		this.resizeObserver = new ResizeObserver(() => this.updateOverflow());
		this.resizeObserver.observe(this.$refs.scrollArea);
		this.updateOverflow();
	},
	beforeUnmount(this: ComponentThis): void
	{
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	},
	methods: {
		updateOverflow(this: ComponentThis): void
		{
			const scrollArea = this.$refs.scrollArea;
			this.hasOverflow = scrollArea.scrollHeight - scrollArea.clientHeight > 1;
		},
		// actions become natively disabled while the request runs, so the focus is parked on the dialog itself
		holdFocus(this: ComponentThis): void
		{
			const activeElement = document.activeElement as HTMLElement | null;
			this.focusedBeforeLoading = this.$el.contains(activeElement) ? activeElement : null;
			if (this.focusedBeforeLoading)
			{
				this.focusDialog();
			}
		},
		async restoreFocus(this: ComponentThis): Promise<void>
		{
			const element = this.focusedBeforeLoading;
			this.focusedBeforeLoading = null;

			await nextTick();

			if (element?.isConnected && !this.$el.contains(document.activeElement))
			{
				element.focus();
			}
		},
		handleTitleLinkClick(this: ComponentThis): void
		{
			if (this.state.loading)
			{
				return;
			}

			this.titleLink?.onClick();
		},
		handleComplete(this: ComponentThis): void
		{
			if (this.state.loading)
			{
				return;
			}

			this.onLoadingChange(true);
			void this.onComplete();
		},
		handleReturn(this: ComponentThis): void
		{
			if (!this.state.loading)
			{
				this.onReturn();
			}
		},
		handleCancel(this: ComponentThis): void
		{
			if (!this.state.loading)
			{
				this.onCancel();
			}
		},
	},
	template: `
		<div
			class="tasks-check-list-completion"
			:data-testid="TestId.DialogRoot"
			:aria-busy="state.loading ? 'true' : 'false'"
		>
			<UiButton
				class="tasks-check-list-completion__close"
				:text="loc('TASKS_V2_CHECKLIST_CLOSE_BUTTON')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:leftIcon="Outline.CROSS_M"
				:dataset="{ testid: TestId.CloseButton }"
				:disabled="state.loading"
				collapsed
				@click="handleCancel"
			/>
			<div class="tasks-check-list-completion__status">
				<img
					class="tasks-check-list-completion__illustration"
					src="/bitrix/js/tasks/v2/lib/check-list-completion-prompt-dialog/images/checklist-completion.webp"
					alt=""
					width="152"
					height="93"
					draggable="false"
				>
				<HeadlineMd
					tag="h2"
					accent
					align="center"
					className="tasks-check-list-completion__title"
					:id="titleId"
					:data-testid="TestId.Title"
				>
					{{ title || loc('TASKS_V2_CHECKLIST_COMPLETE_TITLE') }}<template v-if="titleLink">{{ ' «' }}<a
							class="tasks-check-list-completion__title-link"
							href="#"
							:aria-disabled="state.loading ? 'true' : 'false'"
							:tabindex="state.loading ? -1 : 0"
							:data-testid="TestId.TitleLink"
							@click.prevent="handleTitleLinkClick"
						>{{ titleLink.text }}</a>{{ '»?' }}</template>
				</HeadlineMd>
			</div>
			<TextMd
				tag="p"
				align="center"
				className="tasks-check-list-completion__subtitle"
				:data-testid="TestId.Subtitle"
			>
				<RichLoc
					tag="span"
					:text="subtitle || loc('TASKS_V2_CHECKLIST_COMPLETE_SUBTITLE')"
					placeholder="[br/]"
				>
					<template #br><br></template>
				</RichLoc>
			</TextMd>
			<div v-if="state.error" class="tasks-check-list-completion__error-wrap">
				<Alert design="tinted-alert" :data-testid="TestId.ErrorAlert">
					<span class="tasks-check-list-completion__error">
							<BIcon
								class="tasks-check-list-completion__error-icon"
								:name="Outline.ALERT"
								:size="20"
								color="var(--ui-color-accent-main-alert)"
								aria-hidden="true"
							/>
							<span>{{ loc('TASKS_V2_CHECKLIST_COMPLETE_ERROR') }}</span>
						</span>
				</Alert>
			</div>
			<div class="tasks-check-list-completion__list" :data-testid="TestId.List">
				<div
					ref="scrollArea"
					class="tasks-check-list-completion__scroll-area"
					role="region"
					:tabindex="hasOverflow ? 0 : -1"
					:aria-label="loc('TASKS_V2_CHECKLIST_LIST_LABEL')"
					:data-testid="TestId.ScrollArea"
				>
					<PromptGroup
						v-for="group in snapshot.groups"
						:key="group.id"
						:group="group"
					/>
				</div>
				<div v-if="hasOverflow" class="tasks-check-list-completion__fade --top" aria-hidden="true"></div>
				<div v-if="hasOverflow" class="tasks-check-list-completion__fade --bottom" aria-hidden="true"></div>
			</div>
			<div class="tasks-check-list-completion__footer">
				<div class="tasks-check-list-completion__buttons">
					<UiButton
						class="tasks-check-list-completion__button"
						:text="resolvedCompleteButtonText"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.FILLED"
						:dataset="{ autofocus: '', testid: TestId.CompleteButton }"
						:disabled="state.loading"
						:loading="state.loading"
						@click="handleComplete"
					/>
					<UiButton
						class="tasks-check-list-completion__button"
						:text="resolvedReturnButtonText"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.PLAIN"
						:dataset="{ testid: TestId.ReturnButton }"
						:disabled="state.loading"
						@click="handleReturn"
					/>
				</div>
			</div>
		</div>
	`,
};

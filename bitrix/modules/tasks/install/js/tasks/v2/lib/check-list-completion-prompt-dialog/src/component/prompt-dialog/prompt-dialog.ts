import { Loc, Tag, Text } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { BitrixVue, reactive, type VueCreateAppResult } from 'ui.vue3';
import { Popup } from 'ui.vue3.components.popup';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { type CheckListCompletionSnapshot, type CompletionPromptPresentation, type CompletionPromptTitleLink, type PromptDialogOptions, type PromptDialogState } from 'tasks.v2.lib.check-list-completion-prompt';

import {
	createPopupClosingLock,
	type PopupClosingLock,
	type SliderEventEmitter,
} from './popup-closing-lock';
import { PromptContent } from './prompt-content';

import './prompt-dialog.css';

type PopupInstance = {
	close: () => void,
	isDestroyed: () => boolean,
	getPopupContainer: () => HTMLElement | null,
	setAutoHide: (enabled: boolean) => void,
	setClosingByEsc: (enabled: boolean) => void,
};

type PopupComponentInstance = {
	getPopupInstance: () => PopupInstance,
};

type WindowWithBX = Window & {
	BX?: {
		Event?: {
			EventEmitter?: SliderEventEmitter,
		},
	},
};

type PromptDialogComponentInstance = {
	close: () => void,
};

type ComponentThis = {
	state: PromptDialogState,
	snapshot: CheckListCompletionSnapshot,
	presentation: CompletionPromptPresentation | null,
	title: string,
	titleId: string,
	closingLock: PopupClosingLock | null,
	focusDialog: () => void,
	onComplete: () => Promise<void> | void,
	onLoadingChange: (loading: boolean) => void,
	onReturn: (onAfterClose?: () => void) => void,
	onCancel: () => void,
	onPassiveClose: () => void,
	onClosed: () => void,
	$refs: {
		popup?: PopupComponentInstance,
	},
};

// @vue/component
const PromptDialogComponent = {
	name: 'TasksCheckListCompletionPromptDialog',
	components: {
		Popup,
		PromptContent,
	},
	props: {
		state: {
			/** @type PromptDialogState */
			type: Object,
			required: true,
		},
		snapshot: {
			/** @type CheckListCompletionSnapshot */
			type: Object,
			required: true,
		},
		presentation: {
			/** @type CompletionPromptPresentation */
			type: Object,
			default: null,
		},
		onComplete: {
			type: Function,
			required: true,
		},
		onLoadingChange: {
			type: Function,
			required: true,
		},
		onReturn: {
			type: Function,
			required: true,
		},
		onCancel: {
			type: Function,
			required: true,
		},
		onPassiveClose: {
			type: Function,
			required: true,
		},
		onClosed: {
			type: Function,
			required: true,
		},
	},
	data(): Object
	{
		return {
			titleId: `tasks-check-list-completion-title-${Text.getRandom()}`,
			closingLock: null,
		};
	},
	computed: {
		title(this: ComponentThis): string
		{
			return this.presentation?.title ?? Loc.getMessage('TASKS_V2_CHECKLIST_COMPLETE_TITLE') ?? '';
		},
		titleLink(this: ComponentThis): CompletionPromptTitleLink | null
		{
			const titleLink = this.presentation?.titleLink;
			if (!titleLink)
			{
				return null;
			}

			return {
				text: titleLink.text,
				onClick: () => this.onReturn(titleLink.onClick),
			};
		},
		popupOptions(this: ComponentThis): PopupOptions
		{
			return {
				className: 'tasks-check-list-completion-popup',
				padding: 0,
				contentPadding: 0,
				borderRadius: '18px',
				overlay: {
					backgroundColor: 'rgba(0, 32, 78, 0.46)',
					opacity: 100,
					blur: 'none',
				},
				autoHide: true,
				closeByEsc: true,
				disableScroll: true,
				focusTrap: {
					initialFocus: '[data-autofocus]',
					restoreFocus: true,
					looped: true,
				},
				ariaLabelledBy: this.titleId,
				animation: false,
				cacheable: false,
				targetContainer: document.body,
			};
		},
	},
	watch: {
		'state.loading': {
			handler(this: ComponentThis): void
			{
				this.closingLock?.apply();
			},
		},
	},
	mounted(this: ComponentThis): void
	{
		this.closingLock = createPopupClosingLock({
			eventEmitter: getSliderEventEmitter(),
			getPopup: () => this.$refs.popup?.getPopupInstance(),
			isLoading: () => this.state.loading,
		});
	},
	beforeUnmount(this: ComponentThis): void
	{
		this.closingLock?.stop();
		this.closingLock = null;
	},
	methods: {
		close(this: ComponentThis): void
		{
			this.$refs.popup?.getPopupInstance().close();
		},
		focusDialog(this: ComponentThis): void
		{
			this.$refs.popup?.getPopupInstance().getPopupContainer()?.focus();
		},
		handlePopupClose(this: ComponentThis): void
		{
			this.onPassiveClose();
			if (this.$refs.popup?.getPopupInstance().isDestroyed())
			{
				this.onClosed();
			}
		},
	},
	template: `
		<Popup ref="popup" :options="popupOptions" @close="handlePopupClose">
			<template #default>
				<PromptContent
					:snapshot="snapshot"
					:state="state"
					:title="title"
					:titleId="titleId"
					:titleLink="titleLink"
					:subtitle="presentation?.subtitle"
					:completeButtonText="presentation?.completeButtonText"
					:returnButtonText="presentation?.returnButtonText"
					:onComplete="onComplete"
					:onLoadingChange="onLoadingChange"
					:onReturn="onReturn"
					:onCancel="onCancel"
					:focusDialog="focusDialog"
				/>
			</template>
		</Popup>
	`,
};

export class CheckListCompletionPromptDialog
{
	#snapshot: CheckListCompletionSnapshot;
	#presentation: CompletionPromptPresentation | null;
	#onComplete: () => Promise<void> | void;
	#onReturn: () => void;
	#onCancel: () => void;
	#onClosed: () => void;
	#application: VueCreateAppResult | null = null;
	#component: PromptDialogComponentInstance | null = null;
	#container: HTMLElement = Tag.render`<div></div>`;
	#state = reactive({ loading: false, error: false });
	#settled = false;
	#cleanupScheduled = false;
	#onSettledAfterClose: (() => void) | null = null;
	#onAfterClose: (() => void) | null = null;

	constructor({ snapshot, onComplete, onReturn, onCancel, onClosed, presentation }: PromptDialogOptions)
	{
		this.#snapshot = snapshot;
		this.#presentation = presentation ?? null;
		this.#onComplete = onComplete;
		this.#onReturn = onReturn ?? onCancel;
		this.#onCancel = onCancel;
		this.#onClosed = onClosed ?? (() => {});
	}

	show(): void
	{
		if (this.#application || this.#settled)
		{
			return;
		}

		this.#application = BitrixVue.createApp(PromptDialogComponent, {
			state: this.#state,
			snapshot: this.#snapshot,
			presentation: this.#presentation,
			onComplete: this.#onComplete,
			onLoadingChange: (loading: boolean) => this.setLoading(loading),
			onReturn: (onAfterClose?: () => void) => this.returnToTask(onAfterClose),
			onCancel: () => this.cancel(),
			onPassiveClose: () => this.#handlePassiveClose(),
			onClosed: () => this.#scheduleCleanup(),
		});
		this.#application.mixin(locMixin);
		this.#component = (
			this.#application.mount(this.#container) as unknown as PromptDialogComponentInstance
		);
	}

	close(): void
	{
		if (this.#settled)
		{
			return;
		}

		this.#settled = true;
		this.#requestClose();
	}

	setLoading(loading: boolean): void
	{
		this.#state.loading = loading;
		if (loading)
		{
			this.#state.error = false;
		}
	}

	setError(): void
	{
		this.#state.loading = false;
		this.#state.error = true;
	}

	cancel(): void
	{
		if (this.#settled || this.#state.loading)
		{
			return;
		}

		this.#settled = true;
		this.#onSettledAfterClose = this.#onCancel;
		this.#requestClose();
	}

	returnToTask(onAfterClose?: () => void): void
	{
		if (this.#settled || this.#state.loading)
		{
			return;
		}

		this.#settled = true;
		this.#onSettledAfterClose = this.#onReturn;
		this.#onAfterClose = onAfterClose ?? null;
		this.#requestClose();
	}

	#handlePassiveClose(): void
	{
		if (this.#settled || this.#state.loading)
		{
			return;
		}

		this.#settled = true;
		this.#onSettledAfterClose = this.#onCancel;
	}

	#requestClose(): void
	{
		if (this.#component)
		{
			this.#component.close();

			return;
		}

		this.#scheduleCleanup();
	}

	#scheduleCleanup(): void
	{
		if (this.#cleanupScheduled)
		{
			return;
		}

		this.#cleanupScheduled = true;
		void Promise.resolve().then(() => {
			this.#application?.unmount();
			this.#application = null;
			this.#component = null;
			this.#container.remove();

			const onSettledAfterClose = this.#onSettledAfterClose;
			this.#onSettledAfterClose = null;
			const onAfterClose = this.#onAfterClose;
			this.#onAfterClose = null;
			onSettledAfterClose?.();
			onAfterClose?.();
		});
		this.#onClosed();
	}
}

function getSliderEventEmitter(): SliderEventEmitter | null
{
	return (top as WindowWithBX).BX?.Event?.EventEmitter ?? null;
}

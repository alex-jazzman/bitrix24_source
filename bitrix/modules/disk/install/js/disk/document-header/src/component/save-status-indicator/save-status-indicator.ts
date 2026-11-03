import { Dom, Loc, Type } from 'main.core';
import { Loader } from 'main.loader';
import { LiveAnnouncer } from 'ui.a11y';
import { Main, Outline } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';
import 'ui.icon-set.outline';
import { TextXs } from 'ui.system.typography.vue';
import { defineComponent, inject, markRaw } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { mapState } from 'ui.vue3.pinia';

import { type EditorAdapter, type SaveState, type SaveStatus } from '../../const/adapter';
import { HeaderElement } from '../../const/element';
import { EditorAdapterInjectionKey, SaveStatusInjectionKey } from '../../const/injection';
import { HeaderTestId } from '../../const/testid';
import { ButtonSpinner } from '../../lib/button-spinner/button-spinner';
import { useCompositionStore } from '../../model/composition/composition';

import './save-status-indicator.css';

/** One size for the icon of the result and for the spinner of the process alike. */
const IconSize = 18;

/** The name the node of the retry is addressed by, the way the other actions of the header are. */
const RetryControl = 'save-retry';

/** The loader is a class of its own: only the part of it the status uses is described here. */
type Spinner = {
	show: (target: HTMLElement) => void,
	hide: () => void,
	destroy: () => void,
};

type IndicatorState = {
	spinner: Spinner | null,
	isRetrying: boolean,
	retrySpinner: ButtonSpinner | null,
};

type IndicatorContext = {
	AirButtonStyle: typeof AirButtonStyle,
	ButtonSize: typeof ButtonSize,
	HeaderTestId: typeof HeaderTestId,
	IconSize: number,
	RetryControl: string,
	adapter: EditorAdapter | null,
	status: SaveStatus,
};

/**
 * State of saving of the opened object. The value comes from the editor through the adapter; a
 * neutral value is not drawn at all, so an object nothing is claimed about carries no status. Which
 * objects are claimed nothing about at rest is decided before the value reaches the indicator.
 *
 * An editor which saves by itself claims the mode instead of an outcome: the label of the autosaving
 * is drawn the way a confirmed saving is, and it stays for as long as the object is open.
 */
export const SaveStatusIndicator = defineComponent({
	name: 'DiskDocumentHeaderSaveStatus',
	components: {
		BIcon,
		TextXs,
		UiButton,
	},
	setup(): IndicatorContext
	{
		return {
			AirButtonStyle,
			ButtonSize,
			HeaderTestId,
			IconSize,
			RetryControl,
			adapter: inject<EditorAdapter | null>(EditorAdapterInjectionKey, null),
			status: inject<SaveStatus>(SaveStatusInjectionKey, { state: 'neutral' }),
		};
	},
	data(): IndicatorState
	{
		return {
			spinner: null,
			isRetrying: false,
			retrySpinner: null,
		};
	},
	computed: {
		...mapState(useCompositionStore, ['hasElement']),
		state(): SaveState
		{
			return this.status.state;
		},
		isPresent(): boolean
		{
			return this.hasElement(HeaderElement.SaveStatus) && this.state !== 'neutral';
		},
		isSaving(): boolean
		{
			return this.state === 'saving';
		},
		isFailed(): boolean
		{
			return this.state === 'failed';
		},
		isAutosave(): boolean
		{
			return this.state === 'autosave';
		},
		icon(): string
		{
			return this.isFailed ? Main.WARNING_ALARM : Outline.CIRCLE_CHECK;
		},
		iconColor(): string
		{
			return this.isFailed
				? 'var(--ui-color-accent-main-alert)'
				: 'var(--ui-color-accent-main-success)'
			;
		},
		hasIcon(): boolean
		{
			return !this.isSaving;
		},
		/** The reason of a refusal comes from the editor; the text of the phrase is the fallback. */
		message(): string
		{
			if (this.isSaving)
			{
				return Loc.getMessage('DISK_DOCUMENT_HEADER_SAVE_STATUS_SAVING') ?? '';
			}

			if (this.isAutosave)
			{
				return Loc.getMessage('DISK_DOCUMENT_HEADER_SAVE_STATUS_AUTOSAVE') ?? '';
			}

			if (!this.isFailed)
			{
				return Loc.getMessage('DISK_DOCUMENT_HEADER_SAVE_STATUS_SAVED') ?? '';
			}

			return Type.isStringFilled(this.status.errorMessage)
				? this.status.errorMessage
				: Loc.getMessage('DISK_DOCUMENT_HEADER_SAVE_STATUS_FAILED') ?? ''
			;
		},
		canRetry(): boolean
		{
			return this.isFailed && this.adapter?.canRetrySave() === true;
		},
		retryCaption(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_RETRY_BUTTON') ?? '';
		},
	},
	watch: {
		state(): void
		{
			this.announceOutcome();
		},
	},
	mounted(): void
	{
		this.syncSpinner();
	},
	updated(): void
	{
		this.syncSpinner();
		this.syncRetrySpinner();
	},
	beforeUnmount(): void
	{
		this.spinner?.destroy();
		this.spinner = null;
		this.destroyRetrySpinner();
	},
	methods: {
		handleRetry(): void
		{
			void this.retry();
		},
		/**
		 * One press starts one attempt: while an attempt is being started the button keeps its place
		 * and answers nothing, so a row of presses does not turn into a row of attempts. The editor
		 * reports the outcome as the next status, and by then the button is gone unless the refusal
		 * repeated itself.
		 */
		async retry(): Promise<void>
		{
			if (this.isRetrying || this.adapter === null)
			{
				return;
			}

			this.isRetrying = true;
			this.syncRetrySpinner();

			try
			{
				await this.adapter.retrySave();
			}
			finally
			{
				this.isRetrying = false;
				this.syncRetrySpinner();
			}
		},
		/** The wait is laid over the button itself, so it keeps its place in the tab order and the focus. */
		syncRetrySpinner(): void
		{
			const control = this.$el instanceof HTMLElement
				? this.$el.querySelector(`[data-header-action="${RetryControl}"]`)
				: null
			;

			if (!(control instanceof HTMLElement))
			{
				this.destroyRetrySpinner();

				return;
			}

			Dom.attr(control, 'aria-busy', String(this.isRetrying));

			if (this.isRetrying)
			{
				this.retrySpinner ??= markRaw(new ButtonSpinner());
				this.retrySpinner.showOver(control);

				return;
			}

			this.destroyRetrySpinner();
		},
		destroyRetrySpinner(): void
		{
			this.retrySpinner?.destroy();
			this.retrySpinner = null;
		},
		/**
		 * The indicator appears together with the very message it would have to announce, and a live
		 * region born with its content is not read at all: the outcome goes through the announcer. The
		 * saving under way is not an outcome and is left to be seen rather than heard, and neither is
		 * the label of the autosaving: it states the mode of the opening and never changes afterwards.
		 */
		announceOutcome(): void
		{
			if (this.state === 'neutral' || this.isSaving || this.isAutosave)
			{
				return;
			}

			LiveAnnouncer.announce(this.message, this.isFailed ? 'assertive' : 'polite');
		},
		syncSpinner(): void
		{
			const target = this.$refs.spinnerBox;
			if (!(target instanceof HTMLElement))
			{
				this.spinner?.hide();

				return;
			}

			this.spinner ??= markRaw(new Loader({ size: IconSize, mode: 'inline' })) as unknown as Spinner;
			this.spinner.show(target);
		},
	},
	template: `
		<div
			v-if="isPresent"
			class="disk-document-header-save-status"
			:class="{ '--failed': isFailed }"
			:data-testid="HeaderTestId.SaveStatus"
		>
			<div v-if="isSaving" ref="spinnerBox" class="disk-document-header-save-status__spinner"></div>
			<BIcon
				v-if="hasIcon"
				class="disk-document-header-save-status__icon"
				:name="icon"
				:color="iconColor"
				:size="IconSize"
			/>
			<TextXs class="disk-document-header-save-status__text">{{ message }}</TextXs>
			<UiButton
				v-if="canRetry"
				class="disk-document-header-save-status__retry"
				:text="retryCaption"
				:dataset="{ headerAction: RetryControl, testid: HeaderTestId.SaveStatusRetry }"
				:size="ButtonSize.EXTRA_SMALL"
				:style="AirButtonStyle.PLAIN_ACCENT"
				@click="handleRetry"
			/>
		</div>
	`,
});

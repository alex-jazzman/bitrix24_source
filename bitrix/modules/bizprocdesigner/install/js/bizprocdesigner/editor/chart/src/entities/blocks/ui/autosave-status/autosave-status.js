import './autosave-status.css';
import { LiveAnnouncer } from 'ui.a11y';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

import { Loader } from '../../../../shared/ui';
import { useLoc, type GetMessage } from '../../../../shared/composables';
import { formatRelativeTime, getNextRelativeTimeChange } from '../../../../shared/utils';
// eslint-disable-next-line no-unused-vars
import { type SaveStatus } from '../../../../shared/types';
import { SAVE_STATUSES, EDITOR_LOCK_REASONS } from '../../stores/diagram';

const LOCK_REASON_MESSAGE_IDS = {
	[EDITOR_LOCK_REASONS.TEMPLATE_DELETED]: 'BIZPROCDESIGNER_EDITOR_TEMPLATE_DELETED_TOAST',
	[EDITOR_LOCK_REASONS.WRITE_ACCESS_LOST]: 'BIZPROCDESIGNER_EDITOR_WRITE_ACCESS_LOST_TOAST',
};

const HINT_BACKGROUND_COLOR = '#085DC1';

const STATUS_HINT_POPUP_OPTIONS = {
	width: 339,
	offsetTop: 20,
	background: HINT_BACKGROUND_COLOR,
};

const RETRY_HINT_POPUP_OPTIONS = {
	offsetTop: 8,
	background: HINT_BACKGROUND_COLOR,
};

const STATUS_ICON_SIZE = 22;
const RETRY_ICON_SIZE = 20;

const SAVED_ICON_COLOR = 'var(--ui-color-accent-main-primary)';
const ERROR_ICON_COLOR = 'var(--ui-color-accent-main-alert)';
const RETRY_ICON_COLOR = 'var(--ui-color-base-90)';

/**
 * A save that finishes sooner than this never reaches the header: showing and hiding
 * "Saving..." within a few dozen milliseconds reads as a glitch, not as progress.
 * The measured draft save on a local portal takes 50-100 ms, so the value has to stay
 * clear of that range while remaining below the delay a person notices as waiting.
 */
const SAVING_VISIBILITY_DELAY = 300;

type AutosaveStatusSetup = {
	getMessage: GetMessage,
	iconSet: typeof Outline,
	statusIconSize: number,
	retryIconSize: number,
	savedIconColor: string,
	errorIconColor: string,
	retryIconColor: string,
};

// @vue/component
export const AutosaveStatus = {
	name: 'BizprocdesignerAutosaveStatus',
	components: {
		BIcon,
		Loader,
	},
	directives: {
		hint,
	},
	props: {
		/** @type SaveStatus */
		saveStatus: {
			type: String,
			required: true,
		},
		/** Point in time in milliseconds, the same base as Date.now(); null when nothing is saved yet. */
		lastSavedAt: {
			type: Number,
			default: null,
		},
		/** A locked editor cannot save anything, so the retry is not offered there. */
		readonly: {
			type: Boolean,
			default: false,
		},
		/** Which verdict locked the editor; decides the wording of the error hint. */
		lockReason: {
			type: String,
			default: null,
		},
	},
	emits: ['retry'],
	setup(): AutosaveStatusSetup
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			iconSet: Outline,
			statusIconSize: STATUS_ICON_SIZE,
			retryIconSize: RETRY_ICON_SIZE,
			savedIconColor: SAVED_ICON_COLOR,
			errorIconColor: ERROR_ICON_COLOR,
			retryIconColor: RETRY_ICON_COLOR,
		};
	},
	data(): { visibleStatus: SaveStatus, accessibleSavedHintText: string }
	{
		return {
			visibleStatus: this.saveStatus,
			accessibleSavedHintText: '',
		};
	},
	computed: {
		isSaving(): boolean
		{
			return this.visibleStatus === SAVE_STATUSES.SAVING;
		},
		hasError(): boolean
		{
			return this.visibleStatus === SAVE_STATUSES.ERROR;
		},
		/**
		 * Reads the actual status, not the delayed one: within SAVING_VISIBILITY_DELAY the retry
		 * is still on screen while the save it started is already running, and a second click
		 * would send the whole graph a second time.
		 */
		isRetryBlocked(): boolean
		{
			return this.saveStatus === SAVE_STATUSES.SAVING;
		},
		errorHint(): HintParams
		{
			// A locked editor always means a server verdict, never a broken connection, so the
			// hint must not offer the network explanation. Which verdict it was decides the
			// wording: a template known to be gone is named directly, while a refusal the server
			// deliberately leaves ambiguous names both of its possible causes.
			const messageId = this.readonly
				? LOCK_REASON_MESSAGE_IDS[this.lockReason] ?? 'BIZPROCDESIGNER_EDITOR_TEMPLATE_DELETED_TOAST'
				: 'BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED_HINT';

			return {
				text: this.getMessage(messageId),
				popupOptions: STATUS_HINT_POPUP_OPTIONS,
			};
		},
		retryHint(): HintParams
		{
			return {
				text: this.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_RETRY'),
				popupOptions: RETRY_HINT_POPUP_OPTIONS,
			};
		},
	},
	watch: {
		saveStatus(status: SaveStatus): void
		{
			this.clearSavingDelay();

			if (status === SAVE_STATUSES.SAVING)
			{
				// Only the step into `saving` waits: the previous status stays on screen meanwhile,
				// so a fast save is silent while a slow one still reports itself. Both terminal
				// statuses skip the timer, so neither success nor failure can be delayed or lost.
				this.savingDelay = setTimeout(() => {
					this.visibleStatus = status;
				}, SAVING_VISIBILITY_DELAY);

				return;
			}

			this.visibleStatus = status;
		},
		visibleStatus(status: SaveStatus): void
		{
			this.announceStatus(status);
			this.refreshAccessibleSavedHintText();
			this.scheduleAccessibleSavedHintRefresh();
		},
		lastSavedAt(): void
		{
			this.refreshAccessibleSavedHintText();
			this.scheduleAccessibleSavedHintRefresh();
		},
	},
	created(): void
	{
		this.savingDelay = null;
		this.accessibleSavedHintRefresh = null;
		this.refreshAccessibleSavedHintText();
	},
	mounted(): void
	{
		this.scheduleAccessibleSavedHintRefresh();
	},
	beforeUnmount(): void
	{
		this.clearSavingDelay();
		this.clearAccessibleSavedHintRefresh();
	},
	methods: {
		refreshAccessibleSavedHintText(): void
		{
			this.accessibleSavedHintText = this.savedHint().text;
		},
		scheduleAccessibleSavedHintRefresh(): void
		{
			this.clearAccessibleSavedHintRefresh();

			// The condition follows the branch that is actually rendered, not a single status:
			// the template shows "Saved" for everything but `saving` and `error`, so the start
			// of a session (`idle` with a server time) needs the timer just as much.
			if (this.isSaving || this.hasError)
			{
				return;
			}

			// The wording boundaries belong to the utility, so the copy in the markup is
			// refreshed exactly when the hover hint starts reading differently.
			const changeIn = getNextRelativeTimeChange(this.lastSavedAt);
			if (changeIn === null)
			{
				return;
			}

			// One millisecond past the boundary: a timer firing exactly on it can still read
			// the wording the boundary replaces.
			this.accessibleSavedHintRefresh = setTimeout(() => {
				this.accessibleSavedHintRefresh = null;
				this.refreshAccessibleSavedHintText();
				this.scheduleAccessibleSavedHintRefresh();
			}, changeIn + 1);
		},
		clearAccessibleSavedHintRefresh(): void
		{
			clearTimeout(this.accessibleSavedHintRefresh);
			this.accessibleSavedHintRefresh = null;
		},
		announceStatus(status: SaveStatus): void
		{
			if (status === SAVE_STATUSES.SAVING)
			{
				LiveAnnouncer.announce(
					this.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_SAVING'),
					'polite',
				);

				return;
			}

			if (status === SAVE_STATUSES.ERROR)
			{
				LiveAnnouncer.announce(
					this.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED'),
					'assertive',
				);

				return;
			}

			if (status === SAVE_STATUSES.SAVED)
			{
				LiveAnnouncer.announce(
					this.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_SAVED'),
					'polite',
				);
			}
		},
		clearSavingDelay(): void
		{
			clearTimeout(this.savingDelay);
			this.savingDelay = null;
		},
		/**
		 * Given to v-hint as a function on purpose: the directive resolves it on every hover
		 * (`getParams()`), so the relative time cannot go stale while the editor stays open.
		 */
		savedHint(): HintParams
		{
			const savedAt = formatRelativeTime(this.lastSavedAt, this.getMessage);
			const text = savedAt === ''
				? this.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_SAVED_HINT')
				: this.getMessage(
					'BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_SAVED_HINT_WITH_TIME',
					{ '#TIME#': savedAt },
				)
			;

			return {
				text,
				popupOptions: STATUS_HINT_POPUP_OPTIONS,
			};
		},
	},
	template: `
		<div
			v-if="isSaving"
			class="bizprocdesigner-editor-header-save-status-box"
			:data-testid="$testId('bizprocdesigner-autosave-status-saving')"
		>
			<div class="bizprocdesigner-editor-header-save-status-box__indicator">
				<Loader/>
			</div>
			{{ getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_SAVING') }}
		</div>
		<div
			v-else-if="hasError"
			v-hint="errorHint"
			class="bizprocdesigner-editor-header-save-status-box"
			:data-testid="$testId('bizprocdesigner-autosave-status-error')"
		>
			<BIcon
				:name="iconSet.CIRCLE_CROSS"
				:size="statusIconSize"
				:color="errorIconColor"
				aria-hidden="true"
			/>
			{{ getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED') }}
			<button
				v-if="!readonly"
				type="button"
				v-hint="retryHint"
				class="bizprocdesigner-editor-header-save-status-retry"
				:disabled="isRetryBlocked"
				:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_RETRY')"
				:data-testid="$testId('bizprocdesigner-autosave-status-retry-button')"
				@click="$emit('retry')"
			>
				<BIcon
					:name="iconSet.REFRESH"
					:size="retryIconSize"
					:color="retryIconColor"
					aria-hidden="true"
				/>
			</button>
		</div>
		<div
			v-else
			v-hint="savedHint"
			class="bizprocdesigner-editor-header-save-status-box"
			:data-testid="$testId('bizprocdesigner-autosave-status-saved')"
		>
			<BIcon
				:name="iconSet.CIRCLE_CHECK"
				:size="statusIconSize"
				:color="savedIconColor"
				aria-hidden="true"
			/>
			{{ getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_SAVED') }}
			<visually-hidden>{{ accessibleSavedHintText }}</visually-hidden>
		</div>
		<div
			class="bizprocdesigner-editor-header-save-status-icon-warmup"
			aria-hidden="true"
		>
			<BIcon :name="iconSet.CIRCLE_CROSS"/>
			<BIcon :name="iconSet.REFRESH"/>
		</div>
	`,
};

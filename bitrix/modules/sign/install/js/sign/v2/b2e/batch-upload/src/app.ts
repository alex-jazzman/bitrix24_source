import { Loc } from 'main.core';

import { FileRow } from './components/file-row';
import { getTotalProgress, TotalProgressMode, type TotalProgress } from './total-progress';
import { BatchFileStatus, type BatchFileItem } from './types';

type BatchAppContext = {
	items: BatchFileItem[],
	doneCount: number,
	rejectedNames: string[],
	limitTotal: number,
	limitLeft: number,
};

type BatchAppComputed = BatchAppContext & {
	committingCount: number,
	isCommitting: boolean,
	isLimitReached: boolean,
	totalProgress: TotalProgress,
	isTotalIndeterminate: boolean,
};

const LIMIT_NOTICE_ID_PREFIX = 'sign-b2e-batch-upload-limit-notice';
// The upload look of the bar is the default one, so only the other phases carry a modifier.
const TOTAL_BAR_MODIFIER: Map<string, string> = new Map([
	[TotalProgressMode.committing, '--indeterminate'],
	[TotalProgressMode.done, '--done'],
	[TotalProgressMode.partial, '--partial'],
]);

// The button refers to the notice by id, and a wizard reopened in the slider mounts a second app.
let appCount = 0;

/**
 * View only: the list and the counter come from the data owned by the wizard step through
 * the service. Every user action leaves the app through a callback.
 */
export const BatchUploadApp = {
	name: 'BatchUploadApp',
	components: {
		FileRow,
	},
	props: {
		onRemoveFile: {
			type: Function,
			required: true,
		},
		onRetryFile: {
			type: Function,
			required: true,
		},
		onAddMore: {
			type: Function,
			required: true,
		},
		onClose: {
			type: Function,
			required: true,
		},
		initialLimitTotal: {
			type: Number,
			required: true,
		},
		initialLimitLeft: {
			type: Number,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			limitNoticeId: `${LIMIT_NOTICE_ID_PREFIX}-${++appCount}`,
		};
	},
	data(this: { initialLimitTotal: number, initialLimitLeft: number }): BatchAppContext
	{
		return {
			items: [],
			doneCount: 0,
			rejectedNames: [],
			limitTotal: this.initialLimitTotal,
			limitLeft: this.initialLimitLeft,
		};
	},
	computed: {
		committingCount(this: BatchAppContext): number
		{
			return this.items.filter((item: BatchFileItem) => {
				return item.status === BatchFileStatus.committing;
			}).length;
		},
		isCommitting(this: BatchAppComputed): boolean
		{
			return this.committingCount > 0;
		},
		/**
		 * While the documents are being created the upload is already over, so the uploaded counter
		 * would freeze on a number that says nothing: the phase names itself instead.
		 */
		counterText(this: BatchAppComputed): string
		{
			if (this.isCommitting)
			{
				return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_COMMITTING_COUNTER', {
					'#COUNT#': String(this.committingCount),
				}) ?? '';
			}

			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_COUNTER', {
				'#DONE#': String(this.doneCount),
				'#TOTAL#': String(this.items.length),
			}) ?? '';
		},
		/**
		 * The whole batch in one bar: the rows tell which file is slow, this tells how far the
		 * batch as a whole has got.
		 */
		totalProgress(this: BatchAppContext): TotalProgress
		{
			return getTotalProgress(this.items);
		},
		hasTotalBar(this: BatchAppComputed): boolean
		{
			return this.totalProgress.mode !== TotalProgressMode.none;
		},
		/**
		 * Creating the documents takes one request with no intermediate state to read, so the bar
		 * runs without claiming a value instead of inventing one.
		 */
		isTotalIndeterminate(this: BatchAppComputed): boolean
		{
			return this.totalProgress.mode === TotalProgressMode.committing;
		},
		totalBarModifier(this: BatchAppComputed): string
		{
			return TOTAL_BAR_MODIFIER.get(this.totalProgress.mode) ?? '';
		},
		totalFillStyle(this: BatchAppComputed): { [property: string]: string }
		{
			// the running fill is sized by the stylesheet, which ignores the value
			return { '--sign-b2e-batch-upload-total-fill': String(this.totalProgress.percent / 100) };
		},
		/** Only the upload has a percent of its own; the other phases are named by the counter. */
		totalPercentText(this: BatchAppComputed): string
		{
			if (this.totalProgress.mode !== TotalProgressMode.uploading)
			{
				return '';
			}

			return `${this.totalProgress.percent}%`;
		},
		/**
		 * A progressbar without a value is how ARIA says that the end is unknown, so the running
		 * phase names itself and no number. A finished bar carries an outcome rather than progress:
		 * its value would say nothing about it, as in the rows.
		 */
		totalProgressAttributes(this: BatchAppComputed): { [attribute: string]: string | number }
		{
			if (this.isTotalIndeterminate)
			{
				return {
					role: 'progressbar',
					'aria-label': Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_TOTAL_COMMITTING') ?? '',
				};
			}

			if (this.totalProgress.mode !== TotalProgressMode.uploading)
			{
				return {};
			}

			return {
				role: 'progressbar',
				'aria-label': Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_TOTAL_PROGRESS') ?? '',
				'aria-valuemin': 0,
				'aria-valuemax': 100,
				'aria-valuenow': this.totalProgress.percent,
			};
		},
		limitHintText(this: BatchAppContext): string
		{
			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_LIMIT_HINT', {
				'#LIMIT#': String(this.limitTotal),
			}) ?? '';
		},
		rejectedText(this: BatchAppContext): string
		{
			if (this.rejectedNames.length === 0)
			{
				return '';
			}

			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_REJECTED_NOTICE', {
				'#COUNT#': String(this.rejectedNames.length),
				'#NAMES#': this.rejectedNames.join(', '),
			}) ?? '';
		},
		/**
		 * The remaining places of the process are counted by the wizard step: the list of the window
		 * holds the current batch only, while the limit spans every document of the process.
		 */
		isLimitReached(this: BatchAppContext): boolean
		{
			return this.limitLeft <= 0;
		},
		isAddMoreDisabled(this: BatchAppComputed): boolean
		{
			return this.isCommitting || this.isLimitReached;
		},
		limitReachedText(): string
		{
			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_LIMIT_REACHED') ?? '';
		},
		addMoreText(): string
		{
			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_ADD_MORE') ?? '';
		},
		closeText(): string
		{
			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_CLOSE') ?? '';
		},
	},
	// language=Vue
	template: `
		<div class="sign-b2e-batch-upload" data-testid="sign-batch-upload">
			<div class="sign-b2e-batch-upload__header">
				<div class="sign-b2e-batch-upload__header-line">
					<span
						class="sign-b2e-batch-upload__counter"
						role="status"
						data-testid="sign-batch-upload-counter"
					>
						{{ counterText }}
					</span>
					<span
						v-if="totalPercentText"
						class="sign-b2e-batch-upload__total-percent"
						data-testid="sign-batch-upload-total-percent"
					>{{ totalPercentText }}</span>
				</div>
				<div
					v-if="hasTotalBar"
					class="sign-b2e-batch-upload__total-bar"
					:class="totalBarModifier"
					v-bind="totalProgressAttributes"
					data-testid="sign-batch-upload-total-progress"
				>
					<div
						class="sign-b2e-batch-upload__total-fill"
						:style="totalFillStyle"
					></div>
				</div>
				<span
					class="sign-b2e-batch-upload__limit-hint"
					data-testid="sign-batch-upload-limit-hint"
				>{{ limitHintText }}</span>
			</div>
			<div
				v-if="rejectedText"
				class="sign-b2e-batch-upload__rejected-notice"
				role="alert"
				data-testid="sign-batch-upload-rejected-notice"
			>{{ rejectedText }}</div>
			<!-- A long list scrolls, and a scrollable region has to be reachable by keyboard:
				 without a tab stop of its own its content cannot be scrolled without a mouse. -->
			<div
				class="sign-b2e-batch-upload__list"
				role="list"
				tabindex="0"
				data-testid="sign-batch-upload-list"
			>
				<FileRow
					v-for="item in items"
					:key="item.id"
					:item="item"
					@remove="onRemoveFile"
					@retry="onRetryFile"
				/>
			</div>
			<div
				v-if="isLimitReached"
				class="sign-b2e-batch-upload__limit-notice"
				:id="limitNoticeId"
				role="status"
				data-testid="sign-batch-upload-limit-notice"
			>{{ limitReachedText }}</div>
			<div class="sign-b2e-batch-upload__footer">
				<button
					type="button"
					class="ui-btn ui-btn-light-border"
					:disabled="isAddMoreDisabled"
					:aria-describedby="isLimitReached ? limitNoticeId : null"
					data-testid="sign-batch-upload-add-more-btn"
					@click="onAddMore()"
				>{{ addMoreText }}</button>
				<button
					type="button"
					class="ui-btn ui-btn-primary"
					data-testid="sign-batch-upload-close-btn"
					@click="onClose()"
				>{{ closeText }}</button>
			</div>
		</div>
	`,
};

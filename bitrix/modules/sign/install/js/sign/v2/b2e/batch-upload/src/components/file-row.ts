import { Loc } from 'main.core';

import { getFileErrorText } from '../file-error-text';
import { BatchFileStatus, type BatchFileItem } from '../types';

type FileRowContext = {
	item: BatchFileItem,
};

type FileRowComputed = FileRowContext & {
	isFailed: boolean,
	isDone: boolean,
	isRejected: boolean,
	isCommitting: boolean,
	isFinished: boolean,
	isRemoveHidden: boolean,
	progressPercent: number,
};

export const FileRow = {
	name: 'BatchUploadFileRow',
	props: {
		item: {
			/** @type BatchFileItem */
			type: Object,
			required: true,
		},
	},
	emits: ['remove', 'retry'],
	computed: {
		isFailed(this: FileRowContext): boolean
		{
			return this.item.status === BatchFileStatus.error;
		},
		isDone(this: FileRowContext): boolean
		{
			return this.item.status === BatchFileStatus.done;
		},
		isRejected(this: FileRowContext): boolean
		{
			return this.item.status === BatchFileStatus.rejected;
		},
		/**
		 * The file is uploaded and its id is already in the request creating the documents, so the
		 * row must not offer to remove it: the batch of the request would no longer match the list.
		 */
		isCommitting(this: FileRowContext): boolean
		{
			return this.item.status === BatchFileStatus.committing;
		},
		isFinished(this: FileRowComputed): boolean
		{
			return this.isDone || this.isFailed || this.isRejected;
		},
		statusModifier(this: FileRowContext): string
		{
			return `--${this.item.status}`;
		},
		/**
		 * Committing already sent the file id into the request creating the documents, and a done
		 * row's document already exists on the server: removing either from the list would leave
		 * the document behind, so the button would only look like a cancel without being one.
		 */
		isRemoveHidden(this: FileRowComputed): boolean
		{
			return this.isCommitting || this.isDone;
		},
		/**
		 * The button stays in the row while the file cannot be removed: dropping it from the markup
		 * would reflow the whole list twice around every status change.
		 */
		removeModifier(this: FileRowComputed): string
		{
			return this.isRemoveHidden ? '--hidden' : '';
		},
		progressPercent(this: FileRowContext): number
		{
			return Math.min(Math.max(Math.round(this.item.progress), 0), 100);
		},
		fillStyle(this: FileRowComputed): { [property: string]: string }
		{
			// A finished row fills the whole bar: its tint and mark carry the outcome. A committing
			// row is uploaded whole, and the running total bar of the window carries the wait.
			const fillPercent = this.isFinished || this.isCommitting ? 100 : this.progressPercent;

			return { '--sign-b2e-batch-upload-row-fill': String(fillPercent / 100) };
		},
		statusText(this: FileRowComputed): string
		{
			if (this.isFailed)
			{
				return getFileErrorText(this.item);
			}

			if (this.isRejected)
			{
				return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_REJECTED_BY_LIMIT') ?? '';
			}

			if (this.isDone)
			{
				return '';
			}

			if (this.isCommitting)
			{
				return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_COMMITTING_FILE') ?? '';
			}

			return `${this.progressPercent}%`;
		},
		retryText(): string
		{
			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_RETRY') ?? '';
		},
		retryLabel(this: FileRowContext): string
		{
			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_RETRY_FILE', { '#NAME#': this.item.name }) ?? '';
		},
		removeLabel(this: FileRowContext): string
		{
			return Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_REMOVE_FILE', { '#NAME#': this.item.name }) ?? '';
		},
		/**
		 * The bar is a progressbar only while the file is uploading: a finished or committing row
		 * fills it whatever the progress was, so its value would say nothing about the outcome.
		 */
		progressAttributes(this: FileRowComputed): { [attribute: string]: string | number }
		{
			if (this.isFinished || this.isCommitting)
			{
				return {};
			}

			return {
				role: 'progressbar',
				'aria-label': Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_PROGRESS', { '#NAME#': this.item.name }) ?? '',
				'aria-valuemin': 0,
				'aria-valuemax': 100,
				'aria-valuenow': this.progressPercent,
			};
		},
		/**
		 * A failed or rejected row already says so in its status text, so only the success mark
		 * carries a meaning of its own: without a name it is a colour and a shape.
		 */
		markAttributes(this: FileRowComputed): { [attribute: string]: string }
		{
			if (!this.isDone)
			{
				return {};
			}

			return {
				role: 'img',
				'aria-label': Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_DONE_MARK') ?? '',
			};
		},
	},
	// language=Vue
	template: `
		<div
			class="sign-b2e-batch-upload__row"
			:class="statusModifier"
			role="listitem"
			data-testid="sign-batch-upload-row"
		>
			<div class="sign-b2e-batch-upload__row-bar">
				<div
					class="sign-b2e-batch-upload__row-fill"
					:style="fillStyle"
					v-bind="progressAttributes"
					data-testid="sign-batch-upload-row-progress"
				></div>
				<div class="sign-b2e-batch-upload__row-body">
					<span
						v-if="isFinished"
						class="sign-b2e-batch-upload__row-mark"
						v-bind="markAttributes"
						data-testid="sign-batch-upload-row-mark"
					></span>
					<span class="sign-b2e-batch-upload__row-text">
						<span
							class="sign-b2e-batch-upload__row-name"
							:title="item.name"
							data-testid="sign-batch-upload-row-name"
						>{{ item.name }}</span>
						<span
							v-if="statusText"
							class="sign-b2e-batch-upload__row-status"
							data-testid="sign-batch-upload-row-status"
						>{{ statusText }}</span>
					</span>
				</div>
			</div>
			<button
				v-if="isFailed"
				type="button"
				class="ui-btn ui-btn-link sign-b2e-batch-upload__row-retry"
				:aria-label="retryLabel"
				data-testid="sign-batch-upload-retry-btn"
				@click="$emit('retry', item.id)"
			>{{ retryText }}</button>
			<button
				type="button"
				class="sign-b2e-batch-upload__row-remove --ui-hoverable"
				:class="removeModifier"
				:disabled="isRemoveHidden"
				:aria-label="removeLabel"
				data-testid="sign-batch-upload-remove-btn"
				@click="$emit('remove', item.id)"
			></button>
		</div>
	`,
};

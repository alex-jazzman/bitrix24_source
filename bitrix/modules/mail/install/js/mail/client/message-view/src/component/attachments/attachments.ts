import { Type } from 'main.core';
import { type ComponentOptions, type PropType } from 'ui.vue3';

import { type TrustedComponentContent } from '../../infrastructure/service/component-api/component-api';
import { type AttachmentsHostViewModel } from '../../model/types';

export type AttachmentsStatus = 'hidden' | 'loading' | 'ready' | 'empty' | 'error';
export type AttachmentsErrorKind = 'non-string' | 'network';

export type AttachmentsError = {
	readonly kind: AttachmentsErrorKind,
	readonly cause: unknown,
	readonly generation: number,
};

export type AttachmentsState = {
	readonly messageId: number,
	readonly host: AttachmentsHostViewModel,
	status: AttachmentsStatus,
	error: AttachmentsError | null,
	generation: number,
	hasContent: boolean,
	canRefresh: boolean,
	canRetry: boolean,
	canArchive: boolean,
	canDownload: boolean,
};

export type AttachmentsRefreshIntent = {
	readonly type: 'refresh' | 'retry',
	readonly messageId: number,
	readonly generation: number,
};

export type AttachmentsArchiveIntent = {
	readonly type: 'archive',
	readonly messageId: number,
	readonly generation: number,
};

export type AttachmentsDownloadIntent = {
	readonly type: 'download',
	readonly messageId: number,
	readonly generation: number,
};

export type AttachmentsIntent =
	| AttachmentsRefreshIntent
	| AttachmentsArchiveIntent
	| AttachmentsDownloadIntent
;

export type AttachmentsResponse =
	| {
		readonly status: 'success',
		readonly attachmentsHtml: unknown,
	}
	| {
		readonly status: 'network',
		readonly error: unknown,
	}
;

export type AttachmentsLoadResult =
	| {
		readonly status: 'success',
		readonly content: TrustedComponentContent,
		readonly generation: number,
	}
	| {
		readonly status: 'empty',
		readonly generation: number,
	}
	| {
		readonly status: 'busy' | 'hidden' | 'ignored',
		readonly generation: number,
	}
	| {
		readonly status: 'error',
		readonly error: AttachmentsError,
		readonly generation: number,
	}
;

export type AttachmentsLoader = (intent: AttachmentsRefreshIntent) => Promise<AttachmentsResponse>;
export type AttachmentsChangeListener = (state: Readonly<AttachmentsState>) => void;
export type AttachmentsTrustedContentListener = (
	content: TrustedComponentContent,
	state: Readonly<AttachmentsState>,
) => void;

export type AttachmentsOptions = {
	readonly messageId: number,
	readonly host: AttachmentsHostViewModel,
	readonly loader: AttachmentsLoader,
	readonly hasInitialContent?: boolean,
	readonly canRefresh?: boolean,
	readonly canArchive?: boolean,
	readonly canDownload?: boolean,
	readonly onTrustedContent?: AttachmentsTrustedContentListener,
	readonly onChange?: AttachmentsChangeListener,
};

export type AttachmentsComponentLabels = {
	readonly loading: string,
	readonly empty: string,
	readonly error: string,
	readonly refresh: string,
	readonly retry: string,
	readonly archive: string,
	readonly download: string,
};

export type AttachmentsComponentLabelSources = {
	readonly files?: string | null,
	readonly loading?: string | null,
	readonly error?: string | null,
	readonly refresh?: string | null,
	readonly retry?: string | null,
	readonly archive?: string | null,
	readonly download?: string | null,
};

const LegacyHostAttribute = 'data-mail-message-view-host';
const TestId = {
	root: 'mail-message-view-attachments',
	host: 'mail-message-view-attachments-host',
	status: 'mail-message-view-attachments-status',
	refresh: 'mail-message-view-refresh-attachments',
	archive: 'mail-message-view-download-archive',
	download: 'mail-message-view-download-attachments',
};

function firstFilledLabel(...labels: readonly (string | null | undefined)[]): string | null
{
	const label = labels.find((value) => Type.isString(value) && Type.isStringFilled(value.trim()));

	return Type.isString(label) ? label.trim() : null;
}

function labelOrFallback(label: string | null | undefined, fallback: string): string
{
	return firstFilledLabel(label) ?? fallback;
}

export function createAttachmentsComponentLabels(
	sources: AttachmentsComponentLabelSources,
): AttachmentsComponentLabels | null
{
	const filesSource = firstFilledLabel(sources.files);
	if (!filesSource)
	{
		return null;
	}
	const files = filesSource.replace(/:\s*$/, '');
	if (files === '')
	{
		return null;
	}

	const refresh = labelOrFallback(sources.refresh, files);
	const archive = labelOrFallback(sources.archive, files);

	return {
		loading: labelOrFallback(sources.loading, files),
		empty: files,
		error: labelOrFallback(sources.error, files),
		refresh,
		retry: labelOrFallback(sources.retry, refresh),
		archive,
		download: labelOrFallback(sources.download, archive),
	};
}

function createInitialState(options: AttachmentsOptions): AttachmentsState
{
	const enabled = options.host.enabled;

	return {
		messageId: options.messageId,
		host: options.host,
		status: enabled
			? getInitialVisibleStatus(options.host, options.hasInitialContent === true)
			: 'hidden',
		error: null,
		generation: 0,
		hasContent: enabled && options.hasInitialContent === true,
		canRefresh: enabled && options.canRefresh === true,
		canRetry: false,
		canArchive: enabled && options.canArchive === true,
		canDownload: enabled && options.canDownload === true,
	};
}

function getInitialVisibleStatus(host: AttachmentsHostViewModel, hasInitialContent: boolean): AttachmentsStatus
{
	if (host.hasDeferredContent)
	{
		return 'loading';
	}

	return hasInitialContent ? 'ready' : 'empty';
}

function cloneState(state: AttachmentsState): AttachmentsState
{
	return {
		...state,
		host: { ...state.host },
		error: state.error ? { ...state.error } : null,
	};
}

export class Attachments
{
	#state: AttachmentsState;
	#loader: AttachmentsLoader;
	#onTrustedContent?: AttachmentsTrustedContentListener;
	#onChange?: AttachmentsChangeListener;
	#isLoading = false;
	#destroyed = false;

	constructor(options: AttachmentsOptions)
	{
		this.#loader = options.loader;
		this.#onTrustedContent = options.onTrustedContent;
		this.#onChange = options.onChange;
		this.#state = createInitialState(options);
	}

	getState(): Readonly<AttachmentsState>
	{
		return this.#state;
	}

	getSnapshot(): AttachmentsState
	{
		return cloneState(this.#state);
	}

	refresh(): Promise<AttachmentsLoadResult>
	{
		return this.#load('refresh');
	}

	retry(): Promise<AttachmentsLoadResult>
	{
		if (!this.#state.canRetry)
		{
			return Promise.resolve({
				status: 'ignored',
				generation: this.#state.generation,
			});
		}

		return this.#load('retry');
	}

	beginExternalLoad(): void
	{
		if (this.#destroyed || this.#state.status === 'hidden')
		{
			return;
		}

		this.#beginLoad();
	}

	acceptExternal(response: AttachmentsResponse): AttachmentsLoadResult
	{
		if (this.#destroyed)
		{
			return {
				status: 'ignored',
				generation: this.#state.generation,
			};
		}

		return this.#acceptResponse(response, this.#state.generation);
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#onTrustedContent = undefined;
		this.#onChange = undefined;
	}

	async #load(type: AttachmentsRefreshIntent['type']): Promise<AttachmentsLoadResult>
	{
		if (this.#destroyed)
		{
			return {
				status: 'ignored',
				generation: this.#state.generation,
			};
		}

		if (this.#state.status === 'hidden')
		{
			return {
				status: 'hidden',
				generation: this.#state.generation,
			};
		}

		if (this.#isLoading)
		{
			return {
				status: 'busy',
				generation: this.#state.generation,
			};
		}

		const generation = this.#beginLoad();
		const response = await this.#request({
			type,
			messageId: this.#state.messageId,
			generation,
		});

		if (this.#destroyed || generation !== this.#state.generation)
		{
			return {
				status: 'ignored',
				generation,
			};
		}

		return this.#acceptResponse(response, generation);
	}

	async #request(intent: AttachmentsRefreshIntent): Promise<AttachmentsResponse>
	{
		try
		{
			return await this.#loader(intent);
		}
		catch (error)
		{
			return {
				status: 'network',
				error,
			};
		}
	}

	#beginLoad(): number
	{
		this.#state.generation += 1;
		this.#state.status = 'loading';
		this.#state.error = null;
		this.#state.canRetry = false;
		this.#isLoading = true;
		this.#notify();

		return this.#state.generation;
	}

	#acceptResponse(response: AttachmentsResponse, generation: number): AttachmentsLoadResult
	{
		if (response.status === 'network')
		{
			this.#isLoading = false;
			this.#state.status = 'error';
			this.#state.error = {
				kind: 'network',
				cause: response.error,
				generation,
			};
			this.#state.canRetry = true;
			this.#notify();

			return {
				status: 'error',
				error: this.#state.error,
				generation,
			};
		}

		if (!Type.isString(response.attachmentsHtml))
		{
			this.#isLoading = false;
			this.#state.status = 'empty';
			this.#state.hasContent = false;
			this.#state.error = null;
			this.#state.canRetry = false;
			this.#notify();

			return {
				status: 'empty',
				generation,
			};
		}

		if (response.attachmentsHtml === '')
		{
			this.#isLoading = false;
			this.#state.status = 'empty';
			this.#state.hasContent = false;
			this.#state.error = null;
			this.#state.canRetry = false;
			this.#notify();

			return {
				status: 'empty',
				generation,
			};
		}

		const content: TrustedComponentContent = {
			html: response.attachmentsHtml,
			source: 'componentAction',
		};
		this.#isLoading = false;
		this.#state.status = 'ready';
		this.#state.hasContent = true;
		this.#state.error = null;
		this.#state.canRetry = false;
		this.#onTrustedContent?.(content, this.getSnapshot());
		this.#notify();

		return {
			status: 'success',
			content,
			generation,
		};
	}

	#notify(): void
	{
		this.#onChange?.(this.getSnapshot());
	}
}

function isAttachmentsState(state?: AttachmentsState): boolean
{
	return Boolean(
		state
		&& Number.isInteger(state.messageId)
		&& state.host
		&& Type.isNumber(state.generation),
	);
}

function isAttachmentsRefreshIntent(payload?: AttachmentsRefreshIntent): boolean
{
	return Boolean(
		payload
		&& (payload.type === 'refresh' || payload.type === 'retry')
		&& Number.isInteger(payload.messageId)
		&& Number.isInteger(payload.generation),
	);
}

function isAttachmentsArchiveIntent(payload?: AttachmentsArchiveIntent): boolean
{
	return Boolean(
		payload
		&& payload.type === 'archive'
		&& Number.isInteger(payload.messageId)
		&& Number.isInteger(payload.generation),
	);
}

function isAttachmentsDownloadIntent(payload?: AttachmentsDownloadIntent): boolean
{
	return Boolean(
		payload
		&& payload.type === 'download'
		&& Number.isInteger(payload.messageId)
		&& Number.isInteger(payload.generation),
	);
}

// @vue/component
export const AttachmentsComponent = {
	name: 'MailMessageViewAttachments',
	props: {
		state: {
			type: Object as PropType<AttachmentsState>,
			required: true,
			validator: (state: AttachmentsState): boolean => {
				return isAttachmentsState(state);
			},
		},
		labels: {
			type: Object as PropType<AttachmentsComponentLabels>,
			required: true,
		},
	},
	emits: {
		refresh: (payload?: AttachmentsRefreshIntent): boolean => {
			return isAttachmentsRefreshIntent(payload);
		},
		archive: (payload?: AttachmentsArchiveIntent): boolean => {
			return isAttachmentsArchiveIntent(payload);
		},
		download: (payload?: AttachmentsDownloadIntent): boolean => {
			return isAttachmentsDownloadIntent(payload);
		},
	},
	setup(): Object
	{
		return {
			TestId,
		};
	},
	computed: {
		isVisible(): boolean
		{
			return this.state.status !== 'hidden';
		},
		contentHostId(): string | null
		{
			return this.state.host.ajaxContainerId;
		},
		statusId(): string
		{
			return `${this.state.host.id}-status`;
		},
		statusText(): string
		{
			if (this.state.status === 'loading')
			{
				return this.labels.loading;
			}

			if (this.state.status === 'empty')
			{
				return this.labels.empty;
			}

			if (this.state.status === 'error')
			{
				return this.labels.error;
			}

			return '';
		},
		hasStatus(): boolean
		{
			return this.statusText !== '';
		},
		hasControls(): boolean
		{
			return this.state.canRefresh
				|| this.state.canRetry
				|| this.state.canArchive
				|| this.state.canDownload
			;
		},
	},
	methods: {
		getHostAttribute(hostId: string): Record<string, string>
		{
			return {
				[LegacyHostAttribute]: hostId,
			};
		},
		getRefreshIntent(type: AttachmentsRefreshIntent['type']): AttachmentsRefreshIntent
		{
			return {
				type,
				messageId: this.state.messageId,
				generation: this.state.generation,
			};
		},
		handleRefresh(): void
		{
			this.$emit('refresh', this.getRefreshIntent('refresh'));
		},
		handleRetry(): void
		{
			this.$emit('refresh', this.getRefreshIntent('retry'));
		},
		handleArchive(): void
		{
			this.$emit('archive', {
				type: 'archive',
				messageId: this.state.messageId,
				generation: this.state.generation,
			});
		},
		handleDownload(): void
		{
			this.$emit('download', {
				type: 'download',
				messageId: this.state.messageId,
				generation: this.state.generation,
			});
		},
	},
	template: `
		<section
			v-if="isVisible"
			:id="state.host.id"
			class="mail-msg-view-file-block mail-msg-view-border-bottom mail-message-view-host"
			:class="'mail-message-view-host-' + state.status"
			:data-testid="TestId.root"
			:data-status="state.status"
			:aria-busy="state.status === 'loading' ? 'true' : 'false'"
			:aria-describedby="hasStatus ? statusId : null"
			v-bind="getHostAttribute(state.host.id)"
		>
			<div
				v-if="contentHostId"
				:id="contentHostId"
				class="mail-msg-view-file-inner mail-message-view-host"
				:data-testid="TestId.host"
				v-bind="getHostAttribute(contentHostId)"
			></div>
			<span
				v-if="hasStatus"
				:id="statusId"
				class="mail-message-view-attachments-status"
				:data-testid="TestId.status"
				:role="state.status === 'error' ? 'alert' : 'status'"
				aria-live="polite"
				aria-atomic="true"
			>
				<span
					v-if="state.status === 'loading'"
					class="mail-message-view-loading-spinner"
					aria-hidden="true"
				></span>
				{{ statusText }}
			</span>
			<div
				v-if="hasControls"
				class="mail-msg-view-file-toolbar"
			>
				<div class="mail-msg-view-file-secondary-actions">
					<button
						v-if="state.canRefresh"
						type="button"
						class="mail-msg-refresh-files-button"
						:data-testid="TestId.refresh"
						:disabled="state.status === 'loading'"
						@click="handleRefresh"
					>{{ labels.refresh }}</button>
					<button
						v-if="state.status === 'error' && state.canRetry"
						type="button"
						class="mail-msg-refresh-files-button"
						:disabled="state.status === 'loading'"
						@click="handleRetry"
					>{{ labels.retry }}</button>
				</div>
				<div class="mail-msg-view-file-archive-block">
					<button
						v-if="state.canArchive"
						type="button"
						class="mail-msg-view-file-archive-link"
						:data-testid="TestId.archive"
						@click="handleArchive"
					>{{ labels.archive }}</button>
					<button
						v-if="state.canDownload"
						type="button"
						class="mail-msg-view-file-archive-link"
						:data-testid="TestId.download"
						@click="handleDownload"
					>{{ labels.download }}</button>
				</div>
			</div>
		</section>
	`,
} satisfies ComponentOptions;

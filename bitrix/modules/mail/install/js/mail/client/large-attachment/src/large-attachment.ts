import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import {
	largeAttachmentApi,
	ConvertErrorCode,
	type ConvertError,
	type ConvertResult,
	type LargeAttachmentContext,
} from './api';
import { LinkInserter, type InsertedLink } from './link-inserter';
import { AttachmentIndicator } from './attachment-indicator';
import { SizeDetector } from './size-detector';
import { PostSendPopup, type PostSendPrompt } from './post-send-popup';
import { findOrphanedLinks } from './orphan-detection';
import { MainMailFormAdapter } from './adapter/main-mail-form-adapter';
import {
	type FormAdapterUnsubscribe,
	type LargeAttachmentFormAdapter,
} from './type/form-adapter';

export type DraftLargeAttachment = ConvertResult & {
	sourceFileIds: number[],
	valid?: boolean,
};

export type LargeAttachmentParams = {
	formId: string,
	uploaderControlId: string,
	messageId: number,
	featureAvailable: boolean,
	folderName: string,
	maxSize: number,
	mailboxId?: number | null,
	showAha?: boolean,
	ahaOptionName?: string,
	postSendPromptSuppressed?: boolean,
	postSendPromptOptionName?: string,
	draftLargeAttachments?: DraftLargeAttachment[],
	context?: LargeAttachmentContext,
	postSendPrompt?: PostSendPrompt,
};

// Public signal emitted after a successful conversion for external listeners (analytics/integrations).
const Outcome = Object.freeze({
	Converted: 'BX.Mail.Client.LargeAttachment:converted',
});

export type LargeAttachmentState = 'pending' | 'converting' | 'converted' | 'error';
export type LargeAttachmentSubmitState = 'ready' | 'pending' | 'restored' | 'error';

export class LargeAttachment
{
	static #instances: Map<string, LargeAttachment> = new Map();

	#params: LargeAttachmentParams;
	#formAdapter: LargeAttachmentFormAdapter;
	#detector: SizeDetector;
	#linkInserter: LinkInserter;
	#indicator: AttachmentIndicator;
	#postSendPopup: PostSendPopup;
	#convertedByToken: Map<string, ConvertResult> = new Map();
	#pendingFileIds: Set<number> = new Set();
	#deferredFileIds: Set<number> = new Set();
	#hasDeferredFileChange: boolean = false;
	#pendingConversionCount: number = 0;
	#destroyed: boolean = false;
	#destroyScheduled: boolean = false;
	#state: LargeAttachmentState = 'pending';
	#unsubscribes: FormAdapterUnsubscribe[] = [];

	static init(params: LargeAttachmentParams, formAdapter?: LargeAttachmentFormAdapter): LargeAttachment
	{
		LargeAttachment.#instances.get(params.formId)?.destroy();

		const instance = new this(params, formAdapter);
		LargeAttachment.#instances.set(params.formId, instance);

		return instance;
	}

	static getDraftState(formId: string): DraftLargeAttachment[] | null
	{
		const instance = LargeAttachment.#instances.get(formId);

		return instance ? instance.#getDraftState() : null;
	}

	constructor(params: LargeAttachmentParams, formAdapter?: LargeAttachmentFormAdapter)
	{
		this.#params = params;
		this.#formAdapter = formAdapter ?? new MainMailFormAdapter({
			formId: params.formId,
			uploaderControlId: params.uploaderControlId,
			showAha: params.showAha,
			ahaOptionName: params.ahaOptionName,
		});
		this.#linkInserter = new LinkInserter(this.#formAdapter);
		this.#indicator = new AttachmentIndicator(this.#formAdapter);
		this.#postSendPopup = new PostSendPopup({
			formAdapter: this.#formAdapter,
			getInserted: (): InsertedLink[] => [...this.#convertedByToken.values()],
			suppressed: params.postSendPromptSuppressed ?? false,
			optionName: params.postSendPromptOptionName ?? '',
			showPrompt: params.postSendPrompt,
		});
		this.#postSendPopup.start();

		this.#detector = new SizeDetector({
			formAdapter: this.#formAdapter,
			maxSize: params.maxSize,
			onChange: this.#handleSizeChange,
		});
		this.#restoreDraftState(params.draftLargeAttachments ?? []);
		this.#detector.start();
		this.#unsubscribes = [
			this.#formAdapter.subscribeFileChange((type): void => {
				if (type === 'remove')
				{
					this.#handleItemRemove();
				}
			}),
			this.#formAdapter.subscribeDestroy(this.#handleFormDestroy),
		];
	}

	getState(): LargeAttachmentState
	{
		return this.#state;
	}

	prepareSubmit(): LargeAttachmentSubmitState
	{
		if (this.#state === 'converting' || this.#pendingFileIds.size > 0)
		{
			return 'pending';
		}

		if (this.#state === 'error')
		{
			return 'error';
		}

		const orphaned = findOrphanedLinks(
			this.#formAdapter.getBody(),
			[...this.#convertedByToken.values()],
		);
		if (orphaned.length === 0)
		{
			return 'ready';
		}

		return this.#linkInserter.restore(orphaned) ? 'restored' : 'error';
	}

	getDraftState(): DraftLargeAttachment[]
	{
		return this.#getDraftState();
	}

	#getDraftState(): DraftLargeAttachment[]
	{
		return [...this.#convertedByToken.values()].map((result: ConvertResult): DraftLargeAttachment => ({
			...result,
			sourceFileIds: result.sourceFileIds ?? result.fileIds,
			valid: true,
		}));
	}

	#restoreDraftState(largeAttachments: DraftLargeAttachment[]): void
	{
		const content = this.#formAdapter.getBody();
		if (!Type.isString(content))
		{
			return;
		}
		const editorContent = String(content);

		largeAttachments.forEach((largeAttachment: DraftLargeAttachment): void => {
			if (
				largeAttachment.valid !== false
				&& largeAttachment.token !== ''
				&& this.#isPublicUrlLinked(editorContent, largeAttachment.publicUrl)
			)
			{
				this.#convertedByToken.set(largeAttachment.token, {
					...largeAttachment,
					folderName: largeAttachment.folderName ?? '',
				});

				return;
			}

			this.#removePublicUrlFromEditor(largeAttachment.publicUrl);
		});

		this.#renderSendContract();
		this.#syncIndicator();
	}

	#isPublicUrlLinked(content: string, publicUrl: string): boolean
	{
		if (publicUrl === '')
		{
			return false;
		}

		const documentNode = new DOMParser().parseFromString(content, 'text/html');

		return [...documentNode.querySelectorAll<HTMLAnchorElement>('a[href]')].some(
			(link: HTMLAnchorElement): boolean => (
				link.getAttribute('href') === publicUrl || link.href === publicUrl
			),
		);
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#unsubscribes.forEach((unsubscribe: FormAdapterUnsubscribe): void => {
			unsubscribe();
		});
		this.#unsubscribes = [];
		this.#detector.destroy();
		this.#postSendPopup.destroy();
		this.#indicator.reset();
		this.#formAdapter.destroy();

		if (LargeAttachment.#instances.get(this.#params.formId) === this)
		{
			LargeAttachment.#instances.delete(this.#params.formId);
		}
	}

	#handleSizeChange = (isLarge: boolean, fileIds: number[]): void => {
		if (this.#destroyed || !isLarge)
		{
			return;
		}

		if (this.#params.featureAvailable)
		{
			this.#formAdapter.showAha();
			this.#startConversion(fileIds);
		}
		else
		{
			this.#formAdapter.showTariffUnavailable();
		}
	};

	// Non-blocking: the upload runs while the user keeps typing.
	#startConversion(fileIds: number[], replacementResults: ConvertResult[] | null = null): void
	{
		if (this.#destroyed)
		{
			return;
		}

		const convertedFileIds = new Set(
			[...this.#convertedByToken.values()].flatMap((result: ConvertResult): number[] => result.fileIds),
		);
		const candidateFileIds = replacementResults === null
			? [...new Set(fileIds)].filter((fileId: number): boolean => (
				!convertedFileIds.has(fileId)
			))
			: [...new Set(fileIds)]
		;
		if (candidateFileIds.length === 0)
		{
			return;
		}

		if (this.#pendingConversionCount > 0)
		{
			candidateFileIds.forEach((fileId: number): void => {
				this.#deferredFileIds.add(fileId);
			});
			this.#hasDeferredFileChange = true;

			return;
		}
		const newFileIds = candidateFileIds.filter((fileId: number): boolean => !this.#pendingFileIds.has(fileId));
		if (newFileIds.length === 0)
		{
			return;
		}

		const replacedResults = replacementResults ?? [...this.#convertedByToken.values()];
		const requestFileIds = replacedResults.length > 0
			? [...new Set(this.#readFileObjectIds())]
			: newFileIds;
		requestFileIds.forEach((fileId: number): void => {
			this.#pendingFileIds.add(fileId);
		});
		this.#pendingConversionCount++;
		this.#state = 'converting';
		largeAttachmentApi
			.convert(
				{
					mailboxId: this.#params.mailboxId ?? null,
					fileIds: requestFileIds,
					replacementToken: replacedResults[0]?.token,
				},
				this.#params.context ?? 'mail',
			)
			.then(async (result: ConvertResult): Promise<void> => {
				await this.#handleConverted(result, replacedResults);
				this.#releasePendingFileIds(requestFileIds);
				this.#processDeferredConversion();
			})
			.catch((error: ConvertError): void => {
				this.#releasePendingFileIds(requestFileIds);
				this.#handleConvertError(error, requestFileIds, replacedResults);
				this.#processDeferredConversion();
			});
	}

	#releasePendingFileIds(fileIds: number[]): void
	{
		fileIds.forEach((fileId: number): void => {
			this.#pendingFileIds.delete(fileId);
		});
		this.#pendingConversionCount = Math.max(0, this.#pendingConversionCount - 1);
	}

	#processDeferredConversion(): void
	{
		if (
			this.#state === 'error'
			|| this.#pendingConversionCount > 0
			|| !this.#hasDeferredFileChange
		)
		{
			return;
		}

		const fileIds = [...this.#deferredFileIds];
		this.#deferredFileIds.clear();
		this.#hasDeferredFileChange = false;
		if (fileIds.length === 0)
		{
			this.#handleItemRemove();

			return;
		}
		this.#startConversion(fileIds);
	}

	#handleConverted = async (result: ConvertResult, replacedResults: ConvertResult[]): Promise<void> => {
		if (this.#destroyed)
		{
			if (result.token !== '')
			{
				largeAttachmentApi.deleteUploaded({ token: result.token }).catch((): void => {});
			}

			return;
		}

		if (
			result.token === ''
			|| this.#convertedByToken.has(result.token)
		)
		{
			if (result.token !== '')
			{
				this.#deleteUploaded(result.token);
			}
			this.#state = 'error';
			this.#showUploadError([]);

			return;
		}

		if (!this.#isConversionCurrent(result))
		{
			this.#deleteUploaded(result.token);
			this.#state = 'pending';
			if (this.#isCurrentSetLarge())
			{
				this.#startConversion(this.#readFileObjectIds());
			}
			this.#restartDetector();

			return;
		}

		if (!await this.#finalizeReplacements(replacedResults, result.token))
		{
			this.#state = 'error';
			this.#formAdapter.showUploadError((): void => {
				this.#handleConverted(result, replacedResults);
			});

			return;
		}

		if (!this.#commitConvertedResult(result, replacedResults))
		{
			return;
		}

		EventEmitter.emit(Outcome.Converted, {
			formId: this.#params.formId,
			messageId: this.#params.messageId,
			fileIds: result.fileIds,
			publicUrl: result.publicUrl,
			token: result.token,
		});
	};

	#commitConvertedResult(result: ConvertResult, replacedResults: ConvertResult[]): boolean
	{
		const nextResults = replacedResults.length > 0
			? [result]
			: [...this.#convertedByToken.values(), result];
		if (!this.#updateConvertedLink(result, replacedResults, nextResults))
		{
			if (replacedResults.length === 0)
			{
				this.#deleteUploaded(result.token);
			}
			this.#state = 'error';
			this.#formAdapter.showUploadError((): void => {
				this.#handleConverted(result, replacedResults);
			});

			return false;
		}

		if (replacedResults.length > 0)
		{
			this.#convertedByToken.clear();
		}
		this.#convertedByToken.set(result.token, result);
		this.#syncIndicator();
		this.#state = 'converted';
		if (!this.#isConversionCurrent(result))
		{
			this.#handleItemRemove();
		}
		this.#processDeferredConversion();

		return true;
	}

	async #finalizeReplacements(replacedResults: ConvertResult[], currentToken: string): Promise<boolean>
	{
		const results = await Promise.all(
			replacedResults.map((replacedResult: ConvertResult): Promise<boolean> => (
				this.#finalizeReplacement(replacedResult.token, currentToken)
			)),
		);

		return results.every((result: boolean): boolean => result);
	}

	#finalizeReplacement(previousToken: string, currentToken: string, attemptsLeft = 3): Promise<boolean>
	{
		return largeAttachmentApi
			.finalizeReplacement(previousToken, currentToken)
			.then((): boolean => true)
			.catch((): Promise<boolean> | boolean => (
				attemptsLeft > 1
					? this.#finalizeReplacement(previousToken, currentToken, attemptsLeft - 1)
					: false
			));
	}

	#updateConvertedLink(
		result: ConvertResult,
		replacedResults: ConvertResult[],
		nextResults: ConvertResult[],
	): boolean
	{
		if (replacedResults.length > 0)
		{
			if (!this.#renderSendContract(nextResults))
			{
				return false;
			}

			if (
				this.#linkInserter.replace(replacedResults, result)
				|| this.#linkInserter.insert(result)
			)
			{
				return true;
			}

			this.#renderSendContract();

			return false;
		}

		if (!this.#linkInserter.insert(result))
		{
			return false;
		}

		if (!this.#renderSendContract(nextResults))
		{
			this.#linkInserter.remove([result]);

			return false;
		}

		return true;
	}

	#renderSendContract(results: ConvertResult[] = [...this.#convertedByToken.values()]): boolean
	{
		return this.#formAdapter.serializeSendContracts(
			results.map((result: ConvertResult) => ({
				token: result.token,
				fileIds: [...result.fileIds],
			})),
		);
	}

	#removePublicUrlFromEditor(publicUrl: string): void
	{
		const content = this.#formAdapter.getBody();
		if (!Type.isString(content) || publicUrl === '')
		{
			return;
		}

		const documentNode = new DOMParser().parseFromString(String(content), 'text/html');
		let changed = false;
		documentNode.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link: HTMLAnchorElement): void => {
			if (link.getAttribute('href') === publicUrl || link.href === publicUrl)
			{
				link.remove();
				changed = true;
			}
		});
		if (changed)
		{
			this.#formAdapter.setBody(documentNode.body.innerHTML);
		}
	}

	#handleItemRemove(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		const currentFileIds = new Set(this.#readFileObjectIds());
		if (this.#pendingConversionCount > 0)
		{
			this.#deferredFileIds.clear();
			currentFileIds.forEach((fileId: number): void => {
				this.#deferredFileIds.add(fileId);
			});
			this.#hasDeferredFileChange = true;

			return;
		}
		const invalidated = [...this.#convertedByToken.values()].filter((result: ConvertResult): boolean => (
			result.fileIds.some((fileId: number): boolean => !currentFileIds.has(fileId))
		));
		if (invalidated.length > 0)
		{
			const remainingFileIds = [...currentFileIds];
			if (remainingFileIds.length > 0 && this.#isCurrentSetLarge())
			{
				this.#startConversion(remainingFileIds, invalidated);

				return;
			}

			this.#removeConvertedState(invalidated);
			this.#linkInserter.remove(invalidated);
			invalidated.forEach((result: ConvertResult): void => {
				this.#deleteUploaded(result.token);
			});
		}

		this.#restartDetector();
	}

	#removeConvertedState(links: InsertedLink[]): void
	{
		links.forEach((link: InsertedLink): void => {
			this.#convertedByToken.delete(link.token);
		});

		this.#renderSendContract();
		this.#syncIndicator();
		if (this.#convertedByToken.size === 0)
		{
			this.#state = 'pending';
		}
	}

	#syncIndicator(): void
	{
		this.#indicator.sync(
			[...this.#convertedByToken.values()].flatMap((result: ConvertResult): number[] => result.fileIds),
		);
	}

	#isConversionCurrent(result: ConvertResult): boolean
	{
		const currentFileIds = new Set(this.#readFileObjectIds());

		return result.fileIds.every((fileId: number): boolean => (
			currentFileIds.has(fileId)
		));
	}

	#restartDetector(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#detector.destroy();
		this.#detector = new SizeDetector({
			formAdapter: this.#formAdapter,
			maxSize: this.#params.maxSize,
			onChange: this.#handleSizeChange,
		});
		this.#detector.start();
	}

	#isCurrentSetLarge(): boolean
	{
		const totalRawSize = this.#formAdapter.getFiles().reduce(
			(total: number, file): number => total + file.size,
			0,
		);

		return SizeDetector.exceedsLimit(totalRawSize, this.#params.maxSize);
	}

	#deleteUploaded(token: string): void
	{
		largeAttachmentApi.deleteUploaded({ token }).catch((): void => {});
	}

	// No link is inserted on any error path, so the letter text is never reset (AC-024...AC-027, AC-035).
	#handleConvertError = (
		error: ConvertError,
		fileIds: number[],
		replacedResults: ConvertResult[] = [],
	): void => {
		if (this.#destroyed)
		{
			return;
		}

		this.#state = 'error';
		if (replacedResults.length > 0 && !this.#isCurrentSetLarge())
		{
			this.#removeConvertedState(replacedResults);
			this.#linkInserter.remove(replacedResults);
			replacedResults.forEach((result: ConvertResult): void => this.#deleteUploaded(result.token));
			this.#restartDetector();

			return;
		}

		if (
			error.code === ConvertErrorCode.TariffUnavailable
			|| error.code === ConvertErrorCode.DiskFeatureUnavailable
		)
		{
			this.#formAdapter.showTariffUnavailable();

			return;
		}

		if (error.code === ConvertErrorCode.NoSpace)
		{
			this.#formAdapter.showNoSpaceError((): void => {
				this.#retryConversion(fileIds, replacedResults);
			});

			return;
		}

		this.#showUploadError(fileIds, replacedResults);
	};

	#showUploadError(fileIds: number[], replacedResults: ConvertResult[] = []): void
	{
		this.#formAdapter.showUploadError(
			fileIds.length > 0
				? (): void => this.#retryConversion(fileIds, replacedResults)
				: undefined,
		);
	}

	#retryConversion(fileIds: number[], replacedResults: ConvertResult[] = []): void
	{
		if (this.#destroyed)
		{
			return;
		}

		const currentFileIds = new Set(this.#readFileObjectIds());
		const retryFileIds = fileIds.filter((fileId: number): boolean => currentFileIds.has(fileId));
		if (retryFileIds.length > 0)
		{
			this.#startConversion(retryFileIds, replacedResults.length > 0 ? replacedResults : null);
		}
	}

	#handleFormDestroy = (): void => {
		if (this.#destroyed || this.#destroyScheduled)
		{
			return;
		}

		this.#destroyScheduled = true;
		queueMicrotask((): void => {
			this.#destroyScheduled = false;
			if (!this.#destroyed)
			{
				this.destroy();
			}
		});
	};

	#readFileObjectIds(): number[]
	{
		return this.#formAdapter
			.getFiles()
			.map((file): number | null => file.id)
			.filter((id: number | null): id is number => id !== null)
		;
	}
}

import { Loc, Type } from 'main.core';

import type { CloseGuard, ComposeForm, ComposeSnapshot, DraftGateway, DraftView, SubmitGuard } from './types';

type FlushDecision = 'retry' | 'close-with-risk' | 'cancel';

type CoordinatorOptions = {
	form: ComposeForm,
	connector: Pick<DraftGateway, 'save' | 'get'>,
	debounceDelay?: number,
	draft?: DraftView | null,
	onFlushError?: (error: Error) => Promise<FlushDecision>,
	onStateChange?: (state: { draftId: number | null, revision: number | null }) => void,
	onCloseWithSavedDraft?: () => void,
	onDeleteDraft?: (draftId: number) => Promise<boolean>,
};

export class DraftCoordinator
{
	#form: ComposeForm;
	#connector: Pick<DraftGateway, 'save' | 'get'>;
	#debounceDelay: number;
	#draftId: number | null;
	#revision: number | null;
	#hasPendingChanges = false;
	#inFlight: Promise<void> | null = null;
	#debounceTimer: number | null = null;
	#destroyed = false;
	#saveBlocked = false;
	#lastError: Error | null = null;
	#savedDuringSession = false;
	#closeNotificationSent = false;
	#initialSnapshotFingerprint: string;
	#isNewCompose: boolean;
	#savedSnapshotFingerprint: string;
	#onFlushError: (error: Error) => Promise<FlushDecision>;
	#onStateChange: (state: { draftId: number | null, revision: number | null }) => void;
	#onCloseWithSavedDraft: () => void;
	#onDeleteDraft: (draftId: number) => Promise<boolean>;

	constructor(options: CoordinatorOptions)
	{
		this.#form = options.form;
		this.#connector = options.connector;
		this.#debounceDelay = options.debounceDelay ?? 1000;
		this.#draftId = options.draft?.id ?? null;
		this.#revision = options.draft?.revision ?? null;
		this.#initialSnapshotFingerprint = this.#getSnapshotFingerprint(this.#form.getComposeSnapshot());
		this.#isNewCompose = options.draft == null;
		this.#savedSnapshotFingerprint = this.#initialSnapshotFingerprint;
		this.#onFlushError = options.onFlushError ?? (async () => 'cancel');
		this.#onStateChange = options.onStateChange ?? (() => {});
		this.#onCloseWithSavedDraft = options.onCloseWithSavedDraft ?? (() => {});
		this.#onDeleteDraft = options.onDeleteDraft ?? (async () => false);
		this.#subscribe('MailForm:compose:changed', this.#handleChange);
		this.#subscribe('MailForm:beforeClose', this.#handleBeforeClose);
		this.#subscribe('MailForm:beforeSubmit', this.#handleBeforeSubmit);
		this.#subscribe('MailForm:submit:ajaxSuccess', this.#handleSubmitSuccess);
		this.#subscribe('MailForm:destroy', this.#handleDestroy);
	}

	getState(): { draftId: number | null, revision: number | null }
	{
		return { draftId: this.#draftId, revision: this.#revision };
	}

	async flush(): Promise<void>
	{
		this.#cancelDebounce();
		this.#saveBlocked = false;
		this.#lastError = null;
		while (!this.#destroyed && (this.#hasPendingChanges || this.#inFlight !== null))
		{
			if (this.#inFlight === null)
			{
				this.#startDrain();
			}
			if (this.#inFlight !== null)
			{
				await this.#inFlight;
			}
			if (this.#lastError)
			{
				throw this.#lastError;
			}
		}
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#cancelDebounce();
		this.#hasPendingChanges = false;
		this.#unsubscribe('MailForm:compose:changed', this.#handleChange);
		this.#unsubscribe('MailForm:beforeClose', this.#handleBeforeClose);
		this.#unsubscribe('MailForm:beforeSubmit', this.#handleBeforeSubmit);
		this.#unsubscribe('MailForm:submit:ajaxSuccess', this.#handleSubmitSuccess);
		this.#unsubscribe('MailForm:destroy', this.#handleDestroy);
	}

	#handleChange = (): void => {
		this.markChanged();
	};

	markChanged(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#hasPendingChanges = true;
		this.#saveBlocked = false;
		this.#lastError = null;
		this.#cancelDebounce();
		this.#debounceTimer = window.setTimeout(() => this.#startDrain(), this.#debounceDelay);
	}

	#handleBeforeClose = (guard?: CloseGuard): void => {
		if (!guard || !Type.isFunction(guard.waitUntil))
		{
			return;
		}

		guard.waitUntil(this.#flushForClose(guard));
	};

	#handleBeforeSubmit = (guard?: SubmitGuard): void => {
		if (guard && Type.isFunction(guard.waitUntil))
		{
			guard.waitUntil(this.flush());
		}
	};

	#handleSubmitSuccess = (...args: unknown[]): void => {
		const data = args.at(-1) as { ERROR?: unknown, ERROR_HTML?: unknown } | undefined;
		if (!data?.ERROR && !data?.ERROR_HTML)
		{
			this.destroy();
		}
	};

	#handleDestroy = (): void => {
		this.#notifySavedOnClose();
		this.destroy();
	};

	async #flushForClose(guard: CloseGuard): Promise<void>
	{
		try
		{
			if (this.#shouldDeletePristineDraft())
			{
				await this.#deletePristineDraft();

				return;
			}
			await this.flush();
			this.#notifySavedOnClose();
		}
		catch (error)
		{
			this.#form.showError?.(Loc.getMessage('MAIL_DRAFT_SAVE_ERROR') ?? '');
			const decision = await this.#onFlushError(error instanceof Error ? error : new Error(String(error)));
			if (decision === 'retry')
			{
				await this.#flushForClose(guard);

				return;
			}
			if (decision !== 'close-with-risk')
			{
				guard.preventDefault();
			}
		}
	}

	#notifySavedOnClose(): void
	{
		if (this.#draftId === null || !this.#savedDuringSession || this.#closeNotificationSent)
		{
			return;
		}

		this.#closeNotificationSent = true;
		this.#onCloseWithSavedDraft();
	}

	#shouldDeletePristineDraft(): boolean
	{
		return this.#isNewCompose
			&& this.#getSnapshotFingerprint(this.#form.getComposeSnapshot()) === this.#initialSnapshotFingerprint
		;
	}

	async #deletePristineDraft(): Promise<void>
	{
		this.#cancelDebounce();
		this.#hasPendingChanges = false;
		if (this.#inFlight !== null)
		{
			await this.#inFlight;
		}
		if (this.#lastError)
		{
			throw this.#lastError;
		}
		if (this.#draftId !== null)
		{
			if (!(await this.#onDeleteDraft(this.#draftId)))
			{
				throw new Error('Failed to delete an empty draft.');
			}
			this.#draftId = null;
			this.#revision = null;
			this.#savedSnapshotFingerprint = this.#initialSnapshotFingerprint;
		}
	}

	#startDrain(): void
	{
		this.#cancelDebounce();
		if (this.#destroyed || this.#saveBlocked || this.#inFlight !== null || !this.#hasPendingChanges)
		{
			return;
		}

		this.#inFlight = this.#drain().catch((error) => {
			this.#saveBlocked = true;
			this.#lastError = error instanceof Error ? error : new Error(String(error));
		}).finally(() => {
			this.#inFlight = null;
			if (!this.#destroyed && !this.#saveBlocked && this.#hasPendingChanges)
			{
				this.#startDrain();
			}
		});
	}

	async #drain(): Promise<void>
	{
		while (!this.#destroyed && this.#hasPendingChanges)
		{
			this.#hasPendingChanges = false;
			const snapshot = this.#form.getComposeSnapshot();
			if (this.#getSnapshotFingerprint(snapshot) === this.#savedSnapshotFingerprint)
			{
				continue;
			}
			try
			{
				let conflictRetryCount = 0;
				let draft: DraftView;
				while (true)
				{
					try
					{
						draft = await this.#connector.save({
							draftId: this.#draftId,
							revision: this.#revision,
							snapshot,
						});

						break;
					}
					catch (error)
					{
						if (!this.#isRevisionConflict(error) || this.#draftId === null || conflictRetryCount >= 1)
						{
							throw error;
						}
						conflictRetryCount++;
						if (!(await this.#resetIfDraftWasDeleted(this.#draftId)))
						{
							throw error;
						}
					}
				}
				if (!this.#destroyed)
				{
					this.#savedDuringSession = true;
					this.#draftId = draft.id;
					this.#revision = draft.revision;
					this.#form.syncDraftAttachmentSources?.(
						draft.snapshot.attachments,
						draft.attachments,
						snapshot.attachments,
					);
					this.#savedSnapshotFingerprint = this.#getSnapshotFingerprint(draft.snapshot);
					this.#onStateChange(this.getState());
				}
			}
			catch (error)
			{
				this.#hasPendingChanges = true;
				throw error;
			}
		}
	}

	#getSnapshotFingerprint(snapshot: ComposeSnapshot): string
	{
		return JSON.stringify(snapshot);
	}

	async #resetIfDraftWasDeleted(draftId: number): Promise<boolean>
	{
		try
		{
			await this.#connector.get(draftId);

			return false;
		}
		catch (error)
		{
			if (!this.#isDraftMissing(error))
			{
				throw error;
			}

			// the draft was removed elsewhere, so the retry has to start a new one
			this.#draftId = null;
			this.#revision = null;

			return true;
		}
	}

	#isRevisionConflict(error: unknown): boolean
	{
		return this.#hasErrorCode(error, 'DRAFT_REVISION_CONFLICT');
	}

	#isDraftMissing(error: unknown): boolean
	{
		return this.#hasErrorCode(error, 'DRAFT_NOT_FOUND');
	}

	#hasErrorCode(error: unknown, code: string): boolean
	{
		return (error as { errors?: Array<{ code?: string }> })?.errors
			?.some((item) => item.code === code) === true;
	}

	#cancelDebounce(): void
	{
		if (this.#debounceTimer !== null)
		{
			window.clearTimeout(this.#debounceTimer);
			this.#debounceTimer = null;
		}
	}

	#subscribe(eventName: string, handler: (...data: never[]) => void): void
	{
		if (this.#form.subscribe)
		{
			this.#form.subscribe(eventName, handler);
		}
		else
		{
			BX.addCustomEvent(this.#form, eventName, handler);
		}
	}

	#unsubscribe(eventName: string, handler: (...data: never[]) => void): void
	{
		if (this.#form.unsubscribe)
		{
			this.#form.unsubscribe(eventName, handler);
		}
		else
		{
			BX.removeCustomEvent(this.#form, eventName, handler);
		}
	}
}

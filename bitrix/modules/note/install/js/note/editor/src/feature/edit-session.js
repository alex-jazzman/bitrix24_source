import { CollaborationStatus } from '../collaboration/collaboration-status';
import {
	collectReferencedFileIdsFromContent,
	persistDocument,
	finalizeFileSnapshot,
} from './document-persistence';
import { cloneDocumentContent, createEmptyDocument } from './create-document-state';
import { extractErrorMessage } from '../utils/error-message';

const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 min

export class EditSession
{
	#documentId: number;
	#phase: string;
	#lastSavedSnapshot: string | null;
	#intervalId: number | null;
	#inflightSave: Promise<void> | null;
	#state: Object;
	#readContent: () => Object | null;
	#messages: Object;

	constructor({ documentId, state, readContent, messages })
	{
		this.#documentId = documentId;
		this.#state = state;
		this.#readContent = readContent;
		this.#messages = messages;
		this.#phase = 'editing';
		this.#lastSavedSnapshot = null;
		this.#intervalId = null;
		this.#inflightSave = null;
	}

	get documentId(): number
	{
		return this.#documentId;
	}

	get phase(): string
	{
		return this.#phase;
	}

	get isActive(): boolean
	{
		return this.#phase !== 'closed';
	}

	start(): void
	{
		this.#phase = 'editing';
		this.#state.collaborationStatus = CollaborationStatus.LOCAL;
		this.#startInterval();

		const snapshot = this.#readContent();
		this.#lastSavedSnapshot = JSON.stringify({
			title: this.#state.titleDraft,
			markdown: snapshot,
		});
	}

	async requestAutosave(): Promise<void>
	{
		if (this.#phase !== 'editing')
		{
			return;
		}

		await this.#runSave('autosave');
	}

	async saveAndClose(): Promise<{ success: boolean, error?: string }>
	{
		if (this.#phase === 'autosaving' && this.#inflightSave)
		{
			await this.#inflightSave;
		}

		if (this.#phase !== 'editing')
		{
			return { success: false };
		}

		return this.#runSave('manual');
	}

	async discardAndClose(): Promise<void>
	{
		this.#stopInterval();

		const persistedContent = cloneDocumentContent(this.#state.content || createEmptyDocument());
		const referencedFileIds = collectReferencedFileIdsFromContent(persistedContent);
		await finalizeFileSnapshot(this.#documentId, referencedFileIds);

		this.#phase = 'closed';
		this.#state.isSaving = false;
	}

	async beforeRouteLeave(): Promise<void>
	{
		if (this.#phase === 'closed')
		{
			return;
		}

		try
		{
			if (this.#inflightSave)
			{
				await this.#inflightSave;
			}
			else if (this.#phase === 'editing')
			{
				await this.#runSave('autosave');
			}
		}
		finally
		{
			this.#teardown();
		}
	}

	destroy(): void
	{
		this.#teardown();
	}

	async #runSave(reason: string): Promise<{ success: boolean, error?: string }>
	{
		if (this.#phase !== 'editing')
		{
			return { success: false };
		}

		const title = String(this.#state.titleDraft || '').trim();
		if (!title)
		{
			return reason === 'manual'
				? { success: false, error: this.#messages.titleRequired }
				: { success: false }
			;
		}

		const markdown = this.#readContent();
		if (!markdown)
		{
			return reason === 'manual'
				? { success: false, error: this.#messages.saveError }
				: { success: false };
		}

		const snapshot = JSON.stringify({ title, markdown });
		if (reason === 'autosave' && snapshot === this.#lastSavedSnapshot)
		{
			return { success: false };
		}

		const savePhase = reason === 'manual' ? 'saving' : 'autosaving';
		this.#phase = savePhase;
		this.#state.isSaving = true;
		if (savePhase === 'autosaving')
		{
			this.#state.collaborationStatus = CollaborationStatus.AUTOSAVING;
		}
		else
		{
			this.#state.errorMessage = '';
		}

		try
		{
			const promise = persistDocument({
				documentId: this.#documentId,
				title,
				markdown,
			});
			this.#inflightSave = promise;
			await promise;
		}
		catch (error)
		{
			if (this.#phase === savePhase)
			{
				this.#phase = 'editing';
				this.#state.isSaving = false;
				this.#state.collaborationStatus = CollaborationStatus.LOCAL;
				if (reason === 'manual')
				{
					this.#startInterval();
				}
			}

			return reason === 'manual'
				? { success: false, error: extractErrorMessage(error, this.#messages.saveError) }
				: { success: false };
		}
		finally
		{
			this.#inflightSave = null;
		}

		if (this.#phase !== savePhase)
		{
			return { success: false };
		}

		this.#state.title = title;
		this.#state.titleDraft = title;
		this.#state.content = cloneDocumentContent(markdown);
		this.#lastSavedSnapshot = snapshot;

		if (reason === 'manual')
		{
			this.#teardown();
		}
		else
		{
			this.#state.isSaving = false;
			this.#state.collaborationStatus = CollaborationStatus.LOCAL;
			this.#phase = 'editing';
		}

		return { success: true };
	}

	#startInterval(): void
	{
		this.#stopInterval();
		this.#intervalId = setInterval(() => {
			this.requestAutosave();
		}, AUTOSAVE_INTERVAL_MS);
	}

	#stopInterval(): void
	{
		if (this.#intervalId !== null)
		{
			clearInterval(this.#intervalId);
			this.#intervalId = null;
		}
	}

	#teardown(): void
	{
		this.#stopInterval();
		this.#phase = 'closed';
		this.#state.isSaving = false;
	}
}

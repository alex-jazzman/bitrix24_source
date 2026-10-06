import { Runtime, Type } from 'main.core';
import { type DraftLargeAttachment } from 'mail.client.large-attachment';

import { DraftComposeAdapter, type DraftIntegrationParams } from './draft-compose-adapter';

export type DraftRestoreResult = {
	restored: boolean,
	largeAttachments?: DraftLargeAttachment[],
};

type DraftCoordinator = {
	destroy(): void,
	markChanged(): void,
};

type DraftExtension = {
	bootstrapMailDraft?(options: {
		form: DraftComposeAdapter,
		clientId: string,
		draftId?: number | null,
		onDraftIdChange?: (draftId: number, revision: number) => void,
	}): Promise<DraftCoordinator | null>,
};

type DraftIntegrationOptions = DraftIntegrationParams & {
	completeRestore?: (result: DraftRestoreResult) => Promise<void>,
};

export class DraftIntegration
{
	#params: DraftIntegrationOptions;
	#adapter: DraftComposeAdapter;
	#coordinator: DraftCoordinator | null = null;
	#resolveRestore: (result: DraftRestoreResult) => void = (): void => {};
	#restore: Promise<DraftRestoreResult>;
	#destroyed = false;
	#changedBeforeCoordinator = false;

	constructor(params: DraftIntegrationOptions)
	{
		this.#params = params;
		this.#adapter = new DraftComposeAdapter(params);
		this.#adapter.subscribe('MailForm:compose:changed', (): void => {
			if (!this.#coordinator)
			{
				this.#changedBeforeCoordinator = true;
			}
		});
		this.#restore = new Promise((resolve): void => {
			this.#resolveRestore = resolve;
		});
	}

	get restore(): Promise<DraftRestoreResult>
	{
		return this.#restore;
	}

	async start(): Promise<void>
	{
		if (!Type.isStringFilled(this.#params.state.draft.clientId))
		{
			await this.#completeRestore({ restored: false });
			this.#adapter.releaseDraftLoading();

			return;
		}

		this.#adapter.holdDraftLoading();
		try
		{
			const extension = await Runtime.loadExtension('mail.draft') as DraftExtension;
			if (this.#destroyed)
			{
				this.#resolveRestore({ restored: false });

				return;
			}

			if (!Type.isFunction(extension.bootstrapMailDraft))
			{
				await this.#completeRestore({ restored: false });

				return;
			}

			const coordinator = await extension.bootstrapMailDraft({
				form: this.#adapter,
				clientId: this.#params.state.draft.clientId,
				draftId: this.#params.state.draft.id || null,
				onDraftIdChange: (draftId: number, revision: number): void => {
					this.#params.state.draft.id = draftId;
					this.#params.state.draft.revision = revision;
				},
			});
			if (this.#destroyed)
			{
				coordinator?.destroy();

				return;
			}

			this.#coordinator = coordinator;
			if (coordinator && this.#changedBeforeCoordinator)
			{
				coordinator.markChanged();
				this.#changedBeforeCoordinator = false;
			}
			const result = {
				restored: this.#adapter.restored,
				largeAttachments: this.#adapter.largeAttachments,
			};
			await this.#completeRestore(result);
		}
		catch
		{
			await this.#completeRestore({ restored: false });
		}
		finally
		{
			this.#adapter.releaseDraftLoading();
		}
	}

	async #completeRestore(result: DraftRestoreResult): Promise<void>
	{
		try
		{
			await this.#params.completeRestore?.(result);
		}
		catch
		{
			// An optional post-restore feature must not leave the compose form locked.
		}
		this.#resolveRestore(result);
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#adapter.destroy();
		this.#coordinator?.destroy();
		this.#coordinator = null;
		this.#resolveRestore({ restored: false });
	}
}

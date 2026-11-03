import { type TypeFormAdapter } from '../infrastructure/service/type-form-adapter';

export type DeleteTypeDeps = {
	isWaiting: () => boolean;
	setWaiting: (waiting: boolean) => void;
	confirm: (callbacks: { onAccept: () => Promise<void>, onCancel: () => void }) => void;
	sendAnalytics: (status: 'attempt' | 'success' | 'error' | 'cancel') => void;
	requestDelete: () => ReturnType<TypeFormAdapter['delete']>;
	afterDelete: (response: Awaited<ReturnType<TypeFormAdapter['delete']>>) => void;
	showErrors: (errors: string[]) => void;
	commitSnapshot: () => void;
	markCancelEventRegistered: () => void;
};

export class DeleteType
{
	#deps: DeleteTypeDeps;
	#isDialogOpen: boolean = false;
	#inProgress: boolean = false;

	constructor(deps: DeleteTypeDeps)
	{
		this.#deps = deps;
	}

	execute(): void
	{
		const deps = this.#deps;
		if (this.#isDialogOpen || this.#inProgress || deps.isWaiting())
		{
			return;
		}

		this.#isDialogOpen = true;
		deps.confirm({
			onAccept: () => this.#delete(),
			onCancel: () => {
				if (this.#inProgress || !this.#isDialogOpen)
				{
					return;
				}

				this.#isDialogOpen = false;
				deps.sendAnalytics('cancel');
			},
		});
	}

	async #delete(): Promise<void>
	{
		const deps = this.#deps;
		if (this.#inProgress || !this.#isDialogOpen)
		{
			return;
		}

		if (deps.isWaiting())
		{
			this.#isDialogOpen = false;

			return;
		}

		this.#inProgress = true;
		deps.setWaiting(true);
		deps.sendAnalytics('attempt');

		try
		{
			const response = await deps.requestDelete();
			deps.sendAnalytics('success');
			deps.markCancelEventRegistered();
			deps.commitSnapshot();
			this.#inProgress = false;
			this.#isDialogOpen = false;
			deps.setWaiting(false);
			deps.afterDelete(response);
		}
		catch (errors)
		{
			deps.sendAnalytics('error');
			deps.showErrors(Array.isArray(errors) ? errors : [String(errors)]);
			this.#inProgress = false;
			this.#isDialogOpen = false;
			deps.setWaiting(false);
		}
	}
}

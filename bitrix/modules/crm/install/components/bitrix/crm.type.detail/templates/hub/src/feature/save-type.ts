import { type TypeFormAdapter } from '../infrastructure/service/type-form-adapter';
import { createSaveRequest } from '../lib/save-request/save-request';
import { type TypeHubValues } from '../model/type-hub-store';

declare const BX: any;

export type SaveTypeDeps = {
	adapter: Pick<TypeFormAdapter, 'save'>;
	getValues: () => TypeHubValues;
	// Brings free-text fields to their stored form before the payload is read, so the snapshot committed
	// below matches what the server receives.
	normalizeValues: () => void;
	commitSnapshot: (values: TypeHubValues) => void;
	getTypeId: () => number;
	isRestricted: boolean;
	isWaiting: () => boolean;
	sendAnalytics: (status: 'attempt' | 'success' | 'error', id?: number) => void;
	showRestriction: () => void;
	afterSave: (response: Awaited<ReturnType<TypeFormAdapter['save']>>) => void;
	setWaiting: (waiting: boolean) => void;
	showErrors: (errors: string[]) => void;
	// Suppresses the duplicate cancel analytics after a successful save (prod #isCancelEventRegistered).
	markCancelEventRegistered: () => void;
};

// Save flow with full parity to prod: restriction gate before reading state, double-click
// guard, panel wait state, single request through crm.type-model, afterSave (setUrlTemplates, then
// resolveAfterSaveAction decides whether the screen stays, goes to the created type or closes), errors to
// the shared banner, analytics attempt/success/error.
export class SaveType
{
	#deps: SaveTypeDeps;
	#inProgress: boolean = false;

	constructor(deps: SaveTypeDeps)
	{
		this.#deps = deps;
	}

	execute(): void
	{
		const deps = this.#deps;

		if (deps.isRestricted)
		{
			deps.showRestriction();

			return;
		}

		if (this.#inProgress || deps.isWaiting())
		{
			return;
		}

		this.#inProgress = true;
		deps.normalizeValues();
		const request = createSaveRequest(deps.getValues, deps.commitSnapshot);
		deps.setWaiting(true);

		deps.sendAnalytics('attempt');

		deps.adapter.save(request.values).then((response) => {
			deps.sendAnalytics('success', deps.getTypeId());

			deps.markCancelEventRegistered();
			request.commit();
			this.#inProgress = false;
			deps.setWaiting(false);
			deps.afterSave(response);
		}).catch((errors) => {
			deps.sendAnalytics('error', deps.getTypeId());

			deps.showErrors(errors);
			this.#inProgress = false;
			deps.setWaiting(false);
		});
	}
}

export function getCurrentSlider(): any
{
	return BX.SidePanel?.Instance?.getSliderByWindow(window);
}

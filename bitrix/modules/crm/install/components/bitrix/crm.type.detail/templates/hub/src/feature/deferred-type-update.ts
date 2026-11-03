export type TypeUpdatedPayload = { isUrlChanged: boolean };

// The slider's own data (BX.SidePanel.Dictionary): it lives in the top window and survives a
// navigation of the frame.
export type PendingTypeUpdateStorage = {
	has(key: string): boolean,
	get(key: string): unknown,
	set(key: string, value: boolean): void,
	delete(key: string): void,
};

const PENDING_KEY = 'crmTypeDetailHubPendingTypeUpdate';

// The "type updated" event of a save that leaves the slider open, held until the slider really closes.
// Sent at once it would reach the page behind the slider, and the list of items, the kanban and — on a
// placement change — the list of types answer it by reloading the top window, slider included: for the
// user that is the same "it closed". One event per life of the slider; isUrlChanged is the OR of every
// save it saw. The only dependency is the emitter itself, so the class stays unit-testable without BX.
export class DeferredTypeUpdate
{
	#emit: (payload: TypeUpdatedPayload) => void;
	#isPending: boolean = false;
	#isUrlChanged: boolean = false;

	constructor(emit: (payload: TypeUpdatedPayload) => void)
	{
		this.#emit = emit;
	}

	// A successful save, the slider stays: remember it.
	defer(isUrlChanged: boolean): void
	{
		this.#isPending = true;
		this.#isUrlChanged = this.#isUrlChanged || isUrlChanged;
	}

	// The slider is closing: one event with what was collected, then forget it. Nothing collected —
	// nothing sent.
	flush(storage?: PendingTypeUpdateStorage): void
	{
		if (storage)
		{
			this.pickUp(storage);
		}

		if (!this.#isPending)
		{
			return;
		}

		const payload: TypeUpdatedPayload = { isUrlChanged: this.#isUrlChanged };
		// Forgotten before the send, so a close that re-enters here from the listener sends nothing twice.
		this.#forget();
		this.#emit(payload);
	}

	// Another action sends its own event right now (delete): its flag OR the collected one goes into that
	// event, and what was collected is forgotten, so the close that follows sends no second one.
	absorb(isUrlChanged: boolean): boolean
	{
		const result = isUrlChanged || this.#isUrlChanged;
		this.#forget();

		return result;
	}

	// The frame leaves for another address inside the same slider (creation → settings of the new type):
	// what was collected would die with this window, so it is parked in the slider's data together with
	// this save, and the hub that loads there picks it up (pickUp).
	handOver(storage: PendingTypeUpdateStorage, isUrlChanged: boolean): void
	{
		storage.set(PENDING_KEY, isUrlChanged || this.#isUrlChanged);
		this.#forget();
	}

	pickUp(storage: PendingTypeUpdateStorage): void
	{
		if (!storage.has(PENDING_KEY))
		{
			return;
		}

		this.defer(storage.get(PENDING_KEY) === true);
		storage.delete(PENDING_KEY);
	}

	#forget(): void
	{
		this.#isPending = false;
		this.#isUrlChanged = false;
	}
}

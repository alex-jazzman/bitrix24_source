import { Event } from 'main.core';
import { AccessibilityLogger } from '../accessibility-logger/accessibility-logger';

export type PointerType = 'mouse' | 'pen' | 'touch';
export type InputModality = 'keyboard' | 'pointer' | 'unknown';

const NAV_KEYS = new Set(['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

const POINTER_TYPES: Set<PointerType> = new Set(['mouse', 'pen', 'touch']);

/**
 * @memberof BX.UI.Accessibility
 */
export class InputModalityTracker
{
	#modality: InputModality = 'unknown';
	#pointerType: PointerType | null = null;
	#lastNavKey: string | null = null;
	#lastNavShift: boolean = false;
	#attachedDocs: WeakRef<Document>[] = [];
	#detachHandlers: WeakMap<Document, () => void> = new WeakMap();

	attach(doc: Document): void
	{
		if (this.#detachHandlers.has(doc))
		{
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (NAV_KEYS.has(event.key))
			{
				this.#lastNavKey = event.key;
				this.#lastNavShift = event.shiftKey;
				this.#setModality('keyboard');
			}
		};

		const onPointer = (event: PointerEvent) => {
			this.#pointerType = (
				POINTER_TYPES.has(event.pointerType as PointerType)
					? (event.pointerType as PointerType)
					: 'mouse'
			);

			this.#setModality('pointer');
		};

		Event.bind(doc, 'keydown', onKeyDown, true);
		Event.bind(doc, 'pointerdown', onPointer, true);

		const detach = () => {
			Event.unbind(doc, 'keydown', onKeyDown, true);
			Event.unbind(doc, 'pointerdown', onPointer, true);
		};

		this.#attachedDocs.push(new WeakRef(doc));
		this.#detachHandlers.set(doc, detach);

		// eslint-disable-next-line no-param-reassign
		doc.documentElement.dataset.inputModality = this.#modality;
	}

	detach(doc: Document): void
	{
		const detach = this.#detachHandlers.get(doc);
		if (detach)
		{
			detach();
			this.#detachHandlers.delete(doc);
			this.#cleanupWeakRefs();
		}
	}

	static enableDebug(): void
	{
		AccessibilityLogger.enable('input-modality');
	}

	static disableDebug(): void
	{
		AccessibilityLogger.disable('input-modality');
	}

	#setModality(modality: InputModality): void
	{
		if (this.#modality !== modality)
		{
			AccessibilityLogger.log('input-modality', `${this.#modality} -> ${modality}`);
			this.#modality = modality;
			this.#updateAllDocuments();
		}
	}

	#updateAllDocuments(): void
	{
		const aliveRefs: WeakRef<Document>[] = [];
		for (const weakRef of this.#attachedDocs)
		{
			const doc = weakRef.deref();
			if (doc)
			{
				doc.documentElement.dataset.inputModality = this.#modality;
				aliveRefs.push(weakRef);
			}
		}

		this.#attachedDocs = aliveRefs;
	}

	#cleanupWeakRefs(): void
	{
		this.#attachedDocs = this.#attachedDocs.filter((weakRef) => {
			const doc = weakRef.deref();

			return doc && this.#detachHandlers.has(doc);
		});
	}

	getLastModality(): InputModality
	{
		return this.#modality;
	}

	getLastPointerType(): PointerType | null
	{
		return this.#modality === 'pointer' ? this.#pointerType : null;
	}

	getLastNavigationKey(): string | null
	{
		return this.#modality === 'keyboard' ? this.#lastNavKey : null;
	}

	isLastNavigationReversed(): boolean
	{
		return this.#modality === 'keyboard' && this.#lastNavKey === 'Tab' && this.#lastNavShift;
	}
}

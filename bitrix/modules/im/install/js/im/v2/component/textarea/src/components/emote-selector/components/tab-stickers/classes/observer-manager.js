import 'main.polyfill.intersectionobserver';
import { EventEmitter } from 'main.core.events';

import type { ImModelStickerPackIdentifier } from 'im.v2.model';

export class ObserverManager extends EventEmitter
{
	static events = {
		onChangeActivePack: 'onChangeActivePack',
	};

	#observer: IntersectionObserver;
	#visiblePacks: Map<HTMLElement, ImModelStickerPackIdentifier> = new Map();

	constructor()
	{
		super();
		this.setEventNamespace('BX.Messenger.v2.Textarea.TabStickers');
		this.#initObserver();
	}

	observe(packElement: HTMLElement)
	{
		this.#observer.observe(packElement);
	}

	unobserve(packElement: HTMLElement)
	{
		this.#observer.unobserve(packElement);
		this.#visiblePacks.delete(packElement);
	}

	#initObserver()
	{
		this.#observer = new IntersectionObserver(
			(entries) => this.#handleIntersection(entries),
			{ threshold: this.#getThreshold() },
		);
	}

	#getThreshold(): number[]
	{
		const arrayWithZeros = Array.from({ length: 11 }).fill(0);

		return arrayWithZeros.map((zero, index) => index * 0.1);
	}

	#handleIntersection(entries: IntersectionObserverEntry[])
	{
		entries.forEach((entry) => {
			if (entry.isIntersecting)
			{
				if (!this.#visiblePacks.has(entry.target))
				{
					this.#visiblePacks.set(entry.target, this.#getPackData(entry.target));
				}
			}
			else
			{
				this.#visiblePacks.delete(entry.target);
			}
		});

		if (this.#visiblePacks.size > 0)
		{
			this.#calculateActivePack();
		}
	}

	#calculateActivePack()
	{
		const visiblePacks = Array.from(this.#visiblePacks, ([element, packData]) => ({
			element,
			packData,
			top: element.getBoundingClientRect().top,
		}));

		visiblePacks.sort((a, b) => a.top - b.top);

		const firstPack = visiblePacks[0];
		const lastPack = visiblePacks[visiblePacks.length - 1];
		const scrollContainer = lastPack.element.parentElement;

		const bestPack = this.#isAtBottom(scrollContainer) ? lastPack.packData : firstPack.packData;

		this.emit(ObserverManager.events.onChangeActivePack, {
			id: bestPack.id,
			type: bestPack.type,
		});
	}

	#getPackData(element: HTMLElement): ImModelStickerPackIdentifier
	{
		const { packId, packType } = element.dataset;

		return {
			id: Number(packId),
			type: packType,
		};
	}

	#isAtBottom(scrollContainer: HTMLElement): boolean
	{
		const MIN_PACK_HEIGHT = 94; // pack 70px + pack header 24px

		const scrollPosition = Math.floor(scrollContainer.scrollHeight - scrollContainer.scrollTop);
		const containerHeight = scrollContainer.clientHeight + MIN_PACK_HEIGHT; // trigger at the bottom earlier

		return scrollPosition <= containerHeight;
	}
}

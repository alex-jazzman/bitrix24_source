import { Dom, Type } from 'main.core';

import { type Screen } from '../../../application/screen';

export type LegacyIslandResponse = {
	html?: unknown,
};

export type TrustedLegacyIslandResponse = {
	html: string,
	source: 'componentAction',
};

export type LegacyIslandOptions = {
	screen: Screen,
	host: HTMLElement,
};

export type LegacyThreadSide = 'before' | 'after';

export type LegacyThreadPair = {
	readonly id: number,
	readonly side: LegacyThreadSide,
	readonly rowKey: string,
	readonly detailsKey: string,
	readonly row: HTMLElement,
	readonly details: HTMLElement,
};

type LegacyView = {
	decorateReadContent?: (nodes: readonly Node[]) => void,
};

type LegacyViewFacade = {
	getView?: () => LegacyView | undefined,
};

type LegacyProcessedScript = {
	isInternal: boolean,
	JS: string,
};

type LegacyProcessedHtml = {
	HTML: string,
	SCRIPT: LegacyProcessedScript[],
};

type LegacyWindow = Window & typeof globalThis & {
	BXMailView?: LegacyViewFacade,
	BX?: {
		processHTML?: (html: string) => LegacyProcessedHtml,
		ajax?: {
			processScripts?: (scripts: LegacyProcessedScript[]) => void,
		},
	},
};

const ThreadSourceAttribute = 'data-mail-message-view-thread-source';
const ThreadRowClass = 'mail-msg-view-log-item';
const ThreadDetailsClass = 'mail-msg-view-details';

export class LegacyIsland
{
	#screen: Screen;
	#host: HTMLElement;
	#ownedNodes = new Set<Node>();
	#placements = new Map<string, Node[]>();
	#threadPairs = new Map<string, LegacyThreadPair>();
	#destroyed = false;

	constructor(options: LegacyIslandOptions)
	{
		this.#screen = options.screen;
		this.#host = options.host;
		this.#screen.registerCleanup(() => this.destroy());
	}

	static createTrustedComponentResponse(response: LegacyIslandResponse): TrustedLegacyIslandResponse | null
	{
		if (!Type.isString(response.html))
		{
			return null;
		}

		return {
			html: response.html,
			source: 'componentAction',
		};
	}

	takeTrustedThreadSource(container: HTMLElement, side: LegacyThreadSide): LegacyThreadPair[]
	{
		if (this.#destroyed)
		{
			return [];
		}

		const pairs: LegacyThreadPair[] = [];
		container.querySelectorAll(`[${ThreadSourceAttribute}="${side}"]`).forEach((source) => {
			pairs.push(...this.#extractThreadPairs(source, side));
			Dom.remove(source as HTMLElement);
		});

		return pairs;
	}

	createThreadPairsFromTrustedComponentResponse(
		response: TrustedLegacyIslandResponse,
		side: LegacyThreadSide,
	): LegacyThreadPair[]
	{
		if (this.#destroyed || response.source !== 'componentAction')
		{
			return [];
		}

		const template = document.createElement('template');
		template.innerHTML = response.html;

		return this.#extractThreadPairs(template.content, side);
	}

	mountThreadPairs(
		pairs: readonly LegacyThreadPair[],
		container: HTMLElement,
		capturedGeneration: number,
	): boolean
	{
		if (this.#destroyed)
		{
			return false;
		}

		return this.#screen.guardCompletion(capturedGeneration, () => {
			const placements = pairs.map((pair) => {
				const rowHost = container.querySelector(`#${pair.rowKey}`);
				const detailsHost = container.querySelector(`#${pair.detailsKey}`);
				if (!Type.isElementNode(rowHost) || !Type.isElementNode(detailsHost))
				{
					return null;
				}

				return {
					pair,
					rowHost: rowHost as HTMLElement,
					detailsHost: detailsHost as HTMLElement,
				};
			});
			if (placements.includes(null))
			{
				return;
			}

			placements.forEach((placement) => {
				if (!placement)
				{
					return;
				}

				const { pair, rowHost, detailsHost } = placement;
				this.#replacePlacement(`row:${pair.side}:${pair.id}`, rowHost, [pair.row]);
				this.#replacePlacement(`details:${pair.side}:${pair.id}`, detailsHost, [pair.details]);
				this.#threadPairs.set(this.#getPairKey(pair.side, pair.id), pair);
			});
			this.#decorate(pairs.flatMap((pair) => [pair.row, pair.details]));
		});
	}

	discardThreadPairs(pairs: readonly LegacyThreadPair[]): void
	{
		pairs.forEach((pair) => {
			this.#cleanupPlacement(`content:${pair.side}:${pair.id}`);
			this.#cleanupPlacement(`row:${pair.side}:${pair.id}`);
			this.#cleanupPlacement(`details:${pair.side}:${pair.id}`);
			this.#removeOwnedNode(pair.row);
			this.#removeOwnedNode(pair.details);
			this.#threadPairs.delete(this.#getPairKey(pair.side, pair.id));
		});
	}

	setThreadPairExpanded(side: LegacyThreadSide, id: number, expanded: boolean): void
	{
		const pair = this.#threadPairs.get(this.#getPairKey(side, id));
		if (!pair)
		{
			return;
		}

		pair.row.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		Dom.style(pair.details, 'display', expanded ? '' : 'none');
	}

	mountThreadDetails(
		response: TrustedLegacyIslandResponse,
		side: LegacyThreadSide,
		id: number,
		capturedGeneration: number,
	): boolean
	{
		const pair = this.#threadPairs.get(this.#getPairKey(side, id));
		if (!pair || response.source !== 'componentAction')
		{
			return false;
		}

		const mounted = this.#mountTrustedHtmlToHost(
			response.html,
			pair.details,
			`content:${side}:${id}`,
			capturedGeneration,
			true,
		);
		if (mounted)
		{
			pair.details.dataset.empty = '0';
			pair.details.removeAttribute('aria-busy');
		}

		return mounted;
	}

	mountTrustedComponentResponse(response: TrustedLegacyIslandResponse, capturedGeneration: number): boolean
	{
		if (response.source !== 'componentAction')
		{
			return false;
		}

		return this.mountTrustedHtml(response.html, capturedGeneration);
	}

	mountTrustedHtml(html: string, capturedGeneration: number): boolean
	{
		return this.#mountTrustedHtmlToHost(html, this.#host, 'default', capturedGeneration);
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#cleanupNodes();
		this.#threadPairs.clear();
	}

	#extractThreadPairs(root: DocumentFragment | Element, side: LegacyThreadSide): LegacyThreadPair[]
	{
		const elements = [...root.childNodes].filter((node) => Type.isElementNode(node)) as HTMLElement[];
		const pairs: LegacyThreadPair[] = [];
		for (let index = 0; index < elements.length; index += 1)
		{
			const row = elements[index];
			const details = elements[index + 1];
			if (
				!Dom.hasClass(row, ThreadRowClass)
				|| !details || !Dom.hasClass(details, ThreadDetailsClass)
			)
			{
				continue;
			}

			const id = Number(row.dataset.id);
			if (!Number.isInteger(id) || id <= 0 || Number(details.dataset.id) !== id)
			{
				continue;
			}

			const pair: LegacyThreadPair = {
				id,
				side,
				rowKey: `mail-message-view-thread-${side}-row-${id}`,
				detailsKey: `mail-message-view-thread-${side}-details-${id}`,
				row,
				details,
			};
			Dom.style(row, 'pointer-events', 'none');
			row.tabIndex = -1;
			Dom.clean(details);
			Dom.style(details, 'display', 'none');
			this.#ownedNodes.add(row);
			this.#ownedNodes.add(details);
			pairs.push(pair);
			index += 1;
		}

		return pairs;
	}

	#mountTrustedHtmlToHost(
		html: string,
		host: HTMLElement,
		placementKey: string,
		capturedGeneration: number,
		isThreadDetails: boolean = false,
	): boolean
	{
		if (this.#destroyed)
		{
			return false;
		}

		const processed = this.#processTrustedHtml(html);

		return this.#screen.guardCompletion(capturedGeneration, () => {
			const nodes = this.#createNodesFromTrustedHtml(processed.HTML);
			if (isThreadDetails)
			{
				this.#removeLegacyThreadControls(nodes);
			}
			Dom.clean(host);
			this.#replacePlacement(placementKey, host, nodes);
			this.#decorate(nodes);
			if (isThreadDetails && processed.SCRIPT.length > 0)
			{
				(window as LegacyWindow).BX?.ajax?.processScripts?.(processed.SCRIPT);
			}
		});
	}

	#processTrustedHtml(html: string): LegacyProcessedHtml
	{
		const processed = (window as LegacyWindow).BX?.processHTML?.(html);
		if (processed && Type.isString(processed.HTML) && Type.isArray(processed.SCRIPT))
		{
			return processed;
		}

		const template = document.createElement('template');
		template.innerHTML = html;
		template.content.querySelectorAll('script').forEach((script) => Dom.remove(script));

		return {
			HTML: template.innerHTML,
			SCRIPT: [],
		};
	}

	#createNodesFromTrustedHtml(html: string): Node[]
	{
		const template = document.createElement('template');
		template.innerHTML = html;
		const nodes = [...template.content.childNodes];
		nodes.forEach((node) => this.#ownedNodes.add(node));

		return nodes;
	}

	#removeLegacyThreadControls(nodes: readonly Node[]): void
	{
		nodes.forEach((node) => {
			if (!Type.isElementNode(node))
			{
				return;
			}

			const element = node as HTMLElement;
			Dom.removeClass(element, 'mail-msg-view-header-clickable');
			Dom.removeClass(element, 'mail-msg-view-item-open');
			element.querySelectorAll('.mail-msg-view-header-clickable').forEach((header) => {
				Dom.removeClass(header as HTMLElement, 'mail-msg-view-header-clickable');
				Dom.removeClass(header as HTMLElement, 'mail-msg-view-item-open');
			});
			element.querySelectorAll('.mail-msg-view-collapse-btn').forEach((button) => {
				Dom.remove(button as HTMLElement);
			});
		});
	}

	#replacePlacement(key: string, host: HTMLElement, nodes: Node[]): void
	{
		this.#cleanupPlacement(key);
		nodes.forEach((node) => Dom.append(node as HTMLElement, host));
		this.#placements.set(key, nodes);
	}

	#cleanupPlacement(key: string): void
	{
		const nodes = this.#placements.get(key) ?? [];
		nodes.forEach((node) => {
			if (node.parentNode)
			{
				Dom.remove(node as HTMLElement);
			}
			this.#ownedNodes.delete(node);
		});
		this.#placements.delete(key);
	}

	#removeOwnedNode(node: Node): void
	{
		if (node.parentNode)
		{
			Dom.remove(node as HTMLElement);
		}
		this.#ownedNodes.delete(node);
	}

	#cleanupNodes(): void
	{
		this.#ownedNodes.forEach((node) => {
			if (node.parentNode)
			{
				Dom.remove(node as HTMLElement);
			}
		});
		this.#ownedNodes.clear();
		this.#placements.clear();
	}

	#decorate(nodes: readonly Node[]): void
	{
		(window as LegacyWindow).BXMailView?.getView?.()?.decorateReadContent?.(nodes);
	}

	#getPairKey(side: LegacyThreadSide, id: number): string
	{
		return `${side}:${id}`;
	}
}

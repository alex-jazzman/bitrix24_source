import { Dom } from 'main.core';

import { EmbedTargetBand } from '../../const';
import { type EmbedTargetBox } from '../../types';

/**
 * Places the tour targets that live inside the embedded report. The embed is cross-origin, so
 * its markup is out of reach - but its layout is fixed, and the portal knows the box of the
 * frame itself. That is enough: a band of the frame is covered with an invisible proxy node,
 * and the tour binds a step to it as to any other element.
 *
 * A step with no band described here has nothing to point at, so the queue drops it - the same
 * path any unreachable step takes.
 */
export class EmbedTarget
{
	#frameNode: HTMLElement;
	#proxies: Map<string, HTMLElement> = new Map();

	constructor(frameNode: HTMLElement)
	{
		this.#frameNode = frameNode;
	}

	resolve(stepIds: string[]): Map<string, HTMLElement>
	{
		this.destroy();

		// Page coordinates, not viewport ones: the proxy stands in for an element of the report
		// and has to travel with it when the page is scrolled.
		const frameRect = this.#frameNode ? Dom.getPosition(this.#frameNode) : null;
		if (!frameRect || frameRect.width <= 0 || frameRect.height <= 0)
		{
			return this.#proxies;
		}

		stepIds.forEach((stepId) => {
			const band = EmbedTargetBand[stepId];
			if (!band)
			{
				return;
			}

			this.#proxies.set(stepId, this.#createProxy(band, frameRect));
		});

		return this.#proxies;
	}

	destroy(): void
	{
		this.#proxies.forEach((proxy) => Dom.remove(proxy));
		this.#proxies.clear();
	}

	#createProxy(band: EmbedTargetBox, frameRect: DOMRect): HTMLElement
	{
		const width = Math.min(band.width, frameRect.width);
		const height = this.#getBandHeight(band, frameRect.height);

		const proxy = Dom.create('div', {
			props: {
				className: 'biconnector-dashboard-onboarding__frame-target',
			},
			style: {
				top: `${frameRect.top + band.top}px`,
				left: `${frameRect.left + band.left}px`,
				width: `${width}px`,
				height: `${height}px`,
			},
		});

		Dom.append(proxy, document.body);

		return proxy;
	}

	#getBandHeight(band: EmbedTargetBox, frameHeight: number): number
	{
		if (band.heightRatio !== undefined)
		{
			return Math.round(frameHeight * band.heightRatio);
		}

		return band.height === null ? frameHeight : Math.min(band.height, frameHeight);
	}
}

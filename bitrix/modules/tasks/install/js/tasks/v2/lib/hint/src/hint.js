import { Popup, PopupManager, PopupOptions } from 'main.popup';

export class Hint
{
	#delay: number = 2000;

	async showHint(options: PopupOptions): Promise<void>
	{
		this.#destroy(options.id);

		const { trackAnchor, resolveOffsetLeft, ...popupOptions } = options;

		const callerEvents = popupOptions.events || {};
		const callerDestroyHandler = callerEvents.onPopupDestroy;

		let frameId = null;
		let observer = null;
		let lastLeft = null;
		let lastTop = null;

		const shouldTrack = trackAnchor === true && popupOptions.bindElement instanceof HTMLElement;

		const follow = () => {
			if (popup.isDestroyed())
			{
				return;
			}

			const bindElement = popup.bindElement;
			if (!bindElement || (bindElement instanceof HTMLElement && !bindElement.isConnected))
			{
				popup.close();

				return;
			}

			if (bindElement instanceof HTMLElement)
			{
				const rect = bindElement.getBoundingClientRect();
				const positionChanged = rect.left !== lastLeft || rect.top !== lastTop;
				const sizeChanged = (
					rect.width !== popup.bindElementPos?.width
					|| rect.height !== popup.bindElementPos?.height
				);
				if (positionChanged || sizeChanged)
				{
					lastLeft = rect.left;
					lastTop = rect.top;
					if (typeof resolveOffsetLeft === 'function')
					{
						popup.setOffset({ offsetLeft: resolveOffsetLeft(rect) });
					}

					popup.adjustPosition({ forceBindPosition: true });
				}
			}

			frameId = requestAnimationFrame(follow);
		};

		const baseOptions = {
			className: 'tasks-hint',
			background: 'var(--ui-color-bg-content-inapp)',
			angle: true,
			autoHide: true,
			autoHideHandler: () => true,
			cacheable: false,
			animation: 'fading',
			...popupOptions,
			events: {
				...callerEvents,
				onPopupDestroy: (event) => {
					if (frameId !== null)
					{
						cancelAnimationFrame(frameId);
						frameId = null;
					}

					observer?.disconnect();
					observer = null;

					if (typeof callerDestroyHandler === 'function')
					{
						callerDestroyHandler(event);
					}
				},
			},
		};

		const popup = new Popup(baseOptions);

		popup.show();

		if (shouldTrack)
		{
			frameId = requestAnimationFrame(follow);

			observer = new IntersectionObserver((entries) => {
				if (entries.some((entry) => !entry.isIntersecting))
				{
					popup.close();
				}
			});
			observer.observe(popupOptions.bindElement);
		}

		setTimeout(() => popup.close(), this.#delay);
	}

	#destroy(popupId: string): void
	{
		PopupManager.getPopupById(popupId)?.destroy();
	}
}

import { Extension, Type } from 'main.core';
import { Popup } from 'main.popup';
import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';

import { closeOnSliderOpen } from './close-on-slider';
import { ReviewApp } from './component/review-app';
import { tryAcquirePopupLock, releasePopupLock } from './popup-lock';

const settings = Extension.getSettings('timeman.work-time-report');

export class WorkTimeReportReview
{
	#popup: ?Popup = null;
	#app: ?VueCreateAppResult = null;
	#onClose: ?() => void = null;
	#resizeObserver: ?ResizeObserver = null;
	#unsubscribeSlider: ?() => void = null;

	open(userId: number, reportId: number): void
	{
		if (!userId || !reportId)
		{
			console.error('WorkTimeReportReview: userId or reportId is required');

			return;
		}

		if (this.#popup)
		{
			this.#popup.show();

			return;
		}

		if (!tryAcquirePopupLock())
		{
			return;
		}

		this.#popup = new Popup({
			id: `timeman-work-time-report-review-${userId}`,
			bindElement: null,
			content: '',
			width: 450,
			minHeight: 100,
			maxHeight: 850,
			closeByEsc: true,
			closeIcon: true,
			autoHide: true,
			angle: false,
			padding: 20,
			overlay: true,
			className: 'timeman-work-time-report-review-popup',
			events: {
				onPopupAfterClose: (): void => {
					this.#destroy();
				},
			},
		});

		this.#popup.show();

		this.#unsubscribeSlider = closeOnSliderOpen((): void => {
			this.#popup?.close();
		});

		const container = this.#popup.getContentContainer();

		const app = BitrixVue.createApp(
			ReviewApp,
			{
				userId,
				reportId,
				currentUserId: settings.currentUserId,
			},
		);

		const popup = this.#popup;
		app.config.globalProperties.$close = (): void => {
			popup?.close();
		};

		app.mount(container);
		this.#app = app;

		if (!Type.isUndefined(ResizeObserver))
		{
			this.#resizeObserver = new ResizeObserver((): void => {
				this.#popup?.adjustPosition?.();
			});
			this.#resizeObserver.observe(container);
		}
	}

	#destroy(): void
	{
		if (this.#unsubscribeSlider)
		{
			this.#unsubscribeSlider();
			this.#unsubscribeSlider = null;
		}

		if (this.#resizeObserver)
		{
			this.#resizeObserver.disconnect();
			this.#resizeObserver = null;
		}

		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
		}

		if (this.#popup)
		{
			this.#popup.destroy();
			this.#popup = null;
		}

		releasePopupLock();

		if (this.#onClose)
		{
			try
			{
				this.#onClose();
			}
			finally
			{
				this.#onClose = null;
			}
		}
	}
}

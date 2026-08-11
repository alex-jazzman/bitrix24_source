import { Extension, Type } from 'main.core';
import { Popup } from 'main.popup';
import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';

import { fullReportService } from 'timeman.provider.service.full-report-service';

import { closeOnSliderOpen } from './close-on-slider';
import { App } from './component/app';
import { ReportMode, type ReportModeValue } from './const/report-mode';
import { tryAcquirePopupLock, releasePopupLock } from './popup-lock';

const settings = Extension.getSettings('timeman.work-time-report');

export type WorkTimeReportOpenParams = {
	userId?: number,
	onClose?: ?() => void,
	bindElement?: ?HTMLElement,
	width?: ?number,
	offsetTop?: ?number,
	offsetLeft?: ?number,
	fixed?: ?boolean,
	closeIcon?: ?boolean,
	autoHide?: ?boolean,
	inProgress?: ?boolean,
};

const POPUP_ID_PREFIX = 'timeman-work-time-report';
const DEFAULT_WIDTH = 600;
const WEEKLY_WIDTH = 450;
const MAX_HEIGHT = 850;
const MAX_HEIGHT_RESERVE = 15;

let popupCounter = 0;

export class WorkTimeReport
{
	#popup: ?Popup = null;
	#app: ?VueCreateAppResult = null;
	#onClose: ?() => void = null;
	#resizeObserver: ?ResizeObserver = null;
	#submitted: boolean = false;
	#onSentHandler: ?() => void = null;
	#unsubscribeSlider: ?() => void = null;

	open(mode: ReportModeValue, params: WorkTimeReportOpenParams = {}): void
	{
		if (!Object.values(ReportMode).includes(mode))
		{
			console.error(`WorkTimeReport: unknown mode "${mode}"`);

			return;
		}

		if (this.#popup)
		{
			this.#popup.show();

			return;
		}

		if (!tryAcquirePopupLock())
		{
			params.onClose?.();

			return;
		}

		const userId = Number(params.userId ?? settings.currentUserId ?? 0);
		this.#onClose = params.onClose ?? null;
		this.#submitted = false;

		if (Type.isFunction(window.BX?.addCustomEvent))
		{
			this.#onSentHandler = (): void => {
				this.#submitted = true;
			};
			window.BX.addCustomEvent('OnWorkReportSend', this.#onSentHandler);
		}

		const bindElement = params.bindElement ?? null;
		const isWeekly = mode === ReportMode.WEEKLY;
		const defaultWidth = isWeekly ? WEEKLY_WIDTH : DEFAULT_WIDTH;
		const width = Number(params.width) > 0 ? Number(params.width) : defaultWidth;
		const maxHeight = Math.max(200, (window.innerHeight ?? MAX_HEIGHT) - MAX_HEIGHT_RESERVE);

		popupCounter += 1;

		const popupOptions: Object = {
			id: `${POPUP_ID_PREFIX}-${popupCounter}`,
			bindElement,
			content: '',
			width,
			minHeight: 100,
			maxHeight,
			closeByEsc: true,
			closeIcon: params.closeIcon ?? true,
			autoHide: params.autoHide ?? false,
			angle: false,
			padding: 20,
			className: 'timeman-work-time-report-popup',
			disableScroll: isWeekly,
			events: {
				onPopupAfterClose: (): void => {
					if (mode === ReportMode.WEEKLY && !this.#submitted)
					{
						fullReportService.postpone().catch((error): void => {
							console.error('WorkTimeReport.postpone failed:', error);
						});
					}
					this.#destroy();
				},
			},
		};

		if (isWeekly)
		{
			popupOptions.overlay = true;
		}

		if (Type.isNumber(params.offsetTop))
		{
			popupOptions.offsetTop = params.offsetTop;
		}

		if (Type.isNumber(params.offsetLeft))
		{
			popupOptions.offsetLeft = params.offsetLeft;
		}

		if (Type.isBoolean(params.fixed))
		{
			popupOptions.fixed = params.fixed;
		}

		this.#popup = new Popup(popupOptions);

		this.#popup.show();

		this.#unsubscribeSlider = closeOnSliderOpen((): void => {
			this.#popup?.close();
		});

		const container = this.#popup.getContentContainer();

		const app = BitrixVue.createApp(App, {
			mode,
			userId,
			inProgress: Boolean(params.inProgress),
		});

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

		if (this.#onSentHandler)
		{
			if (Type.isFunction(window.BX?.removeCustomEvent))
			{
				window.BX.removeCustomEvent('OnWorkReportSend', this.#onSentHandler);
			}
			this.#onSentHandler = null;
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

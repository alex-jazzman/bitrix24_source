import { ajax as Ajax, Dom, Loc, Tag, Type } from 'main.core';
import 'ui.design-tokens';
import type { PopupOptions } from 'main.popup';
import { Popup } from 'main.popup';
import { Confetti } from 'ui.confetti';
import { Lottie } from 'ui.lottie';
import { UI } from 'ui.notification';
import type { WidgetParams, WidgetTypeEnum } from '../widget';

export class Base
{
	#data: ?Object = null;
	#popup: ?Popup = null;
	#bindElement: ?HTMLElement = null;
	#isConfettiShowed: boolean = true;
	params: WidgetParams = {};

	constructor(params: WidgetParams = {})
	{
		this.params = params;

		if (Type.isBoolean(this.params.showConfetti))
		{
			this.#isConfettiShowed = !this.params.showConfetti;
		}
	}

	getType(): WidgetTypeEnum
	{
		throw new Error('Must be implement in child class');
	}

	async show(forceShowConfetti: boolean = false): void
	{
		const data = await this.getData();

		if (this.#popup === null)
		{
			this.#popup = new Popup(this.getPopupParams(data, { forceShowConfetti }));
		}

		this.#popup.show();
	}

	getPopupParams(data: Object, params: Object = {}): PopupOptions
	{
		const hasParentButton = Boolean(this.#bindElement.closest('button'));
		const hasParentLink = Boolean(this.#bindElement.closest('a'));

		let bindElement = this.#bindElement;
		if (hasParentButton)
		{
			bindElement = this.#bindElement.closest('button');
		}
		else if (hasParentLink)
		{
			bindElement = this.#bindElement.closest('a');
		}

		const bindElementRect = bindElement.getBoundingClientRect();

		return {
			id: `crm_repeat_sale_widget_${this.getType()}`,
			bindElement: {
				top: bindElementRect.top + bindElementRect.height + 10,
				left: bindElementRect.right - 410,
			},
			content: this.getPopupContent(data),
			cacheable: false,
			isScrollBlock: true,
			className: `crm-repeat-sale-widget-popup --${this.getType()}`,
			closeByEsc: true,
			closeIcon: true,
			padding: 16,
			width: 410,
			maxHeight: 500,
			overlay: null,
			autoHide: true,
			events: {
				onclose: () => {
					this.onClose();
				},
				onFirstShow: () => {
					if (this.#isConfettiShowed && params?.forceShowConfetti !== true)
					{
						return;
					}

					setTimeout(() => {
						this.#showConfetti();
						this.#isConfettiShowed = true;
					}, 100);
				},
			},
		};
	}

	getPopupContent(data: Object): HTMLElement
	{
		throw new Error('Must be implement in child class');
	}

	setPopupContent(content: HTMLElement): void
	{
		this.#popup.setContent(content);
	}

	onClose(): void
	{
		if (this.params.showConfetti)
		{
			void Ajax.runAction('crm.repeatsale.widget.incrementShowedConfettiCount');
		}

		this.#popup = null;
	}

	#showConfetti(): void
	{
		const container = this.#popup?.getPopupContainer();
		if (!container)
		{
			return;
		}

		let canvas = null;

		if (container.getElementsByTagName('canvas').length === 0)
		{
			canvas = Tag.render`<canvas></canvas>`;

			Dom.style(canvas, {
				position: 'fixed',
				top: 0,
				left: 0,
				pointerEvents: 'none',
				zIndex: '9',
				width: '100%',
				height: '100%',
			});

			Dom.append(canvas, this.#popup.getPopupContainer());
		}
		else
		{
			canvas = container.getElementsByTagName('canvas')[0];
		}

		const confetti = Confetti.create(canvas, {
			resize: true,
			useWorker: true,
		});

		confetti({
			particleCount: 400,
			origin: {
				y: 1.2,
				x: 0,
			},
			spread: 100,
		});
	}

	async getData(): Object
	{
		this.#data = await this.fetchData();

		return this.#data;
	}

	async fetchData(): Promise
	{
		return new Promise((resolve) => {
			Ajax
				.runAction(this.getFetchUrl(), { data: this.getFetchParams() })
				.then(
					(response) => {
						if (response.status === 'success')
						{
							resolve(response.data);

							return;
						}

						this.showError();
					},
					() => {
						this.showError();
					},
				)
				.catch((response) => {
					this.showError();

					throw response;
				})
			;
		});
	}

	getFetchUrl(): string
	{
		throw new Error('Must be implement in child class');
	}

	getFetchParams(): Object
	{
		return {};
	}

	showError(): void
	{
		const messageCode = 'CRM_REPEAT_SALE_WIDGET_ERROR';

		UI.Notification.Center.notify({
			content: Loc.getMessage(messageCode),
			autoHideDelay: 6000,
		});
	}

	setBindElement(element: HTMLElement): Base
	{
		this.#bindElement = element;

		return this;
	}

	isShown(): boolean
	{
		return this.#popup?.isShown();
	}

	close(): void
	{
		this.#popup?.close();
	}

	renderLottieAnimation(): HTMLElement
	{
		const container = Tag.render`
			<div class="crm-rs__w-lottie-container">
				<div ref="lottie" class="crm-rs__w-lottie"></div>
			</div>
		`;

		const mainAnimation = Lottie.loadAnimation({
			path: '/bitrix/js/crm/repeat-sale/widget/lottie/animation.json',
			container: container.lottie,
			renderer: 'svg',
			loop: true,
			autoplay: true,
		});

		mainAnimation.setSpeed(0.75);

		return container.root;
	}
}

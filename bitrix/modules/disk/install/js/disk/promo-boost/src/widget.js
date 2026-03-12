import { loadExt } from 'main.core';

export class Widget
{
	static #instance: ?Widget = null;
	#service: string = '';
	#widgetInstance = null;

	constructor(service: string): void
	{
		this.#service = service;
	}

	static getInstance(service: code): Widget
	{
		if (this.#instance === null)
		{
			this.#instance = new Widget(service);
		}

		return this.#instance;
	}

	/**
	 * @returns {Promise<ServiceWidget>} -- ServiceWidget from baas.store extension
	 */
	#getBaasWidget(): Promise<any>
	{
		if (this.#widgetInstance !== null)
		{
			return Promise.resolve(this.#widgetInstance);
		}

		return loadExt('baas.store')
			.then((exports) => {
				this.#widgetInstance = exports.ServiceWidget.getInstanceByCode(this.#service);

				return this.#widgetInstance;
			})
			.catch((err) => {
				const errorMessage = `Baas extension not loaded! Original error: ${err.message}`;
				throw new Error(errorMessage);
			})
		;
	}

	bindTo(node: HTMLElement): Widget
	{
		this.#getBaasWidget()
			.then((widget): void => {
				widget.bind(node);
			})
			.catch(this.#errToConsole)
		;

		return this;
	}

	show(): Widget
	{
		this.#getBaasWidget()
			.then((widget): void => {
				if (widget.getPopup().isShown())
				{
					const showWidget = () => {
						widget.show();
						widget.getPopup().unsubscribe('onAfterClose', showWidget);
					};
					widget.getPopup().subscribe('onAfterClose', showWidget);
				}
				else
				{
					widget.show();
				}
			})
			.catch(this.#errToConsole)
		;

		return this;
	}

	toggle(): Widget
	{
		this.#getBaasWidget()
			.then((widget): void => {
				widget.toggle();
			})
			.catch(this.#errToConsole)
		;

		return this;
	}

	setOverlay(): Widget
	{
		this.#getBaasWidget()
			.then((widget): void => {
				widget.getPopup().setOverlay({ opacity: 0 });
			})
			.catch(this.#errToConsole)
		;

		return this;
	}

	#errToConsole(error: Error): void
	{
		console.error(error.message);
	}
}

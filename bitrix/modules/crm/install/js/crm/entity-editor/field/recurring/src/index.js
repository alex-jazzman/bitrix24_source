import { Tag } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { Recurring as RecurringComponent } from './components/recurring.js';
import './style.css';

export class Recurring
{
	#entityTypeId: number;
	#entityId: number;
	#data: Object = {};
	#params: Object = {};
	#changeCallback: Function;

	#layoutComponent: ?Object = null;
	#app: ?Object = null;

	static create(entityTypeId: number, entityId: number, changeCallback: Function, params: ?Object = {}): Recurring
	{
		return new Recurring(entityTypeId, entityId, changeCallback, params);
	}

	constructor(entityTypeId: number, entityId: number, changeCallback: Function, params: ?Object = {})
	{
		this.#entityTypeId = entityTypeId;
		this.#entityId = entityId;
		this.#changeCallback = changeCallback;
		this.#params = params;
	}

	setData(data: Object): void
	{
		this.#data = data;
	}

	getLayout(): void
	{
		if (this.#app)
		{
			this.clean();
		}

		const props = {
			entityTypeId: this.#entityTypeId,
			entityId: this.#entityId,
			data: this.#data,
			params: this.#params,
			changeCallback: this.#changeCallback,
		};
		this.#app = BitrixVue.createApp(RecurringComponent, props);

		const container = Tag.render`<div></div>`;
		this.#layoutComponent = this.#app.mount(container);

		return container;
	}

	clean(): void
	{
		this.#app?.unmount();
		this.#app = null;
	}

	focus(): void
	{
		this.#layoutComponent.focus();
	}
}

import { EventEmitter } from 'main.core.events';

import { ContextStack } from './context-stack';
import { getUrl } from './collectors/url-collector';
import { getModule } from './collectors/module-collector';
import { type SystemData, type CustomData, type ContextSnapshot } from './types';

const SLIDER_EVENT_OPEN: string = 'SidePanel.Slider:onOpenComplete';
const SLIDER_EVENT_CLOSE: string = 'SidePanel.Slider:onCloseComplete';

class PageContextClass
{
	#stack: ContextStack = new ContextStack();

	constructor()
	{
		this.#subscribeToSliderEvents();
	}

	set(moduleId: string, key: string, value: any): void
	{
		const layer = this.#stack.current();

		if (!layer.has(moduleId))
		{
			layer.set(moduleId, new Map());
		}

		layer.get(moduleId).set(key, value);
	}

	delete(moduleId: string, key: string): void
	{
		const moduleData = this.#stack.current().get(moduleId);
		if (moduleData)
		{
			moduleData.delete(key);

			if (moduleData.size === 0)
			{
				this.#stack.current().delete(moduleId);
			}
		}
	}

	getSystem(key: string): any
	{
		return this.#collectSystem()[key];
	}

	getModule(): string | null
	{
		return getModule();
	}

	getCustom(moduleId: string, key: string): any
	{
		return this.#stack.current().get(moduleId)?.get(key);
	}

	getModuleCustom(moduleId: string): { [string]: any }
	{
		const moduleData = this.#stack.current().get(moduleId);
		if (!moduleData)
		{
			return {};
		}

		return Object.fromEntries(moduleData);
	}

	getAllSystem(): SystemData
	{
		return this.#collectSystem();
	}

	getAllCustom(): CustomData
	{
		const result: CustomData = {};

		for (const [moduleId, moduleData] of this.#stack.current())
		{
			result[moduleId] = Object.fromEntries(moduleData);
		}

		return result;
	}

	getAll(): ContextSnapshot
	{
		return {
			system: this.getAllSystem(),
			custom: this.getAllCustom(),
		};
	}

	#collectSystem(): SystemData
	{
		return {
			url: getUrl(),
			module: getModule(),
		};
	}

	#subscribeToSliderEvents(): void
	{
		EventEmitter.subscribe(SLIDER_EVENT_OPEN, this.#handleSliderOpen);
		EventEmitter.subscribe(SLIDER_EVENT_CLOSE, this.#handleSliderClose);
	}

	#handleSliderOpen = (): void => {
		this.#stack.push();
	};

	#handleSliderClose = (): void => {
		this.#stack.pop();
	};
}

export const PageContext: PageContextClass = new PageContextClass();

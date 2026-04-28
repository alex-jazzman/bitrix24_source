import { MemoryCache } from 'main.core.cache';
import { Controller } from './service/controller';

export class ServiceLocator
{
	static #instance = null;

	#cache: MemoryCache;

	constructor()
	{
		this.#cache = new MemoryCache();
	}

	static instance(): ServiceLocator
	{
		this.#instance ??= new ServiceLocator();

		return this.#instance;
	}

	getController(): Controller
	{
		return this.#cache.remember('controller', () => new Controller());
	}
}

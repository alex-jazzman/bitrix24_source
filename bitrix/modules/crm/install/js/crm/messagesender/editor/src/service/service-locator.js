import { Cache } from 'main.core';
import { type Context } from '../editor';
import { DocumentService } from './document-service';
import { EscapeService } from './escape-service';
import { logger, type Logger } from './logger';
import { PlaceholderService } from './placeholder-service';
import { SalescenterService } from './salescenter-service';
import { SendService } from './send-service';

/**
 * One instance of this class per editor instance.
 */
export class ServiceLocator
{
	#context: Context;
	#providerFactory;
	#services = new Cache.MemoryCache();

	constructor({ context, providerFactory }: {context: Context, providerFactory: ?Object} = {})
	{
		this.#context = context;
		this.#providerFactory = providerFactory ?? null;
	}

	setProviderFactory(providerFactory: Object): void
	{
		this.#providerFactory = providerFactory;
	}

	getSendService(): SendService
	{
		return this.#services.remember('sendService', () => {
			const customData = this.#context.customData ?? {};

			return new SendService({
				entityTypeId: customData.entityTypeId,
				entityId: customData.entityId,
				providerFactory: this.#providerFactory,
			});
		});
	}

	getLogger(): Logger
	{
		return logger;
	}

	getDocumentService(): DocumentService
	{
		return this.#services.remember('documentService', () => {
			return new DocumentService({ logger: this.getLogger() });
		});
	}

	getSalescenterService(): SalescenterService
	{
		return this.#services.remember('salescenterService', () => {
			return new SalescenterService({ logger: this.getLogger() });
		});
	}

	getEscapeService(): EscapeService
	{
		return this.#services.remember('escapeService', () => new EscapeService());
	}

	getPlaceholderService(): PlaceholderService
	{
		return this.#services.remember('placeholderService', () => new PlaceholderService());
	}
}

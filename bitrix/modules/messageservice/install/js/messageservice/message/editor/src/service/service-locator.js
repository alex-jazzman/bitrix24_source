import { Cache } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { type Store } from 'ui.vue3.vuex';

import { ContentProviderFactory } from '../content-provider/content-provider-factory';
import { type MessageModel } from '../model/message-model';
import { AlertService } from './alert-service';
import { AnalyticsService } from './analytics-service';
import { FileService } from './file-service';
import { logger, type Logger } from './logger';
import { lexicalService, type LexicalService } from './lexical-service';
import { placeholderService, type PlaceholderService } from './placeholder-service';
import { PreferencesService } from './preferences-service';
import { SendService } from './send-service';
import { TemplateService } from './template-service';

/**
 * One instance of this class per editor instance. Some services can be shared between editors.
 */
export class ServiceLocator
{
	#services = new Cache.MemoryCache();
	#store: ?Store = null;
	#messageModel: ?MessageModel = null;
	#emitter: ?EventEmitter = null;

	setStore(store: Store): this
	{
		this.#store = store;

		return this;
	}

	setMessageModel(messageModel: MessageModel): this
	{
		this.#messageModel = messageModel;

		return this;
	}

	getMessageModel(): ?MessageModel
	{
		return this.#messageModel;
	}

	setEventEmitter(emitter: EventEmitter): this
	{
		this.#emitter = emitter;

		return this;
	}

	getEventEmitter(): EventEmitter
	{
		return this.#emitter;
	}

	getLogger(): Logger
	{
		return logger;
	}

	getSendService(): SendService
	{
		return this.#services.remember('sendService', () => {
			return new SendService({
				logger: this.getLogger(),
				store: this.#store,
				messageModel: this.getMessageModel(),
				eventEmitter: this.#emitter,
				analyticsService: this.getAnalyticsService(),
				preferencesService: this.getPreferencesService(),
			});
		});
	}

	getAlertService(): AlertService
	{
		return this.#services.remember('alertService', () => {
			return new AlertService({
				store: this.#store,
			});
		});
	}

	getFileService(): FileService
	{
		return this.#services.remember('fileService', () => {
			return new FileService({
				logger: this.getLogger(),
				store: this.#store,
			});
		});
	}

	getTemplateService(): TemplateService
	{
		return this.#services.remember('templateService', () => {
			return new TemplateService({
				logger: this.getLogger(),
				store: this.#store,
				eventEmitter: this.#emitter,
			});
		});
	}

	getPreferencesService(): PreferencesService
	{
		return this.#services.remember('preferencesService', () => {
			return new PreferencesService({
				store: this.#store,
			});
		});
	}

	getAnalyticsService(): AnalyticsService
	{
		return this.#services.remember('analyticsService', () => {
			return new AnalyticsService({
				store: this.#store,
			});
		});
	}

	getPlaceholderService(): PlaceholderService
	{
		return placeholderService;
	}

	getLexicalService(): LexicalService
	{
		return lexicalService;
	}

	getProviderFactory(): ContentProviderFactory
	{
		return this.#services.remember('providerFactory', () => {
			return new ContentProviderFactory();
		});
	}

	destroy(): void
	{
		if (this.#services.has('providerFactory'))
		{
			this.#services.get('providerFactory').destroy();
		}

		this.#services = null;
	}
}

import { Cache } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import { type MessageModel } from '../model/message-model';
import { AlertService } from './alert-service';
import { AnalyticsService } from './analytics-service';
import { CopilotService } from './copilot-service';
import { DocumentService } from './document-service';
import { FileService } from './file-service';
import { logger, type Logger } from './logger';
import { PreferencesService } from './preferences-service';
import { SalescenterService } from './salescenter-service';
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

	getSalescenterService(): SalescenterService
	{
		return this.#services.remember('salescenterService', () => {
			return new SalescenterService({
				logger: this.getLogger(),
				store: this.#store,
			});
		});
	}

	getDocumentService(): DocumentService
	{
		return this.#services.remember('documentService', () => {
			return new DocumentService({
				logger: this.getLogger(),
				store: this.#store,
			});
		});
	}

	getCopilotService(): CopilotService
	{
		return this.#services.remember('copilotService', () => {
			return new CopilotService({
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
}

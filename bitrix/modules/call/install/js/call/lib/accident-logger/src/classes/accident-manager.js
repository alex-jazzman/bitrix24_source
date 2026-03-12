import { Type, Event } from 'main.core';
import { CallSettingsManager } from 'call.lib.settings-manager';
import { AccidentLoggerError } from './accident-logger-error';

export class AccidentManager
{
	/**
	 * @param {AccidentStorage} storage instance of AccidentStorage
	 * @param {number} sendIntervalSecs send interval in seconds
	 *   */
	constructor(storage, sendIntervalSecs = 60) {
		this.localStorageSendingSessionIdKey = 'bx-call-accidentLogger-sendingSessionId';
		this.url = `${CallSettingsManager.callBalancerUrl}/errtrack`;
		this.storage = storage;
		this.minLogLifetime = 10 * 1000;
		this.sendInterval = sendIntervalSecs * 1000;
		this.maxLogLifetime = 30 * 60 * 1000;
		this.isEnabled = this.minLogLifetime <= this.sendInterval
			&& this.sendInterval <= this.maxLogLifetime
			&& this.minLogLifetime <= this.storage.maxAgeSecs
			&& this.storage.maxAgeSecs <= this.maxLogLifetime;
		this.sendingLoop = this.sendingLoop.bind(this);
		this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
		this.sendingLoop();
		this.#setupGlobalErrorHandlers();
	}

	get isSending() {
		const storedSendingSessionId = localStorage.getItem(this.localStorageSendingSessionIdKey);

		return storedSendingSessionId === this.storage.sessionId;
	}

	set isSending(value) {
		localStorage.setItem(this.localStorageSendingSessionIdKey, value ? this.storage.sessionId : '');
	}

	async sendingLoop() {
		if (!this.isEnabled)
		{
			return;
		}

		if (!this.isSending)
		{
			this.isSending = true;
			await this.#sendLogs();
			this.isSending = false;
		}

		if (Type.isNumber(this.sendingLoopTimeout))
		{
			clearTimeout(this.sendingLoopTimeout);
		}

		this.sendingLoopTimeout = setTimeout(this.sendingLoop, this.sendInterval);
	}

	async addLog(error = null, message = '') {
		if (!this.isEnabled)
		{
			return;
		}
		await this.storage.addLog(error, message);
	}

	#setupGlobalErrorHandlers() {
		Event.bind(window, 'beforeunload', this.handleBeforeUnload);
	}

	#removeGlobalErrorHandlers() {
		Event.unbind(window, 'beforeunload', this.handleBeforeUnload);
	}

	async handleBeforeUnload() {
		if (!this.isEnabled)
		{
			return;
		}

		try
		{
			const logs = await this.storage.getLogsBatch();
			if (logs.length === 0)
			{
				return;
			}

			const data = new Blob(
				[JSON.stringify(logs)],
				{ type: 'application/json' },
			);

			const sent = navigator.sendBeacon(this.url, data);

			if (!sent)
			{
				throw new AccidentLoggerError('Sending failed');
			}

			const idsToDelete = logs.flatMap(({ ids }) => ids);
			await this.storage.deleteLogsBatch(idsToDelete);
		}
		catch (error)
		{
			await this.storage.addLog(AccidentLoggerError.getByError(error));
		}
		finally
		{
			this.destroy();
			this.storage.destroy();
		}
	}

	async #sendLogs() {
		try
		{
			const logs = await this.storage.getLogsBatch();
			if (logs.length === 0)
			{
				await this.storage.deleteLogs();

				return;
			}

			// don't use BX.ajax because window.XMLHttpRequest doesn't have property keepalive
			const response = await fetch(this.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(logs),
				keepalive: true,
			});

			if (!response.ok)
			{
				throw new AccidentLoggerError(`Sending error, response [${response.status} ${response.statusText}]`);
			}

			const idsToDelete = logs.flatMap(({ ids }) => ids);
			await this.storage.deleteLogsBatch(idsToDelete);

			await this.storage.deleteLogs();
		}
		catch (error)
		{
			await this.storage.addLog(AccidentLoggerError.getByError(error));
		}
	}

	destroy() {
		clearTimeout(this.sendingLoopTimeout);
		this.#removeGlobalErrorHandlers();
		if (this.isSending)
		{
			this.isSending = false;
		}
	}
}

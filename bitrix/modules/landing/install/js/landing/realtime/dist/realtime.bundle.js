/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, pull_client) {
	'use strict';

	const COMMAND_ON_EVENT = 'LandingRealtime:onEvent';
	const MODULE_ID = 'landing';
	const subscribers = new Map();
	let isPullSubscribed = false;
	const log = (...args) => {
		if (typeof console !== 'undefined' && typeof console.info === 'function') {
			console.info('[LandingRealtime]', ...args);
		}
	};
	const dispatchEvent = (subscribers, payload) => {
		const handlers = subscribers.get(payload.eventName);
		if (!handlers) {
			return;
		}
		[...handlers].forEach(handler => {
			try {
				handler(payload);
			} catch (error) {}
		});
	};
	const subscribeToPull = callback => {
		if (!pull_client.PULL || typeof pull_client.PULL.subscribe !== 'function') {
			log('Pull client is unavailable');
			return;
		}
		log('Subscribing to Pull', {
			moduleId: MODULE_ID,
			command: COMMAND_ON_EVENT
		});
		pull_client.PULL.subscribe({
			type: pull_client.PullClient.SubscriptionType.Server,
			moduleId: MODULE_ID,
			callback: event => {
				log('Pull event received', event);
				if (!event || event.command !== COMMAND_ON_EVENT) {
					log('Pull event ignored by command', event?.command);
					return;
				}
				log('Realtime payload accepted from Pull', event.params);
				callback(event.params);
			}
		});
	};
	const isPlainObject = value => {
		return value !== null && typeof value === 'object' && !Array.isArray(value);
	};
	const normalizePayload = payload => {
		if (!isPlainObject(payload)) {
			log('Payload ignored: not an object', payload);
			return null;
		}
		const eventName = String(payload.eventName || '').trim();
		const entityType = String(payload.entityType || '').trim();
		const action = String(payload.action || '').trim();
		const source = String(payload.source || '').trim();
		const entityId = parseInt(payload.entityId, 10);
		if (eventName === '' || entityType === '' || action === '' || source === '' || !Number.isFinite(entityId) || entityId <= 0) {
			log('Payload ignored: invalid required fields', payload);
			return null;
		}
		return {
			eventName,
			entityType,
			entityId,
			action,
			source,
			scope: isPlainObject(payload.scope) ? payload.scope : {},
			meta: isPlainObject(payload.meta) ? payload.meta : {},
			ts: parseInt(payload.ts, 10) || 0
		};
	};
	const ensurePullSubscription = () => {
		if (isPullSubscribed) {
			return;
		}
		isPullSubscribed = true;
		log('Initializing Pull subscription');
		subscribeToPull(payload => {
			const normalizedPayload = normalizePayload(payload);
			if (normalizedPayload) {
				log('Dispatching normalized payload', normalizedPayload);
				dispatchEvent(subscribers, normalizedPayload);
			}
		});
	};
	class Realtime {
		static subscribe(eventName, handler) {
			const normalizedEventName = String(eventName || '').trim();
			if (normalizedEventName === '' || typeof handler !== 'function') {
				log('Subscribe ignored: invalid arguments', {
					eventName,
					handlerType: typeof handler
				});
				return () => {};
			}
			if (!subscribers.has(normalizedEventName)) {
				subscribers.set(normalizedEventName, new Set());
			}
			subscribers.get(normalizedEventName).add(handler);
			log('Subscriber added', {
				eventName: normalizedEventName,
				count: subscribers.get(normalizedEventName).size
			});
			ensurePullSubscription();
			return () => {
				const handlers = subscribers.get(normalizedEventName);
				if (handlers) {
					handlers.delete(handler);
					if (handlers.size === 0) {
						subscribers.delete(normalizedEventName);
					}
				}
			};
		}
	}

	exports.Realtime = Realtime;

})(this.BX.Landing = this.BX.Landing || {}, BX);

import {dispatchEvent} from './feature/dispatch-event/dispatch-event';
import {subscribeToPull} from './infrastructure/pull/subscribe';

const subscribers = new Map();
let isPullSubscribed = false;

const log = (...args) => {
	if (typeof console !== 'undefined' && typeof console.info === 'function')
	{
		console.info('[LandingRealtime]', ...args);
	}
};

const isPlainObject = (value) => {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const normalizePayload = (payload) => {
	if (!isPlainObject(payload))
	{
		log('Payload ignored: not an object', payload);

		return null;
	}

	const eventName = String(payload.eventName || '').trim();
	const entityType = String(payload.entityType || '').trim();
	const action = String(payload.action || '').trim();
	const source = String(payload.source || '').trim();
	const entityId = parseInt(payload.entityId, 10);

	if (
		eventName === ''
		|| entityType === ''
		|| action === ''
		|| source === ''
		|| !Number.isFinite(entityId)
		|| entityId <= 0
	)
	{
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
		ts: parseInt(payload.ts, 10) || 0,
	};
};

const ensurePullSubscription = () => {
	if (isPullSubscribed)
	{
		return;
	}

	isPullSubscribed = true;
	log('Initializing Pull subscription');
	subscribeToPull((payload) => {
		const normalizedPayload = normalizePayload(payload);
		if (normalizedPayload)
		{
			log('Dispatching normalized payload', normalizedPayload);
			dispatchEvent(subscribers, normalizedPayload);
		}
	});
};

export class Realtime
{
	static subscribe(eventName: string, handler: Function): Function
	{
		const normalizedEventName = String(eventName || '').trim();
		if (normalizedEventName === '' || typeof handler !== 'function')
		{
			log('Subscribe ignored: invalid arguments', {
				eventName,
				handlerType: typeof handler,
			});

			return () => {};
		}

		if (!subscribers.has(normalizedEventName))
		{
			subscribers.set(normalizedEventName, new Set());
		}

		subscribers.get(normalizedEventName).add(handler);
		log('Subscriber added', {
			eventName: normalizedEventName,
			count: subscribers.get(normalizedEventName).size,
		});
		ensurePullSubscription();

		return () => {
			const handlers = subscribers.get(normalizedEventName);
			if (handlers)
			{
				handlers.delete(handler);
				if (handlers.size === 0)
				{
					subscribers.delete(normalizedEventName);
				}
			}
		};
	}
}

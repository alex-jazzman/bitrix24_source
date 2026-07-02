import bind from './event/bind';
import unbind from './event/unbind';
import unbindAll from './event/unbind-all';
import bindOnce from './event/bind-once';
import EventEmitter from './event/event-emitter';
import BaseEvent from './event/base-event';
import ready from './event/ready';
import { getEventListeners } from './event/get-event-listeners';

/**
 * @memberOf BX
 */
export default class Event
{
	static bind: typeof bind = bind;
	static bindOnce: typeof bindOnce = bindOnce;
	static unbind: typeof unbind = unbind;
	static unbindAll: typeof unbindAll = unbindAll;
	static ready: typeof ready = ready;
	static getEventListeners: typeof getEventListeners = getEventListeners;
	static EventEmitter: typeof EventEmitter = EventEmitter;
	static BaseEvent: typeof BaseEvent = BaseEvent;
}

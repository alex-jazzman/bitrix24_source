import { BaseEvent, EventEmitter } from 'main.core.events';

/**
 * An event of the grid, in the shape everything around this screen reads one. The arguments travel
 * as compatibility data because that is where both `BX.addCustomEvent` and `EventEmitter.subscribe`
 * take them from: a plain `emit(name, [grid])` leaves `getCompatData()` empty. The name is the
 * global one, so a listener registered by either interface hears it.
 */
export function emitGridEvent(name: string, args: unknown[] = []): void
{
	EventEmitter.emit(
		name,
		new BaseEvent({ data: args, compatData: args }),
		{ useGlobalNaming: true },
	);
}

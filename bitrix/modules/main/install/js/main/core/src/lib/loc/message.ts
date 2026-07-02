import Type from '../type';
import Runtime from '../runtime';
import EventEmitter from '../event/event-emitter';
import BaseEvent from '../event/base-event';

type MessageParam = string | Record<string, string | number>;

export interface MessageFunction {
	(value: MessageParam): string | boolean | void;
	[key: string]: any;
}

const message = function(value: MessageParam): string | boolean | void
{
	if (Type.isString(value))
	{
		if (Type.isNil(message[value]))
		{
			(EventEmitter as any).emit('onBXMessageNotFound', new BaseEvent({ compatData: [value] }));

			if (Type.isNil(message[value]))
			{
				Runtime.debug(`message undefined: ${value}`);
				message[value] = '';
			}
		}

		return message[value];
	}

	if (Type.isPlainObject(value))
	{
		Object.keys(value).forEach((key) => {
			message[key] = value[key];
		});
	}

	return undefined;
} as MessageFunction;

export default message;

if (!Type.isNil((window as any).BX) && Type.isFunction((window as any).BX.message))
{
	Object.keys((window as any).BX.message).forEach((key: string) => {
		message({ [key]: (window as any).BX.message[key] });
	});
}

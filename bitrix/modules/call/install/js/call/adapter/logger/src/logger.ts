import { Logger as ImLogger } from 'im.v2.lib.logger';

// TODO: [call-ts] wait ImLogger to ts
const loggerMethods = {
	warn(...params: unknown[])
	{
		ImLogger.warn(...params);
	},
	error(...params: unknown[])
	{
		ImLogger.error(...params);
	},
	log(...params: unknown[])
	{
		ImLogger.log(...params);
	},
};

export const Logger = new Proxy(loggerMethods, {
	get(target, property)
	{
		if (Reflect.has(target, property))
		{
			return Reflect.get(target, property);
		}

		throw new Error(`Logger: method "${String(property)}" is not defined in the adapter. Register it explicitly.`);
	},
});
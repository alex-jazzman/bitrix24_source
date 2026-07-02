import Type from '../../type';
import Runtime from '../../runtime';

export default class WarningStore
{
	warnings: Map<any, any> = new Map();
	printDelayed: Function;

	constructor()
	{
		this.printDelayed = Runtime.debounce(this.print.bind(this), 500);
	}

	add(target: any, eventName: string, listeners: Map<any, any>): void
	{
		let contextWarnings = this.warnings.get(target);
		if (!contextWarnings)
		{
			contextWarnings = Object.create(null);
			this.warnings.set(target, contextWarnings);
		}

		if (!contextWarnings[eventName])
		{
			contextWarnings[eventName] = {};
		}

		contextWarnings[eventName].size = listeners.size;
		if (!Type.isArray(contextWarnings[eventName].errors))
		{
			contextWarnings[eventName].errors = [];
		}

		contextWarnings[eventName].errors.push(new Error('EventEmitter warning'));
	}

	print(): void
	{
		this.warnings.forEach((warnings: any) => {
			for (const eventName of Object.keys(warnings))
			{
				console.groupCollapsed(
					'Possible BX.Event.EventEmitter memory leak detected. '
						+ `${warnings[eventName].size} "${eventName}" listeners added. `
						+ 'Use emitter.setMaxListeners() to increase limit.',
				);
				console.dir(warnings[eventName].errors);
				console.groupEnd();
			}
		});

		this.clear();
	}

	clear(): void
	{
		this.warnings.clear();
	}
}

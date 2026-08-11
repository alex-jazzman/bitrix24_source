export class BasePullHandler
{
	constructor()
	{
		if (new.target === BasePullHandler)
		{
			throw new TypeError('BasePullHandler: An abstract class cannot be instantiated');
		}
	}

	getMap(): { [command: string]: Function }
	{
		return {};
	}

	getDelayedMap(): { [command: string]: Function }
	{
		return {};
	}

	isFromAi(data: { FROM_AI?: boolean }): boolean
	{
		return data?.FROM_AI === true;
	}
}

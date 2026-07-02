import { InfoInstance } from './info-instance';

export class Info
{
	static create(config: Object = {}): InfoInstance
	{
		if (!Info.instance)
		{
			Info.instance = new InfoInstance(config);
		}

		return Info.instance;
	}
}

Info.instance = null;

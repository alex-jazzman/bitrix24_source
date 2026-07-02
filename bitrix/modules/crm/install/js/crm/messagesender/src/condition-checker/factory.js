import type { Scenario } from './scenario';
import { Max } from './scenarios/max';
import { RuWhatsApp } from './scenarios/ru-whatsapp';
import { Telegram } from './scenarios/telegram';
import { WhatsApp } from './scenarios/whatsapp';

export class Factory
{
	static getScenarioInstance(name: string, params: Object): Scenario
	{
		if (name === 'telegrambot')
		{
			return new Telegram(params);
		}

		if (name === 'ru-whatsapp') // for RU region
		{
			return new RuWhatsApp(params);
		}

		if (name === 'whatsapp') // for not RU region
		{
			return new WhatsApp(params);
		}

		if (name === 'max')
		{
			return new Max(params);
		}

		throw new RangeError(`Unknown scenario name: ${name}`);
	}
}

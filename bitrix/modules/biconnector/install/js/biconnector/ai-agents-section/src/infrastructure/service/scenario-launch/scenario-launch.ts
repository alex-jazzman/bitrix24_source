import { ajax as Ajax } from 'main.core';

import { mapErrorToAnswer, mapResponseToAnswer } from './mappers';
import { type LaunchAnswer } from './types';

const LAUNCH_ACTION = 'biconnector.aiagentsscenario.launch';

const LAUNCH_TIMEOUT = 10000;

const TIMED_OUT = Symbol('timed-out');

export class ScenarioLaunch
{
	launch(cardId: string): Promise<LaunchAnswer | null>
	{
		const request = Ajax.runAction(LAUNCH_ACTION, { data: { cardId } })
			.then(mapResponseToAnswer, mapErrorToAnswer)
		;

		let timeoutId: number = 0;
		const timeout = new Promise((resolve: (value: symbol) => void): void => {
			timeoutId = setTimeout((): void => {
				resolve(TIMED_OUT);
			}, LAUNCH_TIMEOUT);
		});

		return Promise.race([request, timeout]).finally((): void => {
			clearTimeout(timeoutId);
		}).then(
			(answer: LaunchAnswer | symbol): LaunchAnswer | null => (answer === TIMED_OUT ? null : answer as LaunchAnswer),
		);
	}
}

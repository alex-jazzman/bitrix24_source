import {PULL, PullClient} from 'pull.client';
import {COMMAND_ON_EVENT, MODULE_ID} from '../../const/command';

const log = (...args) => {
	if (typeof console !== 'undefined' && typeof console.info === 'function')
	{
		console.info('[LandingRealtime]', ...args);
	}
};

export const subscribeToPull = (callback: Function): void => {
	if (!PULL || typeof PULL.subscribe !== 'function')
	{
		log('Pull client is unavailable');

		return;
	}

	log('Subscribing to Pull', {
		moduleId: MODULE_ID,
		command: COMMAND_ON_EVENT,
	});

	PULL.subscribe({
		type: PullClient.SubscriptionType.Server,
		moduleId: MODULE_ID,
		callback: (event) => {
			log('Pull event received', event);

			if (!event || event.command !== COMMAND_ON_EVENT)
			{
				log('Pull event ignored by command', event?.command);

				return;
			}

			log('Realtime payload accepted from Pull', event.params);
			callback(event.params);
		},
	});
};

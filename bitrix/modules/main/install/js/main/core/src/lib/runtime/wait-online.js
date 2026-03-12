import Event from '../event';

export function waitOnline(): Promise<void>
{
	return new Promise((resolve) => {
		Event.bindOnce(window, 'online', () => resolve());
	});
}

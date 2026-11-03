import { CALL_PHONE_SVG } from '../icons.js';

export class CallTabNotifier
{
	#tabBlinker;
	#phrases;

	constructor(tabBlinker, phrases)
	{
		this.#tabBlinker = tabBlinker;
		this.#phrases = phrases;
	}

	stop()
	{
		this.#tabBlinker.stop();
	}

	notify(callName)
	{
		this.#tabBlinker.start(this.#phrases.blinkTitle(callName));

		if (Notification.permission !== 'granted')
		{
			return;
		}

		const notification = new Notification(this.#phrases.notificationTitle(callName), {
			body: this.#phrases.notificationBody,
			icon: CALL_PHONE_SVG,
			requireInteraction: true,
			tag: 'call-on-other-tab',
		});

		const timer = setTimeout(() => notification.close(), 10000);

		const onFocus = () => {
			clearTimeout(timer);
			notification.close();
		};
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		window.addEventListener('focus', onFocus, { once: true });

		notification.onclick = () => {
			clearTimeout(timer);
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			window.removeEventListener('focus', onFocus);
			window.focus();
			notification.close();
		};
	}
}

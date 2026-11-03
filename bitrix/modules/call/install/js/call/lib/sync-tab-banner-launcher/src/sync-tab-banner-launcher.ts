import { Extension, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventType } from 'im.v2.const';

import { Logger } from 'call.adapter.logger';

const BANNER_EXTENSION = 'call.component.sync-tab-banner';
const NEED_TO_SHOW_SETTING = 'syncTabBannerNeedToShow';

type SyncTabBannerApi = {
	launch: (surface: 'messenger' | 'sync-page') => void,
	cancel: () => void,
};

// This launcher rides the non-lazy chain of call.lib.call-manager, so it must stay tiny:
// markup, assets and the show logic live in the banner extension, which is loaded only when
// the messenger is up and the server snapshot still asks for the banner.
let banner: SyncTabBannerApi | null = null;
let cancelled: boolean = false;

// The snapshot is taken when the page is rendered; a missing one (a page without call.core)
// counts as "do not show". Staleness between tabs is settled by the banner itself.
const needToShow = (): boolean => {
	return Extension.getSettings('call.core').get(NEED_TO_SHOW_SETTING, false) === true;
};

const start = (surface: 'messenger' | 'sync-page'): void => {
	cancelled = false;

	if (!needToShow())
	{
		return;
	}

	void Runtime.loadExtension(BANNER_EXTENSION)
		.then((exports: unknown): void => {
			// the messenger may be gone by the time the extension resolves
			if (cancelled)
			{
				return;
			}

			const { SyncTabBanner } = exports as { SyncTabBanner: SyncTabBannerApi };
			banner = SyncTabBanner;
			SyncTabBanner.launch(surface);
		})
		.catch((error: Error) => Logger.warn('SyncTabBannerLauncher: failed to load the banner extension', error));
};

// The surface reports its closing from both the unmount and the slider, so this can arrive twice.
const handleMessengerClose = (): void => {
	if (cancelled)
	{
		return;
	}

	cancelled = true;
	banner?.cancel();
	banner = null;
};

// The Sync page has no messenger, so it starts the banner itself. Exported rather than driven
// by another event: both sides live in `call`, and a direct call keeps the contract visible.
export const SyncTabBannerLauncher = {
	startOnSyncPage: (): void => start('sync-page'),
	cancel: handleMessengerClose,
};

// `call` and `im` are updated independently, so a portal can run this build over an `im` whose
// constants predate these keys. Reading them unguarded would throw while the module is still
// loading and take the whole bundle down; an `im` that old does not emit the events anyway, so
// staying silent is the only thing left to do.
const messengerEvents = EventType?.messenger;
if (messengerEvents)
{
	EventEmitter.subscribe(messengerEvents.onReady, () => start('messenger'));
	EventEmitter.subscribe(messengerEvents.onClose, handleMessengerClose);
}

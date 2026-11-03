import { Type } from 'main.core';
import { BitrixVue, type App as VueApp } from 'ui.vue3';

import { createReadyNotifier } from '../lib/create-ready-notifier/create-ready-notifier';
import { App } from './app';

export type EmbedProjectInfoParams = {
	projectId: number,
	/**
	 * Called at most once for this handle after its first mounted application settles and updates the DOM.
	 * Mounting the same handle again after unmount does not produce another signal.
	 */
	onReady?: () => void,
};

export type EmbedProjectInfoHandle = {
	mount: (container: HTMLElement) => void,
	unmount: () => void,
};

/**
 * Public handle of the read-only project "Information" block.
 * The consumer mounts it into a prepared sidebar slot and unmounts on chat close.
 * The block never throws on read failure and degrades to empty sections.
 */
export function embedProjectInfo({ projectId, onReady }: EmbedProjectInfoParams): EmbedProjectInfoHandle
{
	let application: VueApp | null = null;
	const notifyReady = createReadyNotifier(onReady);

	return {
		mount: (container: HTMLElement): void => {
			if (application !== null || !Type.isDomNode(container))
			{
				return;
			}

			application = BitrixVue.createApp(App, { projectId, onReady: notifyReady });
			application.mount(container);
		},
		unmount: (): void => {
			application?.unmount();
			application = null;
		},
	};
}

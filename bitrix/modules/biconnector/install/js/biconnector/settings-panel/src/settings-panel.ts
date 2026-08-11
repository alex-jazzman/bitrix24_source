import { Tag, Dom } from 'main.core';
import 'date';
import 'ui.design-tokens';
import 'ui.notification';
import './settings-panel.css';
import { PeriodFilterCard } from './cards/period-filter-card';
import { LanguageTimezoneCard } from './cards/language-timezone-card';
import { ClearCacheCard } from './cards/clear-cache-card';
import { DatasetTypingCard } from './cards/dataset-typing-card';
import { EncryptionKeyCard } from './cards/encryption-key-card';

import './cards/cards-common.css';

export { CollapsibleCard } from './card/collapsible-card';
export { CardHint } from './card/card-hint';
export { PeriodFilterCard } from './cards/period-filter-card';
export { LanguageTimezoneCard } from './cards/language-timezone-card';
export { ClearCacheCard } from './cards/clear-cache-card';
export { DatasetTypingCard } from './cards/dataset-typing-card';
export { EncryptionKeyCard } from './cards/encryption-key-card';
export { SettingsApi } from './api/settings-api';

export type {
	PeriodFilterData,
	LanguageTimezoneData,
	ClearCacheData,
	DatasetTypingData,
	EncryptionKeyData,
	CardOptions,
	HintOptions,
} from './types';

interface CardLike {
	getLayout(): HTMLElement;
}

interface SettingsPanelOptions {
	container: HTMLElement;
	cards: CardLike[];
}

export class SettingsPanel
{
	#container: HTMLElement;
	#cards: CardLike[];

	constructor(options: SettingsPanelOptions)
	{
		this.#container = options.container;
		this.#cards = options.cards;
	}

	render(): void
	{
		const list = Tag.render`
			<div class="biconnector-settings-panel__card-list"></div>
		`;

		for (const card of this.#cards)
		{
			Dom.append(card.getLayout(), list);
		}

		Dom.append(list, this.#container);

		this.#installChromiumScrollFreezeWorkaround();
	}

	// TODO: remove when Chromium fixes pointer hit-test invalidation on iframe
	// slider close. After any nested slider opened over our iframe (intranet
	// settings, BX.Helper helpdesk, etc.) closes, Chrome/Edge keep routing
	// wheel events to the now-removed element until pointer hit-test is
	// recalculated. Vivaldi/Firefox are unaffected. Subscribing globally to
	// the top-level slider close event covers every entry point at once.
	#installChromiumScrollFreezeWorkaround(): void
	{
		const topBX = (top as any)?.BX;
		const TopEmitter = topBX?.Event?.EventEmitter;
		if (!TopEmitter)
		{
			return;
		}

		TopEmitter.subscribe(
			TopEmitter.GLOBAL_TARGET,
			'SidePanel.Slider:onCloseComplete',
			() => {
				const body = document.body;
				if (!body)
				{
					return;
				}

				body.style.overflow = 'hidden';
				void body.offsetHeight;
				body.style.overflow = '';
				window.dispatchEvent(new Event('resize'));
			},
		);
	}
}

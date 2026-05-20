import { EventEmitter } from 'main.core.events';
import { VibePage } from './vibe-page';

import './css/style.css';

export type { VibeOptions } from './vibe-section';
export { VibePage };

EventEmitter.subscribe(
	EventEmitter.GLOBAL_TARGET,
	'BX.Intranet.Settings:onExternalPageLoaded:welcome',
	() => {
		return new VibePage();
	},
);

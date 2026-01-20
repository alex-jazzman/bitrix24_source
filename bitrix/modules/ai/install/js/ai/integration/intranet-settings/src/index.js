import { EventEmitter } from 'main.core.events';
import { AiPage } from './pages/ai-page';

export * from './types';

EventEmitter.subscribe(
	EventEmitter.GLOBAL_TARGET,
	'BX.Intranet.Settings:onExternalPageLoaded:ai',
	() => new AiPage(),
);

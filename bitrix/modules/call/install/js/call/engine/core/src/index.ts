import { engineRegistry } from 'call.engine.registry';
import { CoreCallEngine } from './core-call-engine';
import { coreCapabilities } from './core-capabilities';
import { coreRecentCallsSource } from './core-recent-source';

engineRegistry.register({
	engine: () => new CoreCallEngine(),
	capabilities: () => coreCapabilities,
	recentSource: () => coreRecentCallsSource,
});

export { CoreCallEngine };

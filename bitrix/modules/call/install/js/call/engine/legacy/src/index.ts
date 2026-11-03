import { engineRegistry } from 'call.engine.registry';
import { Controller, Util, Engine as CallEngine, EngineLegacy, Event as CallCoreEvent } from 'call.core';
import { LegacyCallEngine } from './legacy-call-engine';
import { createLegacyCapabilities } from './legacy-capabilities';
import { createLegacyRecentCallsSource } from './legacy-recent-source';

// Every member of call.core is read inside a factory: this bundle can be evaluated before
// call.bundle.js (extension cycle call.core -> im.v2 -> call.lib.call-manager -> call.engine.legacy),
// and then the BX.Call namespace both bundles share is still empty here.
engineRegistry.register({
	engine: (context) => new LegacyCallEngine(context, (config) => new Controller(config)),
	capabilities: () => createLegacyCapabilities(Util),
	recentSource: () => createLegacyRecentCallsSource({
		util: Util,
		engine: CallEngine,
		engineLegacy: EngineLegacy,
		event: CallCoreEvent,
	}),
});

export { LegacyCallEngine };

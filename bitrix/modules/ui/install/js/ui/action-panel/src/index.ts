import ActionPanel from './panel';
import ActionPanelItem from './item';
import PositionTracker from './position-tracker';
import OverflowCalculator from './overflow';

/**
 * `AirActionPanel` is the name to reach the panel by from outside. The namespace of this bundle is
 * `BX.UI`, the same one where the legacy `ui.actionpanel` publishes its own `BX.UI.ActionPanel`;
 * the legacy extension depends on this one, loads later and would overwrite the global.
 */
export { ActionPanel, ActionPanel as AirActionPanel, ActionPanelItem, PositionTracker, OverflowCalculator };
export type { ActionPanelOptions } from './panel';
export type { ActionPanelItemOptions, ActionPanelItemClickHandler } from './item';
export type { PositionMetrics, PositionTrackerOptions } from './position-tracker';
export type { OverflowHost } from './overflow';

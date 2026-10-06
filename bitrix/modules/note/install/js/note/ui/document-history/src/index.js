// Theme-aware selection control for the "highlight changes" toggle (native accent-color did not
// adapt its box to the dark theme — bug 0251987). Outline provides the --check-m glyph.
import 'ui.system.checkbox';
import 'ui.icon-set.outline';

import './style.css';

export { ActivityLineComponent } from './activity-line';
export { VersionTimelineComponent } from './version-timeline';
export { ViewsWidgetComponent } from './views-widget';
export { SubscriptionBellComponent } from './subscription-bell';
export { SubscriptionBellView } from './subscription-bell-view';
export { FavoriteStarComponent } from './favorite-star';
export { FavoriteApi } from './favorite-api';
export { HistoryApi, isRestoreDirtyWindowError, RESTORE_DIRTY_WINDOW_ERROR_CODE } from './history-api';
export {
	SubscriptionApi,
	SUBSCRIPTION_SCOPE_DOCUMENT,
	SUBSCRIPTION_SCOPE_COLLECTION,
	SUBSCRIPTION_MODE_SELF,
	SUBSCRIPTION_MODE_SUBTREE,
	SUBSCRIPTION_MODE_ALL,
	SUBSCRIPTION_MODE_MUTED,
} from './subscription-api';
export { createHistoryMessages } from './messages';

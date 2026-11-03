<?php

return [
	'extensions' => [
		'loc',
		'tokens',
		'layout/pure-component',
		'layout/ui/stateful-list',
		'ui-system/blocks/status-block',
		'ui-system/typography/text',
		'ui-system/blocks/icon',
		'ui-system/blocks/avatar',
		'layout/ui/safe-image',
		'ui-system/blocks/chips/chip-status',
		'ui-system/form/buttons',
		// Nothing is imported from the aha-moment popup any more: the dependency stays to keep its
		// `momentsEnabled` flag in the bundle, the portal switch the onboarding hint still obeys.
		'ui-system/popups/aha-moment',
		'bottom-sheet',
		'layout/ui/info-screen',
		'analytics',
		'tourist',
		'layout/ui/loaders/spinner',
		'toast',
		'utils/function',
		'utils/url',
		'asset-manager',
		'device/connection',
		'helpers/component',
		// The transport of the mobile app: there is no BX.ajax.runAction in a JN context.
		'rest/run-action-executor',
		'debug/prism',
		'ui-system/popups/popup-menu',
		'haptics',
		'pull/client/events', // @keep
		'require-lazy',
		// The drawer graph is not named here on purpose: it arrives through requireLazy when the
		// filter is first opened.
		'layout/ui/field-filter/feature',
		'layout/ui/field-filter/entry',
	],
	'bundle' => [
		'./src/unified-filter',
		'./src/unified-filters-feature',
	],
	// The screens this extension opens through ComponentHelper.openLayout. Their versions reach the app
	// inside `availableComponents`, and openLayout falls back to the version '1.0' for a component missing
	// from that map: under a version that never changes the device keeps the bundle it downloaded first
	// and no server rebuild ever reaches it.
	// The section belongs to the extension rather than to the list component, because a host component
	// (the CRM analytics tab, the store document panel) renders this very extension inside its own screen
	// and its map has to carry the same versions - Component::getComponentDependencies() merges the
	// sections of every extension of a component.
	// The list is here for itself: a nested group opens as another list screen.
	'components' => [
		'biconnector:biconnector.dashboard.list',
		'biconnector:biconnector.dashboard.detail',
	],
];

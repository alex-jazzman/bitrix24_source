<?php

return [
	'extensions' => [
		'loc',
		'tokens',
		'apptheme',
		'layout/pure-component',
		'ui-system/blocks/status-block',
		'ui-system/form/buttons/button',
		'ui-system/blocks/icon',
		'ui-system/typography/text',
		'ui-system/layout/box',
		'bottom-sheet',
		// The loader of the waiting states is described in a bundle of this extension, and it turns a token
		// of the design system into the color of a Lottie shape.
		'utils/color',
		// The transport of the mobile app: there is no BX.ajax.runAction in a JN context.
		'rest/run-action-executor',
		// Readiness of the report arrives as a pull event; the extension is what puts BX.PULL in place.
		'pull/client/events', // @keep
		'debug/prism',
		'alert',
		'toast',
		'device/connection',
	],
	'bundle' => [
		'./src/pulse-loader',
	],
];

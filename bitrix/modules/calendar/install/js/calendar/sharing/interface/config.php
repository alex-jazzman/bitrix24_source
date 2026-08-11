<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/interface.bundle.css',
	'js' => 'dist/interface.bundle.js',
	'rel' => [
		'calendar.sharing.analytics',
		'calendar.util',
		'main.core',
		'main.core.events',
		'main.date',
		'main.loader',
		'main.popup',
		'main.qrcode',
		'spotlight',
		'ui.avatar',
		'ui.buttons',
		'ui.cnt',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.info-helper',
		'ui.switcher',
		'ui.tour',
	],
	'skip_core' => false,
];

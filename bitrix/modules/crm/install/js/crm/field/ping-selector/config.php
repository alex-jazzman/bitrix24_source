<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ping-selector.bundle.css',
	'js' => 'dist/ping-selector.bundle.js',
	'rel' => [
		'crm.timeline.tools',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'ui.design-tokens',
		'ui.notification',
	],
	'skip_core' => false,
];

<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/automation.bundle.css',
	'js' => 'dist/automation.bundle.js',
	'rel' => [
		'bizproc.automation',
		'bizproc.condition',
		'bizproc.globals',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.alerts',
		'ui.buttons',
		'ui.design-tokens',
		'ui.entity-selector',
		'ui.fonts.opensans',
		'ui.hint',
		'ui.notification',
		'ui.tour',
	],
	'skip_core' => false,
];

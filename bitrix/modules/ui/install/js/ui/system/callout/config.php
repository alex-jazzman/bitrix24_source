<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/callout.bundle.js',
	'css' => './dist/callout.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.system.popover',
		'ui.system.typography',
	],
	'skip_core' => false,
];

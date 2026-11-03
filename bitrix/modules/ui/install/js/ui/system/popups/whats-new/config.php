<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/whats-new.bundle.js',
	'css' => './dist/whats-new.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.buttons',
		'ui.buttons.icons',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.system.chip',
		'ui.system.typography',
	],
	'skip_core' => false,
];

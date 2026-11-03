<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/notifications-drawer.bundle.css',
	'js' => 'dist/notifications-drawer.bundle.js',
	'rel' => [
		'main.core',
		'socialnetwork.v2.components.elements.accessible-switcher',
		'ui.icon-set.outline',
		'ui.switcher',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];

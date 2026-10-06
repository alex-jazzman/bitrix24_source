<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/auto-delete-popup.bundle.css',
	'js' => 'dist/auto-delete-popup.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'socialnetwork.v2.components.elements.ui-popup',
		'socialnetwork.v2.const',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.menu.vue',
		'ui.system.radiobutton',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => true,
];

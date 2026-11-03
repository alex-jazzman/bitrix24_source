<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

return [
	'css' => 'dist/item-list-selector.bundle.css',
	'js' => 'dist/item-list-selector.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.draganddrop.draggable',
		'ui.forms',
		'ui.icon-set',
		'ui.icon-set.actions',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.vue3',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];

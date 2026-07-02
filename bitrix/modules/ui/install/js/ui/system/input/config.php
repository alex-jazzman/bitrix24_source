<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/input.bundle.css',
	'js' => 'dist/input.bundle.js',
	'rel' => [
		'main.core',
		'ui.hint',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip',
		'ui.system.chip.vue',
	],
	'skip_core' => false,
];

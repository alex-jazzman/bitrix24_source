<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/input.bundle.css',
	'js' => 'dist/input.bundle.js',
	'rel' => [
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'main.core',
		'ui.icon-set.api.core',
		'ui.system.chip',
		'ui.hint',
	],
	'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/comment-files.bundle.css',
	'js' => 'dist/comment-files.bundle.js',
	'rel' => [
		'main.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
	],
	'skip_core' => false,
];

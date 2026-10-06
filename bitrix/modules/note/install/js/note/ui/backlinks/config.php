<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/backlinks.bundle.js',
	'css' => './dist/backlinks.bundle.css',
	'rel' => [
		'main.core',
		'note.ui.assets',
		'note.ui.loader',
		'note.ui.popover-position',
		'pull.client',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];

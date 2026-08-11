<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/mention-chip.bundle.js',
	'css' => './dist/mention-chip.bundle.css',
	'rel' => [
		'main.core',
		'note.ui.assets',
		'ui.avatar',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];

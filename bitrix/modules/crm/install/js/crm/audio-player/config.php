<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/audio-player.bundle.css',
	'js' => 'dist/audio-player.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.icon-set.api.core',
		'ui.vue3',
		'ui.vue3.components.audioplayer',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/playback.bundle.js',
    'rel' => [
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.local-storage',
		'main.core',
		'main.core.events',
		'ui.vue3',
	],
    'skip_core' => false,
];

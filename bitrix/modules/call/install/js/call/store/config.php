<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/call-store.bundle.js',
	'rel' => [
		'call.lib.media-registry',
		'main.core',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];

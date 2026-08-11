<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-vue.bundle.css',
	'js' => 'dist/call-vue.bundle.js',
	'rel' => [
		'call.lib.view-contract',
		'call.mapping',
		'ui.vue3',
		'call.lib.media-registry',
		'main.core',
		'call.store',
	],
	'skip_core' => false,
];

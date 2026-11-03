<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call.bundle.css',
	'js' => 'dist/call.bundle.js',
	'rel' => [
		'call.component.view.call',
		'call.lib.media-registry',
		'call.mapping',
		'call.plugin.loc',
		'call.store',
		'main.core',
		'ui.vue3',
	],
	'skip_core' => false,
];

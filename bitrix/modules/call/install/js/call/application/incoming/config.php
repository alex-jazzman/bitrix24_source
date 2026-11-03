<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/incoming.bundle.css',
	'js' => 'dist/incoming.bundle.js',
	'rel' => [
		'call.adapter.desktop-api',
		'call.component.view.incoming',
		'call.mapping',
		'call.plugin.loc',
		'call.store',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.vue3',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/vibecode-app.bundle.css',
	'js' => 'dist/vibecode-app.bundle.js',
	'rel' => [
		'im.v2.component.list.container.elements.filter-row',
		'im.v2.component.list.items.vibecode-app',
		'im.v2.component.search',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.feature',
		'im.v2.lib.logger',
		'main.core',
		'main.core.events',
		'ui.vue3',
	],
	'skip_core' => false,
];

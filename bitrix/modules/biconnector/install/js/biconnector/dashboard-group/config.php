<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/dashboard-group.bundle.css',
	'js' => 'dist/dashboard-group.bundle.js',
	'rel' => [
		'biconnector.error-message',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.notification',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];

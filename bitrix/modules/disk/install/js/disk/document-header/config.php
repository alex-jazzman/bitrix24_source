<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/document-header.bundle.js',
    'css' => './dist/document-header.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'ui.a11y',
		'ui.analytics',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.notification-panel',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
		'ui.vue3.pinia',
	],
    'skip_core' => false,
];

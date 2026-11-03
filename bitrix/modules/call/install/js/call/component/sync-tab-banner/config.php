<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/sync-tab-banner.bundle.js',
    'css' => './dist/sync-tab-banner.bundle.css',
    'rel' => [
		'call.adapter.logger',
		'call.lib.analytics',
		'main.core',
		'main.popup',
		'ui.auto-launch',
		'ui.banner-dispatcher',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
    'skip_core' => false,
];

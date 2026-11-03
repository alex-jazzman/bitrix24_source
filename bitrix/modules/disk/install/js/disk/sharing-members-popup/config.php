<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/sharing-members-popup.bundle.js',
    'css' => './dist/sharing-members-popup.bundle.css',
    'rel' => [
		'main.core',
		'ui.a11y',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.notification-panel',
		'ui.system.dialog',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.avatar',
		'ui.vue3.components.button',
		'ui.vue3.pinia',
	],
    'skip_core' => false,
];

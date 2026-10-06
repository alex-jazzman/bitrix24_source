<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/compose-form.bundle.js',
    'css' => './dist/compose-form.bundle.css',
    'rel' => [
		'mail.migration-state',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'main.sidepanel',
		'ui.a11y',
		'ui.analytics',
		'ui.banner-dispatcher',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.info-helper',
		'ui.system.alert',
		'ui.system.alert.vue',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.system.label',
		'ui.system.label.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
	],
    'skip_core' => false,
];

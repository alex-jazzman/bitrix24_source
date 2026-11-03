<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/mail-template-editor.bundle.js',
    'css' => './dist/mail-template-editor.bundle.css',
    'rel' => [
		'disk.uploader.user-field-widget',
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.mail.sender-selector',
		'ui.system.alert',
		'ui.system.alert.vue',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.switcher',
	],
    'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.animation',
		'im.v2.component.elements.auto-delete',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.button',
		'im.v2.component.elements.dropdown',
		'im.v2.component.elements.hint',
		'im.v2.component.elements.toggle',
		'im.v2.const',
		'im.v2.lib.access',
		'im.v2.lib.auto-delete',
		'im.v2.lib.entity-selector-config',
		'im.v2.lib.feature',
		'im.v2.lib.utils',
		'im.v2.provider.service.chat',
		'main.core',
		'ui.design-tokens.air',
		'ui.entity-selector',
		'ui.forms',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.switcher',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.system.radiobutton',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'ui.vue3.components.switcher',
	],
	'skip_core' => false,
];

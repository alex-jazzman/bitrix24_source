<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/settings-slider.bundle.js',
	'css' => './dist/settings-slider.bundle.css',
	'rel' => [
		'crm.ai.name-service',
		'crm.ai.slider',
		'crm.notice-popup',
		'main.core',
		'ui.buttons',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.pinner',
		'ui.system.label',
		'ui.system.label.vue',
		'ui.system.menu.vue',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];

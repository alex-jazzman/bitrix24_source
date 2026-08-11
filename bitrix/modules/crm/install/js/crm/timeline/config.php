<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/timeline.bundle.css',
	'js' => 'dist/timeline.bundle.js',
	'rel' => [
		'crm.field.color-selector',
		'crm.timeline.item',
		'crm.timeline.tools',
		'main.core',
		'main.core.events',
		'main.date',
		'main.loader',
		'main.popup',
		'rest.client',
		'ui.analytics',
		'ui.buttons',
		'ui.cnt',
		'ui.design-tokens',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.info-helper',
		'ui.notification',
		'ui.system.label',
		'ui.system.menu',
		'ui.vue3',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];

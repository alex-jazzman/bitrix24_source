<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/v2.bundle.css',
	'js' => 'dist/v2.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.accessrights.v2.item-list-selector',
		'ui.analytics',
		'ui.buttons',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.ears',
		'ui.entity-selector',
		'ui.fonts.opensans',
		'ui.forms',
		'ui.hint',
		'ui.icon',
		'ui.icon-set.actions',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.main',
		'ui.icons.b24',
		'ui.notification',
		'ui.system.chip.vue',
		'ui.vue3',
		'ui.vue3.components.popup',
		'ui.vue3.components.rich-menu',
		'ui.vue3.components.switcher',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];

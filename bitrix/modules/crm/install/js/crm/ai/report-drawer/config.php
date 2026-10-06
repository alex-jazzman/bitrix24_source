<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/report-drawer.bundle.js',
	'css' => './dist/report-drawer.bundle.css',
	'rel' => [
		'crm.audio-player',
		'crm.mini-card',
		'crm.router',
		'crm.timeline.tools',
		'crm_common',
		'main.core',
		'main.date',
		'main.popup',
		'main.sidepanel',
		'pull.client',
		'pull.queuemanager',
		'ui.buttons',
		'ui.buttons.icons',
		'ui.design-tokens',
		'ui.entity-selector',
		'ui.forms',
		'ui.icon-set.api.core',
		'ui.icon-set.crm',
		'ui.icon-set.outline',
		'ui.icons.b24',
		'ui.progressround',
		'ui.system.typography.vue',
		'ui.typography',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
		'ui.vue3.mixins.loc-mixin',
	],
	'skip_core' => false,
];

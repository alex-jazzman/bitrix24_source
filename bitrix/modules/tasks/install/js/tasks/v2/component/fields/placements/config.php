<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/placements.bundle.css',
	'js' => 'dist/placements.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.const',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.provider.service.placement-service',
		'ui.icon-set.animated',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.system.typography.vue',
	],
	'skip_core' => false,
];

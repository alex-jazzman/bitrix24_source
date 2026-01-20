<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/placements.bundle.css',
	'js' => 'dist/placements.bundle.js',
	'rel' => [
		'ui.icon-set.animated',
		'tasks.v2.provider.service.placement-service',
		'ui.system.typography.vue',
		'main.core',
		'tasks.v2.const',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.lib.field-highlighter',
	],
	'skip_core' => false,
];

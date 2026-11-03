<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/repeat-sale-body.bundle.js',
    'css' => './dist/repeat-sale-body.bundle.css',
    'rel' => [
		'crm.ai.name-service',
		'crm.timeline.item',
		'main.core',
		'ui.a11y',
		'ui.hint',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.system.typography.vue',
	],
    'skip_core' => false,
];

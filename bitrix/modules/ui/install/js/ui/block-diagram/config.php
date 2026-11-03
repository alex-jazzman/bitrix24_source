<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/block-diagram.bundle.css',
	'js' => 'dist/block-diagram.bundle.js',
	'rel' => [
		'main.core',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.a11y',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.icon-set.api.vue',
		'ui.system.tooltip',
		'ui.system.tooltip.vue',
		'ui.vue3',
	],
	'skip_core' => false,
	 'settings' => [
        'isRenderOptimizationAvailable' => \Bitrix\Main\Config\Option::get('ui', 'block_diagram_render_optimization', 'N'),
    ],
];
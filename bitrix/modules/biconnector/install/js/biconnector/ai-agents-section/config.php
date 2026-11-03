<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/ai-agents-section.bundle.js',
    'css' => './dist/ai-agents-section.bundle.css',
    'rel' => [
		'biconnector.apache-superset-analytics',
		'main.core',
		'main.polyfill.intersectionobserver',
		'ui.buttons',
		'ui.design-tokens.air',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.info-helper',
		'ui.system.typography',
	],
    'skip_core' => false,
];

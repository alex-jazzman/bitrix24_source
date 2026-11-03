<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/bitrixgpt-bi-announce.bundle.js',
    'css' => './dist/bitrixgpt-bi-announce.bundle.css',
    'rel' => [
		'biconnector.apache-superset-analytics',
		'main.core',
		'main.core.events',
		'ui.auto-launch',
		'ui.buttons',
		'ui.design-tokens.air',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.system.dialog',
		'ui.system.label',
		'ui.system.typography',
	],
    'skip_core' => false,
];

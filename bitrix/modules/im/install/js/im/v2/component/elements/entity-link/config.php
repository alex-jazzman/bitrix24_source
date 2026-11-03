<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/entity-link.bundle.js',
    'css' => './dist/entity-link.bundle.css',
    'rel' => [
		'im.v2.const',
		'im.v2.css.classes',
		'main.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.vue3',
	],
    'skip_core' => false,
];

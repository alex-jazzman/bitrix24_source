<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/question-mark.bundle.js',
    'css' => './dist/question-mark.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'socialnetwork.v2.components.elements.ui-hint',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.vue3',
		'ui.vue3.directives.hint',
	],
    'skip_core' => true,
];

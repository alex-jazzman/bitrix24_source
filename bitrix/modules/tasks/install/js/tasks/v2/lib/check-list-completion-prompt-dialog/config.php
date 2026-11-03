<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/check-list-completion-prompt-dialog.bundle.js',
    'css' => './dist/check-list-completion-prompt-dialog.bundle.css',
    'rel' => [
		'main.core',
		'tasks.v2.component.elements.progress-bar',
		'tasks.v2.lib.check-list-bb-code',
		'ui.a11y',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.alert',
		'ui.system.typography',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
		'ui.vue3.components.rich-loc',
		'ui.vue3.mixins.loc-mixin',
	],
    'skip_core' => false,
];

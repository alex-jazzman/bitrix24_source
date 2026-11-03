<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/registry.bundle.js',
    'css' => './dist/registry.bundle.css',
    'rel' => [
		'im.v2.component.content.chat-forms.elements',
		'im.v2.component.elements.loader',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.folder',
		'im.v2.lib.layout',
		'im.v2.lib.notifier',
		'im.v2.provider.service.folder',
		'main.core',
		'ui.design-tokens.air',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.icon-set.solid',
		'ui.system.typography.vue',
		'ui.vue3.components.switcher',
	],
    'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.animation',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.entity-link',
		'im.v2.component.elements.list-loading-state',
		'im.v2.component.list.items.elements.input-action-indicator',
		'im.v2.const',
		'im.v2.css.classes',
		'im.v2.lib.a11y',
		'im.v2.lib.counter',
		'im.v2.lib.date-formatter',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'im.v2.lib.parser',
		'im.v2.lib.permission',
		'im.v2.lib.recent',
		'im.v2.lib.utils',
		'main.core',
		'main.date',
		'ui.cnt',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.vue3',
		'ui.vue3.components.counter',
		'ui.vue3.components.rich-loc',
	],
	'skip_core' => false,
];

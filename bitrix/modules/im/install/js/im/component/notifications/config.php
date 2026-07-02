<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/notifications.bundle.css',
	'js' => 'dist/notifications.bundle.js',
	'rel' => [
		'im.const',
		'im.lib.animation',
		'im.lib.logger',
		'im.lib.timer',
		'im.lib.utils',
		'im.view.element.attach',
		'im.view.element.keyboard',
		'im.view.popup',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.design-tokens',
		'ui.forms',
		'ui.vue',
		'ui.vue.portal',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];
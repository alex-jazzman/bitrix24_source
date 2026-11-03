<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/recording.bundle.js',
    'css' => './dist/recording.bundle.css',
    'rel' => [
		'im.v2.application.core',
		'im.v2.component.elements.player',
		'im.v2.component.textarea',
		'im.v2.lib.analytics',
		'im.v2.lib.desktop-api',
		'im.v2.lib.helpdesk',
		'im.v2.lib.logger',
		'im.v2.lib.utils',
		'im.v2.lib.voice-recorder',
		'im.v2.provider.service.uploading',
		'main.core',
		'main.core.events',
		'ui.a11y',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
		'ui.vue3',
	],
    'skip_core' => false,
];

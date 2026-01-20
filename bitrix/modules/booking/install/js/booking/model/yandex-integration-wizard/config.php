<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/yandex-integration-wizard.bundle.css',
	'js' => 'dist/yandex-integration-wizard.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.vuex',
		'booking.provider.service.yandex-integration-wizard-service',
		'booking.const',
		'booking.model.resources',
	],
	'skip_core' => true,
];

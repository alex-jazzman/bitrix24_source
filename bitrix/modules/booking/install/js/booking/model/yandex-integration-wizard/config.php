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
		'booking.const',
		'booking.provider.service.yandex-integration-wizard-service',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];

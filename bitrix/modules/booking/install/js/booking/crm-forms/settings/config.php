<?php

use Bitrix\Booking\Internals\Container;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/settings.bundle.js',
	'css' => 'dist/settings.bundle.css',
	'rel' => [
		'main.loader',
		'booking.application.sku-resources-editor',
		'booking.provider.service.crm-form-service',
		'main.core.events',
		'booking.const',
		'main.core',
		'ui.entity-selector',
	],
	'skip_core' => false,
	'settings' => [
		'isToolDisabled' => (
			Loader::includeModule('booking')
			&& Container::getIntranetBookingTool()->isDisabled()
		),
	],
];

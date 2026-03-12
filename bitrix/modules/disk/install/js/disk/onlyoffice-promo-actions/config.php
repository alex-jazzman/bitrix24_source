<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Disk\Document\OnlyOffice\Bitrix24Scenario;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Disk\Internal\Service\OnlyOffice\Promo\PromoResolver;
use Bitrix\Main\Loader;

Loader::requireModule('disk');

$serviceLocator = ServiceLocator::getInstance();
$promoResolver = $serviceLocator->get(PromoResolver::class);
$bitrix24Scenario = $serviceLocator->get(Bitrix24Scenario::class);

return [
	'css' => 'dist/onlyoffice-promo-actions.bundle.css',
	'js' => 'dist/onlyoffice-promo-actions.bundle.js',
	'rel' => [
		'main.core',
		'ui.info-helper',
		'ui.feedback.form',
		'disk.promo-boost',
	],
	'skip_core' => false,
	'settings' => [
		'action' => $promoResolver->resolve(),
		'canUseEditByTariff' => $bitrix24Scenario->canUseEdit(),
	],
];

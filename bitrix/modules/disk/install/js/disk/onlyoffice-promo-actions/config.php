<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Disk\Document\OnlyOffice\Bitrix24Scenario;
use Bitrix\Disk\Internal\Service\Environment;
use Bitrix\Disk\Internal\Service\OnlyOffice\Promo\PromoResolverFactory;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;

Loader::requireModule('disk');

$serviceLocator = ServiceLocator::getInstance();
$promoResolverFactory = $serviceLocator->get(PromoResolverFactory::class);
$bitrix24Scenario = $serviceLocator->get(Bitrix24Scenario::class);
$environment = $serviceLocator->get(Environment::class);

return [
	'css' => 'dist/onlyoffice-promo-actions.bundle.css',
	'js' => 'dist/onlyoffice-promo-actions.bundle.js',
	'rel' => [
		'disk.onlyoffice-session-restrictions',
		'disk.popup-limits',
		'disk.promo-boost',
		'im.public',
		'main.core',
		'ui.analytics',
		'ui.feedback.form',
		'ui.info-helper',
	],
	'skip_core' => false,
	'settings' => [
		'action' => $promoResolverFactory->make()->resolve(),
		'canUseEditByTariff' => $bitrix24Scenario->canUseEdit(),
		'isCloud' => $environment->isCloudPortal(),
	],
];

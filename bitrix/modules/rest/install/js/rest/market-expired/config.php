<?php

use Bitrix\Rest\Internal\Integration\UI\CopilotService;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$marketExpiredNotification = \Bitrix\Rest\Notification\MarketExpired\MarketExpiredNotification::createByDefault();

return [
	'css' => 'dist/market-expired.bundle.css',
	'js' => 'dist/market-expired.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.analytics',
		'ui.banner-dispatcher',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.info-helper',
		'ui.notification',
		'ui.notification-panel',
	],
	'skip_core' => false,
	'settings' => [
		'type' => $marketExpiredNotification->getType(),
		'category' => $marketExpiredNotification->getCategory(),
		'expireDate' => $marketExpiredNotification->getFormattedEndDate(),
		'expireDays' => $marketExpiredNotification->getFormattedDaysLeft(),
		'copilotName' => CopilotService::getName(),
		'marketSubscriptionUrl' => $marketExpiredNotification->marketSubscription->getBuyUrl(),
		'withDemo' => $marketExpiredNotification->marketSubscription->isDemoAvailable(),
		'discount' => $marketExpiredNotification->marketSubscription->getDiscount()->toArray(),
		'olWidgetCode' => $marketExpiredNotification->getOpenLinesWidgetCode(),
		'isRenamedMarket' => \Bitrix\Rest\Integration\Market\Label::isRenamedMarket(),
	]
];


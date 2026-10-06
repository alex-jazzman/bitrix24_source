<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	/** @see \Bitrix\AI\Handler\Main */
	->register('main', 'onProlog', '\\Bitrix\\AI\\Handler\\Main', 'onProlog')
	/** @see \Bitrix\AI\Handler\Main */
	->register('main', 'onAfterUserDelete', '\\Bitrix\\AI\\Handler\\Main', 'onAfterUserDelete')
	/** @see \Bitrix\AI\Rest */
	->register('rest', 'onRestServiceBuildDescription', '\\Bitrix\\AI\\Rest', 'onRestServiceBuildDescription')
	/** @see \Bitrix\AI\Rest */
	->register('rest', 'onRestAppDelete', '\\Bitrix\\AI\\Rest', 'onRestAppDelete')
	/** @see \Bitrix\AI\Handler\Intranet */
	->register('intranet', 'onSettingsProvidersCollect', '\\Bitrix\\AI\\Handler\\Intranet', 'onSettingsProvidersCollect')
	/** @see \Bitrix\AI\Handler\Baas */
	->register('baas', 'onPackagePurchased', '\\Bitrix\\AI\\Handler\\Baas', 'onPackagePurchased')
;

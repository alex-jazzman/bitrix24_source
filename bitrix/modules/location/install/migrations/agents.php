<?php
$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

/**
 * @see \Bitrix\Location\Infrastructure\DataInstaller::installAreasAgent()
 */
$agent->add('Bitrix\Location\Infrastructure\DataInstaller::installAreasAgent();', 2);

/**
 * @see \Bitrix\Location\Infrastructure\Service\RecentAddressesService::cleanUp()
 */
$agent->add('Bitrix\Location\Infrastructure\Service\RecentAddressesService::cleanUp();', 86400, execDelay: 3600);

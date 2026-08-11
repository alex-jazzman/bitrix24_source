<?php
$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('Bitrix\Seo\Engine\YandexDirect::updateAgent();', 3600, false);
$agent->add('Bitrix\Seo\Adv\LogTable::clean();', 86400, false);
$agent->add('Bitrix\Seo\Adv\Auto::checkQuantityAgent();', 3600, false);

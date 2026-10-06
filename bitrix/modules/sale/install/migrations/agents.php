<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('\Bitrix\Sale\Product2ProductTable::deleteOldProducts(10);', 10 * 24 * 3600);

$agent->add('CSaleRecurring::AgentCheckRecurring();', 7200);
$agent->add('CSaleOrder::RemindPayment();', 86400);
$agent->add('CSaleViewedProduct::ClearViewed();', 86400);
$agent->add('CSaleOrder::ClearProductReservedQuantity();', 86400);

$agent->add('\Bitrix\Sale\Internals\Analytics\Agent::send();', 86400, true);
$agent->add('\Bitrix\Sale\Internals\Analytics\Storage::cleanUpAgent();', 86400, true);

<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('Bitrix\Landing\Agent::clearRecycle();', 7200, false);
$agent->add('Bitrix\Landing\Agent::clearFiles();', 3600, false);
$agent->add('Bitrix\Landing\Agent::sendRestStatistic();', 86400, false);
$agent->add('Bitrix\Landing\Agent::clearTempFiles();', 86400, false);

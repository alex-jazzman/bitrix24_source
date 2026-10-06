<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('\Bitrix\DocumentGenerator\Driver::installDefaultRoles();', 150, false);
$agent->add('\Bitrix\DocumentGenerator\Service\ActualizeQueue::process(5);', 300, false);
$agent->add('\Bitrix\DocumentGenerator\Driver::installDefaultTemplatesForCurrentRegion();', 300, false);

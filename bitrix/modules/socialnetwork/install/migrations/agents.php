<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$agent = $migration->agent();

$agent->add('CSocNetMessages::SendEventAgent();', 600, false);
$agent->add('Bitrix\Socialnetwork\Internals\EventService\CleanAgent::execute();', 86400, false);
$agent->add('Bitrix\Socialnetwork\Internals\Space\LiveWatch\CleanAgent::execute();', 900, false);

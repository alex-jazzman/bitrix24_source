<?php

use Bitrix\Main\UpdateSystem\Migration;
use Bitrix\Note\Infrastructure\Agent\RecycleBin\RecycleBinCleanupAgent;

$agent = Migration::getInstance()->agent();

$agent->add([RecycleBinCleanupAgent::class, 'run'], 7200, false);

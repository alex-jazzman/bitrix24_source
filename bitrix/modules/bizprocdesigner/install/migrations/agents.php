<?php

use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Install\AgentTokenGardenerAgent;

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

// Periodic gardener: deactivates expired System tokens and physically removes long-revoked ones.
// Tuple form: the module autoloader is not registered yet when install migrations run.
$agent->add([AgentTokenGardenerAgent::class, 'execute'], 86400, false, 3600);

<?php

use Bitrix\Booking\Internals\Service\Agent\ClearOldCountersAgent;
use Bitrix\Booking\Internals\Service\Agent\ProcessDelayedTaskAgent;
use Bitrix\Booking\Internals\Service\Agent\UpYandexMapsCounter;
use Bitrix\Booking\Internals\Service\InstallAgent;
use Bitrix\Booking\Internals\Service\Notifications\Agent\NotificationAgentWatchdog;
use Bitrix\Main\UpdateSystem\Migration;

$agent = Migration::getInstance()->agent();

/** @see NotificationAgentWatchdog */
$agent->add('\Bitrix\Booking\Internals\Service\Notifications\Agent\NotificationAgentWatchdog::execute();', 3600);

/** @see ClearOldCountersAgent */
$agent->add('\Bitrix\Booking\Internals\Service\Agent\ClearOldCountersAgent::execute();', 60 * 60);

/** @see InstallAgent */
$agent->add('\Bitrix\Booking\Internals\Service\InstallAgent::execute();', 60);

/** @see ProcessDelayedTaskAgent */
$agent->add('\Bitrix\Booking\Internals\Service\Agent\ProcessDelayedTaskAgent::execute();', 60);

/** @see UpYandexMapsCounter */
$agent->add('\Bitrix\Booking\Internals\Service\Agent\UpYandexMapsCounter::execute();', 60);

<?php

declare(strict_types=1);

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Tasks\V2\FormV2Feature;
use Bitrix\Tasks\V2\Internal\Service\MigrateRecentTasks\MigrateRecentTaskBackgroundJob;

// Run background job to migrate recent tasks to chat.
// TODO: Remove this in the next release.
if (FormV2Feature::isOn() && !MigrateRecentTaskBackgroundJob::shouldSkipRegistration((int)CurrentUser::get()->getId()))
{
	MigrateRecentTaskBackgroundJob::register();
}

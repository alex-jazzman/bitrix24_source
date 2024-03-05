<?php

namespace Bitrix\Tasks\Internals\Task\WorkTime\Decorator;

use Bitrix\Tasks\Util\Type\DateTime;
use Bitrix\Tasks\Util\User;

class TimeZoneDecorator extends WorkTimeServiceDecorator
{
	private const SECONDS_IN_HOUR = 3600;

	public function getClosestWorkTime(int $offsetInDays = 7): DateTime
	{
		return $this->source->getClosestWorkTime($offsetInDays)
			->add(-User::getTimeZoneOffset($this->source->userId) / static::SECONDS_IN_HOUR . ' hours');
	}
}
<?php

namespace Bitrix\HumanResources\Internals\Event\HcmLink;

use Bitrix\HumanResources\Item\HcmLink\Job;
use Bitrix\Main\Event;

class JobDoneEvent extends Event
{
	public const MODULE_ID = 'humanresources';
	public const EVENT_NAME = 'OnHumanResourcesHcmLinkJobIsDone';

	public function __construct(public readonly Job $job)
	{
		parent::__construct(self::MODULE_ID, self::EVENT_NAME, ['job' => $job]);
	}
}
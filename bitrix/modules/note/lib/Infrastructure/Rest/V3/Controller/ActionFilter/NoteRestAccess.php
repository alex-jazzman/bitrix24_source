<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter;

use Bitrix\Main\Engine\ActionFilter\Base;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;
use Bitrix\Rest\V3\Exception\AccessDeniedException;

class NoteRestAccess extends Base
{
	public function onBeforeAction(Event $event): EventResult
	{
		if (!AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_ACCESS))
		{
			throw new AccessDeniedException();
		}

		return new EventResult(EventResult::SUCCESS, null, null, $this);
	}
}

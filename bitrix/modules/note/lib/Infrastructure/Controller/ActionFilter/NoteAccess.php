<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Controller\ActionFilter;

use Bitrix\Main\Engine\ActionFilter\Base;
use Bitrix\Main\Error;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\Localization\Loc;
use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;

class NoteAccess extends Base
{
	public function onBeforeAction(Event $event): ?EventResult
	{
		if (AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_ACCESS))
		{
			return null;
		}

		$this->addError(new Error(Loc::getMessage('NOTE_ACCESS_DENIED')));

		return new EventResult(EventResult::ERROR, null, null, $this);
	}
}

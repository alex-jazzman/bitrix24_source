<?php

declare(strict_types=1);

namespace Bitrix\Socialnetwork\Collab\Onboarding\Event\Type;

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\EventResult;
use Bitrix\Socialnetwork\Collab\Control\Event\CollabAddEvent;
use Bitrix\Socialnetwork\Collab\Onboarding\Entity\JobCollection;
use Bitrix\Socialnetwork\Collab\Onboarding\Entity\JobFactory;
use Bitrix\Socialnetwork\Collab\Onboarding\Internals\Type;

class CollabAddEventListener extends AbstractEventListener
{
	public function onCollabAdd(CollabAddEvent $event): EventResult
	{
		$collab = $event->getCollab();
		$collabId = $collab->getId();

		$members = $collab->getUserMemberIds();
		if (count($members) === 1)
		{
			$userId = $event->getCommand()->getInitiatorId();
			$this->createJobsAfterCollabAdded($collabId, $userId);
		}

		return new EventResult(EventResult::SUCCESS);
	}

	private function createJobsAfterCollabAdded(int $collabId, int $userId): void
	{
		$jobCollection = new JobCollection(
			JobFactory::create($collabId, $userId, Type::MembersNotInvitedOneDay->value),
			JobFactory::create($collabId, $userId, Type::MembersNotInvitedTwoDays->value),
			JobFactory::create($collabId, $userId, Type::MembersNotInvitedFourDays->value),
			JobFactory::create($collabId, $userId, Type::MembersNotInvitedFiveDays->value),
		);

		$this->queueService->add($jobCollection);
	}
}

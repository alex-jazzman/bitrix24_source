<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository\Mapper;

use Bitrix\Tasks\Internals\TaskObject;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Entity\Task\Priority;
use Bitrix\Tasks\V2\Entity\Task\Status;

class TaskMapper
{
	public function __construct(
		private readonly TaskStatusMapper $taskStatusMapper,
		private readonly TaskPriorityMapper $taskPriorityMapper,
	)
	{

	}

	public function mapToEntity(
		TaskObject $taskObject,
		?Entity\Group $group = null,
		?Entity\Flow $flow = null,
		?Entity\Stage $stage = null,
		?Entity\UserCollection $members = null,
		array $aggregates = [],
		?int $chatId = null,
	): Entity\Task
	{
		return new Entity\Task(
			id:                $taskObject->getId(),
			title:             $taskObject->getTitle(),
			description:       $taskObject->getDescription(),
			creator:           $members?->findOneById($taskObject->getCreatedBy()),
			createdTs:         $taskObject->getCreatedDate()?->getTimestamp(),
			responsible:       $members?->findOneById($taskObject->getResponsibleId()),
			deadlineTs:        $taskObject->getDeadline()?->getTimestamp(),
			needsControl:      $taskObject->getTaskControl(),
			fileIds:           $taskObject->getFileFields(),
			checklist: $aggregates['checklist'] ?? null,
			group:             $group,
			stage:             $stage,
			flow:              $flow,
			priority:         $this->taskPriorityMapper->mapToEnum((int)$taskObject->getPriority()),
			status:            $this->taskStatusMapper->mapToEnum((int)$taskObject->getStatus()),
			statusChangedTs:   $taskObject->getStatusChangedDate()?->getTimestamp(),
			accomplices:       $members?->findAllByIds($taskObject->getMemberList()->getAccompliceIds()),
			auditors:          $members?->findAllByIds($taskObject->getMemberList()->getAuditorIds()),
			containsChecklist: $aggregates['containsCheckList'] ?? null,
			chatId:            $chatId,
			crmFields: 		   $taskObject->getCrmFields(),
		);
	}
}

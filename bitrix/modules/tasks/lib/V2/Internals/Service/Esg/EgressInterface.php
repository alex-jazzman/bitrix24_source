<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Esg;

use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Command\Task\AddTaskCommand;
use Bitrix\Tasks\V2\Entity\Task;

interface EgressInterface
{
	public function process(AbstractCommand $command): void;
	public function processAddTaskCommand(AddTaskCommand $command): Task;
	public function createChatForExistingTask(Task $task): Task;
}

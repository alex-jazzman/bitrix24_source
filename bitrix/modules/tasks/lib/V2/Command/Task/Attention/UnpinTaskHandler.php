<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Attention;

use Bitrix\Tasks\Internals\UserOption\Option;
use Bitrix\Tasks\V2\Internals\Service\Task\UserOptionService;
use Bitrix\Tasks\V2\Entity;

class UnpinTaskHandler
{
	public function __construct(
		private readonly UserOptionService $userOptionService,
	)
	{

	}

	public function __invoke(UnpinTaskCommand $command): void
	{
		$entity = new Entity\Task\UserOption(
			userId: $command->userId,
			taskId: $command->taskId,
			code: Option::PINNED,
		);

		$this->userOptionService->delete($entity);
	}
}
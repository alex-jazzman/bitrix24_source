<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Tracking;

use Bitrix\Tasks\V2\Entity\Task\ElapsedTime;
use Bitrix\Tasks\V2\Internals\Control\Task\Trait\ApplicationErrorTrait;
use Bitrix\Tasks\V2\Internals\Exception\Task\ElapsedTimeException;
use Bitrix\Tasks\V2\Internals\Service\Task\ElapsedTimeService;

class AddElapsedTimeHandler
{
	use ApplicationErrorTrait;

	public function __construct(
		private readonly ElapsedTimeService $elapsedTimeService,
	)
	{

	}

	public function __invoke(AddElapsedTimeCommand $command): ElapsedTime
	{
		[$id, ] = $this->elapsedTimeService->add($command->elapsedTime);

		if ($id === null)
		{
			throw new ElapsedTimeException($this->getApplicationError());
		}

		return $command->elapsedTime->cloneWith(['id' => $id]);
	}
}
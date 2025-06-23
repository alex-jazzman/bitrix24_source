<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Result;

use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Consistency\ConsistencyResolverInterface;
use Bitrix\Tasks\V2\Internals\Service\Task\ResultService;

class UpdateResultHandler
{
	public function __construct(
		private readonly ResultService $resultService,
		private readonly ConsistencyResolverInterface $consistencyResolver,
	)
	{
	}

	public function __invoke(UpdateResultCommand $command): ?Entity\Result
	{
		return $this->consistencyResolver->resolve('task.result.update')->wrap(
			fn (): ?Entity\Result => $this->resultService->update($command->result, $command->userId)
		);
	}
}

<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Consistency\Strategy;

interface ConsistencyStrategyInterface
{
	public function execute(callable $callable, array $parameters = []): mixed;
}
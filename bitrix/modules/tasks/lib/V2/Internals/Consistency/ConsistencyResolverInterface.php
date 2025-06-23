<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Consistency;

interface ConsistencyResolverInterface
{
	public function resolve(string $context): ConsistencyWrapper;
}

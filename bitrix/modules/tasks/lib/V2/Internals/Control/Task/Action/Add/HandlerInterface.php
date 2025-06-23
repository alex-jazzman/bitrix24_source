<?php

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Config\AddConfig;

interface HandlerInterface
{
	public function __construct(AddConfig $config);

	public function __invoke();
}
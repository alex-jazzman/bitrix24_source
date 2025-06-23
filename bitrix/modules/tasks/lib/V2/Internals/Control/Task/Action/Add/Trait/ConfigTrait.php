<?php

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Trait;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Config\AddConfig;

trait ConfigTrait
{
	public function __construct(
		private readonly AddConfig $config,
	)
	{

	}
}
<?php

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Trait;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Config\DeleteConfig;

trait ConfigTrait
{
	public function __construct(
		private readonly DeleteConfig $config
	)
	{

	}
}
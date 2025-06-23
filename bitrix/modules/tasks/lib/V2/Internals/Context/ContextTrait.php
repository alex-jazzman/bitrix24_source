<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Context;

trait ContextTrait
{
	protected ?Context $context = null;

	public function getContext(): Context
	{
		return $this->context ?? new Context();
	}

	public function setContext(Context $context): static
	{
		$this->context = $context;

		return $this;
	}
}
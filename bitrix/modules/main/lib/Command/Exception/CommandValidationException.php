<?php

declare(strict_types=1);

namespace Bitrix\Main\Command\Exception;

use Bitrix\Main\Error;
use Bitrix\Main\SystemException;

class CommandValidationException extends SystemException
{
	/**
	 * @param Error[] $validationErrors
	 * @param $message
	 * @param \Throwable|null $previous
	 */
	public function __construct(
		private readonly array $validationErrors,
		$message = 'Command has validation errors',
		\Throwable $previous = null
	)
	{
		parent::__construct($message, previous: $previous);
	}

	/**
	 * @return Error[]
	 */
	public function getValidationErrors(): array
	{
		return $this->validationErrors;
	}
}

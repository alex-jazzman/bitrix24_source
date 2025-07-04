<?php

namespace Bitrix\Tasks\Rest\Controllers\Trait;

use Bitrix\Main\Error;
use Bitrix\Tasks\Internals\Log\Logger;
use Throwable;

trait ErrorResponseTrait
{
	protected function buildErrorResponse(string $message = '', int $code = 0): mixed
	{
		$message = empty($message) ? 'Unknown error' : $message;
		$this->errorCollection->setError(new Error($message, $code));

		return null;
	}

	protected function log(Throwable $t, string $marker = 'FLOW_AJAX_ERROR'): void
	{
		Logger::log($t, $marker);
	}
}
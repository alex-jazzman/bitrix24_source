<?php

namespace Bitrix\Intranet\Internals\Trait;

use Bitrix\Main\Error;

trait UserUpdateError
{
	/**
	 * creates array of \Bitrix\Main\Error from string \CUser::$LAST_ERROR
	 *
	 * @param string $lastError LAST_ERROR
	 * @return Error[]
	 */
	protected function getErrorsFromUpdateLastError(string $lastError): array
	{
		return array_map(fn($errorMassage) => new Error($errorMassage), explode('<br>', $lastError));
	}
}

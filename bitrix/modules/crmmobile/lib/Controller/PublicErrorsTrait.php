<?php

declare(strict_types = 1);

namespace Bitrix\CrmMobile\Controller;

use Bitrix\Main\Error;

trait PublicErrorsTrait
{
	/**
	 * @param Error[] $errors
	 * @return Error[]
	 */
	protected function markErrorsAsPublic(array $errors): array
	{
		$publicErrors = [];

		foreach ($errors as $error)
		{
			$message = str_replace(['<br>', '<br/>', '<br />'], "\n", $error->getMessage());
			$message = strip_tags($message);

			$publicErrors[] = new Error(
				$message,
				$error->getCode(),
				array_merge((array)($error->getCustomData() ?? []), ['public' => true])
			);
		}

		return $publicErrors;
	}
}

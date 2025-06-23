<?php

namespace Bitrix\Sign\Service;

use Bitrix\Main;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;

/**
 * Localize error service error messages by code
 */
final class LocalizedErrorService
{
	public function getLocalizedError(Error $error): Error
	{
		$localizedMessage = $error->getCode()
			? Loc::getMessage((string)$error->getCode(), $this->getReplacements($error))
			: null
		;

		return new Main\Error(
			$localizedMessage ?? $error->getMessage(),
			$error->getCode(),
			$error->getCustomData(),
		);
	}

	/**
	 * @param Main\Error[] $errors
	 * @return Main\Error[]
	 */
	public function localizeErrors(array $errors): array
	{
		$localizedErrors = [];
		foreach ($errors as $error)
		{
			$localizedErrors[] = $this->getLocalizedError($error);
		}
		return $localizedErrors;
	}

	private function getReplacements(Error $error): array
	{
		switch ($error->getCode())
		{
			case 'PERIOD_TOO_LONG':
				$customData = $error->getCustomData();
				$months = $customData['MAX_PERIOD_MONTHS'] ?? 0;
				return [
					'#MAX_PERIOD#' => Loc::getMessagePlural('PARAM_MAX_PERIOD_MONTHS', (int)$months, ['#NUM#' => $months]),
				];

			case 'PERIOD_TOO_SHORT':
				$customData = $error->getCustomData();
				$minutes = $customData['MIN_PERIOD_MINUTES'] ?? 0;
				return [
					'#MIN_PERIOD#' => Loc::getMessagePlural('PARAM_MIN_PERIOD_MINUTES', (int)$minutes, ['#NUM#' => $minutes]),
				];

			default:
				return [];
		}
	}
}
<?php

declare(strict_types=1);

namespace Bitrix\Main\Validation\Rule;

use Attribute;
use Bitrix\Main\Localization\LocalizableMessageInterface;
use Bitrix\Main\Validation\Validator\UrlValidator;

#[Attribute(Attribute::TARGET_PROPERTY | Attribute::TARGET_PARAMETER)]
class Url extends AbstractPropertyValidationAttribute
{
	public function __construct(
		protected string|LocalizableMessageInterface|null $errorMessage = null
	)
	{
	}

	protected function getValidators(): array
	{
		return [
			(new UrlValidator()),
		];
	}
}
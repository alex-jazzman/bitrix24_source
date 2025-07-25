<?php

namespace Bitrix\Crm\Activity\Entity\ConfigurableRestApp\Dto\ContentBlock;

use Bitrix\Crm\Activity\Entity\ConfigurableRestApp\Dto;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\Text;

final class TextDto extends BaseContentBlockDto
{
	public ?Dto\TextWithTranslationDto $value = null;
	public ?bool $multiline = null;
	public ?Dto\TextWithTranslationDto $title = null;
	public ?bool $bold = null;
	public ?string $size = null;
	public ?string $color = null;

	public const ALLOWED_SIZES = [
		Text::FONT_SIZE_XS,
		Text::FONT_SIZE_SM,
		Text::FONT_SIZE_MD,
	];

	public const ALLOWED_COLORS = [
		Text::COLOR_BASE_50,
		Text::COLOR_BASE_60,
		Text::COLOR_BASE_70,
		Text::COLOR_BASE_90,
	];

	protected function getValidators(array $fields): array
	{
		return [
			new \Bitrix\Crm\Dto\Validator\RequiredField($this, 'value'),
			new Dto\Validator\TextWithTranslationField($this, 'value'),
			new Dto\Validator\TextWithTranslationField($this, 'title'),
			new \Bitrix\Crm\Dto\Validator\EnumField($this, 'size', self::ALLOWED_SIZES),
			new \Bitrix\Crm\Dto\Validator\EnumField($this, 'color', self::ALLOWED_COLORS),
		];
	}
}

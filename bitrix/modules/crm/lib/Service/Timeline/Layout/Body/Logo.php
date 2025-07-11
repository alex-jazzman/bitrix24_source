<?php

namespace Bitrix\Crm\Service\Timeline\Layout\Body;

use Bitrix\Crm\Service\Timeline\Layout\Base;
use Bitrix\Crm\Service\Timeline\Layout\Mixin\Actionable;

class Logo extends Base
{
	use Actionable;

	public const ICON_TYPE_DEFAULT = 'default';
	public const ICON_TYPE_FAILURE = 'failure';
	public const ICON_TYPE_SUCCESS = 'success';
	public const ICON_TYPE_PURPLE = 'purple';
	public const ICON_TYPE_ORANGE = 'orange';
	public const ICON_TYPE_SECONDARY = 'secondary';
	public const ICON_TYPE_PALE_BLUE = 'pale-blue';
	public const ICON_TYPE_ORANGE_STRIPE = 'orange-stripe';
	public const ICON_TYPE_GREEN = 'green';
	public const ICON_TYPE_DARK_ORANGE = 'dark-orange';

	public const ADDITIONAL_ICON_CODE_PROGRESS = 'progress';
	public const ADDITIONAL_ICON_CODE_PENCIL = 'pencil';
	public const ADDITIONAL_ICON_CODE_SIGN = 'sign';
	public const ADDITIONAL_ICON_CODE_DONE = 'done';
	public const ADDITIONAL_ICON_CODE_UNAVAILABLE = 'unavailable';
	public const ADDITIONAL_ICON_CODE_CROSS = 'cross';

	protected const BODY_LOGO_BACKGROUND_SIZE = 60;

	protected string $iconCode;
	protected ?string $iconType = null;
	protected ?string $backgroundUrl = null;
	protected ?int $backgroundSize = null;

	protected ?string $additionalIconCode = null;
	protected ?string $additionalIconType = null;

	protected ?bool $isInCircle = null;

	public function __construct(string $iconCode)
	{
		$this->iconCode = $iconCode;
	}

	public function getIconCode(): string
	{
		return $this->iconCode;
	}

	public function getIconType(): ?string
	{
		return $this->iconType;
	}

	public function setIconType(?string $iconType): self
	{
		$this->iconType = $iconType;

		return $this;
	}

	/**
	 * @return string|null
	 */
	public function getBackgroundUrl(): ?string
	{
		return $this->backgroundUrl;
	}

	/**
	 * @param string|null $backgroundUrl
	 * @return Logo
	 */
	public function setBackgroundUrl(?string $backgroundUrl): Logo
	{
		$this->backgroundUrl = $backgroundUrl;

		return $this;
	}

	/**
	 * @return int|null
	 */
	public function getBackgroundSize(): ?int
	{
		return $this->backgroundSize;
	}

	/**
	 * @param int|null $backgroundSize
	 * @return Logo
	 */
	public function setBackgroundSize(?int $backgroundSize = null): Logo
	{
		$this->backgroundSize = ($backgroundSize ?? self::BODY_LOGO_BACKGROUND_SIZE);

		return $this;
	}

	public function toArray(): array
	{
		return [
			'type' => $this->getIconType(),
			'iconType' => $this->getIconType(),
			'icon' => $this->getIconCode(),
			'backgroundUrl' => $this->getBackgroundUrl(),
			'backgroundSize' => $this->getBackgroundSize(),
			'addIcon' => $this->getAdditionalIconCode(),
			'addIconType' => $this->getAdditionalIconType(),
			'inCircle' => $this->isInCircle(),
			'action' => $this->getAction(),
		];
	}

	public function getAdditionalIconCode(): ?string
	{
		return $this->additionalIconCode;
	}

	public function setAdditionalIconCode(string $additionalIconCode): self
	{
		$this->additionalIconCode = $additionalIconCode;

		return $this;
	}

	public function getAdditionalIconType(): ?string
	{
		return $this->additionalIconType;
	}

	public function setAdditionalIconType(?string $additionalIconType): self
	{
		$this->additionalIconType = $additionalIconType;

		return $this;
	}

	public function isInCircle(): ?bool
	{
		return $this->isInCircle;
	}

	public function setInCircle(?bool $isInCircle = true): self
	{
		$this->isInCircle = $isInCircle;

		return $this;
	}
}

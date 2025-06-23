<?php

namespace Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\Copilot;

use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock;
use Bitrix\Crm\Service\Timeline\Layout\Mixin\Actionable;

final class CopilotLaunchButton extends ContentBlock
{
	use Actionable;

	protected string $title;
	protected ?string $tooltip = null;
	
	public function getRendererName(): string
	{
		return 'CopilotLaunchButton';
	}

	public function getTitle(): string
	{
		return $this->title;
	}

	public function setTitle(string $title): self
	{
		$this->title = $title;
		
		return $this;
	}
	
	public function getTooltip(): ?string
	{
		return $this->tooltip;
	}
	
	public function setTooltip(?string $tooltip): self
	{
		$this->tooltip = $tooltip;
		
		return $this;
	}
	protected function getProperties(): array
	{
		return [
			'title' => $this->getTitle(),
			'tooltip' => $this->getTooltip(),
			'action' => $this->getAction(),
		];
	}
}

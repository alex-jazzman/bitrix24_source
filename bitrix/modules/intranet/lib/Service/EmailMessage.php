<?php

namespace Bitrix\Intranet\Service;

use Bitrix\Intranet\Contract\SendableContract;

class EmailMessage implements SendableContract
{
	public function __construct(
		private string $eventName,
		private string $siteId,
		private array $templateParams,
		private ?int $messageId,
		private ?bool $isDuplicate = null,
	)
	{

	}

	public function sendImmediately(): void
	{
		\CEvent::SendImmediate(
			$this->eventName,
			$this->siteId,
			$this->templateParams,
			$this->isDuplicate,
			$this->messageId,
		);
	}

	public function send(): void
	{
		\CEvent::Send(
			$this->eventName,
			$this->siteId,
			$this->templateParams,
			$this->isDuplicate,
			$this->messageId,
		);
	}
}
<?php

namespace Bitrix\Sign\Item\Integration\Im\Messages\Failure;

use Bitrix\Sign\Item\Document;
use Bitrix\Sign\Item\Integration\Im\Message;

class DocumentExpiredToCompany extends Message
{
	public function __construct(
		int $fromUser,
		int $toUser,
		Document $document,
		string $link,
	)
	{
		parent::__construct($fromUser, $toUser);
		$this->document = $document;
		$this->link = $link;
	}

	public function getStageId(): string
	{
		return 'documentExpiredToCompany';
	}

	public function getFallbackText(): string
	{
		return $this->getLocalizedFallbackMessage(
			'SIGN_CALLBACK_CHAT_DOCUMENT_EXPIRED_TO_COMPANY',
			[
				'#DOC_NAME#' => $this->getDocumentName($this->getDocument()),
				'#GRID_URL#' => $this->getLink(),
			]
		);
	}
}

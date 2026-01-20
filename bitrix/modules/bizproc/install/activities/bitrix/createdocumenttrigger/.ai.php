<?php

use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiCreateDocumentTrigger implements IBPActivityAiDescription
{
	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return new SettingCollection();
	}
}
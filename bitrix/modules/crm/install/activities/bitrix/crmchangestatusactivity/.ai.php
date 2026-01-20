<?php

use Bitrix\Bizproc\Integration\AiAssistant\ActivityAiPropertyConverter;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiCrmChangeStatusActivity extends CBPCrmChangeStatusActivity implements IBPActivityAiDescription
{
	public function __construct($name = 'crmchangestatusactivity')
	{
		parent::__construct($name);
	}

	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return (new ActivityAiPropertyConverter())
			->convertMap(static::getPropertiesMap($documentType), $documentType)
		;
	}
}

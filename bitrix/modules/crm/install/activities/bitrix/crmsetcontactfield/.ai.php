<?php

use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$runtime = CBPRuntime::GetRuntime();
$runtime->includeActivityAiDescriptionFile('setfieldactivity');

class CBPAiCrmSetContactField extends CBPAiSetFieldActivity
{
	public function __construct($name = 'crmsetcontactfield')
	{
		parent::__construct($name);
	}

	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		if (!\Bitrix\Main\Loader::includeModule('crm'))
		{
			return new SettingCollection();
		}

		$documentType = \CCrmBizProcHelper::ResolveDocumentType(\CCrmOwnerType::Contact);

		return parent::getAiDescribedSettings($documentType);
	}
}
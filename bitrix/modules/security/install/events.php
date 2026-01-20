<?php

$languages = [];
$langs = CLanguage::GetList();
while ($language = $langs->Fetch())
{
	$languages[] = $language;
}
$eventTypes = [];

foreach ($languages as $language)
{
	$lid = $language['LID'];
	IncludeModuleLangFile(__FILE__, $lid);

	$eventTypes[] = [
		'LID' => $lid,
		'EVENT_NAME' => 'VIRUS_DETECTED',
		'NAME' => GetMessage('VIRUS_DETECTED_NAME'),
		'DESCRIPTION' => GetMessage('VIRUS_DETECTED_DESC'),
	];

	//sms types
	$eventTypes[] = [
		'LID' => $lid,
		'EVENT_NAME' => 'SMS_USER_OTP_AUTH_CODE',
		'EVENT_TYPE' => \Bitrix\Main\Mail\Internal\EventTypeTable::TYPE_SMS,
		'NAME' => GetMessage('SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_NAME'),
		'DESCRIPTION' => GetMessage('SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_DESC'),
	];
}

$type = new CEventType();
foreach ($eventTypes as $eventType)
{
	$type->Add($eventType);
}

foreach ($languages as $language)
{
	$lid = $language['LID'];
	IncludeModuleLangFile(__FILE__, $lid);

	$arSites = [];
	$sites = CSite::GetList('', '', ['LANGUAGE_ID' => $lid]);
	while ($site = $sites->Fetch())
	{
		$arSites[] = $site['LID'];
	}

	if (count($arSites) > 0)
	{
		$emess = new CEventMessage();
		$emess->Add([
			'ACTIVE' => 'Y',
			'EVENT_NAME' => 'VIRUS_DETECTED',
			'LID' => $arSites,
			'EMAIL_FROM' => '#DEFAULT_EMAIL_FROM#',
			'EMAIL_TO' => '#EMAIL#',
			'BCC' => '',
			'SUBJECT' => GetMessage('VIRUS_DETECTED_SUBJECT'),
			'MESSAGE' => GetMessage('VIRUS_DETECTED_MESSAGE'),
			'BODY_TYPE' => 'text',
		]);
	}

	//sms templates
	$smsTemplates = [
		[
			'EVENT_NAME' => 'SMS_USER_OTP_AUTH_CODE',
			'ACTIVE' => true,
			'SENDER' => '#DEFAULT_SENDER#',
			'RECEIVER' => '#USER_PHONE#',
			'MESSAGE' => GetMessage('SECURITY_INSTALL_SMS_TEMPLATE_OTP_CONFIRM_MESS'),
			'LANGUAGE_ID' => $lid,
		],
	];

	$entity = \Bitrix\Main\Sms\TemplateTable::getEntity();
	$site = \Bitrix\Main\SiteTable::getEntity()->wakeUpObject(CSite::GetDefSite());

	foreach ($smsTemplates as $smsTemplate)
	{
		$template = $entity->createObject();
		foreach ($smsTemplate as $field => $value)
		{
			$template->set($field, $value);
		}
		$template->addToSites($site);
		$template->save();
	}
}

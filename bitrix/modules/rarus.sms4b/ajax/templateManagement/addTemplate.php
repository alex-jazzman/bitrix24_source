<?php
include ($_SERVER['DOCUMENT_ROOT']. '/bitrix/modules/main/include/prolog_before.php');
use Bitrix\Main\Application;
IncludeModuleLangFile(__FILE__);
CModule::IncludeModule('rarus.sms4b');

$request = Application::getInstance()->getContext()->getRequest();
if($request->getRequestMethod() === 'POST' && $USER->IsAdmin())
{
	$text = trim($request->getPost('text'));
	$subject = trim($request->getPost('subject'));
	$emailFrom = trim($request->getPost('emailFrom'));
	$emailTo = trim($request->getPost('emailTo'));
	$eventType = trim($request->getPost('eventType'));
	$site = trim($request->getPost('site'));

	$arr = [
		'ACTIVE' => 'Y',
		'EVENT_NAME' => 'SMS4B_' . $eventType,
		'LID' => $site,
		'EMAIL_FROM' => $emailFrom,
		'EMAIL_TO' => $emailTo,
		'BODY_TYPE' => 'text',
		'SUBJECT' => iconv(mb_detect_encoding($subject), LANG_CHARSET, $subject),
		'MESSAGE' => iconv(mb_detect_encoding($text), LANG_CHARSET, $text)
    ];
	$obSMSTemplate = new CEventMessage;
	$res = $obSMSTemplate->Add($arr);
	echo $res;
}

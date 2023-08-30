<?php
include ($_SERVER['DOCUMENT_ROOT']. '/bitrix/modules/main/include/prolog_before.php');
use Bitrix\Main\Application;
IncludeModuleLangFile(__FILE__);
CModule::IncludeModule('rarus.sms4b');

$request = Application::getInstance()->getContext()->getRequest();
if($request->getRequestMethod() === 'POST' && $USER->IsAdmin())
{
    $templateId = trim($request->getPost('templateId'));
    CEventMessage::Delete($templateId);
}

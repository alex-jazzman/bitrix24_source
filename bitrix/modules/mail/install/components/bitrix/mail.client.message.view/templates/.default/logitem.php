<?php

use Bitrix\Mail\Helper;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

$message = $arResult['MESSAGE'];
// The expanded thread item is rendered by a request of its own, so the body it includes asks for the right here.
$hasAccessToMessageDelete = Helper\MailAccess::hasUserAccessToMessageDeletion();

include __DIR__ . '/__body.php';

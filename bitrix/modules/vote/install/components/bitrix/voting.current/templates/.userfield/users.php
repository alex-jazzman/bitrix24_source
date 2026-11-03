<?php

use Bitrix\Main\Loader;
use Bitrix\Main\Web\Json;
use Bitrix\Vote\Service\VotedListService;

define("PUBLIC_AJAX_MODE", true);
define("NO_KEEP_STATISTIC", "Y");
define("NO_AGENT_STATISTIC", "Y");
define("NO_AGENT_CHECK", true);
define("DisableEventsCheck", true);

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_before.php");

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
$requestId = (string)$request->getPost("request_id");

$arVoteList = [
	"ID" => [],
	"answer_id" => 0,
	"request_id" => $requestId,
	"items" => [],
	"StatusPage" => "done",
];

if (check_bitrix_sessid() && Loader::includeModule("vote"))
{
	$sign = $request->getPost("sign");
	$sign = is_string($sign) ? $sign : "";

	$arVoteList = (new VotedListService())->getListBySign($sign, [
		"nPageSize" => VotedListService::DEFAULT_PAGE_SIZE,
		"iNumPage" => (int)$request->getPost("iNumPage"),
		"requestId" => $requestId,
	]);
}

$APPLICATION->RestartBuffer();
Header('Content-Type: application/json; charset=' . LANG_CHARSET);
echo Json::encode($arVoteList);
die();

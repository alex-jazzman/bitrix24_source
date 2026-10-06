<?php
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/header.php');

$APPLICATION->IncludeComponent('bitrix:call.sync', '.default', []);

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/footer.php');

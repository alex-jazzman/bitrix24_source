<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('\Bitrix\Catalog\Product\SystemField::execAgent();', 1, true);

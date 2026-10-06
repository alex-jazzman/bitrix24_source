<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'intranet\');', 86400, false, 900)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'landing\');', 86400, false, 1000)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'voximplant\');', 86400, false, 1100)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'rest\');', 86400, false, 1200)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'imopenlines\');', 86400, false, 1300)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'main\');', 86400, false, 1400)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'bizproc\');', 86400, false, 1500)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'sale\');', 86400, false, 1600)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'messageservice\');', 86400, false, 1700)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'crm\');', 86400, true, 1800)
	->add('Bitrix\Market\Tag\Manager::doAgentOnceLoad(\'tasks\');', 86400, true, 1900)
;

<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent
	/** @see \Bitrix\MessageService\Queue::cleanUpAgent */
	->add('Bitrix\MessageService\Queue::cleanUpAgent();', 86400, true)
	/** @see \Bitrix\MessageService\IncomingMessage::cleanUpAgent */
	->add('Bitrix\MessageService\IncomingMessage::cleanUpAgent();', 86400, true)
;

<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	// read and click notifications
	->registerCompatible("main", "OnMailEventMailRead", "bitrix\\sender\\postingmanager", "onMailEventMailRead")
	->registerCompatible("main", "OnMailEventMailClick", "bitrix\\sender\\postingmanager", "onMailEventMailClick")

	// unsubscription notifications
	->registerCompatible("main", "OnMailEventSubscriptionDisable", "Bitrix\\Sender\\Subscription", "onMailEventSubscriptionDisable")
	->registerCompatible("main", "OnMailEventSubscriptionEnable", "Bitrix\\Sender\\Subscription", "onMailEventSubscriptionEnable")
	->registerCompatible("main", "OnMailEventSubscriptionList", "Bitrix\\Sender\\Subscription", "onMailEventSubscriptionList")
	->registerCompatible("main", \Bitrix\Main\Mail\Tracking::onChangeStatus, \Bitrix\Sender\Integration\EventHandler::class, "onMailEventMailChangeStatus")

	// connectors of module sender
	->registerCompatible("sender", "OnConnectorList", "bitrix\\sender\\connectormanager", "onConnectorListContact")
	->registerCompatible("sender", "OnConnectorList", "bitrix\\sender\\connectormanager", "onConnectorListRecipient")
	->registerCompatible("sender", "OnConnectorList", "bitrix\\sender\\connectormanager", "onConnectorList")

	// mail templates and blocks
	->registerCompatible("sender", "OnPresetTemplateList", "Bitrix\\Sender\\Preset\\TemplateBase", "onPresetTemplateList")
	->registerCompatible("sender", "OnPresetTemplateList", "Bitrix\\Sender\\TemplateTable", "onPresetTemplateList")
	->registerCompatible("sender", "OnPresetMailBlockList", "Bitrix\\Sender\\Preset\\MailBlockBase", "OnPresetMailBlockList")
	->registerCompatible("sender", "OnPresetTemplateList", "Bitrix\\Sender\\Preset\\TemplateBase", "onPresetTemplateListSite")

	// triggers
	->registerCompatible("sender", "OnTriggerList", "bitrix\\sender\\triggermanager", "onTriggerList")
	->registerCompatible("sender", "OnAfterRecipientUnsub", "Bitrix\\Sender\\TriggerManager", "onAfterRecipientUnsub")

	// conversion
	->registerCompatible("sender", "OnAfterRecipientClick", "Bitrix\\Sender\\Internals\\ConversionHandler", "onAfterRecipientClick")
	->registerCompatible("conversion", "OnSetDayContextAttributes", "Bitrix\\Sender\\Internals\\ConversionHandler", "onSetDayContextAttributes")
	->registerCompatible("main", "OnBeforeProlog", "Bitrix\\Sender\\Internals\\ConversionHandler", "onBeforeProlog")
	->registerCompatible("conversion", "OnGetAttributeTypes", "Bitrix\\Sender\\Internals\\ConversionHandler", "onGetAttributeTypes")
	->registerCompatible("main", "OnMailEventMailClickRedirect", "Bitrix\\Sender\\Internals\\ExternalUrlSanitizer", "onMailClickRedirect")

	// voximplant
	->registerCompatible("voximplant", "OnInfoCallResult", "Bitrix\\Sender\\Integration\\VoxImplant\\Service", "onInfoCallResult")

	->registerCompatible("pull", "OnGetDependentModule", "Bitrix\\Sender\\SenderPullSchema", "OnGetDependentModule")
	->registerCompatible("im", "OnGetNotifySchema", "Bitrix\\Sender\\SenderNotifySchema", "OnGetNotifySchema")

	->registerCompatible("main", "OnAfterFileSave", "Bitrix\\Sender\\Integration\\Main\\FileManager", "OnAfterFileSave")
;

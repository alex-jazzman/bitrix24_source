<?php
define("BX_XMPP_SERVER_DOMAIN", "192.168.0.8");

\Bitrix\Main\Loader::registerAutoLoadClasses("xmpp", array(
	"xmpp" => "install/index.php",
	"CXMPPClient" => "classes/client.php",
	"CXMPPFactory" => "classes/factory.php",
	"CXMPPServer" => "classes/server.php",
	"CXMPPParser" => "classes/parser.php",
	"CXMPPUtility" => "classes/util.php",
	"IXMPPFactoryHandler" => "classes/interface.php",
	"IXMPPFactoryServerHandler" => "classes/interface.php",
	"IXMPPFactoryCleanableHandler" => "classes/interface.php",
	"CXMPPFactoryHandler" => "classes/interface.php",
	"CXMPPReceiveMessage" => "classes/factory_classes/message.php",
	"CXMPPReceiveIQBind" => "classes/factory_classes/bind.php",
	"CXMPPReceiveError" => "classes/factory_classes/error.php",
	"CXMPPReceiveIQ" => "classes/factory_classes/iq.php",
	"CXMPPReceiveIQPing" => "classes/factory_classes/ping.php",
	"CXMPPReceivePresence" => "classes/factory_classes/presence.php",
	"CXMPPReceiveIQRoster" => "classes/factory_classes/roster.php",
	"CXMPPServerQuery" => "classes/factory_classes/server_query.php",
	"CXMPPSharedGroupIQ" => "classes/factory_classes/sharedgroup.php",
	"CXMPPStream" => "classes/factory_classes/stream.php",
	"CXMPPReceiveIQVCard" => "classes/factory_classes/vcard.php",
));




<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
	die();

if(file_exists(WIZARD_ABSOLUTE_PATH."/site/public/".LANGUAGE_ID."/saas_tmp"))
{
	CopyDirFiles(
		WIZARD_ABSOLUTE_PATH."/site/public/".LANGUAGE_ID."/saas_tmp",
		WIZARD_SITE_PATH,
		$rewrite = false,
		$recursive = true,
		$delete_after_copy = true,
		$exclude = "bitrix"
	);

	unlink(WIZARD_ABSOLUTE_PATH."/site/public/".LANGUAGE_ID."/saas_tmp");
}
if(!(WIZARD_SITE_ID == 's1' && !WIZARD_NEW_2011 && WIZARD_FIRST_INSTAL !== "Y") || WIZARD_B24_TO_CP)
{
	if (WIZARD_INSTALL_DEMO_DATA || WIZARD_FIRST_INSTAL !== "Y" || WIZARD_B24_TO_CP)
	{
		CopyDirFiles(
			WIZARD_ABSOLUTE_PATH."/site/public/",
			WIZARD_SITE_PATH,
			$rewrite = true,
			$recursive = true,
			$delete_after_copy = false,
			$exclude = "bitrix"
		);

		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/intranet/install/public/',
			WIZARD_SITE_PATH,
			$rewrite = true,
			$recursive = true,
			$delete_after_copy = false,
			$exclude = "bitrix24"
		);

		WizardServices::SetFilePermission(Array(WIZARD_SITE_ID, WIZARD_SITE_DIR."pub/"), Array("*" => "R"));

		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/rest/install/public/marketplace/',
			WIZARD_SITE_PATH."/marketplace/",
			$rewrite = true,
			$recursive = true,
			$delete_after_copy = false
		);

		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/rest/install/public/devops/',
			WIZARD_SITE_PATH."/devops/",
			$rewrite = true,
			$recursive = true,
			$delete_after_copy = false
		);

		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/rest/install/public/apconnect/',
			WIZARD_SITE_PATH."/apconnect/",
			$rewrite = true,
			$recursive = true,
			$delete_after_copy = false
		);

		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/rest/install/public/oauth/',
			WIZARD_SITE_PATH."/oauth/",
			$rewrite = true,
			$recursive = true,
			$delete_after_copy = false
		);

		if (WIZARD_B24_TO_CP)
		{
			if (file_exists(WIZARD_SITE_PATH."settings/"))
				DeleteDirFilesEx(WIZARD_SITE_DIR."settings/");
			if (file_exists(WIZARD_SITE_PATH."marketplace/"))
				DeleteDirFilesEx(WIZARD_SITE_DIR."marketplace/");
			if (file_exists(WIZARD_SITE_PATH."bitrix/templates/login"))
				DeleteDirFilesEx(WIZARD_SITE_DIR."bitrix/templates/login");
			if (file_exists(WIZARD_SITE_PATH."company/meeting"))
				DeleteDirFilesEx(WIZARD_SITE_DIR."company/meeting");
		}
	}
}

if (WIZARD_SITE_ID == 's1' && !WIZARD_NEW_2011)
	CopyDirFiles(WIZARD_ABSOLUTE_PATH."/site/public/.department.menu_ext.php", WIZARD_SITE_PATH."/.department.menu_ext.php", false);

$dateTimeFormat = (LANGUAGE_ID == "en") ? "F j, Y h:i a" : ((LANGUAGE_ID == "de") ? "j. F Y H:i:s" : "d.m.Y H:i:s");
$dateFormat = (LANGUAGE_ID == "en") ? "F j, Y" : ((LANGUAGE_ID == "de") ? "j. F Y" : "d.m.Y");
$dateFormatNoYear = (LANGUAGE_ID == "en") ? "F j" : ((LANGUAGE_ID == "de") ? "j. F" : "d.m");
CWizardUtil::ReplaceMacrosRecursive(WIZARD_SITE_PATH, Array("SITE_DIR" => WIZARD_SITE_DIR, "DATE_TIME_FORMAT" => $dateTimeFormat, "DATE_FORMAT" => $dateFormat, "DATE_FORMAT_NO_YEAR" => $dateFormatNoYear));
CWizardUtil::ReplaceMacros(WIZARD_SITE_PATH."/desktop.php", Array("SITE_ID" => WIZARD_SITE_ID));
CWizardUtil::ReplaceMacros(WIZARD_SITE_PATH."/_index.php", Array("SITE_ID" => WIZARD_SITE_ID));

if (WIZARD_INSTALL_DEMO_DATA || WIZARD_B24_TO_CP)
{
	$arUrlRewrite = array();
	if (file_exists(WIZARD_SITE_ROOT_PATH."/urlrewrite.php"))
	{
		include(WIZARD_SITE_ROOT_PATH."/urlrewrite.php");
	}

	$arNewUrlRewrite = array(
		array(
			"CONDITION"	=>	"#^".WIZARD_SITE_DIR."company/gallery/#",
			"RULE"	=>	"",
			"ID"	=>	"bitrix:photogallery_user",
			"PATH"	=>	WIZARD_SITE_DIR."company/gallery/index.php",
		),
		array(
			"CONDITION"	=>	"#^".WIZARD_SITE_DIR."company/personal/#",
			"RULE"	=>	"",
			"ID"	=>	"bitrix:socialnetwork_user",
			"PATH"	=>	WIZARD_SITE_DIR."company/personal.php",
		),
		/*array(
			"CONDITION"	=>	"#^".WIZARD_SITE_DIR."community/forum/#",
			"RULE"	=>	"",
			"ID"	=>	"bitrix:forum",
			"PATH"	=>	WIZARD_SITE_DIR."community/forum.php",
		),*/
		array(
			"CONDITION"	=>	"#^".WIZARD_SITE_DIR."about/gallery/#",
			"RULE"	=>	"",
			"ID"	=>	"bitrix:photogallery",
			"PATH"	=>	WIZARD_SITE_DIR."about/gallery/index.php",
		),
		array(
			"CONDITION"	=>	"#^".WIZARD_SITE_DIR."workgroups/#",
			"RULE"	=>	"",
			"ID"	=>	"bitrix:socialnetwork_group",
			"PATH"	=>	WIZARD_SITE_DIR."workgroups/index.php",
		),
		array(
			"CONDITION"	=>	"#^".WIZARD_SITE_DIR."services/lists/#",
			"RULE"	=>	"",
			"ID"	=>	"bitrix:lists",
			"PATH"	=>	WIZARD_SITE_DIR."services/lists/index.php",
		),
		array(
			"CONDITION"	=>	"#^".WIZARD_SITE_DIR."services/faq/#",
			"RULE"	=>	"",
			"ID"	=>	"bitrix:support.faq",
			"PATH"	=>	WIZARD_SITE_DIR."services/faq/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."services/idea/#",
			"RULE" => "",
			"ID" => "bitrix:idea",
			"PATH" => WIZARD_SITE_DIR."services/idea/index.php"
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."tasks/getfile/(\\d+)/(\\d+)/([^/]+)#",
			"RULE" => "taskid=$1&fileid=$2&filename=$3",
			"PATH" => WIZARD_SITE_DIR."tasks/getfile.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."docs/pub/#",
			"RULE" => "",
			"ID" => "bitrix:disk.external.link",
			"PATH" => WIZARD_SITE_DIR."docs/pub/extlinks.php"
		),

		array(
			"CONDITION"	=>	"#^".WIZARD_SITE_DIR."/docs/all#",
			"RULE"	=>	"",
			"ID"	=>	"bitrix:disk.aggregator",
			"PATH"	=>	WIZARD_SITE_DIR."docs/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."docs/sale/#",
			"RULE" => "",
			"ID" => "bitrix:disk.common",
			"PATH" => WIZARD_SITE_DIR."docs/sale/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."docs/shared#",
			"RULE" => "",
			"ID" => "bitrix:disk.common",
			"PATH" => WIZARD_SITE_DIR."docs/shared/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."docs/manage/#",
			"RULE" => "",
			"ID" => "bitrix:disk.common",
			"PATH" => WIZARD_SITE_DIR."docs/manage/index.php",
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'bizproc/processes/#',
			'RULE' => '',
			'ID' => 'bitrix:lists',
			'PATH' => WIZARD_SITE_DIR.'bizproc/processes/index.php'
		),
		array (
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'shop/settings/permissions/#',
			'RULE' => '',
			'ID' => 'bitrix:catalog.config.permissions',
			'PATH' => WIZARD_SITE_DIR.'shop/settings/permissions/index.php',
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'shop/settings/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.admin.page.controller',
			'PATH' => WIZARD_SITE_DIR.'shop/settings/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'sites/#',
			'RULE' => '',
			'ID' => 'bitrix:landing.start',
			'PATH' => WIZARD_SITE_DIR.'sites/index.php',
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'shop/stores/#',
			'RULE' => '',
			'ID' => 'bitrix:landing.start',
			'PATH' => WIZARD_SITE_DIR.'shop/stores/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'shop/orders/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.order',
			'PATH' => WIZARD_SITE_DIR.'shop/orders/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'pub/form/([0-9a-z_]+?)/([0-9a-z]+?)/.*#',
			'RULE' => 'form_code=$1&sec=$2',
			'ID' => '',
			'PATH' => WIZARD_SITE_DIR.'pub/form.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'pub/document/([0-9a-zA-Z_-]+)/([0-9a-zA-Z]+)/([^/]*)#',
			'RULE' => 'id=$1&hash=$2',
			'ID' => 'bitrix:documentgenerator.view',
			'PATH' => WIZARD_SITE_DIR.'pub/document.php'
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."onec/#",
			"RULE" => "",
			"ID" => "bitrix:crm.1c.start",
			"PATH" => WIZARD_SITE_DIR."onec/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."settings/configs/userconsent/#",
			"RULE" => "",
			"ID" => "",
			"PATH" => WIZARD_SITE_DIR."configs/userconsent.php",
		),

		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."marketplace/#",
			"RULE" => "",
			"ID" => "bitrix:rest.marketplace",
			"PATH" =>  WIZARD_SITE_DIR."marketplace/index.php",
		),

		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."market/#",
			"RULE" => "",
			"ID" => "bitrix:market",
			"PATH" => WIZARD_SITE_DIR."market/index.php",
		),

		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."marketplace/app/#",
			"RULE" => "",
			"ID" => "bitrix:app.layout",
			"PATH" =>  WIZARD_SITE_DIR."marketplace/app/index.php",
		),

		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."marketplace/hook/#",
			"RULE" => "",
			"ID" => "bitrix:rest.hook",
			"PATH" =>  WIZARD_SITE_DIR."marketplace/hook/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."marketplace/configuration/#",
			"RULE" => "",
			"ID" => "bitrix:rest.configuration",
			"PATH" =>  WIZARD_SITE_DIR."marketplace/configuration/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."devops/#",
			"RULE" => "",
			"ID" => "bitrix:rest.devops",
			"PATH" =>  WIZARD_SITE_DIR."devops/index.php",
		),

		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."mail/#",
			"RULE" => "",
			"ID" => "bitrix:mail.client",
			"PATH" =>  WIZARD_SITE_DIR."mail/index.php",
		),

		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."timeman/worktime/#",
			"RULE" => "",
			"ID" => "bitrix:timeman.worktime",
			"PATH" =>  WIZARD_SITE_DIR."timeman/worktime.php",
		),

		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."timeman/settings/#",
			"RULE" => "",
			"ID" => "bitrix:timeman.settings",
			"PATH" =>  WIZARD_SITE_DIR."timeman/settings.php",
		),

		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."timeman/schedules/#",
			"RULE" => "",
			"ID" => "bitrix:timeman.schedules",
			"PATH" =>  WIZARD_SITE_DIR."timeman/schedules.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."shop/orderform/#",
			"RULE" => "",
			"ID" => "bitrix:crm.order.matcher",
			"PATH" => WIZARD_SITE_DIR."shop/orderform/index.php"
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'shop/buyer_group/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.order.buyer_group',
			'PATH' => WIZARD_SITE_DIR.'shop/buyer_group/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'shop/buyer/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.order.buyer',
			'PATH' => WIZARD_SITE_DIR.'shop/buyer/index.php'
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'shop/import/instagram/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.order.import.instagram',
			'PATH' => WIZARD_SITE_DIR . 'shop/import/instagram/index.php'
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."knowledge/group/#",
			"RULE" => "",
			"ID" => "bitrix:landing.pub",
			"PATH" => WIZARD_SITE_DIR."knowledge/group/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."knowledge/#",
			"RULE" => "",
			"ID" => "bitrix:landing.pub",
			"PATH" => WIZARD_SITE_DIR."knowledge/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."mobile/knowledge/group/#",
			"RULE" => "",
			"ID" => "bitrix:landing.pub",
			"PATH" => WIZARD_SITE_DIR."mobile/knowledge/group/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."mobile/knowledge/#",
			"RULE" => "",
			"ID" => "bitrix:landing.pub",
			"PATH" => WIZARD_SITE_DIR."mobile/knowledge/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."kb/group/#",
			"RULE" => "",
			"ID" => "bitrix:landing.start",
			"PATH" => WIZARD_SITE_DIR."kb/group/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."kb/#",
			"RULE" => "",
			"ID" => "bitrix:landing.start",
			"PATH" => WIZARD_SITE_DIR."kb/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."rpa/#",
			"RULE" => "",
			"ID" => "bitrix:rpa.router",
			"PATH" => WIZARD_SITE_DIR."rpa/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."video/([\\.\\-0-9a-zA-Z]+)(/?)([^/]*)#",
			"RULE" => "alias=\$1&videoconf",
			"PATH" => WIZARD_SITE_DIR."desktop_app/router.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."crm/type/#",
			"RULE" => "",
			"ID" => "bitrix:crm.router",
			"PATH" => WIZARD_SITE_DIR."crm/type/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."automation/type/#",
			"RULE" => "",
			"ID" => "bitrix:crm.router",
			"PATH" => WIZARD_SITE_DIR."automation/type/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."conference/#",
			"RULE" => "",
			"ID" => "bitrix:im.conference.center",
			"PATH" => WIZARD_SITE_DIR."conference/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."page/#",
			"RULE" => "",
			"ID" => "bitrix:intranet.customsection",
			"PATH" => WIZARD_SITE_DIR."page/index.php",
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'pub/calendar-event/([0-9]+)/([0-9a-zA-Z]+)/?([^/]*)#',
			'RULE' => "event_id=\$1&hash=\$2",
			'ID' => "bitrix:calendar.pub.event",
			'PATH' => WIZARD_SITE_DIR."pub/calendar_event.php"
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'pub/calendar-sharing/([0-9a-zA-Z]+)/?([^/]*)#',
			'RULE' => "hash=\$1",
			'ID' => "bitrix:calendar.pub.sharing",
			'PATH' => WIZARD_SITE_DIR."pub/calendar_sharing.php"
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'calendar/rooms/#',
			'RULE' => "",
			'ID' => "bitrix:calender",
			'PATH' => WIZARD_SITE_DIR."calendar/rooms.php"
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'pub/payment-slip/([\\w\\W]+)/#',
			'RULE' => "signed_payment_id=\$1",
			'ID' => "bitrix:salescenter.pub.payment.slip",
			'PATH' => WIZARD_SITE_DIR . "pub/payment_slip.php"
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'booking/detail/([0-9]+)#',
			'RULE' => "id=\$1",
			'ID' => 'bitrix:booking.booking.detail',
			'PATH' => WIZARD_SITE_DIR . '/booking/detail.php',
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'booking/#',
			'RULE' => '',
			'ID' => 'bitrix:booking',
			'PATH' => WIZARD_SITE_DIR . '/booking/index.php',
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'pub/booking/confirmation/([0-9a-z\.]+)/#',
			'RULE' => "hash=\$1",
			'ID' => "bitrix:booking.pub.confirm",
			'PATH' => WIZARD_SITE_DIR . "pub/booking/confirmation.php"
		),
		array(
			"CONDITION" => '#^'.WIZARD_SITE_DIR.'shop/documents/#',
			"RULE" => "",
			"ID" => "bitrix:catalog.store.document",
			"PATH" => WIZARD_SITE_DIR.'shop/documents/index.php',
		),
		array(
			"CONDITION" => '#^'.WIZARD_SITE_DIR.'shop/documents-catalog/#',
			"RULE" => "",
			"ID" => "bitrix:catalog.catalog.controller",
			"PATH" =>  WIZARD_SITE_DIR."shop/documents-catalog/index.php",
		),
		array(
			"CONDITION" => '#^'.WIZARD_SITE_DIR.'shop/documents-stores/#',
			"RULE" => "",
			"ID" => "bitrix:catalog.store.entity.controller",
			"PATH" =>  WIZARD_SITE_DIR."shop/documents-stores/index.php",
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'shop/catalog/#',
			"RULE" => "",
			"ID" => "bitrix:catalog.productcard.controller",
			"PATH" => WIZARD_SITE_DIR . "/shop/catalog/index.php",
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR.'terminal/#',
			"RULE" => "",
			"ID" => "bitrix:crm.terminal.payment.controller",
			"PATH" => WIZARD_SITE_DIR . "terminal/index.php",
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'crm/terminal/#',
			"RULE" => "",
			"ID" => "bitrix:crm.terminal.payment.controller",
			"PATH" => WIZARD_SITE_DIR . "terminal/index.php",
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'shop/terminal/#',
			"RULE" => "",
			"ID" => "bitrix:crm.terminal.payment.controller",
			"PATH" => WIZARD_SITE_DIR . "terminal/index.php",
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'timeman/login-history/([0-9]+)/.*#',
			"RULE" => "user=\$1",
			"ID" => "bitrix:intranet.user.login.history",
			"PATH" => WIZARD_SITE_DIR . 'timeman/login-history/index.php',
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'agent_contract/#',
			"RULE" => "",
			"ID" => "bitrix:catalog.agent.contract.controller",
			"PATH" => WIZARD_SITE_DIR . "agent_contract/index.php",
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'sign/link/member/([0-9]+)/#',
			"RULE" => "memberId=\$1",
			"ID" => "",
			"PATH" => WIZARD_SITE_DIR . "sign/link.php",
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'sign/#',
			"RULE" => "",
			"ID" => "bitrix:sign.start",
			"PATH" => WIZARD_SITE_DIR . "sign/index.php",
		),
		array(
			"CONDITION" => "#^" . WIZARD_SITE_DIR . "spaces/#",
			"RULE" => "",
			"ID" => "bitrix:socialnetwork.spaces",
			"PATH" => WIZARD_SITE_DIR . "spaces/index.php",
		),
		array (
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'bi/settings/permissions/#',
			'RULE' => '',
			'ID' => 'bitrix:biconnector.apachesuperset.config.permissions',
			'PATH' => WIZARD_SITE_DIR . 'bi/settings/permissions/index.php',
		),
		[
			"CONDITION" => "#^" . WIZARD_SITE_DIR . "hr/#",
			"RULE" => "",
			"ID" => "bitrix:humanresources.start",
			"PATH" => WIZARD_SITE_DIR . "hr/index.php",
		],
		[
			'CONDITION' => "#^" . WIZARD_SITE_DIR . "bi/dashboard/detail/([0-9]+)/#",
			'RULE' => "dashboardId=\$1",
			'ID' => 'bitrix:biconnector.apachesuperset.dashboard.detail',
			'PATH' => WIZARD_SITE_DIR . 'bi/dashboard/detail/index.php',
		],
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'bi/dashboard/#',
			"RULE" => "",
			"ID" => "bitrix:biconnector.apachesuperset.dashboard.controller",
			"PATH" => WIZARD_SITE_DIR . "bi/dashboard/index.php",
		),
		[
			'CONDITION' => "#^" . WIZARD_SITE_DIR . "bi/dataset/#",
			'RULE' => "",
			'ID' => 'bitrix:biconnector.apachesuperset.workspace_analytic.controller',
			'PATH' => WIZARD_SITE_DIR . 'bi/dataset/index.php',
		],
		[
			'CONDITION' => "#^" . WIZARD_SITE_DIR . "bi/source/#",
			'RULE' => "",
			'ID' => 'bitrix:biconnector.apachesuperset.workspace_analytic.controller',
			'PATH' => WIZARD_SITE_DIR . 'bi/source/index.php',
		],
		[
			'CONDITION' => "#^" . WIZARD_SITE_DIR . "bi/statistics/#",
			'RULE' => "",
			'ID' => 'bitrix:biconnector.apachesuperset.workspace_analytic.controller',
			'PATH' => WIZARD_SITE_DIR . 'bi/statistics/index.php',
		],
		[
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'disk/boards/([0-9]+)/([0-9a-zA-Z]+)#',
			'RULE' => 'action=disk.integration.flipchart.$2&fileId=$1',
			'PATH' => WIZARD_SITE_DIR . 'bitrix/services/main/ajax.php',
		],
		[
			'CONDITION' => '#^' . WIZARD_SITE_DIR .  'crm/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.router',
			'PATH' => WIZARD_SITE_DIR . 'crm/index.php',
		],
	);
	foreach ($arNewUrlRewrite as $arUrl)
	{
		if (!in_array($arUrl, $arUrlRewrite))
		{
			\Bitrix\Main\UrlRewriter::add(WIZARD_SITE_ID, $arUrl);
		}
	}
}

<?php

namespace Bitrix\Voximplant\Update;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

class Updater_22_100_0
{
	public static function notifyAdminsOfAmazonTTSChanges()
	{
		if (!Loader::includeModule('im'))
		{
			return '';
		}
		if (static::shouldNotifyOfAmazonTTSChanges())
		{
			if (Loader::includeModule('bitrix24'))
			{
				$adminList = \CBitrix24::getAllAdminId();
			}
			else
			{
				$adminList = [];
				$cursor = \CGroup::GetGroupUserEx(1);
				while($row = $cursor->fetch())
				{
					$adminList[] = $row["USER_ID"];
				}
			}
			static::notifyUsers($adminList);
		}

		return '';
	}

	protected static function notifyUsers(array $userIds)
	{
		Loader::includeModule('ui');
		$messageFields = [
			'TO_USER_ID' => '',
//			"FROM_USER_ID" => $userData["ID"],
			'NOTIFY_TYPE' => IM_NOTIFY_SYSTEM,
			'NOTIFY_MODULE' => 'voximplant',
			'NOTIFY_EVENT' => 'admin_notification',
			'NOTIFY_SUB_TAG' => 'VOXIMPLANT_NOTIFY_TTS_AMAZON_CHANGE|',
			'NOTIFY_MESSAGE' => Loc::getMessage(
				'VI_UPDATE_AMAZON_TTS_CHANGE',
				[
					'#LINK_PRICE#' => 'https://voximplant.com/pricing',
					'#LINK_HELP#' => \Bitrix\UI\Util::getArticleUrlByCode('15618326')
				]
			),
		];

		foreach($userIds as $userId)
		{
			$messageFields['NOTIFY_TAG'] = $messageFields['NOTIFY_SUB_TAG'].'|'.$userId;
			$messageFields['TO_USER_ID'] = $userId;
			\CIMNotify::Add($messageFields);
		}
	}


	protected static function shouldNotifyOfAmazonTTSChanges(): bool
	{
		$telephonyAccount = new \CVoxImplantAccount();
		$accountName = $telephonyAccount->GetAccountName();
		$accountName = str_replace('.bitrixphone.com', '', $accountName);

		return array_key_exists($accountName, static::getAffectedAccountList()) || Option::get('voximplant', 'test_show_notification_amazon_tts', 'N') === 'Y';
	}

	protected static function getAffectedAccountList(): array
	{
		static $accountsWithAmazonTTS = [
			'b24-7902-1455549226' => true,

			'b24-3224-1386093779' => true,
			'b24-7425-1386613968' => true,
			'b24-9871-1408143675' => true,
			'b24-7694-1411556374' => true,
			'b24-2287-1414343038' => true,
			'b24-6028-1417602108' => true,
			'b24-2855-1419849163' => true,
			'b24-9454-1426184051' => true,
			'b24-1072-1426615590' => true,
			'b24-6440-1431927667' => true,
			'b24-1929-1434036832' => true,
			'b24-8325-1434701452' => true,
			'b24-6794-1435116914' => true,
			'b24-8081-1435711137' => true,
			'b24-1431-1437813762' => true,
			'b24-3912-1438887197' => true,
			'b24-5676-1440517542' => true,
			'b24-5799-1443263282' => true,
			'b24-7918-1445783339' => true,
			'b24-7324-1446821531' => true,
			'b24-1159-1447316288' => true,
			'b24-7879-1449799323' => true,
			'b24-1808-1450113807' => true,
			'b24-4736-1451419251' => true,
			'b24-3873-1452650800' => true,
			'b24-4838-1453325741' => true,
			'b24-6411-1453566391' => true,
			'b24-7512-1455273072' => true,
			'b24-8939-1458858627' => true,
			'b24-4898-1459485107' => true,
			'b24-3212-1462585900' => true,
			'b24-9495-1463037175' => true,
			'b24-8562-1463460264' => true,
			'b24-9802-1464976373' => true,
			'b24-8730-1466801106' => true,
			'b24-9574-1468066563' => true,
			'b24-7950-1468907880' => true,
			'b24-4229-1469039835' => true,
			'b24-9093-1469581074' => true,
			'b24-7213-1470914227' => true,
			'b24-4502-1472675960' => true,
			'b24-1460-1472737261' => true,
			'b24-2039-1475755346' => true,
			'b24-7879-1478023434' => true,
			'b24-9893-1478075439' => true,
			'b24-5052-1479416471' => true,
			'b24-7316-1482856398' => true,
			'b24-2836-1483147336' => true,
			'b24-5379-1484277740' => true,
			'b24-3098-1487211979' => true,
			'b24-3174-1487443699' => true,
			'b24-3541-1487703233' => true,
			'b24-4213-1488769986' => true,
			'b24-1855-1489116789' => true,
			'b24-5548-1490806466' => true,
			'b24-5316-1490884618' => true,
			'b24-3397-1491831803' => true,
			'b24-8623-1491962847' => true,
			'b24-9005-1492106980' => true,
			'b24-1007-1492747671' => true,
			'b24-6381-1495317554' => true,
			'b24-7518-1495986432' => true,
			'b24-5021-1496347929' => true,
			'b24-6878-1496348775' => true,
			'b24-1604-1496582369' => true,
			'b24-8791-1498652317' => true,
			'b24-3164-1498738051' => true,
			'b24-3572-1499136422' => true,
			'b24-6202-1500118164' => true,
			'b24-5645-1500674280' => true,
			'b24-2720-1501358254' => true,
			'b24-7189-1501470179' => true,
			'b24-9087-1504710095' => true,
			'b24-1172-1504726939' => true,
			'b24-4716-1505639017' => true,
			'b24-9046-1505745410' => true,
			'b24-2004-1507162624' => true,
			'b24-7919-1509360639' => true,
			'b24-7680-1510227318' => true,
			'b24-1208-1510309183' => true,
			'b24-6661-1511274628' => true,
			'b24-7762-1511816151' => true,
			'b24-9829-1513358122' => true,
			'b24-1895-1514491057' => true,
			'b24-6259-1514922060' => true,
			'b24-3657-1515674989' => true,
			'b24-8096-1515925869' => true,
			'b24-3564-1516965781' => true,
			'b24-1872-1517493495' => true,
			'b24-1938-1518713402' => true,
			'b24-4952-1519203806' => true,
			'b24-7339-1519270190' => true,
			'b24-3061-1520532407' => true,
			'b24-6939-1520668631' => true,
			'b24-9400-1520825580' => true,
			'b24-6928-1521198907' => true,
			'b24-5971-1521566048' => true,
			'b24-2368-1522076017' => true,
			'b24-7254-1522125388' => true,
			'b24-8748-1522240148' => true,
			'b24-9987-1522377436' => true,
			'b24-9723-1522487331' => true,
			'b24-6430-1522800842' => true,
			'b24-1140-1523637628' => true,
			'b24-5971-1524144376' => true,
			'b24-2597-1524332306' => true,
			'b24-4654-1525345939' => true,
			'b24-8349-1525383374' => true,
			'b24-3616-1525682812' => true,
			'b24-5634-1525875698' => true,
			'b24-7135-1525972830' => true,
			'b24-4629-1526008499' => true,
			'b24-2887-1526828311' => true,
			'b24-7178-1526840303' => true,
			'b24-4129-1527138929' => true,
			'b24-1572-1527284819' => true,
			'b24-5347-1527353553' => true,
			'b24-7838-1527872467' => true,
			'b24-9149-1528088010' => true,
			'b24-1594-1528648500' => true,
			'b24-9322-1528748891' => true,
			'b24-2309-1529159139' => true,
			'b24-4743-1531625669' => true,
			'b24-1651-1531857060' => true,
			'b24-8152-1532435428' => true,
			'b24-7489-1533717665' => true,
			'b24-3699-1534333790' => true,
			'b24-8557-1534357795' => true,
			'b24-3714-1534361787' => true,
			'b24-6508-1534777391' => true,
			'b24-2998-1535550720' => true,
			'b24-9902-1536005994' => true,
			'b24-4804-1536121344' => true,
			'b24-2348-1536291366' => true,
			'b24-2454-1536562705' => true,
			'b24-9902-1536868976' => true,
			'b24-5026-1537972316' => true,
			'b24-8310-1538170271' => true,
			'b24-3407-1539270198' => true,
			'b24-8222-1541002641' => true,
			'b24-2803-1542020163' => true,
			'b24-9352-1542463232' => true,
			'b24-5485-1542673881' => true,
			'b24-5635-1543526195' => true,
			'b24-6918-1543559832' => true,
			'b24-7367-1546385580' => true,
			'b24-6807-1547482213' => true,
			'b24-1593-1547724939' => true,
			'b24-5847-1547877571' => true,
			'b24-2346-1548782082' => true,
			'b24-9276-1549363742' => true,
			'b24-5712-1549905535' => true,
			'b24-8760-1550066836' => true,
			'b24-7329-1550300914' => true,
			'b24-2954-1551808888' => true,
			'b24-6774-1551818369' => true,
			'b24-7056-1551827638' => true,
			'b24-2141-1552487134' => true,
			'b24-5156-1552643928' => true,
			'b24-2700-1552667809' => true,
			'b24-8241-1552786682' => true,
			'b24-4598-1552832722' => true,
			'b24-7544-1554208216' => true,
			'b24-1023-1554810366' => true,
			'b24-2061-1555087734' => true,
			'b24-1937-1555349467' => true,
			'b24-6329-1555707626' => true,
			'b24-5296-1555823233' => true,
			'b24-4073-1556545164' => true,
			'b24-7529-1556814053' => true,
			'b24-1131-1558670957' => true,
			'b24-7598-1558982110' => true,
			'b24-2224-1559059755' => true,
			'b24-4634-1559061224' => true,
			'b24-3766-1559309384' => true,
			'b24-3905-1559699110' => true,
			'b24-4657-1560281455' => true,
			'b24-4056-1561067622' => true,
			'b24-9411-1562162980' => true,
			'b24-7725-1562199333' => true,
			'b24-3055-1562259542' => true,
			'b24-6993-1562687556' => true,
			'b24-8450-1562983552' => true,
			'b24-1538-1562989060' => true,
			'b24-2586-1564110617' => true,
			'b24-2469-1564511841' => true,
			'b24-5223-1564686803' => true,
			'b24-8780-1565762984' => true,
			'b24-9398-1565793574' => true,
			'b24-8101-1566332121' => true,
			'b24-1540-1566574507' => true,
			'b24-9447-1567001211' => true,
			'b24-1550-1567271725' => true,
			'b24-5233-1567333420' => true,
			'b24-4031-1567628949' => true,
			'b24-7622-1568139105' => true,
			'b24-6314-1568190225' => true,
			'b24-6638-1568197350' => true,
			'b24-1937-1568601816' => true,
			'b24-7396-1568673727' => true,
			'b24-7383-1569046390' => true,
			'b24-5379-1569273513' => true,
			'b24-5869-1569505517' => true,
			'b24-6746-1569695240' => true,
			'b24-8403-1569726821' => true,
			'b24-1178-1570484255' => true,
			'b24-5856-1570558344' => true,
			'b24-3752-1570563133' => true,
			'b24-7882-1570643002' => true,
			'b24-1637-1571059636' => true,
			'b24-2945-1571177568' => true,
			'b24-2542-1571339640' => true,
			'b24-6906-1572562181' => true,
			'b24-4467-1572625646' => true,
			'b24-3440-1572893125' => true,
			'b24-4200-1573067836' => true,
			'b24-6291-1573506472' => true,
			'b24-7783-1573527561' => true,
			'b24-4576-1573580060' => true,
			'b24-3838-1574089581' => true,
			'b24-9863-1574091718' => true,
			'b24-6526-1574271434' => true,
			'b24-9761-1574390546' => true,
			'b24-2936-1574449238' => true,
			'b24-5535-1574621867' => true,
			'b24-5856-1574794184' => true,
			'b24-4370-1576100037' => true,
			'b24-4882-1576157308' => true,
			'b24-3780-1576552157' => true,
			'b24-9094-1576600597' => true,
			'b24-5137-1576793561' => true,
			'b24-9063-1577466303' => true,
			'b24-7132-1577479771' => true,
			'b24-4819-1577960477' => true,
			'b24-6364-1578842426' => true,
			'b24-5216-1579195559' => true,
			'b24-4775-1579571286' => true,
			'b24-7366-1579577924' => true,
			'b24-9912-1579599925' => true,
			'b24-9898-1579979523' => true,
			'b24-9900-1580147596' => true,
			'b24-8113-1581355758' => true,
			'b24-8192-1581445656' => true,
			'b24-2978-1581567707' => true,
			'b24-1073-1581873899' => true,
			'b24-4954-1581874534' => true,
			'b24-9194-1582141895' => true,
			'b24-3087-1582183728' => true,
			'b24-9543-1582209575' => true,
			'b24-9128-1582561113' => true,
			'b24-1922-1583088150' => true,
			'b24-6556-1583141394' => true,
			'b24-6175-1583249000' => true,
			'b24-2450-1583269616' => true,
			'b24-7615-1583920771' => true,
			'b24-9192-1584011502' => true,
			'b24-9779-1584104742' => true,
			'b24-1451-1584149674' => true,
			'b24-8002-1584539617' => true,
			'b24-2659-1584552790' => true,
			'b24-9382-1584885333' => true,
			'b24-5924-1584913090' => true,
			'b24-8119-1584970174' => true,
			'b24-9857-1584984436' => true,
			'b24-8029-1585101032' => true,
			'b24-1994-1585137009' => true,
			'b24-6663-1585254407' => true,
			'b24-3641-1585307391' => true,
			'b24-9744-1585578215' => true,
			'b24-3787-1585964417' => true,
			'b24-8554-1586271391' => true,
			'b24-4275-1586273448' => true,
			'b24-8788-1586442731' => true,
			'b24-7353-1586457890' => true,
			'b24-6459-1586461850' => true,
			'b24-9129-1586476375' => true,
			'b24-7144-1586510908' => true,
			'b24-1410-1586611099' => true,
			'b24-3773-1586799397' => true,
			'b24-6104-1586857548' => true,
			'b24-2757-1586874703' => true,
			'b24-5517-1586914402' => true,
			'b24-1195-1587312072' => true,
			'b24-3344-1587578330' => true,
			'b24-4296-1587590035' => true,
			'b24-3522-1587646686' => true,
			'b24-3115-1587786491' => true,
			'b24-1302-1588008438' => true,
			'b24-1775-1588137288' => true,
			'b24-6314-1588338278' => true,
			'b24-4289-1588440691' => true,
			'b24-2156-1588466017' => true,
			'b24-9717-1588552033' => true,
			'b24-6781-1588615277' => true,
			'b24-1621-1588716191' => true,
			'b24-6604-1588949294' => true,
			'b24-9911-1588950942' => true,
			'b24-5250-1589173173' => true,
			'b24-1263-1589308526' => true,
			'b24-5589-1589317328' => true,
			'b24-1255-1589379876' => true,
			'b24-1559-1589390849' => true,
			'b24-7635-1589403728' => true,
			'b24-4779-1589465433' => true,
			'b24-7797-1589670366' => true,
			'b24-9413-1589894499' => true,
			'b24-2652-1590022094' => true,
			'b24-4478-1590027648' => true,
			'b24-3192-1590091443' => true,
			'b24-1131-1590166906' => true,
			'b24-4611-1590174145' => true,
			'b24-9666-1590411009' => true,
			'b24-3693-1590440437' => true,
			'b24-5825-1590504409' => true,
			'b24-8439-1590614198' => true,
			'b24-3692-1590667722' => true,
			'b24-8195-1590782270' => true,
			'b24-8594-1590807746' => true,
			'b24-6207-1591108896' => true,
			'b24-3226-1591164928' => true,
			'b24-6656-1591167505' => true,
			'b24-4526-1591278211' => true,
			'b24-8890-1591361607' => true,
			'b24-6311-1591836598' => true,
			'b24-7688-1591889942' => true,
			'b24-6524-1591946235' => true,
			'b24-2449-1592356356' => true,
			'b24-8302-1592409961' => true,
			'b24-4368-1592497961' => true,
			'b24-1731-1592553381' => true,
			'b24-7534-1592571630' => true,
			'b24-1716-1593036167' => true,
			'b24-8322-1593191738' => true,
			'b24-1679-1593267358' => true,
			'b24-4602-1593443278' => true,
			'b24-5451-1593549489' => true,
			'b24-2667-1593564819' => true,
			'b24-3141-1593627951' => true,
			'b24-1614-1593634868' => true,
			'b24-9730-1593636100' => true,
			'b24-9605-1593765549' => true,
			'b24-2125-1594100686' => true,
			'b24-8975-1594221775' => true,
			'b24-6884-1594374460' => true,
			'b24-9958-1594413271' => true,
			'b24-4289-1594423676' => true,
			'b24-2837-1594640152' => true,
			'b24-6359-1594657815' => true,
			'b24-7814-1594671631' => true,
			'b24-4414-1595720752' => true,
			'b24-7297-1595854517' => true,
			'b24-3977-1595966545' => true,
			'b24-3634-1596033612' => true,
			'b24-1516-1596065889' => true,
			'b24-6829-1596110486' => true,
			'b24-2256-1596200440' => true,
			'b24-4477-1596483112' => true,
			'b24-5020-1596485552' => true,
			'b24-5765-1596640025' => true,
			'b24-4655-1596826338' => true,
			'b24-1871-1597254238' => true,
			'b24-3665-1597428996' => true,
			'b24-3754-1597706510' => true,
			'b24-4813-1597793818' => true,
			'b24-6842-1598275073' => true,
			'b24-1554-1598295177' => true,
			'b24-9763-1598342549' => true,
			'b24-3943-1598364808' => true,
			'b24-7842-1598538267' => true,
			'b24-6035-1598940708' => true,
			'b24-8824-1599491865' => true,
			'b24-4373-1599685958' => true,
			'b24-4746-1599844129' => true,
			'b24-7331-1600106617' => true,
			'b24-1590-1600263540' => true,
			'b24-2010-1600268373' => true,
			'b24-7660-1600719734' => true,
			'b24-4633-1600862982' => true,
			'b24-7761-1600870982' => true,
			'b24-6907-1601395821' => true,
			'b24-7898-1601540277' => true,
			'b24-2246-1601571749' => true,
			'b24-5898-1601783616' => true,
			'b24-9402-1602210939' => true,
			'b24-7827-1603138489' => true,
			'b24-1166-1603197109' => true,
			'b24-3361-1603364924' => true,
			'b24-3746-1603581566' => true,
			'b24-3476-1603640908' => true,
			'b24-7819-1603706531' => true,
			'b24-2606-1603808608' => true,
			'b24-4737-1603823497' => true,
			'b24-4786-1604013916' => true,
			'b24-2614-1604083220' => true,
			'b24-6810-1604091862' => true,
			'b24-8859-1604430326' => true,
			'b24-8755-1604513069' => true,
			'b24-9716-1604870939' => true,
			'b24-2754-1605120126' => true,
			'b24-6688-1605120642' => true,
			'b24-4084-1605277183' => true,
			'b24-6372-1605323917' => true,
			'b24-7980-1605463971' => true,
			'b24-8893-1605540864' => true,
			'b24-4557-1605637448' => true,
			'b24-1568-1605901212' => true,
			'b24-6419-1605999087' => true,
			'b24-5024-1606064745' => true,
			'b24-9448-1606080487' => true,
			'b24-1896-1606328817' => true,
			'b24-5381-1606342464' => true,
			'b24-7226-1606394944' => true,
			'b24-1160-1606438201' => true,
			'b24-9812-1606518762' => true,
			'b24-6157-1606672120' => true,
			'b24-7718-1606765366' => true,
			'b24-1121-1606876765' => true,
			'b24-6881-1607003472' => true,
			'b24-8611-1607014249' => true,
			'b24-8501-1607216615' => true,
			'b24-7048-1607540694' => true,
			'b24-2560-1607601774' => true,
			'b24-8872-1607701657' => true,
			'b24-4294-1607716325' => true,
			'b24-7802-1607899044' => true,
			'b24-6709-1608075233' => true,
			'b24-4459-1608143575' => true,
			'b24-3795-1608204936' => true,
			'b24-5345-1608534941' => true,
			'b24-5371-1608735318' => true,
			'b24-3975-1608737670' => true,
			'b24-3190-1609237366' => true,
			'b24-1510-1609281684' => true,
			'b24-4684-1609782221' => true,
			'b24-1355-1609791563' => true,
			'b24-5553-1610045110' => true,
			'b24-8816-1610117321' => true,
			'b24-2702-1610365300' => true,
			'b24-7804-1610505007' => true,
			'b24-3015-1610555518' => true,
			'b24-5535-1610603615' => true,
			'b24-7723-1610635956' => true,
			'b24-8298-1610745081' => true,
			'b24-1301-1610770146' => true,
			'b24-6065-1610988708' => true,
			'b24-2754-1611002751' => true,
			'b24-7099-1611180682' => true,
			'b24-4540-1611310869' => true,
			'b24-8854-1611336725' => true,
			'b24-1008-1611535155' => true,
			'b24-6170-1611757329' => true,
			'b24-3585-1611934822' => true,
			'b24-7217-1611947583' => true,
			'b24-2227-1611959389' => true,
			'b24-7167-1611972335' => true,
			'b24-5458-1612194553' => true,
			'b24-6809-1612195324' => true,
			'b24-7816-1612200600' => true,
			'b24-4022-1612205086' => true,
			'b24-5126-1612324798' => true,
			'b24-9494-1612353754' => true,
			'b24-2074-1612365362' => true,
			'b24-2325-1612391677' => true,
			'b24-6872-1612438877' => true,
			'b24-5472-1612534205' => true,
			'b24-8110-1612584243' => true,
			'b24-6685-1612722638' => true,
			'b24-4369-1612759278' => true,
			'b24-4634-1612960539' => true,
			'b24-9873-1613044983' => true,
			'b24-2814-1613110971' => true,
			'b24-5338-1613134411' => true,
			'b24-1936-1613155529' => true,
			'b24-2732-1613415775' => true,
			'b24-5284-1613420179' => true,
			'b24-9309-1613437510' => true,
			'b24-7407-1613570633' => true,
			'b24-2494-1613742222' => true,
			'b24-4512-1614062949' => true,
			'b24-4168-1614221311' => true,
			'b24-2247-1614346341' => true,
			'b24-2923-1614622083' => true,
			'b24-7057-1614722825' => true,
			'b24-3773-1614811030' => true,
			'b24-2952-1614873237' => true,
			'b24-8898-1614907496' => true,
			'b24-9803-1614939012' => true,
			'b24-1488-1615109737' => true,
			'b24-5029-1615240140' => true,
			'b24-4741-1615556500' => true,
			'b24-9843-1615955331' => true,
			'b24-7323-1616417605' => true,
			'b24-6103-1616508275' => true,
			'b24-6337-1616585603' => true,
			'b24-3634-1616605981' => true,
			'b24-3176-1616799701' => true,
			'b24-2504-1617046567' => true,
			'b24-2108-1617100409' => true,
			'b24-6192-1617112744' => true,
			'b24-4020-1617117234' => true,
			'b24-7547-1617201862' => true,
			'b24-5202-1617235987' => true,
			'b24-3902-1617246356' => true,
			'b24-8584-1617376682' => true,
			'b24-3246-1617624029' => true,
			'b24-6501-1617637689' => true,
			'b24-7398-1617646365' => true,
			'b24-2450-1617655816' => true,
			'b24-7549-1617662728' => true,
			'b24-5191-1617760023' => true,
			'b24-8072-1617799637' => true,
			'b24-2307-1617907441' => true,
			'b24-6415-1617992788' => true,
			'b24-6408-1618355594' => true,
			'b24-7894-1618438201' => true,
			'b24-2349-1618560869' => true,
			'b24-9010-1618839160' => true,
			'b24-6134-1618856262' => true,
			'b24-7779-1618864117' => true,
			'b24-7492-1619009883' => true,
			'b24-1581-1619014832' => true,
			'b24-7443-1619107582' => true,
			'b24-1751-1619160493' => true,
			'b24-9053-1619181677' => true,
			'b24-5341-1619216422' => true,
			'b24-1943-1619662251' => true,
			'b24-8115-1619723063' => true,
			'b24-2944-1620164982' => true,
			'b24-7333-1620253015' => true,
			'b24-1935-1620325583' => true,
			'b24-2137-1620330521' => true,
			'b24-3896-1620331756' => true,
			'b24-6033-1620406674' => true,
			'b24-9129-1620658939' => true,
			'b24-7825-1620742416' => true,
			'b24-4891-1620760604' => true,
			'b24-9047-1620806217' => true,
			'b24-3223-1620936880' => true,
			'b24-2177-1621276838' => true,
			'b24-2999-1621352408' => true,
			'b24-1289-1621355276' => true,
			'b24-3794-1621875108' => true,
			'b24-2047-1621957462' => true,
			'b24-9444-1622060390' => true,
			'b24-8207-1622102832' => true,
			'b24-6843-1622142320' => true,
			'b24-5732-1622295165' => true,
			'b24-8929-1622440261' => true,
			'b24-7293-1622453489' => true,
			'b24-2405-1622463530' => true,
			'b24-4526-1622493851' => true,
			'b24-4252-1622592668' => true,
			'b24-2594-1622643811' => true,
			'b24-2927-1622646981' => true,
			'b24-6080-1622654775' => true,
			'b24-2241-1622658294' => true,
			'b24-7995-1622726590' => true,
			'b24-7821-1622850444' => true,
			'b24-8802-1623094185' => true,
			'b24-2972-1623138050' => true,
			'b24-4546-1623239459' => true,
			'b24-9016-1623254632' => true,
			'b24-9594-1623341783' => true,
			'b24-5833-1623359278' => true,
			'b24-9012-1623458212' => true,
			'b24-7344-1623700627' => true,
			'b24-2860-1623872826' => true,
			'b24-1473-1623931807' => true,
			'b24-4722-1623936253' => true,
			'b24-3545-1624041475' => true,
			'b24-9079-1624203371' => true,
			'b24-3088-1624302460' => true,
			'b24-1616-1624308366' => true,
			'b24-9618-1624355309' => true,
			'b24-9722-1624367402' => true,
			'b24-8714-1624477161' => true,
			'b24-5807-1624547875' => true,
			'b24-9883-1624567227' => true,
			'b24-7646-1624576762' => true,
			'b24-2894-1624655981' => true,
			'b24-2016-1624817213' => true,
			'b24-6375-1624892278' => true,
			'b24-4244-1624974865' => true,
			'b24-6058-1624979819' => true,
			'b24-5151-1625020909' => true,
			'b24-5573-1625073505' => true,
			'b24-7201-1625567596' => true,
			'b24-8796-1625690849' => true,
			'b24-8842-1625859545' => true,
			'b24-9295-1625942949' => true,
			'b24-5829-1626134955' => true,
			'b24-1056-1626174316' => true,
			'b24-9780-1626240871' => true,
			'b24-7274-1626284669' => true,
			'b24-3146-1626344140' => true,
			'b24-5010-1626374713' => true,
			'b24-8262-1626442572' => true,
			'b24-6044-1626456247' => true,
			'b24-8822-1626492843' => true,
			'b24-6120-1626672834' => true,
			'b24-6867-1626787204' => true,
			'b24-2665-1626800381' => true,
			'b24-6268-1626802257' => true,
			'b24-6889-1626922630' => true,
			'b24-5918-1626983228' => true,
			'b24-3036-1627047762' => true,
			'b24-5008-1627051816' => true,
			'b24-2843-1627169053' => true,
			'b24-3671-1627214796' => true,
			'b24-1371-1627337138' => true,
			'b24-7241-1627502641' => true,
			'b24-3510-1627657994' => true,
			'b24-5638-1627675506' => true,
			'b24-2694-1627680293' => true,
			'b24-8172-1627837421' => true,
			'b24-7682-1628047504' => true,
			'b24-4250-1628524464' => true,
			'b24-8804-1628527712' => true,
			'b24-4689-1628699780' => true,
			'b24-4692-1628738432' => true,
			'b24-7053-1628793399' => true,
			'b24-6454-1628852650' => true,
			'b24-3593-1628977030' => true,
			'b24-7421-1628996846' => true,
			'b24-6738-1629003802' => true,
			'b24-1259-1629218144' => true,
			'b24-6831-1629240601' => true,
			'b24-9301-1629248850' => true,
			'b24-8079-1629392960' => true,
			'b24-1514-1629484100' => true,
			'b24-6315-1629488451' => true,
			'b24-2913-1629560924' => true,
			'b24-9701-1629716241' => true,
			'b24-5554-1629734025' => true,
			'b24-7642-1629807223' => true,
			'b24-3121-1629896950' => true,
			'b24-7179-1629901004' => true,
			'b24-3044-1629937843' => true,
			'b24-3527-1629964010' => true,
			'b24-6950-1630083441' => true,
			'b24-8627-1630366715' => true,
			'b24-5023-1630412214' => true,
			'b24-3425-1630436672' => true,
			'b24-2139-1630442928' => true,
			'b24-9502-1630497126' => true,
			'b24-2620-1630498320' => true,
			'b24-1480-1630591854' => true,
			'b24-9043-1630593778' => true,
			'b24-8955-1630624303' => true,
			'b24-2828-1631001557' => true,
			'b24-4675-1631018905' => true,
			'b24-3587-1631132144' => true,
			'b24-4100-1631473211' => true,
			'b24-7710-1631557402' => true,
			'b24-8343-1631612484' => true,
			'b24-3216-1631642175' => true,
			'b24-3342-1631650171' => true,
			'b24-6464-1631714911' => true,
			'b24-8018-1631740798' => true,
			'b24-8947-1631917858' => true,
			'b24-5274-1632027594' => true,
			'b24-7529-1632084038' => true,
			'b24-5909-1632091625' => true,
			'b24-6998-1632144022' => true,
			'b24-8214-1632173029' => true,
			'b24-5425-1632271406' => true,
			'b24-4716-1632374157' => true,
			'b24-1496-1632441096' => true,
			'b24-1072-1632480375' => true,
			'b24-7123-1632507660' => true,
			'b24-4499-1632512294' => true,
			'b24-2954-1632600264' => true,
			'b24-7295-1632619903' => true,
			'b24-8942-1632728866' => true,
			'b24-4745-1632765272' => true,
			'b24-5407-1632822342' => true,
			'b24-5712-1632998236' => true,
			'b24-1821-1633010565' => true,
			'b24-3465-1633014817' => true,
			'b24-4654-1633079916' => true,
			'b24-2483-1633122442' => true,
			'b24-6765-1633350995' => true,
			'b24-3371-1633373839' => true,
			'b24-7651-1633398333' => true,
			'b24-9884-1633507376' => true,
			'b24-6242-1633528511' => true,
			'b24-1780-1633532359' => true,
			'b24-2599-1633608820' => true,
			'b24-4414-1633724391' => true,
			'b24-2606-1633798419' => true,
			'b24-1813-1633825742' => true,
			'b24-3226-1633878947' => true,
			'b24-2079-1634042710' => true,
			'b24-3954-1634097474' => true,
			'b24-6457-1634107284' => true,
			'b24-3098-1634130043' => true,
			'b24-9558-1634166311' => true,
			'b24-6350-1634256514' => true,
			'b24-5573-1634308377' => true,
			'b24-6393-1634335697' => true,
			'b24-8574-1634436283' => true,
			'b24-1905-1634570092' => true,
			'b24-5947-1634574814' => true,
			'b24-3913-1634821154' => true,
			'b24-5903-1635346284' => true,
			'b24-1119-1635426552' => true,
			'b24-5857-1635445044' => true,
			'b24-8924-1635528571' => true,
			'b24-5379-1635533468' => true,
			'b24-1872-1635595056' => true,
			'b24-7945-1635689970' => true,
			'b24-8171-1635805832' => true,
			'b24-3133-1635821018' => true,
			'b24-3468-1635856172' => true,
			'b24-7455-1635984855' => true,
			'b24-7359-1636034693' => true,
			'b24-6494-1636037502' => true,
			'b24-1110-1636046168' => true,
			'b24-6816-1636305395' => true,
			'b24-5478-1636378272' => true,
			'b24-5560-1636508319' => true,
			'b24-4470-1636647542' => true,
			'b24-9409-1636746886' => true,
			'b24-1726-1637112907' => true,
			'b24-3927-1637127257' => true,
			'b24-7956-1637423424' => true,
			'b24-7295-1637432187' => true,
			'b24-2667-1637485335' => true,
			'b24-7370-1637520651' => true,
			'b24-3545-1637538196' => true,
			'b24-3268-1637601305' => true,
			'b24-7895-1637883299' => true,
			'b24-3914-1637950448' => true,
			'b24-4498-1638223165' => true,
			'b24-4274-1638471575' => true,
			'b24-1306-1638700291' => true,
			'b24-1783-1638811035' => true,
			'b24-9194-1639062406' => true,
			'b24-5888-1639081029' => true,
			'b24-8680-1639093741' => true,
			'b24-1873-1639152665' => true,
			'b24-2539-1639224969' => true,
			'b24-7145-1639395062' => true,
			'b24-5689-1639398509' => true,
			'b24-8252-1639417679' => true,
			'b24-6406-1639602791' => true,
			'b24-1792-1639742832' => true,
			'b24-6177-1639771076' => true,
			'b24-9660-1640006116' => true,
			'b24-3141-1640247691' => true,
			'b24-5064-1640645848' => true,
			'b24-8088-1640723505' => true,
			'b24-3460-1640890035' => true,
			'b24-1073-1641079202' => true,
			'b24-8517-1641223324' => true,
			'b24-4294-1641266131' => true,
			'b24-6216-1641273093' => true,
			'b24-4122-1641304667' => true,
			'b24-2029-1641321392' => true,
			'b24-2942-1641462451' => true,
			'b24-6048-1641575815' => true,
			'b24-6021-1641913098' => true,
			'b24-3106-1641930603' => true,
			'b24-3966-1642050065' => true,
			'b24-7795-1642194640' => true,
			'b24-4427-1642252447' => true,
			'b24-8110-1642345909' => true,
			'b24-5183-1642356144' => true,
			'b24-4780-1642406503' => true,
			'b24-6049-1642452867' => true,
			'b24-3837-1642599976' => true,
			'b24-1885-1642782942' => true,
			'b24-8125-1642966298' => true,
			'b24-1797-1643132979' => true,
			'b24-3782-1643207152' => true,
			'b24-7921-1643387498' => true,
			'b24-6658-1643407153' => true,
			'b24-5600-1643426276' => true,
			'b24-7411-1643443703' => true,
			'b24-1026-1643548686' => true,
			'b24-2530-1643626647' => true,
			'b24-6685-1644002176' => true,
			'b24-7758-1644085464' => true,
			'b24-9448-1644239617' => true,
			'b24-7621-1644271718' => true,
			'b24-1457-1644396929' => true,
			'b24-4042-1644405914' => true,
			'b24-2913-1644434118' => true,
			'b24-9569-1644530269' => true,
			'b24-1426-1644611349' => true,
			'b24-6135-1644891321' => true,
			'b24-7536-1644949931' => true,
			'b24-8470-1645019591' => true,
			'b24-4699-1645035619' => true,
			'b24-8806-1645103660' => true,
			'b24-9828-1645187868' => true,
			'b24-6692-1645531844' => true,
			'b24-1320-1645539682' => true,
			'b24-9099-1645553106' => true,
			'b24-9356-1645645459' => true,
			'b24-2934-1645709163' => true,
			'b24-8293-1646030930' => true,
			'b24-6514-1646095729' => true,
			'b24-8352-1646252360' => true,
			'b24-8939-1646416488' => true,
			'b24-5361-1646649761' => true,
			'b24-1026-1646755698' => true,
			'b24-3057-1647045001' => true,
			'b24-5128-1647339227' => true,
			'b24-3013-1627654536' => true,
			'b24-5961-1612287175' => true,
			'b24-1955-1619618879' => true,
			'b24-3312-1603722875' => true,
			'b24-1838-1386090174' => true,
			'b24-8914-1548247972' => true,
			'b24-2699-1386090905' => true,
			'b24-7758-1628777305' => true,
			'b24-2971-1631274520' => true,
			'b24-6613-1632819477' => true,
			'b24-1626-1613398957' => true,
			'b24-9737-1639136049' => true,
			'b24-4696-1633452697' => true,
			'b24-8640-1599664736' => true,
			'b24-3725-1521213241' => true,
			'b24-5794-1625481091' => true,
			'b24-7438-1615983110' => true,
			'b24-9268-1591692098' => true,
			'b24-7594-1578759995' => true,
			'b24-6061-1623663743' => true,
			'b24-6557-1638727561' => true,
			'b24-1240-1612038443' => true,
			'b24-4473-1630353187' => true,
			'b24-2692-1580836349' => true,
			'b24-4271-1608110305' => true,
			'b24-5224-1634553191' => true,
			'b24-6950-1612351539' => true,
			'b24-2724-1617005780' => true,
			'b24-4647-1606330374' => true,
			'b24-2993-1490609735' => true,
			'b24-7700-1642079361' => true,
			'b24-3595-1587994985' => true,
			'b24-7915-1626424202' => true,
			'b24-8550-1641458712' => true,
			'b24-1124-1532536918' => true,
			'b24-9747-1626210381' => true,
			'b24-6681-1460382648' => true,
			'b24-3976-1594398635' => true,
			'b24-8282-1621101148' => true,
			'b24-2106-1442252935' => true,
			'b24-7762-1470225275' => true,
			'b24-6345-1583857204' => true,
			'b24-1824-1586168610' => true,
			'b24-6203-1600787808' => true,
			'b24-3885-1609308256' => true,
			'b24-8265-1587492832' => true,
			'b24-3299-1472203361' => true,
			'b24-8175-1444049941' => true,
			'b24-5696-1604009801' => true,
			'b24-6098-1638536765' => true,
			'b24-8185-1490125821' => true,
			'b24-8304-1523544781' => true,
			'b24-7411-1595802440' => true,
			'b24-2087-1530278829' => true,
			'b24-7782-1620125202' => true,
			'b24-8324-1609445085' => true,
			'b24-2104-1550696502' => true,
			'b24-9434-1586037110' => true,
			'b24-8145-1541340006' => true,
			'b24-5635-1593510991' => true,
			'b24-8027-1606473676' => true,
			'b24-8535-1524520678' => true,
			'b24-7914-1636407581' => true,
			'b24-7973-1589961799' => true,
			'b24-7895-1622633264' => true,
			'b24-6497-1558020445' => true,
			'b24-5697-1609704756' => true,
			'b24-9314-1637016299' => true,
			'b24-6649-1582626938' => true,
			'b24-8087-1599987866' => true,
			'b24-3625-1606914995' => true,
			'b24-8947-1602867415' => true,
			'b24-4636-1391609254' => true,
			'b24-2221-1574844291' => true,
			'b24-6125-1640565432' => true,
			'b24-5720-1641892246' => true,
			'b24-8481-1537808274' => true,
			'b24-1215-1543853142' => true,
			'b24-4491-1587643527' => true,
			'b24-9816-1611940087' => true,
			'b24-9819-1569826921' => true,
			'b24-7999-1640868483' => true,
			'b24-5334-1591172286' => true,
			'b24-1014-1618991908' => true,
			'b24-3465-1640166322' => true,
			'b24-9847-1627985472' => true,
			'b24-7126-1429860239' => true,
			'b24-9034-1386132098' => true,
			'b24-9474-1569144807' => true,
			'b24-2493-1530199080' => true,
			'b24-1240-1587486505' => true,
			'b24-6449-1587114319' => true,
			'b24-6058-1534415334' => true,
			'b24-2810-1496157878' => true,
			'b24-4051-1637659850' => true,
			'b24-2090-1575303575' => true,
			'b24-7025-1603211170' => true,
			'b24-1432-1590430659' => true,
			'b24-7314-1508332436' => true,
			'b24-4965-1534343447' => true,
			'b24-5583-1542024728' => true,
			'b24-2076-1591178724' => true,
			'b24-3123-1591079569' => true,
			'b24-1886-1620926617' => true,
			'b24-4079-1539787873' => true,
			'b24-8660-1631526816' => true,
			'b24-2749-1386100004' => true,
			'b24-4345-1585758671' => true,
			'b24-8067-1426857739' => true,
			'b24-8900-1562673070' => true,
			'b24-5462-1567336201' => true,
			'b24-1374-1477063431' => true,
			'b24-5410-1572158420' => true,
			'b24-1630-1575718870' => true,
			'b24-9134-1550045330' => true,
			'b24-6408-1509005752' => true,
			'b24-7208-1484241124' => true,
			'b24-1666-1479406436' => true,
			'b24-5302-1553952079' => true,
			'b24-1188-1576614002' => true,
			'b24-4184-1539182033' => true,
			'b24-4276-1556200870' => true,
			'b24-7888-1549109623' => true,
			'b24-5602-1524597715' => true,
			'b24-8937-1561649254' => true,
			'b24-4655-1560705940' => true,
			'b24-7074-1523968972' => true,
			'b24-4472-1473888308' => true,
			'b24-8703-1459419060' => true,
			'b24-4335-1478086885' => true,
			'b24-4147-1626866781' => true,
			'b24-8279-1542717697' => true,
			'b24-6665-1611611040' => true,
			'b24-8989-1613743340' => true,
			'b24-7481-1617120113' => true,
			'b24-8760-1628433136' => true,
			'b24-2704-1629904411' => true,
			'b24-9652-1631213151' => true,
			'b24-2905-1634723636' => true,
			'b24-1943-1636625360' => true,
			'b24-5039-1640086813' => true,
			'b24-3981-1640168329' => true,
			'b24-2148-1641303205' => true,
			'b24-7081-1641463218' => true,
		];
		return $accountsWithAmazonTTS;
	}
}
<? namespace Bitrix\Main\UpdateSystem;$GLOBALS['____1856977574']= array(base64_decode('YmFzZ'.'TY0X2'.'Rl'.'Y'.'29kZQ=='),base64_decode('d'.'W5z'.'Z'.'XJ'.'pYWxp'.'emU='),base64_decode('b3'.'BlbnNzbF92ZXJpZ'.'nk'.'='),base64_decode('dW5zZXJpYW'.'xpemU='));if(!function_exists(__NAMESPACE__.'\\___754262683')){function ___754262683($_784931800){static $_373696424= false; if($_373696424 == false) $_373696424=array(''.'YWxsb3d'.'lZF9'.'jb'.'G'.'Fz'.'c2Vz','aW'.'5'.'mbw==','c2lnbmF0'.'dXJl','c2hhMj'.'U'.'2V2l0'.'a'.'FJTQUVu'.'Y3J5cHRp'.'b'.'24=','a'.'W5mb'.'w==','YW'.'xsb3dl'.'ZF'.'9'.'jbG'.'Fz'.'c2Vz','RXJyb3Ig'.'d'.'mVya'.'WZ5I'.'G9'.'wZW5z'.'c2wgW0hD'.'UFAwMV0=','L'.'S'.'0tL'.'S1CRUdJ'.'T'.'iB'.'QVUJMSUMgS0VZLS0'.'tLS0KTU'.'lJQklqQU5CZ2txa'.'GtpRzl3MEJBUUVGQUFPQ0FROEF'.'NSUl'.'CQ'.'2'.'dLQ0FRR'.'U'.'E2'.'aG'.'N4SXF'.'paXRVWlJNd1lpdWtTVQpoOXhhNWZFR'.'Fl'.'sY2'.'NiVzN'.'2'.'ajh'.'B'.'dmEzNX'.'ZLcV'.'ZONGlCOXRxQ1g3'.'alU'.'4'.'NnFBY'.'T'.'J2MzdtY'.'lRGN'.'n'.'B'.'jWTZI'.'R1BB'.'a'.'FJ'.'G'.'CmJwbndYT1k3WUd4QjFuU'.'0tad'.'kUr'.'ak'.'FSY'.'mlM'.'TEJnW'.'jF'.'jRzZaMGR1dTVp'.'MVho'.'cE'.'lSTDF'.'jT'.'jBIa'.'DV'.'mZXp'.'walhDNk8KWXhZcTBuVG9IV'.'G'.'p5UmIxe'.'WN6'.'d3RtaVJ3WXF1'.'ZFh'.'n'.'L3hX'.'eHB'.'wcXdGM'.'HR'.'V'.'b'.'G'.'QzUUJyM2'.'k'.'2OEI'.'4an'.'FNb'.'St'.'U'.'am'.'RlQQp1'.'L2ZnMUo'.'wSkd'.'0UjQve'.'k'.'s0RzdZ'.'S'.'k52aG'.'11aHJSR2t5QVFWMFR'.'WdTVM'.'RX'.'V'.'nU3hqQXBS'.'bUlKU'.'U5IUU'.'1L'.'MEVoOT'.'N3'.'Ck1ab0ZvU'.'HA5U2dK'.'N'.'0dhRlU4a3pTK'.'0VRY'.'250WX'.'h'.'iMU5IVUpVSXZU'.'ZGl1UlVlRk'.'tse'.'VRk'.'eElySDZDTC8'.'vYXBNSDMK'.'RndJRE'.'F'.'R'.'QUIKLS0'.'tLS1FTkQg'.'UFVCT'.'ElDIEtFW'.'S0tL'.'S0'.'t');return base64_decode($_373696424[$_784931800]);}}; use Bitrix\Main\Application; use Bitrix\Main\Security\Cipher; use Bitrix\Main\Security\SecurityException; class HashCodeParser{ private string $_359968163; public function __construct(string $_359968163){ $this->_359968163= $_359968163;}  public function parse(){ $_759301200= $GLOBALS['____1856977574'][0]($this->_359968163); $_759301200= $GLOBALS['____1856977574'][1]($_759301200,[___754262683(0) => false]); if($GLOBALS['____1856977574'][2]($_759301200[___754262683(1)], $_759301200[___754262683(2)], $this->__793394986(), ___754262683(3)) == round(0+0.5+0.5)){ $_419898977= Application::getInstance()->getLicense()->getHashLicenseKey(); $_1195313745= new Cipher(); $_1803486053= $_1195313745->decrypt($_759301200[___754262683(4)], $_419898977); return $GLOBALS['____1856977574'][3]($_1803486053,[___754262683(5) => false]);} throw new SecurityException(___754262683(6));} private function __793394986(): string{ return ___754262683(7);}}?>
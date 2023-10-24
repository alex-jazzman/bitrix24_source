<?
use Bitrix\Main\Application;
use Bitrix\Main\Localization\Loc;
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class CawChangStatusActivityComponent extends CBitrixComponent {
    const STATUS_OK = "200 OK";
    const STATUS_CREATED = "201 Created";
    const STATUS_WRONG_REQUEST = "400 Bad Request";
    const STATUS_UNAUTHORIZED = "401 Unauthorized";
    const STATUS_PAYMENT_REQUIRED = "402 Payment Required";
    const STATUS_FORBIDDEN = "403 Forbidden";
    const STATUS_NOT_FOUND = "404 Not Found";
    const STATUS_TO_MANY_REQUESTS = "429 Too Many Requests";
    const STATUS_INTERNAL = "500 Internal Server Error";

    protected $token = null;
    /** @var \Bitrix\Main\HttpResponse $response */
    protected $response = null;
    protected $command = null;

    public function executeComponent() {
        $this->init();
        $this->checkToken();
        $content = "";
        switch ($this->command) {
            case "changeStatus":
                $data=$this->request->getValues();
                $files=$this->request->getFileList();
                self::validateRequest($data);
                $dataActivity=explode("|",$data['proccess_id']);
                AddMessage2Log($dataActivity);
                CBPRuntime::SendExternalEvent($dataActivity[0], $dataActivity[1], ['context'=>$data,"fileA"=>$files]);
                $content="success";
                break;
            default:
                $this->showError("Unknown command \"{$this->command}\"");
                break;
        }
        $this->response
            ->setContent($content)
            ->setStatus(self::STATUS_OK);
            Application::getInstance()->end();
            
    }

    private function validateRequest($array){
        if(!isset($array['status'])) $this->showError("STATUS hasnt transfered");
        if(!isset($array['proccess_id'])) $this->showError("proccess_id hasnt transfered");
        //if($array['status']!==false || $array['status']!==true) $this->showError("inncorect status value");
    }

    protected function init() {
        global $APPLICATION, $USER, $DB;
        $APPLICATION->RestartBuffer();

        $this->response = Application::getInstance()
            ->getContext()
            ->getResponse();
        $this->response
            ->getHeaders()
            ->set(
                "Content-Type",
                "form-data"//application/json
            );

    }

    protected function checkToken() {
        //$this->token = \Bitrix\Main\Config\Option::get("mywebstor.hms_integration", "access_token", "");
        //if (!$this->token || strlen($this->token) !== 128)
        //    $this->showError("Access token is corrupted. Update it in Bitrix admin panel", self::STATUS_INTERNAL);

        //$requestToken = $this->request->getHeader("Bitrix-Hms-Integration-Token");

        //if (!$requestToken || $requestToken != $this->token)
           // $this->showError("Authorization error", self::STATUS_UNAUTHORIZED);

        $command = $this->request->getHeader("Bitrix-CAW-Command");
        if (isset($command) && !empty($command))
            $this->command = $command;
    }

    protected function showError($errorMessage = "Unexpected error", $errorCode = self::STATUS_WRONG_REQUEST) {
        if (!$errorMessage)
            $errorMessage = "Unexpected error";

        $this->response
            ->setContent(
                \Bitrix\Main\Web\Json::encode(array(
                    "status" => "error",
                    "message" => $errorMessage
                ))
            )
            ->setStatus($errorCode);
            Application::getInstance()->end();
    }

}
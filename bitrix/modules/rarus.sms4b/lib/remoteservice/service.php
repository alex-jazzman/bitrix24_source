<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService;

use Bitrix\Main\Localization\Loc;
use CEvent;
use CModule;
use COption;
use Bitrix\Main\Mail;
use CSite;
use Rarus\Sms4b\RemoteService\Methods\StartSession;
use Rarus\Sms4b\RemoteService\Methods\CloseSession;
use Rarus\Sms4b\RemoteService\Methods\GroupSMS;
use Rarus\Sms4b\RemoteService\Methods\CheckSMS;
use Rarus\Sms4b\RemoteService\Methods\ParamSMS;
use Rarus\Sms4b\RemoteService\Methods\LoadSMS;
use Rarus\Sms4b\Sendings;
use Rarus\Sms4b\Config;
use Rarus\Sms4b\Exceptions\Sms4bException;

class Service
{
    private const BASE_CONNECTION = 'session_id_base';
    private const CONNECTION_FOR_SEND = 'session_id_send_sms';
    /**
     * @var string
     */
    private $login;
    /**
     * @var string
     */
    private $password;
    /**
     * @var int
     */
    private $gmt;
    /**
     * @var int|null
     */
    private $sessionId;
    /**
     * @var string|null
     */
    public $lastError;
    /**
     * @var Config\Service
     */
    private $config;

    /**
     * @throws Sms4bException
     */
    public function __construct()
    {
        $this->config = new Config\Service();
        $this->sessionId = $this->config->getSessionId(self::BASE_CONNECTION);

    }

    /**
     * @param string $login
     * @param string $password
     * @param int    $gmt
     *
     * @return StartSession\Response
     * @throws Sms4bException
     */
    private function StartSession(string $login, string $password, int $gmt): StartSession\Response
    {
        $instance = new StartSession\MethodExecutor();
        $response = $instance->execute([
            'Login'    => $login,
            'Password' => $password,
            'Gmt'      => $gmt
        ]);

        return $response;
    }

    /**
     * @param int $sessionId
     *
     * @return CloseSession\Response
     * @throws Sms4bException
     */
    private function CloseSession(int $sessionId): CloseSession\Response
    {
        $instance = new CloseSession\MethodExecutor();
        $response = $instance->execute([
            'SessionID' => $sessionId,
        ]);
        return $response;
    }

    /**
     * @param int|null                                   $group
     * @param string                                     $sender
     * @param int|null                                   $encoding
     * @param string|null                                $body
     * @param \DateTime|null                             $actualDate
     * @param \DateTime|null                             $startDate
     * @param string                                     $period
     * @param Sendings\SendingInQueue\Message\Collection $list
     *
     * @return GroupSMS\Response
     * @throws Sms4bException
     */
    public function GroupSMS(
        ?int $group,
        string $sender,
        ?int $encoding,
        ?string $body,
        ?\DateTime $actualDate,
        ?\DateTime $startDate,
        string $period,
        Sendings\SendingInQueue\Message\Collection $list
    ): GroupSMS\Response {
        $instance = new GroupSMS\MethodExecutor();
        $response = $instance->execute([
            'SessionId' => $this->sessionId,
            'Group'     => $group,
            'Source'    => $sender,
            'Encoding'  => $encoding,
            'Body'      => $body,
            'Off'       => $actualDate,
            'Start'     => $startDate,
            'Period'    => $period,
            'List'      => $list,
        ]);
        return $response;
    }

    /**
     * @param array $guids
     *
     * @return CheckSMS\Response
     * @throws Sms4bException
     */
    public function CheckSMS(
        array $guids
    ): CheckSMS\Response {
        $instance = new CheckSMS\MethodExecutor();
        $response = $instance->execute([
            'SessionId' => $this->sessionId,
            'Guids'     => $guids
        ]);
        return $response;
    }

    /**
     * @return ParamSMS\Response
     * @throws Sms4bException
     */
    public function ParamSMS(): ParamSMS\Response
    {
        $instance = new ParamSMS\MethodExecutor();
        $response = $instance->execute([
            'SessionId' => $this->sessionId
        ]);
        return $response;
    }

    /**
     * @param \DateTime $changesFrom
     * @param int       $flags
     *
     * @return LoadSMS\Response
     * @throws Sms4bException
     */
    public function LoadSMS(
        \DateTime $changesFrom,
        int $flags
    ): LoadSms\Response {
        $instance = new LoadSMS\MethodExecutor();
        $response = $instance->execute([
            'SessionId'   => $this->sessionId,
            'ChangesFrom' => $changesFrom,
            'Flags'       => $flags
        ]);
        return $response;
    }

    /**
     * @param string|null $source
     * @param string|null $login
     * @param string|null $password
     * @param int|null    $gmt
     *
     * @throws Sms4bException
     */
    public function openConnectToService(
        ?string $source = null,
        ?string $login = null,
        ?string $password = null,
        ?int $gmt = null
    ): void {
        $this->login = $this->setLogin($login, $source);
        $this->password = $password ?? $this->config->getPassword();
        $this->gmt = $gmt ?? (int)$this->config->getGmt();

        $source === null ? $this->updateSessionId(self::BASE_CONNECTION) : $this->createSessionId(self::CONNECTION_FOR_SEND);
    }

    /**
     * @throws Sms4bException
     */
    public function closeConnect(): void
    {
        $response = $this->CloseSession($this->sessionId);

        if (!$response->isSuccess()) {
            $this->lastError = $response->getState()->getDescription();
        }
    }

    /**
     * @param string|null $login
     * @param string|null $sendingSource
     *
     * @return string
     * @throws Sms4bException
     */
    private function setLogin(?string $login = null, ?string $sendingSource = null): string
    {
        $module = CModule::CreateModuleObject('rarus.sms4b');
        $login = $login ?? $this->config->getLogin();

        $source = $sendingSource ? '_' . $sendingSource : '';

        return ' b' . $module->MODULE_VERSION . $source . ' ' . $login;
    }

    /**
     * @param string $variableName
     *
     * @throws Sms4bException
     */
    private function createSessionId(string $variableName): void
    {
        $response = $this->StartSession($this->login, $this->password, $this->gmt);

        if ($response->isSuccess()) {
            $this->config->setSessionId($variableName, $response->getState()->getCode());
            $this->sessionId = $response->getState()->getCode();
            $this->config->setSentErrorEmailSetting('N');
            $this->config->clearDateForSendEmail();
        } else {
            $this->sendEmailIsNeeded();
            $this->lastError = $response->getState()->getDescription();
        }
    }

    /**
     * @param string $variableName
     *
     * @throws Sms4bException
     */
    private function updateSessionId(string $variableName): void
    {
        if (!empty($this->password) && !empty($this->login)) {
            if ($this->sessionId === null || $this->sessionId === 0) {
                $this->createSessionId($variableName);
            } else {
                if (!$this->ParamSMS()->isSuccess()) {
                    $this->createSessionId($variableName);
                }
            }
        } else {
            throw new Sms4bException(Loc::getMessage('SMS4B_NO_LOGIN_OR_PASSWORD'));
        }
    }

    /**
     * @return string|null
     */
    public function getLastError(): ?string
    {
        return $this->lastError;
    }

    /**
     * @param string $lastError
     */
    public function setLastError(string $lastError): void
    {
        $this->lastError = $lastError;
    }

    /**
     * @return void
     * @throws Sms4bException
     */
    private function sendEmailIsNeeded(): void
    {
        if ($this->config->getSendEmailToAdminSetting() === 'Y' &&
            $this->config->getSentErrorEmailSetting() !== 'Y'
        ) {
            $now = new \DateTime('now');
            $lastCheckDate = $this->config->getDateForSendEmail();
            if (empty($lastCheckDate)) {
                $this->config->setDateForSendEmail($now->add(new \DateInterval('PT5M')));
            } else {
                try {
                    $lastCheckDate = new \DateTime($lastCheckDate);
                } catch (\Exception $e) {
                    return;
                }
                if ($now > $lastCheckDate) {
                    if (CEvent::SendImmediate('SMS4B_ADMIN_SEND', CSite::GetDefSite(),
                            ['DEFAULT_EMAIL_FROM' => COption::GetOptionString('main', 'email_from')])
                        === Mail\Event::SEND_RESULT_SUCCESS
                    ) {
                        $this->config->setSentErrorEmailSetting('Y');
                    }
                }

            }

        }
    }

}
<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\Exceptions\Sms4bException;

abstract class Source
{
    protected $code;
    protected $descriptionForService;
    protected $descriptionForUser;

    /**
     * @param int $code
     *
     * @throws Sms4bException
     */
    public function __construct(int $code)
    {
        if (!\in_array($code, $this->getAllowed(), true)) {
            throw new Sms4bException(Loc::getMessage('SMS4B_SOURCE_ERROR') . $code . '.');
        }
        $this->code = $code;
    }

    abstract static protected function getAllowed();


    /**
     * @param int $code
     *
     * @return Source
     * @throws Sms4bException
     */
    public static function createSourceInstance(int $code): Source
    {
        if (\in_array($code, Sale::getAllowed(), true)) {
            $instance = new Sale($code);
        } elseif (\in_array($code, MailEvent::getAllowed(), true)) {
            $instance = new MailEvent($code);
        } elseif (\in_array($code, Support::getAllowed(), true)) {
            $instance = new Support($code);
        } elseif (\in_array($code, Crm::getAllowed(), true)) {
            $instance = new Crm($code);
        } elseif (\in_array($code, Task::getAllowed(), true)) {
            $instance = new Task($code);
        } elseif (\in_array($code, User::getAllowed(), true)) {
            $instance = new User($code);
        } elseif (\in_array($code, PublicComponent::getAllowed(), true)) {
            $instance = new PublicComponent($code);
        } elseif (\in_array($code, AdminForm::getAllowed(), true)) {
            $instance = new AdminForm($code);
        } elseif (\in_array($code, ContactBySms::getAllowed(), true)) {
            $instance = new ContactBySms($code);
        } elseif (\in_array($code, Calendar::getAllowed(), true)) {
            $instance = new Calendar($code);
        } elseif (\in_array($code, Subscribe::getAllowed(), true)) {
            $instance = new Subscribe($code);
        } elseif (\in_array($code, Telephony::getAllowed(), true)) {
            $instance = new Telephony($code);
        } elseif (\in_array($code, BxMessageServices::getAllowed(), true)) {
            $instance = new BxMessageServices($code);
        } elseif (\in_array($code, ForgottenBasket::getAllowed(), true)) {
            $instance = new ForgottenBasket($code);
        } else {
            $instance = new Custom(Custom::CUSTOM);
        }

        return $instance;
    }

    /**
     * @return int
     */
    public function getCode(): int
    {
        return $this->code;
    }

    /**
     * @return mixed
     */
    public function getDescriptionForService()
    {
        return $this->descriptionForService;
    }

    /**
     * @return mixed
     */
    public function getDescriptionForUser()
    {
        return $this->descriptionForUser;
    }
}
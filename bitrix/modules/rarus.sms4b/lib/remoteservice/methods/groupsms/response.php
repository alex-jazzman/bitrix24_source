<?php

namespace Rarus\Sms4b\RemoteService\Methods\GroupSMS;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\RemoteService;

class Response extends RemoteService\Response\ComplexResponse
{
    /**
     * @var int $group
     */
    private $group;

    /**
     * @var RemoteService\Dto\GroupSms\Collection $smsResultCollection
     */
    private $smsResultCollection;

    /**
     * @param int                                   $result
     * @param int                                   $group
     * @param RemoteService\Dto\GroupSms\Collection $smsResultCollection
     */
    public function __construct(
        int $result,
        int $group,
        RemoteService\Dto\GroupSms\Collection $smsResultCollection
    ) {
        parent::__construct($result);

        $this->group = $group;
        $this->smsResultCollection = $smsResultCollection;
    }


    /**
     * @inheritdoc
     */
    protected function registerStates(): void
    {
        parent::registerStates();
        $this->registerState(-2, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_2'));
        $this->registerState(-20, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_20'));
        $this->registerState(-21, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_21'));
        $this->registerState(-29, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_29'));
        $this->registerState(-30, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_30'));
        $this->registerState(-31, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_31'));
        $this->registerState(-32, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_32'));
        $this->registerState(-33, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_33'));
        $this->registerState(-34, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_34'));
        $this->registerState(-35, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_35'));
        $this->registerState(-36, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_36'));
        $this->registerState(-50, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_50'));
        $this->registerState(-51, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_51'));
        $this->registerState(-52, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_52'));
        $this->registerState(-53, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_53'));
        $this->registerState(-65, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_65'));
        $this->registerState(-66, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_66'));
        $this->registerState(-68, Loc::getMessage('SMS4B_GROUP_SMS_RESPONSE_68'));
    }

    /**
     * @return bool
     */
    public function isSuccess(): bool
    {
        return $this->getState()->getCode() > 0;
    }

    /**
     * @return int
     */
    public function getGroup(): int
    {
        return $this->group;
    }

    /**
     * @return RemoteService\Dto\GroupSms\Collection
     */
    public function getSmsResultCollection(): RemoteService\Dto\GroupSms\Collection
    {
        return $this->smsResultCollection;
    }

    /**
     * @return array
     */
    public function resultToArray(): array
    {
        $result = [];
        foreach ($this->smsResultCollection as $item) {
            $result[$item->getGuid()] = $item->getResult();
        }

        return $result;
    }
}
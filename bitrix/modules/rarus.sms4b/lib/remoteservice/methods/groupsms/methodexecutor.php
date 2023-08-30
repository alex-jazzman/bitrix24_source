<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Methods\GroupSMS;

use Rarus\Sms4b\RemoteService;
use Rarus\Sms4b\Sendings;

class MethodExecutor extends RemoteService\MethodExecutor\MethodExecutor
{
    /**
     * array keys
     */
    const LIST = 'List';
    const OFF = 'Off';
    const START = 'Start';
    const GROUP = 'Group';
    const ENCODING = 'Encoding';
    const BODY = 'Body';

    /**
     * @var string
     */
    private $dateFormat = 'Ymd H:i:s';

    /**
     * {@inheritdoc}
     */
    protected function getMethodName(): string
    {
        return 'GroupSMS';
    }

    /**
     * {@inheritdoc}
     */
    protected function prepareResponse($rawResponse)
    {
        $response = $rawResponse->{$this->getMethodName() . 'Result'};
        $result = $response->Result;
        $group = $response->Group;

        $smsResultCollection = new RemoteService\Dto\GroupSms\Collection();
        if (!empty($response->List)) {
            if (!is_array($response->List->CheckSMSList)) {
                $smsResult = new RemoteService\Dto\GroupSms\SmsResult(
                    $response->List->CheckSMSList->G,
                    $response->List->CheckSMSList->R
                );
                $smsResultCollection->attach($smsResult);
            } else {
                foreach ($response->List->CheckSMSList as $item) {
                    $smsResult = new RemoteService\Dto\GroupSms\SmsResult(
                        $item->G,
                        $item->R
                    );
                    $smsResultCollection->attach($smsResult);
                }
            }
        }

        return new Response($result, $group, $smsResultCollection);
    }

    /**
     * @inheritDoc
     */
    protected function prepareRequestArguments(array $requestArguments): array
    {
        $requestArguments[self::LIST] = $this->prepareList($requestArguments[self::LIST]);
        $requestArguments[self::OFF] = $this->prepareDateTime($requestArguments[self::OFF]);
        $requestArguments[self::START] = $this->prepareDateTime($requestArguments[self::START]);
        $requestArguments[self::GROUP] = $requestArguments[self::GROUP] > 0 ? $requestArguments[self::GROUP] : -1;
        $requestArguments[self::ENCODING] = $requestArguments[self::ENCODING] ?? '';
        $requestArguments[self::BODY] = $requestArguments[self::BODY] ?? '';

        return $requestArguments;
    }

    /**
     * @param Sendings\SendingInQueue\Message\Collection $list
     *
     * @return array
     */
    private function prepareList(Sendings\SendingInQueue\Message\Collection $list): array
    {
        $messageParameters = [];
        /**
         * @var Sendings\SendingInQueue\Message\Collection $message
         */
        foreach ($list as $message) {
            $messageParameters[] = [
                'G' => $message->getGuid(),
                'D' => $message->getDestination(),
                'B' => $message->getText(),
                'E' => $message->getEncoding()
            ];
        }

        return $messageParameters;
    }

    /**
     * @param \DateTime|null $dateTime
     *
     * @return string
     */
    private function prepareDateTime(?\DateTime $dateTime): string
    {
        if (!$dateTime instanceof \DateTime) {
            return '';
        }

        return $dateTime->format($this->dateFormat);
    }

}
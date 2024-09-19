<?php

declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Middleware;

return function(
    ServerRequestInterface $request,
    Throwable $exception,
    bool $displayErrorDetails,
    bool $logErrors,
    bool $logErrorDetails,
    ?LoggerInterface $logger = null
) use ($app): Response {
    $statusCode = 500;
    if(is_int($exception->getCode())
        && $exception->getCode() >= 400
        && $exception->getCode() <= 500
    ) {
        $statusCode = $exception->getCode();
    }
    $className = new \ReflectionClass($exception::class);


    if(\SotbitRestAPI::isDebug()) {
        $data = [
            'status'  => 'error',
            'message' => Core\Helper::convertEncodingToUtf8($exception->getMessage()),
            'class'   => $className->getName(),
            'code'    => $statusCode,
            'file'    => $exception->getFile(),
            'line'    => $exception->getLine(),
        ];
    } else {
        $data = [
            'status'  => 'error',
            'message' => Core\Helper::convertEncodingToUtf8($exception->getMessage()),
        ];
    }

    // class write log
    $logWriter = new Core\LogWriter();

    // write user id
    $userId = (new Middleware\Auth())->getUserId($request);
    if($userId) {
        $logWriter->setParam('USER_ID', $userId);
    }

    $logWriter->setRequest($request);
    $logWriter->setParam('RESPONSE_HTTP_CODE', $statusCode.':'.$exception->getMessage());
    $logWriter->add();



    $body = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    $response = $app->getResponseFactory()->createResponse();
    $response->getBody()->write($body);

    return $response
        ->withStatus($statusCode)
        ->withHeader('Content-type', 'application/problem+json');
};
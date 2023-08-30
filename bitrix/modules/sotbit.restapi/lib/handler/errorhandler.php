<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Handler;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Middleware;
use Sotbit\RestAPI\Localisation as l;

class ErrorHandler extends \Slim\Handlers\Error
{
    public function __invoke(
        Request $request,
        Response $response,
        \Exception $exception
    ): Response {
        $statusCode = $this->getStatusCode($exception);
        $className = new \ReflectionClass(get_class($exception));

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

        // write log
        $logWriter = new Core\LogWriter();
        $logWriter->setRequest($request);
        $logWriter->add(
            [
                'RESPONSE_HTTP_CODE' => $statusCode.':'.$data['status'],
            ]
        );

        $body = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        $response->getBody()->write($body);

        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-type', 'application/problem+json');
    }

    private function getStatusCode(\Exception $exception): int
    {
        $statusCode = 500;
        if(is_int($exception->getCode())
            && $exception->getCode() >= 400
            && $exception->getCode() <= 599
        ) {
            $statusCode = $exception->getCode();
        }

        return $statusCode;
    }
}

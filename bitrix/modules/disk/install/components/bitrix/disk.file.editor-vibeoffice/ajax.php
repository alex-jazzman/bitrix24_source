<?php

use Bitrix\Disk;
use Bitrix\Disk\Document\DocumentEditorUser;
use Bitrix\Disk\Document\Online\UserInfoToken;
use Bitrix\Disk\Document\OnlyOffice\Editor\ConfigBuilder;
use Bitrix\Disk\Document\OnlyOffice\Filters\DocumentSessionCheck;
use Bitrix\Disk\Document\Vibeoffice\DocumentSessionManager;
use Bitrix\Disk\Document\Vibeoffice\PullInitializationSuppressor;
use Bitrix\Disk\Document\Vibeoffice\SavedContentSynchronizer;
use Bitrix\Disk\Document\Vibeoffice\VibeofficeHandler;
use Bitrix\Disk\Document\Vibeoffice\Service\PresenceService;
use Bitrix\Disk\User;
use Bitrix\Main\HttpResponse;
use Bitrix\Main\Engine;
use Bitrix\Main\Error;
use Bitrix\Main\Engine\Action;
use Bitrix\Main\Engine\ActionFilter;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loader::requireModule('disk');

/**
 * Component AJAX controller for the vibeoffice editor shell.
 *
 * Parallel to {@see DiskFileEditorOnlyOfficeController}: the backend
 * {@see \Bitrix\Disk\Controller\Vibeoffice} redirects into the editor shell through
 * `getSliderContent`/`showNotFound` here (carrying only the DocumentSession id/hash),
 * and this controller renders the `bitrix:disk.file.editor-vibeoffice` component inside
 * the ui.sidepanel wrapper. The DocumentSession rights re-check reuses the generic
 * {@see DocumentSessionCheck} filter (it is session-based, not OnlyOffice-config-based).
 */
class DiskFileEditorVibeofficeController extends Engine\Controller
{
	protected function processBeforeAction(Action $action): bool
	{
		if (!VibeofficeHandler::isEnabled())
		{
			$this->addError(new Error('Vibeoffice handler is not configured.'));

			return false;
		}

		return parent::processBeforeAction($action);
	}

	protected function shouldDecodePostData(Action $action): bool
	{
		return false;
	}

	public function configureActions()
	{
		return [
			'showNotFound' => [
				'-prefilters' => [
					ActionFilter\Csrf::class,
				],
			],
			'getSliderContent' => [
				'+prefilters' => [
					(new DocumentSessionCheck())
						->enableHashCheck(function(){
							return Bitrix\Main\Context::getCurrent()->getRequest()->get('documentSessionHash');
						})
						->enableOwnerCheck()
						->enableStrictCheckRight()
					,
				],
				'-prefilters' => [
					ActionFilter\Csrf::class,
				],
			],
			// Resolve the display name of the author of a concurrent change for the live
			// "document was modified" view toast. Token-gated exactly like the OnlyOffice
			// shell ({@see DiskFileEditorOnlyOfficeController::configureActions} 'getUserInfo').
			'getUserInfo' => [
				'+prefilters' => [
					new Bitrix\Main\Engine\ActionFilter\CloseSession(),
					new ActionFilter\ContentType([ActionFilter\ContentType::JSON]),
					(new DocumentSessionCheck())
						->enableOwnerCheck()
						->enableHashCheck(function(){
							return (new Engine\JsonPayload())->getData()['documentSessionHash'];
						})
					,
				],
				'-prefilters' => [
					ActionFilter\Authentication::class,
				],
			],
			// keep-alive ping from the helper wrapper (install/js/disk/editor-vibeoffice/src/vibeoffice.js
			// #trackWork): refreshes the document session so it is not garbage-collected while the
			// user keeps editing. Mirrors {@see DiskFileEditorOnlyOfficeController::configureActions}.
			'markAsStillWorkingSession' => [
				'+prefilters' => [
					new Bitrix\Main\Engine\ActionFilter\CloseSession(),
					new ActionFilter\ContentType([ActionFilter\ContentType::JSON]),
					(new DocumentSessionCheck())
						->enableOwnerCheck()
						->enableHashCheck(function(){
							return (new Engine\JsonPayload())->getData()['documentSessionHash'];
						})
					,
				],
			],
			'presenceEnter' => $this->getPresenceActionConfiguration(),
			'presenceHeartbeat' => $this->getPresenceActionConfiguration(),
			'presenceLeave' => $this->getPresenceActionConfiguration(),
		];
	}

	public function presenceEnterAction(string $presenceContext, int $clientRevision = 0): ?array
	{
		return $this->handlePresenceAction(PresenceService::ACTION_ENTER, $presenceContext, $clientRevision);
	}

	public function presenceHeartbeatAction(string $presenceContext, int $clientRevision = 0): ?array
	{
		return $this->handlePresenceAction(PresenceService::ACTION_HEARTBEAT, $presenceContext, $clientRevision);
	}

	public function presenceLeaveAction(string $presenceContext, int $clientRevision = 0): ?array
	{
		return $this->handlePresenceAction(PresenceService::ACTION_LEAVE, $presenceContext, $clientRevision);
	}

	public function markAsStillWorkingSessionAction(Disk\Document\Models\DocumentSession $documentSession): ?array
	{
		if ($documentSession->isView())
		{
			$this->addError(new Error("Could not update info by view session: {$documentSession->getId()}."));

			return null;
		}
		$documentInfo = $documentSession->getInfo();
		if (!$documentInfo)
		{
			$this->addError(new Error("Could not get info by session: {$documentSession->getId()}."));

			return null;
		}

		$documentInfo->actualizeUpdateTime();

		return [
			'documentInfo' => [
				'updateTime' => $documentInfo->getUpdateTime(),
			],
		];
	}

	public function getUserInfoAction(int $userId, string $infoToken, Disk\Document\Models\DocumentSession $documentSession): ?array
	{
		// This action runs with Authentication removed (anonymously reachable), and the object
		// may have been deleted, so getObject() can return null — guard before dereferencing it
		// to answer with a clean error instead of a fatal (M5).
		$object = $documentSession->getObject();
		if (!$object)
		{
			$this->addError(new Error("Could not find the object for the document session."));

			return null;
		}

		$validToken = UserInfoToken::checkTimeLimitedToken($infoToken, $userId, $object->getRealObjectId());
		if (!$validToken)
		{
			$this->addError(new Error("Invalid infoToken to get information about user {$userId}."));

			return null;
		}

		$userModel = User::getById($userId);
		if (!$userModel)
		{
			$this->addError(new Error("Could find user by id: {$userId}."));

			return null;
		}

		return [
			'user' => [
				'id' => $userId,
				'name' => $userModel->getFormattedName(),
				'avatar' => $userModel->getAvatarSrc(),
			],
		];
	}

	public function getSliderContentAction(Disk\Document\Models\DocumentSession $documentSession, int $editorMode = ConfigBuilder::VISUAL_MODE_USUAL): HttpResponse
	{
		$this->suppressGlobalPullInitialization();
		$documentSession = $this->refreshViewSession($documentSession);

		$content = $GLOBALS['APPLICATION']->includeComponent(
			'bitrix:ui.sidepanel.wrapper',
			'',
			[
				'RETURN_CONTENT' => true,
				'POPUP_COMPONENT_NAME' => 'bitrix:disk.file.editor-vibeoffice',
				'POPUP_COMPONENT_TEMPLATE_NAME' => '',
				'POPUP_COMPONENT_PARAMS' => [
					'DOCUMENT_SESSION' => $documentSession,
					'EDITOR_MODE' => $editorMode,
				],
				'PLAIN_VIEW' => true,
				'IFRAME_MODE' => true,
				'PREVENT_LOADING_WITHOUT_IFRAME' => false,
				'USE_PADDING' => false,
			],
		);

		$response = new HttpResponse();
		$response->setContent($content);

		return $response;
	}

	/**
	 * A view opened from an existing Disk item can enter this action directly with the old
	 * view-session id, bypassing DocumentService::viewDocumentAction(). Refresh the host content
	 * first and rotate the session before the component opens the platform document key.
	 */
	private function refreshViewSession(Disk\Document\Models\DocumentSession $documentSession): Disk\Document\Models\DocumentSession
	{
		if (!$documentSession->isView() || $documentSession->isVersion())
		{
			return $documentSession;
		}

		try
		{
			$file = $documentSession->getFile();
			if ($file)
			{
				(new SavedContentSynchronizer())->synchronize($file);
			}
		}
		catch (\Throwable)
		{
			// A delayed save must not turn an otherwise readable document into an error page.
		}

		$freshSession = Disk\Document\Models\DocumentSession::loadById($documentSession->getId());
		if ($freshSession)
		{
			$documentSession = $freshSession;
		}

		if (!$documentSession->isOutdatedByFileContent())
		{
			return $documentSession;
		}

		$userId = (int)$this->getCurrentUser()?->getId();
		if ($userId <= 0)
		{
			return $documentSession;
		}

		try
		{
			$freshSession = (new DocumentSessionManager())->cloneSessionWithCurrentContentVersion(
				$documentSession,
				$userId,
			);

			return $freshSession ?: $documentSession;
		}
		catch (\Throwable)
		{
			return $documentSession;
		}
	}

	public function showNotFoundAction(): HttpResponse
	{
		$this->suppressGlobalPullInitialization();

		$content = $GLOBALS['APPLICATION']->includeComponent(
			'bitrix:ui.sidepanel.wrapper',
			'',
			[
				'RETURN_CONTENT' => true,
				'POPUP_COMPONENT_NAME' => 'bitrix:disk.file.editor-vibeoffice',
				'POPUP_COMPONENT_TEMPLATE_NAME' => '',
				'POPUP_COMPONENT_PARAMS' => [
					'TEMPLATE' => 'not-found',
				],
				'PLAIN_VIEW' => true,
				'IFRAME_MODE' => true,
				'PREVENT_LOADING_WITHOUT_IFRAME' => false,
				'USE_PADDING' => false,
			],
		);

		$response = new HttpResponse();
		$response->setContent($content);

		return $response;
	}

	protected function isCurrentUserDocumentEditor(): bool
	{
		return DocumentEditorUser::isCurrentUserDocumentEditor();
	}

	private function suppressGlobalPullInitialization(): void
	{
		PullInitializationSuppressor::suppressForDocumentEditor($this->isCurrentUserDocumentEditor());
	}

	private function getPresenceActionConfiguration(): array
	{
		return [
			'+prefilters' => [
				new ActionFilter\CloseSession(),
				new ActionFilter\ContentType([ActionFilter\ContentType::JSON]),
				new ActionFilter\HttpMethod([ActionFilter\HttpMethod::METHOD_POST]),
			],
		];
	}

	private function handlePresenceAction(string $action, string $presenceContext, int $clientRevision): ?array
	{
		$result = (new PresenceService())->handle(
			$action,
			$presenceContext,
			(int)($this->getCurrentUser()?->getId() ?? 0),
			$clientRevision,
		);
		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getData();
	}
}

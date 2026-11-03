import { jwtDecode } from "../../../jwt-decode/build/esm/index";
import { BoardMessenger } from './BoardMessenger';
import { SdkEventBus } from './SdkEventBus';
import { AccessLevel, } from './types/SDK';
import { SDKEvents } from './types/events';
export default class WebSDK {
    constructor(params) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        this._params = params;
        this._iframeEl = document.createElement('iframe');
        this._iframeEl.allow = 'clipboard-read; clipboard-write; fullscreen';
        // Throws on a malformed or non-http(s) appUrl before anything else is set up.
        this._messenger = new BoardMessenger(this._iframeEl, params.appUrl);
        this._bus = new SdkEventBus(this._messenger);
        let accessLevel;
        let canEditBoard;
        const boardData = {};
        let jwtParams = {
            user_id: '',
            username: '',
            avatar_url: '',
            access_level: 'read',
            can_edit_board: false,
            webhook_url: '',
            document_id: '',
            download_link: '',
            session_id: '',
            file_name: '',
        };
        if (params.token) {
            try {
                jwtParams = jwtDecode(params.token);
                accessLevel = jwtParams.access_level === 'read' ? AccessLevel.readonly : AccessLevel.editable;
                canEditBoard = jwtParams.can_edit_board;
                boardData.documentId = jwtParams.document_id;
                boardData.fileUrl = jwtParams.download_link;
                boardData.sessionId = jwtParams.session_id;
                boardData.fileName = jwtParams.file_name;
            }
            catch (e) {
                console.error('invalid token');
            }
        }
        this._boardParams = {
            appUrl: encodeURIComponent(params.appUrl),
            accessLevel,
            canEditBoard,
            token: params.token,
            lang: params.lang || 'ru',
            // bitrix partnerId by default
            partnerId: params.partnerId || '0',
            boardUrl: params.boardUrl && encodeURIComponent(params.boardUrl),
            ui: {
                colorTheme: ((_a = params.ui) === null || _a === void 0 ? void 0 : _a.colorTheme) || 'flipOriginLight',
                openTemplatesModal: !!((_b = params.ui) === null || _b === void 0 ? void 0 : _b.openTemplatesModal),
                compactHeader: !!((_c = params.ui) === null || _c === void 0 ? void 0 : _c.compactHeader),
                showCloseButton: !!((_d = params.ui) === null || _d === void 0 ? void 0 : _d.showCloseButton),
                dashboardFlow: ((_e = params.ui) === null || _e === void 0 ? void 0 : _e.dashboardFlow) || undefined,
                exportAsFile: ((_f = params.ui) === null || _f === void 0 ? void 0 : _f.exportAsFile) !== false,
                spinner: (_g = params.ui) === null || _g === void 0 ? void 0 : _g.spinner,
                userKickable: (_h = params.ui) === null || _h === void 0 ? void 0 : _h.userKickable,
                confirmUserKick: (_j = params.ui) === null || _j === void 0 ? void 0 : _j.confirmUserKick,
                scrollToElement: (_k = params.ui) === null || _k === void 0 ? void 0 : _k.scrollToElement,
                features: (_l = params.ui) === null || _l === void 0 ? void 0 : _l.features,
                shareElementInBitrix: (_m = params.ui) === null || _m === void 0 ? void 0 : _m.shareElementInBitrix,
            },
            appContainerDomain: window.location.origin,
            boardData,
        };
        this.registerEventHandlers();
    }
    init() {
        const container = document.getElementById(this._params.containerId);
        if (!container) {
            console.error(`Элемент с id "${this._params.containerId}" не найден.`);
            return;
        }
        this._iframeEl.src = this.createUrl();
        this._iframeEl.style.width = '100%';
        this._iframeEl.style.height = '100%';
        this._iframeEl.style.border = 'none';
        container.appendChild(this._iframeEl);
        this._bus.start();
        window.FlipBoard = this.getBoardMethods();
    }
    // Teardown is explicit only: unsubscribing on beforeunload would leave the sdk deaf when the
    // navigation is cancelled or the page comes back from bfcache.
    destroy() {
        this._bus.stop();
    }
    // Local shim: page-level handlers reuse the SDK trust check (source + origin).
    isTrustedMessage(event) {
        return this._messenger.isTrusted(event);
    }
    registerEventHandlers() {
        this._bus.on(SDKEvents.waitParams, () => {
            this._messenger.post(SDKEvents.setParams, this._boardParams);
        });
        this._bus.on(SDKEvents.boardChanged, () => {
            var _a, _b;
            (_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onBoardChanged) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
        this._bus.on(SDKEvents.successBoardRenamed, (data) => {
            var _a, _b;
            (_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onBoardRenamed) === null || _b === void 0 ? void 0 : _b.call(_a, (data === null || data === void 0 ? void 0 : data.name) || '');
        });
        this._bus.on(SDKEvents.userIsKicked, () => {
            var _a, _b;
            (_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onUserKicked) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
        this._bus.on(SDKEvents.userConfirmKickFromBoard, () => {
            var _a, _b;
            (_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onUserKickConfirmed) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
        this._bus.on(SDKEvents.shareElementWithSocials, (data) => {
            var _a, _b;
            const shareData = data;
            (_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onShareElementWithSocials) === null || _b === void 0 ? void 0 : _b.call(_a, (shareData === null || shareData === void 0 ? void 0 : shareData.link) || '', (shareData === null || shareData === void 0 ? void 0 : shareData.social) || 'telegram');
        });
        this._bus.on(SDKEvents.shareElementWithBitrix, (data) => {
            var _a, _b;
            (_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onShareElementWithBitrix) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        });
        this._bus.on(SDKEvents.aiTextRequest, (data) => {
            this.handleAITextRequest(data);
        });
        this._bus.on(SDKEvents.aiTextCancel, (data) => {
            var _a, _b;
            (_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onAITextCancel) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        });
        this._bus.on(SDKEvents.mentionMembersRequest, (data) => {
            this.handleMentionMembersRequest(data);
        });
        this._bus.on(SDKEvents.mentionMembersCancel, (data) => {
            var _a, _b;
            (_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onMentionMembersCancel) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        });
    }
    handleAITextRequest(requestData) {
        var _a;
        const events = this._params.events;
        this.respondToBoard(requestData, SDKEvents.aiTextResponse, SDKEvents.aiTextError, (_a = events === null || events === void 0 ? void 0 : events.onAITextRequest) === null || _a === void 0 ? void 0 : _a.bind(events));
    }
    handleMentionMembersRequest(requestData) {
        var _a;
        const events = this._params.events;
        this.respondToBoard(requestData, SDKEvents.mentionMembersResponse, SDKEvents.mentionMembersError, (_a = events === null || events === void 0 ? void 0 : events.onMentionMembersRequest) === null || _a === void 0 ? void 0 : _a.bind(events));
    }
    /**
     * Runs one host handler and answers the board on the matching event pair. A host that did not
     * subscribe gets `NOT_SUPPORTED` rather than silence, so the board can stop waiting instead of
     * hanging on a request nobody will ever answer. Shared so a new request event costs a
     * subscription rather than another copy of this flow.
     */
    respondToBoard(request, successEvent, errorEvent, handler) {
        const { requestId } = request;
        if (!handler) {
            this._messenger.post(errorEvent, { requestId, code: 'NOT_SUPPORTED' });
            return;
        }
        handler(request)
            .then((response) => {
            if ('error' in response) {
                this._messenger.post(errorEvent, Object.assign({ requestId }, response.error));
                return;
            }
            this._messenger.post(successEvent, Object.assign({ requestId }, response));
        })
            .catch(() => {
            this._messenger.post(errorEvent, { requestId, code: 'UNKNOWN' });
        });
    }
    getBoardMethods() {
        return {
            tryToCloseBoard: () => {
                const closed = this._bus.waitFor(SDKEvents.successCloseApp, SDKEvents.errorCloseApp);
                this._messenger.post(SDKEvents.tryToCloseApp);
                return closed;
            },
            renameBoard: (name) => {
                const renamed = this._bus.waitFor(SDKEvents.successBoardRenamed, SDKEvents.errorBoardRenamed);
                this._messenger.post(SDKEvents.renameBoard, { name });
                return renamed;
            },
            // Другие методы можно добавить здесь
        };
    }
    createUrl() {
        const url = new URL(`${this._params.appUrl}${this._boardParams.partnerId === '0' ? '/sdkBoard' : ''}`);
        url.searchParams.set('fromSDK', 'true');
        if (this._boardParams.ui.openTemplatesModal)
            url.searchParams.set('openTemplates', 'true');
        if (this._boardParams.ui.spinner && this._boardParams.ui.spinner !== 'default')
            url.searchParams.set('spinner', this._boardParams.ui.spinner);
        url.searchParams.set('dt', Date.now().toString());
        if (this._boardParams.ui.scrollToElement)
            url.searchParams.set('elementId', this._boardParams.ui.scrollToElement);
        return url.toString();
    }
}
//# sourceMappingURL=flip-board-sdk.js.map
{"version":3,"file":"registry.bundle.map.js","names":["this","BX","Messenger","v2","Component","exports","im_v2_lib_dateFormatter","ui_vue3","ui_lottie","im_v2_lib_user","im_v2_lib_logger","ui_reactionsSelect","ui_vue3_components_reactions","im_v2_component_elements","im_v2_lib_utils","im_v2_lib_quote","main_core","im_v2_application_core","im_v2_lib_menu","im_v2_provider_service","main_core_events","im_v2_const","im_v2_lib_parser","MessageStatus","name","props","item","type","Object","required","isOverlay","Boolean","default","computed","message","formattedDate","DateFormatter","formatByCode","date","DateCode","shortTimeFormat","isSelfMessage","authorId","Core","getUserId","messageStatus","error","OwnMessageStatus","sending","viewedByOthers","viewed","sent","methods","loc","phraseCode","$Bitrix","Loc","getMessage","template","MessageAttach","components","Attach","dialogId","String","dialog","$store","getters","user","dialogColor","ChatType","color","created","provide","MessageKeyboard","Keyboard","ReactionUser","Avatar","userId","Number","AvatarSize","avatarStyle","avatar","backgroundImage","_store","babelHelpers","classPrivateFieldLooseKey","_restClient","_userManager","UserService","constructor","defineProperty","writable","value","classPrivateFieldLooseBase","getStore","getRestClient","UserManager","loadReactionUsers","messageId","reaction","users","Logger","warn","queryParams","filter","callMethod","RestMethod","imV2ChatMessageReactionTail","then","response","data","setUsersToModel","values","map","id","catch","console","Error","AdditionalUsers","UserListPopup","show","bindElement","emits","showPopup","loadingAdditionalUsers","additionalUsers","watch","newValue","oldValue","loadUsers","getUserService","userIds","onPopupClose","$emit","prepareAdditionalUsers","firstViewerId","lastMessageViews","firstViewer","userService","USERS_TO_SHOW","SHOW_USERS_DELAY","ReactionItem","counter","Array","selected","animate","showAdditionalUsers","showUsers","userLimitIsNotReached","weHaveUsersData","length","preparedUsers","sort","a","b","reverse","reactionClass","reactionCssClass","mounted","playAnimation","animation","Lottie","loadAnimation","animationData","ReactionsSelect","getLottieAnimation","container","$refs","reactionIcon","loop","autoplay","renderer","rendererSettings","viewBoxOnly","Event","bind","destroy","play","startShowUsersTimer","showUsersTimeout","setTimeout","clearShowUsersTimer","clearTimeout","onClick","animateItemFunction","_store$1","_restClient$1","ReactionService","setReaction","dispatch","imV2ChatMessageReactionAdd","removeReaction","imV2ChatMessageReactionDelete","ReactionList","Reaction","reactionType","reactionsData","reactionCounters","_this$reactionsData$r","_this$reactionsData","ownReactions","_this$reactionsData$o","_this$reactionsData2","Set","showReactionsContainer","keys","EventEmitter","emit","EventType","scrollToBottom","chatId","threshold","DialogScrollThreshold","nearTheBottom","onReactionSelect","event","_this$ownReactions","has","getReactionService","getReactionUsers","reactionUsers","reactionService","SHOW_DELAY","HIDE_DELAY","chatTypesWithReactionDisabled","copilot","ReactionSelector","ownReactionSet","size","isGuest","role","UserRole","guest","isBot","bot","canSetReactions","Type","isNumber","areReactionsDisabledForType","startShowTimer","_this$selector","clearHideTimer","selector","isShown","showTimeout","showSelector","clearShowTimer","startHideTimer","position","subscribeToSelectorEvents","subscribe","selectEvent","_this$selector2","getData","hide","hideTimeout","_this$selector3","onIconClick","currentReaction","like","DefaultMessageContent$$1","Reactions","withMessageStatus","withText","withAttach","formattedText","Parser","decodeMessage","AuthorTitle","ChatTitle","isSystemMessage","isUserChat","isBotWithFakeAuthorNames","isSupportBot","isNetworkBot","showTitle","authorDialogId","toString","onAuthorNameClick","parseInt","textarea","insertMention","mentionText","mentionReplacement","Utils","text","getMentionBbCode","ContextMenu","menuIsActiveForId","menuTitle","platform","isMac","messageItem","messageHasError","onMenuClick","key","isCombination","insertText","Quote","prepareQuoteText","withNewLine","replace","isCmdOrCtrl","replyMessage","onClickMessageContextMenu","_isOwnMessage","_hasError","_retrySend","_retrySendMessage","RetryContextMenu","BaseMenu","super","_retrySendMessage2","_retrySend2","_hasError2","_isOwnMessage2","getMenuItems","getRetryItem","getDeleteItem","onclick","menuInstance","close","phrase","html","messageService","MessageService","context","deleteMessage","hasFiles","files","SendingService","retrySendMessage","tempMessageId","RetryButton","contextMenu","openMenu","currentTarget","MessageHeader","withTitle","forwardAuthorId","forward","forwardContextId","isForwarded","forwardAuthorName","forwardAuthorTitle","prefix","split","code","onForwardClick","contextCode","getContextCodeFromForwardId","goToMessageContext","DefaultMessageContent","Message","Lib","Vue3","UI","Ui","Components","Elements","Application","Provider","Service","Const"],"sources":["registry.bundle.js"],"mappings":"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"}
/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_popup,ui_dialogs_messagebox,im_v2_lib_channel,im_v2_application_core,im_v2_const,main_core) {
	'use strict';

	const MESSENGER_CLASS = 'bx-im-messenger__scope';
	const CONTAINER_CLASS = 'im-confirm-container';
	const CONTAINER_MIN_HEIGHT = 110;
	class ChatConfirm extends ui_dialogs_messagebox.MessageBox {
	  // noinspection JSCheckFunctionSignatures
	  getPopupWindow() {
	    const popup = super.getPopupWindow();
	    main_core.Dom.addClass(popup.getPopupContainer(), MESSENGER_CLASS);
	    main_core.Dom.addClass(popup.getPopupContainer(), CONTAINER_CLASS);
	    main_core.Dom.style(popup.getPopupContainer(), 'minHeight', `${CONTAINER_MIN_HEIGHT}px`);
	    return super.getPopupWindow();
	  }
	}

	const showTwoButtonConfirm = params => {
	  const {
	    text = '',
	    firstButtonCaption = '',
	    secondButtonCaption = '',
	    title = ''
	  } = params;
	  return new Promise(resolve => {
	    const options = {
	      message: text,
	      modal: true,
	      buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
	      popupOptions: {
	        closeByEsc: true
	      },
	      onYes: messageBox => {
	        resolve(true);
	        messageBox.close();
	      },
	      onCancel: messageBox => {
	        resolve(false);
	        messageBox.close();
	      }
	    };
	    if (main_core.Type.isStringFilled(title)) {
	      options.title = title;
	    }
	    if (main_core.Type.isStringFilled(firstButtonCaption)) {
	      options.yesCaption = firstButtonCaption;
	    }
	    if (main_core.Type.isStringFilled(secondButtonCaption)) {
	      options.cancelCaption = secondButtonCaption;
	    }
	    ChatConfirm.show(options);
	  });
	};
	const showSingleButtonConfirm = params => {
	  const {
	    text,
	    firstButtonCaption = '',
	    title = ''
	  } = params;
	  return new Promise(resolve => {
	    const options = {
	      message: text,
	      modal: true,
	      buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
	      onOk: messageBox => {
	        resolve(true);
	        messageBox.close();
	      }
	    };
	    if (main_core.Type.isStringFilled(title)) {
	      options.title = title;
	    }
	    if (main_core.Type.isStringFilled(firstButtonCaption)) {
	      options.okCaption = firstButtonCaption;
	    }
	    ChatConfirm.show(options);
	  });
	};

	const showDeleteChatConfirm = dialogId => {
	  const {
	    title,
	    text,
	    firstButtonCaption
	  } = getPhrases(dialogId);
	  return showTwoButtonConfirm({
	    title,
	    text,
	    firstButtonCaption
	  });
	};
	const getPhrases = dialogId => {
	  const isChannel = im_v2_lib_channel.ChannelManager.isChannel(dialogId);
	  if (isChannel) {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHANNEL_TITLE'),
	      text: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHANNEL_TEXT'),
	      firstButtonCaption: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHAT_TEXT_CONFIRM')
	    };
	  }
	  if (isCollab(dialogId)) {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_CONFIRM_DELETE_COLLAB_TITLE'),
	      text: main_core.Loc.getMessage('IM_LIB_CONFIRM_DELETE_COLLAB_TEXT'),
	      firstButtonCaption: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHAT_TEXT_CONFIRM')
	    };
	  }
	  return {
	    title: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHAT_TITLE'),
	    text: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHAT_TEXT'),
	    firstButtonCaption: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHAT_TEXT_CONFIRM')
	  };
	};
	const isCollab = dialogId => {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  return chat.type === im_v2_const.ChatType.collab;
	};

	const showLeaveChatConfirm = dialogId => {
	  const {
	    title,
	    text,
	    firstButtonCaption
	  } = getPhrases$1(dialogId);
	  return showTwoButtonConfirm({
	    text,
	    title,
	    firstButtonCaption
	  });
	};
	const getPhrases$1 = dialogId => {
	  if (isCollab$1(dialogId)) {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_CONFIRM_LEAVE_COLLAB_TITLE'),
	      text: main_core.Loc.getMessage('IM_LIB_CONFIRM_LEAVE_COLLAB_TEXT'),
	      firstButtonCaption: main_core.Loc.getMessage('IM_LIB_CONFIRM_LEAVE_CHAT_YES_MSGVER_1')
	    };
	  }
	  if (im_v2_lib_channel.ChannelManager.isChannel(dialogId)) {
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_CONFIRM_LEAVE_CHANNEL_TEXT'),
	      firstButtonCaption: main_core.Loc.getMessage('IM_LIB_CONFIRM_LEAVE_CHANNEL_YES')
	    };
	  }
	  return {
	    text: main_core.Loc.getMessage('IM_LIB_CONFIRM_LEAVE_CHAT_MSGVER_1'),
	    firstButtonCaption: main_core.Loc.getMessage('IM_LIB_CONFIRM_LEAVE_CHAT_YES_MSGVER_1')
	  };
	};
	const isCollab$1 = dialogId => {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  return chat.type === im_v2_const.ChatType.collab;
	};

	const showExitUpdateChatConfirm = dialogId => {
	  const {
	    title,
	    firstButtonCaption
	  } = getPhrases$2(dialogId);
	  return showTwoButtonConfirm({
	    title,
	    firstButtonCaption
	  });
	};
	const getPhrases$2 = dialogId => {
	  const isChannel = im_v2_lib_channel.ChannelManager.isChannel(dialogId);
	  if (isChannel) {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_EXIT_UPDATE_CHANNEL_TITLE'),
	      firstButtonCaption: main_core.Loc.getMessage('IM_LIB_EXIT_UPDATE_CHAT_TEXT_CONFIRM')
	    };
	  }
	  return {
	    title: main_core.Loc.getMessage('IM_LIB_EXIT_UPDATE_CHAT_TITLE'),
	    firstButtonCaption: main_core.Loc.getMessage('IM_LIB_EXIT_UPDATE_CHAT_TEXT_CONFIRM')
	  };
	};

	const showDesktopConfirm = () => {
	  const restartText = main_core.Loc.getMessage('IM_LIB_CONFIRM_RESTART_DESKTOP');
	  const okText = main_core.Loc.getMessage('IM_LIB_CONFIRM_RESTART_DESKTOP_OK');
	  return showSingleButtonConfirm({
	    text: restartText,
	    firstButtonCaption: okText
	  });
	};
	const showDesktopRestartConfirm = () => {
	  const restartText = main_core.Loc.getMessage('IM_LIB_CONFIRM_RESTART_DESKTOP');
	  const restartCaption = main_core.Loc.getMessage('IM_LIB_CONFIRM_RESTART_DESKTOP_RESTART');
	  const laterCaption = main_core.Loc.getMessage('IM_LIB_CONFIRM_RESTART_DESKTOP_LATER');
	  return showTwoButtonConfirm({
	    text: restartText,
	    firstButtonCaption: restartCaption,
	    secondButtonCaption: laterCaption
	  });
	};
	const showDesktopDeleteConfirm = () => {
	  const deleteText = main_core.Loc.getMessage('IM_LIB_CONFIRM_DELETE_DESKTOP').replace('#BR#', '<br>');
	  const confirmCaption = main_core.Loc.getMessage('IM_LIB_CONFIRM_DELETE_DESKTOP_CONFIRM');
	  return showTwoButtonConfirm({
	    text: deleteText,
	    firstButtonCaption: confirmCaption
	  });
	};

	const showDeleteChannelPostConfirm = () => {
	  return showTwoButtonConfirm({
	    title: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHANNEL_POST_TITLE'),
	    text: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHANNEL_POST_TEXT'),
	    firstButtonCaption: main_core.Loc.getMessage('IM_LIB_EXIT_DELETE_CHANNEL_POST_TEXT_CONFIRM')
	  });
	};
	const showDeleteMessagesConfirm = title => {
	  return showTwoButtonConfirm({
	    title,
	    firstButtonCaption: main_core.Loc.getMessage('IM_LIB_CONFIRM_DELETE_MESSAGES_TITLE')
	  });
	};

	var assets = [{
	  id: "10",
	  layers: [{
	    ind: 9,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [4, 4]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [8, 8]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[0, 0.71], [0.71, 0], [6, 5.29], [5.29, 6]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.93, 0.93, 0.94, 1]
	          },
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[5.29, 0], [6, 0.71], [0.71, 6], [0, 5.29]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.93, 0.93, 0.94, 1]
	          },
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "22",
	  layers: [{
	    ind: 19,
	    ty: 4,
	    parent: 18,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [34.5, 9.5]
	      },
	      r: {
	        a: 0,
	        k: 3
	      },
	      s: {
	        a: 0,
	        k: [69, 19]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.098, 0.494, 0.898]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 18,
	    ty: 3,
	    parent: 17,
	    ks: {
	      p: {
	        a: 0,
	        k: [1, 1]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 21,
	    ty: 4,
	    parent: 20,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [35.5, 10.5]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [73, 23]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [35.5, 10.5]
	        },
	        r: {
	          a: 0,
	          k: 4
	        },
	        s: {
	          a: 0,
	          k: [71, 21]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [1, 1, 1]
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }, {
	        ty: "st",
	        c: {
	          a: 0,
	          k: [0.098, 0.494, 0.898]
	        },
	        lc: 2,
	        lj: 1,
	        ml: 10,
	        o: {
	          a: 0,
	          k: 100
	        },
	        w: {
	          a: 0,
	          k: 2
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 20,
	    ty: 3,
	    parent: 17,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 17,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [1, 1]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "28",
	  layers: [{
	    ind: 24,
	    ty: 0,
	    parent: 16,
	    ks: {
	      a: {
	        a: 0,
	        k: [36.5, 11.5]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [0],
	          h: 1
	        }, {
	          t: 93.6,
	          s: [0],
	          i: {
	            x: 0,
	            y: 1
	          },
	          o: {
	            x: 0,
	            y: 0
	          }
	        }, {
	          t: 123.6,
	          s: [100],
	          h: 1
	        }, {
	          t: 217.8,
	          s: [100],
	          h: 1
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [35.5, 14.7],
	          i: {
	            x: [1, 1],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 93.6,
	          s: [35.5, 14.7],
	          i: {
	            x: [1, 0],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 123.6,
	          s: [35.5, 10.5],
	          i: {
	            x: [1, 1],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 217.8,
	          s: [35.5, 10.5],
	          h: 1
	        }]
	      },
	      s: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [110, 110],
	          i: {
	            x: [1, 1],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 114.6,
	          s: [110, 110],
	          i: {
	            x: [0, 0],
	            y: [1, 1]
	          },
	          o: {
	            x: [0.5, 0.5],
	            y: [0, 0]
	          }
	        }, {
	          t: 153.6,
	          s: [100, 100],
	          i: {
	            x: [1, 1],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 217.8,
	          s: [100, 100],
	          h: 1
	        }]
	      }
	    },
	    w: 73,
	    h: 23,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "22"
	  }, {
	    ind: 16,
	    ty: 3,
	    parent: 15,
	    ks: {
	      p: {
	        a: 0,
	        k: [106, 0]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 27,
	    ty: 4,
	    td: 1,
	    parent: 25,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [34.5, 9.5]
	      },
	      r: {
	        a: 0,
	        k: 4
	      },
	      s: {
	        a: 0,
	        k: [69, 19]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 26,
	    ty: 4,
	    tt: 1,
	    parent: 25,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [34.5, 9.5]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [71, 21]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [34.5, 9.5]
	        },
	        r: {
	          a: 0,
	          k: 4
	        },
	        s: {
	          a: 0,
	          k: [69, 19]
	        }
	      }, {
	        ty: "st",
	        c: {
	          a: 0,
	          k: [0.929, 0.933, 0.941]
	        },
	        lc: 2,
	        lj: 1,
	        ml: 10,
	        o: {
	          a: 0,
	          k: 100
	        },
	        w: {
	          a: 0,
	          k: 2
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 25,
	    ty: 3,
	    parent: 15,
	    ks: {
	      p: {
	        a: 0,
	        k: [0, 1]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 15,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [5, 3]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "42",
	  layers: [{
	    ind: 39,
	    ty: 4,
	    parent: 38,
	    ks: {},
	    ef: [{
	      ty: 25,
	      ef: [{
	        ty: 2,
	        nm: "Shadow Color",
	        v: {
	          a: 0,
	          k: [0, 0, 0]
	        }
	      }, {
	        ty: 0,
	        nm: "Opacity",
	        v: {
	          a: 0,
	          k: 81
	        }
	      }, {
	        ty: 1,
	        nm: "Direction",
	        v: {
	          a: 0,
	          k: 180
	        }
	      }, {
	        ty: 0,
	        nm: "Distance",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [2],
	            h: 1
	          }, {
	            t: 30,
	            s: [2],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [1.183],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [1.058],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [1],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [1],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [1.058],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [1.183],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [1.334],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [2],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [2],
	            h: 1
	          }]
	        }
	      }, {
	        ty: 0,
	        nm: "Softness",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [4],
	            h: 1
	          }, {
	            t: 30,
	            s: [4],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [2.37],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [2.12],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [2],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [2],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [2.12],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [2.37],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [2.67],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [4],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [4],
	            h: 1
	          }]
	        }
	      }]
	    }],
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [3, 3]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [18, 18]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "el",
	        p: {
	          a: 0,
	          k: [3, 3]
	        },
	        s: {
	          a: 0,
	          k: [6, 6]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [1, 1, 1]
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 38,
	    ty: 3,
	    parent: 37,
	    ks: {
	      p: {
	        a: 0,
	        k: [5, 5]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 41,
	    ty: 4,
	    parent: 40,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.098, 0.494, 0.898]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 40,
	    ty: 3,
	    parent: 37,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 37,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [7, 7]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "74",
	  layers: [{
	    ind: 64,
	    ty: 4,
	    td: 1,
	    parent: 62,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 63,
	    ty: 4,
	    tt: 1,
	    parent: 62,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [8, 8]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [18, 18]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "el",
	        p: {
	          a: 0,
	          k: [8, 8]
	        },
	        s: {
	          a: 0,
	          k: [16, 16]
	        }
	      }, {
	        ty: "st",
	        c: {
	          a: 0,
	          k: [0.584, 0.612, 0.643]
	        },
	        lc: 2,
	        lj: 1,
	        ml: 10,
	        o: {
	          a: 0,
	          k: 100
	        },
	        w: {
	          a: 0,
	          k: 2
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 65,
	    ty: 4,
	    parent: 62,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [1, 1, 1]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 62,
	    ty: 3,
	    parent: 61,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 61,
	    ty: 3,
	    parent: 60,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 67,
	    ty: 4,
	    parent: 66,
	    ks: {},
	    ef: [{
	      ty: 25,
	      ef: [{
	        ty: 2,
	        nm: "Shadow Color",
	        v: {
	          a: 0,
	          k: [0, 0, 0]
	        }
	      }, {
	        ty: 0,
	        nm: "Opacity",
	        v: {
	          a: 0,
	          k: 81
	        }
	      }, {
	        ty: 1,
	        nm: "Direction",
	        v: {
	          a: 0,
	          k: 180
	        }
	      }, {
	        ty: 0,
	        nm: "Distance",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [2],
	            h: 1
	          }, {
	            t: 30,
	            s: [2],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [1.183],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [1.058],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [1],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [1],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [1.058],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [1.183],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [1.334],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [2],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [2],
	            h: 1
	          }]
	        }
	      }, {
	        ty: 0,
	        nm: "Softness",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [4],
	            h: 1
	          }, {
	            t: 30,
	            s: [4],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [2.37],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [2.12],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [2],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [2],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [2.12],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [2.37],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [2.67],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [4],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [4],
	            h: 1
	          }]
	        }
	      }]
	    }],
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [3, 3]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [18, 18]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "el",
	        p: {
	          a: 0,
	          k: [3, 3]
	        },
	        s: {
	          a: 0,
	          k: [6, 6]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [1, 1, 1]
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 66,
	    ty: 3,
	    parent: 60,
	    ks: {
	      p: {
	        a: 0,
	        k: [5, 5]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 69,
	    ty: 4,
	    parent: 68,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.098, 0.494, 0.898]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 68,
	    ty: 3,
	    parent: 60,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 60,
	    ty: 3,
	    parent: 59,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 72,
	    ty: 4,
	    td: 1,
	    parent: 70,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 71,
	    ty: 4,
	    tt: 1,
	    parent: 70,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [8, 8]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [18, 18]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "el",
	        p: {
	          a: 0,
	          k: [8, 8]
	        },
	        s: {
	          a: 0,
	          k: [16, 16]
	        }
	      }, {
	        ty: "st",
	        c: {
	          a: 0,
	          k: [0.584, 0.612, 0.643]
	        },
	        lc: 2,
	        lj: 1,
	        ml: 10,
	        o: {
	          a: 0,
	          k: 100
	        },
	        w: {
	          a: 0,
	          k: 2
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 73,
	    ty: 4,
	    parent: 70,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [1, 1, 1]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 70,
	    ty: 3,
	    parent: 59,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 59,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [7, 7]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "87",
	  layers: [{
	    ind: 35,
	    ty: 4,
	    parent: 34,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [62, 2]
	      },
	      r: {
	        a: 0,
	        k: 10
	      },
	      s: {
	        a: 0,
	        k: [124, 4]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.322, 0.361, 0.412, 0.102]
	      },
	      o: {
	        a: 0,
	        k: 10.2
	      }
	    }]
	  }, {
	    ind: 34,
	    ty: 3,
	    parent: 33,
	    ks: {
	      p: {
	        a: 0,
	        k: [24, 6]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 44,
	    ty: 0,
	    parent: 36,
	    ks: {
	      a: {
	        a: 0,
	        k: [7, 7]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [100],
	          h: 1
	        }, {
	          t: 86.16,
	          s: [100],
	          i: {
	            x: 1,
	            y: 1
	          },
	          o: {
	            x: 0,
	            y: 0
	          }
	        }, {
	          t: 109.86,
	          s: [0],
	          h: 1
	        }, {
	          t: 217.8,
	          s: [0],
	          h: 1
	        }]
	      }
	    },
	    w: 24,
	    h: 24,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "42"
	  }, {
	    ind: 36,
	    ty: 3,
	    parent: 33,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 49,
	    ty: 4,
	    td: 1,
	    parent: 47,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 48,
	    ty: 4,
	    tt: 1,
	    parent: 47,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [8, 8]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [18, 18]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "el",
	        p: {
	          a: 0,
	          k: [8, 8]
	        },
	        s: {
	          a: 0,
	          k: [16, 16]
	        }
	      }, {
	        ty: "st",
	        c: {
	          a: 0,
	          k: [0.584, 0.612, 0.643]
	        },
	        lc: 2,
	        lj: 1,
	        ml: 10,
	        o: {
	          a: 0,
	          k: 100
	        },
	        w: {
	          a: 0,
	          k: 2
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 50,
	    ty: 4,
	    parent: 47,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [1, 1, 1]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 47,
	    ty: 3,
	    parent: 46,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 46,
	    ty: 3,
	    parent: 45,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 52,
	    ty: 4,
	    parent: 51,
	    ks: {},
	    ef: [{
	      ty: 25,
	      ef: [{
	        ty: 2,
	        nm: "Shadow Color",
	        v: {
	          a: 0,
	          k: [0, 0, 0]
	        }
	      }, {
	        ty: 0,
	        nm: "Opacity",
	        v: {
	          a: 0,
	          k: 81
	        }
	      }, {
	        ty: 1,
	        nm: "Direction",
	        v: {
	          a: 0,
	          k: 180
	        }
	      }, {
	        ty: 0,
	        nm: "Distance",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [2],
	            h: 1
	          }, {
	            t: 30,
	            s: [2],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [1.183],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [1.058],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [1],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [1],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [1.058],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [1.183],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [1.334],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [2],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [2],
	            h: 1
	          }]
	        }
	      }, {
	        ty: 0,
	        nm: "Softness",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [4],
	            h: 1
	          }, {
	            t: 30,
	            s: [4],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [2.37],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [2.12],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [2],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [2],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [2.12],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [2.37],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [2.67],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [4],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [4],
	            h: 1
	          }]
	        }
	      }]
	    }],
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [3, 3]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [18, 18]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "el",
	        p: {
	          a: 0,
	          k: [3, 3]
	        },
	        s: {
	          a: 0,
	          k: [6, 6]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [1, 1, 1]
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 51,
	    ty: 3,
	    parent: 45,
	    ks: {
	      p: {
	        a: 0,
	        k: [5, 5]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 54,
	    ty: 4,
	    parent: 53,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.098, 0.494, 0.898]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 53,
	    ty: 3,
	    parent: 45,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 45,
	    ty: 3,
	    parent: 33,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 33,
	    ty: 3,
	    parent: 32,
	    ks: {
	      p: {
	        a: 0,
	        k: [0, 20]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 57,
	    ty: 4,
	    parent: 56,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [32.5, 2]
	      },
	      r: {
	        a: 0,
	        k: 10
	      },
	      s: {
	        a: 0,
	        k: [65, 4]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.322, 0.361, 0.412, 0.102]
	      },
	      o: {
	        a: 0,
	        k: 10.2
	      }
	    }]
	  }, {
	    ind: 56,
	    ty: 3,
	    parent: 55,
	    ks: {
	      p: {
	        a: 0,
	        k: [24, 6]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 76,
	    ty: 0,
	    parent: 58,
	    ks: {
	      a: {
	        a: 0,
	        k: [7, 7]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [100],
	          h: 1
	        }, {
	          t: 86.46,
	          s: [100],
	          i: {
	            x: 1,
	            y: 1
	          },
	          o: {
	            x: 0,
	            y: 0
	          }
	        }, {
	          t: 110.16,
	          s: [0],
	          h: 1
	        }, {
	          t: 217.8,
	          s: [0],
	          h: 1
	        }]
	      }
	    },
	    w: 24,
	    h: 24,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "74"
	  }, {
	    ind: 58,
	    ty: 3,
	    parent: 55,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 80,
	    ty: 4,
	    parent: 79,
	    ks: {},
	    ef: [{
	      ty: 25,
	      ef: [{
	        ty: 2,
	        nm: "Shadow Color",
	        v: {
	          a: 0,
	          k: [0, 0, 0]
	        }
	      }, {
	        ty: 0,
	        nm: "Opacity",
	        v: {
	          a: 0,
	          k: 81
	        }
	      }, {
	        ty: 1,
	        nm: "Direction",
	        v: {
	          a: 0,
	          k: 180
	        }
	      }, {
	        ty: 0,
	        nm: "Distance",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [2],
	            h: 1
	          }, {
	            t: 30,
	            s: [2],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [1.183],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [1.058],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [1],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [1],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [1.058],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [1.183],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [1.334],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [2],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [2],
	            h: 1
	          }]
	        }
	      }, {
	        ty: 0,
	        nm: "Softness",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [4],
	            h: 1
	          }, {
	            t: 30,
	            s: [4],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [2.37],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [2.12],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [2],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [2],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [2.12],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [2.37],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [2.67],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [4],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [4],
	            h: 1
	          }]
	        }
	      }]
	    }],
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [3, 3]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [18, 18]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "el",
	        p: {
	          a: 0,
	          k: [3, 3]
	        },
	        s: {
	          a: 0,
	          k: [6, 6]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [1, 1, 1]
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 79,
	    ty: 3,
	    parent: 78,
	    ks: {
	      p: {
	        a: 0,
	        k: [5, 5]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 82,
	    ty: 4,
	    parent: 81,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.098, 0.494, 0.898]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 81,
	    ty: 3,
	    parent: 78,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 78,
	    ty: 3,
	    parent: 77,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 85,
	    ty: 4,
	    td: 1,
	    parent: 83,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 84,
	    ty: 4,
	    tt: 1,
	    parent: 83,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [8, 8]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [18, 18]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "el",
	        p: {
	          a: 0,
	          k: [8, 8]
	        },
	        s: {
	          a: 0,
	          k: [16, 16]
	        }
	      }, {
	        ty: "st",
	        c: {
	          a: 0,
	          k: [0.584, 0.612, 0.643]
	        },
	        lc: 2,
	        lj: 1,
	        ml: 10,
	        o: {
	          a: 0,
	          k: 100
	        },
	        w: {
	          a: 0,
	          k: 2
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 86,
	    ty: 4,
	    parent: 83,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "el",
	      p: {
	        a: 0,
	        k: [8, 8]
	      },
	      s: {
	        a: 0,
	        k: [16, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [1, 1, 1]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 83,
	    ty: 3,
	    parent: 77,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 77,
	    ty: 3,
	    parent: 55,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 55,
	    ty: 3,
	    parent: 32,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 32,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [7, 7]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "94",
	  layers: [{
	    ind: 93,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [19, 2]
	      },
	      r: {
	        a: 0,
	        k: 10
	      },
	      s: {
	        a: 0,
	        k: [38, 4]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.741, 0.757, 0.776]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }]
	}, {
	  id: "97",
	  layers: [{
	    ind: 92,
	    ty: 4,
	    parent: 91,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [50, 2]
	      },
	      r: {
	        a: 0,
	        k: 10
	      },
	      s: {
	        a: 0,
	        k: [100, 4]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.322, 0.361, 0.412, 0.102]
	      },
	      o: {
	        a: 0,
	        k: 10.2
	      }
	    }]
	  }, {
	    ind: 91,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [0, 8]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 96,
	    ty: 0,
	    ks: {
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    w: 38,
	    h: 4,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "94"
	  }]
	}, {
	  id: "101",
	  layers: [{
	    ind: 12,
	    ty: 0,
	    parent: 8,
	    ks: {},
	    w: 8,
	    h: 8,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "10"
	  }, {
	    ind: 8,
	    ty: 3,
	    parent: 7,
	    ks: {
	      p: {
	        a: 0,
	        k: [8, 8]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 7,
	    ty: 3,
	    parent: 6,
	    ks: {
	      p: {
	        a: 0,
	        k: [172, 3]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 30,
	    ty: 0,
	    parent: 14,
	    ks: {
	      a: {
	        a: 0,
	        k: [5, 3]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [0],
	          h: 1
	        }, {
	          t: 39.6,
	          s: [0],
	          i: {
	            x: 1,
	            y: 1
	          },
	          o: {
	            x: 0,
	            y: 0
	          }
	        }, {
	          t: 87.6,
	          s: [100],
	          h: 1
	        }, {
	          t: 217.8,
	          s: [100],
	          h: 1
	        }]
	      }
	    },
	    w: 187,
	    h: 31,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "28"
	  }, {
	    ind: 14,
	    ty: 3,
	    parent: 13,
	    ks: {
	      p: {
	        a: 0,
	        k: [0, 88]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 89,
	    ty: 0,
	    parent: 31,
	    ks: {
	      a: {
	        a: 0,
	        k: [7, 7]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [0],
	          h: 1
	        }, {
	          t: 39.6,
	          s: [0],
	          i: {
	            x: 1,
	            y: 1
	          },
	          o: {
	            x: 0,
	            y: 0
	          }
	        }, {
	          t: 93.6,
	          s: [100],
	          h: 1
	        }, {
	          t: 217.8,
	          s: [100],
	          h: 1
	        }]
	      }
	    },
	    w: 155,
	    h: 51,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "87"
	  }, {
	    ind: 31,
	    ty: 3,
	    parent: 13,
	    ks: {
	      p: {
	        a: 0,
	        k: [0, 32]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 99,
	    ty: 0,
	    parent: 90,
	    ks: {
	      o: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [0],
	          h: 1
	        }, {
	          t: 39.6,
	          s: [0],
	          i: {
	            x: 1,
	            y: 1
	          },
	          o: {
	            x: 0,
	            y: 0
	          }
	        }, {
	          t: 87.6,
	          s: [100],
	          h: 1
	        }, {
	          t: 217.8,
	          s: [100],
	          h: 1
	        }]
	      }
	    },
	    w: 100,
	    h: 12,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "97"
	  }, {
	    ind: 90,
	    ty: 3,
	    parent: 13,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 13,
	    ty: 3,
	    parent: 6,
	    ks: {
	      p: {
	        a: 0,
	        k: [16, 16]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 100,
	    ty: 4,
	    parent: 6,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [100, 70.5]
	      },
	      r: {
	        a: 0,
	        k: 4
	      },
	      s: {
	        a: 0,
	        k: [200, 141]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [1, 1, 1]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 6,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [7, 7]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "105",
	  layers: [{
	    ind: 103,
	    ty: 0,
	    ks: {
	      a: {
	        a: 0,
	        k: [7, 7]
	      },
	      p: {
	        a: 0,
	        k: [59, 59]
	      }
	    },
	    w: 210,
	    h: 148,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "101"
	  }, {
	    ind: 104,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [160.325, 129.5]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [320.65, 259]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }]
	}, {
	  id: "108",
	  layers: [{
	    ind: 107,
	    ty: 0,
	    parent: 5,
	    ks: {
	      p: {
	        a: 0,
	        k: [-59, -59]
	      }
	    },
	    ef: [{
	      ty: 25,
	      ef: [{
	        ty: 2,
	        nm: "Shadow Color",
	        v: {
	          a: 0,
	          k: [0, 0, 0]
	        }
	      }, {
	        ty: 0,
	        nm: "Opacity",
	        v: {
	          a: 0,
	          k: 20
	        }
	      }, {
	        ty: 1,
	        nm: "Direction",
	        v: {
	          a: 0,
	          k: 180
	        }
	      }, {
	        ty: 0,
	        nm: "Distance",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [4],
	            h: 1
	          }, {
	            t: 30,
	            s: [4],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [2.366],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [2.117],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [2],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [2],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [2.117],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [2.366],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [2.669],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [4],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [4],
	            h: 1
	          }]
	        }
	      }, {
	        ty: 0,
	        nm: "Softness",
	        v: {
	          a: 1,
	          k: [{
	            t: 0,
	            s: [48],
	            h: 1
	          }, {
	            t: 30,
	            s: [48],
	            i: {
	              x: 0.264,
	              y: 0.814
	            },
	            o: {
	              x: 0.025,
	              y: 0.49
	            }
	          }, {
	            t: 35.85,
	            s: [28.39],
	            i: {
	              x: 0.627,
	              y: 0.782
	            },
	            o: {
	              x: 0.286,
	              y: 0.474
	            }
	          }, {
	            t: 41.7,
	            s: [25.4],
	            i: {
	              x: 0.504,
	              y: 0.999
	            },
	            o: {
	              x: 0.192,
	              y: 0.479
	            }
	          }, {
	            t: 53.4,
	            s: [24],
	            h: 1
	          }, {
	            t: 153.6,
	            s: [24],
	            i: {
	              x: 0.806,
	              y: 0.515
	            },
	            o: {
	              x: 0.494,
	              y: 0.001
	            }
	          }, {
	            t: 177.6,
	            s: [25.4],
	            i: {
	              x: 0.715,
	              y: 0.528
	            },
	            o: {
	              x: 0.375,
	              y: 0.22
	            }
	          }, {
	            t: 189.6,
	            s: [28.39],
	            i: {
	              x: 0.675,
	              y: 0.522
	            },
	            o: {
	              x: 0.307,
	              y: 0.21
	            }
	          }, {
	            t: 195.6,
	            s: [32.02],
	            i: {
	              x: 0.965,
	              y: 0.589
	            },
	            o: {
	              x: 0.735,
	              y: 0.246
	            }
	          }, {
	            t: 201.6,
	            s: [48],
	            h: 1
	          }, {
	            t: 217.8,
	            s: [48],
	            h: 1
	          }]
	        }
	      }]
	    }],
	    w: 320.65,
	    h: 259,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "105"
	  }, {
	    ind: 5,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [60, 60]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "111",
	  layers: [{
	    ind: 110,
	    ty: 0,
	    parent: 4,
	    ks: {
	      a: {
	        a: 0,
	        k: [160, 130.5]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [0],
	          h: 1
	        }, {
	          t: 30,
	          s: [0],
	          i: {
	            x: 0,
	            y: 1
	          },
	          o: {
	            x: 0,
	            y: 0
	          }
	        }, {
	          t: 53.4,
	          s: [100],
	          h: 1
	        }, {
	          t: 217.8,
	          s: [100],
	          h: 1
	        }]
	      },
	      p: {
	        a: 0,
	        k: [100, 70.5]
	      },
	      s: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [50, 50],
	          i: {
	            x: [1, 1],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 30,
	          s: [50, 50],
	          i: {
	            x: [0, 0],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 53.4,
	          s: [100, 100],
	          i: {
	            x: [1, 1],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 217.8,
	          s: [100, 100],
	          h: 1
	        }]
	      }
	    },
	    w: 322,
	    h: 260,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "108"
	  }, {
	    ind: 4,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [60, 60]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "118",
	  layers: [{
	    ind: 117,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [7, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [14, 14]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "gr",
	          it: [{
	            ty: "sh",
	            ks: {
	              a: 0,
	              k: {
	                c: true,
	                i: [[0, 0], [-1.86, -1.86], [-1.86, 1.86], [-0.06, 0.06], [0, 0], [0.06, -0.06], [1.29, 1.29], [-1.29, 1.29], [-1.29, -1.29], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [1.86, -1.86]],
	                o: [[-1.86, 1.86], [1.86, 1.86], [0.06, -0.06], [0, 0], [-0.05, 0.07], [-1.29, 1.29], [-1.29, -1.29], [1.29, -1.29], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-1.86, -1.86], [0, 0]],
	                v: [[1.94, 1.88], [1.94, 8.62], [8.68, 8.62], [8.86, 8.43], [7.82, 7.39], [7.64, 7.59], [2.97, 7.59], [2.97, 2.91], [7.64, 2.91], [7.7, 2.97], [6.31, 4.36], [9.95, 4.36], [9.95, 0.71], [8.73, 1.94], [8.68, 1.88], [1.94, 1.88]]
	              }
	            }
	          }, {
	            ty: "fl",
	            c: {
	              a: 0,
	              k: [0.32, 0.36, 0.41, 1]
	            },
	            r: 2,
	            o: {
	              a: 0,
	              k: 10
	            }
	          }, {
	            ty: "tr",
	            o: {
	              a: 0,
	              k: 100
	            }
	          }]
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "124",
	  layers: [{
	    ind: 123,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [6, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [12, 14]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[3.35, 1.71], [6.18, 4.54], [0.13, 4.54], [0.13, 5.96], [6.18, 5.96], [3.35, 8.79], [4.35, 9.79], [8.88, 5.25], [4.35, 0.71]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.32, 0.36, 0.41, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 10
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "130",
	  layers: [{
	    ind: 129,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [6.5, 7.5]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [13, 15]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[5.66, 8.79], [2.83, 5.96], [8.88, 5.96], [8.88, 4.54], [2.83, 4.54], [5.66, 1.71], [4.66, 0.71], [0.13, 5.25], [4.66, 9.79]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.32, 0.36, 0.41, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 10
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "140",
	  layers: [{
	    ind: 139,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [2.5, 2.5]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [5, 5]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [-0.18, -0.18], [0, 0], [0, 0], [-0.18, -0.18], [-0.18, 0.18], [0, 0], [0, 0], [-0.18, 0.18], [0.18, 0.18], [0, 0], [0, 0], [0.18, 0.18], [0.18, -0.18], [0, 0], [0, 0], [0.18, -0.18]],
	              o: [[-0.18, 0.18], [0, 0], [0, 0], [-0.18, 0.18], [0.18, 0.18], [0, 0], [0, 0], [0.18, 0.18], [0.18, -0.18], [0, 0], [0, 0], [0.18, -0.18], [-0.18, -0.18], [0, 0], [0, 0], [-0.18, -0.18], [0, 0]],
	              v: [[0.35, 0.35], [0.35, 0.98], [1.24, 1.88], [0.35, 2.77], [0.35, 3.4], [0.98, 3.4], [1.88, 2.51], [2.77, 3.4], [3.4, 3.4], [3.4, 2.77], [2.51, 1.88], [3.4, 0.98], [3.4, 0.35], [2.77, 0.35], [1.88, 1.24], [0.98, 0.35], [0.35, 0.35]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [1, 1, 1, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "149",
	  layers: [{
	    ind: 148,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [5.5, 8]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [11, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "gr",
	          it: [{
	            ty: "sh",
	            ks: {
	              a: 0,
	              k: {
	                c: true,
	                i: [[0, 0], [-0.21, 0], [0, 0], [0, -0.21], [0, 0], [0.21, 0], [0, 0], [0, 0.21]],
	                o: [[0, -0.21], [0, 0], [0.21, 0], [0, 0], [0, 0.21], [0, 0], [-0.21, 0], [0, 0]],
	                v: [[0, 10.14], [0.38, 9.76], [7.88, 9.76], [8.25, 10.14], [8.25, 10.89], [7.88, 11.26], [0.38, 11.26], [0, 10.89]]
	              }
	            }
	          }, {
	            ty: "fl",
	            c: {
	              a: 0,
	              k: [0.32, 0.36, 0.41, 1]
	            },
	            o: {
	              a: 0,
	              k: 90
	            }
	          }, {
	            ty: "tr",
	            o: {
	              a: 0,
	              k: 100
	            }
	          }]
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "gr",
	          it: [{
	            ty: "sh",
	            ks: {
	              a: 0,
	              k: {
	                c: true,
	                i: [[0, 0], [-0.21, 0], [0, 0], [0, -0.21], [0, 0], [0, 0], [0.15, -0.14], [0, 0], [0.29, 0.26], [0, 0], [-0.21, 0], [0, 0]],
	                o: [[0, -0.21], [0, 0], [0.21, 0], [0, 0], [0, 0], [0.21, 0], [0, 0], [-0.29, 0.26], [0, 0], [-0.15, -0.14], [0, 0], [0, 0]],
	                v: [[2.96, 0.38], [3.33, 0], [4.94, 0], [5.32, 0.38], [5.32, 3.93], [7.88, 3.93], [8.03, 4.32], [4.64, 7.4], [3.63, 7.4], [0.25, 4.32], [0.4, 3.93], [2.96, 3.93]]
	              }
	            }
	          }, {
	            ty: "fl",
	            c: {
	              a: 0,
	              k: [0.32, 0.36, 0.41, 1]
	            },
	            o: {
	              a: 0,
	              k: 90
	            }
	          }, {
	            ty: "tr",
	            o: {
	              a: 0,
	              k: 100
	            }
	          }]
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "153",
	  layers: [{
	    ind: 142,
	    ty: 0,
	    parent: 138,
	    ks: {},
	    w: 5,
	    h: 5,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "140"
	  }, {
	    ind: 138,
	    ty: 3,
	    parent: 137,
	    ks: {
	      p: {
	        a: 0,
	        k: [2, 2]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 144,
	    ty: 4,
	    td: 1,
	    parent: 137,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [4.5, 4.5]
	      },
	      r: {
	        a: 0,
	        k: 2
	      },
	      s: {
	        a: 0,
	        k: [9, 9]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 143,
	    ty: 4,
	    tt: 2,
	    parent: 137,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [4.5, 4.5]
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        s: {
	          a: 0,
	          k: [11, 11]
	        }
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0, 0, 0, 0]
	        },
	        o: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      it: [{
	        ty: "rc",
	        p: {
	          a: 0,
	          k: [4.5, 4.5]
	        },
	        r: {
	          a: 0,
	          k: 2
	        },
	        s: {
	          a: 0,
	          k: [9, 9]
	        }
	      }, {
	        ty: "st",
	        c: {
	          a: 0,
	          k: [0.835, 0.843, 0.859]
	        },
	        lc: 2,
	        lj: 1,
	        ml: 10,
	        o: {
	          a: 0,
	          k: 100
	        },
	        w: {
	          a: 0,
	          k: 2
	        }
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }, {
	    ind: 145,
	    ty: 4,
	    parent: 137,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [4.5, 4.5]
	      },
	      r: {
	        a: 0,
	        k: 2
	      },
	      s: {
	        a: 0,
	        k: [9, 9]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [1, 0.341, 0.322]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 137,
	    ty: 3,
	    parent: 136,
	    ks: {
	      p: {
	        a: 0,
	        k: [17, 12]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 151,
	    ty: 0,
	    parent: 147,
	    ks: {},
	    w: 11,
	    h: 16,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "149"
	  }, {
	    ind: 147,
	    ty: 3,
	    parent: 146,
	    ks: {
	      p: {
	        a: 0,
	        k: [6, 4]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 146,
	    ty: 3,
	    parent: 136,
	    ks: {
	      p: {
	        a: 0,
	        k: [4, 0]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 152,
	    ty: 4,
	    parent: 136,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [16, 12]
	      },
	      r: {
	        a: 0,
	        k: 98
	      },
	      s: {
	        a: 0,
	        k: [32, 24]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.322, 0.361, 0.412, 0.102]
	      },
	      o: {
	        a: 0,
	        k: 10.2
	      }
	    }]
	  }, {
	    ind: 136,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [1, 1]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "156",
	  layers: [{
	    ind: 155,
	    ty: 0,
	    parent: 135,
	    ks: {
	      a: {
	        a: 0,
	        k: [17, 13]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [0],
	          i: {
	            x: 0,
	            y: 1
	          },
	          o: {
	            x: 0,
	            y: 0
	          }
	        }, {
	          t: 39,
	          s: [100],
	          h: 1
	        }, {
	          t: 217.8,
	          s: [100],
	          h: 1
	        }]
	      },
	      p: {
	        a: 0,
	        k: [16, 12]
	      },
	      s: {
	        a: 1,
	        k: [{
	          t: 0,
	          s: [50, 50],
	          i: {
	            x: [0, 0],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 39,
	          s: [100, 100],
	          i: {
	            x: [1, 1],
	            y: [1, 1]
	          },
	          o: {
	            x: [0, 0],
	            y: [0, 0]
	          }
	        }, {
	          t: 217.8,
	          s: [100, 100],
	          h: 1
	        }]
	      }
	    },
	    w: 33,
	    h: 25,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "153"
	  }, {
	    ind: 135,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [1, 1]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "162",
	  layers: [{
	    ind: 161,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [169, 15]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [338, 30]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-0.23, 0.15], [-0.39, 0], [-0.25, -0.13], [-0.14, -0.28], [0, -0.42], [0, 0], [0, 0], [0, 0], [0.2, 0.21], [0.36, 0], [0.2, -0.1], [0.11, -0.2], [0, -0.29]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.12, -0.25], [0.23, -0.15], [0.34, 0], [0.25, 0.13], [0.14, 0.27], [0, 0], [0, 0], [0, 0], [0, -0.39], [-0.2, -0.21], [-0.25, 0], [-0.19, 0.11], [-0.11, 0.2], [0, 0]],
	              v: [[11.95, 11.67], [11.95, 14.63], [11.19, 14.63], [11.19, 8.08], [11.95, 8.08], [11.95, 10.48], [12.01, 10.48], [12.53, 9.88], [13.45, 9.65], [14.33, 9.85], [14.92, 10.46], [15.13, 11.5], [15.13, 14.63], [14.38, 14.63], [14.38, 11.56], [14.07, 10.65], [13.23, 10.33], [12.57, 10.48], [12.11, 10.94], [11.95, 11.67]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[18.64, 9.71], [18.64, 10.36], [16.1, 10.36], [16.1, 9.71]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [-0.06, -0.11], [-0.1, -0.04], [-0.11, 0], [-0.05, 0.01], [-0.03, 0.01], [0, 0], [0.09, -0.02], [0.14, 0], [0.2, 0.09], [0.13, 0.19], [0, 0.29]],
	              o: [[0, 0], [0, 0], [0, 0.21], [0.06, 0.1], [0.1, 0.03], [0.08, 0], [0.05, -0.01], [0, 0], [-0.05, 0.02], [-0.09, 0.02], [-0.21, 0], [-0.2, -0.09], [-0.13, -0.19], [0, 0]],
	              v: [[16.84, 8.54], [17.59, 8.54], [17.59, 13.22], [17.69, 13.7], [17.93, 13.91], [18.25, 13.96], [18.45, 13.95], [18.58, 13.92], [18.73, 14.6], [18.52, 14.66], [18.17, 14.69], [17.54, 14.55], [17.04, 14.13], [16.84, 13.42]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[21.91, 9.71], [21.91, 10.36], [19.37, 10.36], [19.37, 9.71]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [-0.06, -0.11], [-0.1, -0.04], [-0.11, 0], [-0.05, 0.01], [-0.03, 0.01], [0, 0], [0.09, -0.02], [0.14, 0], [0.2, 0.09], [0.13, 0.19], [0, 0.29]],
	              o: [[0, 0], [0, 0], [0, 0.21], [0.06, 0.1], [0.1, 0.03], [0.08, 0], [0.05, -0.01], [0, 0], [-0.05, 0.02], [-0.09, 0.02], [-0.21, 0], [-0.2, -0.09], [-0.13, -0.19], [0, 0]],
	              v: [[20.11, 8.54], [20.86, 8.54], [20.86, 13.22], [20.96, 13.7], [21.2, 13.91], [21.52, 13.96], [21.72, 13.95], [21.85, 13.92], [22, 14.6], [21.79, 14.66], [21.44, 14.69], [20.81, 14.55], [20.31, 14.13], [20.11, 13.42]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-0.1, 0.13], [-0.18, 0.11], [-0.32, 0], [-0.32, -0.21], [-0.18, -0.38], [0, -0.52], [0.18, -0.38], [0.32, -0.21], [0.41, 0], [0.19, 0.11], [0.1, 0.13], [0.06, 0.09], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0], [0.06, -0.09], [0.1, -0.13], [0.19, -0.11], [0.41, 0], [0.31, 0.21], [0.18, 0.38], [0, 0.52], [-0.18, 0.38], [-0.31, 0.21], [-0.32, 0], [-0.19, -0.11], [-0.1, -0.14], [0, 0], [0, 0], [0, 0]],
	              v: [[23.05, 16.46], [23.05, 9.71], [23.78, 9.71], [23.78, 10.5], [23.86, 10.5], [24.09, 10.17], [24.52, 9.81], [25.29, 9.65], [26.38, 9.96], [27.12, 10.84], [27.38, 12.18], [27.12, 13.54], [26.38, 14.42], [25.3, 14.73], [24.54, 14.57], [24.1, 14.21], [23.86, 13.87], [23.8, 13.87], [23.8, 16.46]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [-0.11, -0.29], [-0.21, -0.16], [-0.3, 0], [-0.21, 0.16], [-0.11, 0.29], [0, 0.35], [0.11, 0.28], [0.21, 0.16], [0.32, 0], [0.21, -0.16], [0.11, -0.28], [0, -0.37]],
	              o: [[0, 0.37], [0.11, 0.28], [0.21, 0.16], [0.32, 0], [0.21, -0.17], [0.11, -0.29], [0, -0.35], [-0.1, -0.28], [-0.21, -0.16], [-0.31, 0], [-0.21, 0.15], [-0.11, 0.28], [0, 0]],
	              v: [[23.79, 12.17], [23.95, 13.15], [24.43, 13.81], [25.2, 14.05], [25.98, 13.8], [26.46, 13.12], [26.63, 12.17], [26.46, 11.24], [25.99, 10.57], [25.2, 10.33], [24.42, 10.56], [23.95, 11.21], [23.79, 12.17]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0.09, 0.11], [0.14, 0.07], [0.22, 0], [0.2, -0.14], [0, -0.21], [-0.14, -0.11], [-0.29, -0.07], [0, 0], [-0.21, -0.22], [0, -0.34], [0.16, -0.22], [0.29, -0.13], [0.38, 0], [0.33, 0.21], [0.09, 0.42], [0, 0], [-0.19, -0.13], [-0.31, 0], [-0.21, 0.15], [0, 0.21], [0.12, 0.11], [0.25, 0.06], [0, 0], [0.21, 0.22], [0, 0.34], [-0.15, 0.21], [-0.27, 0.12], [-0.34, 0], [-0.28, -0.21], [-0.12, -0.35]],
	              o: [[0, 0], [-0.04, -0.11], [-0.08, -0.11], [-0.14, -0.07], [-0.3, 0], [-0.2, 0.14], [0, 0.19], [0.14, 0.11], [0, 0], [0.44, 0.11], [0.22, 0.21], [0, 0.28], [-0.16, 0.22], [-0.29, 0.13], [-0.5, 0], [-0.33, -0.22], [0, 0], [0.07, 0.27], [0.19, 0.13], [0.35, 0], [0.21, -0.15], [0, -0.17], [-0.12, -0.12], [0, 0], [-0.45, -0.11], [-0.21, -0.23], [0, -0.28], [0.16, -0.21], [0.27, -0.12], [0.48, 0], [0.28, 0.21], [0, 0]],
	              v: [[32.01, 10.82], [31.33, 11.01], [31.14, 10.68], [30.81, 10.41], [30.27, 10.3], [29.52, 10.51], [29.22, 11.03], [29.43, 11.48], [30.07, 11.75], [30.79, 11.93], [31.77, 12.42], [32.1, 13.26], [31.86, 14.01], [31.18, 14.54], [30.18, 14.73], [28.94, 14.4], [28.31, 13.45], [29.03, 13.27], [29.42, 13.86], [30.17, 14.06], [31, 13.84], [31.32, 13.3], [31.14, 12.87], [30.59, 12.61], [29.77, 12.41], [28.78, 11.92], [28.47, 11.07], [28.7, 10.34], [29.34, 9.84], [30.27, 9.65], [31.41, 9.97], [32.01, 10.82]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0.11, 0.11], [0, 0.16], [-0.11, 0.11], [-0.16, 0], [-0.11, -0.11], [0, -0.16], [0.05, -0.09], [0.09, -0.05], [0.11, 0]],
	              o: [[-0.16, 0], [-0.11, -0.11], [0, -0.16], [0.11, -0.11], [0.16, 0], [0.11, 0.11], [0, 0.11], [-0.05, 0.09], [-0.09, 0.05], [0, 0]],
	              v: [[33.78, 14.68], [33.38, 14.51], [33.21, 14.1], [33.38, 13.7], [33.78, 13.53], [34.19, 13.7], [34.36, 14.1], [34.28, 14.39], [34.07, 14.6], [33.78, 14.68]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0.11, 0.11], [0, 0.16], [-0.11, 0.11], [-0.16, 0], [-0.11, -0.11], [0, -0.16], [0.05, -0.09], [0.09, -0.05], [0.11, 0]],
	              o: [[-0.16, 0], [-0.11, -0.11], [0, -0.16], [0.11, -0.11], [0.16, 0], [0.11, 0.11], [0, 0.11], [-0.05, 0.09], [-0.09, 0.05], [0, 0]],
	              v: [[33.78, 11.03], [33.38, 10.86], [33.21, 10.46], [33.38, 10.05], [33.78, 9.88], [34.19, 10.05], [34.36, 10.46], [34.28, 10.75], [34.07, 10.96], [33.78, 11.03]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[38.03, 7.77], [35.92, 15.61], [35.23, 15.61], [37.34, 7.77]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[41.23, 7.77], [39.13, 15.61], [38.43, 15.61], [40.54, 7.77]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.32, 0.36, 0.41, 1]
	          },
	          o: {
	            a: 0,
	            k: 20
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [-6.21, 0], [0, 0], [0, 0], [0, 0], [0, 6.21]],
	              o: [[0, -6.21], [0, 0], [0, 0], [0, 0], [-6.21, 0], [0, 0]],
	              v: [[0, 11.25], [11.25, 0], [253.5, 0], [253.5, 22.5], [11.25, 22.5], [0, 11.25]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.93, 0.95, 0.96, 1]
	          },
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "170",
	  layers: [{
	    ind: 169,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [2.5, 2.5]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [5, 5]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [-0.18, -0.18], [0, 0], [0, 0], [-0.18, -0.18], [-0.18, 0.18], [0, 0], [0, 0], [-0.18, 0.18], [0.18, 0.18], [0, 0], [0, 0], [0.18, 0.18], [0.18, -0.18], [0, 0], [0, 0], [0.18, -0.18]],
	              o: [[-0.18, 0.18], [0, 0], [0, 0], [-0.18, 0.18], [0.18, 0.18], [0, 0], [0, 0], [0.18, 0.18], [0.18, -0.18], [0, 0], [0, 0], [0.18, -0.18], [-0.18, -0.18], [0, 0], [0, 0], [-0.18, -0.18], [0, 0]],
	              v: [[0.35, 0.35], [0.35, 0.98], [1.24, 1.88], [0.35, 2.77], [0.35, 3.4], [0.98, 3.4], [1.88, 2.51], [2.77, 3.4], [3.4, 3.4], [3.4, 2.77], [2.51, 1.88], [3.4, 0.98], [3.4, 0.35], [2.77, 0.35], [1.88, 1.24], [0.98, 0.35], [0.35, 0.35]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [1, 1, 1, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "179",
	  layers: [{
	    ind: 178,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [5.5, 8]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [11, 16]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "gr",
	          it: [{
	            ty: "sh",
	            ks: {
	              a: 0,
	              k: {
	                c: true,
	                i: [[0, 0], [-0.21, 0], [0, 0], [0, -0.21], [0, 0], [0.21, 0], [0, 0], [0, 0.21]],
	                o: [[0, -0.21], [0, 0], [0.21, 0], [0, 0], [0, 0.21], [0, 0], [-0.21, 0], [0, 0]],
	                v: [[0, 10.14], [0.38, 9.76], [7.88, 9.76], [8.25, 10.14], [8.25, 10.89], [7.88, 11.26], [0.38, 11.26], [0, 10.89]]
	              }
	            }
	          }, {
	            ty: "fl",
	            c: {
	              a: 0,
	              k: [0.32, 0.36, 0.41, 1]
	            },
	            o: {
	              a: 0,
	              k: 90
	            }
	          }, {
	            ty: "tr",
	            o: {
	              a: 0,
	              k: 100
	            }
	          }]
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "gr",
	          it: [{
	            ty: "sh",
	            ks: {
	              a: 0,
	              k: {
	                c: true,
	                i: [[0, 0], [-0.21, 0], [0, 0], [0, -0.21], [0, 0], [0, 0], [0.15, -0.14], [0, 0], [0.29, 0.26], [0, 0], [-0.21, 0], [0, 0]],
	                o: [[0, -0.21], [0, 0], [0.21, 0], [0, 0], [0, 0], [0.21, 0], [0, 0], [-0.29, 0.26], [0, 0], [-0.15, -0.14], [0, 0], [0, 0]],
	                v: [[2.96, 0.38], [3.33, 0], [4.94, 0], [5.32, 0.38], [5.32, 3.93], [7.88, 3.93], [8.03, 4.32], [4.64, 7.4], [3.63, 7.4], [0.25, 4.32], [0.4, 3.93], [2.96, 3.93]]
	              }
	            }
	          }, {
	            ty: "fl",
	            c: {
	              a: 0,
	              k: [0.32, 0.36, 0.41, 1]
	            },
	            o: {
	              a: 0,
	              k: 90
	            }
	          }, {
	            ty: "tr",
	            o: {
	              a: 0,
	              k: 100
	            }
	          }]
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "196",
	  layers: [{
	    ind: 195,
	    ty: 4,
	    parent: 194,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [3, 3]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [6, 6]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.851, 0.851, 0.851]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 194,
	    ty: 3,
	    ks: {
	      a: {
	        a: 0,
	        k: [3, 3]
	      },
	      p: {
	        a: 0,
	        k: [3, 3]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "188",
	  layers: [{
	    ind: 187,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [6, 6]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [12, 12]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[4.5, 0], [0, 0], [0, 9], [9, 9], [9, 0]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, -2.48], [2.48, 0], [0, 2.48], [-2.48, 0]],
	              o: [[2.48, 0], [0, 2.48], [-2.48, 0], [0, -2.48], [0, 0]],
	              v: [[4.5, 0], [9, 4.5], [4.5, 9], [0, 4.5], [4.5, 0]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [1, 1, 1, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "191",
	  layers: [{
	    ind: 190,
	    ty: 0,
	    parent: 186,
	    ks: {},
	    w: 12,
	    h: 12,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "188"
	  }, {
	    ind: 186,
	    ty: 3,
	    parent: 185,
	    ks: {
	      a: {
	        a: 0,
	        k: [6, 6]
	      },
	      p: {
	        a: 0,
	        k: [6, 0]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 185,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [0, 6]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "201",
	  layers: [{
	    ind: 200,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [68.5, 12]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [137, 24]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, -0.67], [0.83, 0], [0, 0], [0, 0.67], [-0.83, 0]],
	              o: [[0, 0], [0.83, 0], [0, 0.83], [0, 0], [-0.83, 0], [0, -0.83], [0, 0]],
	              v: [[25.5, 7.5], [71.25, 7.5], [72.75, 9], [71.25, 10.5], [25.5, 10.5], [24, 9], [25.5, 7.5]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.32, 0.36, 0.41, 1]
	          },
	          o: {
	            a: 0,
	            k: 10
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [-0.02, 0.1], [0, 0], [-0.18, 0]],
	              o: [[0, 0], [0, 0], [0, -0.41], [0, 0], [0.09, -0.01], [0, 0]],
	              v: [[13.71, 9.5], [14.19, 9.5], [14.19, 8.93], [14.23, 7.95], [13.04, 9.52], [13.71, 9.5]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[11.82, 9.68], [14.47, 6.33], [15.25, 6.33], [15.25, 9.5], [16.04, 9.5], [16.04, 10.38], [15.25, 10.38], [15.25, 11.63], [14.19, 11.63], [14.19, 10.38], [11.82, 10.38]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [1, 1, 1, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0.4, 0], [0.41, -0.18], [0, 0], [-0.75, 0], [0, -0.83], [0.34, -1.11], [0, 0], [0, 0], [0, 0], [0, 1.04]],
	              o: [[0, -0.45], [-0.54, 0], [0, 0], [0.45, -0.21], [1.18, 0], [0, 1.45], [0, 0], [0, 0], [0, 0], [0.21, -2.59], [0, 0]],
	              v: [[10.8, 7.84], [10.02, 7.23], [8.64, 7.59], [8.36, 6.75], [10.2, 6.31], [11.95, 7.73], [9.61, 10.7], [12.02, 10.7], [12.02, 11.63], [8.18, 11.63], [10.8, 7.84]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [1, 1, 1, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, -3.31], [3.31, 0], [0, 3.31], [-3.31, 0]],
	              o: [[3.31, 0], [0, 3.31], [-3.31, 0], [0, -3.31], [0, 0]],
	              v: [[12, 3], [18, 9], [12, 15], [6, 9], [12, 3]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.18, 0.78, 0.96, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [-3.73, 0], [0, 0], [0, -3.73], [0, 0], [0, 0]],
	              o: [[0, -3.73], [0, 0], [3.73, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[0, 6.75], [6.75, 0], [91.5, 0], [98.25, 6.75], [98.25, 18], [0, 18]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [1, 1, 1, 1]
	          },
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "217",
	  layers: [{
	    ind: 216,
	    ty: 4,
	    parent: 215,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [3, 3]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [6, 6]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.851, 0.851, 0.851]
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ind: 215,
	    ty: 3,
	    ks: {
	      a: {
	        a: 0,
	        k: [3, 3]
	      },
	      p: {
	        a: 0,
	        k: [3, 3]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "209",
	  layers: [{
	    ind: 208,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [6, 6]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [12, 12]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[4.5, 0], [0, 0], [0, 9], [9, 9], [9, 0]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, -2.48], [2.48, 0], [0, 2.48], [-2.48, 0]],
	              o: [[2.48, 0], [0, 2.48], [-2.48, 0], [0, -2.48], [0, 0]],
	              v: [[4.5, 0], [9, 4.5], [4.5, 9], [0, 4.5], [4.5, 0]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.93, 0.95, 0.96, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  id: "212",
	  layers: [{
	    ind: 211,
	    ty: 0,
	    parent: 207,
	    ks: {},
	    w: 12,
	    h: 12,
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    refId: "209"
	  }, {
	    ind: 207,
	    ty: 3,
	    parent: 206,
	    ks: {
	      a: {
	        a: 0,
	        k: [6, 6]
	      },
	      p: {
	        a: 0,
	        k: [6, 0]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }, {
	    ind: 206,
	    ty: 3,
	    ks: {
	      p: {
	        a: 0,
	        k: [0, 6]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0
	  }]
	}, {
	  id: "222",
	  layers: [{
	    ind: 221,
	    ty: 4,
	    ks: {},
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [76, 12]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [152, 24]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ind: 0,
	    ty: 4,
	    ks: {
	      s: {
	        a: 0,
	        k: [133.33, 133.33]
	      }
	    },
	    ip: 0,
	    op: 218.8,
	    st: 0,
	    shapes: [{
	      ty: "gr",
	      it: [{
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, -0.67], [0.83, 0], [0, 0], [0, 0.67], [-0.83, 0]],
	              o: [[0, 0], [0.83, 0], [0, 0.83], [0, 0], [-0.83, 0], [0, -0.83], [0, 0]],
	              v: [[36.75, 7.5], [82.5, 7.5], [84, 9], [82.5, 10.5], [36.75, 10.5], [35.25, 9], [36.75, 7.5]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.32, 0.36, 0.41, 1]
	          },
	          o: {
	            a: 0,
	            k: 10
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [-0.02, 0.1], [0, 0], [-0.18, 0]],
	              o: [[0, 0], [0, 0], [0, -0.41], [0, 0], [0.09, -0.01], [0, 0]],
	              v: [[24.96, 9.5], [25.44, 9.5], [25.44, 8.93], [25.48, 7.95], [24.29, 9.52], [24.96, 9.5]]
	            }
	          }
	        }, {
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[23.07, 9.68], [25.72, 6.33], [26.5, 6.33], [26.5, 9.5], [27.29, 9.5], [27.29, 10.38], [26.5, 10.38], [26.5, 11.63], [25.44, 11.63], [25.44, 10.38], [23.07, 10.38]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.93, 0.95, 0.96, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0.4, 0], [0.41, -0.18], [0, 0], [-0.75, 0], [0, -0.83], [0.34, -1.11], [0, 0], [0, 0], [0, 0], [0, 1.04]],
	              o: [[0, -0.45], [-0.54, 0], [0, 0], [0.45, -0.21], [1.18, 0], [0, 1.45], [0, 0], [0, 0], [0, 0], [0.21, -2.59], [0, 0]],
	              v: [[22.05, 7.84], [21.27, 7.23], [19.89, 7.59], [19.61, 6.75], [21.45, 6.31], [23.2, 7.73], [20.86, 10.7], [23.27, 10.7], [23.27, 11.63], [19.43, 11.63], [22.05, 7.84]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.93, 0.95, 0.96, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, -3.31], [3.31, 0], [0, 3.31], [-3.31, 0]],
	              o: [[3.31, 0], [0, 3.31], [-3.31, 0], [0, -3.31], [0, 0]],
	              v: [[23.25, 3], [29.25, 9], [23.25, 15], [17.25, 9], [23.25, 3]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0, 0, 0, 1]
	          },
	          r: 2,
	          o: {
	            a: 0,
	            k: 10
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "gr",
	        it: [{
	          ty: "sh",
	          ks: {
	            a: 0,
	            k: {
	              c: true,
	              i: [[0, 0], [0, 0], [0, -4.14], [0, 0], [0, 0]],
	              o: [[0, 0], [4.14, 0], [0, 0], [0, 0], [0, 0]],
	              v: [[0, 0], [90.75, 0], [98.25, 7.5], [98.25, 18], [0, 18]]
	            }
	          }
	        }, {
	          ty: "fl",
	          c: {
	            a: 0,
	            k: [0.93, 0.95, 0.96, 1]
	          },
	          o: {
	            a: 0,
	            k: 100
	          }
	        }, {
	          ty: "tr",
	          o: {
	            a: 0,
	            k: 100
	          }
	        }]
	      }, {
	        ty: "tr",
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}];
	var fr = 60;
	var h = 226;
	var ip = 0;
	var layers = [{
	  ind: 113,
	  ty: 0,
	  parent: 3,
	  ks: {
	    a: {
	      a: 0,
	      k: [160, 130.5]
	    },
	    o: {
	      a: 1,
	      k: [{
	        t: 0,
	        s: [100],
	        h: 1
	      }, {
	        t: 153.6,
	        s: [100],
	        i: {
	          x: 1,
	          y: 1
	        },
	        o: {
	          x: 1,
	          y: 0
	        }
	      }, {
	        t: 201.6,
	        s: [0],
	        h: 1
	      }, {
	        t: 217.8,
	        s: [0],
	        h: 1
	      }]
	    },
	    p: {
	      a: 0,
	      k: [100, 70.5]
	    },
	    s: {
	      a: 1,
	      k: [{
	        t: 0,
	        s: [100, 100],
	        i: {
	          x: [1, 1],
	          y: [1, 1]
	        },
	        o: {
	          x: [0, 0],
	          y: [0, 0]
	        }
	      }, {
	        t: 153.6,
	        s: [100, 100],
	        i: {
	          x: [1, 1],
	          y: [1, 1]
	        },
	        o: {
	          x: [1, 1],
	          y: [0, 0]
	        }
	      }, {
	        t: 201.6,
	        s: [50, 50],
	        i: {
	          x: [1, 1],
	          y: [1, 1]
	        },
	        o: {
	          x: [0, 0],
	          y: [0, 0]
	        }
	      }, {
	        t: 217.8,
	        s: [50, 50],
	        h: 1
	      }]
	    }
	  },
	  w: 382,
	  h: 320,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "111"
	}, {
	  ind: 3,
	  ty: 3,
	  parent: 2,
	  ks: {
	    p: {
	      a: 0,
	      k: [214, 47]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 120,
	  ty: 0,
	  parent: 116,
	  ks: {},
	  w: 14,
	  h: 14,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "118"
	}, {
	  ind: 116,
	  ty: 3,
	  parent: 115,
	  ks: {
	    p: {
	      a: 0,
	      k: [3, 3]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 115,
	  ty: 3,
	  parent: 114,
	  ks: {
	    p: {
	      a: 0,
	      k: [44, 0]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 126,
	  ty: 0,
	  parent: 122,
	  ks: {},
	  w: 12,
	  h: 14,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "124"
	}, {
	  ind: 122,
	  ty: 3,
	  parent: 121,
	  ks: {
	    p: {
	      a: 0,
	      k: [4, 3]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 121,
	  ty: 3,
	  parent: 114,
	  ks: {
	    p: {
	      a: 0,
	      k: [22, 0]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 132,
	  ty: 0,
	  parent: 128,
	  ks: {},
	  w: 13,
	  h: 15,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "130"
	}, {
	  ind: 128,
	  ty: 3,
	  parent: 127,
	  ks: {
	    p: {
	      a: 0,
	      k: [4, 3]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 127,
	  ty: 3,
	  parent: 114,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 114,
	  ty: 3,
	  parent: 2,
	  ks: {
	    p: {
	      a: 0,
	      k: [7, 13]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 158,
	  ty: 0,
	  parent: 134,
	  ks: {
	    a: {
	      a: 0,
	      k: [1, 1]
	    },
	    o: {
	      a: 1,
	      k: [{
	        t: 0,
	        s: [100],
	        h: 1
	      }, {
	        t: 153.6,
	        s: [100],
	        i: {
	          x: 1,
	          y: 1
	        },
	        o: {
	          x: 0,
	          y: 0
	        }
	      }, {
	        t: 180,
	        s: [0],
	        h: 1
	      }, {
	        t: 217.8,
	        s: [0],
	        h: 1
	      }]
	    }
	  },
	  w: 34,
	  h: 26,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "156"
	}, {
	  ind: 134,
	  ty: 3,
	  parent: 133,
	  ks: {
	    p: {
	      a: 0,
	      k: [302, 3]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 164,
	  ty: 0,
	  parent: 160,
	  ks: {},
	  w: 338,
	  h: 30,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "162"
	}, {
	  ind: 160,
	  ty: 3,
	  parent: 159,
	  ks: {
	    s: {
	      a: 0,
	      k: [102.07, 100]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 159,
	  ty: 3,
	  parent: 133,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 133,
	  ty: 3,
	  parent: 2,
	  ks: {
	    p: {
	      a: 0,
	      k: [79, 8]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 165,
	  ty: 4,
	  parent: 2,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  shapes: [{
	    ty: "rc",
	    p: {
	      a: 0,
	      k: [212, 101]
	    },
	    r: {
	      a: 0,
	      k: 0
	    },
	    s: {
	      a: 0,
	      k: [424, 202]
	    }
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [0.973, 0.98, 0.984]
	    },
	    o: {
	      a: 0,
	      k: 100
	    }
	  }]
	}, {
	  ind: 2,
	  ty: 3,
	  parent: 1,
	  ks: {
	    p: {
	      a: 0,
	      k: [0, 24]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 172,
	  ty: 0,
	  parent: 168,
	  ks: {},
	  w: 5,
	  h: 5,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "170"
	}, {
	  ind: 168,
	  ty: 3,
	  parent: 167,
	  ks: {
	    p: {
	      a: 0,
	      k: [2, 2]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 174,
	  ty: 4,
	  td: 1,
	  parent: 167,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  shapes: [{
	    ty: "rc",
	    p: {
	      a: 0,
	      k: [4.5, 4.5]
	    },
	    r: {
	      a: 0,
	      k: 2
	    },
	    s: {
	      a: 0,
	      k: [9, 9]
	    }
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [0, 0, 0]
	    },
	    o: {
	      a: 0,
	      k: 100
	    }
	  }]
	}, {
	  ind: 173,
	  ty: 4,
	  tt: 2,
	  parent: 167,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [4.5, 4.5]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [11, 11]
	      }
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0, 0, 0, 0]
	      },
	      o: {
	        a: 0,
	        k: 0
	      }
	    }, {
	      ty: "tr",
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "rc",
	      p: {
	        a: 0,
	        k: [4.5, 4.5]
	      },
	      r: {
	        a: 0,
	        k: 2
	      },
	      s: {
	        a: 0,
	        k: [9, 9]
	      }
	    }, {
	      ty: "st",
	      c: {
	        a: 0,
	        k: [0.835, 0.843, 0.859]
	      },
	      lc: 2,
	      lj: 1,
	      ml: 10,
	      o: {
	        a: 0,
	        k: 100
	      },
	      w: {
	        a: 0,
	        k: 2
	      }
	    }, {
	      ty: "tr",
	      o: {
	        a: 0,
	        k: 100
	      }
	    }]
	  }]
	}, {
	  ind: 175,
	  ty: 4,
	  parent: 167,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  shapes: [{
	    ty: "rc",
	    p: {
	      a: 0,
	      k: [4.5, 4.5]
	    },
	    r: {
	      a: 0,
	      k: 2
	    },
	    s: {
	      a: 0,
	      k: [9, 9]
	    }
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [1, 0.341, 0.322]
	    },
	    o: {
	      a: 0,
	      k: 100
	    }
	  }]
	}, {
	  ind: 167,
	  ty: 3,
	  parent: 166,
	  ks: {
	    p: {
	      a: 0,
	      k: [17, 12]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 181,
	  ty: 0,
	  parent: 177,
	  ks: {},
	  w: 11,
	  h: 16,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "179"
	}, {
	  ind: 177,
	  ty: 3,
	  parent: 176,
	  ks: {
	    p: {
	      a: 0,
	      k: [6, 4]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 176,
	  ty: 3,
	  parent: 166,
	  ks: {
	    p: {
	      a: 0,
	      k: [4, 0]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 182,
	  ty: 4,
	  parent: 166,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  shapes: [{
	    ty: "rc",
	    p: {
	      a: 0,
	      k: [16, 12]
	    },
	    r: {
	      a: 0,
	      k: 98
	    },
	    s: {
	      a: 0,
	      k: [32, 24]
	    }
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [0.322, 0.361, 0.412, 0.102]
	    },
	    o: {
	      a: 0,
	      k: 10.2
	    }
	  }]
	}, {
	  ind: 166,
	  ty: 3,
	  parent: 1,
	  ks: {
	    p: {
	      a: 0,
	      k: [381, 35]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 198,
	  ty: 0,
	  td: 1,
	  parent: 184,
	  ks: {},
	  w: 6,
	  h: 6,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "196"
	}, {
	  ind: 193,
	  ty: 0,
	  tt: 1,
	  parent: 184,
	  ks: {
	    a: {
	      a: 0,
	      k: [0, 6]
	    }
	  },
	  w: 12,
	  h: 18,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "191"
	}, {
	  ind: 184,
	  ty: 3,
	  parent: 183,
	  ks: {
	    p: {
	      a: 0,
	      k: [131, 18]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 203,
	  ty: 0,
	  parent: 199,
	  ks: {},
	  w: 137,
	  h: 24,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "201"
	}, {
	  ind: 199,
	  ty: 3,
	  parent: 183,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 183,
	  ty: 3,
	  parent: 1,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 219,
	  ty: 0,
	  td: 1,
	  parent: 205,
	  ks: {},
	  w: 6,
	  h: 6,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "217"
	}, {
	  ind: 214,
	  ty: 0,
	  tt: 1,
	  parent: 205,
	  ks: {
	    a: {
	      a: 0,
	      k: [0, 6]
	    }
	  },
	  w: 12,
	  h: 18,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "212"
	}, {
	  ind: 205,
	  ty: 3,
	  parent: 204,
	  ks: {
	    p: {
	      a: 0,
	      k: [131, 18]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 224,
	  ty: 0,
	  parent: 220,
	  ks: {},
	  w: 152,
	  h: 24,
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  refId: "222"
	}, {
	  ind: 220,
	  ty: 3,
	  parent: 204,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 204,
	  ty: 3,
	  parent: 1,
	  ks: {
	    p: {
	      a: 0,
	      k: [115, 0]
	    }
	  },
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 1,
	  ty: 3,
	  parent: 0,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0
	}, {
	  ind: 225,
	  ty: 4,
	  parent: 0,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0,
	  shapes: [{
	    ty: "rc",
	    p: {
	      a: 0,
	      k: [212, 113]
	    },
	    r: {
	      a: 0,
	      k: 0
	    },
	    s: {
	      a: 0,
	      k: [424, 226]
	    }
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [0.973, 0.98, 0.984]
	    },
	    o: {
	      a: 0,
	      k: 100
	    }
	  }]
	}, {
	  ind: 0,
	  ty: 3,
	  ks: {},
	  ip: 0,
	  op: 218.8,
	  st: 0
	}];
	var meta = {
	  g: "https://jitter.video"
	};
	var op = 217.8;
	var v = "5.7.4";
	var w = 424;
	var DownloadAllPermissionAnimation = {
	  assets: assets,
	  fr: fr,
	  h: h,
	  ip: ip,
	  layers: layers,
	  meta: meta,
	  op: op,
	  v: v,
	  w: w
	};

	const showDownloadAllFilesConfirm = async () => {
	  const HELPDESK_ARTICLE_CODE = '23597750';
	  const articleLink = `BX.Helper?.show('redirect=detail&code=${HELPDESK_ARTICLE_CODE}')`;
	  const text = main_core.Loc.getMessage('IM_LIB_DOWNLOAD_ALL_FILES_TEXT', {
	    '[helpdesk]': `<a onclick="${articleLink}">`,
	    '[/helpdesk]': '</a>'
	  });
	  const subTitle = main_core.Dom.create('div', {
	    html: text,
	    props: {
	      className: 'bx-im-download-all-confirm__subtitle'
	    }
	  });
	  const animationContainer = main_core.Dom.create('div');
	  const contentContainer = main_core.Dom.create('div', {
	    children: [subTitle, animationContainer]
	  });
	  const {
	    Lottie
	  } = await main_core.Runtime.loadExtension('ui.lottie');
	  Lottie.loadAnimation({
	    animationData: DownloadAllPermissionAnimation,
	    container: animationContainer,
	    renderer: 'svg',
	    loop: true,
	    autoplay: true
	  });
	  return showSingleButtonConfirm({
	    title: main_core.Loc.getMessage('IM_LIB_DOWNLOAD_ALL_FILES_TITLE'),
	    text: contentContainer,
	    firstButtonCaption: main_core.Loc.getMessage('IM_LIB_DOWNLOAD_ALL_FILES_BUTTON')
	  });
	};

	const showNotificationsModeSwitchConfirm = () => {
	  const kickText = main_core.Loc.getMessage('IM_LIB_CONFIRM_SWITCH_NOTIFICATION_MODE');
	  const yesCaption = main_core.Loc.getMessage('IM_LIB_CONFIRM_SWITCH_NOTIFICATION_MODE_YES');
	  return showTwoButtonConfirm({
	    text: kickText,
	    firstButtonCaption: yesCaption
	  });
	};

	const showKickUserConfirm = dialogId => {
	  const {
	    title,
	    text,
	    firstButtonCaption
	  } = getPhrases$3(dialogId);
	  return showTwoButtonConfirm({
	    title,
	    text,
	    firstButtonCaption
	  });
	};
	const getPhrases$3 = dialogId => {
	  if (isCollab$2(dialogId)) {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_TITLE'),
	      text: main_core.Loc.getMessage('IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_TEXT'),
	      firstButtonCaption: main_core.Loc.getMessage('IM_LIB_CONFIRM_USER_KICK_YES')
	    };
	  }
	  const isChannel = im_v2_lib_channel.ChannelManager.isChannel(dialogId);
	  if (isChannel) {
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_CONFIRM_USER_CHANNEL_KICK'),
	      firstButtonCaption: main_core.Loc.getMessage('IM_LIB_CONFIRM_USER_KICK_YES')
	    };
	  }
	  return {
	    text: main_core.Loc.getMessage('IM_LIB_CONFIRM_USER_KICK_MSGVER_1'),
	    firstButtonCaption: main_core.Loc.getMessage('IM_LIB_CONFIRM_USER_KICK_YES')
	  };
	};
	const isCollab$2 = dialogId => {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  return chat.type === im_v2_const.ChatType.collab;
	};

	const showCloseWithActiveCallConfirm = () => {
	  return showTwoButtonConfirm({
	    title: main_core.Loc.getMessage('IM_LIB_CONFIRM_ACTIVE_CALL_CONFIRM')
	  });
	};

	exports.showDeleteChatConfirm = showDeleteChatConfirm;
	exports.showLeaveChatConfirm = showLeaveChatConfirm;
	exports.showExitUpdateChatConfirm = showExitUpdateChatConfirm;
	exports.showDesktopRestartConfirm = showDesktopRestartConfirm;
	exports.showDesktopConfirm = showDesktopConfirm;
	exports.showDesktopDeleteConfirm = showDesktopDeleteConfirm;
	exports.showDeleteChannelPostConfirm = showDeleteChannelPostConfirm;
	exports.showDeleteMessagesConfirm = showDeleteMessagesConfirm;
	exports.showDownloadAllFilesConfirm = showDownloadAllFilesConfirm;
	exports.showNotificationsModeSwitchConfirm = showNotificationsModeSwitchConfirm;
	exports.showKickUserConfirm = showKickUserConfirm;
	exports.showCloseWithActiveCallConfirm = showCloseWithActiveCallConfirm;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Main,BX.UI.Dialogs,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Messenger.v2.Const,BX));
//# sourceMappingURL=registry.bundle.js.map

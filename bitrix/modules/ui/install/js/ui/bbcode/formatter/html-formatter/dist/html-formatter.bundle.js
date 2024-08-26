/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.BBCode = this.BX.UI.BBCode || {};
(function (exports,ui_bbcode_model,main_core,ui_bbcode_formatter) {
	'use strict';

	class RootNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: '#root',
	      convert() {
	        return document.createDocumentFragment();
	      },
	      ...options
	    });
	  }
	}

	class TextNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: '#text',
	      convert({
	        node
	      }) {
	        return document.createTextNode(node.toString());
	      },
	      ...options
	    });
	  }
	}

	class TabNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: '#tab',
	      convert({
	        node
	      }) {
	        return document.createTextNode(node.toString());
	      },
	      ...options
	    });
	  }
	}

	class LinebreakNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: '#linebreak',
	      convert({
	        node
	      }) {
	        const nextSibling = node.getNextSibling();
	        if (nextSibling && nextSibling.getName() === '#linebreak') {
	          return document.createElement('br');
	        }
	        return document.createTextNode(node.getContent());
	      },
	      ...options
	    });
	  }
	}

	class ParagraphNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'p',
	      convert({
	        node
	      }) {
	        return main_core.Dom.create({
	          tag: node.getName(),
	          attributes: node.getAttributes()
	        });
	      },
	      ...options
	    });
	  }
	}

	class BoldNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'b',
	      convert({
	        node
	      }) {
	        return main_core.Dom.create({
	          tag: 'b',
	          attributes: node.getAttributes()
	        });
	      },
	      ...options
	    });
	  }
	}

	class UnderlineNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'u',
	      convert({
	        node
	      }) {
	        return main_core.Dom.create({
	          tag: 'u',
	          attributes: node.getAttributes()
	        });
	      },
	      ...options
	    });
	  }
	}

	class ItalicNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'i',
	      convert({
	        node
	      }) {
	        return main_core.Dom.create({
	          tag: 'i',
	          attributes: node.getAttributes()
	        });
	      },
	      ...options
	    });
	  }
	}

	class StrikethroughNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 's',
	      convert({
	        node
	      }) {
	        return main_core.Dom.create({
	          tag: 's',
	          attributes: node.getAttributes()
	        });
	      },
	      ...options
	    });
	  }
	}

	class SpanNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'span',
	      convert({
	        node
	      }) {
	        return main_core.Dom.create({
	          tag: 'span',
	          attributes: node.getAttributes()
	        });
	      },
	      ...options
	    });
	  }
	}

	class TableNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'table',
	      convert() {
	        return main_core.Dom.create({
	          tag: 'table',
	          attrs: {
	            classname: 'ui-formatter-table'
	          }
	        });
	      },
	      ...options
	    });
	  }
	}

	class TableHeadCellNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'th',
	      convert() {
	        return main_core.Dom.create({
	          tag: 'th',
	          attrs: {
	            classname: 'ui-formatter-table-head-cell'
	          }
	        });
	      },
	      ...options
	    });
	  }
	}

	class TableDataCellNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'td',
	      convert() {
	        return main_core.Dom.create({
	          tag: 'td',
	          attrs: {
	            classname: 'ui-formatter-table-data-cell'
	          }
	        });
	      },
	      ...options
	    });
	  }
	}

	class TableRowNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'tr',
	      convert() {
	        return main_core.Dom.create({
	          tag: 'tr',
	          attrs: {
	            classname: 'ui-formatter-table-row'
	          }
	        });
	      },
	      ...options
	    });
	  }
	}

	class ListNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options) {
	    super({
	      name: 'list',
	      convert({
	        node
	      }) {
	        const tagName = node.getValue() === '1' ? 'ol' : 'ul';
	        return main_core.Dom.create({
	          tag: tagName,
	          attributes: node.getAttributes()
	        });
	      },
	      ...options
	    });
	  }
	}

	class ListItemNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options) {
	    super({
	      name: '*',
	      convert({
	        node
	      }) {
	        return main_core.Dom.create({
	          tag: 'li',
	          attributes: node.getAttributes()
	        });
	      },
	      ...options
	    });
	  }
	}

	class QuoteNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'quote',
	      convert() {
	        return main_core.Dom.create({
	          tag: 'blockquote',
	          attrs: {
	            className: 'ui-formatter-blockquote'
	          }
	        });
	      },
	      ...options
	    });
	  }
	}

	class CodeNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'code',
	      before({
	        node
	      }) {
	        const scheme = node.getScheme();
	        const preparedNode = CodeNodeFormatter.trimLinebreaks(node);
	        const children = preparedNode.getChildren();
	        const newChildren = [];
	        let newNode = scheme.createText();
	        children.forEach(child => {
	          if (scheme.isNewLine(child)) {
	            newChildren.push(newNode, child);
	            newNode = scheme.createText();
	          } else {
	            newNode.setContent(newNode.getContent() + child.getContent());
	          }
	        });
	        preparedNode.setChildren([...newChildren, newNode]);
	        return preparedNode;
	      },
	      convert() {
	        return main_core.Dom.create({
	          tag: 'pre',
	          attrs: {
	            className: 'ui-formatter-code-block'
	          }
	        });
	      },
	      forChild({
	        node,
	        element
	      }) {
	        if (node.getPlainTextLength() === 0) {
	          return null;
	        }
	        const scheme = node.getScheme();
	        if (scheme.isText(node)) {
	          const preparedLine = node.toString().replaceAll(/\t/g, ' '.repeat(4));
	          return main_core.Dom.create({
	            tag: 'span',
	            attrs: {
	              className: 'ui-formatter-code-line'
	            },
	            text: preparedLine
	          });
	        }
	        return element;
	      },
	      ...options
	    });
	  }
	  static trimLinebreaks(node) {
	    const scheme = node.getScheme();
	    let firstChild = node.getFirstChild();
	    while (scheme.isNewLine(firstChild)) {
	      firstChild.remove();
	      firstChild = node.getFirstChild();
	    }
	    let lastChild = node.getLastChild();
	    while (scheme.isNewLine(lastChild)) {
	      lastChild.remove();
	      lastChild = node.getFirstChild();
	    }
	    return node;
	  }
	}

	class LinkNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'url',
	      validate({
	        node
	      }) {
	        const nodeValue = LinkNodeFormatter.fetchNodeValue(node);
	        return !LinkNodeFormatter.startsWithJavascriptScheme(nodeValue);
	      },
	      before({
	        node,
	        formatter
	      }) {
	        if (formatter.isShortLinkEnabled() && formatter.isHrefStartsWithAllowedScheme(node.toPlainText())) {
	          const scheme = node.getScheme();
	          const nodeContentLength = node.getPlainTextLength();
	          const {
	            shortLink
	          } = formatter.getLinkSettings();
	          if (nodeContentLength > shortLink.maxLength) {
	            const sourceHref = LinkNodeFormatter.fetchNodeValue(node);
	            const nodeRoot = scheme.createRoot({
	              children: node.getChildren()
	            });
	            const [left, right] = nodeRoot.split({
	              offset: shortLink.maxLength - shortLink.lastFragmentLength
	            });
	            const sourceRightFragmentLength = right.getPlainTextLength();
	            const newLink = node.clone();
	            newLink.setValue(sourceHref);
	            if (sourceRightFragmentLength > shortLink.lastFragmentLength) {
	              newLink.appendChild(...left.getChildren(), scheme.createText('...'));
	              const [, lastFragment] = right.split({
	                offset: sourceRightFragmentLength - shortLink.lastFragmentLength
	              });
	              newLink.appendChild(...lastFragment.getChildren());
	              return newLink;
	            }
	            newLink.setChildren([...left.getChildren(), scheme.createText('...'), ...right.getChildren()]);
	            return newLink;
	          }
	        }
	        return node;
	      },
	      convert({
	        node,
	        formatter
	      }) {
	        const sourceHref = (() => {
	          const value = node.getValue();
	          if (main_core.Type.isStringFilled(value)) {
	            return value;
	          }
	          return node.getContent();
	        })();
	        const nodeAttributes = node.getAttributes();
	        const safeHref = formatter.makeSafeHref(sourceHref);
	        const {
	          defaultTarget,
	          attributes
	        } = formatter.getLinkSettings();
	        return main_core.Dom.create({
	          tag: 'a',
	          attrs: {
	            ...nodeAttributes,
	            ...attributes,
	            target: defaultTarget,
	            href: safeHref
	          }
	        });
	      },
	      ...options
	    });
	  }
	  static fetchNodeValue(node) {
	    const value = node.getValue();
	    if (main_core.Type.isStringFilled(value)) {
	      return value;
	    }
	    return node.toPlainText();
	  }
	  static startsWithJavascriptScheme(sourceHref) {
	    if (main_core.Type.isStringFilled(sourceHref)) {
	      // eslint-disable-next-line no-control-regex
	      const regexp = /^[\u0000-\u001F ]*j[\t\n\r]*a[\t\n\r]*v[\t\n\r]*a[\t\n\r]*s[\t\n\r]*c[\t\n\r]*r[\t\n\r]*i[\t\n\r]*p[\t\n\r]*t[\t\n\r]*:/i;
	      return regexp.test(sourceHref);
	    }
	    return false;
	  }
	}

	class SpoilerNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'spoiler',
	      convert({
	        node
	      }) {
	        return main_core.Dom.create({
	          tag: 'details',
	          attrs: {
	            className: 'ui-formatter__spoiler ui-icon-set__scope'
	          },
	          children: [main_core.Dom.create({
	            tag: 'summary',
	            attrs: {
	              className: 'ui-formatter__spoiler-title'
	            },
	            text: node.getValue()
	          })]
	        });
	      },
	      after({
	        element
	      }) {
	        const [summary, ...content] = element.children;
	        element.appendChild(summary);
	        element.appendChild(main_core.Dom.create({
	          tag: 'div',
	          attrs: {
	            className: 'ui-formatter__spoiler-content'
	          },
	          children: [...content]
	        }));
	        return element;
	      },
	      ...options
	    });
	  }
	}

	class DiskNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'disk',
	      convert({
	        node,
	        formatter,
	        data
	      }) {
	        const fileId = node.getAttribute('id');
	        const fileEntry = data.files.find(fileOptions => {
	          return String(fileOptions.id) === String(fileId);
	        });
	        if (main_core.Type.isPlainObject(fileEntry)) {
	          var _fileEntry$data;
	          const fileOptions = fileEntry == null ? void 0 : (_fileEntry$data = fileEntry.data) == null ? void 0 : _fileEntry$data.file;
	          if (main_core.Type.isPlainObject(fileOptions)) {
	            if (fileOptions.type.startsWith('image')) {
	              return main_core.Dom.create({
	                tag: 'div',
	                attrs: {
	                  className: 'ui-formatter-image'
	                },
	                children: [main_core.Dom.create({
	                  tag: 'img',
	                  attrs: {
	                    src: formatter.makeSafeHref(fileOptions.downloadUrl)
	                  }
	                })]
	              });
	            }
	            if (fileOptions.type.startsWith('video')) {
	              return main_core.Dom.create({
	                tag: 'div',
	                attrs: {
	                  className: 'ui-formatter-video'
	                },
	                children: [main_core.Dom.create({
	                  tag: 'video',
	                  attrs: {
	                    src: formatter.makeSafeHref(fileOptions.downloadUrl),
	                    controls: true
	                  }
	                })]
	              });
	            }
	            return main_core.Dom.create({
	              tag: 'a',
	              attrs: {
	                href: formatter.makeSafeHref(fileOptions.downloadUrl)
	              },
	              text: fileOptions.name
	            });
	          }
	        }
	        return null;
	      },
	      ...options
	    });
	  }
	}

	class UserNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options) {
	    super({
	      name: 'user',
	      convert({
	        node,
	        formatter
	      }) {
	        var _mentionSettings$urlT;
	        const mentionSettings = formatter.getMentionSettings();
	        if (main_core.Type.isStringFilled(mentionSettings == null ? void 0 : (_mentionSettings$urlT = mentionSettings.urlTemplate) == null ? void 0 : _mentionSettings$urlT.user)) {
	          const urlTemplate = mentionSettings.urlTemplate.user;
	          const userUrl = urlTemplate.replaceAll('#ID#', node.getValue());
	          return main_core.Dom.create({
	            tag: 'a',
	            attrs: {
	              className: 'ui-formatter-link ui-formatter-mention',
	              href: formatter.makeSafeHref(userUrl),
	              target: '_blank'
	            }
	          });
	        }
	        return main_core.Dom.create({
	          tag: 'span',
	          attrs: {
	            className: 'ui-formatter-mention-stub'
	          }
	        });
	      },
	      ...options
	    });
	  }
	}

	class DepartmentNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'department',
	      convert({
	        node,
	        formatter
	      }) {
	        var _mentionSettings$urlT;
	        const mentionSettings = formatter.getMentionSettings();
	        if (main_core.Type.isStringFilled(mentionSettings == null ? void 0 : (_mentionSettings$urlT = mentionSettings.urlTemplate) == null ? void 0 : _mentionSettings$urlT.department)) {
	          const urlTemplate = mentionSettings.urlTemplate.department;
	          const departmentUrl = urlTemplate.replaceAll('#ID#', node.getValue());
	          return main_core.Dom.create({
	            tag: 'a',
	            attrs: {
	              className: 'ui-formatter-link ui-formatter-mention',
	              href: formatter.makeSafeHref(departmentUrl),
	              target: '_blank'
	            }
	          });
	        }
	        return main_core.Dom.create({
	          tag: 'span',
	          attrs: {
	            className: 'ui-formatter-mention-stub'
	          }
	        });
	      },
	      ...options
	    });
	  }
	}

	class ProjectNodeFormatter extends ui_bbcode_formatter.NodeFormatter {
	  constructor(options = {}) {
	    super({
	      name: 'project',
	      convert({
	        node,
	        formatter
	      }) {
	        var _mentionSettings$urlT;
	        const mentionSettings = formatter.getMentionSettings();
	        if (main_core.Type.isStringFilled(mentionSettings == null ? void 0 : (_mentionSettings$urlT = mentionSettings.urlTemplate) == null ? void 0 : _mentionSettings$urlT.project)) {
	          const urlTemplate = mentionSettings.urlTemplate.project;
	          const projectUrl = urlTemplate.replaceAll('#group_id#', node.getValue());
	          return main_core.Dom.create({
	            tag: 'a',
	            attrs: {
	              href: formatter.makeSafeHref(projectUrl),
	              className: 'ui-formatter-link ui-formatter-mention',
	              target: '_blank'
	            }
	          });
	        }
	        return main_core.Dom.create({
	          tag: 'span',
	          attrs: {
	            className: 'ui-formatter-mention-stub'
	          }
	        });
	      },
	      ...options
	    });
	  }
	}



	var NodeFormatters = /*#__PURE__*/Object.freeze({
		RootNodeFormatter: RootNodeFormatter,
		TextNodeFormatter: TextNodeFormatter,
		TabNodeFormatter: TabNodeFormatter,
		LinebreakNodeFormatter: LinebreakNodeFormatter,
		ParagraphNodeFormatter: ParagraphNodeFormatter,
		BoldNodeFormatter: BoldNodeFormatter,
		UnderlineNodeFormatter: UnderlineNodeFormatter,
		ItalicNodeFormatter: ItalicNodeFormatter,
		StrikethroughNodeFormatter: StrikethroughNodeFormatter,
		SpanNodeFormatter: SpanNodeFormatter,
		TableNodeFormatter: TableNodeFormatter,
		TableHeadCellNodeFormatter: TableHeadCellNodeFormatter,
		TableDataCellNodeFormatter: TableDataCellNodeFormatter,
		TableRowNodeFormatter: TableRowNodeFormatter,
		ListNodeFormatter: ListNodeFormatter,
		ListItemNodeFormatter: ListItemNodeFormatter,
		QuoteNodeFormatter: QuoteNodeFormatter,
		CodeNodeFormatter: CodeNodeFormatter,
		LinkNodeFormatter: LinkNodeFormatter,
		SpoilerNodeFormatter: SpoilerNodeFormatter,
		DiskNodeFormatter: DiskNodeFormatter,
		UserNodeFormatter: UserNodeFormatter,
		DepartmentNodeFormatter: DepartmentNodeFormatter,
		ProjectNodeFormatter: ProjectNodeFormatter
	});

	const globalSettings = main_core.Extension.getSettings('ui.bbcode.formatter.html-formatter');

	/**
	 * @memberOf BX.UI.BBCode.Formatter
	 */
	var _linkSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("linkSettings");
	var _mentionSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mentionSettings");
	class HtmlFormatter extends ui_bbcode_formatter.Formatter {
	  constructor(options = {}) {
	    super({
	      formatters: Object.values(NodeFormatters).map(FormatterClass => {
	        return new FormatterClass();
	      })
	    });
	    Object.defineProperty(this, _linkSettings, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _mentionSettings, {
	      writable: true,
	      value: void 0
	    });
	    this.setNodeFormatters(options.formatters);
	    this.setLinkSettings({
	      ...globalSettings.linkSettings,
	      ...options.linkSettings
	    });
	    this.setMentionSettings({
	      ...globalSettings.mention,
	      ...options.mention
	    });
	  }
	  static decodeAmpersand(source) {
	    if (main_core.Type.isStringFilled(source)) {
	      return source.replaceAll(/&amp;/gi, '&');
	    }
	    return '';
	  }
	  static decodeSquareBrackets(source) {
	    if (main_core.Type.isStringFilled(source)) {
	      return source.replaceAll(/&#91;/g, '[').replaceAll(/&#93;/g, ']');
	    }
	    return '';
	  }
	  static stripFormFeedCharacter(source) {
	    if (main_core.Type.isStringFilled(source)) {
	      return source.replaceAll(/\f/gi, '');
	    }
	    return '';
	  }
	  static encodeSingleQuotes(source) {
	    if (main_core.Type.isStringFilled(source)) {
	      return source.replaceAll('\'', '%27');
	    }
	    return '';
	  }
	  static isAbsolutePath(path) {
	    return String(path).startsWith('/');
	  }
	  isHrefStartsWithAllowedScheme(sourceHref) {
	    return main_core.Type.isStringFilled(sourceHref) && new RegExp(`/^${this.getLinkSettings().allowedSchemes}/`).test(sourceHref);
	  }
	  assignDefaultUrlScheme(sourceHref) {
	    if (main_core.Type.isStringFilled(sourceHref)) {
	      const defaultScheme = this.getLinkSettings().defaultScheme;
	      return `${defaultScheme}://${sourceHref}`;
	    }
	    return '';
	  }
	  isShortLinkEnabled() {
	    const {
	      shortLink
	    } = this.getLinkSettings();
	    return main_core.Type.isPlainObject(shortLink) && shortLink.enabled === true && main_core.Type.isInteger(shortLink.maxLength);
	  }
	  makeSafeHref(sourceHref) {
	    if (main_core.Type.isStringFilled(sourceHref)) {
	      let preparedHref = HtmlFormatter.decodeAmpersand(sourceHref);
	      preparedHref = HtmlFormatter.decodeSquareBrackets(preparedHref);
	      preparedHref = HtmlFormatter.stripFormFeedCharacter(preparedHref);
	      preparedHref = HtmlFormatter.encodeSingleQuotes(preparedHref);
	      if (!HtmlFormatter.isAbsolutePath(preparedHref) && !this.isHrefStartsWithAllowedScheme(preparedHref)) {
	        preparedHref = this.assignDefaultUrlScheme(preparedHref);
	      }
	      return preparedHref;
	    }
	    return '';
	  }
	  setLinkSettings(settings) {
	    babelHelpers.classPrivateFieldLooseBase(this, _linkSettings)[_linkSettings] = {
	      ...settings
	    };
	  }
	  getLinkSettings() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _linkSettings)[_linkSettings];
	  }
	  setMentionSettings(settings) {
	    babelHelpers.classPrivateFieldLooseBase(this, _mentionSettings)[_mentionSettings] = {
	      ...settings
	    };
	  }
	  getMentionSettings() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _mentionSettings)[_mentionSettings];
	  }
	  getDefaultUnknownNodeCallback(options) {
	    return () => {
	      return new ui_bbcode_formatter.NodeFormatter({
	        name: 'unknown',
	        before({
	          node
	        }) {
	          const scheme = node.getScheme();
	          if (node.isVoid()) {
	            return scheme.createFragment({
	              children: [scheme.createText(node.getOpeningTag())]
	            });
	          }
	          return scheme.createFragment({
	            children: [scheme.createText(node.getOpeningTag()), ...node.getChildren(), scheme.createText(node.getClosingTag())]
	          });
	        },
	        convert() {
	          return document.createDocumentFragment();
	        }
	      });
	    };
	  }
	}

	exports.HtmlFormatter = HtmlFormatter;

}((this.BX.UI.BBCode.Formatter = this.BX.UI.BBCode.Formatter || {}),BX.UI.BBCode,BX,BX.UI.BBCode));
//# sourceMappingURL=html-formatter.bundle.js.map

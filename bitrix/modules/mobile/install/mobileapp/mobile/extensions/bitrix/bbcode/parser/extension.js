/**
 * Attention!
 * This file is generated automatically from the extension `ui.bbcode.parser`.
 * Any manual changes to this file are not allowed.
 *
 * If you need to make some changes, then make edits to the `ui.bbcode.parser`
 * and run the build using 'bitrix build'.
 * During the build, the code will be automatically ported to `bbcode/parser'.
 */

/** @module bbcode/parser */
jn.define('bbcode/parser', (require, exports, module) => {
	const {Type} = jn.require('type');
	const Model = jn.require('bbcode/model');
	const {BBCodeEncoder} = jn.require('bbcode/encoder');
	const {AstProcessor} = jn.require('bbcode/ast-processor');
	const {Linkify} = jn.require('linkify');

	function getByIndex(array, index) {
	  if (!Type.isArray(array)) {
	    throw new TypeError('array is not a array');
	  }
	  if (!Type.isInteger(index)) {
	    throw new TypeError('index is not a integer');
	  }
	  const preparedIndex = index < 0 ? array.length + index : index;
	  return array[preparedIndex];
	}

	class ParserScheme extends Model.BBCodeScheme {
	  getTagScheme(tagName) {
	    return new Model.BBCodeTagScheme({
	      name: 'any'
	    });
	  }
	  isAllowedTag(tagName) {
	    return true;
	  }
	  isChildAllowed(parent, child) {
	    return true;
	  }
	}

	const TAG_REGEX_GS = /\[(\/)?(\w+|\*)(.*?)]/gs;
	const LF = '\n';
	const CRLF = '\r\n';
	const TAB = '\t';
	const isLinebreak = symbol => {
	  return [LF, CRLF].includes(symbol);
	};
	const isTab = symbol => {
	  return symbol === TAB;
	};
	class BBCodeTokenizer {
	  static trimQuotes(value) {
	    const source = String(value);
	    if (/^["'].*["']$/g.test(source)) {
	      return source.slice(1, -1);
	    }
	    return value;
	  }
	  static toLowerCase(value) {
	    if (Type.isStringFilled(value)) {
	      return value.toLowerCase();
	    }
	    return value;
	  }
	  tokenize(bbcode) {
	    const tokens = [];
	    let lastIndex = 0;
	    bbcode.replace(TAG_REGEX_GS, (fullTag, slash, tagName, attrs, index) => {
	      if (index > lastIndex) {
	        const textBetween = bbcode.slice(lastIndex, index);
	        tokens.push(...this.parseText(textBetween));
	      }
	      const isOpeningTag = Boolean(slash) === false;
	      const startIndex = fullTag.length + index;
	      const attributes = this.parseAttributes(attrs);
	      const lowerCaseTagName = BBCodeTokenizer.toLowerCase(tagName);
	      if (isOpeningTag) {
	        const nextContent = bbcode.slice(startIndex);
	        const unclosed = !nextContent.includes(`[/${tagName}]`);
	        tokens.push({
	          type: 'OPEN_TAG',
	          name: lowerCaseTagName,
	          value: attributes.value,
	          attributes: Object.fromEntries(attributes.attributes),
	          unclosed
	        });
	      } else {
	        tokens.push({
	          type: 'CLOSE_TAG',
	          name: lowerCaseTagName
	        });
	      }
	      lastIndex = startIndex;
	    });
	    if (lastIndex < bbcode.length) {
	      const remainingText = bbcode.slice(lastIndex);
	      tokens.push(...this.parseText(remainingText));
	    }
	    return tokens;
	  }
	  parseText(text) {
	    const tokens = [];
	    if (Type.isStringFilled(text)) {
	      const regex = /\\r\\n|\\n|\\t|\\.|.|\r\n|\n|\t/g;
	      const matches = [...text.matchAll(regex)];
	      let textBuffer = '';
	      for (const match of matches) {
	        const char = match[0];
	        if (isLinebreak(char)) {
	          if (textBuffer) {
	            tokens.push({
	              type: 'TEXT',
	              content: textBuffer
	            });
	            textBuffer = '';
	          }
	          tokens.push({
	            type: 'LINEBREAK'
	          });
	        } else if (isTab(char)) {
	          if (textBuffer) {
	            tokens.push({
	              type: 'TEXT',
	              content: textBuffer
	            });
	            textBuffer = '';
	          }
	          tokens.push({
	            type: 'TAB'
	          });
	        } else {
	          textBuffer += char;
	        }
	      }
	      if (textBuffer) {
	        tokens.push({
	          type: 'TEXT',
	          content: textBuffer
	        });
	      }
	    }
	    return tokens;
	  }
	  parseAttributes(sourceAttributes) {
	    const result = {
	      value: '',
	      attributes: []
	    };
	    if (Type.isStringFilled(sourceAttributes)) {
	      if (sourceAttributes.startsWith('=')) {
	        result.value = BBCodeTokenizer.trimQuotes(sourceAttributes.slice(1));
	        return result;
	      }
	      return sourceAttributes.trim().split(' ').filter(Boolean).reduce((acc, item) => {
	        const [key, value = ''] = item.split('=');
	        acc.attributes.push([BBCodeTokenizer.toLowerCase(key), BBCodeTokenizer.trimQuotes(value)]);
	        return acc;
	      }, result);
	    }
	    return result;
	  }
	}

	const parserScheme = new ParserScheme();
	class BBCodeParser {
	  constructor(options = {}) {
	    this.allowedLinkify = true;
	    if (options.scheme) {
	      this.setScheme(options.scheme);
	    } else {
	      this.setScheme(new Model.DefaultBBCodeScheme());
	    }
	    if (Type.isFunction(options.onUnknown)) {
	      this.setOnUnknown(options.onUnknown);
	    } else {
	      this.setOnUnknown(BBCodeParser.defaultOnUnknownHandler);
	    }
	    if (options.encoder instanceof BBCodeEncoder) {
	      this.setEncoder(options.encoder);
	    } else {
	      this.setEncoder(new BBCodeEncoder());
	    }
	    if (Type.isBoolean(options.linkify)) {
	      this.setIsAllowedLinkify(options.linkify);
	    }
	  }
	  setScheme(scheme) {
	    this.scheme = scheme;
	  }
	  getScheme() {
	    return this.scheme;
	  }
	  setOnUnknown(handler) {
	    if (!Type.isFunction(handler)) {
	      throw new TypeError('handler is not a function');
	    }
	    this.onUnknownHandler = handler;
	  }
	  getOnUnknownHandler() {
	    return this.onUnknownHandler;
	  }
	  setEncoder(encoder) {
	    if (encoder instanceof BBCodeEncoder) {
	      this.encoder = encoder;
	    } else {
	      throw new TypeError('encoder is not BBCodeEncoder instance');
	    }
	  }
	  getEncoder() {
	    return this.encoder;
	  }
	  setIsAllowedLinkify(value) {
	    this.allowedLinkify = Boolean(value);
	  }
	  isAllowedLinkify() {
	    return this.allowedLinkify;
	  }
	  canBeLinkified(node) {
	    if (node.getName() === '#text') {
	      const notAllowedNodeNames = ['url', 'img', 'video', 'code'];
	      const inNotAllowedNode = notAllowedNodeNames.some(name => {
	        return Boolean(AstProcessor.findParentNodeByName(node, name));
	      });
	      return !inNotAllowedNode;
	    }
	    return false;
	  }
	  static defaultOnUnknownHandler(node, scheme) {
	    if (node.getType() === Model.BBCodeNode.ELEMENT_NODE) {
	      const nodeName = node.getName();
	      if (['left', 'center', 'right', 'justify'].includes(nodeName)) {
	        const newNode = scheme.createElement({
	          name: 'p'
	        });
	        node.replace(newNode);
	        newNode.setChildren(node.getChildren());
	      } else if (['background', 'color', 'size'].includes(nodeName)) {
	        const newNode = scheme.createElement({
	          name: 'b'
	        });
	        node.replace(newNode);
	        newNode.setChildren(node.getChildren());
	      } else if (['span', 'font'].includes(nodeName)) {
	        const fragment = scheme.createFragment({
	          children: node.getChildren()
	        });
	        node.replace(fragment);
	      } else {
	        const openingTag = node.getOpeningTag();
	        const closingTag = node.getClosingTag();
	        node.replace(scheme.createText(openingTag), ...node.getChildren(), scheme.createText(closingTag));
	      }
	    }
	  }
	  decodeAttributes(sourceAttributes) {
	    if (Type.isArrayFilled(sourceAttributes)) {
	      return sourceAttributes.map(([key, value]) => {
	        return [key, this.getEncoder().decodeAttribute(value)];
	      });
	    }
	    return sourceAttributes;
	  }
	  normalizeTokens(tokens) {
	    const result = [];
	    const stack = [];
	    const getLastListTokenIndex = () => {
	      for (let i = stack.length - 1; i >= 0; i--) {
	        if (stack[i].name.toLowerCase() === 'list') {
	          return stack[i].tokenIndex;
	        }
	      }
	      return -1;
	    };
	    const popAndClose = () => {
	      const entry = stack.pop();
	      if (!entry) {
	        return;
	      }
	      const token = result[entry.tokenIndex];
	      if ((token == null ? void 0 : token.type) === 'OPEN_TAG') {
	        token.unclosed = false;
	      }
	      result.push({
	        type: 'CLOSE_TAG',
	        name: entry.name,
	        autoClosed: true
	      });
	    };
	    for (const token of tokens) {
	      if (token.type === 'OPEN_TAG') {
	        const {
	          name,
	          value = '',
	          attributes = {},
	          unclosed = false
	        } = token;
	        const tagScheme = this.getScheme().getTagScheme(name);
	        const isVoid = tagScheme && tagScheme.isVoid();
	        const isBlock = tagScheme && tagScheme.hasGroup('#block');
	        if (isBlock) {
	          // Автозакрытие только тегов с unclosed: true перед блочным тегом,
	          // но НЕ закрывать [*] из других списков
	          while (stack.length > 0) {
	            const topOfStack = stack[stack.length - 1];
	            const tokenInResult = result[topOfStack.tokenIndex];

	            // Проверяем, является ли верхний тег в стеке unclosed
	            if ((tokenInResult == null ? void 0 : tokenInResult.type) === 'OPEN_TAG' && tokenInResult.unclosed === true) {
	              // Защита: не закрывать [*], если он принадлежит другому списку
	              if (topOfStack.name === '*' && topOfStack.nearestListTokenIndex !== -1) {
	                // Прерываем автозакрытие, если тег [*] относится к списку
	                break;
	              }
	              popAndClose(); // Закрываем его
	            } else {
	              // Если тег не OPEN_TAG или не unclosed, останавливаем закрытие
	              break;
	            }
	          }
	        }
	        let shouldAddToStack = !isVoid;
	        if (name === '*') {
	          const lastListIdx = getLastListTokenIndex();
	          if (lastListIdx === -1) {
	            shouldAddToStack = false;
	          } else {
	            // Логика для [*] внутри списка
	            let prevStarIndex = -1;
	            for (let i = stack.length - 1; i >= 0; i--) {
	              if (stack[i].name === '*' && stack[i].nearestListTokenIndex === lastListIdx) {
	                prevStarIndex = i;
	                break;
	              }
	            }
	            if (prevStarIndex !== -1) {
	              while (stack.length - 1 >= prevStarIndex) {
	                popAndClose();
	              }
	            }
	          }
	        }
	        result.push({
	          type: 'OPEN_TAG',
	          name,
	          value,
	          attributes: {
	            ...attributes
	          },
	          unclosed
	        });
	        if (shouldAddToStack) {
	          stack.push({
	            name,
	            tokenIndex: result.length - 1,
	            nearestListTokenIndex: getLastListTokenIndex()
	          });
	        }
	      } else if (token.type === 'CLOSE_TAG') {
	        const {
	          name
	        } = token;
	        let matchIdx = -1;
	        for (let i = stack.length - 1; i >= 0; i--) {
	          if (stack[i].name === name) {
	            matchIdx = i;
	            break;
	          }
	        }
	        if (matchIdx === -1) {
	          result.push({
	            type: 'CLOSE_TAG',
	            name,
	            orphaned: true
	          });
	        } else {
	          while (stack.length - 1 > matchIdx) {
	            popAndClose();
	          }
	          stack.pop();
	          result.push({
	            type: 'CLOSE_TAG',
	            name
	          });
	        }
	      } else {
	        result.push(token);
	      }
	    }
	    while (stack.length > 0) {
	      popAndClose();
	    }
	    return result;
	  }
	  parse(bbcode) {
	    const result = parserScheme.createRoot();
	    const stack = [result];
	    const wasOpened = [];
	    let level = 0;
	    const tokenizer = new BBCodeTokenizer();
	    const tokens = this.normalizeTokens(tokenizer.tokenize(bbcode));
	    tokens.forEach(token => {
	      const parent = stack[level];
	      switch (token.type) {
	        case 'OPEN_TAG':
	          {
	            const tagScheme = this.getScheme().getTagScheme(token.name);
	            const isVoidTag = tagScheme && tagScheme.isVoid();
	            if (isVoidTag) {
	              const voidNode = parserScheme.createElement({
	                name: token.name,
	                value: this.getEncoder().decodeAttribute(token.value),
	                attributes: this.decodeAttributes(token.attributes)
	              });
	              voidNode.setScheme(this.getScheme());
	              parent.appendChild(voidNode);
	            } else if (token.unclosed) {
	              parent.appendChild(parserScheme.createText(`[${token.name}]`));
	            } else {
	              const currentNode = parserScheme.createElement({
	                name: token.name,
	                value: this.getEncoder().decodeAttribute(token.value),
	                attributes: this.decodeAttributes(token.attributes)
	              });
	              parent.appendChild(currentNode);
	              wasOpened.push(token.name);
	              stack.push(currentNode);
	              level++;
	            }
	            break;
	          }
	        case 'CLOSE_TAG':
	          {
	            if (wasOpened.includes(token.name)) {
	              const openedTagIndex = wasOpened.indexOf(token.name);
	              wasOpened.splice(openedTagIndex, 1);
	              stack.pop();
	              level--;
	            } else {
	              parent.appendChild(parserScheme.createText(`[/${token.name}]`));
	            }
	            break;
	          }
	        case 'TEXT':
	          {
	            parent.appendChild(parserScheme.createText({
	              content: this.getEncoder().decodeText(token.content)
	            }));
	            break;
	          }
	        case 'LINEBREAK':
	          {
	            parent.appendChild(parserScheme.createNewLine());
	            break;
	          }
	        case 'TAB':
	          {
	            parent.appendChild(parserScheme.createTab());
	            break;
	          }
	        default:
	          {
	            break;
	          }
	      }
	    });
	    const getFinalLineBreaksIndexes = node => {
	      let skip = false;
	      return node.getChildren().reduceRight((acc, child, index) => {
	        if (!skip && child.getName() === '#linebreak') {
	          acc.push(index);
	        } else if (!skip && child.getName() !== '#tab') {
	          skip = true;
	        }
	        return acc;
	      }, []);
	    };
	    Model.BBCodeNode.flattenAst(result).forEach(node => {
	      if (node.getName() === '*') {
	        const finalLinebreaksIndexes = getFinalLineBreaksIndexes(node);
	        if (finalLinebreaksIndexes.length === 1) {
	          node.setChildren(node.getChildren().slice(0, getByIndex(finalLinebreaksIndexes, 0)));
	        }
	        if (finalLinebreaksIndexes.length > 1 && (finalLinebreaksIndexes & 2) === 0) {
	          node.setChildren(node.getChildren().slice(0, getByIndex(finalLinebreaksIndexes, 0)));
	        }
	      }
	      if (this.isAllowedLinkify() && this.canBeLinkified(node)) {
	        const content = node.toString({
	          encode: false
	        });
	        const MultiTokens = Linkify.tokenize(content);
	        const nodes = MultiTokens.map(token => {
	          if (token.t === 'url') {
	            return parserScheme.createElement({
	              name: 'url',
	              value: token.toHref().replace(/^http:\/\//, 'https://'),
	              children: [parserScheme.createText(token.toString())]
	            });
	          }
	          if (token.t === 'email') {
	            return parserScheme.createElement({
	              name: 'url',
	              value: token.toHref(),
	              children: [parserScheme.createText(token.toString())]
	            });
	          }
	          return parserScheme.createText(token.toString());
	        });
	        node.replace(...nodes);
	      }
	    });
	    Model.BBCodeNode.flattenAst(result).forEach(node => {
	      const tagScheme = this.getScheme().getTagScheme(node);
	      if (tagScheme) {
	        tagScheme.runOnParseHandler(node);
	      }
	    });
	    result.setScheme(this.getScheme(), this.getOnUnknownHandler());
	    return result;
	  }
	}

	exports.BBCodeParser = BBCodeParser;

});
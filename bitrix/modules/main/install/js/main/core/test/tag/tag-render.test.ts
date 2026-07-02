import parseTag from '../../src/lib/tag/internal/parse-tag';
import parseText from '../../src/lib/tag/internal/parse-text';
import {Tag, Text} from '../../src/core';

function performanceTest(callback: () => void, count = 10)
{
	const times = Array.from({length: count - 1}, () => {
		const startTime = +new Date();
		callback();
		const endTime = +new Date();
		return endTime - startTime
	});

	const min = Math.min(...times);
	const max = Math.max(...times);
	const iterations = times.length + 1;
	const total = times.reduce((acc, time) => acc + time, 0);
	const avg = total / iterations;

	return {min, max, avg, total, iterations};
}

describe('tag/render', () => {
	describe('tag/render/parseTag', () => {
		it('Div without attributes', () => {
			const result1 = parseTag(`<div>`);
			assert.deepEqual(
				result1,
				{
					type: 'tag',
					name: 'div',
					svg: false,
					attrs: {},
					children: [],
					voidElement: false,
				},
			);
		});

		it('Div with attributes', () => {
			const result1 = parseTag(`<div class="class1 class-2 classThree" data-test="1" disabled>`);
			assert.deepEqual(
				result1,
				{
					type: 'tag',
					name: 'div',
					svg: false,
					attrs: {
						class: 'class1 class-2 classThree',
						'data-test': '1',
						disabled: '',
					},
					children: [],
					voidElement: false,
				},
			);
		});

		it('Div with attributes and multiline formatting', () => {
			const result1 = parseTag(
				`<div 
					class="class1 class-2 classThree" 
					data-test="1"
					disabled
				>`,
			);
			assert.deepEqual(
				result1,
				{
					type: 'tag',
					name: 'div',
					svg: false,
					attrs: {
						class: 'class1 class-2 classThree',
						'data-test': '1',
						disabled: '',
					},
					children: [],
					voidElement: false,
				},
			)
		});

		it('Void elements without attributes', () => {
			const result1 = parseTag(`<br>`);
			assert.deepEqual(
				result1,
				{
					type: 'tag',
					name: 'br',
					svg: false,
					attrs: {},
					children: [],
					voidElement: true,
				},
			);

			const result2 = parseTag(`</br>`);
			assert.deepEqual(
				result2,
				{
					type: 'tag',
					name: 'br',
					svg: false,
					attrs: {},
					children: [],
					voidElement: true,
				},
			);
		});

		it('Void element with attributes', () => {
			const result1 = parseTag(`<hr style="border: none;">`);
			assert.deepEqual(
				result1,
				{
					type: 'tag',
					name: 'hr',
					svg: false,
					attrs: {
						style: 'border: none;',
					},
					children: [],
					voidElement: true,
				},
			)
		});

		it('Html comment', () => {
			const result1 = parseTag(`<!-- Test comment -->`);
			assert.deepEqual(
				result1,
				{
					type: 'comment',
					content: ' Test comment '
				},
			)
		});
	});

	describe('tag/render/parseText', () => {
		it('Text with substitutions', () => {
			const result = parseText(
				`Text1 {{uid1}}text2{{uid2}} text3 {{uid3}}`,
			);

			assert.deepEqual(
				result,
				[
					{type: 'text', content: 'Text1 '},
					{type: 'placeholder', uid: 1},
					{type: 'text', content: 'text2'},
					{type: 'placeholder', uid: 2},
					{type: 'text', content: ' text3 '},
					{type: 'placeholder', uid: 3},
				],
			);
		});

		it('Text with substitutions multiline', () => {
			const result = parseText(
				`Text1 {{uid1}}
				text2{{uid2}}
				text3
				{{uid3}}`,
			);

			assert.deepEqual(
				result,
				[
					{type: 'text', content: 'Text1 '},
					{type: 'placeholder', uid: 1},
					{type: 'text', content: 'text2'},
					{type: 'placeholder', uid: 2},
					{type: 'text', content: 'text3'},
					{type: 'placeholder', uid: 3},
				],
			);
		});

		it('Text only multiline', () => {
			const result = parseText(
				`Test
				text
				only`,
			);

			assert.deepEqual(
				result,
				[
					{type: 'text', content: 'Test'},
					{type: 'text', content: 'text'},
					{type: 'text', content: 'only'},
				],
			);
		});

		it('Substitutions only', () => {
			const result = parseText(
				`{{uid1}}{{uid2}}{{uid3}}`,
			);

			assert.deepEqual(
				result,
				[
					{type: 'placeholder', uid: 1},
					{type: 'placeholder', uid: 2},
					{type: 'placeholder', uid: 3},
				],
			);
		});

		it('Substitutions only multiline', () => {
			const result = parseText(
				`{{uid1}}
				{{uid2}}
				{{uid3}}`,
			);

			assert.deepEqual(
				result,
				[
					{type: 'placeholder', uid: 1},
					{type: 'placeholder', uid: 2},
					{type: 'placeholder', uid: 3},
				],
			);
		});
	});

	describe('render', () => {
		it('Should render single element template', () => {
			let result = Tag.render`
				<div class="name"></div>
			`;

			assert(result.className === 'name');
		});

		it('Should render multiple elements template', () => {
			let result = Tag.render`
				<div class="name"></div>
				<div class="name"></div>
				<div class="name"></div>
			`;

			assert(Array.isArray(result) && result.length === 3);
		});

		it('Should render head entry', () => {
			let result = Tag.render`
				<script></script>
			`;

			assert(result.tagName === 'SCRIPT');
		});

		it('Should render multiple head entries', () => {
			let result = Tag.render`
				<script></script>
				<meta charset="utf-8">
				<title>test</title>
			`;

			assert(Array.isArray(result) && result.length === 3);
			assert(result[0].tagName === 'SCRIPT');
			assert(result[1].tagName === 'META');
			assert(result[2].tagName === 'TITLE');
		});

		it('Should support include elements', () => {
			const childElement = document.createElement('div');
			const element = Tag.render`
				<div>
					${childElement}
				</div>
			`;

			assert(element.children[0] === childElement);
		});

		it('Should support include array of elements', () => {
			const childElement1 = document.createElement('div');
			const childElement2 = document.createElement('div');

			const elements = [
				childElement1,
				childElement2
			];

			const element = Tag.render`
				<div>
					${elements}
				</div>
			`;

			assert(element.children.length === 2);
			assert(element.children[0] === elements[0]);
			assert(element.children[1] === elements[1]);
		});

		it('Should add event listener from attribute', () => {
			const spy = sinon.spy();
			const element = Tag.render`
				<div onclick="${spy}"></div>
			`;

			element.click();

			assert.ok(spy.calledOnce);
			assert.ok(!element.outerHTML.includes('onclick'));
		});

		it('Should add event listeners from multiline declaration', () => {
			const spy = sinon.spy();
			const element = Tag.render`
				<div
					onclick="${spy}"
				></div>
			`;

			element.click();

			assert.ok(spy.calledOnce);
			assert.ok(!element.outerHTML.includes('onclick'));
		});

		it('Should interpolate string substitution inside an inline event handler', () => {
			const url = '/online/';
			const element = Tag.render`
				<button onclick="BX.SidePanel.Instance.open('${url}')">TEST!!!</button>
			`;

			assert.ok(element.getAttribute('onclick') === `BX.SidePanel.Instance.open('/online/')`);
			assert.ok(element.textContent === 'TEST!!!');
		});

		it('Should interpolate multiple substitutions inside an inline event handler', () => {
			const entityId = 42;
			const action = 'open';
			const element = Tag.render`
				<button onclick="doSomething('${action}', ${entityId})">Click</button>
			`;

			assert.ok(element.getAttribute('onclick') === `doSomething('open', 42)`);
		});

		it('Should set string substitution as an inline event handler', () => {
			const code = 'window.__tagRenderInlineHandlerCalled = true';
			const element = Tag.render`
				<button onclick="${code}">Click</button>
			`;

			assert.ok(element.getAttribute('onclick') === code);

			element.click();

			assert.ok(window.__tagRenderInlineHandlerCalled === true);
			delete window.__tagRenderInlineHandlerCalled;
		});

		it('Should bind function when the placeholder is surrounded by whitespace', () => {
			const spy = sinon.spy();
			const element = Tag.render`
				<div onclick=" ${spy} "></div>
			`;

			element.click();

			assert.ok(spy.calledOnce);
			assert.ok(!element.outerHTML.includes('onclick'));
		});

		it('Should set string substitution surrounded by whitespace as an inline event handler', () => {
			const code = 'window.__tagRenderInlineHandlerWithSpacesCalled = true';
			const element = Tag.render`
				<button onclick=" ${code} ">Click</button>
			`;

			assert.ok(element.getAttribute('onclick') === code);

			element.click();

			assert.ok(window.__tagRenderInlineHandlerWithSpacesCalled === true);
			delete window.__tagRenderInlineHandlerWithSpacesCalled;
		});

		it('Should not matches attribute value', () => {
			const onclick = () => null;
			const onabort = () => null;

			const element = Tag.render`
				<input 
					type="text"
					class="test"
					value="${Text.encode(`"  onerror`)}"
					data-value="${Text.encode(`" onerror`)}"
					onclick="${onclick}"
					onabort="${onabort}"
					onautocomplete=""
				>
			`;

			assert.ok(element.value === `"  onerror`, 'attr#value');
			assert.ok(element.getAttribute('data-value') === `" onerror`, 'attr#data-value');
			assert.ok(element.hasAttribute('onclick') === false, 'attr#onclick');
			assert.ok(element.hasAttribute('onabort') === false, 'attr#onabort');
			assert.ok(element.hasAttribute('onautocomplete') === true, 'attr#onautocomplete');
		});

		it('Should works with comments', () => {
			const result = Tag.render`
				<div>
					<!--Comment-->
					<!-- Comment2 -->
					<!--<div></div>-->
					<!--<div>
						<span></span>
					</div>-->
				</div>
			`;

			assert.ok(
				result.outerHTML,
				`<div><!--Comment--><!-- Comment2 --><!--<div></div>--><!--<div><span></span></div>--></div>`,
			);
		});

		it('Tag with multiline attribute value', () => {
			const element = Tag.render`
				<div class="class1
					class2
					class3
					class4"
					data-test="11">Test</div>
			`;

			assert.equal(
				element.outerHTML,
				`<div class="class1
class2
class3
class4" data-test="11">Test</div>`
			);
		});

		it('Layout with comment', () => {
			const getElement3 = () => Tag.render`<div class="element3"></div>`;
			const element = Tag.render`
				<div class="container">
					<div class="inner">
						<div class="element1"></div>
						<!--<div class="element2"></div>-->
						${getElement3()}
						<div class="element4"></div>
					</div>
				</div>
			`;

			assert.equal(
				element.outerHTML,
				`<div class="container"><div class="inner"><div class="element1"></div><!--<div class="element2"></div>--><div class="element3"></div><div class="element4"></div></div></div>`,
			);
		});

		it('Link', () => {
			const element = Tag.render`
				<a href="/workgroups/group/1/tasks/?tab=plan">Test link</a>
			`;

			assert.equal(
				element.outerHTML,
				'<a href="/workgroups/group/1/tasks/?tab=plan">Test link</a>',
			);
		});

		it('Placeholder only', () => {
			const childElement = document.createElement('div');
			const element = Tag.render`${childElement}`;
			assert.equal(element.outerHTML, '<div></div>');

			const childElement2 = document.createElement('div');
			const element2 = Tag.render`
				${childElement2}
			`;
			assert.equal(element2.outerHTML, '<div></div>');
		});

		it('Should works with any placeholders value', () => {
			const element1 = Tag.render`
				<input type="text" value="${{v: 1}}"/>
			`;
			assert.equal(
				element1.outerHTML,
				'<input type="text" value="[object Object]">',
			);

			const element2 = Tag.render`
				<input type="text" value="${[1, 2]}"/>
			`;
			assert.equal(
				element2.outerHTML,
				'<input type="text" value="1,2">',
			);

			const element3 = Tag.render`
				<input type="text" value="${1}"/>
			`;
			assert.equal(
				element3.outerHTML,
				'<input type="text" value="1">',
			);

			const element4 = Tag.render`
				<input type="text" value="${'1'}"/>
			`;
			assert.equal(
				element4.outerHTML,
				'<input type="text" value="1">',
			);
		});

		it('Should works with once events', () => {
			const spy = sinon.spy();
			const element = Tag.render`
				<span onclickonce="${spy}"></span>
			`;

			element.click();
			element.click();

			assert.ok(spy.calledOnce);
		});

		it('Should works with template tag', () => {
			const element = Tag.render`
				<div>
					<template id="template">
						<div class="template-content-1">
							<span>Test 1</span>
						</div>
						Any test text 2
						<span>Test 3</span>
					</template>
				</div>
			`;

			assert.ok(element.tagName === 'DIV', 'Root element is not a div');
			assert.ok(element.firstChild.tagName === 'TEMPLATE', 'First child is not a template');
			assert.ok(element.firstChild.content.childNodes[0].tagName === 'DIV');
			assert.ok(element.firstChild.content.childNodes[0].innerHTML === '<span>Test 1</span>');
			assert.ok(element.firstChild.content.childNodes[1].nodeType === 3);
			assert.ok(element.firstChild.content.childNodes[2].tagName === 'SPAN');
			assert.ok(element.firstChild.content.childNodes[2].textContent === 'Test 3');
		});

		it('Should works with svg void elements', () => {
			const element = Tag.render`
				<div>
					000
					<div class="main-file-input-camera-block-image">
						111
						<div class="main-file-input-user-loader-item">
							<div class="main-file-input-loader">
								<svg class="main-file-input-circular" viewBox="25 25 50 50">
									<circle class="main-file-input-path" cx="50" cy="50" r="20" fill="none" stroke-width="1" stroke-miterlimit="10"/>
								</svg>
							</div>
						</div>
						222
						<div class="main-file-input-error">
							<span>
								test1
							</span>
							<span data-bx-role="tab-camera-error"></span>
						</div>
						333
						<div class="main-file-input-camera-block-image-inner">
							<video autoplay></video>
						</div>
					</div>
					444
					<div class="main-file-input-button-layout" data-bx-role="camera-button">
						<div class="main-file-input-button">
							<span class="main-file-input-button-icon"></span>
						</div>
					</div>
				</div>
			`;

			assert.ok(element.childNodes[0].nodeType === 3);
			assert.ok(element.childNodes[0].textContent === '000');
			assert.ok(element.querySelector('.main-file-input-camera-block-image'));
			assert.ok(element.querySelector('.main-file-input-camera-block-image').childNodes[0].nodeType === 3);
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-user-loader-item'));
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-user-loader-item > .main-file-input-loader'));
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-user-loader-item > .main-file-input-loader > .main-file-input-circular'));
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-user-loader-item > .main-file-input-loader > .main-file-input-circular > .main-file-input-path'));

			assert.ok(element.querySelector('.main-file-input-camera-block-image').childNodes[2].nodeType === 3);
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-error'));
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-error').firstChild.tagName === 'SPAN');
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-error').lastChild.tagName === 'SPAN');

			assert.ok(element.querySelector('.main-file-input-camera-block-image').childNodes[4].nodeType === 3);
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-camera-block-image-inner'));
			assert.ok(element.querySelector('.main-file-input-camera-block-image > .main-file-input-camera-block-image-inner > video'));

			assert.ok(element.childNodes[2].textContent === '444');
			assert.ok(element.querySelector('.main-file-input-button-layout'));
			assert.ok(element.querySelector('.main-file-input-button-layout > .main-file-input-button'));
			assert.ok(element.querySelector('.main-file-input-button-layout > .main-file-input-button > .main-file-input-button-icon'));
		});

		it('Should works with bad characters', () => {
			const element1 = Tag.render`
				<div title="${Text.encode('"><b>xss</b>')}"></div>
			`;
			assert.equal(
				element1.outerHTML,
				`<div title="&quot;&gt;&lt;b&gt;xss&lt;/b&gt;"></div>`,
			);

			const element2 = Tag.render`
				<div title="${Text.encode(JSON.stringify({test: '2'}))}"></div>
			`;
			assert.equal(
				element2.outerHTML,
				`<div title="{&quot;test&quot;:&quot;2&quot;}"></div>`,
			);
		});

		it('Should works with style tag', () => {
			const element = Tag.render`
				<style>body {padding: 20px;}</style>
			`;

			assert.ok(element instanceof global.window.HTMLStyleElement);
			assert.equal(
				element.outerHTML,
				`<style>body {padding: 20px;}</style>`,
			);
		});

		it('Should works with any attributes formatting (double quotes)', () => {
			const element = Tag.render`
				<div
					data-test="testValue"
					data-test2 = "testValue2"
					data-url="/workgroups/group/1/tasks/?tab=plan"
					data-url-2 = "/workgroups/group/1/tasks/?tab=plan2"
					style="background-image: url('/image.svg'); opacity: 0.35;"
					title="title1"
					title2 = "title2"
					role=
						"alert"
					data-role = 
						"test"
					class="class1
						class2
						class3
					class4
					class5"
					checked
				>Any text</div>
			`;

			assert.ok(element.tagName === 'DIV');
			assert.ok(element.innerHTML === 'Any text');

			assert.ok(element.getAttribute('data-test') === 'testValue');
			assert.ok(element.getAttribute('data-test2') === 'testValue2');
			assert.ok(element.getAttribute('data-url') === '/workgroups/group/1/tasks/?tab=plan');
			assert.ok(element.getAttribute('data-url-2') === '/workgroups/group/1/tasks/?tab=plan2');
			assert.ok(element.getAttribute('title') === 'title1');
			assert.ok(element.getAttribute('title2') === 'title2');
			assert.ok(element.getAttribute('role') === 'alert');
			assert.ok(element.getAttribute('data-role') === 'test');
			assert.ok(element.getAttribute('class') === 'class1\nclass2\nclass3\nclass4\nclass5');
			assert.ok(element.getAttribute('checked') === '');
			assert.ok(element.style.backgroundImage === 'url("/image.svg")');
			assert.ok(element.style.opacity === '0.35');
		});

		it('Should works with any attributes formatting (single quotes)', () => {
			const element = Tag.render`
				<div
					data-test='testValue'
					data-test2 = 'testValue2'
					data-url='/workgroups/group/1/tasks/?tab=plan'
					data-url-2 = '/workgroups/group/1/tasks/?tab=plan2'
					style='background-image: url("/image.svg"); opacity: 0.35;'
					title='title1'
					title2 = 'title2'
					role=
						'alert'
					data-role = 
						'test'
					class='class1
						class2
						class3
					class4
					class5'
					checked
				>Any text</div>
			`;

			assert.ok(element.tagName === 'DIV');
			assert.ok(element.innerHTML === 'Any text');

			assert.ok(element.getAttribute('data-test') === 'testValue');
			assert.ok(element.getAttribute('data-test2') === 'testValue2');
			assert.ok(element.getAttribute('data-url') === '/workgroups/group/1/tasks/?tab=plan');
			assert.ok(element.getAttribute('data-url-2') === '/workgroups/group/1/tasks/?tab=plan2');
			assert.ok(element.getAttribute('title') === 'title1');
			assert.ok(element.getAttribute('title2') === 'title2');
			assert.ok(element.getAttribute('role') === 'alert');
			assert.ok(element.getAttribute('data-role') === 'test');
			assert.ok(element.getAttribute('class') === 'class1\nclass2\nclass3\nclass4\nclass5');
			assert.ok(element.getAttribute('checked') === '');
			assert.ok(element.style.backgroundImage === 'url("/image.svg")');
			assert.ok(element.style.opacity === '0.35');
		});

		it('Should works with any attributes formatting (void element)', () => {
			const element = Tag.render`
				<hr
					data-test='testValue'
					data-test2 = 'testValue2'
					data-url='/workgroups/group/1/tasks/?tab=plan'
					data-url-2 = '/workgroups/group/1/tasks/?tab=plan2'
					title='title1'
					title2 = 'title2'
					role=
						'alert'
					data-role = 
						'test'
					class='class1
						class2
						class3
					class4
					class5'
					checked
				>
			`;

			assert.ok(element.tagName === 'HR');

			assert.ok(element.getAttribute('data-test') === 'testValue');
			assert.ok(element.getAttribute('data-test2') === 'testValue2');
			assert.ok(element.getAttribute('data-url') === '/workgroups/group/1/tasks/?tab=plan');
			assert.ok(element.getAttribute('data-url-2') === '/workgroups/group/1/tasks/?tab=plan2');
			assert.ok(element.getAttribute('title') === 'title1');
			assert.ok(element.getAttribute('title2') === 'title2');
			assert.ok(element.getAttribute('role') === 'alert');
			assert.ok(element.getAttribute('data-role') === 'test');
			assert.ok(element.getAttribute('class') === 'class1\nclass2\nclass3\nclass4\nclass5');
		});

		it('Should works with any attributes formatting (svg void element)', () => {
			const element = Tag.render`
				<svg>
					<path
						d=""
						data-test='testValue'
						data-test2 = 'testValue2'
						data-url='/workgroups/group/1/tasks/?tab=plan'
						data-url-2 = '/workgroups/group/1/tasks/?tab=plan2'
						title='title1'
						title2 = 'title2'
						role=
							'alert'
						data-role = 
							'test'
						class='class1
							class2
							class3
						class4
						class5'
						checked
					/>
				</svg>
			`;

			assert.ok(element.tagName === 'svg');

			const child = element.firstChild;
			assert.ok(child.tagName === 'path');

			assert.ok(child.getAttribute('data-test') === 'testValue');
			assert.ok(child.getAttribute('data-test2') === 'testValue2');
			assert.ok(child.getAttribute('data-url') === '/workgroups/group/1/tasks/?tab=plan');
			assert.ok(child.getAttribute('data-url-2') === '/workgroups/group/1/tasks/?tab=plan2');
			assert.ok(child.getAttribute('title') === 'title1');
			assert.ok(child.getAttribute('title2') === 'title2');
			assert.ok(child.getAttribute('role') === 'alert');
			assert.ok(child.getAttribute('data-role') === 'test');
			assert.ok(child.getAttribute('class') === 'class1\nclass2\nclass3\nclass4\nclass5');
		});

		it('Should works with any allowed attribute names', () => {
			const element = Tag.render`
				<div xml:lang="ru" my:custom dot.name="val2" dot.test data-test_name="val1">Any text</div>
			`;

			assert.ok(element.tagName === 'DIV');
			assert.ok(element.getAttribute('xml:lang') === 'ru');
			assert.ok(element.getAttribute('my:custom') === '');
			assert.ok(element.getAttribute('dot.name') === 'val2');
			assert.ok(element.getAttribute('dot.test') === '');
			assert.ok(element.getAttribute('data-test_name') === 'val1');
		});

		it('Should works with mixed attribute value', () => {
			const class3 = undefined;
			const class4 = 'class4';
			const class5 = 'class5';
			const element = Tag.render`
				<div class="test1 test2 uid1
					${class3} ${class4} ${class5}">
					<span>test</span>
				</div>
			`;

			assert.equal(
				element.outerHTML,
				`<div class="test1 test2 uid1
undefined class4 class5"><span>test</span></div>`
			);
		});

		describe('render svg', () => {
			it('Should render svg element', () => {
				const result = Tag.render`
					<svg class="main-ui-loader-svg" viewBox="25 25 50 50">
						<circle class="main-ui-loader-svg-circle" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10">
					</svg>
				`;

				assert.ok(result instanceof window.SVGSVGElement, 'Result is not a SVGSVGElement');
				assert.ok(result.attributes.class.nodeValue === 'main-ui-loader-svg', 'Invalid class attribute');
				assert.ok(result.attributes.viewBox.nodeValue === '25 25 50 50', 'Invalid viewBox attribute');
				assert.ok(result.children.length === 1, 'Result contains more than one child');
				assert.ok(result.children[0] instanceof window.SVGElement, 'First child is not a SVGElement');
				assert.ok(result.children[0].nodeName === 'circle', 'First child node name is not a circle');
				assert.ok(result.children[0].attributes.class.nodeValue === 'main-ui-loader-svg-circle', 'Invalid class attribute of children');
				assert.ok(result.children[0].attributes.cx.nodeValue === '50', 'Invalid cx attribute');
				assert.ok(result.children[0].attributes.cy.nodeValue === '50', 'Invalid cy attribute');
				assert.ok(result.children[0].attributes.r.nodeValue === '20', 'Invalid r attribute');
				assert.ok(result.children[0].attributes.fill.nodeValue === 'none', 'Invalid fill attribute');
				assert.ok(result.children[0].attributes['stroke-miterlimit'].nodeValue === '10', 'Invalid strokeMiterlimit attribute');
			});
		});

		describe('Performance', () => {
			it('Should be create 2000 simple items in no more than 100 milliseconds (avg)', () => {
				const times = performanceTest(() => {
					Array.from({length: 2000}, (value) => {
						Tag.render` 
							<div class="my-class-${value}"></div>
						`;
					});
				});

				assert.ok(times.avg <= 100);
			});

			it('Should be create 300 big items in no more than 400 milliseconds (avg)', () => {
				const times = performanceTest(() => {
					Array.from({length: 300}, (value) => {
						Tag.render`
							<div class="my-class-${value}">
								<div class="inner">
									<span class="title-${value}" data-value="${value}"></span>
									<span class="descr-${value}" data-value2="${value}"></span>
									<span 
										class="ui-btn"
										onclick="${() => {}}"
										onmousedown="${() => {}}"
										onmouseenter="${() => {}}"
										onmouseleave="${() => {}}"
									>Click Me</span>
									<table>
										<thead>
											<th>
												<td>Col 1</td>
												<td>Col 2</td>
												<td>Col 3</td>
											</th>
										</thead>
										<tbody>
											<tr>
												<td>Data 1</td>
												<td>Data 2</td>
												<td>Data 3</td>
											</tr>
											<tr>
												<td>Data 1</td>
												<td>Data 2</td>
												<td>Data 3</td>
											</tr>
											<tr>
												<td>Data 1</td>
												<td>Data 2</td>
												<td>Data 3</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						`;
					});
				});

				assert.ok(times.avg <= 300);
			});
		});

		describe('Attribute XSS protection', () => {
			it('Should escape string substitution inside double-quoted attribute value', () => {
				const value = '">aaaaa';
				const element = Tag.render`<div data-test="${value}"></div>`;

				assert.equal(element.tagName, 'DIV');
				assert.equal(element.getAttribute('data-test'), value);
				assert.equal(element.children.length, 0);
				assert.equal(element.textContent, '');
			});

			it('Should escape string substitution inside single-quoted attribute value', () => {
				const value = "'><img src=x onerror=alert(1)>";
				const element = Tag.render`<div data-test='${value}'></div>`;

				assert.equal(element.tagName, 'DIV');
				assert.equal(element.getAttribute('data-test'), value);
				assert.equal(element.children.length, 0);
			});

			it('Should escape number substitution inside attribute value', () => {
				const element = Tag.render`<div data-id="${42}"></div>`;

				assert.equal(element.getAttribute('data-id'), '42');
			});

			it('Should escape string substitution mixed with literal text inside attribute', () => {
				const cls = '" onmouseover="alert(1)';
				const element = Tag.render`<div class="prefix ${cls} suffix"></div>`;

				assert.equal(element.getAttribute('class'), `prefix ${cls} suffix`);
				assert.isFalse(element.hasAttribute('onmouseover'));
			});

			it('Should still allow inlining string substitutions outside attribute values', () => {
				const element = Tag.render`<div>${'<span class="inner"></span>'}</div>`;

				assert.equal(element.children.length, 1);
				assert.equal(element.children[0].tagName, 'SPAN');
				assert.equal(element.children[0].getAttribute('class'), 'inner');
			});
		});

		describe('Attribute context detection', () => {
			it('Should treat multiple string substitutions inside one attribute value as attribute parts', () => {
				const a = '" onerror="1';
				const b = "' onerror='2";
				const c = '<script>alert(1)</script>';
				const element = Tag.render`<div class="${a} ${b} ${c}"></div>`;

				assert.equal(element.getAttribute('class'), `${a} ${b} ${c}`);
				assert.isFalse(element.hasAttribute('onerror'));
				assert.equal(element.children.length, 0);
			});

			it('Should not confuse double quote nested inside single-quoted attribute', () => {
				const value = 'safe">attack';
				const element = Tag.render`<div title='a"b' data-x="${value}"></div>`;

				assert.equal(element.getAttribute('title'), 'a"b');
				assert.equal(element.getAttribute('data-x'), value);
				assert.equal(element.children.length, 0);
			});

			it('Should not confuse single quote nested inside double-quoted attribute', () => {
				const value = "safe'>attack";
				const element = Tag.render`<div title="a'b" data-x='${value}'></div>`;

				assert.equal(element.getAttribute('title'), "a'b");
				assert.equal(element.getAttribute('data-x'), value);
				assert.equal(element.children.length, 0);
			});

			it('Should recover state after closing attribute and detect next substitution as attribute too', () => {
				const x = '"><script>alert(1)</script>';
				const y = "'><img src=x>";
				const element = Tag.render`<div a="${x}" b="literal" c='${y}'></div>`;

				assert.equal(element.getAttribute('a'), x);
				assert.equal(element.getAttribute('b'), 'literal');
				assert.equal(element.getAttribute('c'), y);
				assert.equal(element.children.length, 0);
			});

			it('Should detect attribute context across multiline tag declarations', () => {
				const value = '"><img>';
				const element = Tag.render`
					<div
						class="a"
						data-x="${value}"
						data-y="literal"
					></div>
				`;

				assert.equal(element.getAttribute('class'), 'a');
				assert.equal(element.getAttribute('data-x'), value);
				assert.equal(element.getAttribute('data-y'), 'literal');
				assert.equal(element.children.length, 0);
			});

			it('Should detect attribute context inside multiline attribute value', () => {
				const value = '"><img>';
				const element = Tag.render`
					<div class="line1
						line2 ${value} line3
						line4"></div>
				`;

				const expected = `line1\nline2 ${value} line3\nline4`;
				assert.equal(element.getAttribute('class'), expected);
				assert.equal(element.children.length, 0);
			});

			it('Should inline string substitution placed in text content right after attribute', () => {
				const html = '<span class="inner">child</span>';
				const element = Tag.render`<div class="outer">${html}</div>`;

				assert.equal(element.getAttribute('class'), 'outer');
				assert.equal(element.children.length, 1);
				assert.equal(element.children[0].tagName, 'SPAN');
				assert.equal(element.children[0].getAttribute('class'), 'inner');
				assert.equal(element.children[0].textContent, 'child');
			});

			it('Should inline string substitution in text content even when previous attribute had double quotes', () => {
				const text = 'hello <b>world</b>';
				const element = Tag.render`<div class="x">${text}</div>`;

				assert.equal(element.getAttribute('class'), 'x');
				assert.equal(element.querySelector('b')?.textContent, 'world');
			});

			it('Should treat substitutions in attributes with different quote styles independently', () => {
				const a = '"><x>';
				const b = "'><y>";
				const element = Tag.render`<div data-a="${a}" data-b='${b}'></div>`;

				assert.equal(element.getAttribute('data-a'), a);
				assert.equal(element.getAttribute('data-b'), b);
				assert.equal(element.children.length, 0);
			});

			it('Should detect attribute context for nested tags', () => {
				const outer = '">attack-outer';
				const inner = '">attack-inner';
				const element = Tag.render`
					<div data-outer="${outer}">
						<span data-inner="${inner}"></span>
					</div>
				`;

				assert.equal(element.getAttribute('data-outer'), outer);
				assert.equal(element.children.length, 1);
				assert.equal(element.children[0].getAttribute('data-inner'), inner);
			});
		});

		describe('Attribute encode/decode round-trip', () => {
			it('Should decode pre-encoded substitution back to its original characters', () => {
				const original = '"><b>xss</b>';
				const encoded = Text.encode(original);
				const element = Tag.render`<div title="${encoded}"></div>`;

				assert.equal(element.getAttribute('title'), original);
				assert.equal(element.children.length, 0);
			});

			it('Should not double-encode raw ampersand in attribute substitution', () => {
				const value = 'foo & bar';
				const element = Tag.render`<div title="${value}"></div>`;

				assert.equal(element.getAttribute('title'), value);
				assert.notInclude(element.getAttribute('title'), '&amp;');
			});

			it('Should round-trip HTML entities in attribute substitution', () => {
				const value = '&amp;test';
				const element = Tag.render`<div title="${value}"></div>`;

				assert.equal(element.getAttribute('title'), '&test');
			});

			it('Should keep already-decoded characters intact in attribute substitution', () => {
				const value = "it's <b>safe</b>";
				const element = Tag.render`<div title="${value}"></div>`;

				assert.equal(element.getAttribute('title'), value);
				assert.equal(element.children.length, 0);
			});

			it('Should mix encoded and raw substitutions in one attribute value', () => {
				const encoded = Text.encode('"hello"');
				const raw = 'world';
				const element = Tag.render`<div title="${encoded} ${raw}"></div>`;

				assert.equal(element.getAttribute('title'), '"hello" world');
			});
		});

		describe('Attribute substitution regressions', () => {
			it('Should stringify null substitution in attribute value', () => {
				const element = Tag.render`<div data-x="${null}"></div>`;

				assert.equal(element.getAttribute('data-x'), 'null');
			});

			it('Should stringify undefined substitution in attribute value', () => {
				const element = Tag.render`<div data-x="${undefined}"></div>`;

				assert.equal(element.getAttribute('data-x'), 'undefined');
			});

			it('Should stringify plain object substitution in attribute value', () => {
				const element = Tag.render`<div data-x="${{a: 1}}"></div>`;

				assert.equal(element.getAttribute('data-x'), '[object Object]');
			});

			it('Should stringify array substitution in attribute value', () => {
				const element = Tag.render`<div data-x="${[1, 2, 3]}"></div>`;

				assert.equal(element.getAttribute('data-x'), '1,2,3');
			});

			it('Should still bind function substitution for on* attributes instead of treating it as attribute value', () => {
				const spy = sinon.spy();
				const element = Tag.render`<div onclick="${spy}"></div>`;

				element.click();

				assert.ok(spy.calledOnce);
				assert.isFalse(element.hasAttribute('onclick'));
			});

			it('Should pass non-function substitution into on* attribute as a regular string value', () => {
				const element = Tag.render`<div onclick="${'alert(1)'}"></div>`;

				assert.equal(element.getAttribute('onclick'), 'alert(1)');
			});
		});

		describe('bug: 0118220', () => {
			it('Should works with string contains doctype (not document)', () => {
				const text = 'http://test.com/?doctype=1';
				const element = Tag.render`
					<div>${text}</div>
				`;

				assert.ok(element.innerHTML === text);
			});
		});

		describe.skip('Memory leak detection', () => {
			it('Should not retain result element', () => {
				let element = Tag.render`<div></div>`;

				let isElementCollected = false;
				global.weak(element, () => {
					isElementCollected = true;
				});

				element = null;

				global.gc();

				assert.ok(isElementCollected, 'Memory leak detected! "element" is not collected');
			});
		});

		describe('Render with refs', () => {
			it('Render single element with refs', () => {
				const {
					root,
					user,
					avatar,
					username,
					firstName,
					lastName,
				} = Tag.render`
					<div class="user" ref="user">
						<div class="avatar" ref="avatar"></div>
						<div class="username" ref="username">
							<span class="firstName" ref="firstName"></span>
							<span class="lastName" ref="lastName"></span>
						</div>
					</div>
				`;

				assert.ok(root === user);
				assert.ok(root.className === 'user');
				assert.ok(avatar.className === 'avatar');
				assert.ok(username.className === 'username');
				assert.ok(firstName.className === 'firstName');
				assert.ok(lastName.className === 'lastName');
			});

			it('Render multiple elements with refs', function () {
				const {root, firstName, lastName, firstNameText} = Tag.render`
					<div class="firstName" ref="firstName">
						<span class="firstNameText" ref="firstNameText"></span>
					</div>
					<div class="lastName" ref="lastName"></div>
				`;

				assert.ok(Array.isArray(root) && root.length === 2);
				assert.ok(root[0] === firstName);
				assert.ok(root[1] === lastName);
				assert.ok(firstName.className === 'firstName');
				assert.ok(lastName.className === 'lastName');
				assert.ok(firstNameText.className === 'firstNameText');
			});
		});
	});
});

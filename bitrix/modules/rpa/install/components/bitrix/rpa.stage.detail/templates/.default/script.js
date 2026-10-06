/* eslint-disable */
(function (main_core, rpa_component, rpa_fieldspopup) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Rpa');
	class StageComponent extends rpa_component.Component {
		getPermissionSelectors() {
			return [{
				action: 'VIEW',
				selector: '[data-role="permission-setting-view"]'
			}, {
				action: 'MODIFY',
				selector: '[data-role="permission-setting-create"]'
			}, {
				action: 'MODIFY',
				selector: '[data-role="permission-setting-modify"]'
			}, {
				action: 'MOVE',
				selector: '[data-role="permission-setting-move"]'
			}];
		}
		constructor(...args) {
			super(...args);
			this.popups = {};
			if (args[1].fields && main_core.Type.isPlainObject(args[1].fields)) {
				for (let [visibility, settings] of Object.entries(args[1].fields)) {
					this.popups[visibility] = new rpa_fieldspopup.FieldsPopup('stage-' + visibility + '-fields', settings.fields, settings.title);
					this.bindFieldButton(document.getElementById(settings.id), this.popups[visibility]);
				}
			}
		}
		init() {
			super.init();
			this.adjustDeleteButtonVisibility();
		}
		adjustDeleteButtonVisibility() {
			let data = this.prepareData();
			if (data.id && data.id > 0) {
				this.deleteButton.style.display = 'block';
			} else {
				this.deleteButton.style.display = 'none';
			}
		}
		bindFieldButton(node, popup) {
			main_core.Event.bind(node, 'click', event => {
				event.preventDefault();
				popup.show();
			});
		}
		prepareData() {
			let data = {};
			let fields = {};
			fields.typeId = this.form.querySelector('[name="typeId"]').value;
			let id = this.form.querySelector('[name="id"]').value;
			if (id > 0) {
				data.id = id;
			}
			fields.name = this.form.querySelector('[name="name"]').value;
			fields.code = this.form.querySelector('[name="code"]').value;
			fields.permissions = this.getPermissions();
			fields.fields = {};
			for (let [visibility, popup] of Object.entries(this.popups)) {
				fields.fields[visibility] = Array.from(popup.getSelectedFields());
			}
			fields.possibleNextStages = this.getPossibleNextStages();
			data.fields = fields;
			return data;
		}
		getPossibleNextStages() {
			let stages = [];
			let select = this.form.querySelector('[name="possibleNextStages[]"]');
			let options = select.querySelectorAll('option');
			options.forEach(option => {
				if (option.selected) {
					stages.push(option.value);
				}
			});
			return stages;
		}
		afterSave(result) {
			super.afterSave(result);
			let slider = this.getSlider();
			if (slider) {
				slider.close();
				return;
			}
			let title = main_core.Loc.getMessage('RPA_STAGE_DETAIL_TITLE').replace('#TITLE#', result.data.stage.name);
			if (this.method === 'rpa.Stage.add') {
				let stageId = result.data.stage.id;
				let url = new main_core.Uri(location.href);
				url.setQueryParam('id', result.data.stage.id);
				window.history.pushState({}, title, url.toString());
				this.form.querySelector('[name="id"]').value = stageId;
				this.method = 'rpa.Stage.update';
				this.analyticsLabel = 'rpaStageUpdate';
			}
			this.adjustDeleteButtonVisibility();
			document.getElementById('pagetitle').innerText = title;
		}
		delete(event) {
			event.preventDefault();
			if (this.isProgress) {
				return;
			}
			let data = this.prepareData();
			if (data.id > 0) {
				data = {
					id: data.id
				};
			} else {
				return;
			}
			if (confirm(main_core.Loc.getMessage('RPA_STAGE_DELETE_CONFIRM'))) {
				this.startProgress();
				main_core.ajax.runAction('rpa.Stage.delete', {
					analyticsLabel: 'rpaStageDelete',
					data: data
				}).then(result => {
					this.afterDelete(result);
					this.stopProgress();
				}).catch(result => {
					this.showErrors(result.errors);
					this.stopProgress();
				});
			}
		}
		afterDelete() {
			this.cancelButton.click();
		}
	}
	namespace.StageComponent = StageComponent;

})(BX, BX.Rpa, BX.Rpa);
//# sourceMappingURL=script.js.map

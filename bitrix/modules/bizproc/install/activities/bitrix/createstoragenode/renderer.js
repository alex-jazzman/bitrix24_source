/* eslint-disable */
(function (exports,ui_vue3,main_core) {
	'use strict';

	const StorageFieldSelector = {
	  name: 'StorageFieldSelector',
	  props: {
	    field: {
	      type: [Object, Array],
	      required: true
	    }
	  },
	  setup({
	    field
	  }) {
	    var _field$property;
	    const initialItems = Array.isArray(field == null ? void 0 : field.value) ? [...field.value] : [];
	    const items = ui_vue3.ref(initialItems);
	    const options = (field == null ? void 0 : (_field$property = field.property) == null ? void 0 : _field$property.Options) || {};
	    const onRemoveField = index => {
	      items.value.splice(index, 1);
	    };
	    const onAddFieldClick = async () => {
	      try {
	        const {
	          Router
	        } = await main_core.Runtime.loadExtension('bizproc.router');
	        Router.openStorageFieldEdit({
	          requestMethod: 'get',
	          requestParams: {
	            storageId: 0,
	            fieldId: null,
	            skipSave: true
	          },
	          events: {
	            onCloseComplete: event => {
	              const slider = event.getSlider();
	              const dictionary = slider ? slider.getData() : null;
	              if (dictionary && dictionary.has('data')) {
	                items.value.push(dictionary.get('data'));
	              }
	            }
	          }
	        });
	      } catch (error) {
	        console.error(error);
	      }
	    };
	    const onCopyCode = code => {
	      var _options$copyNotifica;
	      BX.clipboard.copy(code);
	      BX.UI.Notification.Center.notify({
	        content: (_options$copyNotifica = options.copyNotification) != null ? _options$copyNotifica : ''
	      });
	    };
	    const jsonStringify = val => JSON.stringify(val);
	    return {
	      items,
	      options,
	      onAddFieldClick,
	      onRemoveField,
	      onCopyCode,
	      jsonStringify
	    };
	  },
	  template: `
		<div class="storage-fields">
			<div class="bizproc-create-storage__outer-block">

				<div class="bizproc-create-storage__fields-container">
					<div v-for="(item, index) in items" :key="index" class="bizproc-create-storage__field-row">
						<input
							type="hidden"
							name="SelectedFields[]"
							:value="jsonStringify(item)"
						>
						<div class="bizproc-create-storage__field-row-content">
		                      <span class="bizproc-create-storage__field-name">
		                         {{ item.name }}
		                      </span>
							<a
								href="#"
								class="storage-fields__code-button"
								:title="item.code"
								@click.prevent="onCopyCode(item.code)"
							>
								{{ options.codeCaption ?? '' }}
							</a>
							<div class="bizproc-create-storage__delete-button" @click="onRemoveField(index)">
								<div class="ui-icon-set --cross-m"></div>
							</div>
						</div>
					</div>
				</div>

				<div class="node-settings-add-field-button" @click="onAddFieldClick">
					<div class="ui-icon-set --plus-m bizproc-create-storage__icon-plus"></div>
					<span>{{ field.property.Name }}</span>
				</div>

			</div>
		</div>
	`
	};

	class CreateStorageNodeRenderer {
	  getControlRenderers() {
	    return {
	      storageFieldSelector: StorageFieldSelector
	    };
	  }
	}

	exports.CreateStorageNodeRenderer = CreateStorageNodeRenderer;

}((this.window = this.window || {}),BX.Vue3,BX));
//# sourceMappingURL=renderer.js.map

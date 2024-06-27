import { Text, Type } from "main.core";
import Tab from "./tab";
import { EventEmitter } from "main.core.events";
import "./tab-manager.css";

export class TabManager {
    constructor(id, settings) {
        this.id = Type.isStringFilled(id) ? id : Text.getRandom();
        this.settings = Type.isObjectLike(settings) ? settings : {};

        this.container = this.settings.container;
        this.menuContainer = this.settings.menuContainer;

        this.items = [];

        if (Type.isArray(this.settings.data)) {
            this.settings.data.forEach((item) => {
                this.items.push(
                    new Tab(item.id, {
                        manager: this,
                        data: item,
                        container: this.container.querySelector('[data-tab-id="' + item.id + '"]'),
                        menuContainer: this.menuContainer.querySelector('[data-tab-id="' + item.id + '"]'),
                    })
                );
            });
        }

        EventEmitter.subscribe("BX.MyWebstor.HMS.TabManager:onOpenTab", (event) => {
            let tabId = event.data.tabId;
            let item = this.findItemById(tabId);
            if (item) {
                this.selectItem(item);
            }
        });

        const activeItem = this.items.find((item) => item.isActive());
        if (activeItem) {
            if (activeItem.loader && !activeItem.loader.isLoaded())
                activeItem.loader.load();

            activeItem.active = false;
            this.selectItem(activeItem);
        }
    }

    findItemById(id) {
        return this.items.find((item) => item.id === id) || null;
    }

    selectItem(item) {
        EventEmitter.emit("BX.MyWebstor.HMS.TabManager:onSelectItem", { tabId: item.id });
        this.items.forEach((current) => current.setActive(current === item));
    }
}

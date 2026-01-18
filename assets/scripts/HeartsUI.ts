import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { Health } from './Health';
const { ccclass, property } = _decorator;

@ccclass('HeartsUI')
export class HeartsUI extends Component {
    @property(Node) container: Node | null = null;
    @property(Prefab) heartPrefab: Prefab | null = null;
    @property(Health) health: Health | null = null;

    private _hearts: Node[] = [];
    private _max = 0;

    onLoad() {
        this._rebuild();
        this._bind();
    }

    private _rebuild() {
        if (!this.container || !this.heartPrefab || !this.health) return;

        this.container.removeAllChildren();
        this._hearts.length = 0;

        this._max = this.health.maxHP;

        for (let i = 0; i < this._max; i++) {
            const n = instantiate(this.heartPrefab);
            n.parent = this.container;
            this._hearts.push(n);
        }

        this._apply(this.health.hp, this._max);
    }

    private _bind() {
        if (!this.health) return;
        this.health.events.on('changed', this._onChanged, this);
    }

    onDestroy() {
        if (!this.health) return;
        this.health.events.off('changed', this._onChanged, this);
    }

    private _onChanged(cur: number, max: number) {
        if (max !== this._max) {
            this._rebuild();
            return;
        }
        this._apply(cur, max);
    }

    private _apply(cur: number, max: number) {
        for (let i = 0; i < max; i++) {
            const h = this._hearts[i];
            if (h) h.active = (i < cur);
        }
    }
}
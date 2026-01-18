import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { MoneyFlyItem } from './MoneyFlyItem';
const { ccclass, property } = _decorator;

@ccclass('MoneyFlyFx')
export class MoneyFlyFx extends Component {
    @property(Node) fxParent: Node | null = null;
    @property(Node) targetIcon: Node | null = null;
    @property(Prefab) flyPrefab: Prefab | null = null;

    @property prewarm = 8;
    @property duration = 0.35;
    @property arcHeight = 180;

    private _pool: MoneyFlyItem[] = [];
    private _tmpTo = new Vec3();

    onLoad() {
        if (!this.fxParent) this.fxParent = this.node;
        this._prewarm();
    }

    spawn(fromWorld: Vec3, count = 1) {
        if (!this.flyPrefab || !this.fxParent || !this.targetIcon) return;

        this.targetIcon.getWorldPosition(this._tmpTo);

        for (let i = 0; i < count; i++) {
            const item = this._get();
            item.node.parent = this.fxParent;
            item.play(this, fromWorld, this._tmpTo, this.duration, this.arcHeight);
        }
    }

    _recycle(item: MoneyFlyItem) {
        this._pool.push(item);
    }

    private _get(): MoneyFlyItem {
        let item = this._pool.pop();
        if (item) return item;

        const n = instantiate(this.flyPrefab!);
        item = n.getComponent(MoneyFlyItem)!;
        if (!item) item = n.addComponent(MoneyFlyItem);
        return item;
    }

    private _prewarm() {
        if (!this.flyPrefab || !this.fxParent) return;
        for (let i = 0; i < this.prewarm; i++) {
            const n = instantiate(this.flyPrefab);
            n.parent = this.fxParent;
            const item = n.getComponent(MoneyFlyItem) ?? n.addComponent(MoneyFlyItem);
            n.active = false;
            this._pool.push(item);
        }
    }
}
import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('MoneyFlyItem')
export class MoneyFlyItem extends Component {
    private _alive = false;
    private _t = 0;
    private _dur = 0.35;

    private _p0 = new Vec3();
    private _p1 = new Vec3();
    private _p2 = new Vec3();
    private _tmp = new Vec3();

    private _owner: any = null;

    play(owner: any, fromWorld: Vec3, toWorld: Vec3, duration: number, arcHeight: number) {
        this._owner = owner;
        this._alive = true;
        this._t = 0;
        this._dur = duration;

        this.node.active = true;
        this.node.setWorldPosition(fromWorld);

        this._p0.set(fromWorld);
        this._p2.set(toWorld);

        this._p1.set(
            (fromWorld.x + toWorld.x) * 0.5,
            (fromWorld.y + toWorld.y) * 0.5 + arcHeight,
            0
        );
    }

    update(dt: number) {
        if (!this._alive) return;

        this._t += dt / this._dur;
        if (this._t >= 1) {
            this.node.setWorldPosition(this._p2);
            this._finish();
            return;
        }

        const t = this._t;
        const omt = 1 - t;
        const a = omt * omt;
        const b = 2 * omt * t;
        const c = t * t;

        this._tmp.set(
            this._p0.x * a + this._p1.x * b + this._p2.x * c,
            this._p0.y * a + this._p1.y * b + this._p2.y * c,
            0
        );

        this.node.setWorldPosition(this._tmp);
    }

    private _finish() {
        this._alive = false;
        this.node.active = false;
        if (this._owner) this._owner._recycle(this);
    }
}
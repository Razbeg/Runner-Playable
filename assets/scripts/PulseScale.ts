import { _decorator, Component, Vec3, tween, Tween } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PulseScale')
export class PulseScale extends Component {
    @property maxScale = 1.12;
    @property period = 0.6;
    @property autoplay = true;

    private _base = new Vec3(1, 1, 1);
    private _up = new Vec3(1, 1, 1);
    private _down = new Vec3(1, 1, 1);
    private _tw: Tween<any> | null = null;

    onEnable() {
        this.node.getScale(this._base);
        if (this.autoplay) this.play();
    }

    onDisable() {
        this.stop();
    }

    play() {
        this.stop();

        const half = Math.max(0.05, this.period * 0.5);
        this._up.set(this._base.x * this.maxScale, this._base.y * this.maxScale, this._base.z);
        this._down.set(this._base.x, this._base.y, this._base.z);

        this._tw = tween(this.node)
            .repeatForever(
                tween()
                    .to(half, { scale: this._up })
                    .to(half, { scale: this._down })
            )
            .start();
    }

    stop() {
        if (this._tw) {
            this._tw.stop();
            this._tw = null;
        }
        Tween.stopAllByTarget(this.node);
        this.node.setScale(this._base);
    }
}

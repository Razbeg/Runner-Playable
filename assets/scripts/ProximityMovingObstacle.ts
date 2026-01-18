import { _decorator, Component, Node, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ProximityMovingObstacle')
export class ProximityMovingObstacle extends Component {
    @property(Node)
    player: Node | null = null;

    @property activateDistance = 700;
    @property disableAfterPassed = 300;
    @property extraLocalXSpeed = -260;
    @property disableNodeAfterPassed = true;

    private _pos = new Vec3();
    private _wPos = new Vec3();
    private _pPos = new Vec3();

    private _active = false;
    private _t = 0;

    onLoad() {
        if (!this.player || !this.player.isValid) {
            const root = this.node.scene;
            const p = root?.getChildByName('Canvas')?.getChildByName('MaskRoot')?.getChildByName('DesignRoot')?.getChildByName('Player');
            if (p) this.player = p;
        }
    }

    update(dt: number) {
        const p = this.player;
        if (!p || !p.isValid) return;

        this.node.getWorldPosition(this._wPos);
        p.getWorldPosition(this._pPos);
        const dx = this._wPos.x - this._pPos.x;

        if (!this._active) {
            if (dx <= this.activateDistance && dx > -this.disableAfterPassed) {
                this._active = true;
                this._t = 0;
            }
            return;
        }

        if (dx < -this.disableAfterPassed) {
            this._active = false;
            this._t = 0;

            if (this.disableNodeAfterPassed) {
                this.node.active = false;
                return;
            }
            
            return;
        }

        this._t += dt;

        this.node.getPosition(this._pos);
        this._pos.x += this.extraLocalXSpeed * dt;

        this.node.setPosition(this._pos);
    }
}

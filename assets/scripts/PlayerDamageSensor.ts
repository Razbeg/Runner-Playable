import { _decorator, Component } from 'cc';
import { Collider2D, Contact2DType, IPhysics2DContact } from 'cc';
import { Health } from './Health';
import { PlayerAnimController } from './PlayerAnimController';
const { ccclass, property } = _decorator;

@ccclass('PlayerDamageSensor')
export class PlayerDamageSensor extends Component {
    @property(Health) health: Health | null = null;
    @property(PlayerAnimController) anim: PlayerAnimController | null = null;

    @property playerTag = 1;
    @property obstacleTag = 2;
    @property invulnSec = 0.4;

    private _invulnT = 0;

    start() {
        const col = this.getComponent(Collider2D);
        if (!col) return;
        col.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
    }

    update(dt: number) {
        if (this._invulnT > 0) this._invulnT -= dt;
    }

    private _onBeginContact(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
        if (!this.health) return;
        if (this._invulnT > 0) return;

        if (self.tag !== this.playerTag) return;
        if (other.tag !== this.obstacleTag) return;

        this._invulnT = this.invulnSec;
        this.health.damage(1);

        this.anim?.playHurtThenRun(true);
    }
}
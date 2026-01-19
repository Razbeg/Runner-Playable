import { _decorator, Component, Vec2 } from 'cc';
import {
    Contact2DType,
    Collider2D,
    BoxCollider2D,
    RigidBody2D,
    ERigidBody2DType,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('FinishLineTrigger')
export class FinishLineTrigger extends Component {
    static readonly EVENT_FINISHED = 'finish_line_reached';

    @property
    playerColliderTag = 1;

    @property
    colliderWidth = 120;

    @property
    colliderHeight = 800;

    @property
    colliderOffsetX = 0;

    @property
    colliderOffsetY = 0;

    @property
    disableOnFinish = true;

    private _col: Collider2D | null = null;
    private _fired = false;

    onLoad() {
        this._ensureCollider();
    }

    onDestroy() {
        if (this._col) {
            this._col.off(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
        }
    }

    private _ensureCollider() {
        let rb = this.getComponent(RigidBody2D);
        if (!rb) rb = this.addComponent(RigidBody2D);
        rb.type = ERigidBody2DType.Kinematic;
        rb.gravityScale = 0;
        rb.fixedRotation = true;

        let box = this.getComponent(BoxCollider2D);
        if (!box) box = this.addComponent(BoxCollider2D);
        box.sensor = true;
        box.size.set(this.colliderWidth, this.colliderHeight);
        box.offset = new Vec2(this.colliderOffsetX, this.colliderOffsetY);
        box.apply();

        this._col = box;
        box.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
    }

    private _onBeginContact(_self: Collider2D, other: Collider2D) {
        if (this._fired) return;
        if (!other || other.tag !== this.playerColliderTag) return;

        this._fired = true;
        this.node.emit(FinishLineTrigger.EVENT_FINISHED);

        if (this.disableOnFinish) {
            this.node.active = false;
        }
    }
}
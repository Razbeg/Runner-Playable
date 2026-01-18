import {
    _decorator,
    Component,
    Vec2,
} from 'cc';

import {
    PhysicsSystem2D,
    Contact2DType,
    Collider2D,
    CircleCollider2D,
    RigidBody2D,
    ERigidBody2DType,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CollectableMoney')
export class CollectableMoney extends Component {
    @property
    playerColliderTag = 1;

    @property
    disableOnPickup = true;

    @property
    destroyOnPickup = false;

    private _col: Collider2D | null = null;
    private _picked = false;

    onLoad() {
        this._ensurePhysics2D();
        this._ensureCollider();
    }

    onDestroy() {
        if (this._col) {
            this._col.off(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
        }
    }

    private _ensurePhysics2D() {
        const sys = PhysicsSystem2D.instance;
        if (!sys) return;
        if (!sys.enable) sys.enable = true;
        sys.gravity = new Vec2(0, 0);
    }

    private _ensureCollider() {
        let rb = this.getComponent(RigidBody2D);
        if (!rb) rb = this.addComponent(RigidBody2D);
        rb.type = ERigidBody2DType.Kinematic;
        rb.gravityScale = 0;
        rb.fixedRotation = true;

        let c = this.getComponent(Collider2D);
        if (!c) {
            const circle = this.addComponent(CircleCollider2D);
            circle.radius = 200;
            c = circle;
        }

        c.sensor = true;
        this._col = c;
        c.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
    }

    private _onBeginContact(self: Collider2D, other: Collider2D) {
        if (this._picked) return;
        if (!other || other.tag !== this.playerColliderTag) return;

        this._picked = true;

        if (this.destroyOnPickup) {
            this.node.destroy();
            return;
        }
        if (this.disableOnPickup) {
            this.node.active = false;
        }
    }
}
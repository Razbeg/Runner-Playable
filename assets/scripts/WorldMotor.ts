import {
    _decorator,
    Component,
    Node,
    Vec3,
    Vec2,
    UITransform,
} from 'cc';

import {
    PhysicsSystem2D,
    ERigidBody2DType,
    RigidBody2D,
    BoxCollider2D,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('WorldMotor')
export class WorldMotor extends Component {
    @property
    speed = 900;

    @property
    scrollWorldLeft = true;

    @property(Node)
    worldRoot: Node | null = null;

    @property(Node)
    player: Node | null = null;

    @property
    playerColliderTag = 1;

    private _running = false;
    private _pos = new Vec3();

    onLoad() {
        this._ensurePhysics2D();
        this._ensurePlayerBody();
    }

    startRun() {
        this._running = true;
    }

    stopRun() {
        this._running = false;
    }

    resetToIntro() {
        this._running = false;
    }

    update(dt: number) {
        if (!this._running) return;
        const w = this.worldRoot;
        w.getPosition(this._pos);
        const dir = this.scrollWorldLeft ? -1 : 1;
        this._pos.x += dir * this.speed * dt;
        w.setPosition(this._pos);
    }

    private _ensurePhysics2D() {
        const sys = PhysicsSystem2D.instance;
        if (!sys) return;
        if (!sys.enable) sys.enable = true;
        sys.gravity = new Vec2(0, 0);
    }

    private _ensurePlayerBody() {
        if (!this.player || !this.player.isValid) {
            this.player = this.node.getChildByName('Player');
        }
        const p = this.player;
        if (!p) return;

        let rb = p.getComponent(RigidBody2D);
        if (!rb) rb = p.addComponent(RigidBody2D);
        rb.type = ERigidBody2DType.Dynamic;
        rb.gravityScale = 0;
        rb.fixedRotation = true;

        let col = p.getComponent(BoxCollider2D);
        if (!col) col = p.addComponent(BoxCollider2D);

        col.offset = new Vec2(-2.5, -35);
        col.size.set(20, 60);
        col.tag = this.playerColliderTag;
        col.sensor = false;
        
        col.apply();
    }
}

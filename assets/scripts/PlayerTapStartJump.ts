import { _decorator, Component, input, Input, EventTouch, Vec3 } from 'cc';
import { PlayerAnimController } from './PlayerAnimController';
const { ccclass, property } = _decorator;

export interface IRunnerMotor { startRun(): void; }

@ccclass('PlayerTapStartJump')
export class PlayerTapStartJump extends Component {
    @property(PlayerAnimController) anim: PlayerAnimController | null = null;
    @property(Component) motor: Component | null = null;

    @property jumpHeight = 180;

    private _started = false;
    private _isJumping = false;

    private _baseY = 0;
    private _jumpT = 0;
    private _jumpDur = 0.45;

    private _pos = new Vec3();

    private _lastTapMs = -99999;

    onLoad() {
        if (!this.anim) this.anim = this.getComponent(PlayerAnimController);

        const hasTouch =
            (typeof window !== 'undefined') &&
            (('ontouchstart' in window) || ((navigator as any)?.maxTouchPoints > 0));

        if (hasTouch) {
            input.on(Input.EventType.TOUCH_START, this._onTouch, this);
        } else {
            input.on(Input.EventType.MOUSE_DOWN, this._onMouse, this);
        }
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this._onTouch, this);
        input.off(Input.EventType.MOUSE_DOWN, this._onMouse, this);
    }

    resetToIntro() {
        this._started = false;
        this._isJumping = false;
        this._jumpT = 0;
        this.anim?.playIdle(true);
    }

    private _onTouch(_e: EventTouch) { this._handleTap(); }
    private _onMouse() { this._handleTap(); }

    private _handleTap() {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (now - this._lastTapMs < 40) return;
        this._lastTapMs = now;

        if (!this._started) {
            this._started = true;

            const m = this.motor as unknown as IRunnerMotor | null;
            m?.startRun();

            this.anim?.playRun(true);
            return;
        }

        if (this._isJumping) return;
        this._startJump();
    }

    private _startJump() {
        this._isJumping = true;
        this._jumpT = 0;

        const a = this.anim as any;
        const frames = a?.jumpFrames ?? 6;
        const fps = Math.max(1, a?.jumpFps ?? 14);
        this._jumpDur = frames / fps;

        this.node.getPosition(this._pos);
        this._baseY = this._pos.y;

        this.anim?.playJump(true);
    }

    update(dt: number) {
        if (!this._isJumping) return;

        this._jumpT += dt;
        let t = this._jumpT / this._jumpDur;

        if (t >= 1) {
            this._isJumping = false;
            this.node.getPosition(this._pos);
            this._pos.y = this._baseY;
            this.node.setPosition(this._pos);
            this.anim?.playRun(true);
            return;
        }

        const y = this._baseY + this.jumpHeight * (4 * t * (1 - t));
        this.node.getPosition(this._pos);
        this._pos.y = y;
        this.node.setPosition(this._pos);
    }
}
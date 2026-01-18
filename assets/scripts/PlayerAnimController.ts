import { _decorator, Component, Texture2D } from 'cc';
import { RowSheetAnim } from './RowSheetAnim';
const { ccclass, property } = _decorator;

enum AnimState { Idle = 0, Run = 1, Jump = 2, Hurt = 3 }

@ccclass('PlayerAnimController')
export class PlayerAnimController extends Component {
    @property(RowSheetAnim) rowAnim: RowSheetAnim | null = null;

    @property(Texture2D) idleSheet: Texture2D | null = null;
    @property idleFrames = 6;
    @property idleFps = 12;

    @property(Texture2D) runSheet: Texture2D | null = null;
    @property runFrames = 8;
    @property runFps = 12;

    @property(Texture2D) jumpSheet: Texture2D | null = null;
    @property jumpFrames = 6;
    @property jumpFps = 14;

    @property(Texture2D) hurtSheet: Texture2D | null = null;
    @property hurtFrames = 4;
    @property hurtFps = 16;

    private _state: AnimState = AnimState.Idle;

    private _hurtLocked = false;
    private _afterHurt: AnimState = AnimState.Run;

    onLoad() {
        if (!this.rowAnim) this.rowAnim = this.getComponent(RowSheetAnim);
        this.playIdle(true);
    }

    playIdle(force = false) { this._play(AnimState.Idle, this.idleSheet, this.idleFrames, this.idleFps, true, force); }
    playRun(force = false) { this._play(AnimState.Run, this.runSheet, this.runFrames, this.runFps, true, force); }
    playJump(force = false) { this._play(AnimState.Jump, this.jumpSheet, this.jumpFrames, this.jumpFps, false, force); }

    forceIdleNow() { this._hurtLocked = false; this.unschedule(this._returnFromHurt); this.playIdle(true); }
    forceRunNow() { this._hurtLocked = false; this.unschedule(this._returnFromHurt); this.playRun(true); }

    playHurtThenRun(forceRestart = true) {
        this.playHurtThen(AnimState.Run, forceRestart);
    }

    playHurtThen(next: AnimState, forceRestart = true) {
        if (!this.hurtSheet || this.hurtFrames <= 0) return;

        this._afterHurt = next;
        this._hurtLocked = true;

        this.unschedule(this._returnToRun);
        this.unschedule(this._returnFromHurt);

        this._play(AnimState.Hurt, this.hurtSheet, this.hurtFrames, this.hurtFps, false, forceRestart);

        const dur = this.hurtFrames / Math.max(1, this.hurtFps);
        this.scheduleOnce(this._returnFromHurt, dur);
    }

    playJumpThenRun() {
        if (this._hurtLocked) return;

        this.playJump(true);
        const dur = this.jumpFrames / Math.max(1, this.jumpFps);
        this.unschedule(this._returnToRun);
        this.scheduleOnce(this._returnToRun, dur);
    }

    private _returnToRun = () => { this.playRun(true); };

    private _returnFromHurt = () => {
        this._hurtLocked = false;

        switch (this._afterHurt) {
            case AnimState.Idle: this.playIdle(true); break;
            case AnimState.Jump: this.playJump(true); break;
            default: this.playRun(true); break;
        }
    };

    private _play(
        next: AnimState,
        sheet: Texture2D | null,
        frames: number,
        fps: number,
        loop: boolean,
        force: boolean
    ) {
        const a = this.rowAnim;
        if (!a || !sheet || frames <= 0) return;

        if (this._hurtLocked && next !== AnimState.Hurt) return;

        if (!force && this._state === next) return;

        this._state = next;
        this.unschedule(this._returnToRun);

        a.sheet = sheet;
        a.frameCount = frames;
        a.fps = fps;
        a.loop = loop;

        a.rebuild();
        a.play(true);
    }
}
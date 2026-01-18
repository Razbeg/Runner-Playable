import { _decorator, Component, Node, input, Input, Vec3, AudioSource } from 'cc';
import { PlayerTapStartJump } from './PlayerTapStartJump';
import { WorldMotor } from './WorldMotor';
import { PlayerAnimController } from './PlayerAnimController';
import { ProximityMovingObstacle } from './ProximityMovingObstacle';

const { ccclass, property } = _decorator;

@ccclass('RunnerFlow')
export class RunnerFlow extends Component {
    @property({ type: PlayerTapStartJump })
    playerTap: PlayerTapStartJump | null = null;

    @property({ type: WorldMotor })
    worldMotor: WorldMotor | null = null;

    @property({ type: PlayerAnimController })
    playerAnim: PlayerAnimController | null = null;

    @property({ type: Node })
    introOverlay: Node | null = null;

    @property({ type: Node })
    tutorialOverlay: Node | null = null;

    @property({ type: Node })
    firstObstacle: Node | null = null;

    @property
    tutorialDistance = 650;

    @property({ type: AudioSource })
    audioSource: AudioSource | null = null;

    @property
    pauseMovingObstaclesOnTutorial = true;

    private _started = false;
    private _tutorialActive = false;
    private _tutorialDone = false;

    private _pPos = new Vec3();
    private _oPos = new Vec3();

    private _lastTapMs = -99999;
    private _hasTouch = false;

    private _pausedMoving: ProximityMovingObstacle[] = [];

    onLoad() {
        if (!this.playerTap) this.playerTap = this._findPlayerTap();
        if (!this.worldMotor) this.worldMotor = this._findWorldMotor();
        if (!this.playerAnim) this.playerAnim = this.playerTap?.anim || this._findPlayerAnim();

        this._hasTouch =
            (typeof window !== 'undefined') &&
            (('ontouchstart' in window) || ((navigator as any)?.maxTouchPoints > 0));

        if (this.introOverlay) this.introOverlay.active = true;
        if (this.tutorialOverlay) this.tutorialOverlay.active = false;

        this.playerTap?.node.on(PlayerTapStartJump.EVENT_STARTED, this._onStarted, this);

        if (this._hasTouch) input.on(Input.EventType.TOUCH_START, this._onTapAny, this);
        else input.on(Input.EventType.MOUSE_DOWN, this._onTapAny, this);
    }

    onDestroy() {
        this.playerTap?.node.off(PlayerTapStartJump.EVENT_STARTED, this._onStarted, this);
        input.off(Input.EventType.TOUCH_START, this._onTapAny, this);
        input.off(Input.EventType.MOUSE_DOWN, this._onTapAny, this);
    }

    private _onStarted() {
        if (this._started) return;
        this._started = true;

        if (this.introOverlay) this.introOverlay.active = false;

        const a = this.audioSource;
        if (a) {
            a.loop = true;
            a.play();
        }
    }

    private _onTapAny() {
        if (!this._tutorialActive) return;

        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (now - this._lastTapMs < 60) return;
        this._lastTapMs = now;

        this._closeTutorial(true);
    }

    update(_dt: number) {
        if (!this._started || this._tutorialDone || this._tutorialActive) return;

        const pNode = this.playerTap?.node;
        const o = this.firstObstacle;
        if (!pNode || !o || !o.isValid) return;

        pNode.getWorldPosition(this._pPos);
        o.getWorldPosition(this._oPos);
        const dx = this._oPos.x - this._pPos.x;

        if (dx > 0 && dx <= this.tutorialDistance) {
            this._openTutorial();
        }
    }

    private _openTutorial() {
        this._tutorialActive = true;

        this.worldMotor?.stopRun();

        if (this.pauseMovingObstaclesOnTutorial) {
            this._pauseMovingObstacles(true);
        }

        this.playerTap?.setInputEnabled(false);
        this.playerAnim?.playIdle(true);

        if (this.tutorialOverlay) this.tutorialOverlay.active = true;
    }

    private _closeTutorial(jumpOnClose: boolean) {
        this._tutorialActive = false;
        this._tutorialDone = true;

        if (this.tutorialOverlay) this.tutorialOverlay.active = false;

        this.playerTap?.setInputEnabled(true);
        this.playerAnim?.playRun(true);
        if (this.pauseMovingObstaclesOnTutorial) {
            this._pauseMovingObstacles(false);
        }
        this.worldMotor?.startRun();

        if (jumpOnClose) {
            this.playerTap?.jumpNow();
        }
    }

    private _pauseMovingObstacles(paused: boolean) {
        const worldRoot = this.worldMotor?.worldRoot;
        if (!worldRoot) return;

        if (paused) {
            this._pausedMoving.length = 0;
            const comps = worldRoot.getComponentsInChildren(ProximityMovingObstacle);
            for (let i = 0; i < comps.length; i++) {
                const c = comps[i];
                if (c.enabled) {
                    c.enabled = false;
                    this._pausedMoving.push(c);
                }
            }
            return;
        }

        for (let i = 0; i < this._pausedMoving.length; i++) {
            const c = this._pausedMoving[i];
            if (c && c.isValid) c.enabled = true;
        }
        this._pausedMoving.length = 0;
    }

    private _findWorldMotor(): WorldMotor | null {
        const canvas = this.node.scene?.getChildByName('Canvas');
        const designRoot = canvas?.getChildByName('MaskRoot')?.getChildByName('DesignRoot');
        return designRoot?.getComponent(WorldMotor) || null;
    }

    private _findPlayerTap(): PlayerTapStartJump | null {
        const canvas = this.node.scene?.getChildByName('Canvas');
        const player = canvas?.getChildByName('MaskRoot')?.getChildByName('DesignRoot')?.getChildByName('Player');
        return player?.getComponent(PlayerTapStartJump) || null;
    }

    private _findPlayerAnim(): PlayerAnimController | null {
        const canvas = this.node.scene?.getChildByName('Canvas');
        const player = canvas?.getChildByName('MaskRoot')?.getChildByName('DesignRoot')?.getChildByName('Player');
        return player?.getComponent(PlayerAnimController) || null;
    }
}

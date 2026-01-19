import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CtaButton')
export class CtaButton extends Component {
    @property
    clickUrl = 'https://example.com';

    @property
    debounceMs = 250;

    private _lastMs = -99999;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_END, this._onClick, this);
        this.node.on(Node.EventType.MOUSE_UP, this._onClick, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_END, this._onClick, this);
        this.node.off(Node.EventType.MOUSE_UP, this._onClick, this);
    }

    open() {
        this._openUrl();
    }

    private _onClick(e?: any) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (now - this._lastMs < this.debounceMs) return;
        this._lastMs = now;

        this._openUrl();
    }

    private _openUrl() {
        const w: any = (typeof window !== 'undefined') ? (window as any) : null;
        const url = this.clickUrl;

        try {
            if (w && w.mraid && typeof w.mraid.open === 'function') {
                w.mraid.open(url);
                return;
            }
        } catch (err) {
        }

        try {
            if (w && typeof w.open === 'function') {
                w.open(url, '_blank');
            }
        } catch (err) {
        }
    }
}
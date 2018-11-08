import RFB from './noVNC/core/rfb.js';

if (typeof AFRAME === 'undefined') {
    throw 'AFRAME is not loaded.';
}

AFRAME.registerComponent('vncclient', {
    schema: {
        viewOnly: { type: 'bool', default: false },
        dialog: { type: 'selector', default: null }
    },
    init: function () {
        this.connected = false;
        this.desktopName = "";
        this.clientDiv = document.createElement('div');
        this.rfb = null;

        this.draggingRaycaster = null;
        this.mousePos = new THREE.Vector2(0, 0);
        this.el.addEventListener('mouseenter', (ev) => {
            this.update();
            if (ev.detail.cursorEl && ev.detail.cursorEl.components.raycaster) {
                this.draggingRaycaster = ev.detail.cursorEl.components.raycaster;
            }
        });
        this.el.addEventListener('mouseleave', (ev) => {
            this.draggingRaycaster = null;
        });
        this.el.addEventListener('mousedown', (ev) => {
            this.sendMouseEvent("mousedown", this.mousePos.x, this.mousePos.y, 0);
        });
        this.el.addEventListener('mouseup', (ev) => {
            this.sendMouseEvent("mouseup", this.mousePos.x, this.mousePos.y, 0);
        });

        if (this.data.dialog) {
            var dialog = this.data.dialog;
            dialog.querySelector("[name=vnc_connect]").addEventListener('click', (ev) => {
                var address = dialog.querySelector("[name=vnc_address]").value;
                var password = dialog.querySelector("[name=vnc_password]").value;
                localStorage.setItem('vnc_address', address);
                // localStorage.setItem('vnc_password', password);
                dialog.setAttribute('visible', false);
                this.connect(address, password);
            });
            dialog.addEventListener('loaded', (ev) => {
                dialog.querySelector("[name=vnc_address]").value = localStorage.getItem('vnc_address') || (window.location.hostname + ":6080");
                dialog.querySelector("[name=vnc_password]").value = localStorage.getItem('vnc_password') || "";
            });
        }
    },
    update: function() {
    },
    tick: function () {
        if (!this.connected) return;

        this.texture.needsUpdate = true;

        if (this.draggingRaycaster) {
            var t = this.draggingRaycaster.intersections.find(i => i.object.el === this.el);
            if (t) {
                var point = this.el.object3D.worldToLocal(t.point);
                var x = this.canvas.width * (point.x / this.el.components.geometry.data.width + 0.5);
                var y = this.canvas.height * (- point.y / this.el.components.geometry.data.height + 0.5);
                if (x != this.mousePos.x || y != this.mousePos.y) {
                    this.mousePos.set(x, y);
                    this.sendMouseEvent("mousemove", x, y, 0);
                }
            }
        }
    },
    remove: function () {
        if (!this.connected) return;
        this.rfb.disconnect();
    },
    connect: function (url, password) {
        /// TODO: token parameter for nova-novncproxy.
        this.updateTitle("Connecting..." + url);
        console.log("Connecting... " + url);

        if (!url.includes('/')) {
            url += '/websockify';
        }
        if (!url.includes('://')) {
            if (window.location.protocol === "https:") {
                url = 'wss://' + url;
            } else {
                url = 'ws://' + url;
            }
        }
        this.rfb = new RFB(this.clientDiv, url,
            {
                repeaterID: '',
                shared: true,
                credentials: { password: password }
            });
        this.rfb.viewOnly = this.data.viewOnly;
        this.rfb.addEventListener("connect", ev => this.onConnected(ev));
        this.rfb.addEventListener("disconnect", ev => this.onDisconnected(ev));
        this.rfb.addEventListener("capabilities", ev => this.onCapabilities(ev));
        // this.rfb.addEventListener("credentialsrequired", ev => this.showPasswordDialog(ev));
        this.rfb.addEventListener("desktopname", ev => { this.desktopName = ev.detail.name });
        this.rfb.scaleViewport = false;
        this.rfb.resizeSession = false;
    },
    onConnected: function (ev) {
        this.canvas = this.clientDiv.querySelector('canvas');
        if (this.canvas == null) {
            this.updateTitle(this.desktopName + " screenn canvas not found (ERROR)");
            return;
        }
        if (this.canvas.id != this.canvasId) {
            this.canvasId = "client_canvas_" + (Math.random() * 1000);
            this.canvas.id = this.canvasId;

            this.texture = new THREE.CanvasTexture(this.canvas, { npot: true });
            this.texture.magFilter = THREE.LinearFilter;
            this.texture.minFilter = THREE.LinearFilter;
            this.texture.generateMipmaps = false;
            this.el.setAttribute('material', { src: this.texture, npot: true, flatShading: true });
            this.canvas.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: this.canvas.height, right: this.canvas.width });
        }

        this.updateTitle(this.desktopName);
        this.connected = true;
    },
    onDisconnected: function (ev) {
        this.connected = false;
        this.texture = null;
        this.canvas = null;
        this.el.removeAttribute('material');
        this.updateTitle(this.desktopName + " Disconnected" + (ev.detail.clean ? "" : "(ERROR)"));
        if (this.data.dialog) {
            this.data.dialog.setAttribute('visible', true);
        }
    },
    onCapabilities: function (ev) {
        // this.rfb.capabilities.power
    },
    updateTitle: function (title) {
        if (typeof XYWindow === 'undefined') return;
        var w = XYWindow.currentWindow(this.el);
        if (w) {
            w.setTitle("VNC " + title);
        }
    },
    sendMouseEvent: function (event, x, y, buttons) {
        if (!this.canvas) return;
        var e = new MouseEvent(event, { screenX: x, screenY: y, clientX: x, clientY: y, x: x, y: y });
        this.canvas.dispatchEvent(e);
    },
    sendCtrlAltDel: function () { this.rfb.sendCtrlAltDel(); },
    machineShutdown: function () { this.rfb.machineShutdown(); },
    machineReboot: function () { this.rfb.machineReboot(); },
    machineReset: function () { this.rfb.machineReset(); }
});

AFRAME.registerPrimitive('a-vnc', {
    defaultComponents: {
        vncclient: {},
        geometry: {
            primitive: 'plane'
        },
        material: {
            color: '#fff',
            shader: 'flat'
        }
    },
    mappings: {
        width: 'geometry.width',
        height: 'geometry.height',
        dialog: 'vncclient.dialog'
    }
});

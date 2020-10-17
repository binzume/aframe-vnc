# A-Frame VNC client

WebVR VNC client component. (depends on noVNC)

## Example

T.B.D.

```html
<a-vnc width="16" height="9"></a-vnc>
<script>
    var vnc = document.querySelector('a-vnc');
    vnc.connect("localhost:8080", "password");
</script>
```

or

- https://github.com/etiennepinchon/aframe-material
- https://github.com/binzume/aframe-xylayout

```html
<a-xywindow id="vnc" position="0 0 -8" title="VNC Client" width="16" height="9">
    <a-vnc width="16" height="9" dialog="#connect_dialog"></a-vnc>
    <a-rounded id="connect_dialog" position="0 0 5" width="2.5" height="1.5" radius="0.05">
    <a-xycontainer position="0.2 0.2 0.05" width=2 height=1>
        <a-input name="vnc_address" placeholder="host:port" color="black" width="1" xyrect="height:0.16"></a-input>
        <a-input name="vnc_password" placeholder="Password" type="password" color="black" width="1" xyrect="height:0.16"></a-input>
        <a-button name="vnc_connect" value="Connect" type="raised" xyrect="height:0.22" scale="0.5 0.5 0.5"></a-button>
    </a-xycontainer>
    </a-rounded>
</a-xywindow>
```

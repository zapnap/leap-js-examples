var LeapEx = {
  ws: null,
  ctx: null,
  offsetX: 250,
  hackY: 500,
  el: null,

  init: function(el) {
    LeapEx.el = $(el);

    // Support both the WebSocket and MozWebSocket objects
    if ((typeof(WebSocket) == 'undefined') &&
        (typeof(MozWebSocket) != 'undefined')) {
      WebSocket = MozWebSocket;
    }

    LeapEx.ctx = $(el)[0].getContext("2d");
    LeapEx.ws = new WebSocket("ws://localhost:6437/");

    LeapEx.ws.onopen = function(event) {
      document.getElementById("connection").innerHTML = "WebSocket connection open!";
    };

    LeapEx.ws.onclose = function(event) {
      LeapEx.ws = null;
      document.getElementById("connection").innerHTML = "WebSocket connection closed";
    };

    LeapEx.ws.onerror = function(event) {
      console.log("Received error");
    };

    LeapEx.ws.onmessage = function(event) {
      var obj = JSON.parse(event.data);
      var str = JSON.stringify(obj, undefined, 2);
      // console.log(str);

      if (obj.hands.length > 0) {
        var hand = obj.hands[0];
        var x = hand.palmPosition[0];
        var y = hand.palmPosition[1];
        var z = hand.palmPosition[2];

        if (z < 0) { z = 0; }
        LeapEx.draw(x, y, z);
      }
    };

    return LeapEx.el;
  },

  draw: function (x, y, z) {
    LeapEx.ctx.clearRect(0,0,500,500);
    LeapEx.ctx.beginPath();
    LeapEx.ctx.arc(x + LeapEx.offsetX, LeapEx.hackY - y, z, 0, Math.PI*2, true);
    LeapEx.ctx.closePath();
    LeapEx.ctx.fill();
  }
};

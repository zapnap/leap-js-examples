var LeapEx = {
  ws: null,
  ctx: null,
  width: null,
  height: null,
  debugEl: null,
  el: null,
  leapMinX: -200,
  leapMaxX: 200,
  leapMinY: 100,
  leapMaxY: 600,
  leapMinZ: -180,
  leapMaxZ: 180,
  started: false,

  init: function(el, debugEl) {
    LeapEx.el = $(el);
    LeapEx.debugEl = $(debugEl);

    // Support both the WebSocket and MozWebSocket objects
    if ((typeof(WebSocket) == 'undefined') &&
        (typeof(MozWebSocket) != 'undefined')) {
      WebSocket = MozWebSocket;
    }

    var w = LeapEx.width = $(window).width();
    var h = LeapEx.height = $(window).height();
    $(el).attr('width', w).css('width', w).attr('height', h).css('height', h);
    $(el).css('position', 'absolute').css('left', '0').css('top', '0');

    LeapEx.ctx = $(el)[0].getContext("2d");
    LeapEx.ws = new WebSocket("ws://localhost:6437/");

    LeapEx.ws.onopen = function(event) {
      LeapEx.debug("WebSocket connection open!");
    };

    LeapEx.ws.onclose = function(event) {
      LeapEx.ws = null;
      LeapEx.debug("WebSocket connection closed");
    };

    LeapEx.ws.onerror = function(event) {
      LeapEx.debug("Received error");
    };

    LeapEx.ws.onmessage = function(event) {
      if (LeapEx.started) {
        var obj = JSON.parse(event.data);
        var str = JSON.stringify(obj, undefined, 2);

        LeapEx.debug(str);

        if (typeof(obj.hands) != 'undefined' && obj.hands.length > 0) {
          var targets = [];

          for (var i=0; i<obj.hands.length; i++) {
            var hand = obj.hands[i];
            var x = hand.palmPosition[0];
            var y = hand.palmPosition[1];
            var z = hand.palmPosition[2];

            if (z < 10) { z = 10; }
            targets.push({ 'x': x, 'y': y, 'z': z });
          }

          LeapEx.draw(targets);
        }
      }
    };

    $(document.body).click(function() {
      LeapEx.toggle();
    });

    LeapEx.started = true;
    return LeapEx.el;
  },

  draw: function(targets) {
    LeapEx.ctx.clearRect(0, 0, LeapEx.width, LeapEx.height);
    LeapEx.ctx.beginPath();
    for (var i=0; i<targets.length; i++) {
      var target = targets[i];
      LeapEx.ctx.arc(LeapEx.scale(target.x, LeapEx.leapMinX, LeapEx.leapMaxX, -100, LeapEx.width),
                     LeapEx.scale(target.y, LeapEx.leapMinY, LeapEx.leapMaxY, LeapEx.height, -100),
                     target.z, 0, Math.PI*2, true);
      LeapEx.ctx.closePath();
      LeapEx.ctx.fill();
    }
  },

  scale: function(value, oldMin, oldMax, newMin, newMax) {
    return (((newMax - newMin) * (value - oldMin)) / (oldMax - oldMin)) + newMin;
  },

  toggle: function() {
    if (LeapEx.started) {
      LeapEx.started = false;
    } else {
      LeapEx.started = true;
    }
  },

  debug: function(message) {
    if (LeapEx.debugEl) {
      LeapEx.debugEl.text(message);
    }
  }
};

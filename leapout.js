var LeapOut = {
  ws: null,
  ctx: null,
  width: null,
  height: null,
  el: null,
  debugEl: null,
  leapMinX: -200,
  leapMaxX: 200,
  leapMinY: 100,
  leapMaxY: 600,
  leapMinZ: -180,
  leapMaxZ: 180,
  started: false,
  intervalId: null,

  paddle: {
    'x': null,
    'y': null,
    'width': 200,
    'height': 10
  },

  ball: {
    'radius': 10,
    'x': 50,
    'y': 150,
    'dx': 2,
    'dy': 3
  },

  init: function(el, debugEl) {
    this.el = $(el);
    this.debugEl = $(debugEl);

    // Support both the WebSocket and MozWebSocket objects
    if ((typeof(WebSocket) == 'undefined') &&
        (typeof(MozWebSocket) != 'undefined')) {
      WebSocket = MozWebSocket;
    }

    var w = this.width = $(window).width();
    var h = this.height = $(window).height();
    $(el).attr('width', w).css('width', w).attr('height', h).css('height', h);
    $(el).css('position', 'absolute').css('left', '0').css('top', '0');

    this.ctx = $(el)[0].getContext("2d");
    this.ws = new WebSocket("ws://localhost:6437/");

    this.ws.onopen = function(event) {
      LeapOut.debug("WebSocket connection open!");
      LeapOut.start();
    };

    this.ws.onclose = function(event) {
      LeapOut.ws = null;
      LeapOut.debug("WebSocket connection closed");
    };

    this.ws.onerror = function(event) {
      LeapOut.debug("Received error");
    };

    this.ws.onmessage = function(event) {
      var obj = JSON.parse(event.data);
      var str = JSON.stringify(obj, undefined, 2);

      LeapOut.debug(str);

      if (typeof(obj.hands) != 'undefined' && obj.hands.length > 0) {
        var hand = obj.hands[0];
        var x = hand.palmPosition[0];
        LeapOut.paddle.x = LeapOut.scale(x, LeapOut.leapMinX, LeapOut.leapMaxX, 0, LeapOut.width - LeapOut.paddle.width);
        if (LeapOut.paddle.x > LeapOut.width - LeapOut.paddle.width) { LeapOut.paddle.x = LeapOut.width - LeapOut.paddle.width; }
        if (LeapOut.paddle.x < 0) { LeapOut.paddle.x = 0; }
      }
    };

    $(document.body).click(function() {
      LeapOut.toggle();
    });

    LeapOut.started = true;

    return this.el;
  },

  start: function() {
    this.paddle.x = (this.width - this.paddle.width) / 2;
    this.paddle.y = this.height - this.paddle.height;

    var self = this;
    this.intervalId = setInterval(function() {
      self.draw();
    });

    return this.intervalId;
  },

  initPaddle: function() {
  },

  draw: function() {
    this.clear();
    this.drawPaddle();
    this.drawBall();

    if (this.ball.x + this.ball.dx > this.width || this.ball.x + this.ball.dx < 0) {
      this.ball.dx = -this.ball.dx;
    }

    if (this.ball.y + this.ball.dy < 0) {
      this.ball.dy = -this.ball.dy;
    } else if (this.ball.y + this.ball.dy > this.height) {
      if (this.ball.x > this.paddle.x && this.ball.x < this.paddle.x + this.paddle.width) {
        this.ball.dy = -this.ball.dy;
      } else {
        clearInterval(this.intervalId);
      }
    }

    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
  },

  clear: function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  },

  drawPaddle: function() {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    ctx.closePath();
    ctx.fill();
  },

  drawBall: function() {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
  },

  scale: function(value, oldMin, oldMax, newMin, newMax) {
    return (((newMax - newMin) * (value - oldMin)) / (oldMax - oldMin)) + newMin;
  },

  toggle: function() {
    if (LeapOut.started) {
      LeapOut.started = false;
    } else {
      LeapOut.started = true;
    }
  },

  debug: function(message) {
    if (LeapOut.debugEl) {
      LeapOut.debugEl.text(message);
    }
  }
};

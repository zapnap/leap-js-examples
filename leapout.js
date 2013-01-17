var LeapOut = {
  ws: null,
  ctx: null,
  offsetX: 250,
  el: null,
  width: null,
  height: null,
  intervalId: null,

  paddle: {
    'x': null,
    'y': null,
    'width': 75,
    'height': 10
  },

  ball: {
    'radius': 10,
    'x': 50,
    'y': 150,
    'dx': 2,
    'dy': 3
  },

  init: function(el) {
    this.el = $(el);

    // Support both the WebSocket and MozWebSocket objects
    if ((typeof(WebSocket) == 'undefined') &&
        (typeof(MozWebSocket) != 'undefined')) {
      WebSocket = MozWebSocket;
    }

    this.ctx = $(el)[0].getContext("2d");
    this.width = $(el).width();
    this.height = $(el).height();

    this.ws = new WebSocket("ws://localhost:6437/");

    this.ws.onopen = function(event) {
      document.getElementById("connection").innerHTML = "WebSocket connection open!";
      LeapOut.start();
    };

    this.ws.onclose = function(event) {
      LeapOut.ws = null;
      document.getElementById("connection").innerHTML = "WebSocket connection closed";
    };

    this.ws.onerror = function(event) {
      console.log("Received error");
    };

    this.ws.onmessage = function(event) {
      var obj = JSON.parse(event.data);
      var str = JSON.stringify(obj, undefined, 2);
      //console.log(str);

      if (obj.hands.length > 0) {
        var hand = obj.hands[0];
        var x = hand.palmPosition[0];
        // var y = hand.palmPosition[1];
        // var z = hand.palmPosition[2];
        // if (z < 0) { z = 0; }
        LeapOut.paddle.x = x + LeapOut.offsetX;
      }
    };

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
  }
};

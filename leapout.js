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
  reset: false,
  intervalId: null,
  brickRows: 5,
  brickCols: 10,
  brickHeight: 20,
  brickWidth: null,
  brickPad: 1,
  bricks: new Array(),

  paddleStart: {
    'x': null,
    'y': null,
    'width': 200,
    'height': 10
  },

  ballStart: {
    'radius': 10,
    'x': 250,
    'y': 150,
    'dx': 4,
    'dy': 6
  },

  paddle: null,
  ball: null,

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
      if (LeapOut.started) {
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
      }
    };

    $(document.body).click(function() {
      if (LeapOut.reset) {
        LeapOut.start();
      } else {
        LeapOut.toggle();
      }
    });

    LeapOut.started = true;

    return this.el;
  },

  start: function() {
    this.paddle = jQuery.extend(true, {}, this.paddleStart);
    this.ball = jQuery.extend(true, {}, this.ballStart);
    this.buildBricks();

    this.paddle.x = (this.width - this.paddle.width) / 2;
    this.paddle.y = this.height - this.paddle.height;

    var self = this;
    this.intervalId = setInterval(function() {
      if (self.started) {
        self.draw();
      }
    });

    this.reset = false;
    this.started = true;
    return this.intervalId;
  },

  buildBricks: function() {
    this.brickWidth = (this.width / this.brickCols) - 1;

    this.bricks = new Array(this.brickRows);
    for (i=0; i < this.brickRows; i++) {
      this.bricks[i] = new Array(this.brickCols);
      for (j=0; j < this.brickCols; j++) {
        this.bricks[i][j] = 1;
      }
    }
  },

  draw: function() {
    this.clear();
    this.drawBricks();
    this.drawPaddle();
    this.drawBall();

    // have we hit a brick?
    var rowHeight = this.brickHeight + this.brickPad;
    var colWidth = this.brickWidth + this.brickPad;
    var row = Math.floor(this.ball.y / rowHeight);
    var col = Math.floor(this.ball.x / colWidth);

    // if so, reverse the ball and mark the brick as broken
    if ((this.ball.y < this.brickRows * rowHeight) && (row >= 0) && (col >= 0) && (this.bricks[row][col] == 1)) {
      this.ball.dy = -this.ball.dy;
      this.bricks[row][col] = 0;
    }

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
        LeapOut.debug('Game Over!');
        this.started = false;
        this.reset = true;
      }
    }

    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
  },

  clear: function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  },

  drawBricks: function() {
    var ctx = this.ctx;
    ctx.beginPath();

    for (i=0; i < this.brickRows; i++) {
      for (j=0; j < this.brickCols; j++) {
        if (this.bricks[i][j] == 1) {
          ctx.rect((j * (this.brickWidth + this.brickPad)) + this.brickPad,
                   (i * (this.brickHeight + this.brickPad)) + this.brickPad,
                   this.brickWidth, this.brickHeight);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
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

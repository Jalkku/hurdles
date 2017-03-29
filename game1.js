var bgColor = "#388E3C";
var lanes = [];
var playerLane;
var start;
var timer;
var names = [];

function initialize(callback) {
    $.getJSON('hurdlers.json', function(data) {
        var count = 0;
        data.data.forEach(function(name) {
            //var name_ = name.forename+" "+name.surname+" ["+name.nationality+"]";
            names.push(name);
            count += 1;
        });
        callback();
    });
}

$(document).ready(function() {
    initialize(function() {
        start();
    });
});

function start() {
    // bg init
    var bg = document.getElementById("background");
    var bgCtx = bg.getContext("2d");
    bgCtx.rect(0, 0, bg.width, bg.height);
    bgCtx.fillStyle = bgColor;
    bgCtx.fill();

    document.getElementById('results').style.display = "none";

    var playerInited = false;
    
    for (var i = 10; i > 0; i--) {
        var lane;
        if (Math.random() > 0.8 && !playerInited) {
            playerLane = new Lane(i, i, true);
            lanes.push(playerLane);
            playerLane.player.name = "Player";
            playerInited = true;
        } else {
            lane = new Lane(i, i, false);
            lanes.push(lane);
            var asd = names[0]
            var name_ = names[Math.floor(Math.random()*names.length)];
            lane.player.name = name_.forename+" "+name_.lastname+" ["+name_.nationality+"]";
        }
    }

    var lastPressed = 0;
    document.addEventListener('keydown', function(event) {
        if(event.keyCode == 37 && lastPressed != 37) {
            lastPressed = event.keyCode;
            playerLane.player.run(true);
        }
        else if(event.keyCode == 38 && lastPressed != 38) {
            lastPressed = event.keyCode;
            playerLane.player.jump();
        }
        else if(event.keyCode == 39 && lastPressed != 39) {
            lastPressed = event.keyCode;
            playerLane.player.run(false);
        }
    });

    update();
    updateUI();
    countDown();
    perfectRun();
}

var requestAnimationFrame =  
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    function(callback) {
        return setTimeout(callback, 10);
    };

function perfectRun() {
    setInterval(function() {
        playerLane.player.run();
    }, 10);
}

function countDown() {
    var count = 3;
    var interval = setInterval(function() {
        console.log("helo")
        var canvas = document.getElementById("background");
        var bgCtx = canvas.getContext("2d");
        bgCtx.fillStyle = bgColor;
        bgCtx.fill();
        bgCtx.font = "100px Arial";
        bgCtx.fillStyle = '#26C6DA';
        if (count > 0) {
            bgCtx.fillText(count,canvas.width/2,150);
            count -= 1;
        } else if (count === 0) {
            bgCtx.fillText("Go!",canvas.width/2,150);
            count -= 1;
            start = true;
            timer = new Date();
        } else {
            clearInterval(interval);
        }
    }, 10);
}

var update = function() {
    var canvas = document.getElementById("layer1");
    var l1Ctx = canvas.getContext("2d");
    l1Ctx.clearRect(0, 0, canvas.width, canvas.height);

    var finished = true;

    lanes.forEach(function(lane) {
        for (var i = -10; i < 256; i++) {
            var model = lane.model;
            if (i === 2 || i === 180)
                model = lane.model_line;
            l1Ctx.drawImage(model, 32*i-playerLane.player.position.x+(lane.x*24), canvas.height-(1+lane.y)*48, 48, 48);
        }
        lane.player.update();
        if (lane != playerLane && Math.random() > 0.9 && lane.player.position.x < 32*180) {
            lane.player.run();
        }
        // Render hurdles
        lane.hurdles.forEach(function(hurdle) {
            var x = hurdle.position.x-playerLane.player.position.x+(lane.x*24);
            l1Ctx.drawImage(hurdle.model, hurdle.shift, 0, 64, 64, x, hurdle.position.y-(10+lane.y*48), 64, 64);
            hurdle.update();
        });

        if (!lane.player.finished)
            finished = false;
        // Render player
        l1Ctx.drawImage(lane.player.model, lane.player.shift, 0, 64, 64, lane.player.position.x-playerLane.player.position.x+(lane.x*24), lane.player.position.y-(lane.y*48), 64, 64);
    });

    if (finished)
        showResults();
    else
        requestAnimationFrame(update);
}

function showResults() {
    document.getElementById('results').style.display = "block";
    var results = [];
    lanes.forEach(function(lane) {
        var result = {"name": lane.player.name, "time": lane.player.time/100};
        results.push(result);
    });
    results.sort(function (b, a) {
        return a.time - b.time;
    });
    
    var table = document.getElementById("resultTable");
    
    for (var i = 0; i < results.length; i++) {
        var row = table.insertRow(0);
        var posCell = row.insertCell(0);
        var nameCell = row.insertCell(1);
        var timeCell = row.insertCell(2);
        posCell.innerHTML = 10-i;
        nameCell.innerHTML = results[i].name;
        timeCell.innerHTML = results[i].time+"s";
    }
}

function updateUI() {
    var elem = document.getElementById("bar");   
    var width = playerLane.player.velocity.x*20;
    if (width > 100)
        width = 100;
    elem.style.width = (width).toString()+'%'; 
    requestAnimationFrame(updateUI);
}

function Lane(x, y, isPlayer) {
    this.player = new Player(this, isPlayer);
    this.y = y;
    this.x = x;
    this.model = new Image();
    this.model.src = 'img/track.png';
    this.model.addEventListener("load", loadImage, false);
    this.model_line = new Image();
    this.model_line.src = 'img/track_line.png';
    this.model_line.addEventListener("load", loadImage, false);

    function loadImage(e) {
        //update();
    }
    
    this.hurdles = [];
    for (var i = 0; i < 10; i++) { 
        var hurdle = new Hurdle(i+1);
        this.hurdles.push(hurdle);
    }
}

function Player(lane, isPlayer) {
    this.name = "";
    var canvas = document.getElementById("layer1");
    this.model = new Image();
    if (isPlayer)
        this.model.src = 'img/player.png';
    else
        this.model.src = 'img/ai.png';
    this.model.addEventListener("load", loadImage, false);
    this.shift = 0; // Idle
    this.lane = lane;

    this.finished = false;

    this.time;

    function loadImage(e) {
        //update();
    }

    var x = 10;
    var y = 64;
    this.position = {x: x, y:  canvas.height - y};
    this.y = y - canvas.height;
    this.velocity = {x:0, y:0};

    this.isLeft = true; // Run animation

    this.run = function() {
        if (this.velocity.x < 5)
            this.velocity.x += 1/(this.velocity.x+1);
    };

    this.jump = function(isLeft) {
        if (this.position.y > canvas.height-65)
            this.velocity.y += 2;
    };

    this.hit = function(isLeft) {
        if (this.velocity.x > 1)
            this.velocity.x = 1;
    };

    this.update = function() {
        if (!start)
            return;
        // collision detection
        var that = this; // ?????
        this.lane.hurdles.forEach(function(hurdle) {
            // euclidean distance
            var dist = Math.sqrt((Math.pow((hurdle.position.x-that.position.x), 2)+(Math.pow((hurdle.position.y-that.position.y), 2))));
            if (dist < 22 && hurdle.shift === 0) {
                hurdle.hit();
                hurdle.position.x += 50;
                that.lane.player.hit();
            }
            // ai jump
            if (that.lane != playerLane && dist < Math.random()*100) {
                that.lane.player.jump();
            }
        });

        this.position.x += this.velocity.x;
        this.position.y -= this.velocity.y;

        if (this.velocity.x > 0) {
            this.velocity.x -= 0.02;
            this.shift = 64*(1+Math.floor((this.position.x/10)%2)); // Run sprite
        }

        if (this.position.y < canvas.height-64) {
            this.velocity.y -= 0.05;
            this.shift = 192; // Jump sprite
        } else {
            this.velocity.y = 0;
        }

        if (this.position.x >= 32*18 && !this.finished) {
            this.finished = true;
            this.time = new Date() - timer;
        }
    };
    return this;
}

function Hurdle(i) {
    var canvas = document.getElementById("layer1");
    this.model = new Image();
    this.model.src = 'img/hurdle.png';
    //this.model.addEventListener("load", loadImage, false);
    this.shift = 0;

    var x = 100;
    var y = 64;
    this.position = {x: 5*i*x, y: canvas.height - y};

    this.hit = function() {
        this.shift = 64;
    };

    this.update = function() {
        if (this.shift == 64)
            this.shift = 128;
    }
    return this;
}
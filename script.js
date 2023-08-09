// display background by using window 'load' event;
// load event is fired when the whole page is loaded;
window.addEventListener("load", function () {
  //canvas setup for game background
  const canvas = document.getElementById("canvas1");

  //drawing context which is use to draw things over canvas
  const ctx = canvas.getContext("2d");
  canvas.width = 500;
  canvas.height = 500;

  //input handler where we handle all of the user inputs
  class InputHandler {
    constructor(game) {
      this.game = game;
      //adding key to arr of keys when we press the key
      window.addEventListener("keydown", (e) => {
        if (
          // for movement of the Player
          (e.key === "ArrowUp" || e.key === "ArrowDown") &&
          this.game.keys.indexOf(e.key) === -1
        ) {
          this.game.keys.push(e.key);
        }
        // for projectile shooting with space
        else if (e.key === " ") {
          this.game.player.shootTop();
        }
      });
      //removing key from arr of keys when we release the key
      window.addEventListener("keyup", (e) => {
        if (this.game.keys.indexOf(e.key) > -1) {
          this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
        }
      });
    }
  }

  //laser from the player to shoot enemy.
  class Projectile {
    //x y will use the current position of the player
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 10;
      this.height = 3;
      this.speed = 3;
      // to set range for projectile
      this.markedForDeletion = false;
    }
    update() {
      this.x += this.speed;
      // making bullet to have range in this case 80 percent of the canvas
      if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
    }
    draw(context) {
      context.fillStyle = "yellow";
      context.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  class Particle {}
  // in canvas top left corner is 0,0 point;
  class Enemy {
    constructor(game) {
      this.game = game;
      this.x = this.game.width;
      this.speedX = Math.random() * -1.5;
      this.markedForDeletion = false;
      this.health = 3;
    }
    update() {
      this.x += this.speedX;
      if (this.x + this.width < 0) this.markedForDeletion = true;
    }
    draw(context) {
      context.fillStyle = "red";
      context.fillRect(this.x, this.y, this.width, this.height);
      context.fillStyle = "black";
      context.font = "20px helvetica";
      context.fillText(this.health, this.x, this.y);
    }
  }

  class Angler1 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 228 * 0.2;
      this.height = 169 * 0.2;
      this.y = Math.random() * (this.game.height * 0.9 - this.height);
    }
  }

  class Player {
    constructor(game) {
      this.game = game;
      this.width = 120;
      this.height = 190;
      this.x = 20;
      this.y = 100;
      this.speedY = 0;
      this.maxSpeed = 3;
      this.projectiles = [];
    }

    //update the player according to the user
    update() {
      if (this.game.keys.includes("ArrowUp")) this.speedY = -this.maxSpeed;
      else if (this.game.keys.includes("ArrowDown"))
        this.speedY = this.maxSpeed;
      else this.speedY = 0;
      this.y += this.speedY;
      // handle projectiles
      this.projectiles.forEach((projectile) => {
        projectile.update();
      });
      // we assign the filtered arr to change the original arr because filter in javascript only made shallow copy
      // we filter out the bullet which exceed 80 percent of canvas
      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markedForDeletion
      );
    }

    //draw the player on the canvas according to the changes through update() especially player's position
    draw(context) {
      context.fillStyle = "black";
      context.fillRect(this.x, this.y, this.width, this.height);
      this.projectiles.forEach((projectile) => {
        projectile.draw(context);
      });
    }

    //
    shootTop() {
      if (this.game.ammo > 0) {
        //making instances of every projectile we shoot and put it to the projectiles arr in order to make animation.
        this.projectiles.push(new Projectile(this.game, this.x, this.y));
        this.game.ammo--;
      }
    }
  }
  // UI
  class Ui {
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = "Helvetica";
      this.color = "white";
    }
    // ctx save and restore function make a capsulation for the style between them;
    // missing one of them will make effect everything on the canvas;
    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.shadowColor = "black";
      context.font = this.fontSize + "px " + this.fontFamily;
      context.fillText("Scores: " + this.game.scores, 5, 25);
      context.font = `20px Helvetica`;
      context.fillText("Ammo", 5, 50);
      for (let i = 0; i < this.game.ammo; i++) {
        context.fillRect(70 + 5 * i, 35, 2, 15);
      }
      context.restore();
    }
  }
  //The whole game Logic
  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.player = new Player(this);
      this.InputHandler = new InputHandler(this);
      //command for player to move/key will be added if user press and will be removed as soon as user release the key.
      //That is why there can be only one key in keys array.
      this.keys = [];
      // To handle ammo and reloading
      this.ammo = 20;
      this.maxAmmo = 25;
      this.ammoTimer = 0;
      this.ammoInterval = 500;
      // Enemy
      this.enemies = [];
      this.enemyTimer = 0;
      this.enemyInterval = 1000;
      // UI
      this.ui = new Ui(this);
      //score
      this.scores = 0;
      this.winningScore = 3;
      this.gameOver = false;
    }
    update(deltaTime) {
      this.player.update();
      // reloading the ammo -- every 500 milliseconds 1 ammo is added if maxAmmo is greater than ammo;
      if (this.ammoTimer > this.ammoInterval) {
        if (this.ammo < this.maxAmmo) this.ammo++;
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }
      // for enemy
      this.enemies.forEach((enemy) => {
        enemy.update();
        // detect collision
        if (this.checkCollision(this.player, enemy)) {
          enemy.markedForDeletion = true;
        }
        this.player.projectiles.forEach((projectile) => {
          if (this.checkCollision(projectile, enemy)) {
            projectile.markedForDeletion = true;
            enemy.health--;
            if (enemy.health <= 0) {
              enemy.markedForDeletion = true;
              this.scores++;

              if (this.scores > this.winningScore) this.gameOver = true;
            }
          }
        });
      });
      this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);
      // making enemy every 1 second
      if (this.enemyTimer > this.enemyInterval) {
        this.addEnemy();
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
    }
    draw(context) {
      this.player.draw(context);
      this.ui.draw(context);
      // for enemy
      this.enemies.forEach((enemy) => {
        enemy.draw(context);
      });
    }

    // Enemy
    addEnemy() {
      this.enemies.push(new Angler1(this));
    }

    // Both obj1 and obj2 are rectangle and on canvas which mean they have x and y position, and width and height
    // try to return true if they are touch otherwise return false
    // Rects have 4 side so try to adjust // try to focus on one object
    checkCollision(obj1, obj2) {
      return (
        // if obj2 is located on the left and right side of the obj1 will return false;
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        // if obj2 is located on the over and under side of the obj1 will return false;
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
      );
    }
  }

  const game = new Game(canvas.width, canvas.height);

  //deltaTime is the different in milliseconds between timeStamp from this loop and timeStamp from the prev loop
  // we can get timeStamp from the help of requestAnimationFrame function
  // if deltaTime is 16. milliseconds which mean we update the animation every 16.milliseconds
  // 1000 ms (1 second) / 16. ms = 60 fps
  // Our app is running animation at 60 fps
  let lastTime = 0;

  // animation loop
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    //we need to clear the rect from the old frame.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(deltaTime);
    game.draw(ctx);
    //To make infinity loop
    requestAnimationFrame(animate);
    //test
    console.log(game.scores);
  }
  //we pass '0' for the starter point of timeStamp;
  animate(0);

  //for test purpose
  const btn = document.querySelector("#btn");
  btn.addEventListener("click", function () {
    console.log(game);
  });
});

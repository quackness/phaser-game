//toutorial: https://phaser.io/tutorials/making-your-first-phaser-3-game/part1

var gameContainer = document.querySelector('#phaser-game');
console.log(gameContainer)


var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};


var player;
var platforms;
var cursors;
var stars;
var score = 0;
var scoreText;
let bombs;
let music;
let lost;
var button;
var soundOn;

var game = new Phaser.Game(config);

function preload() {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/platform.png');
  this.load.image('star', 'assets/star.png');
  this.load.image('bomb', 'assets/bomb.png');
  this.load.spritesheet('dude',
    'assets/dude.png',
    { frameWidth: 32, frameHeight: 48 }
  );
  //music comes from the web site https://www.chosic.com/download-audio/39324/
  this.load.audio('backgroundMusic', 'assets/chaos.mp3');
  // https://iconscout.com/icons/volume-off
  this.load.image('button', 'assets/soundOff.jpg');
  this.load.image('soundOn', 'assets/soundOn.jpg');
}

function create() {
  //instructiosn how to add music taken from chat gtp 
  music = this.sound.add('backgroundMusic', { volume: 0.1, loop: true });
  music.play();
  console.log("create start", music.isPlaying);
  //The background image is 800 x 600 pixels in size, 400 and 300 places it in the center
  this.add.image(400, 300, 'sky');
  platforms = this.physics.add.staticGroup();
  //the first one has to be doubled in size to go across the canvas screen
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  player = this.physics.add.sprite(100, 450, 'dude');

  button = this.add.image(775, 20, 'button').setInteractive().setDisplaySize(40, 30);
  soundOn = this.add.image(775, 20, 'soundOn').setInteractive().setDisplaySize(40, 30).setVisible(false);
  console.log("before button up", music.isPlaying);
  // https://newdocs.phaser.io/docs/3.54.0/Phaser.Input.Events.GAMEOBJECT_POINTER_UP
  button.on('pointerup', function () {
    // Add functionality when the button is clicked
    if (music.isPlaying) {
      music.stop();
      // https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.Scenes.Systems-setVisible
      button.setVisible(false);
      soundOn.setVisible(true);
      return;
    }
  });
  soundOn.on('pointerup', function () {
    music.play();
    soundOn.setVisible(false);
    button.setVisible(true);
    return;
  });

  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [{ key: 'dude', frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  cursors = this.input.keyboard.createCursorKeys();

  //add star dust
  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 }
  });
  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  bombs = this.physics.add.group();
  //collisions
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);
  //overlapping
  this.physics.add.overlap(player, stars, collectStar, null, this);
  this.physics.add.collider(player, bombs, hitBomb, null, this);

  //add score text, extra text modification insipred by: https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Text.html
  scoreText = this.add.text(16, 16, 'score: 0', {
    fontSize: '32px', fill: 'coral', fontStyle: 'italic ', fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'
  });
  gameContainer.appendChild(game.canvas);
}

let grabCanvas = document.querySelector('canvas');
console.log(grabCanvas);
//credit: https://tailwindcss.com/docs/border-style
grabCanvas.classList.add('border', 'border-double', 'border-20', 'border-y-rose-500', 'rounded-md', 'outline-dotted', 'outline-offset-8');


function update() {
  if (cursors.left.isDown) {
    player.setVelocityX(-160);

    player.anims.play('left', true);
  }
  else if (cursors.right.isDown) {
    player.setVelocityX(160);

    player.anims.play('right', true);
  }
  else {
    player.setVelocityX(0);

    player.anims.play('turn');
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }
}

function collectStar(player, star) {
  //hide the star if the body overlaps with it
  star.disableBody(true, true);
  score += 10;
  scoreText.setText('Score: ' + score);

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {

      child.enableBody(true, child.x, 0, true, true);

    });

    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}


function hitBomb(player, bomb) {
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play('turn');
  lost = this.add.text(350, 250, 'You lost!', {
    fontSize: '32px', fill: 'red', fontStyle: 'italic ', fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'
  });
  gameOver = true;
}

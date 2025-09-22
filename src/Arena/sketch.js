let assets = [];
let cards = [];
let your_cards = [];
let your_deck = [];
let turn_counter;
let opponent_cards = [];
let opponent_deck = [];
let pickcard;
let cardback;
let wwidth;
let wheight;
let cardwidth;
let cardheight;
let assetswidth;
let assetsheight;
let newgame_button;
let drawcard_button;
let cardpower = [
  {student:1},
  {drummer:2},
  {stem:3},
  {cat:4}
];


function preload(){
  cards[1] = loadImage('/assets/1-Student.png');
  cards[2] = loadImage('/assets/2-Drummer.png');
  cards[3] = loadImage('/assets/3-STEM.png');
  cards[4] = loadImage('/assets/4-Cat.png');
  cards[0]= loadImage('/assets/Cardback.png');
  assets[0] = 
    loadImage('/Arena/assets/Victory.png');
  assets[1] =
    loadImage('/Arena/assets/Lose.png');
  assets[2] = 
    loadImage('/Arena/assets/Tie.png');
  assets[3] = loadImage('/Arena/assets/LetsPlay.png');
}



function setup() {
  wwidth = windowWidth*(2/3);
  wheight = windowWidth*(3/4)*(2/3);
  cardheight = wheight*(1/3);
  cardwidth = cardheight*(2/3);
  assetsheight = wheight*(3/10);
  assetswidth = assetsheight*(2/1);
  createCanvas(wwidth, wheight);
  newgame_button = createButton('New Game');
  newgame_button.position(wwidth*(1/10),wheight*(9/10));
  newgame_button.style("background-color", "#FFA24A");
  //newgame_button.size(wwidth*(1/5), AUTO);
  newgame_button.mousePressed(startnewgame);
  drawcard_button = createButton('Show Card');
  drawcard_button.position(wwidth*(1/10), wheight*(9/10));
  drawcard_button.mousePressed(showcards);
  drawcard_button.style("background-color", "#FFA24A");
  //drawcard_button.size(wwidth*(1/5), AUTO);
  background('slateblue');
  image(assets[3],wwidth*(1/4), wheight*(1/10), wheight*(4/5), wheight*(4/5));
  newgame_button.show();
  drawcard_button.hide();
}

function startnewgame(){
  
  background('lightskyblue');
  image(cards[0],wwidth*(3/10), wheight*(1/4), cardwidth, cardheight);
  textSize(width/25);
  textFont('Helvetica');
  stroke("seagreen");
  strokeWeight(2);
  fill("seagreen");
  text("You", wwidth*(1/3), wheight*(2/3));
  stroke("crimson");
  fill("crimson");
  text("Opponent", wwidth*(8/10), wheight*(2/3));

  image(cards[0],wwidth*(8/10), wheight*(1/4), cardwidth, cardheight);
  your_cards = [1, 2, 3, 4];
  opponent_cards = [1, 2, 3, 4];
  turn_counter = your_cards.length-1; 
  newgame_button.hide();
  drawcard_button.show();
  
  textSize(width/20);
  textFont('Helvetica');
  stroke('black');
  strokeWeight(2);
  fill('Black')
  text("Remaining Turns:", wwidth*(2/10), wheight*(1/10));
  text(int(turn_counter)+1, wwidth*(7/10), wheight*(1/10));
  
  for (let i = 0; i <=turn_counter; i++){
    pickcard = int(random(your_cards.length));
    your_deck[i]= your_cards[pickcard];
    your_cards.splice(pickcard,1);
  }
  
  for (let i = 0; i <=turn_counter; i++){
    pickcard = int(random(opponent_cards.length));
    opponent_deck[i]= opponent_cards[pickcard];
    opponent_cards.splice(pickcard,1);
  }
  
}

function showcards() {
  if(turn_counter==0){
    newgame_button.show();
    drawcard_button.hide(); 
  } 

  
    image(cards[your_deck[turn_counter]], wwidth*(1/10), wheight*(1/4), cardwidth, cardheight);

    image(cards[opponent_deck[turn_counter]], wwidth*(6/10), wheight*(1/4), cardwidth, cardheight);
    
  
   
  
    fill('lightskyblue');
    noStroke();
    rect(0, 0,wwidth,wheight*(1/5));
    rect(0,wheight*(4/5),wwidth, wheight*(1/5));
  
    fill('black');
    textSize(width/20);
    textFont('Helvetica');
    stroke("black");
    strokeWeight(2);
    text("Remaining Turns: ", wwidth*(2/10), wheight*(1/10));
    text(int(turn_counter), wwidth*(7/10), wheight*(1/10));

    
    if (your_deck[turn_counter] > opponent_deck[turn_counter]){

            image(assets[0], wwidth*(1/3), wheight*(7/10), assetswidth, assetsheight);
 
    } else if (your_deck[turn_counter] < opponent_deck[turn_counter]) {

            image(assets[1], wwidth*(1/3), wheight*(7/10), assetswidth, assetsheight);
      
    } else {
      
            image(assets[2], wwidth*(1/3), wheight*(7/10), assetswidth, assetsheight);
      
    }
  
     turn_counter--;
}

function draw() {
  
}


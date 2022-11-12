let handpose;
let video;
let hand;
let isHand;
let op_parts;
let dis;
let system;
let soundList=[];
let soundCount = 4;
let T1; // create an object "tree".
function setup(){
    createCanvas(windowWidth,windowHeight);
    soundFormats('mp3', 'ogg');

    //load sounds
    for(let i=0;i<soundCount;i++){
        soundList.push(loadSound("Crafted_"+(i+1)+".mp3"));
    }
    
    video = createCapture(VIDEO);
    handpose = ml5.handpose(video,handposeReady);
    handpose.on("hand", results => {
        if(results.length>0){
            isHand=true;
            hand=results[0]
        }else{
            isHand=false;
        }
    });
    // Hide the video element, and just show the canvas
    video.hide();
    resetSketch();
    
}
function resetSketch() {
    chordList=[];
    op_parts=[];
    
    T1=new tree(30,width/2);
    system = new ParticleSystem(createVector(width / 2, 50));
   
}
function draw(){
    background(218,217,217,20);
    backgroundDrawing(113,T1.treeX,width/2,200);
    if(isHand){
        drawKeypoints();
    }
    
    T1.run();
    //T2.run();
    //T3.run();
    op_parts=[];
    system.run();
    
    if(frameCount%4000==0){
        resetSketch();
    }
    
}
function mousePressed() {
  if (mouseX > 0 && mouseX < windowWidth && mouseY > 0 && mouseY < windowHeight) {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}


function handposeReady() {
  console.log("handpose ready!");
}


// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    for (let j = 0; j < hand.landmarks.length; j += 1) {
        const keypoint = hand.landmarks[j];

        let x=width-(keypoint[0]*width/video.width);
        let y=keypoint[1]*height/video.height;

        op_parts.push([x,y]);

    }
    drawHandLines(hand);
}

//this function draws the lines for the hand.
function drawHandLines(hand){
    let annotations=hand.annotations;
    let parts = Object.keys(hand.annotations);
    for (let part of parts){
        let count=0;
        let prex=0;
        let prey=0;
        
        for (let coor of annotations[part]){ 
            let x=width-(coor[0]*width/video.width);
            let y=coor[1]*height/video.height;
            if(count!=0){
               
                curveLines(x,y,prex,prey,50,2,2,(0,0,0));
                
            }
            prex=x;
            prey=y;
            count++;
        }
    }
}

//a function that take two points=x1y1, x2,y2, n=curve level, k=how many lines between these two points, weight=thickness, color
function curveLines(x1,y1,x2,y2,n,k,weight,color){
    noFill();
    strokeWeight(weight);
    stroke(color);
    for (let i=0;i<k;i++){
        bezier(x1,y1,x1+random(-n,n),y1+random(-n,n),x2+random(-n,n),y2+random(-n,n),x2,y2);
    }
}

//c is color, x is the position of the center of the drawing, k is the width, n is the numebr of lines
function backgroundDrawing(c,x,k,n){
    for(let i =0;i<n;i++){
        let r=random(10);
        //fill(255);
        stroke(c);
        strokeWeight(random(0.1));
        //ellipse(random(1000),random(1000),r,r);
        line(random(x-k,x+k),random(height),random(x-k,x+k),random(height));
    }
}













//the tree class, running and storing the "chord" object.
class tree{
    constructor(chord_number,x){
        this.treeX=x;
        this.n=chord_number;
        this.chordList=[];
        this.treeHeight=random(1*height/4,3*height/4);
        this.topMin=this.treeHeight-random(60,100);
        this.topList=this.generateTop(5);
        for(let j=0;j<this.topList.length;j++){
            for(let i=0;i<this.n/this.topList.length;i++){
                this.chordList.push(new chord(random(this.treeX-400,this.treeX+400),random(this.treeHeight-300,this.treeHeight),this.topList[j].x,this.topList[j].y));
            }
        }
    }
    run(){
        
        for(let i=0;i<this.n;i++){
            this.chordList[i].run();
        }
        this.drawMain(5);
    }
    drawMain(n){
        strokeWeight(10);
        
        for(let i=1;i<this.topList.length;i++){
            line(this.topList[i].x,this.topList[i].y,this.topList[i-1].x,this.topList[i-1].y);
        }
        line(this.treeX,height,this.topList[0].x,this.topList[0].y);
    }
    generateTop(n){
        let pointList=[];
        let pointListY=[]
        for (let i=0;i<n;i++){
            pointListY.push(random(this.topMin,this.treeHeight));
        }
        pointListY=sort(pointListY,n);
        for(let i=0;i<n;i++){
            //let thisPointY=random(lastPointY,this.treeHeight+(this.treeHeight-lastPointY)/2);
            pointList.push(createVector(this.treeX+random(-20,20),pointListY[i]));
        }
        return pointList;
    }
}


//the chord class, a line that constantly detects if it's touched by hand.
class chord{
    constructor(x1,y1,x2,y2){
        this.orx=x1;
        this.ory=y1;
        
        this.accelerationA=createVector(0,random(-1,1));
        this.velocityA=createVector(random(-0.3,0.3),random(-1,1));
        this.orV=this.velocityA;
        this.positionA=createVector(x1,y1);
        
        this.positionB=createVector(x2,y2);
        this.thickness=random(0.5,5);
    }
    move(){
        this.reachEdge();
        this.positionA.add(this.velocityA);  
    }
    
    touch(p,thresh){
        let max;
        let min;
        if(this.positionA.x>=this.positionB.x){
            max=this.positionA.x;
            min=this.positionB.x;
        }else{
            max=this.positionB.x;
            min=this.positionA.x;
        }

        let slope=(this.positionA.y-this.positionB.y)/(this.positionA.x-this.positionB.x);
        let testy=p[1]-this.positionA.y;
        let testx=slope*(p[0]-this.positionA.x);
        if (p[0]>min&&p[0]<max){
            if ((testx+thresh)>testy&&(testx-thresh)<testy){
                this.touchEffects(p[0],p[1]);
                return true;
            }
        }
        return false;
        
    }
    
    touchEffects(x,y){
        system.setPosition(createVector(x,y));
        system.addParticle();
        
    }
    isTouched(){
        for (let i=0;i<op_parts.length;i++){
            if(this.touch(op_parts[i],20)){
                return true;
            }
        }
        return false;
    }
    reachEdge(){
        let disx=this.positionA.x-this.orx;
        let disy=this.positionA.y-this.ory;
        if(disx<0){
            disx=-disx;
        }
        if(disy<0){
            disy=-disy;
        }
        if(disx>30){
            this.velocityA.x=-this.velocityA.x;
        }
        if(disy>30){
            this.velocityA.y=-this.velocityA.y;
        }
    }
    show(t){
        fill(0);
        strokeWeight(this.thickness);
        stroke(0);
        if(t){
            curveLines(random(this.positionA.x-50,this.positionA.x+50),random(this.positionA.y-50,this.positionA.y+50),this.positionB.x,this.positionB.y,50,1,this.thickness,(0));
        }else{
            //image(branchImage,this.positionA.x,this.positionA.y);
            line(this.positionA.x,this.positionA.y,this.positionB.x,this.positionB.y);
        }
        
    }
    run(){
        this.move();
        this.show(this.isTouched());
        this.velocityA=this.orV;
        
    }
}




// the particle class
let Particle = function(position) {
    this.acceleration = createVector(0, 0.05);
    this.velocity = createVector(random(-1, 1), random(-1, 0));
    this.position = position;
    this.rC=random(34,113);
    this.red=random(10,245);
    this.green=random(10,245);
    this.blue=random(10,245);
    this.rw=random(1,10);
    this.life = 0;
};

Particle.prototype.run = function() {
  this.update();
  this.display();
};

// Method to update position
Particle.prototype.update = function(){
  this.velocity.add(this.acceleration);
  this.position.add(this.velocity);
  this.life += 1;
};


// Method to display
Particle.prototype.display = function() {
  //stroke(200, this.lifespan);
  noStroke();
  strokeWeight(2);
  fill(this.rC);
  ellipse(this.position.x, this.position.y, this.rw, this.rw);
};

// Is the particle still useful?
Particle.prototype.isDead = function(){
    return this.position.y>height;
  //return this.lifespan < 0;
};



let ParticleSystem = function(position) {
    
    this.origin = position;
    this.particles = [];
    
    
};

//the particle system class.


ParticleSystem.prototype.setPosition = function(newPosition) {
    this.origin = newPosition;
}



ParticleSystem.prototype.addParticle = function() {
    if(this.particles.length<100&&frameCount%20==0){
        this.particles.push(new Particle(this.origin));
    }
  
};
ParticleSystem.prototype.setGradient = function(x,y,w,h,c1){
  noFill();
  let c2=color(218,217,217);
    // Top to bottom gradient
    for (let i = y; i <= y + h; i++) {
        let inter = map(i, y, y + h, 0, 1);
        let c = lerpColor(c2, c1, inter);
        stroke(c);
        line(x, i, x + w, i);
    }
};

ParticleSystem.prototype.run = function() {
  for (let i = this.particles.length-1; i >= 0; i--) {
    let p = this.particles[i];
    p.run();
    if (p.isDead()) {
        this.setGradient(p.position.x,0,random(300),height,color(p.rC,p.rC,p.rC));
        for (let i=0;i<soundList.length;i++){
            if(p.position.x >= (i*width/soundCount) && p.position.x < ((i+1)*width/soundCount)){
                soundList[i].setVolume(random(0.5,1));
                soundList[i].play();
            }
        }
        this.particles.splice(i, 1);
    }
  }
};

    










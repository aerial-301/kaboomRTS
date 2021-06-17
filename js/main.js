'use-strict';
import {  unitsProperties, buildingsProperties } from "./constants.js";
import Button from './buttons.js';
import Building from './building.js';
import Unit from './units.js';

const k = kaboom({  global: true,
                    clearColor: [0, 0, 0, 1],
                    width:840,
                    height: 570,
                    
                    // debug: true,
                    // crisp: true,
                });

loadSound("shoot", "./assets/GunShot1.ogg");
loadSound("rocket", "./assets/RocketShot.ogg");
loadSound("exp", "./assets/exp.ogg");
loadSprite('cur1', './assets/Cur1.png')
loadSprite("terrain", "./assets/GroundTerrain.jpeg");
loadSprite("BottomPanel", "./assets/BottomPanel.jpeg");
loadSprite("TopFrame", "./assets/TopFrame.jpeg");
loadSprite("Smoke", "./assets/cloud.png");
loadSprite("exp", "./assets/exp.png", 
    {
        sliceX: 4,
        sliceY: 1,
        anims: 
        {
            exp: 
            {
                from: 0,
                to: 3
            }
        }
        
    }
);

loadSprite("Camp", "./assets/CampSprite2.png", 

        {
            sliceX: 3,
            sliceY: 1,
            anims: {
                pain: {
                    from: 2,
                    to: 2,
                },
            },
        }
);

loadSprite("Miner", "./assets/MinerSprite.png", 

        {
            sliceX: 3,
            sliceY: 1,
            anims: {
                pain: {
                    from: 2,
                    to: 2,
                },
            },
        }
);

loadSprite("HQ", "./assets/HQsprite.png", 

        {
            sliceX: 3,
            sliceY: 1,
            anims: {
                pain: {
                    from: 2,
                    to: 2,
                },
            },
        }
);

loadSprite("GreenRM", "./assets/RMsprites.png", 

        {
            sliceX: 5,
            sliceY: 4,
            anims: {
                move: {
                    from: 1,
                    to: 4,
                },
                fire: {
                    from: 5,
                    to: 5,
                },
                pain: {
                    from: 7,
                    to: 8,
                },
            },
        }
);

loadSprite("GreenRctM", "./assets/RcktMsprites.png", 

        {
            sliceX: 5,
            sliceY: 4,
            anims: {
                move: {
                    from: 1,
                    to: 4,
                },
                fire: {
                    from: 5,
                    to: 6,
                },
                pain: {
                    from: 7,
                    to: 8,
                },
            },
        }
);

loadSprite("BlueRM", "./assets/RMsprites.png", 

        {
            sliceX: 5,
            sliceY: 4,
            anims: {
                move: {
                    from: 11,
                    to: 14,
                },
                fire: {
                    from: 15,
                    to: 15,
                },
                pain: {
                    from: 17,
                    to: 18,
                },
            },
        }
);

loadSprite("BlueRctM", "./assets/RcktMsprites.png", 

        {
            sliceX: 5,
            sliceY: 4,
            anims: {
                move: {
                    from: 11,
                    to: 14,
                },
                fire: {
                    from: 15,
                    to: 16,
                },
                pain: {
                    from: 17,
                    to: 18,
                },
            },
        }
);


scene('root', () => {
    const startButton = new Button(k.width() / 2 - 100, 200, 'Start', 200, 80, 38, 28, 22);
    startButton.button.clicks(() => {
        go('main');
    });
});


///////////////////////////////////////
//
//                  Main Scene
//
///////////////////////////////////////

const mainScreen = scene('main', () => {

    const groundWidth = 1400;
    const groundHeight = 900;


    // debug.inspect = true;

    layers([
        'bg', "obj", "ui",
    ], "obj");
    
    camIgnore([ "ui", ]);
    
    let moveVecX, moveVecY, mousePosX, mousePosY, mag, moveX, moveY, mainTB, BluePrint, currentBluePrint, distanceFromHQ;
    let playerCamp;
    let rectPosSet = false;
    let oldMousePosX = 0;
    let oldMousePosY = 0;
    let selectedUnits = []
    let selectionSet = false;  
    let placingBuilding = false;
    let sellBuilding = false;
    const unitsSpacingX = 80; 
    const unitsSpacingY = 10;
    const bottomPanelHeight = 120;
    const topFrameHeight = 40;
    let groups = [[],[],[]];
    const playerHQPosX = 1150;
    const playerHQPosY = 700;
    let camPosX = 1100;
    let camPosY = 815;
    let camS = 1;

    // let goldAmount = 20000;
    // let oilAmount = 1400;
    let byteCoinAmount = 500;

    let MaxBuildDistance = 200;

    let globalOrder = false;




    const ground = add([
        // rect(1400, 900),
        sprite('terrain'),
        pos( 0, 0),
        color(.6, .6, .6, 1),
        layer('bg'),
    ]);


    const bottomPanel = add([
        rect(k.width(), bottomPanelHeight),
        pos(0,k.height() - bottomPanelHeight),
        sprite('BottomPanel'),
        color(1,1,1,1),
        layer('ui'),
    ]);

    const topFrame = add([
        rect(k.width(), topFrameHeight),
        pos(0,0),
        sprite('TopFrame'),
        color(1,1,1,1),
        layer('ui'),
    ]);

    const resourcesDisplay = add([
        text(``, 12),
        pos(18, 14),
        color(1, .6, .9),
        layer('ui')
    ]);

    const messages = add([
        text('Messages', 9, {
            width: 400,
        }),
        pos( 18, k.height() - 30),
        layer('ui'),

    ]);

    const selection = add([
        rect(0, 0),
        color(1, 1, 1, 0.2),
        pos(0, 0),
    ]);


    on('add', 'hqSpectialCase', (b) => {
        b.pos.y -= 30;
    });

    on('add', 'Unit', (u) =>{
        wait(0.5, () => {
            u.newsight.paused = true;
            u.newsight.hidden = true;
        })
    });

    resourcesDisplay.action( async () => {
        await wait(0.3);
        // resourcesDisplay.text = `Gold: ${goldAmount}     Oil: ${oilAmount}     ByteCoin: ${byteCoinAmount}`;
        resourcesDisplay.text = `ByteCoin: ${byteCoinAmount}`;
    });

    addLevel([
        "             ",
        " M   M M     ",
        " C       Q   ",
        "     C       ",
        "             ",
        "             ",
        "          q  ",
        "             ",
    ], 
    
    {
        width: 119,
        height: 140,
        pos: vec2(0, 0),
        'C': () => {
            return [
                sprite('Camp', {
                    frame: 1,
                }),
                solid(),
                origin("center"),
                
                'enemy-building',
                'enemy-camp',
                'Building',
                'Killable',
                {   
                    health: buildingsProperties.CAMP.health,
                    startFrame: 1,
                }
            ];
        },

        'Q': () => {
            return [
                sprite('HQ', {
                    frame: 1,
                }),
                solid(),
                origin("center"),
                'enemy-building',
                'hqSpectialCase',
                'Building',
                'Killable',
                {   
                    health: buildingsProperties.HQ.health,
                    startFrame: 1,
                }
            ];
        },

        'M': () => {
            return [
                sprite('Miner', {
                    frame: 1,
                }),
                solid(),
                origin("center"),
                'enemy-building',
                'Building',
                'Killable',
                {   
                    health: buildingsProperties.MINER.health,
                    startFrame: 1,
                }
            ];
        },

        'q': () => {
            return [
                sprite('HQ', {
                    frame: 0,
                }),
                solid(),
                origin("center"),
                'player-building',
                'Building',
                'Killable',
                'hqSpectialCase',
                {   
                    health: buildingsProperties.HQ.health,
                    startFrame: 0,
                }
            ];
        },
    });



    action('enemy-building', (b) => {
        if (b.isClicked()) {
            if(selectedUnits.length > 0){
                globalOrder = true;
                for(let i of selectedUnits){
                    i.givenOrder = true;
                    i.orderedTarget = b;
                    i.ordered = true;
                }
            }
        }
    });


    ///////////////////////////////////////
    //
    //                  Mouse Events
    //
    ///////////////////////////////////////
    const MouseDown = async () => {

        await wait(0.01);

        if (mousePos().x == oldMousePosX && mousePos().y == oldMousePosY) {
            return false;
        }

        if (!rectPosSet) {

            selection.pos.x = mousePos().x;
            selection.pos.y = mousePos().y;
            selection.area.p1.x = selection.pos.x;
            selection.area.p1.y = selection.pos.y;
            rectPosSet = true;
        }

        selection.width = mousePos().x - selection.pos.x;
        selection.height = mousePos().y - selection.pos.y;
        selection.area.width = selection.width;
        selection.area.height = selection.height;
        oldMousePosX = mousePos().x;
        oldMousePosY = mousePos().y;
    };

    const MouseRelease = () => {

        if(!rectPosSet) return false

        const finalSelection = add([
            rect(selection.width, selection.height),
            pos(selection.pos.x, selection.pos.y),
            color(0, 0, 0, 0),
            'selection-box',
        ]);

        selection.width = 0;
        selection.height = 0;

        wait(0.1, () => {
            if (selectedUnits.length > 0) {
                messages.text = `${selectedUnits.length} units selected`;

                for (let i of selectedUnits) {
                    i.selected = true;
                    i.isHighlighted = true;
                }
                selectionSet = true;
            }
            destroy(finalSelection);
            rectPosSet = false;
        });
    };


    //////////////////////////////////////////////////////////
    //
    //                  Units Movement / Placing Buildings
    //
    //////////////////////////////////////////////////////////
    const GroundIsClicked = async () => {

        if(mousePos('ui').y >= k.height() - bottomPanelHeight) return false;
        if(mousePos('ui').y <= topFrameHeight) return false;

        if (selectionSet) {

            if(!globalOrder) {
                
                mousePosY = Math.floor(mousePos().y);
                mousePosX = Math.floor(mousePos().x);
                const len = selectedUnits.length;
                const size = Math.floor(Math.sqrt(len));
    
                for (let i in selectedUnits) {
                    clearUnits(selectedUnits[i]);
                    moveX = 5 + mousePosX + i * unitsSpacingX ** (size / len);
                    moveY = mousePosY + (i % size) * unitsSpacingY;
                    moveUnits(selectedUnits[i],
                        moveX,
                        moveY);
                    
                }
            }

            else{
                await wait(0.1)
                for (let i of selectedUnits) {
                    i.getCloser(i, i.orderedTarget);
                }
                globalOrder = false;
            }




        }
 
        else if (placingBuilding) {

            if(distanceFromHQ > MaxBuildDistance) {
                return false;
            }

            for(let i of get('player-building')){
                if(BluePrint.isCollided(i)){
                    messages.text = `Can't build here`;
                    return false;
                }
            }

            await wait(0.005);

            if (build(currentBluePrint)){
                placingBuilding = false;
                destroy(BluePrint);
                messages.text = 'Construction Complete';
            }
        }
    };


    action('Unit', async (unit) =>{

        if(!unit.isMoving){
            if(!unit.newsight.toggled){
                unit.newsight.toggled = true;
                unit.toggleSight(unit);
                await wait(3);
                // console.log('toggled')
                unit.newsight.toggled = false;
            }

        }
    });

    action('Unit', (unit) => {

        if(unit.collidedWithBuilding){
            
            if(unit.isCollided(unit.currentObstacle)){
                unit.resolve();
            }
            else{
                unit.collidedWithBuilding = false;
                unit.solid = false;
            }
        }

        if(!unit.isTargetingBuilding){

            if(!unit.sightToggled){
                unit.sightToggled = true
                // unit.toggleSight(unit);

                wait(choose([1,1.5]), () => {
                    unit.sightToggled = false;
                });
                
            }
        }
    });

    const SightAction = (sight) => {

        if(!sight.parent.props.exists()){
            destroy(sight);
        }

        if (sight.inSight.length > 0) {
            try {
                
                sight.inSight = sight.inSight.filter(unit => unit.exists() == true);
                sight.inSight = sight.inSight.filter(unit => unit.isOverlapped(sight) == true);
    
                if (sight.parent.props.currentTarget != sight.inSight[0]) {
                    sight.parent.props.currentTarget = sight.inSight[0];
                }

            } catch (error) {
                console.log(error);
                sight.inSight = [];
            }

            
        }

        else {
            if(!sight.parent.props.ordered) sight.parent.props.currentTarget = null;

            if (!sight.moved){
                sight.moved = true
                sight.parent.moveSight(sight.parent.props);
            }
        }
    };

    const EnemyUnits = async (u) => {

        await wait(0.2);

        if (u.currentTarget) {

            if (!u.currentTarget.exists()) {
                u.currentTarget = null;
                return false;
            }

            // if(u.getCloser(u, u.currentTarget)){

                if (u.readyToFire) {
                    u.readyToFire = false;
    
                    u.shoot(u);  
    
                    await wait(u.fireRate, () => {
                        u.currentTarget = null;
                        u.readyToFire = true;
                        // u.toggleSight();
                    });
    
                }
            // }

        }


    };




    const PlayerAction = async (u) => {

        if(u.givenOrder){
            u.givenOrder = false;
            u.isMoving = false;
            u.newsight.moved = false;
            u.stop();
            u.frame = u.startFrame;
            u.isMoveAnimation = false;
            u.currentTarget = u.orderedTarget;
        }

        if (u.isMoving) {

            if (!u.isMoveAnimation) {
                u.play("move");
                u.isMoveAnimation = true;
            }

            moveVecX = Math.floor(u.destinationX - u.pos.x);
            moveVecY = Math.floor(u.destinationY - u.pos.y);

            if (Math.abs(moveVecX) <= 5) {
                if (Math.abs(moveVecY) <= 5) {

                    u.isMoving = false;
                    u.newsight.moved = false;
                    u.stop();
                    u.frame = u.startFrame;
                    u.isMoveAnimation = false;
                    if(!u.ordered) {
                        u.currentTarget = null;
                    }

                    return false;
                }
            }

            mag = Math.sqrt(moveVecX ** 2 + moveVecY ** 2);
            moveVecX = (moveVecX / mag) * u.speed;
            moveVecY = (moveVecY / mag) * u.speed;
            u.move(moveVecX, moveVecY);
        }


        else{
            if(!u.newsight.moved){         
                u.newsight.moved = true;
                u.moveSight(u);
                u.toggleSight(u);
            }

            await wait(0.5);
            if (u.currentTarget) {
                
                if (!u.currentTarget.exists()) {
                    u.currentTarget = null;
                    return false;
                }

                
                if(u.newsight.isOverlapped(u.currentTarget)){
                    if (u.readyToFire) {
                        u.readyToFire = false;
                        u.shoot(u);
                        wait(u.fireRate, () => {
                            u.readyToFire = true;
                        });
                    }

                }
                
            }

        }


    };

    //////////////////////////////////////////////////////////
    //
    //                  Building
    //
    //////////////////////////////////////////////////////////
    function addBluePrint(w, h, type, cost){
        currentBluePrint = type;
        BluePrint = add([
            rect(w, h),
            color(1,1,1,0.3),
            pos(mousePos().x, mousePos().y),
            origin("center"),
            'BluePrint',
            {
                cost: cost,
                canBuild: false,
                collided: false,
            }
        ])
    };

    function build(type){

        switch (type) {
            case 'Camp':

                if (byteCoinAmount >= buildingsProperties.CAMP.cost){

                    playerCamp = new Building('Camp', mousePos().x, mousePos().y, 'player-building');

                    playerCamp.building.use('player-camp');
                    playerCamp.building.clicks( () => {
                        if(sellBuilding){
                            destroy(playerCamp.building);

                        }
                    });

                    byteCoinAmount -= buildingsProperties.CAMP.cost;
                    return true;

                }
                else {
                    messages.text = `Insufficient resources`;
                    return false;
                }


            break;

            case 'Miner':


                if (byteCoinAmount >= buildingsProperties.MINER.cost){


                    const MinerB = new Building('Miner', mousePos().x, mousePos().y, 'player-building');

                    MinerB.building.clicks(() => {
                        if(sellBuilding){
                            destroy(MinerB.building);

                        }
                    });

                    MinerB.building.use({isMining: false});

                    MinerB.building.action( async () => {
                        if(!MinerB.building.isMining){    
                            MinerB.building.isMining = true;
                            await wait(rand(10, 30));
                            byteCoinAmount += 1;
                            MinerB.building.isMining = false;

                        }
                    });

                    byteCoinAmount -= buildingsProperties.MINER.cost;
                    return true;

                }
                else {
                    messages.text = `Insufficient resources`
                    return false;
                }

                break;

            default:
                break;
        }

    };

    ground.action(() => {
        
        if(placingBuilding){

            if(selectionSet) selectionSet = false;

            if(ground.isHovered()){

                BluePrint.pos.x = mousePos().x;
                BluePrint.pos.y = mousePos().y;

                distanceFromHQ = Math.sqrt((playerHQPosX - mousePos().x)**2 + (playerHQPosY - mousePos().y)**2);

                if(distanceFromHQ > MaxBuildDistance || byteCoinAmount < BluePrint.cost || BluePrint.collided){

                    BluePrint.canBuild = false;
                    BluePrint.color = rgba(1, 0, 0, 1);
                }
                else {
                    BluePrint.canBuild = true;
                    BluePrint.color = rgba(1, 1, 1, 0.3);
                }
                
            }
        }
    });



    //////////////////////////////////////////////////////////
    //
    //                  UI Buttons
    //
    //////////////////////////////////////////////////////////
    function buildMiner(){
        placingBuilding = true;
        messages.text = 'choose location';
        addBluePrint(buildingsProperties.MINER.width, buildingsProperties.MINER.height, 'Miner', buildingsProperties.MINER.cost);
    }

    function buildCamp(){
        placingBuilding = true;
        messages.text = 'choose location';
        addBluePrint(buildingsProperties.CAMP.width, buildingsProperties.CAMP.height, 'Camp', buildingsProperties.CAMP.cost);
    }

    function recruitRifleMan(){
        if(byteCoinAmount >= unitsProperties.RIFLEMAN.cost){
            byteCoinAmount -= unitsProperties.RIFLEMAN.cost;
            const z = new Unit('GreenRM', playerCamp.pos.x - 20, playerCamp.pos.y + buildingsProperties.CAMP.height / 2, 'player-unit');
            z.getSight(z);
        }
        else{
            messages.text = `Not enough resources`;
        }
    }

    function recruitRocketMan(){
        if(byteCoinAmount >= unitsProperties.ROCKETMAN.cost){
            byteCoinAmount -= unitsProperties.ROCKETMAN.cost;
            const z = new Unit('GreenRctM', playerCamp.pos.x - 20, playerCamp.pos.y + buildingsProperties.CAMP.height / 2, 'player-unit');
            z.getSight(z);
        }
        else{
            messages.text = `Not enough resources`;
        }
    }

    const buildCampButton = new Button(14, messages.pos.y  - 36, buildCamp, 'Build Camp', 150);
    const buildMinerButton = new Button(14,  buildCampButton.y - 34, buildMiner, 'Build miner', 150);
    const recruitRifleManButton = new Button(200,  buildCampButton.y - 34, recruitRifleMan, 'Recruit rifleMan', 220);
    const recruitRocketManButton = new Button(200,  messages.pos.y - 36, recruitRocketMan, 'Recruit rocketMan', 220);
    
    buildMinerButton.button.clicks( async () => {
        await wait(0.1);
        buildMinerButton.act();
    });

    buildCampButton.button.clicks( async () => {
    
        try {
            if(mainTB.building.exists()){
                messages.text = 'Build limit reached'
            }
            else {
                await wait(0.1);
                buildCampButton.act();
            }
        } catch (error) {
            await wait(0.1);
            buildCampButton.act();
        }

    });


    
    recruitRifleManButton.button.clicks(() => {

        playerCamp = get('player-camp')[0];
        try {

            if(playerCamp) recruitRifleManButton.act();
            else messages.text = 'Camp required';
            
        } catch (error) {
            console.log(error);
            messages.text = 'Camp required'
        }

    });

    recruitRocketManButton.button.clicks(() => {

        playerCamp = get('player-camp')[0];
        try {
            if(playerCamp) recruitRocketManButton.act();
            else messages.text = 'Camp required';

        } catch (error) {
            console.log(error);
            messages.text = 'Camp required'
        }

    });



    ///////////////////////////////////////
    //
    //                  Overlaps ?
    //
    ///////////////////////////////////////


    overlaps('selection-box', 'player-unit', (e, u) =>{
        if (!selectedUnits.includes(u)) selectedUnits.push(u);
    });

    overlaps('enemy-sight', 'player-unit', (s, p) =>{
        s.inSight.push(p);
        s.parent.hasTarget = true;
    });

    overlaps('player-sight', 'enemy-unit', (s, e) =>{
        s.inSight.push(e);
        s.parent.hasTarget = true;
    });

    overlaps('Killable', 'RocketExp', (thing, rocket) =>{
        // thing.health -= rand(8, 14);
        if(thing.is('Unit')) thing.getShot(thing, rocket.source.parent);
    });

    collides("Unit", "Building", (u, b) => {
        stopUnits(u);
        u.collidedWithBuilding = true;
        u.currentObstacle = b;
    });

    // overlaps('player-sight', 'enemy-building', (s, e) =>{
    //     s.inSight.push(e);
    //     s.parent.hasTarget = true;
    // });

    overlaps('enemy-sight', 'player-building', (s, e) =>{
        s.inSight.push(e);
        s.parent.hasTarget = true;
    });



    action('enemy-sight', SightAction);

    action('player-sight', SightAction);

    action('enemy-unit', EnemyUnits);

    action('player-unit', PlayerAction);


    mouseDown(MouseDown);
    mouseRelease(MouseRelease);
    ground.clicks(GroundIsClicked);


    on('add', 'rocket', (u) => {
        const dif = u.tY - u.pos.y;
        // status4.text = `${dif}`
        if(dif > 0) u.yMag = -500 -dif/10;
        else{
            u.below = true;
            u.yMag = -600 -dif/10;
        }
    });

    action('smoke', (s) =>{

        s.scale = s.scl;
        s.scl += 0.07
        wait(0.4, () => {
            destroy(s);
        });
    });

    action('rocket', async (r) => {
        
        if(!r.smoked){
            r.smoked = true;
            await wait(0.1)
            const smo = add([
                sprite('Smoke'),
                origin("center"),
                pos(r.pos.x, r.pos.y),
                'smoke',
                {
                    scl: 0.5,
                }
            ]);
            await wait(0.05);
            r.smoked = false;
        };

        if(!r.adj){
            r.adj = true;
            r.yMag += 10;
            r.xMag += r.xInc;
            r.xVec = r.tX - r.pos.x;
            r.xInc += 0.001
            await wait(0.01, () => {
                r.adj = false;
            });

        }

        r.move(r.xVec * r.xMag, r.yVec * r.yMag);

        if(r.yMag > 0) r.peaked = true;

        if(r.peaked){

            if(r.pos.y >= r.tY){
                destroy(r);
                play("exp", {
                    volume: 1.0,
                    speed: 1,
                    detune: 0,
                });

                const expArea = add([
                    rect(70, 70),
                    pos(r.tX , r.tY),
                    origin("center"),
                    color(0,0,0,0),
                ]);

                const expl = add([
                    sprite('exp', {
                        animSpeed: .07,
                    }),
                    pos(r.tX, r.tY),
                    origin("center"),
                    'RocketExp',
                    {
                        source: r,
                    }
                ]);

                expl.play('exp');

                expl.action(()=>{
                    if(expl.frame == 3) {
                        destroy(expl);
                        destroy(expArea);
                    }
                })
            }
        }
    });

    const moveUnits = function(unit, mx, my){
        unit.destinationX = mx;
        unit.destinationY = my;
        unit.isMoving = true;
    }

    function cancelSelection(){

        const temp = selectedUnits.slice()
        for(let i of temp){
            i.isHighlighted = false;
            i.selected = false;
        }
        selectedUnits = [];
        messages.text = 'Selection canceled'
        placingBuilding = false;
        selectionSet = false;

        if(BluePrint) destroy(BluePrint);

    }

    function stopUnits(u){
        u.newsight.inSight = [];
        u.isMoving = false;
        u.newsight.moved = false;
        u.currentTarget = null;
        u.ordered = false;
        u.orderedTarget = null;
        u.stop();
        u.frame = u.startFrame;
        u.isMoveAnimation = false;
    }

    function clearUnits(u){
        u.newsight.inSight = [];
        u.newsight.moved = false;
        u.currentTarget = null;
        u.ordered = false;
        u.orderedTarget = null;
        u.movingToTarget = false;
    }




    ///////////////////////////////////////
    //
    //                  AI Stuff
    //
    ///////////////////////////////////////
    let eSpawned = false;

    action('enemy-camp', async (b) => {

        // if(!eSpawned){

        //     eSpawned = true;

        //     await wait(rand(14, 26));
        //     const u = new Unit('BlueRctM',b.pos.x - 10, b.pos.y + 10, 'enemy-unit')
        //     u.getSight(u)
        //     eSpawned = false;
        // }
    });

    action('enemy-unit', async (e) => {


        // status2.text = `isMoving = ${e.isMoving}`
        // status3.text = `isIdle = ${e.isIdle}`
        // status4.text = `currentTarget = ${e.currentTarget}`

        await wait(0.05);

        // if (e.currentTarget ){

            // if(e.isIdle) return false;

            // if(!e.isMoving){

            //     const newX = e.pos.x + choose([-1, 1]) * rand(10, 100);
            //     const newY = e.pos.y + choose([-1, 1]) * rand(10, 100);

            //     if(newX > 0 && newX < groundWidth){
            //         if(newY > 0 && newY < groundHeight){
            //             moveUnits(e, newX, newY);
            //         }
            //     }
            // }
                
            if(e.isMoving){

                if(!e.isMoveAnimation){
                    e.play('move');
                    e.isMoveAnimation = true;
                }

                if(e.collidedWithBuilding){
                    stopUnits(e);
                }

                moveVecX = Math.floor(e.destinationX - e.pos.x);
                moveVecY = Math.floor(e.destinationY - e.pos.y);

                if (Math.abs(moveVecX) <= 1) {
                    if (Math.abs(moveVecY) <= 1) {

                        // e.isIdle = true;
                        e.newsight.moved = false;
                        e.isMoveAnimation = false;
                        e.stop();
                        e.frame = e.startFrame;
                        e.isMoving = false;
                        e.moveSight(e);
                        // await wait(choose([5, 7, 12, 15]));
                        // e.isIdle = false;
                        return false;
                    }
                }

                mag = Math.sqrt(moveVecX ** 2 + moveVecY ** 2);
                moveVecX = (moveVecX / mag) * 100;
                moveVecY = (moveVecY / mag) * 100;
                e.move(moveVecX, moveVecY);
            }

    });








    ///////////////////////////////////////
    //
    //                  Keyboard Events
    //
    ///////////////////////////////////////
    action(() => {

        camScale(camS)
        camPos(camPosX, camPosY)

        if(keyIsDown('w')){
            camPosY -= 10;
        }
        if(keyIsDown('s')){
            camPosY += 10;
        }
        if(keyIsDown('a')){
            camPosX -= 10;
        }
        if(keyIsDown('d')){
            camPosX += 10;
        }
        if(keyIsDown('q')){
            camS *= 0.99;
        }
        if(keyIsDown('e')){
            camS *= 1.01;
        }
    });

    keyPress('x', () => {
        // messages.text = 'stopped'
        for(let i of selectedUnits){
            stopUnits(i);
        }
    });

    keyPress('c', () => {
        cancelSelection();
    });
    
    keyPress('r', () => {
        camS = 1;
    });

    keyPress('1', () => {
        if(keyIsDown('control')){

            groups[0] = selectedUnits.slice();
        }
        else {
            try {
                cancelSelection();
                groups[0] = groups[0].filter(unit => unit.exists())
                for(let i of groups[0]){
                    i.isHighlighted = true;
                    selectedUnits.push(i);
                }
                selectionSet = true;
                messages.text = `${selectedUnits.length} units selected`;
            } catch (e) {
                console.log(e);
            }
        }
    });

    keyPress('2', () => {
        if(keyIsDown('control')){
            groups[1] = selectedUnits.slice();
        }
        else {
            try {
                cancelSelection();
                groups[1] = groups[1].filter(unit => unit.exists())
                for(let i of groups[1]){
                    i.isHighlighted = true;
                    selectedUnits.push(i);
                }
                selectionSet = true;
                messages.text = `${selectedUnits.length} units selected`;
            } catch (e) {
                console.log(e);
            }
        }
    });

    keyPress('3', () => {
        if(keyIsDown('control')){
            groups[2] = selectedUnits.slice();
        }
        else {
            try {
                cancelSelection();
                groups[2] = groups[2].filter(unit => unit.exists())
                for(let i of groups[2]){
                    i.isHighlighted = true;
                    selectedUnits.push(i);
                }
                selectionSet = true;
                messages.text = `${selectedUnits.length} units selected`;
            } catch (e) {
                console.log(e);
            }
        }
    });

    ///////////////////////////////////////
    //
    //                  For debugging
    //
    ///////////////////////////////////////


    // action(() => {
    //     if(selectedUnits.length == 1){

    //         const u = selectedUnits[0];
    //         status2.text = `HP = ${u.health}`;
    //         if(u.currentTarget) {

    //             if(u.currentTarget.exists()) status3.text = `target HP = ${u.currentTarget.health}`;
    //             else status3.text = ``;
    //         }

    //     }
    //     else{
    //         status2.text = ``;
    //         status3.text = ``;
    //     }
    // })

    // action('player-sight', (s) =>{
    //     status2.text = `s.paused = ${s.paused}`
    //     status4.text = `s.hidden = ${s.hidden}`
    // });


    keyPress('p', () => {
        messages.text = !debug.paused;
        debug.paused = !debug.paused;
    });

    let somearray = [];

    // keyPress('t', () => {
    //     // somearray = [];
    //     const c = get('player-camp');
    //     console.log(c)
    // });

    // action('player-unit', (u) => {

    //     status.text = `u.currentTarget = ${u.currentTarget}`;
    //     // status2.text = ` = ${u(u)}`;
    //     status3.text = `u.orderedTarget = ${u.orderedTarget}`;
    //     status4.text = `givenOrder = ${u.givenOrder}`;


    // });

    // const status = add([
    //     text('status', 12,
    //     {
    //         width: 320,
    //     }),
    //     pos(20,200),
    //     layer('ui')
    // ]);

    // const status2 = add([
    //     text('status2', 12),
    //     pos(20,220),
    //     layer('ui')
    // ]);

    // const status3 = add([
    //     text('status3', 12),
    //     pos(20,240),
    //     layer('ui')
    // ]);

    // const status4 = add([
    //     text('status4', 12),
    //     pos(20,260),
    //     layer('ui')
    // ]);

    // action(() => {
    //     status4.text = debug.fps();
    // })

    // let oneTimeRun = false;
    // let oneTimeRun2 = false;

    // keyPress('b', () => {
    //     oneTimeRun = false;
    //     oneTimeRun2 = false;
    // })

    // keyPress('h', () => {
    //     const a = get('Unit');
    //     for(let i of a){
    //         i.newsight.paused = !i.newsight.paused;
    //         i.newsight.hidden = !i.newsight.hidden;
    //         console.log(i.newsight);
    //     }
    // });

    keyPress('.', () =>{
        if(selectedUnits.length > 0){
            for(let i of selectedUnits){
                destroy(i);
            }
            selectedUnits = [];
            selectionSet = false
        }
    });

    keyPress('u', () =>{
        const x = new Unit('BlueRM', rand(500, 600), rand(480, 530), 'enemy-unit');
        x.getSight(x);
        // x.props.action(() =>{
        //     // status2.text = `isMoving = ${x.props.isMoving}`
        //     // status3.text = `isIdle = ${x.props.isIdle}`
        //     // status4.text = `currentTarget = ${x.props.currentTarget}`
        // });
        const y = new Unit('BlueRctM', rand(500, 600), rand(480, 530), 'enemy-unit');
        y.getSight(y);

    });

    /////////////////////////////////////////////////

});

scene('Paused', () => {

    keyPress('p', () => {

        go(mainScreen);
        // messages.text = 'Resumed';
    });
    
});


// start('root');
start('main');





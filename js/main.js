'use-strict';

import Button from './buttons.js';
import Building from './building.js';
import Unit from './troops/units.js';

const k = kaboom({  global: true, 
                    // width: 440, 
                    // height: 574,
                    clearColor: [0, 0, 0, 1], // background color (default black [0, 0, 0, 1])
                    width:1260,
                    height: 570,
                    // debug: true,
                    // crisp: true,
                });

loadSound("shoot", "./assets/GunShot1.ogg");
loadSprite("terrain", "./assets/GroundTerrain.jpeg");
loadSprite("BottomPanel", "./assets/BottomPanel.jpeg");
loadSprite("TopFrame", "./assets/TopFrame.jpeg");

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
)


// loadSprite("GreenRM", "./assets/GreenRM.png", 

//         {
//             sliceX: 5,
//             sliceY: 2,
//             anims: {
//                 move: {
//                     from: 1,
//                     to: 4,
//                 },
//                 fire: {
//                     from: 5,
//                     to: 5,
//                 },
//                 pain: {
//                     from: 7,
//                     to: 8,
//                 },
//             },
//         }
// );

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

scene('root', () => {

    // const rootBackGround = add([
    //     rect(k.width(), k.height()),
    //     pos(0,0),
    //     color(0,0,0),
    // ]);
    
    const startButton = new Button(k.width() / 2 - 100, 200, 'Start', 200, 80, 38, 28, 22);

    startButton.button.clicks(() => {

        go('main');
    });
});


const mainScreen = scene('main', () => {

    

    console.log(document.body.style.cursor)

    layers([
        "obj", "ui",
    ], "obj");
    
    camIgnore([ "ui", ]);
    
    let moveVecX, moveVecY, mousePosX, mousePosY, mag, moveX, moveY;
    let mainTB;
    
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

    let BP;

    let currentBluePrint;
    let distanceFromHQ;

    let selectedBuilding;

    let goldAmount = 20000;
    let oilAmount = 1400;
    let byteCoinAmount = 300;

    const MinerHealth = 1200;
    const MinerWidth = 30;
    const MinerHeight = 70;
    const MinerGoldCost = 800;

    const CampHealth = 750;
    const CampWidth = 90;
    const CampHeight = 90;
    const CampGoldCost = 550;

    const RifleManGoldCost = 15;
    const RocketManGoldCost = 24;

    const HQHealth = 3000;
    const HQWidth = 120;
    const HQHeight = 120;

    let MaxBuildDistance = 200;






    



    on('add', 'player-unit', (u) =>{
        wait(0.5, () => {

            u.newsight.paused = true;
            u.newsight.hidden = true;
        })
        
    });

    on('add', 'enemy-unit', (u) =>{
        wait(0.5, () => {
            u.newsight.paused = true;
            u.newsight.hidden = true;
        })
        
    });

    ///////////////////////////////////
    /// Mouse events

    const MouseDown = async () => {

        await wait(0.01);

        if (mousePos().x == oldMousePosX && mousePos().y == oldMousePosY) {

            // console.log('no mouse drag')
            return false;
        }

        // await wait(0.01);

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

        selection.width = selection.height = 0;

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

    const GroundIsClicked = async () => {

        if(mousePos('ui').y >= k.height() - bottomPanelHeight) return false;
        if(mousePos('ui').y <= topFrameHeight) return false;

        if (selectionSet) {

            mousePosY = Math.floor(mousePos().y);
            mousePosX = Math.floor(mousePos().x);
            const len = selectedUnits.length;
            const size = Math.floor(Math.sqrt(len));

            for (let i in selectedUnits) {
                moveX = 5 + mousePosX + i * unitsSpacingX ** (size / len);
                moveY = mousePosY + (i % size) * unitsSpacingY;
                moveUnits(selectedUnits[i],
                    moveX,
                    moveY);
            }
        }

        
        else if (placingBuilding) {

            if(distanceFromHQ > MaxBuildDistance) {
                return false;
            }

            for(let i of get('player-building')){
                if(BP.isCollided(i)){
                    messages.text = `Can't build here`;
                    return false;
                }
            }


            await wait(0.005);

            if (build(currentBluePrint)){

                placingBuilding = false;
                // await wait(0.001);
                destroy(BP);
                messages.text = 'Construction Complete';
            }


        }

    };

    action("player-unit", async (unit) => {

        if(!unit.sightToggled){
            unit.sightToggled = true

            unit.toggleSight(unit);
            await wait(choose([1,2]));
            unit.sightToggled = false;
        }
        
    });

    action("enemy-unit", async (unit) => {

        if(!unit.sightToggled){
            unit.sightToggled = true

            unit.toggleSight(unit);
            await wait(choose([1,2]));
            unit.sightToggled = false;
        }
        
    });

    const EnemySight = (sight) => {

        if(!sight.parent.props.exists()){
            destroy(sight);
        }

        if (sight.inSight.length > 0) {
            sight.inSight = sight.inSight.filter(unit => unit.exists() == true);
            sight.inSight = sight.inSight.filter(unit => unit.isOverlapped(sight) == true);

            if (sight.parent.props.currentTarget != sight.inSight[0]) {
                sight.parent.props.currentTarget = sight.inSight[0];
            }
        }
        else {
            sight.parent.props.currentTarget = null;

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

            if (u.readyToFire) {
                u.readyToFire = false;

                u.shoot(u);  

                await wait(1, () => {
                    u.currentTarget = null;
                    u.readyToFire = true;
                    // u.toggleSight();
                });

            }
        }
    };


    const PlayerAction = async (u) => {


        if (u.isMoving) {

            if (!u.isMoveAnimation) {
                u.play("move");
                u.isMoveAnimation = true;
            }

            moveVecX = Math.floor(u.destinationX - u.pos.x);
            moveVecY = Math.floor(u.destinationY - u.pos.y);

            if (Math.abs(moveVecX) < 10) {
                if (Math.abs(moveVecY) < 10) {
                    u.isMoving = false;
                    u.newsight.moved = false;
                    u.currentTarget = null;
                    u.stop();
                    u.frame = u.startFrame;
                    // obj.frame
                    u.isMoveAnimation = false;
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
            }

            await wait(0.1);
            if (u.currentTarget) {

                if (!u.currentTarget.exists()) {
                    u.currentTarget = null;
                    return false;
                }
    
                if (u.readyToFire) {
                    u.readyToFire = false;
                    u.shoot(u);
                    wait(1, () => {
                        u.readyToFire = true;
                    });
                }
            }


        }


    };

    const ground = add([
        rect(1400, 900),
        sprite('terrain'),
        pos( 14, 34),
        color(.6, .6, .6, 1),
        layer('obj'),
    ]);

    function addBluePrint(w, h, type, cost){
        currentBluePrint = type;
        BP = add([
            rect(w, h),
            color(1,1,1,0.3),
            pos(mousePos().x, mousePos().y),
            'BluePrint',
            {
                cost: cost,
                canBuild: false,
                collided: false,
            }
        ])
    }

    function build(type){

        // console.log(type);

        switch (type) {
            case 'Camp':

                if (goldAmount >= CampGoldCost){

                    mainTB = new Building('Camp', mousePos().x, mousePos().y, 'player-building', CampWidth, CampHeight, CampHealth);
                    mainTB.building.clicks( () => {
                        // console.log(selectedUnits)
                        
                        if(!selectionSet){
                            if(!placingBuilding){
                                if ( !selectedUnits.includes(mainTB.building)){
                                // if ( selectedUnits.length == 0){
                                    selectedUnits.push(mainTB.building);
                                }
                            }
                        }
                        else if(selectedUnits.length == 1){
                            selectedUnits[0].isHighlighted = false;
                            selectedUnits.pop();
                            selectedUnits.push(mainTB.building);
                        }
                    });

                    goldAmount -= CampGoldCost;
                    return true;

                }
                else {
                    messages.text = `Insufficient gold, ${MinerGoldCost - goldAmount} more gold is needed`;
                    return false;
                }


            break;

            case 'Miner':


                if (goldAmount >= MinerGoldCost){


                    const MinerB = new Building('Miner', mousePos().x, mousePos().y, 'player-building', MinerWidth, MinerHeight, MinerHealth);

                    MinerB.building.clicks(() => {


                        if(sellBuilding){
                            destroy(MinerB.building);

                        }




                        // if(!selectionSet){
                        //     if(!placingBuilding){
                        //         if ( !selectedUnits.includes(MinerB.building)){
                        //             selectedUnits.push(MinerB.building);
                        //         }
                        //     }
                        // }
                        // else if(selectedUnits.length == 1){
                        //     selectedUnits[0].isHighlighted = false;
                        //     selectedUnits.pop();
                        //     selectedUnits.push(MinerB.building);
                        // }
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

                    goldAmount -= MinerGoldCost;
                    return true;

                }
                else {
                    messages.text = `Insufficient gold, ${MinerGoldCost - goldAmount} more gold is needed`
                    return false;
                }

                break;

            default:
                break;
        }

    }


    action('player-building', (b) => {

        // if(b.isHighlighted) b.color.r = 1
        // else b.color.r = 0
    });


    ground.action(() => {
        
        if(placingBuilding){

            if(selectionSet) selectionSet = false;

            if(ground.isHovered()){

                BP.pos.x = mousePos().x;
                BP.pos.y = mousePos().y;

                distanceFromHQ = Math.sqrt((playerHQPosX - mousePos().x)**2 + (playerHQPosY - mousePos().y)**2);
                // messages.text = BP.cost;
                if(distanceFromHQ > MaxBuildDistance || goldAmount < BP.cost || BP.collided){
                    // console.log(BP.color)
                    BP.canBuild = false;
                    BP.color = rgba(1, 0, 0, 1);
                }
                else {
                    BP.canBuild = true;
                    BP.color = rgba(1, 1, 1, 0.3);
                }
                
            }
        }
    })


    const bottomPanel = add([
        rect(k.width(), bottomPanelHeight),
        pos(0,k.height() - bottomPanelHeight),
        sprite('BottomPanel'),
        color(1,1,1,1),
        layer('ui'),
    ])

    const topFrame = add([
        rect(k.width(), topFrameHeight),
        pos(0,0),
        sprite('TopFrame'),
        color(1,1,1,1),
        layer('ui'),
    ]);

    const resourcesDisplay = add([
        text(`Gold: ${goldAmount}     Oil: ${oilAmount}     ByteCoin: ${byteCoinAmount}`, 12),
        pos(18, 14),
        color(1, .6, .9),
        layer('ui')
    ])


    resourcesDisplay.action( async () => {
        await wait(0.1);
        resourcesDisplay.text = `Gold: ${goldAmount}     Oil: ${oilAmount}     ByteCoin: ${byteCoinAmount}`;
    });

    const messages = add([
        text('Messages', 9, {
            width: 400,
        }),
        pos( 18, k.height() - 30),
        layer('ui'),

    ]);

    const status = add([
        text('enemy state', 12),
        pos(20,200),
        layer('ui')
    ])

    const status2 = add([
        text('enemy state', 12),
        pos(20,220),
        layer('ui')
    ])

    const status3 = add([
        text('asda', 12),
        pos(20,240),
        layer('ui')
    ])

    const status4 = add([
        text('asda', 12),
        pos(20,260),
        layer('ui')
    ])


    function recruteRifleMan(){
        if(goldAmount >= RifleManGoldCost){
            goldAmount -= RifleManGoldCost;
            const z = new Unit('GreenRM', mainTB.building.pos.x + 15, mainTB.building.pos.y + CampHeight - 25, 'player-unit');
            z.getSight(z);
            z.play('run');
        }
        else{
            messages.text = `Not enough gold`;
        }
    }

    

    function buildCamp(){
        placingBuilding = true;
        messages.text = 'choose location';
        addBluePrint(CampWidth, CampHeight, 'Camp', CampGoldCost);
    }

    function buildMiner(){
        placingBuilding = true;
        messages.text = 'choose location';
        addBluePrint(MinerWidth, MinerHeight, 'Miner', MinerGoldCost);
    }


    const troopB = new Building('Camp', 340, 50, 'enemy-building');
    const playerHQ = new Building('Camp', playerHQPosX, playerHQPosY, 'player-building', HQWidth, HQHeight, HQHealth);
    const enemyHQ = new Building('Camp', 200, 200, 'enemy-building', HQWidth, HQHeight, HQHealth);

    const buildCampButton = new Button(14, messages.pos.y  - 36, buildCamp, 'Army Camp', 150);
    const buildMinerButton = new Button(14,  buildCampButton.y - 34, buildMiner, 'Miner', 150);

    const recruitRifleManButton = new Button(200,  buildCampButton.y - 34, recruteRifleMan, 'Rifle Man', 150);
    const recruitRocketManButton = new Button(200,  messages.pos.y - 36, 'Rocket Man', 150);

    let eSpawned = false;
    
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

        try {
            if(mainTB.building.exists()){
                recruitRifleManButton.act();
            }
            else {
                messages.text = 'Troops building required'
            }
        } catch (error) {
            messages.text = 'Troops building required'
        }
        
    });


    action('enemy-building', async (b) => {

        status3.text = debug.fps();
        status4.text = `selectionSet = ${selectionSet}`;

        // TODO: enemy building logic

        // if(!eSpawned){

        //     eSpawned = true;

        //     await wait(4, () => {
        //         const u = new Unit(b.pos.x - 130, b.pos.y + 100, 'enemy-unit', 100)
        //         u.getSight(u)
        //     });

        //     eSpawned = false;
        // }

    });


    overlaps('enemy-sight', 'player-unit', (s, p) =>{

        s.inSight.push(p);
        s.parent.hasTarget = true;
    });

    overlaps('player-sight', 'enemy-unit', (s, e) =>{
        s.inSight.push(e);
        s.parent.hasTarget = true;
    });

    overlaps('player-sight', 'enemy-building', (s, e) =>{
        s.inSight.push(e);
        s.parent.hasTarget = true;
    });

    overlaps('enemy-sight', 'player-building', (s, e) =>{
        s.inSight.push(e);
        s.parent.hasTarget = true;
    });

    // action('Killable', (u) =>{
        // if(u.health <= 0){
        //     destroy(u);
        // }
    // })

    action('enemy-sight', EnemySight);

    action('player-sight', EnemySight);

    action('enemy-unit', EnemyUnits);

    action('player-unit', PlayerAction);

    const selection = add([
        rect(0, 0),
        color(1, 1, 1, 0.2),
        pos(0, 0),
    ]);

    overlaps('selection-box', 'player-unit', (e, u) =>{
        
        if (!selectedUnits.includes(u)){
            selectedUnits.push(u);
        }

    });

    mouseDown(MouseDown);
    mouseRelease(MouseRelease);
    ground.clicks(GroundIsClicked);


    const moveUnits = function(i, mx, my){
        i.destinationX = mx;
        i.destinationY = my;
        i.isMoving = true;
    }



    action('enemy-unit', async (e) => {

        if (!e.currentTarget ){

            if(e.isIdle) return false;

            if(!e.isMoving){
                moveUnits(
                    e, 
                    e.pos.x + choose([3,4,5])*50, 
                    e.pos.y + choose([3,4,5])*50);
            }

            if(e.isMoving){


                if(!e.isMoveAnimation){
                    e.play('move');
                    e.isMoveAnimation = true;

                }

                moveVecX = Math.floor(e.destinationX - e.pos.x);
                moveVecY = Math.floor(e.destinationY - e.pos.y);

                if (Math.abs(moveVecX) <= 1) {
                    if (Math.abs(moveVecY) <= 1) {

                        e.isIdle = true;
                        e.newsight.moved = false;
                        e.isMoveAnimation = false;
                        e.stop();
                        e.frame = e.startFrame;
                        await wait(choose([3, 5, 7, 12, 15]));
                        e.isMoving = false;
                        e.isIdle = false;
                        
                        return false;
                    }
                }

                mag = Math.sqrt(moveVecX ** 2 + moveVecY ** 2);
                moveVecX = (moveVecX / mag) * 70;
                moveVecY = (moveVecY / mag) * 70;
                e.move(moveVecX, moveVecY);
            }
        }
    });

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
        // selectedBuilding.isHighlighted = false;
        selectedBuilding = null;

        if(BP) destroy(BP);

    }


    ///////////////////////////////////////////////
    /// KeyPress Events

    

    action(() => {

        camScale(camS)// = camScale;

        camPos(camPosX, camPosY)
        status.text = `${camPos().x}, ${camPos().y}`;

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

        
    })


    keyPress('r', () => {
        camS = 1;
    });


    keyPress('s', () =>{
        console.log(camPos().y)

        camPos(mousePos())
    });


    keyPress('c', () => {
        cancelSelection();
    });
    

    keyPress('p', () => {
        messages.text = 'Paused'
        debug.paused = !debug.paused;
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









    //////////////////////////////////////////////
    /// DEBUG


    let oneTimeRun = false;
    let oneTimeRun2 = false;

    keyPress('b', () => {
        oneTimeRun = false;
        oneTimeRun2 = false;
    })


    keyPress('h', () => {

        const a = get('player-sight');

        console.log(a.paused)

        for(let i of a){
            // console.log(i);
            // i.hidden = true;
            i.paused = false;
            i.hidden = false;

            wait(0.1, () =>{
                i.paused = true;
                i.hidden = true;
            })
        }

    });

    keyPress('.', () =>{
        if(selectedUnits.length > 0){
            for(let i of selectedUnits){
                console.log('i = ', i );
                destroy(i);
                // console.log('i = ', i);
                // console.log('ib = ', i.exists());
            }
            selectedUnits = [];
            selectionSet = false
        }
    });

    keyPress('u', () =>{
        const x = new Unit('BlueRM', rand(40, 200), rand(80, 130), 'enemy-unit');
        x.getSight(x);
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





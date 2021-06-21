'use-strict';
import k from "./main.js";
import { unitsProperties, buildingsProperties } from "./constants.js";
import Button from './buttons.js';
import Building from './building.js';
import Unit from './units.js';

const mainMenu = scene('root', () => {

    const startButton = new Button(k.width() / 2, k.height() / 2 - 100, () => go('main'), 'Start', 200, 100, 24);
    startButton.button.clicks(() => {
        go('main');
    });

    add([
        text(`
        WASD: move cam
        E: zoom in
        Q: zoom out
        R: reset zoom

        X: stop selected units
        C: clear selection

        P: pause
        `, 18),
        pos(k.width() / 2 - 300, k.height() / 2),
    ])

});

///////////////////////////////////////
//
//                  Main Scene
//
///////////////////////////////////////

const mainScreen = scene('main', () => {

    layers([
        'bg',
        "obj",
        "ind",
        "ui",
        "tips",

    ], "obj");
    
    camIgnore([ "tips", "ui" ]);
    
    let moveVecX, moveVecY, mousePosX, mousePosY, mag, moveX, moveY, mainTB, BluePrint, currentBluePrint, distanceFromHQ;
    let playerCamp, camPosX, camPosY, h, m, s;
    let rectPosSet = false;
    let oldMousePosX = 0;
    let oldMousePosY = 0;
    let selectedUnits = []
    let selectionSet = false;  
    let placingBuilding = false;
    let sellBuilding = false;
    const unitsSpacingX = 530; 
    const unitsSpacingY = 20;
    const bottomPanelHeight = 120;
    const topFrameHeight = 40;
    let groups = [[],[],[]];
    let camS = 1;
    let byteCoinAmount = 70;
    let MaxBuildDistance = 400;
    let globalOrder = false;
    let time = 0;
    let kills = 0;
    let deaths = 0;
    let mined = 0;
    let totalMined = 0;

    const ground = add([
        
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
        pos( 18, k.height() - 15),
        layer('ui'),

    ]);

    const selection = add([
        rect(0, 0),
        color(1, 1, 1, 0.2),
        pos(0, 0),
    ]);

    on('add', 'Unit', (u) =>{
        wait(0.5, () => {
            u.newsight.paused = true;
            u.newsight.hidden = true;
        })
    });

    on('add', 'Building', (k) => {
        
        k.use({baseHealth: k.health});

        const HBbase = add([
            rect(k.width, 5),
            origin('left'),
            pos(k.pos.x - k.width / 2, k.pos.y - 10 - k.height / 2),
            color(0.8, 0, 0, 1),
            layer('ind'),
            {
                baseWidth: k.width,
            }
        ])

        const HB = add([
            rect(k.width, 5),
            origin('left'),
            pos(k.pos.x - k.width / 2, k.pos.y - 10 - k.height / 2),
            color(0, 0.8, 0, 1),
            layer('ind'),
            'HB',
            {
                parent: k,
                son: HBbase,
                healthUpdated: false,
                baseWidth: k.width,
            }
        ]);

    });

    on('add', 'Turret', async (t) => {

        t.use(
            {   
                damage: buildingsProperties.TURRET.damage,
                shots: 5,
                ordered: false,
                currentTarget: null,
                readyToFire: true,
                moveSight: moveSight,
            }
            );
        TurretGetSight(t);

        await wait(0.5, () => {
            t.newsight.paused = true;
            t.newsight.hidden = true;
        })
    });

    on('destroy', 'enemy-unit', () => {
        kills += 1;
    });

    on('destroy', 'player-unit', () => {
        deaths += 1;
    });

    loop(1, () => {
        time += 1;
        s = `${time%60}`.padStart(2, '0');
        m = `${Math.floor((time/60)%60)}`.padStart(2, '0');
        h = `${Math.floor((time/3600)%60)}`.padStart(2, '0');
    })

    resourcesDisplay.action( async () => {

        resourcesDisplay.text = `ByteCoin: ${byteCoinAmount}                                               ${h}:${m}:${s}`;

        if(byteCoinAmount < buildingsProperties.TURRET.cost){
            buildTurretButton.button.color = rgb(0.5, 0, 0);
        }
        else buildTurretButton.button.color = rgb(0, 0.5, 0);
        

        if(byteCoinAmount < buildingsProperties.CAMP.cost){
            buildCampButton.button.color = rgb(0.5, 0, 0);
        }
        else buildCampButton.button.color = rgb(0, 0.5, 0);

        if(byteCoinAmount < buildingsProperties.MINER.cost){
            buildMinerButton.button.color = rgb(0.5, 0, 0);
        }
        else buildMinerButton.button.color = rgb(0, 0.5, 0);

        if(byteCoinAmount < unitsProperties.RIFLEMAN.cost || get('player-camp').length == 0){
            recruitRifleManButton.button.color = rgb(0.5, 0, 0);
        }
        else recruitRifleManButton.button.color = rgb(0, 0.5, 0);

        if(byteCoinAmount < unitsProperties.ROCKETMAN.cost || get('player-camp').length == 0){
            recruitRocketManButton.button.color = rgb(0.5, 0, 0);
        }
        else recruitRocketManButton.button.color = rgb(0, 0.5, 0);

        await wait(0.2);
    });

    addLevel([
        "                    ",
        " C   M              ",
        "    T  T            ",
        "  M C               ",
        "   T   T         q  ",
        "  Q    T            ",
        "   T   T            ",
        " T  T               ",
        " C     T            ",
        "    M               ",
    ], 
    
    {
        width: 101,
        height: 90,
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
                'enemy-hq',
                'Building',
                'Killable',
                {   
                    health: buildingsProperties.HQ.health * 2,
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
                    baseHealth: buildingsProperties.MINER.health,
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
                'player-hq',
                'player-building',
                'Building',
                'Killable',
                {   
                    health: buildingsProperties.HQ.health,
                    startFrame: 0,
                }
            ];
        },

        'T': () => {
            return [

                sprite('BlueTurret', {
                    frame: 3
                }),
                solid(),
                origin("center"),
                'enemy-building',
                'Turret',
                'Building',
                'Killable',
                {
                    health: buildingsProperties.TURRET.health,
                    baseHealth: buildingsProperties.TURRET.health,
                    startFrame: 3,
                    owner: 'enemy-building',
                    
                }

            ]
        },

        't': () => {
            return [

                sprite('GreenTurret', {
                    frame: 0
                }),
                solid(),
                origin("center"),
                'player-building',
                'Turret',
                'Building',
                'Killable',
                {
                    health: buildingsProperties.TURRET.health,
                    baseHealth: buildingsProperties.TURRET.health,
                    startFrame: 0,
                    owner: 'player-building',
                }

            ]
        },
    });

    const pHQ = get('player-hq')[0]
    camPosX = pHQ.pos.x;
    camPosY = pHQ.pos.y;


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
            rectPosSet = true;
        }

        selection.width = mousePos().x - selection.pos.x;
        selection.height = mousePos().y - selection.pos.y;
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
                await wait(0.05)
                if(selectedUnits.length > 0){
                    for (let i of selectedUnits) {
                        i.getCloser(i, i.orderedTarget);
                    }
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

    const SightAction = (sight) => {

        if(sight.parent.props){
            if (sight.inSight.length > 0) {
                try {
                    sight.inSight = sight.inSight.filter(unit => unit.exists() == true);
                    sight.inSight = sight.inSight.filter(unit => unit.isOverlapped(sight) == true);
                    // if (sight.parent.props.currentTarget != sight.inSight[0]) {
                    if (!sight.parent.props.currentTarget) {
                        sight.parent.props.currentTarget = choose(sight.inSight);
                    }
                } catch (error) {
                    console.log(error);
                    sight.inSight = [];
                }
            }
            else {
                // if(!sight.parent.props.ordered) sight.parent.props.currentTarget = null;
                if (!sight.moved){
                    sight.moved = true
                    sight.parent.moveSight(sight.parent.props);
                }
            }
        }
        else {
            if (sight.inSight.length > 0) {
                try {
                    sight.inSight = sight.inSight.filter(unit => unit.exists() == true);
                    sight.inSight = sight.inSight.filter(unit => unit.isOverlapped(sight) == true);
                    if (sight.parent.currentTarget != sight.inSight[0]) {
                        sight.parent.currentTarget = choose(sight.inSight);
                    }
                } catch (error) {
                    console.log(error);
                    sight.inSight = [];
                }
            }
        }
    };

    action('Unit', async (unit) =>{
        if(!unit.isMoving){
            if(!unit.newsight.toggled){
                unit.newsight.toggled = true;
                unit.toggleSight(unit);
                await wait(3);
                unit.newsight.toggled = false;
            }
        }
    });

    action('Turret', async (t) => {
        await wait(1)
        if(!t.newsight.toggled){
            t.newsight.toggled = true;  
            toggleTurretSight(t);
            await wait(1.5);
            t.newsight.toggled = false;
        }

    });
        
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

                await wait(u.fireRate + rand(0, 0.3), () => {
                    // u.currentTarget = null;
                    u.readyToFire = true;
                    // u.toggleSight();
                });

            }
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


            // if(u.collidedWithBuilding){
            //     moveVecY = Math.floor(u.pos.x - u.destinationX);
            // }
            // else moveVecY = Math.floor(u.destinationY - u.pos.y);

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

            await wait(0.2 + rand(0, 0.3));
            if (u.currentTarget) {
                
                if (!u.currentTarget.exists()) {
                    u.currentTarget = null;
                    return false;
                }

                
                if(u.newsight.isOverlapped(u.currentTarget)){
                    if (u.readyToFire) {
                        u.readyToFire = false;
                        u.shoot(u);
                        wait(u.fireRate + rand(0, 0.3), () => {
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
                    play('buildS');
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
                            await wait(19 + rand(1, 5));
                            if(rand(0,1) > 0.1) mined = choose([5, 7, 12]);
                            else mined = choose([17, 23, 31]);
                            byteCoinAmount += mined;
                            totalMined += mined;
                            MinerB.building.isMining = false;

                        }
                    });

                    byteCoinAmount -= buildingsProperties.MINER.cost;
                    play('buildS');
                    return true;

                }
                else {
                    messages.text = `Insufficient resources`
                    return false;
                }

                break;


            case 'Turret':

                if (byteCoinAmount >= buildingsProperties.TURRET.cost){

                    const turret = new Building('GreenTurret', mousePos().x, mousePos().y, 'player-building');
                    
                    turret.building.use('player-turret');

                    turret.building.clicks( () => {
                        if(sellBuilding){
                            destroy(turret.building);
                        }
                    });

                    byteCoinAmount -= buildingsProperties.TURRET.cost;
                    play('buildS');
                    return true;
                }
                else {
                    messages.text = `Insufficient resources`;
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

                // distanceFromHQ = Math.sqrt((playerHQPosX - mousePos().x)**2 + (playerHQPosY - mousePos().y)**2);
                distanceFromHQ = Math.sqrt((pHQ.pos.x - mousePos().x)**2 + (pHQ.pos.y - mousePos().y)**2);

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
    function buildTurret() {
        placingBuilding = true;
        messages.text = 'choose location';
        addBluePrint(buildingsProperties.TURRET.width, buildingsProperties.TURRET.height, 'Turret', buildingsProperties.TURRET.cost);
    }

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
            const z = new Unit('GreenRM', playerCamp.pos.x - 20, playerCamp.pos.y + 45, 'player-unit');
            z.getSight(z);
        }
        else{
            messages.text = `Not enough resources`;
        }
    }

    function recruitRocketMan(){
        if(byteCoinAmount >= unitsProperties.ROCKETMAN.cost){
            byteCoinAmount -= unitsProperties.ROCKETMAN.cost;
            const z = new Unit('GreenRctM', playerCamp.pos.x - 20, playerCamp.pos.y + 45, 'player-unit');
            z.getSight(z);
        }
        else{
            messages.text = `Not enough resources`;
        }
    }


    const buildMinerButton = new Button(60, k.height() - 70, buildMiner, `Build miner $${buildingsProperties.MINER.cost}`, 90, 90, 11, true, 'minerB');

    const buildCampButton = new Button(160, k.height() - 70, buildCamp, `Build camp $${buildingsProperties.CAMP.cost}`, 90, 90, 11, true, 'campB');
    const buildTurretButton = new Button(260, k.height() - 70, buildTurret, '', 90, 90, 11, true, 'turretB');
    const recruitRifleManButton = new Button(400,  k.height() - 70, recruitRifleMan, '', 90, 90, 12, true, 'rmB');
    const recruitRocketManButton = new Button(500, k.height() - 70, recruitRocketMan, '', 90, 90, 12, true, 'rctmB');

    // const buildCampButton = new Button(110, messages.pos.y  - 20, buildCamp, `Build camp $${buildingsProperties.CAMP.cost}`, 200, 27, 11);
    // const buildMinerButton = new Button(110,  buildCampButton.y - buildCampButton.button.height - 4, buildMiner, `Build miner $${buildingsProperties.MINER.cost}`, 200, 27, 11);
    // const buildTurretButton = new Button(110, buildMinerButton.y - buildMinerButton.button.height - 4, buildTurret, `Build turret $${buildingsProperties.TURRET.cost}`, 200, 27, 11);
    // const recruitRocketManButton = new Button(580,  messages.pos.y - 26, recruitRocketMan, `Recruit rocketMan $${unitsProperties.ROCKETMAN.cost}`, 270, 44, 12);
    // const recruitRifleManButton = new Button(580,  recruitRocketManButton.y - recruitRocketManButton.button.height - 4, recruitRifleMan, `Recruit rifleMan $${unitsProperties.RIFLEMAN.cost}`, 270, 44, 12);
    
    
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

    buildTurretButton.button.clicks( async () => {
        await wait(0.1);
        buildTurretButton.act();
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

    const tipBox = add([
        rect(320, 100),
        origin('botleft'),
        color(0,0,0, 0.8),
        pos(0, 0),
        layer('ui'),
    ]);

    const tip = add([
        text('', 12, {
            width: 320
        }),
        origin('botleft'),
        color(1, 1, 1),
        pos(0, 0),
        layer('ui'),
    ]);
    
    function showTip() {
        tip.pos.x = mousePos('ui').x + 10;
        tip.pos.y = mousePos('ui').y - 20;
        tipBox.pos.x = mousePos('ui').x;
        tipBox.pos.y = mousePos('ui').y;
        tip.paused = false;
        tip.hidden = false;
        tipBox.paused = false;
        tipBox.hidden = false;
    }


    action(() => {

        if(buildCampButton.button.isHovered()){
            tip.text = `Camp\n\nfor training basic\ninfantry.\n\nCost: $${buildingsProperties.CAMP.cost}`;
            showTip();
        }
        else if(buildMinerButton.button.isHovered()){
            tip.text = `Miner\n\nmines Bytecoins day \nand night.\n\nCost: $${buildingsProperties.MINER.cost}`;
            showTip();
        }
        else if(buildTurretButton.button.isHovered()){
            tip.text = `Turret\n\nusefull for self defence.\n\n\nCost: $${buildingsProperties.TURRET.cost}`;
            showTip();
        }
        else if(recruitRifleManButton.button.isHovered()){
            tip.text = `Rifleman\n\na man with a rifle.\n\n(camp required)\nCost: $${unitsProperties.RIFLEMAN.cost}`;
            showTip();
        }
        else if(recruitRocketManButton.button.isHovered()){
            tip.text = `Rocketman\n\nfires long ranged rockets.\n\n(camp required)\nCost: $${unitsProperties.ROCKETMAN.cost}`;
            showTip();
        }
        else {
            tip.paused = true;
            tip.hidden = true;
            tipBox.paused = true;
            tipBox.hidden = true;
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

    });

    overlaps('player-sight', 'enemy-unit', (s, e) =>{
        s.inSight.push(e);

    });

    overlaps('Killable', 'RocketExp', (thing, explosion) =>{
        explosion.source.parent.getShot(thing, explosion.source.parent);
    });

    collides("Unit", "Building", (u, b) => {
        u.collidedWithBuilding = true;
        u.currentObstacle = b;
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
    });

    overlaps('enemy-sight', 'player-building', (s, e) =>{
        s.inSight.push(e);
    });

    action('enemy-sight', SightAction);

    action('player-sight', SightAction);

    action('enemy-unit', EnemyUnits);

    action('player-unit', PlayerAction);

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

    action('enemy-unit', (u) => {
        if (u.isClicked()) {
            if(selectedUnits.length > 0){
                globalOrder = true;
                for(let i of selectedUnits){
                    i.givenOrder = true;
                    i.orderedTarget = u;
                    i.ordered = true;
                }
            }
        }
    });

    action('HB', async (hb) => {

        if(!hb.parent.exists()) {
            if(hb.son) destroy(hb.son)
            destroy(hb)
        }

        if(!hb.healthUpdated){
            hb.healthUpdated = true;
            hb.width = hb.parent.health/hb.parent.baseHealth * hb.baseWidth;     
            await wait(0.15);
            hb.healthUpdated = false;
        }

    });

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
        wait(rand(0.4), () => {
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
                    volume: 0.2,
                    speed: 1,
                    detune: 100*rand(-2,2),
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
    }

    function TurretGetSight(e){
        let sTag;
        if(e.newsight) return false;
        if(e.owner == 'player-building'){
            sTag = 'player-sight';
        }
        else sTag = 'enemy-sight';

        const s = add([

            rect(buildingsProperties.TURRET.range, buildingsProperties.TURRET.range),
            color(0,0,0,0),
            pos(e.pos.x, e.pos.y),
            origin("center"),
            sTag,
            {
                parent: e,
                inSight: [],
                moved: false,
                toggled: false,
            }
        ]);
        e.use(
            { 
            newsight: s,
            });
    }

    function moveSight(u){
        // if(!u) return false;
        // u.newsight.pos.x = u.pos.x;
        // u.newsight.pos.y = u.pos.y;
    }

    async function toggleTurretSight(u){
        u.newsight.paused = false;
        // u.newsight.hidden = false;
        await wait(0.001);
        u.newsight.paused = true;
        // u.newsight.hidden = true;
    }

    async function turretShoot(t){
        if(t.readyToFire){
            t.readyToFire = false;
            t.currentTarget.getShot(t.currentTarget, t);
            t.play('fire', {
                animSpeed: .03,
            });
            play('Tshoot',
            {
                volume: 0.5,
                speed: 1,
                detune: 0,
            });
            await wait(0.06);
            t.stop();
            t.frame = t.startFrame;
            await wait(0.02);
            t.readyToFire = true;
        }
    }


    ///////////////////////////////////////
    //
    //                  AI Stuff
    //
    ///////////////////////////////////////
    

    let spawning = false;
    let enemyCamps;

    action( async () => {
        if(!spawning){
            spawning = true;
            await wait(rand(14, 27));

            enemyCamps = get('enemy-camp');

            for(let camp of enemyCamps){

                if(camp){
                    if(!camp.exists()) return false;

                    for(let k = 0; k < rand(5, 13); k++){
                        if(rand(0,1) > 0.2){
                            const u = new Unit('BlueRM',camp.pos.x - 15, camp.pos.y + 30, 'enemy-unit')   
                            u.getSight(u)
                        }
                        else{
                            const u = new Unit('BlueRctM',camp.pos.x - 15, camp.pos.y + 30, 'enemy-unit')
                            u.getSight(u)
                        }
                        
                        await wait(0.4);
                    }
                }

                await wait(3);
            }

            
            spawning = false;
        }
    });

    action('enemy-unit', async (e) => {

        await wait(1);
                
            if(e.isMoving){

                if(!e.isMoveAnimation){
                    e.play('move');
                    e.isMoveAnimation = true;
                }

                if(e.collidedWithBuilding){
                    moveVecY = Math.floor(e.pos.x - e.destinationX);
                }
                else moveVecY = Math.floor(e.destinationY - e.pos.y);

                moveVecX = Math.floor(e.destinationX - e.pos.x);

                if (Math.abs(moveVecX) <= 1) {
                    if (Math.abs(moveVecY) <= 1) {

                        e.newsight.moved = false;
                        e.isMoveAnimation = false;
                        e.stop();
                        e.frame = e.startFrame;
                        e.isMoving = false;
                        e.moveSight(e);
                        return false;
                    }
                }

                mag = Math.sqrt(moveVecX ** 2 + moveVecY ** 2);
                moveVecX = (moveVecX / mag) * 100;
                moveVecY = (moveVecY / mag) * 100;
                e.move(moveVecX, moveVecY);
            }

            else {
                if(e.newsight.inSight.length == 0 && !e.currentTarget){
                    if(!e.seeking){
                        e.seeking = true

                        if(rand(0,1) > 0.5){

                            if(get('player-unit').length > 0) e.getCloser(e, choose(get('player-unit')))
                        }
                        
                        else if(get('player-turret').length > 0){
                            e.getCloser(e, choose(get('player-turret')))
                        }
                        else if(get('player-building').length > 0){
                            e.getCloser(e, choose(get('player-building')))
                        }
                        
                        await wait(3);
                        
                        e.seeking = false;
                    }

                }
            }

    });

    action('Turret', async (t) => {

        if(t.currentTarget){

            if(t.currentTarget.exists()){

                if(t.shots > 0){
                    turretShoot(t);
                    t.shots -= 1
                }
                else {
                    wait(rand(0.1, 1),() =>{
                        t.shots = 5;
                    });
                }
            }
        }


        
    });
    
    let lost = false;
    let won = false;
    
    action( async () => {
        

        if(get('player-hq').length == 0){
            if(!lost){
                lost = true;
                // debug.paused = true;
                for(let i of get('player-building')) destroy(i)
                for(let i of get('player-unit')) destroy(i)
                byteCoinAmount = 0;
                add([
                    rect(k.width(), k.height()),
                    pos(0,0),
                    color(0.3,0,0,0.5),
                    layer('ui'),
                ]);
                
                add([
                    text('Defeat', 32),
                    color(0.8, 0, 0),
                    origin('center'),
                    layer('ui'),
                    pos(k.width()/2, k.height()/2 - 100),
                ]);


                wait(1, () => {

                    const quit = new Button(k.width() / 2, k.height() / 2 + 50, function (){go('root')}, 'Quit', 200, 100, 32)
    
                    quit.button.clicks(() => {
                        quit.act()
                    })
                });


            }
        }

        if(get('enemy-hq').length == 0){
            if(!won){
                won = true;
                for(let i of get('enemy-building')) destroy(i)
                for(let i of get('enemy-unit')) destroy(i)
                // debug.paused = true;
                add([
                    rect(k.width(), k.height()),
                    pos(0,0),
                    color(0, 0, 0, 0.75),
                    layer('ui'),
                ]);
                
                add([
                    text('Victory', 32),
                    color(0, 1, 0),
                    origin('center'),
                    layer('ui'),
                    pos(k.width()/2, k.height()/2 - 150),
                ]);

                const s = `${time%60}`.padStart(2, '0');
                const m = `${Math.floor((time/60)%60)}`.padStart(2, '0');
                const h = `${Math.floor((time/3600)%60)}`.padStart(2, '0');

                add([
                    text(`
                    Enemy units killed: ${kills}

                    Units lost: ${deaths}

                    Total mined Bytecoins: ${totalMined}

                    Elapsed time: ${h}:${m}:${s}
                    `.padStart(2, "0"), 16),
                    origin('left'),
                    layer('ui'),
                    pos( - 140, k.height() / 2 )

                ])

                wait(1, () => {

                    const quit = new Button(k.width() / 2, k.height() / 2 + 150, function (){go('root')}, 'Quit', 120, 60, 18)
    
                    quit.button.clicks(() => {
                        quit.act()
                    })

                })

            }
        }

        await wait(1);
    });



    ///////////////////////////////////////
    //
    //                  Keyboard Events
    //
    ///////////////////////////////////////

    let pausedScreen, pausedText;

    keyPress('p', () => {
        debug.paused = !debug.paused;    

        if(debug.paused == false){
            if(pausedScreen) {
                destroy(pausedScreen);
                destroy(pausedText);
            }
        }
        else {
            pausedScreen = add([
                rect(k.width(), k.height()),
                layer('ui'),
                color(0,0,0,0.5),
            ]);

            pausedText = add([
                text('Paused', 24),
                layer('ui'),
                origin('center'),
                pos(k.width() / 2, k.height() / 2)
            ])
        }
    });


    // keyPress('g', () => {
    //     destroy(get('enemy-hq')[0]);
    // });

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

    /////////////////////////////////////////////////////////////////////

});

start('root');

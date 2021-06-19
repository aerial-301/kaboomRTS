export const k = kaboom({  global: true,
    clearColor: [0, 0, 0, 1],
    width:840,
    height: 570,
});

// loadSprite("terrain", "./assets/GroundTerrain.jpeg");
loadSprite("terrain", "./assets/BG2000x900.jpeg");

loadSprite("GreenTurret", "./assets/TurretSprite.png", 
{
    sliceX: 3,
    sliceY: 3,
    anims: 
    {
        pain: 
        {
            from: 6,
            to: 6
        },

        fire:
        {
            from: 1,
            to: 2
        },
    }
    
});

loadSprite("BlueTurret", "./assets/TurretSprite.png", 
{
    sliceX: 3,
    sliceY: 3,
    anims: 
    {
        pain: 
        {
            from: 6,
            to: 6
        },

        fire:
        {
            from: 4,
            to: 5
        },
    }
    
});

loadSprite("BottomPanel", "./assets/BottomPanel.jpeg");
loadSprite("TopFrame", "./assets/TopFrame.jpeg");
loadSound("Tshoot", "./assets/turret1.ogg");
loadSound("shoot", "./assets/GunShot1.ogg");
loadSound("rocket", "./assets/RocketShot.ogg");
loadSound("exp", "./assets/exp.ogg");
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



export default k;
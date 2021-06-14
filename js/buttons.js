// 'use-strict';

export default class Button {

    constructor(x, y, act, t = 'Button', w = 90, h = 30, left_p = 8, top_p = 8, f_size = 12){

        this.x = x;
        this.y = y;
        this.act = act;
        this.t = t;
        this.w = w;
        this.h = h;
        this.left_p = left_p;
        this.top_p = top_p;

        this.button = add([
            rect(w, h ),
            pos(x, y),
            color(0.2, 0.3, 1),
            layer('ui')
        ]);

        add([
            text(t, f_size, {
                width: w,
                
                
            }),
            layer('ui'),
            
            pos(x + left_p, y + top_p),
        ]);

    }

    act(){
        this.act();
    }
    

}
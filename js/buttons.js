// 'use-strict';

export default class Button {

    constructor(x, y, t = 'Button', w = 90, h = 30, left_p = 8, top_p = 8, f_size = 12){

        this.x = x;
        this.y = y;
        this.t = t;
        this.w = w;
        this.h = h;
        this.left_p = left_p;
        this.top_p = top_p;
        this.ref = add([
            rect(w, h ),
            pos(x, y),
            color(0.2, 0.3, 1),
            layer('ui'),
        ]);

        add([
            layer('ui'),
            text(t, f_size, {
                width: w,
            }),
            pos(x + left_p, y + top_p),
        ]);
    }
}
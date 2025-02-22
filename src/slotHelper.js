// slotHelper.js

export class SlotHelper {
    static tweening = [];

    // Tween function to animate properties
    static tweenTo(object, property, target, time, easing, onchange, oncomplete) {
        const tween = {
            object,
            property,
            propertyBeginValue: object[property],
            target,
            easing,
            time,
            change: onchange,
            complete: oncomplete,
            start: Date.now(),
        };

        this.tweening.push(tween);
        return tween;
    }

    // Linear interpolation function
    static lerp(a1, a2, t) {
        return a1 * (1 - t) + a2 * t;
    }

    // Backout easing function
    static backout(amount) {
        return (t) => --t * t * ((amount + 1) * t + amount) + 1;
    }

    // Update tweening animations
    static updateTweens() {
        const now = Date.now();
        const remove = [];

        for (let i = 0; i < this.tweening.length; i++) {
            const t = this.tweening[i];
            const phase = Math.min(1, (now - t.start) / t.time);

            t.object[t.property] = this.lerp(t.propertyBeginValue, t.target, t.easing(phase));
            if (t.change) t.change(t);
            if (phase === 1) {
                t.object[t.property] = t.target;
                if (t.complete) t.complete(t);
                remove.push(t);
            }
        }

        for (let i = 0; i < remove.length; i++) {
            this.tweening.splice(this.tweening.indexOf(remove[i]), 1);
        }
    }
}
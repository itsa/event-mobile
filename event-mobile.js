"use strict";

/**
 * Integrates DOM-events to core-event-base. more about DOM-events:
 * http://www.smashingmagazine.com/2013/11/12/an-introduction-to-dom-events/
 *
 * Should be called using  the provided `init`-method like this:
 *
 *
 * <i>Copyright (c) 2014 ITSA - https://github.com/itsa</i>
 * New BSD License - http://choosealicense.com/licenses/bsd-3-clause/
 *
 * @example
 * Event = require('event');
 * DOMEvent = require('event-dom');
 * DOMEvent.mergeInto(Event);
 *
 * @module event
 * @submodule event-mobile
 * @class Event
 * @since 0.0.1
*/

var NAME = '[event-mobile]: ';

module.exports = function (window) {
    /**
     * The (only) Hammer-instance that `Event` uses. It is bound to the `body`-element.
     *
     * @property hammertime
     * @type Hammer-instance
     * @since 0.0.1
     */
    var Event = require('event-dom')(window),
        document = window.document,
        Hammer = require('hammerjs'),
        hammertime = Event.hammertime = new Hammer(document.body),
        singletap, doubletap, tripletap;

    if (window._ITSAmodules.EventMobile) {
        return Event; // Event was already extended
    }

    // create reference to the HammerClass:
    /**
     * Adds the `Hammer`-class to Event, so it can be used from within Event.
     *
     * @property Hammer
     * @type Hammer
     * @since 0.0.1
     */
    Event.Hammer = Hammer;

    // now we extend HammerJS with 2 events: doubletap and tripletap:
    doubletap = new Hammer.Tap({ event: 'doubletap', taps: 2 });
    tripletap = new Hammer.Tap({ event: 'tripletap', taps: 3 });
    hammertime.add([
        doubletap,
        tripletap
    ]);

    // we want to recognize this simulatenous, so a doubletap and trippletap will be detected even while a tap has been recognized.
    // the tap event will be emitted on every tap
    singletap = hammertime.get('tap');
    doubletap.recognizeWith(singletap);
    tripletap.recognizeWith([doubletap, singletap]);

    // patch Hammer.Manager.prototype.emit --> it shouldn't emit to its own listeners,
    // but to our eventsystem. Inspired from Jorik Tangelder's own jquery plugin: https://github.com/hammerjs/jquery.hammer.js
    Hammer.Manager.prototype.emit = function(type, data) {
        if (type==='hammer.input') {
            return;
        }
        console.log(NAME, 'emit '+type);
        // label the eventobject by being a Hammer-event
        // is not being used internally, but we would like
        // to inform the subscribers
        data._isHammer = true;
        data.type = type;

        // Emitting 'ParcelaEvent:eventmobile' --> its defaultFn is defined inside `event-dom`
        // which will transport the event through the special dom-cycle
        /**
         * Is emitted whenever hammerjs detects a gestureevent.
         * By emitting its original event through ParcelaEvent:eventmobile, `event-dom`
         * will catch it and process it through the dom-event cycle.
         *
         * @event ParcelaEvent:eventmobile
         * @param e {Object} eventobject
         * @since 0.1
        **/
        Event._domCallback(data);
    };

    Hammer.Manager.prototype.set = (function(originalSet) {
        return function(options) {
            delete options.domEvents; // we don't want the user make Hammer fire domevents
            originalSet.call(this, options);
        };
    })(Hammer.Manager.prototype.set);

    // store module:
    window._ITSAmodules.EventMobile = Event;

    return Event;
};

/*global describe, it */

"use strict";

(function (window) {

var expect = require('chai').expect,
    should = require('chai').should(),
    DOCUMENT = window.document,
    fakedom = window.navigator.userAgent==='fake',
    Event = fakedom ? require('event-dom')(window) : require('../event-mobile.js')(window),

    EMIT_TAP_EVENT, EMIT_FOCUS_EVENT, EMIT_KEY_EVENT, buttonnode, divnode;

require('event/event-emitter.js');
require('event/event-listener.js');

EMIT_TAP_EVENT = function(target) {
    if (!fakedom) {
        Event.hammertime.emit('tap', {target: target});
    }
    else {
        // dom.level2.events.MouseEvent('click');
        var customEvent,
            type = 'tap',
            bubbles = true, //all mouse events bubble
            cancelable = false,
            view = window,
            detail = 1,  //number of mouse clicks must be at least one
            screenX = 0,
            screenY = 0,
            clientX = 0,
            clientY = 0,
            ctrlKey = false,
            altKey = false,
            shiftKey = false,
            metaKey = false,
            button = 0,
            relatedTarget = null;

        if (DOCUMENT.createEvent) {
            customEvent = DOCUMENT.createEvent('MouseEvents');
            customEvent.initMouseEvent(type, bubbles, cancelable, view, detail,
                                     screenX, screenY, clientX, clientY,
                                     ctrlKey, altKey, shiftKey, metaKey,
                                     button, relatedTarget);
            //fire the event
            target.dispatchEvent(customEvent);

        }
        else if (DOCUMENT.createEventObject) { //IE
            //create an IE event object
            customEvent = DOCUMENT.createEventObject();
            //assign available properties
            customEvent.bubbles = bubbles;
            customEvent.cancelable = cancelable;
            customEvent.view = view;
            customEvent.detail = detail;
            customEvent.screenX = screenX;
            customEvent.screenY = screenY;
            customEvent.clientX = clientX;
            customEvent.clientY = clientY;
            customEvent.ctrlKey = ctrlKey;
            customEvent.altKey = altKey;
            customEvent.metaKey = metaKey;
            customEvent.shiftKey = shiftKey;
            //fix button property for IE's wacky implementation
            switch(button){
                case 0:
                    customEvent.button = 1;
                    break;
                case 1:
                    customEvent.button = 4;
                    break;
                case 2:
                    //leave as is
                    break;
                default:
                    customEvent.button = 0;
            }
            customEvent.relatedTarget = relatedTarget;
            //fire the event
            target.fireEvent('onclick', customEvent);
        }
    }
};

describe('TAP Events', function () {
    // Code to execute before the tests inside this describegroup.
    before(function() {
        divnode = DOCUMENT.createElement('div');
        divnode.id = 'divcont';
        divnode.className = 'contclass';
        divnode.style = 'position: absolute; left: -1000px; top: -1000px;';
        buttonnode = DOCUMENT.createElement('button');
        buttonnode.id = 'buttongo';
        buttonnode.className = 'buttongoclass';
        divnode.appendChild(buttonnode);
        DOCUMENT.body.appendChild(divnode);
    });

    // Code to execute after the tests inside this describegroup.
    after(function() {
        DOCUMENT.body.removeChild(divnode);
        Event.unNotify('UI:*');
    });

    // Code to execute after every test.
    afterEach(function() {
        Event.detachAll();
        Event.undefAllEvents();
    });

    it('listening event', function (done) {
        Event.after('tap', function() {
            done();
        }, '#buttongo');
        EMIT_TAP_EVENT(buttonnode);
    });

    it('preventing event', function (done) {
        Event.after('tap', function() {
            done(new Error('event should not happen'));
        }, '#buttongo');
        Event.before('tap', function(e) {
            e.preventDefault();
        }, '#buttongo');
        EMIT_TAP_EVENT(buttonnode);
        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(done, 50);
    });

    it('halt event', function (done) {
        Event.after('tap', function() {
            done(new Error('event should not happen'));
        }, '#buttongo');
        Event.before('tap', function(e) {
            e.halt();
        }, '#buttongo');
        EMIT_TAP_EVENT(buttonnode);
        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(done, 50);
    });

    it('properties eventobject', function (done) {
        Event.after('tripletap', function(e) {
            (e.velocity===undefined).should.be.false;
        }, '#buttongo');
        EMIT_TAP_EVENT(buttonnode);
        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(done, 50);
    });

    it('delegation on future nodes', function (done) {
        var count = 0,
            buttonnode2, buttonnode3;
        Event.after('tap', function() {
            count++;
        }, '#buttongo2');
        Event.after('tap', function() {
            count++;
        }, '.go');

        buttonnode2 = DOCUMENT.createElement('button');
        buttonnode2.id = 'buttongo2';
        buttonnode2.style = 'position: absolute; left: -1000px; top: -1000px;';
        buttonnode2.className = 'go';
        DOCUMENT.body.appendChild(buttonnode2);

        buttonnode3 = DOCUMENT.createElement('button');
        buttonnode3.id = 'buttongo3';
        buttonnode3.style = 'position: absolute; left: -1000px; top: -1000px;';
        buttonnode3.className = 'go';
        DOCUMENT.body.appendChild(buttonnode3);

        EMIT_TAP_EVENT(buttonnode2);
        EMIT_TAP_EVENT(buttonnode3);
        DOCUMENT.body.removeChild(buttonnode2);
        DOCUMENT.body.removeChild(buttonnode3);
        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            expect(count).to.eql(3);
            done();
        }, 50);
    });

    it('delegation on future nodes with preventDefault', function (done) {
        var count = 0,
            buttonnode2, buttonnode3;
        Event.before('tap', function(e) {
            e.preventDefault();
        }, '#buttongo3');
        Event.after('tap', function() {
            count++;
        }, '#buttongo2');
        Event.after('tap', function() {
            count++;
        }, '.go');

        buttonnode2 = DOCUMENT.createElement('button');
        buttonnode2.id = 'buttongo2';
        buttonnode2.style = 'position: absolute; left: -1000px; top: -1000px;';
        buttonnode2.className = 'go';
        DOCUMENT.body.appendChild(buttonnode2);

        buttonnode3 = DOCUMENT.createElement('button');
        buttonnode3.id = 'buttongo3';
        buttonnode3.style = 'position: absolute; left: -1000px; top: -1000px;';
        buttonnode3.className = 'go';
        DOCUMENT.body.appendChild(buttonnode3);

        EMIT_TAP_EVENT(buttonnode2);
        EMIT_TAP_EVENT(buttonnode3);
        DOCUMENT.body.removeChild(buttonnode2);
        DOCUMENT.body.removeChild(buttonnode3);
        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            expect(count).to.eql(2);
            done();
        }, 50);
    });

    it('stopPropagation', function (done) {
        var count = 0;

        Event.after('tap', function() {
            // done(new Error('After-subscriber #divcont should not be invoked'));
        }, '#divcont');

        Event.after('tap', function() {
            expect(count).to.eql(15);
            count = count + 16;
        }, '#divcont button.buttongoclass');

        Event.after('tap', function() {
            expect(count).to.eql(31);
            count = count + 32;
        }, '#buttongo');

        //====================================================

        Event.before('tap', function(e) {
            done(new Error('Before-subscriber #divcont should not be invoked'));
        }, '#divcont');

        Event.before('tap', function() {
            expect(count).to.eql(0);
            count = count + 1;
        }, '#divcont button.buttongoclass');

        Event.before('tap', function(e) {
            expect(count).to.eql(1);
            count = count + 2;
            e.stopPropagation();
        }, '#divcont button.buttongoclass');

        Event.before('tap', function() {
            expect(count).to.eql(3);
            count = count + 4;
        }, '#divcont button.buttongoclass');

        Event.before('tap', function() {
            expect(count).to.eql(7);
            count = count + 8;
        }, '#buttongo');

        //====================================================

        EMIT_TAP_EVENT(buttonnode);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            expect(count).to.eql(63);
            done();
        }, 50);
    });

    it('stopPropagation situation 2', function (done) {
        var count = 0,
            divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);


        Event.after('tap', function() {
            done(new Error('Before-subscriber button.buttongoglass should not be invoked'));
        }, 'button.buttongoclass');

        Event.after('tap', function(e) {
            done(new Error('Before-subscriber .contclass should not be invoked'));
        }, '.contclass');

        Event.after('tap', function(e) {
            expect(count).to.eql(31);
            count = count + 32;
        }, '.divnode2class');

        Event.after('tap', function() {
            expect(count).to.eql(15);
            count = count + 16;
        }, '#divnode3');

        Event.after('tap', function() {
            expect(count).to.eql(7);
            count = count + 8;
        }, 'button');

        //====================================================

        Event.before('tap', function() {
            done(new Error('Before-subscriber button.buttongoglass should not be invoked'));
        }, 'button.buttongoclass');

        Event.before('tap', function(e) {
            done(new Error('Before-subscriber .contclass should not be invoked'));
        }, '.contclass');

        Event.before('tap', function(e) {
            expect(count).to.eql(3);
            count = count + 4;
            e.stopPropagation();
        }, '.divnode2class');

        Event.before('tap', function() {
            expect(count).to.eql(1);
            count = count + 2;
        }, '#divnode3');

        Event.before('tap', function() {
            expect(count).to.eql(0);
            count = count + 1;
        }, 'button');

        //====================================================

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            expect(count).to.eql(63);
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('stopPropagation situation 3', function (done) {
        var count = 0,
            divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);


        Event.after('tap', function() {
            done(new Error('Before-subscriber button.buttongoglass should not be invoked'));
        }, 'button.buttongoclass');

        Event.after('tap', function(e) {
            done(new Error('Before-subscriber .contclass should not be invoked'));
        }, '#divcont');

        Event.after('tap', function(e) {
            expect(count).to.eql(31);
            count = count + 32;
        }, '#divnode2');

        Event.after('tap', function() {
            expect(count).to.eql(15);
            count = count + 16;
        }, '#divnode3');

        Event.after('tap', function() {
            expect(count).to.eql(7);
            count = count + 8;
        }, 'button');

        //====================================================

        Event.before('tap', function() {
            done(new Error('Before-subscriber button.buttongoglass should not be invoked'));
        }, 'button.buttongoclass');

        Event.before('tap', function(e) {
            done(new Error('Before-subscriber .contclass should not be invoked'));
        }, '#divcont');

        Event.before('tap', function(e) {
            expect(count).to.eql(3);
            count = count + 4;
            e.stopPropagation();
        }, '#divnode2');

        Event.before('tap', function() {
            expect(count).to.eql(1);
            count = count + 2;
        }, '#divnode3');

        Event.before('tap', function() {
            expect(count).to.eql(0);
            count = count + 1;
        }, 'button');

        //====================================================

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            expect(count).to.eql(63);
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('stopImmediatePropagation', function (done) {
        var count = 0;

        Event.after('tap', function() {
            done(new Error('After-subscriber #divcont should not be invoked'));
        }, '#divcont');

        Event.after('tap', function() {
            done(new Error('Before-subscriber #divcont button.buttongoclass should not be invoked'));
        }, '#divcont button.buttongoclass');

        Event.after('tap', function() {
            done(new Error('Before-subscriber #buttongo should not be invoked'));
        }, '#buttongo');

        //====================================================

        Event.before('tap', function() {
            done(new Error('Before-subscriber #divcont should not be invoked'));
        }, '#divcont');

        Event.before('tap', function() {
            expect(count).to.eql(0);
            count = count + 1;
        }, '#divcont button.buttongoclass');

        Event.before('tap', function(e) {
            expect(count).to.eql(1);
            count = count + 2;
            e.stopImmediatePropagation();
        }, '#divcont button.buttongoclass');

        Event.before('tap', function() {
            done(new Error('Before-subscriber #divcont button.buttongoclass should not be invoked'));
        }, '#divcont button.buttongoclass');

        Event.before('tap', function() {
            done(new Error('Before-subscriber #buttongo should not be invoked'));
        }, '#buttongo');

        //====================================================

        EMIT_TAP_EVENT(buttonnode);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            expect(count).to.eql(3);
            done();
        }, 50);
    });

    it('stopImmediatePropagation situation 2', function (done) {
        var count = 0,
            divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);


        Event.after('tap', function() {
            done(new Error('Before-subscriber button.buttongoglass should not be invoked'));
        }, 'button.buttongoclass');

        Event.after('tap', function(e) {
            done(new Error('Before-subscriber .contclass should not be invoked'));
        }, '.contclass');

        Event.after('tap', function(e) {
            done(new Error('Before-subscriber .divnode2class should not be invoked'));
        }, '.divnode2class');

        Event.after('tap', function() {
            expect(count).to.eql(15);
            count = count + 16;
        }, '#divnode3');

        Event.after('tap', function() {
            expect(count).to.eql(7);
            count = count + 8;
        }, 'button');

        //====================================================

        Event.before('tap', function() {
            done(new Error('Before-subscriber button.buttongoglass should not be invoked'));
        }, 'button.buttongoclass');

        Event.before('tap', function(e) {
            done(new Error('Before-subscriber .contclass should not be invoked'));
        }, '.contclass');

        Event.before('tap', function(e) {
            expect(count).to.eql(3);
            count = count + 4;
            e.stopImmediatePropagation();
        }, '.divnode2class');

        Event.before('tap', function() {
            expect(count).to.eql(1);
            count = count + 2;
        }, '#divnode3');

        Event.before('tap', function() {
            expect(count).to.eql(0);
            count = count + 1;
        }, 'button');

        //====================================================

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            expect(count).to.eql(31);
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('stopImmediatePropagation situation 3', function (done) {
        var count = 0,
            divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);


        Event.after('tap', function() {
            done(new Error('Before-subscriber button.buttongoglass should not be invoked'));
        }, 'button.buttongoclass');

        Event.after('tap', function(e) {
            done(new Error('Before-subscriber .contclass should not be invoked'));
        }, '#divcont');

        Event.after('tap', function(e) {
            done(new Error('Before-subscriber .divnode2class should not be invoked'));
        }, '#divnode2');

        Event.after('tap', function() {
            expect(count).to.eql(15);
            count = count + 16;
        }, '#divnode3');

        Event.after('tap', function() {
            expect(count).to.eql(7);
            count = count + 8;
        }, 'button');

        //====================================================

        Event.before('tap', function() {
            done(new Error('Before-subscriber button.buttongoglass should not be invoked'));
        }, 'button.buttongoclass');

        Event.before('tap', function(e) {
            done(new Error('Before-subscriber .contclass should not be invoked'));
        }, '#divcont');

        Event.before('tap', function(e) {
            expect(count).to.eql(3);
            count = count + 4;
            e.stopImmediatePropagation();
        }, '#divnode2');

        Event.before('tap', function() {
            expect(count).to.eql(1);
            count = count + 2;
        }, '#divnode3');

        Event.before('tap', function() {
            expect(count).to.eql(0);
            count = count + 1;
        }, 'button');

        //====================================================

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            expect(count).to.eql(31);
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('e.target', function (done) {
        var divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);

        Event.after('tap', function(e) {
            (e.target===divnode2).should.be.true;
        }, '#divcont .divnode2class');

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('e.currentTarget', function (done) {
        var divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);

        Event.after('tap', function(e) {
            (e.currentTarget===divnode).should.be.true;
        }, '#divcont .divnode2class');

        Event.after('tap', function(e) {
            (e.currentTarget===divnode2).should.be.true;
        }, '#divnode2 button');

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('e.sourceTarget', function (done) {
        var divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);

        Event.after('tap', function(e) {
            (e.sourceTarget===deepestbutton).should.be.true;
        }, '#divcont .divnode2class');

        Event.after('tap', function(e) {
            (e.sourceTarget===deepestbutton).should.be.true;
        }, '#divnode2 button');

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('e.target on document', function (done) {
        var divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);

        Event.after('tap', function(e) {
            (e.target===divnode2).should.be.true;
        }, '.divnode2class');

        Event.after('tap', function(e) {
            (e.target===deepestbutton).should.be.true;
        }, '.divnode2class button');

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('e.currentTarget on document', function (done) {
        var divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);

        Event.after('tap', function(e) {
            (e.currentTarget===DOCUMENT).should.be.true;
        }, '.divnode2class');

        Event.after('tap', function(e) {
            (e.currentTarget===DOCUMENT).should.be.true;
        }, '.divnode2class button');

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

    it('e.sourceTarget on document', function (done) {
        var divnode = DOCUMENT.getElementById('divcont'),
            divnode2 = DOCUMENT.createElement('div'),
            divnode3 = DOCUMENT.createElement('div'),
            deepestbutton = DOCUMENT.createElement('button');
        divnode2.id = 'divnode2';
        divnode3.id = 'divnode3';
        divnode2.className = 'divnode2class';
        divnode3.appendChild(deepestbutton);
        divnode2.appendChild(divnode3);
        divnode.appendChild(divnode2);

        Event.after('tap', function(e) {
            (e.sourceTarget===deepestbutton).should.be.true;
        }, '.divnode2class');

        Event.after('tap', function(e) {
            (e.sourceTarget===deepestbutton).should.be.true;
        }, '.divnode2class button');

        EMIT_TAP_EVENT(deepestbutton);

        // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
        // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
        setTimeout(function() {
            divnode.removeChild(divnode2);
            done();
        }, 50);
    });

});

}(global.window || require('node-win')));
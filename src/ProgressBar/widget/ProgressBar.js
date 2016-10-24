/*
    Mendix 5 Bootstrap Progress Bar
    ========================

    @file      : ProgressBar.js
    @version   : 1.2.0
    @author    : Andries Smit
    @date      : Date: 01 Feb 2015
    @copyright : Flock Of Birds
    @license   : MIT
    Organisation: Flock of Birds

    Release notes 1.0: Upgraded version of the progress bar, making use of Mx5
    and dojo 1.8 functions, use Bootstrap styling. Render normal, striped or
    animated. Use an attribute to set bootstrap style success, warning, info,
    danger. Update Progress bar on refresh or change of attribute, Add
    optional on click Microflow.

    Release notes 1.1:
    Use of subscribe alias, so the subscription will be automatically destroyed when the widget is.

    Release notes 1.2.0
    Upgraded widget based on widget boilerplate version 2.13.1, removed code abbreviations. Added eslint and made modifications according to the eslint rules.

    Documentation
    ========================
    Mendix Progress Bar widget based on Bootstrap 3.0.2
*/

define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/dom-style",
    "dojo/html",
    "dojo/dom-class",
    "dojo/_base/array",
    "dojo/_base/event",
    "dojo/_base/lang",

    "dojo/text!ProgressBar/widget/template/ProgressBar.html"
], function (declare, _WidgetBase, _TemplatedMixin, dojoStyle, dojoHtml, dojoClass, dojoArray, dojoEvent, dojoLang,  widgetTemplate) {
    "use strict";

    // Declare widget's prototype.
    return declare("ProgressBar.widget.ProgressBar", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        progressNode: null,
        barNode: null,
        progressTextNode: null,
        value: 0,
        previousClass: "",

        // Parameters configured in the Modeler.
        progressAtt: "",
        bootstrapStyleAtt: "",
        barType: "default",
        description: "",
        width: 0,
        textColorSwitch: 50,
        onclickMf: "",
        classBar: "none",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: [],
        _contextObj: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function() {
            logger.debug(this.id + ".constructor");
            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget.
        postCreate: function() {
            logger.debug(this.id + ".postCreate");

            if (this.classBar !== "none") {
                dojoClass.add(this.barNode, "progress-bar-" + this.classBar);
            }

            this._updateRendering();
            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function(object, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = object;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },

        // We want to stop events on a mobile device
        _stopBubblingEventOnMobile: function(event) {
            logger.debug(this.id + "._stopBubblingEventOnMobile");
            if (typeof document.ontouchstart !== "undefined") {
                dojoEvent.stop(event);
            }
        },

        // Attach events to HTML dom elements
        _setupEvents: function() {
            logger.debug(this.id + "._setupEvents");

            this.connect(this.domNode, "click", function (event) {
                // Only on mobile stop event bubbling!
                this._stopBubblingEventOnMobile(event);

                // If a microflow has been set execute the microflow on a click.
                if (this.onclickMf !== "") {
                    mx.data.action({
                        params: {
                            applyto: "selection",
                            actionname: this.onclickMf,
                            guids: [ this._contextObj.getGuid() ]
                        },
                        store: {caller: this.mxform},
                        callback: function() {},
                        error: dojoLang.hitch(this, function(error) {
                            logger.error(this.id + ": An error occurred while executing microflow: ", error);
                            mx.ui.error("Error while executing MicroFlow: " + this.onclickMf + " : " + error.message);
                        })
                    }, this);
                }
            });
        },

        // Rerender the interface.
        _updateRendering: function(callback) {
            logger.debug(this.id + "._updateRendering");
            // set the initial bar type and width of the progress bar
            if (this.width !== 0) {
                dojoStyle.set(this.domNode, "width", this.width + "px");
            }
            if (this.barType === "striped") {
                dojoClass.add(this.domNode, "progress-striped");
            } else if (this.barType === "animated") {
                dojoClass.add(this.domNode, "progress-striped active");
            }
            dojoStyle.set(this.barNode, "width", "0%");

            this._setProgress(this._contextObj);

            // The callback, coming from update, needs to be executed, to let the page know it finished rendering
            mendix.lang.nullExec(callback);
        },

        _setProgress: function(object) {
            if (object){
                // Update the progress bar and set the bootstrap type and value
                this.value = Math.round(object.get(this.progressAtt)); // Empty value is handled as 0
                // Correct value if need be to a sensible value
                var defaultValue = 100;
                if (this.value > defaultValue)
                    this.value = defaultValue;
                if (this.value < 0)
                    this.value = 0;

                dojoStyle.set(this.barNode, "width", this.value + "%");
                this._setBootstrapStyle(object);

                if (this.value < this.textColorSwitch) { // Switch contrast colour
                    dojoClass.add(this.progressTextNode, "progressbar-text-contract");
                } else {
                    dojoClass.remove(this.progressTextNode, "progressbar-text-contract");
                }

                if (this.description !== "") // Add description or set % value
                    dojoHtml.set(this.progressTextNode, this.value + this.description);
                else
                    dojoHtml.set(this.progressTextNode, this.value + "%");
            }
        },
        _setBootstrapStyle : function(object) {
            if (this.bootstrapStyleAtt) {// Styling based on bootstrap style
                if (this.previousClass) { // Remove old class
                    dojoClass.remove(this.barNode, this.previousClass);
                    this.previousClass = "";
                }
                if (object.get(this.bootstrapStyleAtt)) { // Set new class
                    var newClass = "progress-bar-" + object.get(this.bootstrapStyleAtt);
                    dojoClass.add(this.barNode, newClass);
                    this.previousClass = newClass;
                }
            }
        },

        _unsubscribe: function() {
            dojoArray.forEach(this._handles, mx.data.unsubscribe);
            this._handles = [];
        },

        // Reset subscriptions.
        _resetSubscriptions: function() {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this._unsubscribe();

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                this._handles.push(
                    mx.data.subscribe({
                        guid: this._contextObj.getGuid(),
                        callback: dojoLang.hitch(this, function(guid) {
                            this._updateRendering();
                        })
                    }));

                this._handles.push(
                    mx.data.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.progressAtt,
                        callback: dojoLang.hitch(this, function(guid, attr, attrValue) {
                            this._updateRendering();
                        })
                    }));

                this._handles.push(
                    mx.data.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.bootstrapStyleAtt,
                        callback: dojoLang.hitch(this, function(guid, attr, attrValue) {
                            this._updateRendering();
                        })
                    }));
            }
        }
    });
});

require(["ProgressBar/widget/ProgressBar"]);

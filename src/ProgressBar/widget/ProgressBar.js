dojo.provide("ProgressBar.widget.ProgressBar");
mxui.dom.addCss(require.toUrl("ProgressBar/widget/ui/ProgressBar.css"));

require(["dojo/dom-style", "dojo/html", "dojo/dom-class", "dojo/dom-construct", "dojo/on", "ProgressBar/widget/js/progressbar"],
    
    // Name: Mendix 5 Bootstrap Progress Bar    
    // Version: 1.2
    // Date: 12 Sept 2015
    // Author: Edwin P. Magezi
    //    
    // Version: 1.1
    // Date: 01 Feb 2015
    // Author: Andries Smit
    // Organisation: Flock of Birds
    // Licence: 
    // 
    // Release notes 1.0: Upgraded version of the progress bar, making use of Mx5 
    // and dojo 1.8 functions, use Bootstrap styling. Render normal, striped or 
    // animated. Use an attribute to set bootstrap style success, warning, info, 
    // danger. Update Progress bar on refresh or change of attribute, Add 
    // optional on click Microflow.  
    
    // Release notes 1.1:  
    // Use of subscribe alias, so the subscription will be automatically destroyed when the widget is.
    
    /* Release notes 1.2
    *  Addition of the circular progress bar and its options. */
    
    function(domStyle, html, domClass, domConstruct, on, progressbar) {
        "use strict";
        mxui.widget.declare("ProgressBar.widget.ProgressBar", {
            mixins: [mxui.mixin._Contextable, dijit._TemplatedMixin],

            inputargs: {
                progressAtt: "",
                progressStyle: "",
                bootstrapStyleAtt: "",
                customColor: "",
                barType: "default",
                description: "",
                width: 0,
                textColorSwitch: 50,
                onclickMf: "",
                classBar: "",
                strokeWidth: 1.0,
                trailColour: "",
                trailWidth: 1.0,
                fillColour: null
            },

            templatePath: require.toUrl("ProgressBar/widget/ui/ProgressBar.html"),
            // template variables 
            // progressNode: null,
            // progressTextNode: null,
            // barNode: null,

            // Implementation
            progressNode: null,
            barNode: null,
            circleNode: null,
            progressTextNode: null,
            context: null,
            value: 0,
            previousClass: "",
            strokeColour: "",

            postCreate: function() {
                // Things that needs be done before start of widget
                this.buildProgressBar();
                this.actLoaded();
            },

            buildProgressBar: function() {
                // set the initial bar type and width of the progress bar
                if (this.width !== 0) {
                    domStyle.set(this.domNode, "width", this.width + "px");
                }
                if (this.barType === "striped") {
                    domClass.add(this.domNode, "progress-striped");
                } else if (this.barType === "animated") {
                    domClass.add(this.domNode, "progress-striped active");
                }
                domStyle.set(this.barNode, "width", "0%");
            },

            applyContext: function(context, callback) {
                // Copy context and subscribe to changes
                this.context = context;
                if (this.onclickMf) {
                    on(this.domNode, "click", dojo.hitch(this, this.onclick));
                    domClass.add(this.domNode, "progress-link");
                }
                if (context.trackObject) {
                    this.setProgress(context.trackObject);
                    this.subscribe({ // Subscribe to change of the object (refresh)
                        guid: context.trackId,
                        callback: dojo.hitch(this, function(guid) {
                            mx.data.get({
                                guid: guid,
                                callback: dojo.hitch(this, this.setProgress)
                            });
                        })
                    });
                    this.subscribe({ // Subscribe to GUI changes of the progress attribute
                        guid: context.trackId,
                        attr: this.progressAtt,
                        callback: dojo.hitch(this, function(guid) {
                            mx.data.get({
                                guid: guid,
                                callback: dojo.hitch(this, this.setProgress)
                            });
                        })
                    });
                    this.subscribe({ // Subscribe to GUI changes of the style attribute
                        guid: context.trackId,
                        attr: this.bootstrapStyleAtt,
                        callback: dojo.hitch(this, function(guid) {
                            mx.data.get({
                                guid: guid,
                                callback: dojo.hitch(this, this.setProgress)
                            });
                        })
                    });
                }
                if (typeof(callback) === "function")
                    callback();
            },

            onclick: function() {
                // Handle click on the progress bar
                if (this.onclickMf) {
                    var guids = this.context.trackId ? [this.context.trackId] : [];
                    mx.data.action({
                        params: {
                            applyto: "selection",
                            actionname: this.onclickMf,
                            guids: guids
                        },
                        callback: function() {},
                        error: dojo.hitch(this, function(error) {
                            mx.ui.error("Error while executing MicroFlow: " + this.onclickMf + " : " + error.message);
                        })
                    });
                }
            },

            setProgress: function(obj) {
                // Update the progress bar and set the bootstrap type and value
                this.value = Math.round(obj.get(this.progressAtt)); // Empty value is handled as 0
                // Correct value if need be to a sensible value
                if (this.value > 100)
                    this.value = 100;
                if (this.value < 0)
                    this.value = 0;

                if(this.progressStyle === "line") {
                    this.renderLine(obj);
                }
                
                if (this.progressStyle === "circle") {
                    this.renderCircle(obj);
                }
            },
            
            renderLine: function(obj) {
                domStyle.set(this.barNode, "width", this.value + "%");
                
                if (this.bootstrapStyleAtt) {// Styling based on bootstrap style
                    if (this.previousClass) { // Remove old class
                        domClass.remove(this.barNode, this.previousClass);
                        this.previousClass = "";
                    }
                    if (obj.get(this.bootstrapStyleAtt)) { // Set new class
                        var newClass = "progress-bar-" + obj.get(this.bootstrapStyleAtt);
                        domClass.add(this.barNode, newClass);
                        this.previousClass = newClass;
                    }
                }

                if (this.value < this.textColorSwitch) { // Switch contrast colour
                    domClass.add(this.progressTextNode, "progressbar-text-contract");
                } else {
                    domClass.remove(this.progressTextNode, "progressbar-text-contract");
                }

                if (this.description !== "") // Add description or set % value                
                    html.set(this.progressTextNode, this.value + this.description);
                else
                    html.set(this.progressTextNode, this.value + "%");
            },
            
            renderCircle: function(obj) {

                if(this.customColor == "") {
                    if (this.bootstrapStyleAtt) {
                        this.strokeColour = this.getBootstrapColor(obj.get(this.bootstrapStyleAtt));
                    } else {
                        this.strokeColour = this.getBootstrapColor("info");
                    }
                    
                } else {
                    this.strokeColour = this.customColor;
                }


                if(this.circleNode != null) {
                    domStyle.set(this.circleNode, "width", this.width + "px");
                    

                    if(this.progressNode != null && this.barNode != null) {
                        // Remove classes and child elements so only the Circle dom node remains
                        domClass.remove(this.progressNode, "progress");
                        domClass.remove(this.barNode, "progress-bar");
                        domConstruct.empty(this.barNode);
                    }

                    // Empty circleNode
                    domConstruct.empty(this.circleNode);

                    if(progressbar != null) {

                        var bar = new progressbar.Circle(this.circleNode, {
                            color: this.strokeColour,
                            trailColor: this.trailColour,
                            trailWidth: this.trailWidth,
                            strokeWidth: this.strokeWidth,
                            fill: this.fillColour
                        });
                        
                        if (this.description !== "") // Add description or set % value                
                            bar.setText(this.value + this.description);
                        else
                            bar.setText(this.value + "%");
 
                        bar.animate(this.value/100);

                        /*setInterval(function() {
                            var second = new Date().getSeconds();
                            bar.animate(second / 60, function() {
                                bar.setText(second);
                            });
                        }, 1000);*/
                    } else {
                        console.log("Progressbar attribute is undefined");
                        // TODO: Set to actual valid dojo code
                        this.barNode.innerHTML("Progressbar attribute is undefined");
                    }
                    //  });

                } else {
                    console.log("Can't find circle node...");
                }
            },
            
            getBootstrapColor: function(style) {

                var bootstrapClass = "";
                
                if(style !== "") {
                    bootstrapClass = "progress-bar-" + style;
                } else {
                    bootstrapClass = "progress-bar-info";
                }
                 

                domClass.add(this.barNode, bootstrapClass);
                var bootstrapColor = domStyle.get(this.barNode, "background-color");
                domClass.remove(this.barNode, bootstrapClass);

                return bootstrapColor;
        },
            
            uninitialize: function() {
                //Nothing to uninitialize
            }
        });
    }
 );
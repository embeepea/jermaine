(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Attr
 * 
 * Creates an encapsulated, chainable attribute that are validated by 
 * user-specified validation functions and can be attached to an arbitrary
 * JavaScript object. They can also call user-specified listeners upon being
 * accessed or changed.
 *
 * Jermaine models hold and manipulate Attr (and AttrList) objects until they
 * are attached to an object.
 */

/*!
 *
 * Notes and ToDos:
 * + what about isNotGreaterThan()?, isNotLessThan()?  Or, better still: a
 *   general 'not' operator, as in jasmine?
 *
 * + Attr should be decoupled from AttrList, see the clone() method
 *
 * + See issue 24 on github
 */
"use strict";
 
var Attr = function (name) {
    var AttrList = require('./attr_list.js'),
        Validator = require('./validator.js');

    var validators = [],
        that = this,
        errorMessage = "invalid setter call for " + name,
        defaultValueOrFunction,
        i,
        prop,
        addValidator,
        immutable = false,
        validator,
        listeners = {};

    // check for errors with constructor parameters
    if (name === undefined || typeof(name) !== 'string') {
        throw new Error("Attr: constructor requires a name parameter " +
                        "which must be a string");
    }

    // set up the validator that combines all validators
    validator = function (thingBeingValidated) {
        for (i = 0; i < validators.length; ++i) {
            validators[i](thingBeingValidated);
        }
        return true;
    };


    ////////////////////////////////////////////////////////////////////////
    /////////////////////////// MODIFIERS //////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    /**
     * Validate this attribute with the given validator. This also allows
     * this.message to be overridden to specify the error message on
     * validation failure.
     *
     * Examples:
     *
     *     age.validatesWith(function (age) {
     *         this.message = "age must be between 18 and 99, " + age +
     *                        " fails.";
     *         return age >= 18 && age <= 99;
     *     });
     *
     *     name.validatesWith(function (name) {
     *         this.message = "name must be a string and contain at least" +
     *                        " 3 letters, " + name + " fails.";
     *         return typeof(name) === "string && name.length >= 3;
     *     });
     *
     *
     * @param {Function} returns true if the argument passes validation 
     */
    this.validatesWith = function (v) {
        if (typeof(v) === 'function') {
            validators.push(new Validator(v));
            return this;
        } else {
            throw new Error("Attr: validator must be a function");
        }
    };

    /**
     * Assign a default value to all attributes of this type. The default
     * value may be an explicit value or object, or it may be a function
     * that returns a default value.
     *
     * Examples:
     *
     * @param {value} the explicit default value, or a function that
     *                returns the default value
     */
    this.defaultsTo = function (value) {
        defaultValueOrFunction = value;
        return this;
    };

    /**
     * Make this attribute read-only. If a setter is called on this
     * attribute, it will throw an error
     *
     * Examples:
     */
    this.isReadOnly = function () {
        immutable = true;
        return this;
    };

    /**
     * Make this attribute writable. Note that this is the default for all 
     * attributes, but this may be called if an attribute has been set to
     * read only and then needs to be changed back
     *
     * Examples:
     */
    this.isWritable = function () {
        immutable = false;
        return this;
    };

    /**
     * Sets up a listener for 'sets' or 'gets' to this attribute. It throws
     * an error if the event is not "set" or "get", and if a setter is
     * already set up for the event, it overrides it.
     *
     * Examples:
     *
     * @param {event} String that can only be "set" or "get"
     * @param {listener} Function that is called when the event occurs
     */
    this.on = function (event, listener) {
        if (event !== "set" && event !== "get") {
            throw new Error("Attr: first argument to the 'on' method " +
                            "should be 'set' or 'get'");
        } else if (typeof(listener) !== "function") {
            throw new Error("Attr: second argument to the 'on' method " +
                            "should be a function");
        } else {
            listeners[event] = listener;
        }
    };

    ////////////////////////////////////////////////////////////////////////
    /////////////////////////// END MODIFIERS //////////////////////////////
    ////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////////////////////////////////////////
    /////////////////////// GETTERS ////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    /**
     * Returns the name of this attribute
     */
    this.name = function () {
        return name;
    };

    /**
     * Returns a function that combines all of the validators into
     * a single function that returns true or false.
     */
    this.validator = function () {
        return validator;
    };

    ////////////////////////////////////////////////////////////////////////
    /////////////////////// END GETTERS ////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////////////////////////////////////////
    /////////////////////// SYNTACTIC SUGAR ////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    /**
     * An alias for this object, for readability when calling multiple
     * modifiers
     *
     * Examples:
     */
    this.and = this;

    /**
     * An alias for this object, for readability.
     *
     * Examples:
     */
    this.which = this;

    /**
     * An alias for isReadOnly
     */
    this.isImmutable = this.isReadOnly;

    /**
     * An alias for isWritable
     */
    this.isMutable = this.isWritable;

    ////////////////////////////////////////////////////////////////////////
    /////////////////////// END SYNTACTIC SUGAR ////////////////////////////
    ////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////////////////////////////////////////
    /////////////////////// UTILITIES //////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    /**
     * Returns an attribute with the same modifiers, defaultValue, and
     * validators. This is used in Jermaine's approach to inheritance.
     *
     * Examples:
     */
    this.clone = function () {
        var result,
            i;

        // set the result to the default attribute or attribute list
        // TODO: figure out how to make this work without explicitly
        //       knowing about AttrList so it can be decoupled from this
        //       code
        result = this instanceof AttrList?new AttrList(name):new Attr(name);

        // add this attributes validators to the new attribute
        for (i = 0; i < validators.length; ++i) {
            result.validatesWith(validators[i]);
        }

        // set up the same default for the new attribute
        result.defaultsTo(defaultValueOrFunction);

        // if the this attr is immutable, the cloned attr should also be
        // immutable
        if (immutable) {
            result.isImmutable();
        }

        return result;
    };

    /**
     * This attaches the attribute to a concrete object. It adds the
     * getter/setter function to the object, and captures the actual
     * value of the attribute in a closure.
     *
     * The resulting getter/setter calls all validators on the parameter
     * and calls the appropriate listener on this attribute. It also
     * returns the object itself so that attribute setters can be chained.
     *
     * Examples:
     *
     * @param {obj} the object to which this attribute will be attached
     */
    this.addTo = function (obj) {
        var attribute,
            listener,
            defaultValue;

        if (!obj || typeof(obj) !== 'object') {
            throw new Error("Attr: addAttr method requires an object " +
                            "parameter");
        }

        // This is the attribute getter/setter method that gets addded to
        // the object
        obj[name] = function (newValue) {
            var preValue;

            if (newValue !== undefined) {
                // setter
                if (immutable && attribute !== undefined) {
                    throw new Error("cannot set the immutable property " +
                                    name + " after it has been set");
                } else if (!validator(newValue)) {
                    throw new Error(errorMessage);
                } else {
                    // get the oldValue
                    preValue = attribute;

                    // first set the value
                    attribute = newValue;

                    // call the set listener
                    if (listeners.set !== undefined) {
                        listeners.set.call(obj, newValue, preValue);
                    }
                }
                return obj;
            } else {
                // call the get listener
                if (listeners.get !== undefined) {
                    listeners.get.call(obj, attribute);
                }
                return attribute;
            }
        };


        // assign the default value, depends on whether it is a function
        // or an explicit value
        defaultValue = typeof(defaultValueOrFunction) === 'function'?
            defaultValueOrFunction():
            defaultValueOrFunction;

        // call the setter with the defaultValue upon attaching it to the
        // object
        if (defaultValue !== undefined && validator(defaultValue)) {
            obj[name](defaultValue);
        } else if (defaultValue !== undefined && !validator(defaultValue)) {
            throw new Error("Attr: Default value of " + defaultValue +
                            " does not pass validation for " + name);
        }
    };

    ////////////////////////////////////////////////////////////////////////
    /////////////////////// END UTILITIES //////////////////////////////////
    ////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////////////////////////////////////////
    /////////////////////// VALIDATOR RELATED //////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    // add a single validator object to the attribute
    addValidator = function (name) {
        that[name] = function (param) {
            validators.push(Validator.getValidator(name)(param));
            return that;
        };
    };

    // the Validator object contains several default validators
    // that need to be attached to all Attrs
    for (i = 0; i < Validator.validators().length; ++i) {
        addValidator(Validator.validators()[i]);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////////////////// END VALIDATOR RELATED //////////////////////////
    ////////////////////////////////////////////////////////////////////////
};

module.exports = Attr;

},{"./attr_list.js":2,"./validator.js":5}],2:[function(require,module,exports){
"use strict";

var Attr = require('./attr.js');

var AttrList = function(name) {
    var that = this,
        listeners = {};


    //this is where the inheritance happens now
    Attr.call(this, name);

    var delegate = function (obj, func) {
        return function () { return obj[func].apply(obj, arguments); };
    };

    //syntactic sugar to keep things grammatically correct
    this.validateWith = this.validatesWith;

    //disable defaultsTo and isImmutable until we figure out how to make it make sense
    this.defaultsTo = function () {
        //no op
    };

    this.isImmutable = function () {
        //no op
    };

    this.isMutable = function () {
        //no op
    };

    this.eachOfWhich = this;

    this.on = function (event, listener) {
        if (event !== "add") {
            throw new Error("AttrList: 'on' only responds to 'add' event");
        }

        if (typeof(listener) !== "function") {
            throw new Error("AttrList: 'on' requires a listener function as the second parameter");
        }

        listeners[event] = listener;
    };


    this.addTo = function (obj) {
        var prop,
            arr = [],
            actualList = {};
        if(!obj || typeof(obj) !== 'object') {
            throw new Error("AttrList: addTo method requires an object parameter");                
        } else {
            actualList.pop = delegate(arr, "pop");
            
            actualList.add = function (item) {
                if ((that.validator())(item)) {
                    arr.push(item);
                    if (listeners.add !== undefined) {
                        //listeners.add.call();
                        listeners.add.call(obj, item, actualList.size());
                    }
                    return this;         
                } else {
                    throw new Error(that.errorMessage());
                }
            };

            actualList.replace = function (index, obj) {
                if ((typeof(index) !== 'number') || (parseInt(index, 10) !== index)) {
                    throw new Error("AttrList: replace method requires index parameter to be an integer");
                }

                if (index < 0 || index >= this.size()) {
                    throw new Error("AttrList: replace method index parameter out of bounds");
                }

                if (!(that.validator())(obj)) {
                    throw new Error(that.errorMessage());
                }

                arr[index] = obj;
                return this;
            };

            actualList.at = function (index) {
                if (index < 0 || index >= this.size()) {
                    throw new Error("AttrList: Index out of bounds");
                }
                return arr[index];
            };

            //to keep things more java-y
            actualList.get = actualList.at;

            actualList.size = function () {
                return arr.length;
            };

            actualList.toJSON = function (JSONreps) {
                var result = [], 
                    i, j;

                //check to make sure the current list is not in JSONreps
                if (JSONreps !== undefined) {
                    for (i = 0;i < JSONreps.length; ++i) {
                        if (JSONreps[i].object === this) {
                            result = JSONreps[i].JSONrep;
                        }
                    }
                }
                
                for (i = 0; i < arr.length; ++i) {
                    if (arr[i].toJSON) {
                        result.push(arr[i].toJSON(JSONreps));
                    } else {
                        result.push(arr[i]);
                    }
                }
                return result;
            };

            obj[name] = function () {
                return actualList;
            };
        }
    };
};

// //this needs to stay if we're going to use instanceof
// //but note we override all of the methods via delegation
// //so it's not doing anything except for making an AttrList
// //an instance of Attr
//AttrList.prototype = new Attr(name);
AttrList.prototype = new Attr("???");

module.exports = AttrList;

},{"./attr.js":1}],3:[function(require,module,exports){
"use strict";

var Method = function (name, method) {
    if (!name || typeof(name) !== "string") { 
        throw new Error("Method: constructor requires a name parameter which must be a string");
    } else if (!method || typeof(method) !== "function") {
        throw new Error("Method: second parameter must be a function");
    }
    
    this.addTo = function (obj) {
        if (!obj || typeof(obj) !== 'object') {
            throw new Error("Method: addTo method requires an object parameter");
        }
        
        obj[name] = method;
    };
};

module.exports = Method;

},{}],4:[function(require,module,exports){
"use strict";

require('../util/index_of.js');

var models = {};

/**
 * this function return a model associated with a name
 */
var getModel = function (name) {
    if (typeof(name) !== "string") {
        throw new Error("Jermaine: argument to getModel must be a string");
    }

    if (models[name] === undefined) {
        throw new Error("No model by the name of " + name + " found");
    } else {
        return models[name];
    }
};

/**
 * this function returns an array of all model names stored by
 * jermaine
 */
var getModels = function (name) {
    var model,
        result = [];
    
    for (model in models) {
        result.push(model);
    }
    return result;
};

/**
 * This is the model constructor
 */

var Model = function (specification) {
    var methods = {},
        attributes = {},
        pattern,
        modelName,
        modified = true,
        requiredConstructorArgs = [],
        optionalConstructorArgs = [],
        parents = [],
        Method = require('./method.js'),
        Attr = require('./attr.js'),
        AttrList = require('./attr_list.js'),
        EventEmitter = require('../util/event_emitter.js'),
        property,
        listProperties,
        updateConstructor,
        isImmutable,
        initializer = function () {},
        constructor = function () {},
        model = function () {
            if (modified) {
                //validate the model if it has been modified
                model.validate();
                updateConstructor();
            }
            return constructor.apply(this, arguments);
        };

    if (arguments.length === 1) {
        if (typeof(specification) === "string") {
            modelName = specification;
            specification = undefined;
        }
    }

    if (arguments.length > 1) {
        modelName = specification;
        specification = arguments[arguments.length-1];
    }

    //handle specification function
    if (specification && typeof(specification) === "function") {
        model = new Model(modelName);
        specification.call(model);
        return model;
    } else if (specification) {
        throw new Error("Model: specification parameter must be a function");
    }

    //handle model name
    if (modelName !== undefined && typeof(modelName) === "string") {
        models[modelName] = model;
    } else if (modelName !== undefined) {
        throw new Error("Model: model name must be a string");
    }

    
    /********** BEGIN PRIVATE METHODS ****************/
    /* private method that abstracts hasA/hasMany */
    var hasAProperty = function (type, name) {
        var Property,
            methodName,
            attribute;

        //Property is one of Attr or AttrList
        Property = type==="Attr"?Attr:AttrList;

        //methodName is either hasA or hasMany
        methodName = type==="Attr"?"hasA":"hasMany";

        modified = true;
        
        if (typeof(name) === 'string') {
            attribute = new Property(name);
            attributes[name] = attribute;
            return attribute;
        } else {
            throw new Error("Model: " + methodName + " parameter must be a string");
        }
    };

    /* private method that abstracts attribute/method */
    property = function (type, name) {
        var result;

        if (typeof(name) !== "string") {
            throw new Error("Model: expected string argument to " + type + " method, but recieved " + name);
        }

        result = type==="attribute" ? attributes[name] : methods[name];

        if (result === undefined) {
            throw new Error("Model: " + type + " " + name  + " does not exist!");
        }

        return result;
    };

    /* private method that abstracts attributes/methods */
    listProperties = function (type) {
        var i,
            list = [],
            properties = type==="attributes"?attributes:methods;

        for (i in properties) {
            if (properties.hasOwnProperty(i)) {
                list.push(i);
            }
        }

        return list;
    };

    /* private function that updates the constructor */
    updateConstructor = function () {
        constructor = function () {
            var i, j,
                err,
                attribute,
                attributeList = model.attributes(), 
                methodList = model.methods(), 
                emitter = new EventEmitter(),
                attr,
                attrChangeListeners = {},
                changeHandler,
                addProperties,
                that = this;

            if (!(this instanceof model)) {
                if (arguments.length > 0) {
                    //bad form, but hopefully temporary
                    /*jshint newcap:false */
                    return new model(arguments);
                } else {
                    //bad form, but hopefully temporary
                    /*jshint newcap:false */
                    return new model();
                }
                //throw new Error("Model: instances must be created using the new operator");
            }


            ////////////////////////////////////////////////////////////////
            ////////////// PUBLIC API FOR ALL INSTANCES ////////////////////
            ////////////////////////////////////////////////////////////////

            // this is a method associated with unit test
            // it("should not increment the listeners associated with the last object created"
            // it has been removed now that the bug has been fixed
            /*this.attrChangeListeners = function () {
             return attrChangeListeners;
             };*/

            /**
             * Returns the EventEmitter associated with this instance.
             *
             */
            this.emitter = function () {
                return emitter;
            };

            /**
             * Wrapper methods added to the internal EventEmitter object
             * 
             */

            this.emitter().removeJermaineChangeListener = function (attrName, obj) {
                if (typeof(attrName) !== "string") {
                    throw new Error("attrName must be a string");
                } else if (typeof(obj) !== "object" || obj.toJSON === undefined ||
                           obj.emitter === undefined) {
                    throw new Error("obj must be a jermaine object");
                } else {
                    obj.emitter().removeListener("change", attrChangeListeners[attrName]);
                }
            };

            this.emitter().addJermaineChangeListener = function (attrName, obj) {
                if (typeof(attrName) !== "string") {
                    throw new Error("attrName must be a string");
                } else if (typeof(obj) !== "object" || obj.toJSON === undefined ||
                           obj.emitter === undefined) {
                    throw new Error("obj must be a jermaine object");
                } else {
                    if (attrChangeListeners[attrName] === undefined) {
                        attrChangeListeners[attrName] = function (data) {
                            var newData = [],
                                emit = true;
                            
                            for (i = 0; i < data.length && emit === true; ++i) {
                                newData.push(data[i]);
                                if (data[i].origin === that) {
                                    emit = false;
                                }
                            }
                            
                            if (emit) {
                                newData.push({key:attrName, origin:that});
                                that.emit("change", newData);
                            }
                        };
                        
                    }
                    obj.emitter().on("change", attrChangeListeners[attrName]);
                }
            };


            /**
             * Registers a listener for this instance's changes.
             *
             */
            this.on = this.emitter().on;

            /**
             * Emits an event
             */
            this.emit = this.emitter().emit;

            /**
             * Returns a JSON representation of this instance.
             *
             */
            this.toJSON = function (JSONreps) {
                var attributeValue,
                    i, j,
                    thisJSONrep = {},
                    attributeJSONrep;

                if (JSONreps === undefined) {
                    // first call
                    JSONreps = [];
                    JSONreps.push({object:this, JSONrep:thisJSONrep});
                } else if (typeof(JSONreps) !== "object") {
                    // error condition 
                    throw new Error("Instance: toJSON should not take a parameter (unless called recursively)");
                } else {
                    // find the current JSON representation of this object, if it exists
                    for (i = 0; i < JSONreps.length; ++i) {
                        if (JSONreps[i].object === this) {
                            thisJSONrep = JSONreps[i].JSONrep;
                        }
                    }
                }

                for (i = 0; i < attributeList.length; ++i) {
                    attributeJSONrep = null;
                    // get the attribute
                    attributeValue = this[attributeList[i]]();
                    
                    // find the current JSON representation for the attribute, if it exists
                    for (j = 0; j < JSONreps.length; ++j) {
                        if (JSONreps[j].object === attributeValue) {
                            attributeJSONrep = JSONreps[j].JSONrep;
                        }
                    }

                    if (attributeValue !== undefined && attributeValue !== null && attributeValue.toJSON !== undefined && attributeJSONrep === null) {
                        // create a new entry for the attribute
                        attributeJSONrep = (attributes[attributeList[i]] instanceof AttrList)?[]:{};
                        JSONreps.push({object:attributeValue, JSONrep:attributeJSONrep});
                        JSONreps[JSONreps.length-1].JSONrep = attributeValue.toJSON(JSONreps);
                    }

                    // fill out the JSON representation for this object
                    if(attributeJSONrep === null) {
                        thisJSONrep[attributeList[i]] = attributeValue;
                    } else {
                        thisJSONrep[attributeList[i]] = attributeJSONrep;
                    }
                }
                return thisJSONrep;
            };

            /**
             * Returns a String representation of this instance
             *
             */
            this.toString = (pattern !== undefined)?pattern:function () {
                return "Jermaine Model Instance";
            };


            ////////////////////////////////////////////////////////////////
            ////////////// END PUBLIC API FOR ALL INSTANCES ////////////////
            ////////////////////////////////////////////////////////////////


            /**
             * This is a private method that sets up handling for the setter
             * It attaches a change listener on new objects
             * and it removes the change listener from old objects
             */
            changeHandler = function (attr) {
                if (!(attr instanceof AttrList)) {
                    //when set handler is called, this should be the current object
                    attr.on("set", function (newValue, preValue) {
                        // if preValue is a model instance, we need to remove the listener from it
                        if (preValue !== undefined && preValue !== null && preValue.on !== undefined &&
                            preValue.toJSON !== undefined && preValue.emitter !== undefined) {
                            // we now assume preValue is a model instance
                            
                            // sanity check 1
                            if (preValue.emitter().listeners("change").length < 1) {
                                throw new Error("preValue should always have a listener defined if it is a model");
                            }
                            
                            this.emitter().removeJermaineChangeListener(attr.name(), preValue);
                        }
                        
                        // if newValue is a model instance, we need to attach a listener to it
                        if (newValue !== undefined && newValue !== null && newValue.on !== undefined &&
                            newValue.toJSON !== undefined && newValue.emitter !== undefined) {
                            // we now assume newValue is a model instance
                            
                            // attach a listener
                            this.emitter().addJermaineChangeListener(attr.name(), newValue);
                        }

                        // finally emit that a change has happened
                        this.emit("change", [{key:attr.name(), value:newValue, origin:this}]);
                    });
                } else {
                    attr.on("add", function (newValue, newSize) {
                        this.emit("change", [{action:"add", key:attr.name(), value:newValue, origin:this}]);
                    });
                }
            };

            //set up event handling for sub objects
            for (i = 0; i < attributeList.length;  ++i) {
                attr = model.attribute(attributeList[i]);

                // temporarily not adding handlers to attr lists
                // until we get the bugs sorted out
                // see model test "should not add change listeners to attr list"
                //if (!(attr instanceof AttrList)) {
                changeHandler.call(this, attr);
                //}
            }


            // add all of the attributes and the methods to the object
            for (i = 0; i < attributeList.length + methodList.length; ++i)  {
                if (i < attributeList.length) {
                    //if the object is immutable, all attributes should be immutable
                    if (isImmutable) {
                        model.attribute(attributeList[i]).isImmutable();
                    }
                    model.attribute(attributeList[i]).addTo(this);
                } else {
                    model.method(methodList[i-attributeList.length]).addTo(this);
                }
            }

            // build the object using the constructor arguments
            if(arguments.length > 0) {
                if (arguments.length < requiredConstructorArgs.length) {
                    //construct and throw error
                    err = "Constructor requires ";
                    for(i = 0; i < requiredConstructorArgs.length; ++i) {
                        err += requiredConstructorArgs[i];
                        err += i===requiredConstructorArgs.length-1?"":", ";
                    }
                    err += " to be specified";
                    throw new Error(err);
                } if (arguments.length > requiredConstructorArgs.length + optionalConstructorArgs.length) {
                    throw new Error("Too many arguments to constructor. Expected " + requiredConstructorArgs.length + " required arguments and " +
                                    optionalConstructorArgs.length + " optional arguments");
                }
                else {
                    for (i = 0; i < arguments.length; ++i) {
                        attribute = i < requiredConstructorArgs.length?
                            requiredConstructorArgs[i]:
                            optionalConstructorArgs[i-requiredConstructorArgs.length];

                        if (model.attribute(attribute) instanceof AttrList) {
                            //make sure that arguments[i] is an array
                            if (Object.prototype.toString.call(arguments[i]) !== "[object Array]") {
                                throw new Error("Model: Constructor requires 'names' attribute to be set with an Array");
                            } else {
                                //iterate over the array adding the elements
                                for (j = 0; j < arguments[i].length; ++j) {
                                    this[attribute]().add(arguments[i][j]);
                                }
                            }
                        } else {
                            //go ahead and set it like normal
                            this[attribute](arguments[i]);
                        }
                    }
                }
            }

            // finally, call the initializer
            initializer.call(this);
        };
    };
    /*********** END PRIVATE METHODS **************/


    /*********** BEGIN PUBLIC API *****************/
    model.hasA = function (attr) {
        return hasAProperty("Attr", attr);
    };
    
    model.hasAn = model.hasA;
    model.hasSome = model.hasA;
    
    model.hasMany = function (attrs) {
        return hasAProperty("AttrList", attrs);
    };

    model.isA = function (parent) {
        var i,
            parentAttributes,
            parentMethods,
            isAModel;

        modified = true;

        //checks to make sure a potentialModel has all attributes of a model
        isAModel = function (potentialModel) {
            var i,
                M = new Model();
            for (i in M) {
                if (M.hasOwnProperty(i) && typeof(potentialModel[i]) !== typeof(M[i])) {
                    return false;
                }
            }
            return true;
        };

        //confirm parent is a model via duck-typing
        if (typeof (parent) !== "function" || !isAModel(parent)) {
            throw new Error("Model: parameter sent to isA function must be a Model");
        }

        //only allow single inheritance for now
        if (parents.length === 0) {
            parents.push(parent);
        } else {
            throw new Error("Model: Model only supports single inheritance at this time");
        }

        //add attributes and methods to current model
        parentAttributes = parents[0].attributes();
        for (i = 0; i < parentAttributes.length; ++i) {
            if (attributes[parentAttributes[i]] === undefined) {
                attributes[parentAttributes[i]] = parents[0].attribute(parentAttributes[i]).clone();
                //subclass attributes are mutable by default
                attributes[parentAttributes[i]].isMutable();
            }
        }

        parentMethods = parents[0].methods();
        for (i = 0; i < parentMethods.length; ++i) {
            if (methods[parentMethods[i]] === undefined) {
                methods[parentMethods[i]] = parents[0].method(parentMethods[i]);
            }
        }            

        for (i = 0; i < parents.length; i++) {
            model.prototype = new parents[i]();
        }
    };

    model.isAn = model.isA;

    model.parent = function () {
        return parents[0].apply(this, arguments);
    };

    model.attribute = function (attr) {
        return property("attribute", attr);
    };

    model.attributes = function () {
        return listProperties("attributes");
    };

    model.method = function (m) {
        return property("method", m);
    };
    
    model.methods = function () {
        return listProperties("methods");
    };

    model.isBuiltWith = function () {
        var optionalParamFlag = false,
            i;

        modified = true;
        requiredConstructorArgs = [];
        optionalConstructorArgs = [];

        for (i = 0; i < arguments.length; ++i) {
            if (typeof(arguments[i]) === "string" && arguments[i].charAt(0) !== '%') {
                //in required parms
                if (optionalParamFlag) {
                    //throw error
                    throw new Error("Model: isBuiltWith requires parameters preceded with a % to be the final parameters before the optional function");
                } else {
                    //insert into required array
                    requiredConstructorArgs.push(arguments[i]);
                }
            } else if(typeof(arguments[i]) === "string" && arguments[i].charAt(0) === '%') {
                //in optional parms
                optionalParamFlag = true;
                //insert into optional array
                optionalConstructorArgs.push(arguments[i].slice(1));
            } else if(typeof(arguments[i]) === "function" && i === arguments.length - 1) {
                //init function
                initializer = arguments[i];
            } else {
                throw new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter");
            }
        }
    };
    
    model.isImmutable = function () {
        isImmutable = true;
    };

    model.looksLike = function (p) {
        modified = true;
        pattern = p;
    };

    model.respondsTo = function (methodName, methodBody) {
        var m = new Method(methodName, methodBody);
        modified = true;
        methods[methodName] = m;
    };
    
    model.validate = function () {
        var i,
            attributes = this.attributes(),
            methods = this.methods();

        //check to make sure that isBuiltWith has actual attributes
        for (i = 0; i < requiredConstructorArgs.length; ++i) {
            try {
                this.attribute(requiredConstructorArgs[i]);
            } catch (e) {
                throw new Error(requiredConstructorArgs[i] + ", specified in the isBuiltWith method, is not an attribute");
            }
        }

        for (i = 0; i < optionalConstructorArgs.length; ++i) {
            try {
                this.attribute(optionalConstructorArgs[i]);
            } catch (e) {
                throw new Error(optionalConstructorArgs[i] + ", specified in the isBuiltWith method, is not an attribute");
            }
        }

        //check for method/attribute collisions
        for (i = 0; i < attributes.length; i++) {
            if (methods.indexOf(attributes[i]) > -1) {
                throw new Error("Model: invalid model specification to " + attributes[i] + " being both an attribute and method");
            }
        }

        //check to make sure that all attributes are requiredConstructorArgs if the object is immutable
        if (isImmutable) {
            for (i = 0; i < attributes.length; i++) {
                if (requiredConstructorArgs.indexOf(attributes[i]) < 0) {
                    throw new Error("immutable objects must have all attributes required in a call to isBuiltWith");
                }
            }
        }

        //set modifiedSinceLastValidation to false
        modified = false;
    };
    /************** END PUBLIC API ****************/
    
    //here we are returning our model object
    //which is a function with a bunch of methods that
    //manipulate how the function behaves
    return model;
};

//ns.getModel = getModel;
//ns.getModels = getModels;

Model.getModel = getModel;
Model.getModels = getModels;

module.exports = Model;



},{"../util/event_emitter.js":8,"../util/index_of.js":9,"./attr.js":1,"./attr_list.js":2,"./method.js":3}],5:[function(require,module,exports){
/**
 * Validator
 * 
 * Creates a named function that can be attached to attribute for validation.
 * The Validator function allows for customization of the thrown error message.
 *
 * This source file also handles all default validators that come packaged with
 * Jermaine. This includes isA, isOneOf, isGreaterThan, isLessThan, etc.
 *
 * Simple example:
 *
 * isGreaterThan = new Validator(function (number) {
 *     //this.message points to the error message
 *     //that will be thrown
 *     this.message = "Validation Error: " + 
 *                    this.param + " should be greater than " + number;
 *
 *     //this.param points to the actual parameter sent to the validator
 *     //return true if the validation passes, false otherwise
 *     return this.param > number;
 * });
 *
 * Later, a validator can be attached to the attribute object.
 *
 * Attr.isGreaterThan = isGreaterThan;
 *
 * and can be used when creating attributes:
 *
 * var age = new Attr("age").which.isGreaterThan(0);
 *
 */

"use strict";

require('../util/index_of.js');

var Model = require('./model.js');

var validators = {};  //the set of static validators

/**
 * Validator 'Constructor'
 *
 * This simply returns a validation function that handles the custom error
 * message and can be attached to an attribute. So it's not really
 * technically a constructor. This is only important to know so that you
 * don't try something like this:
 *
 * var v = new Validator( ... );
 * 
 * //this will always fail, bc v is not an object
 * if (v instanceof Validator) { ... }
 * 
 * The spec function is just a specification for the validator. It allows
 * for a couple of things to be attached to "this" that will be used
 * in the return function. This includes "this.message" and "this.param".
 * The message is the error string that is thrown on failure and
 * this.param is the actual parameter that gets sent in to be validated.
 */
var Validator = function (spec) {
    // this is the actual function that is returned
    var validatorFunction = function (arg) {
        var result, 
            resultObject = {},
            errorMessage;

        // spec is called on the argument with 'this' pointing
        // to an empty object (resultObject),
        // note the validator will return either true or false
        result = spec.call(resultObject, arg);

        // if it's false, the parameter has failed validation
        if (!result) {
            // throw the error
            errorMessage = resultObject.message ||
                "validator failed with parameter " + arg;
            throw new Error(errorMessage);
        }
        return result;
    };

    // see? all that's being returned is a function
    // also note that since 'this' is never used,
    // we can call this constructor with or without 'new'
    return validatorFunction;
};

/**
 * This static function adds a named validator to the list of
 * validators. The second argument is a validation function
 * that simply returns a Validator function created as above.
 *
 * The nice thing about adding a Validator this way is that
 * you can actually validate the parameter sent to the validator!
 * Why might that be important? Well, consider the following:
 *
 * var isGreaterThanInteger = new Validator(function (val) {
 *     this.message = this.param + " should be greater than " + val;
 *     return this.param > val;
 * });
 *
 * Now we can call isGreaterThanNumber like this:
 *
 * isGreaterThanNumber(5)(6); // will pass validation
 * isGreaterThanNumber(5)(3); // will throw
 * isGreaterThanNumber("dog")(3); // ???
 *
 * So we need to confirm that the user sends in an integer as a parameter.
 * You might want to try something like this:
 *
 * var isGreaterThanInteger = new Validator(function (val) {
 *     if (typeof(val) !== "number") throw Error("Not cool!");
 *     this.message = this.param + " should be greater than " + val;
 *     return this.param > val;
 * });
 *
 * This will actually work on the example above:
 *
 * isGreaterThanNumber("dog")(3); // throws error now
 *
 * The problem is that with Jermaine, we create the validator
 * and then don't actually call it until an attribute is about to be
 * set. So, in other words:
 *
 * var a = new Attr("thing").which.isGreaterThanNumber("dog"); //no error (yet)
 *
 * will not cause an error until it's attached to an object and thing
 * is attempted to be set.
 *
 * So a temporary workaround is to validate the validator in the
 * addValidator function below. That's handled by the argValidator
 * validator. (Phew, this is getting really meta)
 *
 * I'm not sure this is the best solution. Seems like there should be
 * a way to validate the argument in the constructor function, but
 * that might require some rewiring that breaks multigraph. This is
 * the best I could come up with for now.
 *
 * @name The name of the validator for the attribute, must be a string
 *       or an error will be thrown
 *
 * @v The validator specification (returns a boolean)
 *    must be a function or an error will be thrown
 *
 * @argValidator optional function that checks the types of args sent
 *           to the validator, must be a function or an error will be thrown
 *
 * So an error will be thrown in the cases that "name" is not a string,
 * v is not a function, argValidator is not a function, or if the static
 * validator is already defined.
 */
Validator.addValidator = function (name, v, argValidator) {
    if (name === undefined || typeof(name) !== "string") {
        throw new Error("addValidator requires a name to be specified as the first parameter");
    }

    if (v === undefined || typeof(v) !== "function") {
        throw new Error("addValidator requires a function as the second parameter");
    }

    // optional third argument to validate the 
    // expected value that gets sent to the validator
    // for example, isA("number") works but isA("nmber")
    // doesn't work
    if (argValidator !== undefined && typeof(argValidator) !== "function") {
        throw new Error("addValidator third optional argument must be a "+
                        "function");
    }

    if (validators[name] === undefined) {
        validators[name] = function (expected) {
            if (argValidator !== undefined) {
                if (!argValidator(expected)) {
                    throw new Error ("Validator: Invalid argument for " +
                                     name + " validator");
                }
            }
            return new Validator(function (val) {
                var resultObject = {"actual":val, "param":val},
                    result = v.call(resultObject, expected);
                this.message = resultObject.message;
                return result;
            });
        };
    } else {
        throw new Error("Validator '" + name +"' already defined");
    }
};


/**
 * Get the built-in validator by its name.
 *
 * @name a string representing the name of the validator to return
 * 
 * throws an error if name is not a string
 */
Validator.getValidator = function (name) {
    var result;

    if (name === undefined) {
        throw new Error("Validator: getValidator method requires a string parameter");
    } else if (typeof (name) !== "string") {
        throw new Error("Validator: parameter to getValidator method must be a string");
    }

    result = validators[name];

    if (result === undefined) {
        throw new Error("Validator: '" + name + "' does not exist");
    }

    return result;
};



/**
 * return an array of of static validator names
 */
Validator.validators = function () {
    var prop,
        result = [];
    for (prop in validators) {
        if (validators.hasOwnProperty(prop)) {
            result.push(prop);
        }
    }

    return result;
};

/**
 * Built-In validators. Hopefully these are self-explanatory
 * Will document them more later.
 */
Validator.addValidator("isGreaterThan", function (val) {
    this.message = this.param + " should be greater than " + val;
    return this.param > val;
});

Validator.addValidator("isLessThan", function (val) {
    this.message = this.param + " should be less than " + val;
    return this.param < val;
});


// TODO: add array validation for val
Validator.addValidator("isOneOf", function (val) {
    this.message = this.param + " should be one of the set: " + val;
    return val.indexOf(this.param) > -1;
});

/**
 * This one is the only one that uses an argument validator. It confirms
 * that the argument is a primitive javascript type or a named Jermaine
 * model.
 */
Validator.addValidator("isA", function (val) {
    var types = ["string", "number", "boolean", "function", "object"],
        models = Model.getModels();
    if (typeof(val) === "string" && types.indexOf(val) > -1) {
        this.message = this.param + " should be a " + val;
        return typeof(this.param) === val;
    } else if (typeof(val) === "string" && models.indexOf(val) > -1) {
        this.message = "parameter should be an instance of " + val;
        return this.param instanceof Model.getModel(val);
    } else if (val === 'integer') {
        // special case for 'integer'; since javascript has no integer type,
        // just check for number type and check that it's numerically an int
        if (this.param.toString !== undefined)  {
            this.message = this.param.toString() + " should be an integer";
        } else {
            this.message = "parameter should be an integer";
        }
        return (typeof(this.param) === 'number') && (parseInt(this.param,10) === this.param);
    } /*else if (typeof(val) === "string") {
       throw new Error("Validator: isA accepts a string which is one of " + types);
       } else {
       throw new Error("Validator: isA only accepts a string for a primitive types for the time being");
       }*/
},
                       //argument validator
                       function (val) {
                           var typesAndModels = ["string", "number", "boolean", "function",
                                                 "object", "integer"].concat(Model.getModels());
                           return typesAndModels.indexOf(val) >= 0;
                       });


// grammatical alias for isA
validators.isAn = validators.isA;

module.exports = Validator;

},{"../util/index_of.js":9,"./model.js":4}],6:[function(require,module,exports){
require('./util/index_of.js');

var Model = require('./core/model.js');

module.exports = {
    'Attr'      : require('./core/attr.js'),
    'AttrList'  : require('./core/attr_list.js'),
    'Model'     : Model,
    'getModel'  : Model.getModel,
    'getModels' : Model.getModels,
    'Validator' : require('./core/validator.js'),
    'Method'    : require('./core/method.js'),
    'util'      : {
        'EventEmitter' : require('./util/event_emitter.js'),
        'namespace'    : require('./util/namespace.js')
    }
};

},{"./core/attr.js":1,"./core/attr_list.js":2,"./core/method.js":3,"./core/model.js":4,"./core/validator.js":5,"./util/event_emitter.js":8,"./util/index_of.js":9,"./util/namespace.js":10}],7:[function(require,module,exports){
window.jermaine = require('./jermaine.js');

},{"./jermaine.js":6}],8:[function(require,module,exports){
"use strict";

require('./index_of.js');

var EventEmitter = function () {
    var that = this,
        listeners = {};

    //an registers event and a listener
    this.on = function (event, listener) {
        if (typeof(event) !== "string") {
            throw new Error("EventEmitter: first argument to 'on' should be a string");
        }
        if (typeof(listener) !== "function") {
            throw new Error("EventEmitter: second argument to 'on' should be a function");
        }
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(listener);
        return that;
    };

    //alias addListener
    this.addListener = this.on;
    
    this.once = function (event, listener) {
        var f = function () {
            listener(arguments);
            that.removeListener(event, f);
        };

        that.on(event, f);
        return that;
    };

    this.removeListener = function (event, listener) {
        var index;

        if (typeof(event) !== "string") {
            throw new Error("EventEmitter: first parameter to removeListener method must be a string representing an event");
        }
        if (typeof(listener) !== "function") {
            throw new Error("EventEmitter: second parameter must be a function to remove as an event listener");
        }
        if (listeners[event] === undefined || listeners[event].length === 0) {
            throw new Error("EventEmitter: there are no listeners registered for the '" + event + "' event");
        }

        index = listeners[event].indexOf(listener);

        if (index !== -1) {
            //remove it from the list
            listeners[event].splice(index,1);
        }

        return that;
    };

    this.removeAllListeners = function (event) {
        if (typeof(event) !== "string") {
            throw new Error("EventEmitter: parameter to removeAllListeners should be a string representing an event");
        }

        if (listeners[event] !== undefined) {
            listeners[event] = [];
        }
        
        return that;
    };
    
    this.setMaxListeners = function (number) {
        return that;
    };

    //get the listeners for an event
    this.listeners = function (event) {
        if (typeof(event) !== 'string') {
            throw new Error("EventEmitter: listeners method must be called with the name of an event");
        } else if (listeners[event] === undefined) {
            return [];
        }
        return listeners[event];
    };

    //execute each of the listeners in order with the specified arguments
    this.emit = function (event, data) {
        var i,
            params;


        if (arguments.length > 1) {
            params = [];
        }

        for (i = 1; i < arguments.length; ++i) {
            params.push(arguments[i]);
        }

        if (listeners[event] !== undefined) {
            for (i = 0; i < listeners[event].length; i=i+1) {
                listeners[event][i].apply(this, params);
            }
        }
    };

    return that;
}; //end EventEmitter

module.exports = EventEmitter;

},{"./index_of.js":9}],9:[function(require,module,exports){
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n !== n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}

module.exports = undefined;

},{}],10:[function(require,module,exports){
module.exports = function namespace (ns, aliases, func) {
    var nsRegExp = /^([a-zA-Z]+)(\.[a-zA-Z]*)*$/,
        nsArray,
        currentNS,
        i;

    //check to assure ns is a properly formatted namespace string
    if (ns.match(nsRegExp) === null || ns === "window") {
        throw new Error("namespace: " + ns + " is a malformed namespace string");
    }

    //check to assure that if alias is defined that func is defined
    if (aliases !== undefined && func === undefined) {
        if (typeof (aliases) === "function") {
            func = aliases;
            aliases = undefined;
        } else if (typeof (aliases) === "object") {
            throw new Error("namespace: if second argument exists, final function argument must exist");
        } else if (typeof (aliases) !== "object") {
            throw new Error("namespace: second argument must be an object of aliased local namespaces");
        }
    } else if (typeof (aliases) !== "object" && typeof (func) === "function") {
        throw new Error("namespace: second argument must be an object of aliased local namespaces");
    }

    //parse namespace string
    nsArray = ns.split(".");

    //set the root namespace to window (if it's not explictly stated)
    if (nsArray[0] === "window") {
        currentNS = window;
    } else {
        currentNS = (window[nsArray[0]] === undefined) ? window[nsArray[0]] = {} : window[nsArray[0]];
    }

    //confirm func is actually a function
    if (func !== undefined && typeof (func) !== "function") {
        throw new Error("namespace: last parameter must be a function that accepts a namespace parameter");
    }

    //build namespace
    for (i = 1; i < nsArray.length; i = i + 1) {
        if (currentNS[nsArray[i]] === undefined) {
            currentNS[nsArray[i]] = {};
        }
        currentNS = currentNS[nsArray[i]];
    }

    //namespaces.push(currentNS);
    //namespace = currentNS;

    //if the function was defined, but no aliases run it on the current namespace
    if (aliases === undefined && func) {
        func(currentNS);
    } else if (func) {
        for (i in aliases) {
            if (aliases.hasOwnProperty(i)) {
                aliases[i] = namespace(aliases[i]);
            }
        }
        func.call(aliases, currentNS);
    }

    //return namespace
    return currentNS;
};

},{}]},{},[7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9jb3JlL2F0dHIuanMiLCJzcmMvY29yZS9hdHRyX2xpc3QuanMiLCJzcmMvY29yZS9tZXRob2QuanMiLCJzcmMvY29yZS9tb2RlbC5qcyIsInNyYy9jb3JlL3ZhbGlkYXRvci5qcyIsInNyYy9qZXJtYWluZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3V0aWwvZXZlbnRfZW1pdHRlci5qcyIsInNyYy91dGlsL2luZGV4X29mLmpzIiwic3JjL3V0aWwvbmFtZXNwYWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDem5CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBBdHRyXG4gKiBcbiAqIENyZWF0ZXMgYW4gZW5jYXBzdWxhdGVkLCBjaGFpbmFibGUgYXR0cmlidXRlIHRoYXQgYXJlIHZhbGlkYXRlZCBieSBcbiAqIHVzZXItc3BlY2lmaWVkIHZhbGlkYXRpb24gZnVuY3Rpb25zIGFuZCBjYW4gYmUgYXR0YWNoZWQgdG8gYW4gYXJiaXRyYXJ5XG4gKiBKYXZhU2NyaXB0IG9iamVjdC4gVGhleSBjYW4gYWxzbyBjYWxsIHVzZXItc3BlY2lmaWVkIGxpc3RlbmVycyB1cG9uIGJlaW5nXG4gKiBhY2Nlc3NlZCBvciBjaGFuZ2VkLlxuICpcbiAqIEplcm1haW5lIG1vZGVscyBob2xkIGFuZCBtYW5pcHVsYXRlIEF0dHIgKGFuZCBBdHRyTGlzdCkgb2JqZWN0cyB1bnRpbCB0aGV5XG4gKiBhcmUgYXR0YWNoZWQgdG8gYW4gb2JqZWN0LlxuICovXG5cbi8qIVxuICpcbiAqIE5vdGVzIGFuZCBUb0RvczpcbiAqICsgd2hhdCBhYm91dCBpc05vdEdyZWF0ZXJUaGFuKCk/LCBpc05vdExlc3NUaGFuKCk/ICBPciwgYmV0dGVyIHN0aWxsOiBhXG4gKiAgIGdlbmVyYWwgJ25vdCcgb3BlcmF0b3IsIGFzIGluIGphc21pbmU/XG4gKlxuICogKyBBdHRyIHNob3VsZCBiZSBkZWNvdXBsZWQgZnJvbSBBdHRyTGlzdCwgc2VlIHRoZSBjbG9uZSgpIG1ldGhvZFxuICpcbiAqICsgU2VlIGlzc3VlIDI0IG9uIGdpdGh1YlxuICovXG5cInVzZSBzdHJpY3RcIjtcbiBcbnZhciBBdHRyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgQXR0ckxpc3QgPSByZXF1aXJlKCcuL2F0dHJfbGlzdC5qcycpLFxuICAgICAgICBWYWxpZGF0b3IgPSByZXF1aXJlKCcuL3ZhbGlkYXRvci5qcycpO1xuXG4gICAgdmFyIHZhbGlkYXRvcnMgPSBbXSxcbiAgICAgICAgdGhhdCA9IHRoaXMsXG4gICAgICAgIGVycm9yTWVzc2FnZSA9IFwiaW52YWxpZCBzZXR0ZXIgY2FsbCBmb3IgXCIgKyBuYW1lLFxuICAgICAgICBkZWZhdWx0VmFsdWVPckZ1bmN0aW9uLFxuICAgICAgICBpLFxuICAgICAgICBwcm9wLFxuICAgICAgICBhZGRWYWxpZGF0b3IsXG4gICAgICAgIGltbXV0YWJsZSA9IGZhbHNlLFxuICAgICAgICB2YWxpZGF0b3IsXG4gICAgICAgIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgLy8gY2hlY2sgZm9yIGVycm9ycyB3aXRoIGNvbnN0cnVjdG9yIHBhcmFtZXRlcnNcbiAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZihuYW1lKSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0cjogY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lIHBhcmFtZXRlciBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndoaWNoIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgfVxuXG4gICAgLy8gc2V0IHVwIHRoZSB2YWxpZGF0b3IgdGhhdCBjb21iaW5lcyBhbGwgdmFsaWRhdG9yc1xuICAgIHZhbGlkYXRvciA9IGZ1bmN0aW9uICh0aGluZ0JlaW5nVmFsaWRhdGVkKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB2YWxpZGF0b3JzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YWxpZGF0b3JzW2ldKHRoaW5nQmVpbmdWYWxpZGF0ZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBNT0RJRklFUlMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgdGhpcyBhdHRyaWJ1dGUgd2l0aCB0aGUgZ2l2ZW4gdmFsaWRhdG9yLiBUaGlzIGFsc28gYWxsb3dzXG4gICAgICogdGhpcy5tZXNzYWdlIHRvIGJlIG92ZXJyaWRkZW4gdG8gc3BlY2lmeSB0aGUgZXJyb3IgbWVzc2FnZSBvblxuICAgICAqIHZhbGlkYXRpb24gZmFpbHVyZS5cbiAgICAgKlxuICAgICAqIEV4YW1wbGVzOlxuICAgICAqXG4gICAgICogICAgIGFnZS52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChhZ2UpIHtcbiAgICAgKiAgICAgICAgIHRoaXMubWVzc2FnZSA9IFwiYWdlIG11c3QgYmUgYmV0d2VlbiAxOCBhbmQgOTksIFwiICsgYWdlICtcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgIFwiIGZhaWxzLlwiO1xuICAgICAqICAgICAgICAgcmV0dXJuIGFnZSA+PSAxOCAmJiBhZ2UgPD0gOTk7XG4gICAgICogICAgIH0pO1xuICAgICAqXG4gICAgICogICAgIG5hbWUudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAobmFtZSkge1xuICAgICAqICAgICAgICAgdGhpcy5tZXNzYWdlID0gXCJuYW1lIG11c3QgYmUgYSBzdHJpbmcgYW5kIGNvbnRhaW4gYXQgbGVhc3RcIiArXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICBcIiAzIGxldHRlcnMsIFwiICsgbmFtZSArIFwiIGZhaWxzLlwiO1xuICAgICAqICAgICAgICAgcmV0dXJuIHR5cGVvZihuYW1lKSA9PT0gXCJzdHJpbmcgJiYgbmFtZS5sZW5ndGggPj0gMztcbiAgICAgKiAgICAgfSk7XG4gICAgICpcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHJldHVybnMgdHJ1ZSBpZiB0aGUgYXJndW1lbnQgcGFzc2VzIHZhbGlkYXRpb24gXG4gICAgICovXG4gICAgdGhpcy52YWxpZGF0ZXNXaXRoID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgaWYgKHR5cGVvZih2KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFsaWRhdG9ycy5wdXNoKG5ldyBWYWxpZGF0b3IodikpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyOiB2YWxpZGF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFzc2lnbiBhIGRlZmF1bHQgdmFsdWUgdG8gYWxsIGF0dHJpYnV0ZXMgb2YgdGhpcyB0eXBlLiBUaGUgZGVmYXVsdFxuICAgICAqIHZhbHVlIG1heSBiZSBhbiBleHBsaWNpdCB2YWx1ZSBvciBvYmplY3QsIG9yIGl0IG1heSBiZSBhIGZ1bmN0aW9uXG4gICAgICogdGhhdCByZXR1cm5zIGEgZGVmYXVsdCB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEV4YW1wbGVzOlxuICAgICAqXG4gICAgICogQHBhcmFtIHt2YWx1ZX0gdGhlIGV4cGxpY2l0IGRlZmF1bHQgdmFsdWUsIG9yIGEgZnVuY3Rpb24gdGhhdFxuICAgICAqICAgICAgICAgICAgICAgIHJldHVybnMgdGhlIGRlZmF1bHQgdmFsdWVcbiAgICAgKi9cbiAgICB0aGlzLmRlZmF1bHRzVG8gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgZGVmYXVsdFZhbHVlT3JGdW5jdGlvbiA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTWFrZSB0aGlzIGF0dHJpYnV0ZSByZWFkLW9ubHkuIElmIGEgc2V0dGVyIGlzIGNhbGxlZCBvbiB0aGlzXG4gICAgICogYXR0cmlidXRlLCBpdCB3aWxsIHRocm93IGFuIGVycm9yXG4gICAgICpcbiAgICAgKiBFeGFtcGxlczpcbiAgICAgKi9cbiAgICB0aGlzLmlzUmVhZE9ubHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGltbXV0YWJsZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRoaXMgYXR0cmlidXRlIHdyaXRhYmxlLiBOb3RlIHRoYXQgdGhpcyBpcyB0aGUgZGVmYXVsdCBmb3IgYWxsIFxuICAgICAqIGF0dHJpYnV0ZXMsIGJ1dCB0aGlzIG1heSBiZSBjYWxsZWQgaWYgYW4gYXR0cmlidXRlIGhhcyBiZWVuIHNldCB0b1xuICAgICAqIHJlYWQgb25seSBhbmQgdGhlbiBuZWVkcyB0byBiZSBjaGFuZ2VkIGJhY2tcbiAgICAgKlxuICAgICAqIEV4YW1wbGVzOlxuICAgICAqL1xuICAgIHRoaXMuaXNXcml0YWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaW1tdXRhYmxlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIGEgbGlzdGVuZXIgZm9yICdzZXRzJyBvciAnZ2V0cycgdG8gdGhpcyBhdHRyaWJ1dGUuIEl0IHRocm93c1xuICAgICAqIGFuIGVycm9yIGlmIHRoZSBldmVudCBpcyBub3QgXCJzZXRcIiBvciBcImdldFwiLCBhbmQgaWYgYSBzZXR0ZXIgaXNcbiAgICAgKiBhbHJlYWR5IHNldCB1cCBmb3IgdGhlIGV2ZW50LCBpdCBvdmVycmlkZXMgaXQuXG4gICAgICpcbiAgICAgKiBFeGFtcGxlczpcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IFN0cmluZyB0aGF0IGNhbiBvbmx5IGJlIFwic2V0XCIgb3IgXCJnZXRcIlxuICAgICAqIEBwYXJhbSB7bGlzdGVuZXJ9IEZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IG9jY3Vyc1xuICAgICAqL1xuICAgIHRoaXMub24gPSBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIGlmIChldmVudCAhPT0gXCJzZXRcIiAmJiBldmVudCAhPT0gXCJnZXRcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0cjogZmlyc3QgYXJndW1lbnQgdG8gdGhlICdvbicgbWV0aG9kIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInNob3VsZCBiZSAnc2V0JyBvciAnZ2V0J1wiKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YobGlzdGVuZXIpICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dHI6IHNlY29uZCBhcmd1bWVudCB0byB0aGUgJ29uJyBtZXRob2QgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic2hvdWxkIGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnNbZXZlbnRdID0gbGlzdGVuZXI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIEVORCBNT0RJRklFUlMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gR0VUVEVSUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBuYW1lIG9mIHRoaXMgYXR0cmlidXRlXG4gICAgICovXG4gICAgdGhpcy5uYW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgY29tYmluZXMgYWxsIG9mIHRoZSB2YWxpZGF0b3JzIGludG9cbiAgICAgKiBhIHNpbmdsZSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdHJ1ZSBvciBmYWxzZS5cbiAgICAgKi9cbiAgICB0aGlzLnZhbGlkYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRvcjtcbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gRU5EIEdFVFRFUlMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gU1lOVEFDVElDIFNVR0FSIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAvKipcbiAgICAgKiBBbiBhbGlhcyBmb3IgdGhpcyBvYmplY3QsIGZvciByZWFkYWJpbGl0eSB3aGVuIGNhbGxpbmcgbXVsdGlwbGVcbiAgICAgKiBtb2RpZmllcnNcbiAgICAgKlxuICAgICAqIEV4YW1wbGVzOlxuICAgICAqL1xuICAgIHRoaXMuYW5kID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIEFuIGFsaWFzIGZvciB0aGlzIG9iamVjdCwgZm9yIHJlYWRhYmlsaXR5LlxuICAgICAqXG4gICAgICogRXhhbXBsZXM6XG4gICAgICovXG4gICAgdGhpcy53aGljaCA9IHRoaXM7XG5cbiAgICAvKipcbiAgICAgKiBBbiBhbGlhcyBmb3IgaXNSZWFkT25seVxuICAgICAqL1xuICAgIHRoaXMuaXNJbW11dGFibGUgPSB0aGlzLmlzUmVhZE9ubHk7XG5cbiAgICAvKipcbiAgICAgKiBBbiBhbGlhcyBmb3IgaXNXcml0YWJsZVxuICAgICAqL1xuICAgIHRoaXMuaXNNdXRhYmxlID0gdGhpcy5pc1dyaXRhYmxlO1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gRU5EIFNZTlRBQ1RJQyBTVUdBUiAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gVVRJTElUSUVTIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGF0dHJpYnV0ZSB3aXRoIHRoZSBzYW1lIG1vZGlmaWVycywgZGVmYXVsdFZhbHVlLCBhbmRcbiAgICAgKiB2YWxpZGF0b3JzLiBUaGlzIGlzIHVzZWQgaW4gSmVybWFpbmUncyBhcHByb2FjaCB0byBpbmhlcml0YW5jZS5cbiAgICAgKlxuICAgICAqIEV4YW1wbGVzOlxuICAgICAqL1xuICAgIHRoaXMuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXN1bHQsXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIC8vIHNldCB0aGUgcmVzdWx0IHRvIHRoZSBkZWZhdWx0IGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbGlzdFxuICAgICAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IGhvdyB0byBtYWtlIHRoaXMgd29yayB3aXRob3V0IGV4cGxpY2l0bHlcbiAgICAgICAgLy8gICAgICAga25vd2luZyBhYm91dCBBdHRyTGlzdCBzbyBpdCBjYW4gYmUgZGVjb3VwbGVkIGZyb20gdGhpc1xuICAgICAgICAvLyAgICAgICBjb2RlXG4gICAgICAgIHJlc3VsdCA9IHRoaXMgaW5zdGFuY2VvZiBBdHRyTGlzdD9uZXcgQXR0ckxpc3QobmFtZSk6bmV3IEF0dHIobmFtZSk7XG5cbiAgICAgICAgLy8gYWRkIHRoaXMgYXR0cmlidXRlcyB2YWxpZGF0b3JzIHRvIHRoZSBuZXcgYXR0cmlidXRlXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB2YWxpZGF0b3JzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICByZXN1bHQudmFsaWRhdGVzV2l0aCh2YWxpZGF0b3JzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCB1cCB0aGUgc2FtZSBkZWZhdWx0IGZvciB0aGUgbmV3IGF0dHJpYnV0ZVxuICAgICAgICByZXN1bHQuZGVmYXVsdHNUbyhkZWZhdWx0VmFsdWVPckZ1bmN0aW9uKTtcblxuICAgICAgICAvLyBpZiB0aGUgdGhpcyBhdHRyIGlzIGltbXV0YWJsZSwgdGhlIGNsb25lZCBhdHRyIHNob3VsZCBhbHNvIGJlXG4gICAgICAgIC8vIGltbXV0YWJsZVxuICAgICAgICBpZiAoaW1tdXRhYmxlKSB7XG4gICAgICAgICAgICByZXN1bHQuaXNJbW11dGFibGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgYXR0YWNoZXMgdGhlIGF0dHJpYnV0ZSB0byBhIGNvbmNyZXRlIG9iamVjdC4gSXQgYWRkcyB0aGVcbiAgICAgKiBnZXR0ZXIvc2V0dGVyIGZ1bmN0aW9uIHRvIHRoZSBvYmplY3QsIGFuZCBjYXB0dXJlcyB0aGUgYWN0dWFsXG4gICAgICogdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZSBpbiBhIGNsb3N1cmUuXG4gICAgICpcbiAgICAgKiBUaGUgcmVzdWx0aW5nIGdldHRlci9zZXR0ZXIgY2FsbHMgYWxsIHZhbGlkYXRvcnMgb24gdGhlIHBhcmFtZXRlclxuICAgICAqIGFuZCBjYWxscyB0aGUgYXBwcm9wcmlhdGUgbGlzdGVuZXIgb24gdGhpcyBhdHRyaWJ1dGUuIEl0IGFsc29cbiAgICAgKiByZXR1cm5zIHRoZSBvYmplY3QgaXRzZWxmIHNvIHRoYXQgYXR0cmlidXRlIHNldHRlcnMgY2FuIGJlIGNoYWluZWQuXG4gICAgICpcbiAgICAgKiBFeGFtcGxlczpcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqfSB0aGUgb2JqZWN0IHRvIHdoaWNoIHRoaXMgYXR0cmlidXRlIHdpbGwgYmUgYXR0YWNoZWRcbiAgICAgKi9cbiAgICB0aGlzLmFkZFRvID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgYXR0cmlidXRlLFxuICAgICAgICAgICAgbGlzdGVuZXIsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU7XG5cbiAgICAgICAgaWYgKCFvYmogfHwgdHlwZW9mKG9iaikgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyOiBhZGRBdHRyIG1ldGhvZCByZXF1aXJlcyBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGFyYW1ldGVyXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgYXR0cmlidXRlIGdldHRlci9zZXR0ZXIgbWV0aG9kIHRoYXQgZ2V0cyBhZGRkZWQgdG9cbiAgICAgICAgLy8gdGhlIG9iamVjdFxuICAgICAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBwcmVWYWx1ZTtcblxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoaW1tdXRhYmxlICYmIGF0dHJpYnV0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBzZXQgdGhlIGltbXV0YWJsZSBwcm9wZXJ0eSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lICsgXCIgYWZ0ZXIgaXQgaGFzIGJlZW4gc2V0XCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXZhbGlkYXRvcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBvbGRWYWx1ZVxuICAgICAgICAgICAgICAgICAgICBwcmVWYWx1ZSA9IGF0dHJpYnV0ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdCBzZXQgdGhlIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhbGwgdGhlIHNldCBsaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzLnNldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc2V0LmNhbGwob2JqLCBuZXdWYWx1ZSwgcHJlVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGNhbGwgdGhlIGdldCBsaXN0ZW5lclxuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMuZ2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLmdldC5jYWxsKG9iaiwgYXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuXG4gICAgICAgIC8vIGFzc2lnbiB0aGUgZGVmYXVsdCB2YWx1ZSwgZGVwZW5kcyBvbiB3aGV0aGVyIGl0IGlzIGEgZnVuY3Rpb25cbiAgICAgICAgLy8gb3IgYW4gZXhwbGljaXQgdmFsdWVcbiAgICAgICAgZGVmYXVsdFZhbHVlID0gdHlwZW9mKGRlZmF1bHRWYWx1ZU9yRnVuY3Rpb24pID09PSAnZnVuY3Rpb24nP1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlT3JGdW5jdGlvbigpOlxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlT3JGdW5jdGlvbjtcblxuICAgICAgICAvLyBjYWxsIHRoZSBzZXR0ZXIgd2l0aCB0aGUgZGVmYXVsdFZhbHVlIHVwb24gYXR0YWNoaW5nIGl0IHRvIHRoZVxuICAgICAgICAvLyBvYmplY3RcbiAgICAgICAgaWYgKGRlZmF1bHRWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbGlkYXRvcihkZWZhdWx0VmFsdWUpKSB7XG4gICAgICAgICAgICBvYmpbbmFtZV0oZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZWZhdWx0VmFsdWUgIT09IHVuZGVmaW5lZCAmJiAhdmFsaWRhdG9yKGRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dHI6IERlZmF1bHQgdmFsdWUgb2YgXCIgKyBkZWZhdWx0VmFsdWUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGRvZXMgbm90IHBhc3MgdmFsaWRhdGlvbiBmb3IgXCIgKyBuYW1lKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBFTkQgVVRJTElUSUVTIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBWQUxJREFUT1IgUkVMQVRFRCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIC8vIGFkZCBhIHNpbmdsZSB2YWxpZGF0b3Igb2JqZWN0IHRvIHRoZSBhdHRyaWJ1dGVcbiAgICBhZGRWYWxpZGF0b3IgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB0aGF0W25hbWVdID0gZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICAgICAgICB2YWxpZGF0b3JzLnB1c2goVmFsaWRhdG9yLmdldFZhbGlkYXRvcihuYW1lKShwYXJhbSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRoYXQ7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIHRoZSBWYWxpZGF0b3Igb2JqZWN0IGNvbnRhaW5zIHNldmVyYWwgZGVmYXVsdCB2YWxpZGF0b3JzXG4gICAgLy8gdGhhdCBuZWVkIHRvIGJlIGF0dGFjaGVkIHRvIGFsbCBBdHRyc1xuICAgIGZvciAoaSA9IDA7IGkgPCBWYWxpZGF0b3IudmFsaWRhdG9ycygpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGFkZFZhbGlkYXRvcihWYWxpZGF0b3IudmFsaWRhdG9ycygpW2ldKTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBFTkQgVkFMSURBVE9SIFJFTEFURUQgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0cjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgQXR0ciA9IHJlcXVpcmUoJy4vYXR0ci5qcycpO1xuXG52YXIgQXR0ckxpc3QgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzLFxuICAgICAgICBsaXN0ZW5lcnMgPSB7fTtcblxuXG4gICAgLy90aGlzIGlzIHdoZXJlIHRoZSBpbmhlcml0YW5jZSBoYXBwZW5zIG5vd1xuICAgIEF0dHIuY2FsbCh0aGlzLCBuYW1lKTtcblxuICAgIHZhciBkZWxlZ2F0ZSA9IGZ1bmN0aW9uIChvYmosIGZ1bmMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9ialtmdW5jXS5hcHBseShvYmosIGFyZ3VtZW50cyk7IH07XG4gICAgfTtcblxuICAgIC8vc3ludGFjdGljIHN1Z2FyIHRvIGtlZXAgdGhpbmdzIGdyYW1tYXRpY2FsbHkgY29ycmVjdFxuICAgIHRoaXMudmFsaWRhdGVXaXRoID0gdGhpcy52YWxpZGF0ZXNXaXRoO1xuXG4gICAgLy9kaXNhYmxlIGRlZmF1bHRzVG8gYW5kIGlzSW1tdXRhYmxlIHVudGlsIHdlIGZpZ3VyZSBvdXQgaG93IHRvIG1ha2UgaXQgbWFrZSBzZW5zZVxuICAgIHRoaXMuZGVmYXVsdHNUbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy9ubyBvcFxuICAgIH07XG5cbiAgICB0aGlzLmlzSW1tdXRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvL25vIG9wXG4gICAgfTtcblxuICAgIHRoaXMuaXNNdXRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvL25vIG9wXG4gICAgfTtcblxuICAgIHRoaXMuZWFjaE9mV2hpY2ggPSB0aGlzO1xuXG4gICAgdGhpcy5vbiA9IGZ1bmN0aW9uIChldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKGV2ZW50ICE9PSBcImFkZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyTGlzdDogJ29uJyBvbmx5IHJlc3BvbmRzIHRvICdhZGQnIGV2ZW50XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZihsaXN0ZW5lcikgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ckxpc3Q6ICdvbicgcmVxdWlyZXMgYSBsaXN0ZW5lciBmdW5jdGlvbiBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlclwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpc3RlbmVyc1tldmVudF0gPSBsaXN0ZW5lcjtcbiAgICB9O1xuXG5cbiAgICB0aGlzLmFkZFRvID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcHJvcCxcbiAgICAgICAgICAgIGFyciA9IFtdLFxuICAgICAgICAgICAgYWN0dWFsTGlzdCA9IHt9O1xuICAgICAgICBpZighb2JqIHx8IHR5cGVvZihvYmopICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ckxpc3Q6IGFkZFRvIG1ldGhvZCByZXF1aXJlcyBhbiBvYmplY3QgcGFyYW1ldGVyXCIpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFjdHVhbExpc3QucG9wID0gZGVsZWdhdGUoYXJyLCBcInBvcFwiKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYWN0dWFsTGlzdC5hZGQgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIGlmICgodGhhdC52YWxpZGF0b3IoKSkoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMuYWRkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbGlzdGVuZXJzLmFkZC5jYWxsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuYWRkLmNhbGwob2JqLCBpdGVtLCBhY3R1YWxMaXN0LnNpemUoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7ICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoYXQuZXJyb3JNZXNzYWdlKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGFjdHVhbExpc3QucmVwbGFjZSA9IGZ1bmN0aW9uIChpbmRleCwgb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKCh0eXBlb2YoaW5kZXgpICE9PSAnbnVtYmVyJykgfHwgKHBhcnNlSW50KGluZGV4LCAxMCkgIT09IGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyTGlzdDogcmVwbGFjZSBtZXRob2QgcmVxdWlyZXMgaW5kZXggcGFyYW1ldGVyIHRvIGJlIGFuIGludGVnZXJcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLnNpemUoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyTGlzdDogcmVwbGFjZSBtZXRob2QgaW5kZXggcGFyYW1ldGVyIG91dCBvZiBib3VuZHNcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCEodGhhdC52YWxpZGF0b3IoKSkob2JqKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhhdC5lcnJvck1lc3NhZ2UoKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXJyW2luZGV4XSA9IG9iajtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGFjdHVhbExpc3QuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuc2l6ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dHJMaXN0OiBJbmRleCBvdXQgb2YgYm91bmRzXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyW2luZGV4XTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vdG8ga2VlcCB0aGluZ3MgbW9yZSBqYXZhLXlcbiAgICAgICAgICAgIGFjdHVhbExpc3QuZ2V0ID0gYWN0dWFsTGlzdC5hdDtcblxuICAgICAgICAgICAgYWN0dWFsTGlzdC5zaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnIubGVuZ3RoO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYWN0dWFsTGlzdC50b0pTT04gPSBmdW5jdGlvbiAoSlNPTnJlcHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIFxuICAgICAgICAgICAgICAgICAgICBpLCBqO1xuXG4gICAgICAgICAgICAgICAgLy9jaGVjayB0byBtYWtlIHN1cmUgdGhlIGN1cnJlbnQgbGlzdCBpcyBub3QgaW4gSlNPTnJlcHNcbiAgICAgICAgICAgICAgICBpZiAoSlNPTnJlcHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwO2kgPCBKU09OcmVwcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEpTT05yZXBzW2ldLm9iamVjdCA9PT0gdGhpcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IEpTT05yZXBzW2ldLkpTT05yZXA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJyW2ldLnRvSlNPTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyW2ldLnRvSlNPTihKU09OcmVwcykpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY3R1YWxMaXN0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vLyAvL3RoaXMgbmVlZHMgdG8gc3RheSBpZiB3ZSdyZSBnb2luZyB0byB1c2UgaW5zdGFuY2VvZlxuLy8gLy9idXQgbm90ZSB3ZSBvdmVycmlkZSBhbGwgb2YgdGhlIG1ldGhvZHMgdmlhIGRlbGVnYXRpb25cbi8vIC8vc28gaXQncyBub3QgZG9pbmcgYW55dGhpbmcgZXhjZXB0IGZvciBtYWtpbmcgYW4gQXR0ckxpc3Rcbi8vIC8vYW4gaW5zdGFuY2Ugb2YgQXR0clxuLy9BdHRyTGlzdC5wcm90b3R5cGUgPSBuZXcgQXR0cihuYW1lKTtcbkF0dHJMaXN0LnByb3RvdHlwZSA9IG5ldyBBdHRyKFwiPz8/XCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF0dHJMaXN0O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBNZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgbWV0aG9kKSB7XG4gICAgaWYgKCFuYW1lIHx8IHR5cGVvZihuYW1lKSAhPT0gXCJzdHJpbmdcIikgeyBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kOiBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIG5hbWUgcGFyYW1ldGVyIHdoaWNoIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgfSBlbHNlIGlmICghbWV0aG9kIHx8IHR5cGVvZihtZXRob2QpICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kOiBzZWNvbmQgcGFyYW1ldGVyIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5hZGRUbyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgaWYgKCFvYmogfHwgdHlwZW9mKG9iaikgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Q6IGFkZFRvIG1ldGhvZCByZXF1aXJlcyBhbiBvYmplY3QgcGFyYW1ldGVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBvYmpbbmFtZV0gPSBtZXRob2Q7XG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWV0aG9kO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnJlcXVpcmUoJy4uL3V0aWwvaW5kZXhfb2YuanMnKTtcblxudmFyIG1vZGVscyA9IHt9O1xuXG4vKipcbiAqIHRoaXMgZnVuY3Rpb24gcmV0dXJuIGEgbW9kZWwgYXNzb2NpYXRlZCB3aXRoIGEgbmFtZVxuICovXG52YXIgZ2V0TW9kZWwgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIGlmICh0eXBlb2YobmFtZSkgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSmVybWFpbmU6IGFyZ3VtZW50IHRvIGdldE1vZGVsIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgfVxuXG4gICAgaWYgKG1vZGVsc1tuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG1vZGVsIGJ5IHRoZSBuYW1lIG9mIFwiICsgbmFtZSArIFwiIGZvdW5kXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBtb2RlbHNbbmFtZV07XG4gICAgfVxufTtcblxuLyoqXG4gKiB0aGlzIGZ1bmN0aW9uIHJldHVybnMgYW4gYXJyYXkgb2YgYWxsIG1vZGVsIG5hbWVzIHN0b3JlZCBieVxuICogamVybWFpbmVcbiAqL1xudmFyIGdldE1vZGVscyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdmFyIG1vZGVsLFxuICAgICAgICByZXN1bHQgPSBbXTtcbiAgICBcbiAgICBmb3IgKG1vZGVsIGluIG1vZGVscykge1xuICAgICAgICByZXN1bHQucHVzaChtb2RlbCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIG1vZGVsIGNvbnN0cnVjdG9yXG4gKi9cblxudmFyIE1vZGVsID0gZnVuY3Rpb24gKHNwZWNpZmljYXRpb24pIHtcbiAgICB2YXIgbWV0aG9kcyA9IHt9LFxuICAgICAgICBhdHRyaWJ1dGVzID0ge30sXG4gICAgICAgIHBhdHRlcm4sXG4gICAgICAgIG1vZGVsTmFtZSxcbiAgICAgICAgbW9kaWZpZWQgPSB0cnVlLFxuICAgICAgICByZXF1aXJlZENvbnN0cnVjdG9yQXJncyA9IFtdLFxuICAgICAgICBvcHRpb25hbENvbnN0cnVjdG9yQXJncyA9IFtdLFxuICAgICAgICBwYXJlbnRzID0gW10sXG4gICAgICAgIE1ldGhvZCA9IHJlcXVpcmUoJy4vbWV0aG9kLmpzJyksXG4gICAgICAgIEF0dHIgPSByZXF1aXJlKCcuL2F0dHIuanMnKSxcbiAgICAgICAgQXR0ckxpc3QgPSByZXF1aXJlKCcuL2F0dHJfbGlzdC5qcycpLFxuICAgICAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCcuLi91dGlsL2V2ZW50X2VtaXR0ZXIuanMnKSxcbiAgICAgICAgcHJvcGVydHksXG4gICAgICAgIGxpc3RQcm9wZXJ0aWVzLFxuICAgICAgICB1cGRhdGVDb25zdHJ1Y3RvcixcbiAgICAgICAgaXNJbW11dGFibGUsXG4gICAgICAgIGluaXRpYWxpemVyID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG1vZGVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKG1vZGlmaWVkKSB7XG4gICAgICAgICAgICAgICAgLy92YWxpZGF0ZSB0aGUgbW9kZWwgaWYgaXQgaGFzIGJlZW4gbW9kaWZpZWRcbiAgICAgICAgICAgICAgICBtb2RlbC52YWxpZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZUNvbnN0cnVjdG9yKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGlmICh0eXBlb2Yoc3BlY2lmaWNhdGlvbikgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIG1vZGVsTmFtZSA9IHNwZWNpZmljYXRpb247XG4gICAgICAgICAgICBzcGVjaWZpY2F0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIG1vZGVsTmFtZSA9IHNwZWNpZmljYXRpb247XG4gICAgICAgIHNwZWNpZmljYXRpb24gPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aC0xXTtcbiAgICB9XG5cbiAgICAvL2hhbmRsZSBzcGVjaWZpY2F0aW9uIGZ1bmN0aW9uXG4gICAgaWYgKHNwZWNpZmljYXRpb24gJiYgdHlwZW9mKHNwZWNpZmljYXRpb24pID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgbW9kZWwgPSBuZXcgTW9kZWwobW9kZWxOYW1lKTtcbiAgICAgICAgc3BlY2lmaWNhdGlvbi5jYWxsKG1vZGVsKTtcbiAgICAgICAgcmV0dXJuIG1vZGVsO1xuICAgIH0gZWxzZSBpZiAoc3BlY2lmaWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2RlbDogc3BlY2lmaWNhdGlvbiBwYXJhbWV0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgIH1cblxuICAgIC8vaGFuZGxlIG1vZGVsIG5hbWVcbiAgICBpZiAobW9kZWxOYW1lICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mKG1vZGVsTmFtZSkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgbW9kZWxzW21vZGVsTmFtZV0gPSBtb2RlbDtcbiAgICB9IGVsc2UgaWYgKG1vZGVsTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1vZGVsOiBtb2RlbCBuYW1lIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgfVxuXG4gICAgXG4gICAgLyoqKioqKioqKiogQkVHSU4gUFJJVkFURSBNRVRIT0RTICoqKioqKioqKioqKioqKiovXG4gICAgLyogcHJpdmF0ZSBtZXRob2QgdGhhdCBhYnN0cmFjdHMgaGFzQS9oYXNNYW55ICovXG4gICAgdmFyIGhhc0FQcm9wZXJ0eSA9IGZ1bmN0aW9uICh0eXBlLCBuYW1lKSB7XG4gICAgICAgIHZhciBQcm9wZXJ0eSxcbiAgICAgICAgICAgIG1ldGhvZE5hbWUsXG4gICAgICAgICAgICBhdHRyaWJ1dGU7XG5cbiAgICAgICAgLy9Qcm9wZXJ0eSBpcyBvbmUgb2YgQXR0ciBvciBBdHRyTGlzdFxuICAgICAgICBQcm9wZXJ0eSA9IHR5cGU9PT1cIkF0dHJcIj9BdHRyOkF0dHJMaXN0O1xuXG4gICAgICAgIC8vbWV0aG9kTmFtZSBpcyBlaXRoZXIgaGFzQSBvciBoYXNNYW55XG4gICAgICAgIG1ldGhvZE5hbWUgPSB0eXBlPT09XCJBdHRyXCI/XCJoYXNBXCI6XCJoYXNNYW55XCI7XG5cbiAgICAgICAgbW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZihuYW1lKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZSA9IG5ldyBQcm9wZXJ0eShuYW1lKTtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXNbbmFtZV0gPSBhdHRyaWJ1dGU7XG4gICAgICAgICAgICByZXR1cm4gYXR0cmlidXRlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IFwiICsgbWV0aG9kTmFtZSArIFwiIHBhcmFtZXRlciBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qIHByaXZhdGUgbWV0aG9kIHRoYXQgYWJzdHJhY3RzIGF0dHJpYnV0ZS9tZXRob2QgKi9cbiAgICBwcm9wZXJ0eSA9IGZ1bmN0aW9uICh0eXBlLCBuYW1lKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgICAgaWYgKHR5cGVvZihuYW1lKSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IGV4cGVjdGVkIHN0cmluZyBhcmd1bWVudCB0byBcIiArIHR5cGUgKyBcIiBtZXRob2QsIGJ1dCByZWNpZXZlZCBcIiArIG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0ID0gdHlwZT09PVwiYXR0cmlidXRlXCIgPyBhdHRyaWJ1dGVzW25hbWVdIDogbWV0aG9kc1tuYW1lXTtcblxuICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1vZGVsOiBcIiArIHR5cGUgKyBcIiBcIiArIG5hbWUgICsgXCIgZG9lcyBub3QgZXhpc3QhXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLyogcHJpdmF0ZSBtZXRob2QgdGhhdCBhYnN0cmFjdHMgYXR0cmlidXRlcy9tZXRob2RzICovXG4gICAgbGlzdFByb3BlcnRpZXMgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGxpc3QgPSBbXSxcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSB0eXBlPT09XCJhdHRyaWJ1dGVzXCI/YXR0cmlidXRlczptZXRob2RzO1xuXG4gICAgICAgIGZvciAoaSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBpZiAocHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGxpc3QucHVzaChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaXN0O1xuICAgIH07XG5cbiAgICAvKiBwcml2YXRlIGZ1bmN0aW9uIHRoYXQgdXBkYXRlcyB0aGUgY29uc3RydWN0b3IgKi9cbiAgICB1cGRhdGVDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3RydWN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaSwgaixcbiAgICAgICAgICAgICAgICBlcnIsXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlLFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUxpc3QgPSBtb2RlbC5hdHRyaWJ1dGVzKCksIFxuICAgICAgICAgICAgICAgIG1ldGhvZExpc3QgPSBtb2RlbC5tZXRob2RzKCksIFxuICAgICAgICAgICAgICAgIGVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKCksXG4gICAgICAgICAgICAgICAgYXR0cixcbiAgICAgICAgICAgICAgICBhdHRyQ2hhbmdlTGlzdGVuZXJzID0ge30sXG4gICAgICAgICAgICAgICAgY2hhbmdlSGFuZGxlcixcbiAgICAgICAgICAgICAgICBhZGRQcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgbW9kZWwpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vYmFkIGZvcm0sIGJ1dCBob3BlZnVsbHkgdGVtcG9yYXJ5XG4gICAgICAgICAgICAgICAgICAgIC8qanNoaW50IG5ld2NhcDpmYWxzZSAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IG1vZGVsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy9iYWQgZm9ybSwgYnV0IGhvcGVmdWxseSB0ZW1wb3JhcnlcbiAgICAgICAgICAgICAgICAgICAgLypqc2hpbnQgbmV3Y2FwOmZhbHNlICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgbW9kZWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoXCJNb2RlbDogaW5zdGFuY2VzIG11c3QgYmUgY3JlYXRlZCB1c2luZyB0aGUgbmV3IG9wZXJhdG9yXCIpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vIFBVQkxJQyBBUEkgRk9SIEFMTCBJTlNUQU5DRVMgLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAgICAgLy8gdGhpcyBpcyBhIG1ldGhvZCBhc3NvY2lhdGVkIHdpdGggdW5pdCB0ZXN0XG4gICAgICAgICAgICAvLyBpdChcInNob3VsZCBub3QgaW5jcmVtZW50IHRoZSBsaXN0ZW5lcnMgYXNzb2NpYXRlZCB3aXRoIHRoZSBsYXN0IG9iamVjdCBjcmVhdGVkXCJcbiAgICAgICAgICAgIC8vIGl0IGhhcyBiZWVuIHJlbW92ZWQgbm93IHRoYXQgdGhlIGJ1ZyBoYXMgYmVlbiBmaXhlZFxuICAgICAgICAgICAgLyp0aGlzLmF0dHJDaGFuZ2VMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgcmV0dXJuIGF0dHJDaGFuZ2VMaXN0ZW5lcnM7XG4gICAgICAgICAgICAgfTsqL1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgdGhlIEV2ZW50RW1pdHRlciBhc3NvY2lhdGVkIHdpdGggdGhpcyBpbnN0YW5jZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuZW1pdHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZW1pdHRlcjtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV3JhcHBlciBtZXRob2RzIGFkZGVkIHRvIHRoZSBpbnRlcm5hbCBFdmVudEVtaXR0ZXIgb2JqZWN0XG4gICAgICAgICAgICAgKiBcbiAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIoKS5yZW1vdmVKZXJtYWluZUNoYW5nZUxpc3RlbmVyID0gZnVuY3Rpb24gKGF0dHJOYW1lLCBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mKGF0dHJOYW1lKSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhdHRyTmFtZSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKG9iaikgIT09IFwib2JqZWN0XCIgfHwgb2JqLnRvSlNPTiA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvYmouZW1pdHRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm9iaiBtdXN0IGJlIGEgamVybWFpbmUgb2JqZWN0XCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5lbWl0dGVyKCkucmVtb3ZlTGlzdGVuZXIoXCJjaGFuZ2VcIiwgYXR0ckNoYW5nZUxpc3RlbmVyc1thdHRyTmFtZV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZW1pdHRlcigpLmFkZEplcm1haW5lQ2hhbmdlTGlzdGVuZXIgPSBmdW5jdGlvbiAoYXR0ck5hbWUsIG9iaikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YoYXR0ck5hbWUpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImF0dHJOYW1lIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Yob2JqKSAhPT0gXCJvYmplY3RcIiB8fCBvYmoudG9KU09OID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iai5lbWl0dGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqIG11c3QgYmUgYSBqZXJtYWluZSBvYmplY3RcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJDaGFuZ2VMaXN0ZW5lcnNbYXR0ck5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJDaGFuZ2VMaXN0ZW5lcnNbYXR0ck5hbWVdID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RGF0YSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWl0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZGF0YS5sZW5ndGggJiYgZW1pdCA9PT0gdHJ1ZTsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RhdGEucHVzaChkYXRhW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbaV0ub3JpZ2luID09PSB0aGF0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWl0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVtaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGF0YS5wdXNoKHtrZXk6YXR0ck5hbWUsIG9yaWdpbjp0aGF0fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZW1pdChcImNoYW5nZVwiLCBuZXdEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb2JqLmVtaXR0ZXIoKS5vbihcImNoYW5nZVwiLCBhdHRyQ2hhbmdlTGlzdGVuZXJzW2F0dHJOYW1lXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIGZvciB0aGlzIGluc3RhbmNlJ3MgY2hhbmdlcy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMub24gPSB0aGlzLmVtaXR0ZXIoKS5vbjtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFbWl0cyBhbiBldmVudFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmVtaXQgPSB0aGlzLmVtaXR0ZXIoKS5lbWl0O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgYSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgaW5zdGFuY2UuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnRvSlNPTiA9IGZ1bmN0aW9uIChKU09OcmVwcykge1xuICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgaSwgaixcbiAgICAgICAgICAgICAgICAgICAgdGhpc0pTT05yZXAgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSlNPTnJlcDtcblxuICAgICAgICAgICAgICAgIGlmIChKU09OcmVwcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZpcnN0IGNhbGxcbiAgICAgICAgICAgICAgICAgICAgSlNPTnJlcHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgSlNPTnJlcHMucHVzaCh7b2JqZWN0OnRoaXMsIEpTT05yZXA6dGhpc0pTT05yZXB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZihKU09OcmVwcykgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXJyb3IgY29uZGl0aW9uIFxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnN0YW5jZTogdG9KU09OIHNob3VsZCBub3QgdGFrZSBhIHBhcmFtZXRlciAodW5sZXNzIGNhbGxlZCByZWN1cnNpdmVseSlcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgY3VycmVudCBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgb2JqZWN0LCBpZiBpdCBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IEpTT05yZXBzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoSlNPTnJlcHNbaV0ub2JqZWN0ID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc0pTT05yZXAgPSBKU09OcmVwc1tpXS5KU09OcmVwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGF0dHJpYnV0ZUxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSlNPTnJlcCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlID0gdGhpc1thdHRyaWJ1dGVMaXN0W2ldXSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgY3VycmVudCBKU09OIHJlcHJlc2VudGF0aW9uIGZvciB0aGUgYXR0cmlidXRlLCBpZiBpdCBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IEpTT05yZXBzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoSlNPTnJlcHNbal0ub2JqZWN0ID09PSBhdHRyaWJ1dGVWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUpTT05yZXAgPSBKU09OcmVwc1tqXS5KU09OcmVwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZVZhbHVlICE9PSB1bmRlZmluZWQgJiYgYXR0cmlidXRlVmFsdWUgIT09IG51bGwgJiYgYXR0cmlidXRlVmFsdWUudG9KU09OICE9PSB1bmRlZmluZWQgJiYgYXR0cmlidXRlSlNPTnJlcCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgbmV3IGVudHJ5IGZvciB0aGUgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVKU09OcmVwID0gKGF0dHJpYnV0ZXNbYXR0cmlidXRlTGlzdFtpXV0gaW5zdGFuY2VvZiBBdHRyTGlzdCk/W106e307XG4gICAgICAgICAgICAgICAgICAgICAgICBKU09OcmVwcy5wdXNoKHtvYmplY3Q6YXR0cmlidXRlVmFsdWUsIEpTT05yZXA6YXR0cmlidXRlSlNPTnJlcH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgSlNPTnJlcHNbSlNPTnJlcHMubGVuZ3RoLTFdLkpTT05yZXAgPSBhdHRyaWJ1dGVWYWx1ZS50b0pTT04oSlNPTnJlcHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZmlsbCBvdXQgdGhlIEpTT04gcmVwcmVzZW50YXRpb24gZm9yIHRoaXMgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmKGF0dHJpYnV0ZUpTT05yZXAgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNKU09OcmVwW2F0dHJpYnV0ZUxpc3RbaV1dID0gYXR0cmlidXRlVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzSlNPTnJlcFthdHRyaWJ1dGVMaXN0W2ldXSA9IGF0dHJpYnV0ZUpTT05yZXA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNKU09OcmVwO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIGEgU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgaW5zdGFuY2VcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMudG9TdHJpbmcgPSAocGF0dGVybiAhPT0gdW5kZWZpbmVkKT9wYXR0ZXJuOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJKZXJtYWluZSBNb2RlbCBJbnN0YW5jZVwiO1xuICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLyBFTkQgUFVCTElDIEFQSSBGT1IgQUxMIElOU1RBTkNFUyAvLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGlzIGlzIGEgcHJpdmF0ZSBtZXRob2QgdGhhdCBzZXRzIHVwIGhhbmRsaW5nIGZvciB0aGUgc2V0dGVyXG4gICAgICAgICAgICAgKiBJdCBhdHRhY2hlcyBhIGNoYW5nZSBsaXN0ZW5lciBvbiBuZXcgb2JqZWN0c1xuICAgICAgICAgICAgICogYW5kIGl0IHJlbW92ZXMgdGhlIGNoYW5nZSBsaXN0ZW5lciBmcm9tIG9sZCBvYmplY3RzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNoYW5nZUhhbmRsZXIgPSBmdW5jdGlvbiAoYXR0cikge1xuICAgICAgICAgICAgICAgIGlmICghKGF0dHIgaW5zdGFuY2VvZiBBdHRyTGlzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy93aGVuIHNldCBoYW5kbGVyIGlzIGNhbGxlZCwgdGhpcyBzaG91bGQgYmUgdGhlIGN1cnJlbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGF0dHIub24oXCJzZXRcIiwgZnVuY3Rpb24gKG5ld1ZhbHVlLCBwcmVWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgcHJlVmFsdWUgaXMgYSBtb2RlbCBpbnN0YW5jZSwgd2UgbmVlZCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmVWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIHByZVZhbHVlICE9PSBudWxsICYmIHByZVZhbHVlLm9uICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVWYWx1ZS50b0pTT04gIT09IHVuZGVmaW5lZCAmJiBwcmVWYWx1ZS5lbWl0dGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBub3cgYXNzdW1lIHByZVZhbHVlIGlzIGEgbW9kZWwgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzYW5pdHkgY2hlY2sgMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmVWYWx1ZS5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicHJlVmFsdWUgc2hvdWxkIGFsd2F5cyBoYXZlIGEgbGlzdGVuZXIgZGVmaW5lZCBpZiBpdCBpcyBhIG1vZGVsXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIoKS5yZW1vdmVKZXJtYWluZUNoYW5nZUxpc3RlbmVyKGF0dHIubmFtZSgpLCBwcmVWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIG5ld1ZhbHVlIGlzIGEgbW9kZWwgaW5zdGFuY2UsIHdlIG5lZWQgdG8gYXR0YWNoIGEgbGlzdGVuZXIgdG8gaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIG5ld1ZhbHVlICE9PSBudWxsICYmIG5ld1ZhbHVlLm9uICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZS50b0pTT04gIT09IHVuZGVmaW5lZCAmJiBuZXdWYWx1ZS5lbWl0dGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBub3cgYXNzdW1lIG5ld1ZhbHVlIGlzIGEgbW9kZWwgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhdHRhY2ggYSBsaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlcigpLmFkZEplcm1haW5lQ2hhbmdlTGlzdGVuZXIoYXR0ci5uYW1lKCksIG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmluYWxseSBlbWl0IHRoYXQgYSBjaGFuZ2UgaGFzIGhhcHBlbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoXCJjaGFuZ2VcIiwgW3trZXk6YXR0ci5uYW1lKCksIHZhbHVlOm5ld1ZhbHVlLCBvcmlnaW46dGhpc31dKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0ci5vbihcImFkZFwiLCBmdW5jdGlvbiAobmV3VmFsdWUsIG5ld1NpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChcImNoYW5nZVwiLCBbe2FjdGlvbjpcImFkZFwiLCBrZXk6YXR0ci5uYW1lKCksIHZhbHVlOm5ld1ZhbHVlLCBvcmlnaW46dGhpc31dKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy9zZXQgdXAgZXZlbnQgaGFuZGxpbmcgZm9yIHN1YiBvYmplY3RzXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXR0cmlidXRlTGlzdC5sZW5ndGg7ICArK2kpIHtcbiAgICAgICAgICAgICAgICBhdHRyID0gbW9kZWwuYXR0cmlidXRlKGF0dHJpYnV0ZUxpc3RbaV0pO1xuXG4gICAgICAgICAgICAgICAgLy8gdGVtcG9yYXJpbHkgbm90IGFkZGluZyBoYW5kbGVycyB0byBhdHRyIGxpc3RzXG4gICAgICAgICAgICAgICAgLy8gdW50aWwgd2UgZ2V0IHRoZSBidWdzIHNvcnRlZCBvdXRcbiAgICAgICAgICAgICAgICAvLyBzZWUgbW9kZWwgdGVzdCBcInNob3VsZCBub3QgYWRkIGNoYW5nZSBsaXN0ZW5lcnMgdG8gYXR0ciBsaXN0XCJcbiAgICAgICAgICAgICAgICAvL2lmICghKGF0dHIgaW5zdGFuY2VvZiBBdHRyTGlzdCkpIHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VIYW5kbGVyLmNhbGwodGhpcywgYXR0cik7XG4gICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy8gYWRkIGFsbCBvZiB0aGUgYXR0cmlidXRlcyBhbmQgdGhlIG1ldGhvZHMgdG8gdGhlIG9iamVjdFxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGF0dHJpYnV0ZUxpc3QubGVuZ3RoICsgbWV0aG9kTGlzdC5sZW5ndGg7ICsraSkgIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA8IGF0dHJpYnV0ZUxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vaWYgdGhlIG9iamVjdCBpcyBpbW11dGFibGUsIGFsbCBhdHRyaWJ1dGVzIHNob3VsZCBiZSBpbW11dGFibGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzSW1tdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5hdHRyaWJ1dGUoYXR0cmlidXRlTGlzdFtpXSkuaXNJbW11dGFibGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5hdHRyaWJ1dGUoYXR0cmlidXRlTGlzdFtpXSkuYWRkVG8odGhpcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwubWV0aG9kKG1ldGhvZExpc3RbaS1hdHRyaWJ1dGVMaXN0Lmxlbmd0aF0pLmFkZFRvKHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gYnVpbGQgdGhlIG9iamVjdCB1c2luZyB0aGUgY29uc3RydWN0b3IgYXJndW1lbnRzXG4gICAgICAgICAgICBpZihhcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgcmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc3RydWN0IGFuZCB0aHJvdyBlcnJvclxuICAgICAgICAgICAgICAgICAgICBlcnIgPSBcIkNvbnN0cnVjdG9yIHJlcXVpcmVzIFwiO1xuICAgICAgICAgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCByZXF1aXJlZENvbnN0cnVjdG9yQXJncy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyICs9IHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyICs9IGk9PT1yZXF1aXJlZENvbnN0cnVjdG9yQXJncy5sZW5ndGgtMT9cIlwiOlwiLCBcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlcnIgKz0gXCIgdG8gYmUgc3BlY2lmaWVkXCI7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH0gaWYgKGFyZ3VtZW50cy5sZW5ndGggPiByZXF1aXJlZENvbnN0cnVjdG9yQXJncy5sZW5ndGggKyBvcHRpb25hbENvbnN0cnVjdG9yQXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vIG1hbnkgYXJndW1lbnRzIHRvIGNvbnN0cnVjdG9yLiBFeHBlY3RlZCBcIiArIHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzLmxlbmd0aCArIFwiIHJlcXVpcmVkIGFyZ3VtZW50cyBhbmQgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWxDb25zdHJ1Y3RvckFyZ3MubGVuZ3RoICsgXCIgb3B0aW9uYWwgYXJndW1lbnRzXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlID0gaSA8IHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzLmxlbmd0aD9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZENvbnN0cnVjdG9yQXJnc1tpXTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25hbENvbnN0cnVjdG9yQXJnc1tpLXJlcXVpcmVkQ29uc3RydWN0b3JBcmdzLmxlbmd0aF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb2RlbC5hdHRyaWJ1dGUoYXR0cmlidXRlKSBpbnN0YW5jZW9mIEF0dHJMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9tYWtlIHN1cmUgdGhhdCBhcmd1bWVudHNbaV0gaXMgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50c1tpXSkgIT09IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2RlbDogQ29uc3RydWN0b3IgcmVxdWlyZXMgJ25hbWVzJyBhdHRyaWJ1dGUgdG8gYmUgc2V0IHdpdGggYW4gQXJyYXlcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9pdGVyYXRlIG92ZXIgdGhlIGFycmF5IGFkZGluZyB0aGUgZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGFyZ3VtZW50c1tpXS5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1thdHRyaWJ1dGVdKCkuYWRkKGFyZ3VtZW50c1tpXVtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZ28gYWhlYWQgYW5kIHNldCBpdCBsaWtlIG5vcm1hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbYXR0cmlidXRlXShhcmd1bWVudHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmaW5hbGx5LCBjYWxsIHRoZSBpbml0aWFsaXplclxuICAgICAgICAgICAgaW5pdGlhbGl6ZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qKioqKioqKioqKiBFTkQgUFJJVkFURSBNRVRIT0RTICoqKioqKioqKioqKioqL1xuXG5cbiAgICAvKioqKioqKioqKiogQkVHSU4gUFVCTElDIEFQSSAqKioqKioqKioqKioqKioqKi9cbiAgICBtb2RlbC5oYXNBID0gZnVuY3Rpb24gKGF0dHIpIHtcbiAgICAgICAgcmV0dXJuIGhhc0FQcm9wZXJ0eShcIkF0dHJcIiwgYXR0cik7XG4gICAgfTtcbiAgICBcbiAgICBtb2RlbC5oYXNBbiA9IG1vZGVsLmhhc0E7XG4gICAgbW9kZWwuaGFzU29tZSA9IG1vZGVsLmhhc0E7XG4gICAgXG4gICAgbW9kZWwuaGFzTWFueSA9IGZ1bmN0aW9uIChhdHRycykge1xuICAgICAgICByZXR1cm4gaGFzQVByb3BlcnR5KFwiQXR0ckxpc3RcIiwgYXR0cnMpO1xuICAgIH07XG5cbiAgICBtb2RlbC5pc0EgPSBmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgcGFyZW50QXR0cmlidXRlcyxcbiAgICAgICAgICAgIHBhcmVudE1ldGhvZHMsXG4gICAgICAgICAgICBpc0FNb2RlbDtcblxuICAgICAgICBtb2RpZmllZCA9IHRydWU7XG5cbiAgICAgICAgLy9jaGVja3MgdG8gbWFrZSBzdXJlIGEgcG90ZW50aWFsTW9kZWwgaGFzIGFsbCBhdHRyaWJ1dGVzIG9mIGEgbW9kZWxcbiAgICAgICAgaXNBTW9kZWwgPSBmdW5jdGlvbiAocG90ZW50aWFsTW9kZWwpIHtcbiAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgIE0gPSBuZXcgTW9kZWwoKTtcbiAgICAgICAgICAgIGZvciAoaSBpbiBNKSB7XG4gICAgICAgICAgICAgICAgaWYgKE0uaGFzT3duUHJvcGVydHkoaSkgJiYgdHlwZW9mKHBvdGVudGlhbE1vZGVsW2ldKSAhPT0gdHlwZW9mKE1baV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvL2NvbmZpcm0gcGFyZW50IGlzIGEgbW9kZWwgdmlhIGR1Y2stdHlwaW5nXG4gICAgICAgIGlmICh0eXBlb2YgKHBhcmVudCkgIT09IFwiZnVuY3Rpb25cIiB8fCAhaXNBTW9kZWwocGFyZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IHBhcmFtZXRlciBzZW50IHRvIGlzQSBmdW5jdGlvbiBtdXN0IGJlIGEgTW9kZWxcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL29ubHkgYWxsb3cgc2luZ2xlIGluaGVyaXRhbmNlIGZvciBub3dcbiAgICAgICAgaWYgKHBhcmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1vZGVsOiBNb2RlbCBvbmx5IHN1cHBvcnRzIHNpbmdsZSBpbmhlcml0YW5jZSBhdCB0aGlzIHRpbWVcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL2FkZCBhdHRyaWJ1dGVzIGFuZCBtZXRob2RzIHRvIGN1cnJlbnQgbW9kZWxcbiAgICAgICAgcGFyZW50QXR0cmlidXRlcyA9IHBhcmVudHNbMF0uYXR0cmlidXRlcygpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcGFyZW50QXR0cmlidXRlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXNbcGFyZW50QXR0cmlidXRlc1tpXV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNbcGFyZW50QXR0cmlidXRlc1tpXV0gPSBwYXJlbnRzWzBdLmF0dHJpYnV0ZShwYXJlbnRBdHRyaWJ1dGVzW2ldKS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIC8vc3ViY2xhc3MgYXR0cmlidXRlcyBhcmUgbXV0YWJsZSBieSBkZWZhdWx0XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1twYXJlbnRBdHRyaWJ1dGVzW2ldXS5pc011dGFibGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudE1ldGhvZHMgPSBwYXJlbnRzWzBdLm1ldGhvZHMoKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHBhcmVudE1ldGhvZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChtZXRob2RzW3BhcmVudE1ldGhvZHNbaV1dID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBtZXRob2RzW3BhcmVudE1ldGhvZHNbaV1dID0gcGFyZW50c1swXS5tZXRob2QocGFyZW50TWV0aG9kc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgICAgICBcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcGFyZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbW9kZWwucHJvdG90eXBlID0gbmV3IHBhcmVudHNbaV0oKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBtb2RlbC5pc0FuID0gbW9kZWwuaXNBO1xuXG4gICAgbW9kZWwucGFyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcGFyZW50c1swXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBtb2RlbC5hdHRyaWJ1dGUgPSBmdW5jdGlvbiAoYXR0cikge1xuICAgICAgICByZXR1cm4gcHJvcGVydHkoXCJhdHRyaWJ1dGVcIiwgYXR0cik7XG4gICAgfTtcblxuICAgIG1vZGVsLmF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBsaXN0UHJvcGVydGllcyhcImF0dHJpYnV0ZXNcIik7XG4gICAgfTtcblxuICAgIG1vZGVsLm1ldGhvZCA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eShcIm1ldGhvZFwiLCBtKTtcbiAgICB9O1xuICAgIFxuICAgIG1vZGVsLm1ldGhvZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBsaXN0UHJvcGVydGllcyhcIm1ldGhvZHNcIik7XG4gICAgfTtcblxuICAgIG1vZGVsLmlzQnVpbHRXaXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3B0aW9uYWxQYXJhbUZsYWcgPSBmYWxzZSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgbW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICByZXF1aXJlZENvbnN0cnVjdG9yQXJncyA9IFtdO1xuICAgICAgICBvcHRpb25hbENvbnN0cnVjdG9yQXJncyA9IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzW2ldKSA9PT0gXCJzdHJpbmdcIiAmJiBhcmd1bWVudHNbaV0uY2hhckF0KDApICE9PSAnJScpIHtcbiAgICAgICAgICAgICAgICAvL2luIHJlcXVpcmVkIHBhcm1zXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbmFsUGFyYW1GbGFnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhyb3cgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IGlzQnVpbHRXaXRoIHJlcXVpcmVzIHBhcmFtZXRlcnMgcHJlY2VkZWQgd2l0aCBhICUgdG8gYmUgdGhlIGZpbmFsIHBhcmFtZXRlcnMgYmVmb3JlIHRoZSBvcHRpb25hbCBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvL2luc2VydCBpbnRvIHJlcXVpcmVkIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYodHlwZW9mKGFyZ3VtZW50c1tpXSkgPT09IFwic3RyaW5nXCIgJiYgYXJndW1lbnRzW2ldLmNoYXJBdCgwKSA9PT0gJyUnKSB7XG4gICAgICAgICAgICAgICAgLy9pbiBvcHRpb25hbCBwYXJtc1xuICAgICAgICAgICAgICAgIG9wdGlvbmFsUGFyYW1GbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvL2luc2VydCBpbnRvIG9wdGlvbmFsIGFycmF5XG4gICAgICAgICAgICAgICAgb3B0aW9uYWxDb25zdHJ1Y3RvckFyZ3MucHVzaChhcmd1bWVudHNbaV0uc2xpY2UoMSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHR5cGVvZihhcmd1bWVudHNbaV0pID09PSBcImZ1bmN0aW9uXCIgJiYgaSA9PT0gYXJndW1lbnRzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAvL2luaXQgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICBpbml0aWFsaXplciA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IGlzQnVpbHRXaXRoIHBhcmFtZXRlcnMgbXVzdCBiZSBzdHJpbmdzIGV4Y2VwdCBmb3IgYSBmdW5jdGlvbiBhcyB0aGUgb3B0aW9uYWwgZmluYWwgcGFyYW1ldGVyXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBtb2RlbC5pc0ltbXV0YWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXNJbW11dGFibGUgPSB0cnVlO1xuICAgIH07XG5cbiAgICBtb2RlbC5sb29rc0xpa2UgPSBmdW5jdGlvbiAocCkge1xuICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgIHBhdHRlcm4gPSBwO1xuICAgIH07XG5cbiAgICBtb2RlbC5yZXNwb25kc1RvID0gZnVuY3Rpb24gKG1ldGhvZE5hbWUsIG1ldGhvZEJvZHkpIHtcbiAgICAgICAgdmFyIG0gPSBuZXcgTWV0aG9kKG1ldGhvZE5hbWUsIG1ldGhvZEJvZHkpO1xuICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBtO1xuICAgIH07XG4gICAgXG4gICAgbW9kZWwudmFsaWRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgYXR0cmlidXRlcyA9IHRoaXMuYXR0cmlidXRlcygpLFxuICAgICAgICAgICAgbWV0aG9kcyA9IHRoaXMubWV0aG9kcygpO1xuXG4gICAgICAgIC8vY2hlY2sgdG8gbWFrZSBzdXJlIHRoYXQgaXNCdWlsdFdpdGggaGFzIGFjdHVhbCBhdHRyaWJ1dGVzXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByZXF1aXJlZENvbnN0cnVjdG9yQXJncy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZShyZXF1aXJlZENvbnN0cnVjdG9yQXJnc1tpXSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzW2ldICsgXCIsIHNwZWNpZmllZCBpbiB0aGUgaXNCdWlsdFdpdGggbWV0aG9kLCBpcyBub3QgYW4gYXR0cmlidXRlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbmFsQ29uc3RydWN0b3JBcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlKG9wdGlvbmFsQ29uc3RydWN0b3JBcmdzW2ldKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Iob3B0aW9uYWxDb25zdHJ1Y3RvckFyZ3NbaV0gKyBcIiwgc3BlY2lmaWVkIGluIHRoZSBpc0J1aWx0V2l0aCBtZXRob2QsIGlzIG5vdCBhbiBhdHRyaWJ1dGVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL2NoZWNrIGZvciBtZXRob2QvYXR0cmlidXRlIGNvbGxpc2lvbnNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChtZXRob2RzLmluZGV4T2YoYXR0cmlidXRlc1tpXSkgPiAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1vZGVsOiBpbnZhbGlkIG1vZGVsIHNwZWNpZmljYXRpb24gdG8gXCIgKyBhdHRyaWJ1dGVzW2ldICsgXCIgYmVpbmcgYm90aCBhbiBhdHRyaWJ1dGUgYW5kIG1ldGhvZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2hlY2sgdG8gbWFrZSBzdXJlIHRoYXQgYWxsIGF0dHJpYnV0ZXMgYXJlIHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzIGlmIHRoZSBvYmplY3QgaXMgaW1tdXRhYmxlXG4gICAgICAgIGlmIChpc0ltbXV0YWJsZSkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3MuaW5kZXhPZihhdHRyaWJ1dGVzW2ldKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW1tdXRhYmxlIG9iamVjdHMgbXVzdCBoYXZlIGFsbCBhdHRyaWJ1dGVzIHJlcXVpcmVkIGluIGEgY2FsbCB0byBpc0J1aWx0V2l0aFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCBtb2RpZmllZFNpbmNlTGFzdFZhbGlkYXRpb24gdG8gZmFsc2VcbiAgICAgICAgbW9kaWZpZWQgPSBmYWxzZTtcbiAgICB9O1xuICAgIC8qKioqKioqKioqKioqKiBFTkQgUFVCTElDIEFQSSAqKioqKioqKioqKioqKioqL1xuICAgIFxuICAgIC8vaGVyZSB3ZSBhcmUgcmV0dXJuaW5nIG91ciBtb2RlbCBvYmplY3RcbiAgICAvL3doaWNoIGlzIGEgZnVuY3Rpb24gd2l0aCBhIGJ1bmNoIG9mIG1ldGhvZHMgdGhhdFxuICAgIC8vbWFuaXB1bGF0ZSBob3cgdGhlIGZ1bmN0aW9uIGJlaGF2ZXNcbiAgICByZXR1cm4gbW9kZWw7XG59O1xuXG4vL25zLmdldE1vZGVsID0gZ2V0TW9kZWw7XG4vL25zLmdldE1vZGVscyA9IGdldE1vZGVscztcblxuTW9kZWwuZ2V0TW9kZWwgPSBnZXRNb2RlbDtcbk1vZGVsLmdldE1vZGVscyA9IGdldE1vZGVscztcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDtcblxuXG4iLCIvKipcbiAqIFZhbGlkYXRvclxuICogXG4gKiBDcmVhdGVzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gYXR0cmlidXRlIGZvciB2YWxpZGF0aW9uLlxuICogVGhlIFZhbGlkYXRvciBmdW5jdGlvbiBhbGxvd3MgZm9yIGN1c3RvbWl6YXRpb24gb2YgdGhlIHRocm93biBlcnJvciBtZXNzYWdlLlxuICpcbiAqIFRoaXMgc291cmNlIGZpbGUgYWxzbyBoYW5kbGVzIGFsbCBkZWZhdWx0IHZhbGlkYXRvcnMgdGhhdCBjb21lIHBhY2thZ2VkIHdpdGhcbiAqIEplcm1haW5lLiBUaGlzIGluY2x1ZGVzIGlzQSwgaXNPbmVPZiwgaXNHcmVhdGVyVGhhbiwgaXNMZXNzVGhhbiwgZXRjLlxuICpcbiAqIFNpbXBsZSBleGFtcGxlOlxuICpcbiAqIGlzR3JlYXRlclRoYW4gPSBuZXcgVmFsaWRhdG9yKGZ1bmN0aW9uIChudW1iZXIpIHtcbiAqICAgICAvL3RoaXMubWVzc2FnZSBwb2ludHMgdG8gdGhlIGVycm9yIG1lc3NhZ2VcbiAqICAgICAvL3RoYXQgd2lsbCBiZSB0aHJvd25cbiAqICAgICB0aGlzLm1lc3NhZ2UgPSBcIlZhbGlkYXRpb24gRXJyb3I6IFwiICsgXG4gKiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJhbSArIFwiIHNob3VsZCBiZSBncmVhdGVyIHRoYW4gXCIgKyBudW1iZXI7XG4gKlxuICogICAgIC8vdGhpcy5wYXJhbSBwb2ludHMgdG8gdGhlIGFjdHVhbCBwYXJhbWV0ZXIgc2VudCB0byB0aGUgdmFsaWRhdG9yXG4gKiAgICAgLy9yZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsaWRhdGlvbiBwYXNzZXMsIGZhbHNlIG90aGVyd2lzZVxuICogICAgIHJldHVybiB0aGlzLnBhcmFtID4gbnVtYmVyO1xuICogfSk7XG4gKlxuICogTGF0ZXIsIGEgdmFsaWRhdG9yIGNhbiBiZSBhdHRhY2hlZCB0byB0aGUgYXR0cmlidXRlIG9iamVjdC5cbiAqXG4gKiBBdHRyLmlzR3JlYXRlclRoYW4gPSBpc0dyZWF0ZXJUaGFuO1xuICpcbiAqIGFuZCBjYW4gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGF0dHJpYnV0ZXM6XG4gKlxuICogdmFyIGFnZSA9IG5ldyBBdHRyKFwiYWdlXCIpLndoaWNoLmlzR3JlYXRlclRoYW4oMCk7XG4gKlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5yZXF1aXJlKCcuLi91dGlsL2luZGV4X29mLmpzJyk7XG5cbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwuanMnKTtcblxudmFyIHZhbGlkYXRvcnMgPSB7fTsgIC8vdGhlIHNldCBvZiBzdGF0aWMgdmFsaWRhdG9yc1xuXG4vKipcbiAqIFZhbGlkYXRvciAnQ29uc3RydWN0b3InXG4gKlxuICogVGhpcyBzaW1wbHkgcmV0dXJucyBhIHZhbGlkYXRpb24gZnVuY3Rpb24gdGhhdCBoYW5kbGVzIHRoZSBjdXN0b20gZXJyb3JcbiAqIG1lc3NhZ2UgYW5kIGNhbiBiZSBhdHRhY2hlZCB0byBhbiBhdHRyaWJ1dGUuIFNvIGl0J3Mgbm90IHJlYWxseVxuICogdGVjaG5pY2FsbHkgYSBjb25zdHJ1Y3Rvci4gVGhpcyBpcyBvbmx5IGltcG9ydGFudCB0byBrbm93IHNvIHRoYXQgeW91XG4gKiBkb24ndCB0cnkgc29tZXRoaW5nIGxpa2UgdGhpczpcbiAqXG4gKiB2YXIgdiA9IG5ldyBWYWxpZGF0b3IoIC4uLiApO1xuICogXG4gKiAvL3RoaXMgd2lsbCBhbHdheXMgZmFpbCwgYmMgdiBpcyBub3QgYW4gb2JqZWN0XG4gKiBpZiAodiBpbnN0YW5jZW9mIFZhbGlkYXRvcikgeyAuLi4gfVxuICogXG4gKiBUaGUgc3BlYyBmdW5jdGlvbiBpcyBqdXN0IGEgc3BlY2lmaWNhdGlvbiBmb3IgdGhlIHZhbGlkYXRvci4gSXQgYWxsb3dzXG4gKiBmb3IgYSBjb3VwbGUgb2YgdGhpbmdzIHRvIGJlIGF0dGFjaGVkIHRvIFwidGhpc1wiIHRoYXQgd2lsbCBiZSB1c2VkXG4gKiBpbiB0aGUgcmV0dXJuIGZ1bmN0aW9uLiBUaGlzIGluY2x1ZGVzIFwidGhpcy5tZXNzYWdlXCIgYW5kIFwidGhpcy5wYXJhbVwiLlxuICogVGhlIG1lc3NhZ2UgaXMgdGhlIGVycm9yIHN0cmluZyB0aGF0IGlzIHRocm93biBvbiBmYWlsdXJlIGFuZFxuICogdGhpcy5wYXJhbSBpcyB0aGUgYWN0dWFsIHBhcmFtZXRlciB0aGF0IGdldHMgc2VudCBpbiB0byBiZSB2YWxpZGF0ZWQuXG4gKi9cbnZhciBWYWxpZGF0b3IgPSBmdW5jdGlvbiAoc3BlYykge1xuICAgIC8vIHRoaXMgaXMgdGhlIGFjdHVhbCBmdW5jdGlvbiB0aGF0IGlzIHJldHVybmVkXG4gICAgdmFyIHZhbGlkYXRvckZ1bmN0aW9uID0gZnVuY3Rpb24gKGFyZykge1xuICAgICAgICB2YXIgcmVzdWx0LCBcbiAgICAgICAgICAgIHJlc3VsdE9iamVjdCA9IHt9LFxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlO1xuXG4gICAgICAgIC8vIHNwZWMgaXMgY2FsbGVkIG9uIHRoZSBhcmd1bWVudCB3aXRoICd0aGlzJyBwb2ludGluZ1xuICAgICAgICAvLyB0byBhbiBlbXB0eSBvYmplY3QgKHJlc3VsdE9iamVjdCksXG4gICAgICAgIC8vIG5vdGUgdGhlIHZhbGlkYXRvciB3aWxsIHJldHVybiBlaXRoZXIgdHJ1ZSBvciBmYWxzZVxuICAgICAgICByZXN1bHQgPSBzcGVjLmNhbGwocmVzdWx0T2JqZWN0LCBhcmcpO1xuXG4gICAgICAgIC8vIGlmIGl0J3MgZmFsc2UsIHRoZSBwYXJhbWV0ZXIgaGFzIGZhaWxlZCB2YWxpZGF0aW9uXG4gICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAvLyB0aHJvdyB0aGUgZXJyb3JcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IHJlc3VsdE9iamVjdC5tZXNzYWdlIHx8XG4gICAgICAgICAgICAgICAgXCJ2YWxpZGF0b3IgZmFpbGVkIHdpdGggcGFyYW1ldGVyIFwiICsgYXJnO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLy8gc2VlPyBhbGwgdGhhdCdzIGJlaW5nIHJldHVybmVkIGlzIGEgZnVuY3Rpb25cbiAgICAvLyBhbHNvIG5vdGUgdGhhdCBzaW5jZSAndGhpcycgaXMgbmV2ZXIgdXNlZCxcbiAgICAvLyB3ZSBjYW4gY2FsbCB0aGlzIGNvbnN0cnVjdG9yIHdpdGggb3Igd2l0aG91dCAnbmV3J1xuICAgIHJldHVybiB2YWxpZGF0b3JGdW5jdGlvbjtcbn07XG5cbi8qKlxuICogVGhpcyBzdGF0aWMgZnVuY3Rpb24gYWRkcyBhIG5hbWVkIHZhbGlkYXRvciB0byB0aGUgbGlzdCBvZlxuICogdmFsaWRhdG9ycy4gVGhlIHNlY29uZCBhcmd1bWVudCBpcyBhIHZhbGlkYXRpb24gZnVuY3Rpb25cbiAqIHRoYXQgc2ltcGx5IHJldHVybnMgYSBWYWxpZGF0b3IgZnVuY3Rpb24gY3JlYXRlZCBhcyBhYm92ZS5cbiAqXG4gKiBUaGUgbmljZSB0aGluZyBhYm91dCBhZGRpbmcgYSBWYWxpZGF0b3IgdGhpcyB3YXkgaXMgdGhhdFxuICogeW91IGNhbiBhY3R1YWxseSB2YWxpZGF0ZSB0aGUgcGFyYW1ldGVyIHNlbnQgdG8gdGhlIHZhbGlkYXRvciFcbiAqIFdoeSBtaWdodCB0aGF0IGJlIGltcG9ydGFudD8gV2VsbCwgY29uc2lkZXIgdGhlIGZvbGxvd2luZzpcbiAqXG4gKiB2YXIgaXNHcmVhdGVyVGhhbkludGVnZXIgPSBuZXcgVmFsaWRhdG9yKGZ1bmN0aW9uICh2YWwpIHtcbiAqICAgICB0aGlzLm1lc3NhZ2UgPSB0aGlzLnBhcmFtICsgXCIgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiBcIiArIHZhbDtcbiAqICAgICByZXR1cm4gdGhpcy5wYXJhbSA+IHZhbDtcbiAqIH0pO1xuICpcbiAqIE5vdyB3ZSBjYW4gY2FsbCBpc0dyZWF0ZXJUaGFuTnVtYmVyIGxpa2UgdGhpczpcbiAqXG4gKiBpc0dyZWF0ZXJUaGFuTnVtYmVyKDUpKDYpOyAvLyB3aWxsIHBhc3MgdmFsaWRhdGlvblxuICogaXNHcmVhdGVyVGhhbk51bWJlcig1KSgzKTsgLy8gd2lsbCB0aHJvd1xuICogaXNHcmVhdGVyVGhhbk51bWJlcihcImRvZ1wiKSgzKTsgLy8gPz8/XG4gKlxuICogU28gd2UgbmVlZCB0byBjb25maXJtIHRoYXQgdGhlIHVzZXIgc2VuZHMgaW4gYW4gaW50ZWdlciBhcyBhIHBhcmFtZXRlci5cbiAqIFlvdSBtaWdodCB3YW50IHRvIHRyeSBzb21ldGhpbmcgbGlrZSB0aGlzOlxuICpcbiAqIHZhciBpc0dyZWF0ZXJUaGFuSW50ZWdlciA9IG5ldyBWYWxpZGF0b3IoZnVuY3Rpb24gKHZhbCkge1xuICogICAgIGlmICh0eXBlb2YodmFsKSAhPT0gXCJudW1iZXJcIikgdGhyb3cgRXJyb3IoXCJOb3QgY29vbCFcIik7XG4gKiAgICAgdGhpcy5tZXNzYWdlID0gdGhpcy5wYXJhbSArIFwiIHNob3VsZCBiZSBncmVhdGVyIHRoYW4gXCIgKyB2YWw7XG4gKiAgICAgcmV0dXJuIHRoaXMucGFyYW0gPiB2YWw7XG4gKiB9KTtcbiAqXG4gKiBUaGlzIHdpbGwgYWN0dWFsbHkgd29yayBvbiB0aGUgZXhhbXBsZSBhYm92ZTpcbiAqXG4gKiBpc0dyZWF0ZXJUaGFuTnVtYmVyKFwiZG9nXCIpKDMpOyAvLyB0aHJvd3MgZXJyb3Igbm93XG4gKlxuICogVGhlIHByb2JsZW0gaXMgdGhhdCB3aXRoIEplcm1haW5lLCB3ZSBjcmVhdGUgdGhlIHZhbGlkYXRvclxuICogYW5kIHRoZW4gZG9uJ3QgYWN0dWFsbHkgY2FsbCBpdCB1bnRpbCBhbiBhdHRyaWJ1dGUgaXMgYWJvdXQgdG8gYmVcbiAqIHNldC4gU28sIGluIG90aGVyIHdvcmRzOlxuICpcbiAqIHZhciBhID0gbmV3IEF0dHIoXCJ0aGluZ1wiKS53aGljaC5pc0dyZWF0ZXJUaGFuTnVtYmVyKFwiZG9nXCIpOyAvL25vIGVycm9yICh5ZXQpXG4gKlxuICogd2lsbCBub3QgY2F1c2UgYW4gZXJyb3IgdW50aWwgaXQncyBhdHRhY2hlZCB0byBhbiBvYmplY3QgYW5kIHRoaW5nXG4gKiBpcyBhdHRlbXB0ZWQgdG8gYmUgc2V0LlxuICpcbiAqIFNvIGEgdGVtcG9yYXJ5IHdvcmthcm91bmQgaXMgdG8gdmFsaWRhdGUgdGhlIHZhbGlkYXRvciBpbiB0aGVcbiAqIGFkZFZhbGlkYXRvciBmdW5jdGlvbiBiZWxvdy4gVGhhdCdzIGhhbmRsZWQgYnkgdGhlIGFyZ1ZhbGlkYXRvclxuICogdmFsaWRhdG9yLiAoUGhldywgdGhpcyBpcyBnZXR0aW5nIHJlYWxseSBtZXRhKVxuICpcbiAqIEknbSBub3Qgc3VyZSB0aGlzIGlzIHRoZSBiZXN0IHNvbHV0aW9uLiBTZWVtcyBsaWtlIHRoZXJlIHNob3VsZCBiZVxuICogYSB3YXkgdG8gdmFsaWRhdGUgdGhlIGFyZ3VtZW50IGluIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiwgYnV0XG4gKiB0aGF0IG1pZ2h0IHJlcXVpcmUgc29tZSByZXdpcmluZyB0aGF0IGJyZWFrcyBtdWx0aWdyYXBoLiBUaGlzIGlzXG4gKiB0aGUgYmVzdCBJIGNvdWxkIGNvbWUgdXAgd2l0aCBmb3Igbm93LlxuICpcbiAqIEBuYW1lIFRoZSBuYW1lIG9mIHRoZSB2YWxpZGF0b3IgZm9yIHRoZSBhdHRyaWJ1dGUsIG11c3QgYmUgYSBzdHJpbmdcbiAqICAgICAgIG9yIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duXG4gKlxuICogQHYgVGhlIHZhbGlkYXRvciBzcGVjaWZpY2F0aW9uIChyZXR1cm5zIGEgYm9vbGVhbilcbiAqICAgIG11c3QgYmUgYSBmdW5jdGlvbiBvciBhbiBlcnJvciB3aWxsIGJlIHRocm93blxuICpcbiAqIEBhcmdWYWxpZGF0b3Igb3B0aW9uYWwgZnVuY3Rpb24gdGhhdCBjaGVja3MgdGhlIHR5cGVzIG9mIGFyZ3Mgc2VudFxuICogICAgICAgICAgIHRvIHRoZSB2YWxpZGF0b3IsIG11c3QgYmUgYSBmdW5jdGlvbiBvciBhbiBlcnJvciB3aWxsIGJlIHRocm93blxuICpcbiAqIFNvIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duIGluIHRoZSBjYXNlcyB0aGF0IFwibmFtZVwiIGlzIG5vdCBhIHN0cmluZyxcbiAqIHYgaXMgbm90IGEgZnVuY3Rpb24sIGFyZ1ZhbGlkYXRvciBpcyBub3QgYSBmdW5jdGlvbiwgb3IgaWYgdGhlIHN0YXRpY1xuICogdmFsaWRhdG9yIGlzIGFscmVhZHkgZGVmaW5lZC5cbiAqL1xuVmFsaWRhdG9yLmFkZFZhbGlkYXRvciA9IGZ1bmN0aW9uIChuYW1lLCB2LCBhcmdWYWxpZGF0b3IpIHtcbiAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZihuYW1lKSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhZGRWYWxpZGF0b3IgcmVxdWlyZXMgYSBuYW1lIHRvIGJlIHNwZWNpZmllZCBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXCIpO1xuICAgIH1cblxuICAgIGlmICh2ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mKHYpICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYWRkVmFsaWRhdG9yIHJlcXVpcmVzIGEgZnVuY3Rpb24gYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXJcIik7XG4gICAgfVxuXG4gICAgLy8gb3B0aW9uYWwgdGhpcmQgYXJndW1lbnQgdG8gdmFsaWRhdGUgdGhlIFxuICAgIC8vIGV4cGVjdGVkIHZhbHVlIHRoYXQgZ2V0cyBzZW50IHRvIHRoZSB2YWxpZGF0b3JcbiAgICAvLyBmb3IgZXhhbXBsZSwgaXNBKFwibnVtYmVyXCIpIHdvcmtzIGJ1dCBpc0EoXCJubWJlclwiKVxuICAgIC8vIGRvZXNuJ3Qgd29ya1xuICAgIGlmIChhcmdWYWxpZGF0b3IgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YoYXJnVmFsaWRhdG9yKSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImFkZFZhbGlkYXRvciB0aGlyZCBvcHRpb25hbCBhcmd1bWVudCBtdXN0IGJlIGEgXCIrXG4gICAgICAgICAgICAgICAgICAgICAgICBcImZ1bmN0aW9uXCIpO1xuICAgIH1cblxuICAgIGlmICh2YWxpZGF0b3JzW25hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFsaWRhdG9yc1tuYW1lXSA9IGZ1bmN0aW9uIChleHBlY3RlZCkge1xuICAgICAgICAgICAgaWYgKGFyZ1ZhbGlkYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhcmdWYWxpZGF0b3IoZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoXCJWYWxpZGF0b3I6IEludmFsaWQgYXJndW1lbnQgZm9yIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lICsgXCIgdmFsaWRhdG9yXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgVmFsaWRhdG9yKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0T2JqZWN0ID0ge1wiYWN0dWFsXCI6dmFsLCBcInBhcmFtXCI6dmFsfSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdi5jYWxsKHJlc3VsdE9iamVjdCwgZXhwZWN0ZWQpO1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IHJlc3VsdE9iamVjdC5tZXNzYWdlO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0b3IgJ1wiICsgbmFtZSArXCInIGFscmVhZHkgZGVmaW5lZFwiKTtcbiAgICB9XG59O1xuXG5cbi8qKlxuICogR2V0IHRoZSBidWlsdC1pbiB2YWxpZGF0b3IgYnkgaXRzIG5hbWUuXG4gKlxuICogQG5hbWUgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBuYW1lIG9mIHRoZSB2YWxpZGF0b3IgdG8gcmV0dXJuXG4gKiBcbiAqIHRocm93cyBhbiBlcnJvciBpZiBuYW1lIGlzIG5vdCBhIHN0cmluZ1xuICovXG5WYWxpZGF0b3IuZ2V0VmFsaWRhdG9yID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgcmVzdWx0O1xuXG4gICAgaWYgKG5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0b3I6IGdldFZhbGlkYXRvciBtZXRob2QgcmVxdWlyZXMgYSBzdHJpbmcgcGFyYW1ldGVyXCIpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIChuYW1lKSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0b3I6IHBhcmFtZXRlciB0byBnZXRWYWxpZGF0b3IgbWV0aG9kIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgfVxuXG4gICAgcmVzdWx0ID0gdmFsaWRhdG9yc1tuYW1lXTtcblxuICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0b3I6ICdcIiArIG5hbWUgKyBcIicgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuXG4vKipcbiAqIHJldHVybiBhbiBhcnJheSBvZiBvZiBzdGF0aWMgdmFsaWRhdG9yIG5hbWVzXG4gKi9cblZhbGlkYXRvci52YWxpZGF0b3JzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwcm9wLFxuICAgICAgICByZXN1bHQgPSBbXTtcbiAgICBmb3IgKHByb3AgaW4gdmFsaWRhdG9ycykge1xuICAgICAgICBpZiAodmFsaWRhdG9ycy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gocHJvcCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBCdWlsdC1JbiB2YWxpZGF0b3JzLiBIb3BlZnVsbHkgdGhlc2UgYXJlIHNlbGYtZXhwbGFuYXRvcnlcbiAqIFdpbGwgZG9jdW1lbnQgdGhlbSBtb3JlIGxhdGVyLlxuICovXG5WYWxpZGF0b3IuYWRkVmFsaWRhdG9yKFwiaXNHcmVhdGVyVGhhblwiLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gdGhpcy5wYXJhbSArIFwiIHNob3VsZCBiZSBncmVhdGVyIHRoYW4gXCIgKyB2YWw7XG4gICAgcmV0dXJuIHRoaXMucGFyYW0gPiB2YWw7XG59KTtcblxuVmFsaWRhdG9yLmFkZFZhbGlkYXRvcihcImlzTGVzc1RoYW5cIiwgZnVuY3Rpb24gKHZhbCkge1xuICAgIHRoaXMubWVzc2FnZSA9IHRoaXMucGFyYW0gKyBcIiBzaG91bGQgYmUgbGVzcyB0aGFuIFwiICsgdmFsO1xuICAgIHJldHVybiB0aGlzLnBhcmFtIDwgdmFsO1xufSk7XG5cblxuLy8gVE9ETzogYWRkIGFycmF5IHZhbGlkYXRpb24gZm9yIHZhbFxuVmFsaWRhdG9yLmFkZFZhbGlkYXRvcihcImlzT25lT2ZcIiwgZnVuY3Rpb24gKHZhbCkge1xuICAgIHRoaXMubWVzc2FnZSA9IHRoaXMucGFyYW0gKyBcIiBzaG91bGQgYmUgb25lIG9mIHRoZSBzZXQ6IFwiICsgdmFsO1xuICAgIHJldHVybiB2YWwuaW5kZXhPZih0aGlzLnBhcmFtKSA+IC0xO1xufSk7XG5cbi8qKlxuICogVGhpcyBvbmUgaXMgdGhlIG9ubHkgb25lIHRoYXQgdXNlcyBhbiBhcmd1bWVudCB2YWxpZGF0b3IuIEl0IGNvbmZpcm1zXG4gKiB0aGF0IHRoZSBhcmd1bWVudCBpcyBhIHByaW1pdGl2ZSBqYXZhc2NyaXB0IHR5cGUgb3IgYSBuYW1lZCBKZXJtYWluZVxuICogbW9kZWwuXG4gKi9cblZhbGlkYXRvci5hZGRWYWxpZGF0b3IoXCJpc0FcIiwgZnVuY3Rpb24gKHZhbCkge1xuICAgIHZhciB0eXBlcyA9IFtcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImJvb2xlYW5cIiwgXCJmdW5jdGlvblwiLCBcIm9iamVjdFwiXSxcbiAgICAgICAgbW9kZWxzID0gTW9kZWwuZ2V0TW9kZWxzKCk7XG4gICAgaWYgKHR5cGVvZih2YWwpID09PSBcInN0cmluZ1wiICYmIHR5cGVzLmluZGV4T2YodmFsKSA+IC0xKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IHRoaXMucGFyYW0gKyBcIiBzaG91bGQgYmUgYSBcIiArIHZhbDtcbiAgICAgICAgcmV0dXJuIHR5cGVvZih0aGlzLnBhcmFtKSA9PT0gdmFsO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mKHZhbCkgPT09IFwic3RyaW5nXCIgJiYgbW9kZWxzLmluZGV4T2YodmFsKSA+IC0xKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IFwicGFyYW1ldGVyIHNob3VsZCBiZSBhbiBpbnN0YW5jZSBvZiBcIiArIHZhbDtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW0gaW5zdGFuY2VvZiBNb2RlbC5nZXRNb2RlbCh2YWwpO1xuICAgIH0gZWxzZSBpZiAodmFsID09PSAnaW50ZWdlcicpIHtcbiAgICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciAnaW50ZWdlcic7IHNpbmNlIGphdmFzY3JpcHQgaGFzIG5vIGludGVnZXIgdHlwZSxcbiAgICAgICAgLy8ganVzdCBjaGVjayBmb3IgbnVtYmVyIHR5cGUgYW5kIGNoZWNrIHRoYXQgaXQncyBudW1lcmljYWxseSBhbiBpbnRcbiAgICAgICAgaWYgKHRoaXMucGFyYW0udG9TdHJpbmcgIT09IHVuZGVmaW5lZCkgIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IHRoaXMucGFyYW0udG9TdHJpbmcoKSArIFwiIHNob3VsZCBiZSBhbiBpbnRlZ2VyXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcInBhcmFtZXRlciBzaG91bGQgYmUgYW4gaW50ZWdlclwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAodHlwZW9mKHRoaXMucGFyYW0pID09PSAnbnVtYmVyJykgJiYgKHBhcnNlSW50KHRoaXMucGFyYW0sMTApID09PSB0aGlzLnBhcmFtKTtcbiAgICB9IC8qZWxzZSBpZiAodHlwZW9mKHZhbCkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0b3I6IGlzQSBhY2NlcHRzIGEgc3RyaW5nIHdoaWNoIGlzIG9uZSBvZiBcIiArIHR5cGVzKTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRvcjogaXNBIG9ubHkgYWNjZXB0cyBhIHN0cmluZyBmb3IgYSBwcmltaXRpdmUgdHlwZXMgZm9yIHRoZSB0aW1lIGJlaW5nXCIpO1xuICAgICAgIH0qL1xufSxcbiAgICAgICAgICAgICAgICAgICAgICAgLy9hcmd1bWVudCB2YWxpZGF0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGVzQW5kTW9kZWxzID0gW1wic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiYm9vbGVhblwiLCBcImZ1bmN0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvYmplY3RcIiwgXCJpbnRlZ2VyXCJdLmNvbmNhdChNb2RlbC5nZXRNb2RlbHMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHlwZXNBbmRNb2RlbHMuaW5kZXhPZih2YWwpID49IDA7XG4gICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cbi8vIGdyYW1tYXRpY2FsIGFsaWFzIGZvciBpc0FcbnZhbGlkYXRvcnMuaXNBbiA9IHZhbGlkYXRvcnMuaXNBO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRvcjtcbiIsInJlcXVpcmUoJy4vdXRpbC9pbmRleF9vZi5qcycpO1xuXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL2NvcmUvbW9kZWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ0F0dHInICAgICAgOiByZXF1aXJlKCcuL2NvcmUvYXR0ci5qcycpLFxuICAgICdBdHRyTGlzdCcgIDogcmVxdWlyZSgnLi9jb3JlL2F0dHJfbGlzdC5qcycpLFxuICAgICdNb2RlbCcgICAgIDogTW9kZWwsXG4gICAgJ2dldE1vZGVsJyAgOiBNb2RlbC5nZXRNb2RlbCxcbiAgICAnZ2V0TW9kZWxzJyA6IE1vZGVsLmdldE1vZGVscyxcbiAgICAnVmFsaWRhdG9yJyA6IHJlcXVpcmUoJy4vY29yZS92YWxpZGF0b3IuanMnKSxcbiAgICAnTWV0aG9kJyAgICA6IHJlcXVpcmUoJy4vY29yZS9tZXRob2QuanMnKSxcbiAgICAndXRpbCcgICAgICA6IHtcbiAgICAgICAgJ0V2ZW50RW1pdHRlcicgOiByZXF1aXJlKCcuL3V0aWwvZXZlbnRfZW1pdHRlci5qcycpLFxuICAgICAgICAnbmFtZXNwYWNlJyAgICA6IHJlcXVpcmUoJy4vdXRpbC9uYW1lc3BhY2UuanMnKVxuICAgIH1cbn07XG4iLCJ3aW5kb3cuamVybWFpbmUgPSByZXF1aXJlKCcuL2plcm1haW5lLmpzJyk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxucmVxdWlyZSgnLi9pbmRleF9vZi5qcycpO1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcyxcbiAgICAgICAgbGlzdGVuZXJzID0ge307XG5cbiAgICAvL2FuIHJlZ2lzdGVycyBldmVudCBhbmQgYSBsaXN0ZW5lclxuICAgIHRoaXMub24gPSBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YoZXZlbnQpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFdmVudEVtaXR0ZXI6IGZpcnN0IGFyZ3VtZW50IHRvICdvbicgc2hvdWxkIGJlIGEgc3RyaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YobGlzdGVuZXIpICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV2ZW50RW1pdHRlcjogc2Vjb25kIGFyZ3VtZW50IHRvICdvbicgc2hvdWxkIGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsaXN0ZW5lcnNbZXZlbnRdKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnNbZXZlbnRdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgbGlzdGVuZXJzW2V2ZW50XS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoYXQ7XG4gICAgfTtcblxuICAgIC8vYWxpYXMgYWRkTGlzdGVuZXJcbiAgICB0aGlzLmFkZExpc3RlbmVyID0gdGhpcy5vbjtcbiAgICBcbiAgICB0aGlzLm9uY2UgPSBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGlzdGVuZXIoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGYpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoYXQub24oZXZlbnQsIGYpO1xuICAgICAgICByZXR1cm4gdGhhdDtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgdmFyIGluZGV4O1xuXG4gICAgICAgIGlmICh0eXBlb2YoZXZlbnQpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFdmVudEVtaXR0ZXI6IGZpcnN0IHBhcmFtZXRlciB0byByZW1vdmVMaXN0ZW5lciBtZXRob2QgbXVzdCBiZSBhIHN0cmluZyByZXByZXNlbnRpbmcgYW4gZXZlbnRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZihsaXN0ZW5lcikgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXZlbnRFbWl0dGVyOiBzZWNvbmQgcGFyYW1ldGVyIG11c3QgYmUgYSBmdW5jdGlvbiB0byByZW1vdmUgYXMgYW4gZXZlbnQgbGlzdGVuZXJcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpc3RlbmVyc1tldmVudF0gPT09IHVuZGVmaW5lZCB8fCBsaXN0ZW5lcnNbZXZlbnRdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXZlbnRFbWl0dGVyOiB0aGVyZSBhcmUgbm8gbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIHRoZSAnXCIgKyBldmVudCArIFwiJyBldmVudFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluZGV4ID0gbGlzdGVuZXJzW2V2ZW50XS5pbmRleE9mKGxpc3RlbmVyKTtcblxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAvL3JlbW92ZSBpdCBmcm9tIHRoZSBsaXN0XG4gICAgICAgICAgICBsaXN0ZW5lcnNbZXZlbnRdLnNwbGljZShpbmRleCwxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGF0O1xuICAgIH07XG5cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAodHlwZW9mKGV2ZW50KSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXZlbnRFbWl0dGVyOiBwYXJhbWV0ZXIgdG8gcmVtb3ZlQWxsTGlzdGVuZXJzIHNob3VsZCBiZSBhIHN0cmluZyByZXByZXNlbnRpbmcgYW4gZXZlbnRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGlzdGVuZXJzW2V2ZW50XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnNbZXZlbnRdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGF0O1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgIHJldHVybiB0aGF0O1xuICAgIH07XG5cbiAgICAvL2dldCB0aGUgbGlzdGVuZXJzIGZvciBhbiBldmVudFxuICAgIHRoaXMubGlzdGVuZXJzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YoZXZlbnQpICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXZlbnRFbWl0dGVyOiBsaXN0ZW5lcnMgbWV0aG9kIG11c3QgYmUgY2FsbGVkIHdpdGggdGhlIG5hbWUgb2YgYW4gZXZlbnRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAobGlzdGVuZXJzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3RlbmVyc1tldmVudF07XG4gICAgfTtcblxuICAgIC8vZXhlY3V0ZSBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgaW4gb3JkZXIgd2l0aCB0aGUgc3BlY2lmaWVkIGFyZ3VtZW50c1xuICAgIHRoaXMuZW1pdCA9IGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIHBhcmFtcztcblxuXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcGFyYW1zID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBwYXJhbXMucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxpc3RlbmVyc1tldmVudF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3RlbmVyc1tldmVudF0ubGVuZ3RoOyBpPWkrMSkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tldmVudF1baV0uYXBwbHkodGhpcywgcGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gdGhhdDtcbn07IC8vZW5kIEV2ZW50RW1pdHRlclxuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbiIsImlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIChzZWFyY2hFbGVtZW50IC8qLCBmcm9tSW5kZXggKi8gKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuICAgICAgICBpZiAodGhpcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ID0gT2JqZWN0KHRoaXMpO1xuICAgICAgICB2YXIgbGVuID0gdC5sZW5ndGggPj4+IDA7XG4gICAgICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbiA9IDA7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbiA9IE51bWJlcihhcmd1bWVudHNbMV0pO1xuICAgICAgICAgICAgaWYgKG4gIT09IG4pIHsgLy8gc2hvcnRjdXQgZm9yIHZlcmlmeWluZyBpZiBpdCdzIE5hTlxuICAgICAgICAgICAgICAgIG4gPSAwO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChuICE9PSAwICYmIG4gIT09IEluZmluaXR5ICYmIG4gIT09IC1JbmZpbml0eSkge1xuICAgICAgICAgICAgICAgIG4gPSAobiA+IDAgfHwgLTEpICogTWF0aC5mbG9vcihNYXRoLmFicyhuKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG4gPj0gbGVuKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGsgPSBuID49IDAgPyBuIDogTWF0aC5tYXgobGVuIC0gTWF0aC5hYnMobiksIDApO1xuICAgICAgICBmb3IgKDsgayA8IGxlbjsgaysrKSB7XG4gICAgICAgICAgICBpZiAoayBpbiB0ICYmIHRba10gPT09IHNlYXJjaEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1bmRlZmluZWQ7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5hbWVzcGFjZSAobnMsIGFsaWFzZXMsIGZ1bmMpIHtcbiAgICB2YXIgbnNSZWdFeHAgPSAvXihbYS16QS1aXSspKFxcLlthLXpBLVpdKikqJC8sXG4gICAgICAgIG5zQXJyYXksXG4gICAgICAgIGN1cnJlbnROUyxcbiAgICAgICAgaTtcblxuICAgIC8vY2hlY2sgdG8gYXNzdXJlIG5zIGlzIGEgcHJvcGVybHkgZm9ybWF0dGVkIG5hbWVzcGFjZSBzdHJpbmdcbiAgICBpZiAobnMubWF0Y2gobnNSZWdFeHApID09PSBudWxsIHx8IG5zID09PSBcIndpbmRvd1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5hbWVzcGFjZTogXCIgKyBucyArIFwiIGlzIGEgbWFsZm9ybWVkIG5hbWVzcGFjZSBzdHJpbmdcIik7XG4gICAgfVxuXG4gICAgLy9jaGVjayB0byBhc3N1cmUgdGhhdCBpZiBhbGlhcyBpcyBkZWZpbmVkIHRoYXQgZnVuYyBpcyBkZWZpbmVkXG4gICAgaWYgKGFsaWFzZXMgIT09IHVuZGVmaW5lZCAmJiBmdW5jID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAoYWxpYXNlcykgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgZnVuYyA9IGFsaWFzZXM7XG4gICAgICAgICAgICBhbGlhc2VzID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoYWxpYXNlcykgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5hbWVzcGFjZTogaWYgc2Vjb25kIGFyZ3VtZW50IGV4aXN0cywgZmluYWwgZnVuY3Rpb24gYXJndW1lbnQgbXVzdCBleGlzdFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGFsaWFzZXMpICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYW1lc3BhY2U6IHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGFuIG9iamVjdCBvZiBhbGlhc2VkIGxvY2FsIG5hbWVzcGFjZXNcIik7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiAoYWxpYXNlcykgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIChmdW5jKSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5hbWVzcGFjZTogc2Vjb25kIGFyZ3VtZW50IG11c3QgYmUgYW4gb2JqZWN0IG9mIGFsaWFzZWQgbG9jYWwgbmFtZXNwYWNlc1wiKTtcbiAgICB9XG5cbiAgICAvL3BhcnNlIG5hbWVzcGFjZSBzdHJpbmdcbiAgICBuc0FycmF5ID0gbnMuc3BsaXQoXCIuXCIpO1xuXG4gICAgLy9zZXQgdGhlIHJvb3QgbmFtZXNwYWNlIHRvIHdpbmRvdyAoaWYgaXQncyBub3QgZXhwbGljdGx5IHN0YXRlZClcbiAgICBpZiAobnNBcnJheVswXSA9PT0gXCJ3aW5kb3dcIikge1xuICAgICAgICBjdXJyZW50TlMgPSB3aW5kb3c7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY3VycmVudE5TID0gKHdpbmRvd1tuc0FycmF5WzBdXSA9PT0gdW5kZWZpbmVkKSA/IHdpbmRvd1tuc0FycmF5WzBdXSA9IHt9IDogd2luZG93W25zQXJyYXlbMF1dO1xuICAgIH1cblxuICAgIC8vY29uZmlybSBmdW5jIGlzIGFjdHVhbGx5IGEgZnVuY3Rpb25cbiAgICBpZiAoZnVuYyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiAoZnVuYykgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYW1lc3BhY2U6IGxhc3QgcGFyYW1ldGVyIG11c3QgYmUgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSBuYW1lc3BhY2UgcGFyYW1ldGVyXCIpO1xuICAgIH1cblxuICAgIC8vYnVpbGQgbmFtZXNwYWNlXG4gICAgZm9yIChpID0gMTsgaSA8IG5zQXJyYXkubGVuZ3RoOyBpID0gaSArIDEpIHtcbiAgICAgICAgaWYgKGN1cnJlbnROU1tuc0FycmF5W2ldXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjdXJyZW50TlNbbnNBcnJheVtpXV0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50TlMgPSBjdXJyZW50TlNbbnNBcnJheVtpXV07XG4gICAgfVxuXG4gICAgLy9uYW1lc3BhY2VzLnB1c2goY3VycmVudE5TKTtcbiAgICAvL25hbWVzcGFjZSA9IGN1cnJlbnROUztcblxuICAgIC8vaWYgdGhlIGZ1bmN0aW9uIHdhcyBkZWZpbmVkLCBidXQgbm8gYWxpYXNlcyBydW4gaXQgb24gdGhlIGN1cnJlbnQgbmFtZXNwYWNlXG4gICAgaWYgKGFsaWFzZXMgPT09IHVuZGVmaW5lZCAmJiBmdW5jKSB7XG4gICAgICAgIGZ1bmMoY3VycmVudE5TKTtcbiAgICB9IGVsc2UgaWYgKGZ1bmMpIHtcbiAgICAgICAgZm9yIChpIGluIGFsaWFzZXMpIHtcbiAgICAgICAgICAgIGlmIChhbGlhc2VzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgYWxpYXNlc1tpXSA9IG5hbWVzcGFjZShhbGlhc2VzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jLmNhbGwoYWxpYXNlcywgY3VycmVudE5TKTtcbiAgICB9XG5cbiAgICAvL3JldHVybiBuYW1lc3BhY2VcbiAgICByZXR1cm4gY3VycmVudE5TO1xufTtcbiJdfQ==

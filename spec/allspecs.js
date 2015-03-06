(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*global describe, it, beforeEach, expect, xit, jasmine */

var Attr = require('../../src/core/attr.js');
var EventEmitter = require('../../src/util/event_emitter.js');

describe("Attr", function () {
    "use strict";
    var suits = ['clubs', 'diamonds', 'hearts', 'spades'],
        suit,
        ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K'],
        rank,
        num,
        obj,
        age,
        Card;

    beforeEach(function () {
        suit = new Attr("suit");
        rank = new Attr("rank");
        num = new Attr("num");
        age = new Attr("age");
        Card = {};
        obj = {};
    });

    ////////////////////////////////////////////////////////////////////////////
    //////////////////////////// CONSTRUCTOR TESTS  ////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    describe("Constructor Tests", function () {
        it("should throw an error on an empty or no string parameter", function () {
               expect(function () {
                   suit = new Attr();
               }).toThrow(new Error("Attr: constructor requires a name parameter which must be a string"));
               
               expect(function () {
                   suit = new Attr(5);
               }).toThrow(new Error("Attr: constructor requires a name parameter which must be a string"));
           });
    });

    ////////////////////////////////////////////////////////////////////////////
    //////////////////////////// END CONSTRUCTOR TESTS  ////////////////////////
    ////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////// MODIFIER TESTS /////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    describe("Modifier Tests", function () {
        describe("validatesWith method", function () {
            it("should add a new validation criteria", function () {
                var v = function (thing) {
                    if (thing === "hello") {
                        return true;
                    } else {
                        return false;
                    }
                };
                suit.validatesWith(v);
                expect(suit.validator()("hello")).toBe(true);
                expect(function () {
                    suit.validator()("goodbye");
                }).toThrow();
            });
            
            it("should allow for a new error message to be set using this.message in the specified function",
               function () {
                var v = function (num) {
                    this.message = "Expected " + num + " to be bigger than 5";
                    return num > 5;
                };
                
                suit.validatesWith(v);
                
                suit.validatesWith(function (num) {
                    this.message = "Expected " + num + " to be less than 10";
                    return num < 10;
                });

                suit.validatesWith(function (num) {
                    this.message = "Expected " + num + " to be divisible by 4";
                    return num%4 === 0;
                });

                suit.addTo(obj);
                expect(function () {
                    obj.suit(3);
                }).toThrow("Expected 3 to be bigger than 5");
                
                expect(function () {
                    obj.suit(12);
                }).toThrow("Expected 12 to be less than 10");
                
                expect(function () {
                    obj.suit(7);
                }).toThrow("Expected 7 to be divisible by 4");
                
                expect(function () {
                    obj.suit(8);
                }).not.toThrow();
            });
            
            it("should allow for multiple attrs to be created with different validators", function () {
                suit.validatesWith(function (suit) {
                    return suits.indexOf(suit) >= 0;
                });
                
                expect(rank.validator() !== suit.validator()).toBe(true);
            });


            it("should return the Attr object for cascading", function () {
                expect(suit.validatesWith(function () {
                    return false;
                })).toEqual(suit);
            });
            
            it("should throw an error if the argument is not a function",
               function () {
                   expect(function () {
                       suit.validatesWith(5);
                   }).toThrow(new Error("Attr: validator must be a function"));
               });
        });

        describe("defaultsTo method", function () {
            it("should validate the default value when it is added to an object", function () {
                var spy = jasmine.createSpy(),
                v = function (age) {
                    spy();
                    return (typeof(age) === "number" && age >= 0);
                };
                   
                age.validatesWith(v).and.defaultsTo(0);
                age.addTo(obj);
                expect(spy).toHaveBeenCalled();
                
                age.defaultsTo(-5);
                expect(function () {
                    age.addTo(obj);
                }).toThrow();
            });
            
            it("should set the attribute to the parameter for all new objects", function () {
                age.defaultsTo(0);
                age.addTo(obj);
                expect(obj.age()).toBe(0);
            });
            
            it("should call the function each time a default is assigned, when the validator is a function",
               function() {
                var Dog = function (name) {
                    this.name = name;
                };
                var count = 0;
                var dog = new Attr("dog").which.validatesWith(function (dog) {
                    return dog instanceof Dog;
                }).and.defaultsTo(function () {
                    ++count;
                    return new Dog("spot");
                });
                var fred = {};
                dog.addTo(fred);
                expect(fred.dog().name).toBe("spot");
                fred.dog().name = 'rover';
                expect(fred.dog().name).toBe("rover");
                var jane = {};
                dog.addTo(jane);
                expect(jane.dog().name).toBe("spot");
                expect(fred.dog().name).toBe("rover");
                expect(count).toBe(2);
            });

            it("should return the Attr object for cascading", function () {
                var result = age.defaultsTo(0);
                expect(result).toBe(age);
            });
        });
        
        describe("isWritable method", function () {
            beforeEach(function () {
                suit.isImmutable().and.validatesWith(function (suit) {
                    return suits.indexOf(suit) > -1;
                });
            });
            
            it("should make a formerly immutable attribute mutable again",
               function () {
                   suit.isWritable();
                   suit.addTo(Card);
                   Card.suit("clubs");
                   expect(Card.suit()).toBe("clubs");
                   Card.suit("hearts");
                   expect(Card.suit()).toBe("hearts");
                   Card.suit("diamonds");
                   expect(Card.suit()).toBe("diamonds");
               });
            
            it("should return the attribute for chaining", function () {
                expect(suit.isWritable()).toBe(suit);
            });
        });
        
        describe("isReadOnly method", function () {
            beforeEach(function () {
                suit.isReadOnly().and.validatesWith(function (suit) {
                    return suits.indexOf(suit) > -1;
                });
                suit.addTo(Card);
            });

            it("should allow for the setter to be called once after it is added to an object", function () {
                Card.suit("diamonds");
                expect(Card.suit()).toBe("diamonds");
            });
            
            it("should still validate it the first time it is set", function () {
                expect(function () {
                    Card.suit("notARealRank");
                }).toThrow(new Error("validator failed with parameter notARealRank"));
            });
            
            it("should throw an error if the setter is called once the attribute is set", function () {
                Card.suit("diamonds");
                expect(function () {
                    Card.suit("hearts");
                }).toThrow(new Error("cannot set the immutable property suit after it has been set"));
            });
            
            it("should return the Attr object for chaining", function () {
                expect(suit.isReadOnly()).toBe(suit);
            });
        });

        describe("on method", function () {
            var name, 
                obj,
                obj2,
                getSpy,
                setSpy;

            beforeEach(function () {
                name = new Attr("name").which.isA("string");
                obj = {};
                obj2 = {};
                setSpy = jasmine.createSpy();
                getSpy = jasmine.createSpy();
            });
            
            it("should be defined", function () {
                expect(name.on).not.toBe(undefined);
            });
            
            it("should throw an error if the event parameter is not 'set' or " + 
               "'get'", function () {
                   expect(function () {
                       name.on("sets", function () {});
                   }).toThrow("Attr: first argument to the 'on' method should " + 
                              "be 'set' or 'get'");
                   
                   expect(function () {
                       name.on("set", function () {});
                   }).not.toThrow();
                   
                   expect(function () {
                       name.on("get", function () {});
                   }).not.toThrow();
               });
            
            it("should throw an error if the listener parameter is not a " + 
               "function", function () {
                   expect(function () {
                       name.on("set", 6);
                   }).toThrow("Attr: second argument to the 'on' method should " +
                              "be a function");
                   
                   expect(function () {
                       name.on("set", function () {});
                   }).not.toThrow();
               });
            
            it("should call the set listener when the attribute is set", function () {
                name.on("set", setSpy);
                name.on("get", getSpy);
                
                name.addTo(obj);
                
                obj.name("semmy");
                expect(setSpy).toHaveBeenCalled();
                expect(setSpy).toHaveBeenCalledWith("semmy", undefined);
                expect(getSpy).not.toHaveBeenCalled();
            });
            
            it("should call the get listener when the attribute is set", function () {
                name.on("set", setSpy);
                name.on("get", getSpy);
                
                name.addTo(obj);
                
                obj.name("semmy");
                expect(setSpy).toHaveBeenCalled();
                expect(getSpy).not.toHaveBeenCalled();
                expect(setSpy).toHaveBeenCalledWith("semmy", undefined);
                obj.name();
                expect(getSpy).toHaveBeenCalled();
                expect(getSpy).toHaveBeenCalledWith("semmy");
            });
            
            it("should work on multiple attributes", function () {
                var age = new Attr("age").which.isAn("integer"),
                    ageSpy = jasmine.createSpy();
                
                name.on("set", setSpy);
                name.on("get", getSpy);
                age.on("set", ageSpy);
                age.on("get", ageSpy);
                
                name.addTo(obj);
                age.addTo(obj);
                
                obj.age(50);
                expect(setSpy).not.toHaveBeenCalled();
                expect(getSpy).not.toHaveBeenCalled();
                expect(ageSpy).toHaveBeenCalled();
                expect(ageSpy).toHaveBeenCalledWith(50, undefined);
                
                obj.name("semmy");
                expect(setSpy).toHaveBeenCalled();
                expect(getSpy).not.toHaveBeenCalled();
                expect(setSpy).toHaveBeenCalledWith("semmy", undefined);
                obj.name();
                expect(getSpy).toHaveBeenCalled();
                expect(getSpy).toHaveBeenCalledWith("semmy");
                
                obj.age();
                expect(setSpy.callCount).toBe(1);
                expect(getSpy.callCount).toBe(1);
                expect(ageSpy.callCount).toBe(2);
            });

            it("should work when the attribute is added to multiple objects, " + 
               "the 'this' reference should point to the calling object", function () {
                   name.on("set", function (newValue) {
                       setSpy(newValue, this);
                   });
                   
                   name.addTo(obj);
                   name.addTo(obj2);
                   
                   obj.name("hello");
                   expect(setSpy).toHaveBeenCalled();
                   expect(setSpy).toHaveBeenCalledWith("hello", obj);
                   
                   obj2.name("world");
                   expect(setSpy.callCount).toBe(2);
                   expect(setSpy).toHaveBeenCalledWith("world", obj2);
                   
                   expect(setSpy).not.toHaveBeenCalledWith("hello", obj2);
                   expect(setSpy).not.toHaveBeenCalledWith("world", obj);
               });
            
            it("should call the listener with the newly set value AND the old value", function () {
                name.on("set", setSpy);
                name.addTo(obj);
                name.addTo(obj2);
                
                obj.name("semmy");
                expect(setSpy.callCount).toBe(1);
                expect(setSpy).toHaveBeenCalledWith("semmy", undefined);
                obj.name("mark");
                expect(setSpy.callCount).toBe(2);
                expect(setSpy).toHaveBeenCalledWith("mark", "semmy");
                obj.name("john");
                expect(setSpy.callCount).toBe(3);
                expect(setSpy).toHaveBeenCalledWith("john", "mark");
            });
            
            it("should call the appropriate listener when setting up a default value", function () {
                name.defaultsTo("hello world!");
                name.on("set", setSpy);
                name.addTo(obj);
                
                expect(setSpy).toHaveBeenCalled();
                expect(setSpy).toHaveBeenCalledWith("hello world!", undefined);
            });
        });
    });

    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////// END MODIFIER TESTS /////////////////////////////
    ////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////// GETTER TESTS ///////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    describe("Getter Tests", function () {
        describe("name method", function () {
            it("should return the name of the attribute", function () {
                expect(suit.name()).toBe("suit");
            });
        });

        describe("validator method", function () {
            it("should return the validator function", function () {
                expect(typeof(suit.validator())).toBe('function');
            });
        });
    });

    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////// END GETTER TESTS ///////////////////////////////
    ////////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////// SYNTACTIC SUGAR TESTS //////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    describe("Syntactic Sugar Tests", function () {
        describe("and syntactic sugar", function () {
            it("should return the object", function () {
                expect(suit.and).toEqual(suit);
            });
        });

        describe("which syntactic sugar", function () {
            it("should return the object", function () {
                expect(suit.which).toEqual(suit);
            });
        });

        describe("isImmutable syntactic sugar", function () {
            it("should be equal to isReadOnly", function () {
                expect(suit.isImmutable).toBe(suit.isReadOnly);
            });
        });

        describe("isMutable syntactic sugar", function () {
            it("should be equal to isWritable", function () {
                expect(suit.isMutable).toBe(suit.isWritable);
            });
        });
    });

    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////// END SYNTACTIC SUGAR TESTS //////////////////////
    ////////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////// UTILITY TESTS //////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    describe("Utility Tests", function () {
        describe("clone method", function () {
            it("should clone all aspects of the attribute and return a new one", function () {
                var attribute = new Attr("test"),
                    validator = function () {
                        this.message = "5 must be greater than 3";
                        return 5 > 3;
                    },
                    def = 5,
                    clonedAttr,
                    objA = {},
                    objB = {};

                attribute.validatesWith(validator).and.defaultsTo(def);
                clonedAttr = attribute.clone();
                
                expect(clonedAttr.validator()()).toBe(true);
                
                attribute.addTo(objA);
                clonedAttr.addTo(objB);
                
                expect(objA.test()).toBe(def);
                expect(objB.test()).toBe(def);
                expect(objA.test()).toEqual(objB.test());
            });
        });        

        describe("addTo method", function () {
            it("should throw an error if the argument is not an object", function () {
                expect(function () {
                    suit.addTo();
                }).toThrow(new Error("Attr: addAttr method requires an object parameter"));
                
                expect(function () {
                    suit.addTo(5);
                }).toThrow(new Error("Attr: addAttr method requires an object parameter"));
            });

            it("should add the attribute to the specified object", function () {
                suit.addTo(Card);
                expect(Card.suit).not.toBeUndefined();
            });

            it("should default the value of the attribute to undefined, unless specified " +
               " otherwise", function () {
                suit.addTo(Card);
                expect(Card.suit()).toBeUndefined();
            });
        });
    });

    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////// END UTILITY TESTS //////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////// POST ADDTO TESTS //////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    describe("Post-addTo Tests", function () {
        it("should correctly set the attribute, even if it is falsy", function () {
            var attr = new Attr("x"),
                obj = {};
            attr.addTo(obj);
            obj.x(0);
            expect(obj.x()).toBe(0);
        });

        it("should allow the resulting value to be set to null, assuming it passes validator", function () {
            var attr = new Attr("name");
            attr.addTo(obj);
            expect(obj.name).toBeDefined();
            expect(function () {
                obj.emitter = function () {
                    return new EventEmitter();
                };
                obj.on = obj.emitter().on;
                obj.name(null);
            }).not.toThrow();
        });

        it("should throw an error if the set value doesn't pass the validator", function () {
            suit.validatesWith(function (suit) {
                return suits.indexOf(suit) > 0;
            });
            suit.addTo(Card);
            expect(function () {
                Card.suit(4);
            }).toThrow();
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////// END POST ADDTO TESTS //////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////////////////////
    /////////////////////// EXAMPLE TESTS /////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    describe("Example Tests", function () {
        describe("Example One", function () {
            it("should work with this example", function () {
                rank = new Attr("rank").which.isA('string').and.isOneOf(ranks);
                suit = new Attr("suit").which.isA('string').and.isOneOf(suits);
                
                rank.addTo(Card);
                suit.addTo(Card);
                
                Card.rank("5").suit("clubs");
                expect(Card.suit()).toEqual("clubs");
                expect(Card.rank()).toEqual("5");

                expect(function () {
                    Card.rank(5);
                }).toThrow();
                
                expect(function () {
                    Card.rank("5");
                }).not.toThrow();
            });
        });
    });


    ///////////////////////////////////////////////////////////////////////////
    /////////////////////// END EXAMPLE TESTS /////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
});

},{"../../src/core/attr.js":8,"../../src/util/event_emitter.js":13}],2:[function(require,module,exports){
/*global describe, it, beforeEach, expect, xit, jasmine */

var AttrList = require('../../src/core/attr_list.js');
var Attr = require('../../src/core/attr.js');

describe("AttrList", function () {
    "use strict";
    var al,
        obj;

    beforeEach(function () {
        al = new AttrList("friends");
        obj = {};
        al.addTo(obj);
    });

    it("should be an Attr object", function () {
        expect(al instanceof Attr).toBe(true);
    });

    it("should have a pop function", function () {
        expect(obj.friends().pop).not.toBeUndefined();
    });

    it("should have a validateWith function which is an alias for validatesWith", function () {
        expect(al.validateWith).toBe(al.validatesWith);
    });

    describe("eachOfWhich syntactic sugar", function () {
        it("should return the object", function () {
            expect(al.eachOfWhich).toEqual(al);
        });
    });

    describe("size method", function () {
        it("should be initialized to 0", function () {
            expect(obj.friends().size()).toEqual(0);
        });

        it("should increase when an object is added", function () {
            var size = obj.friends().size();
            obj.friends().add("john");
            expect(obj.friends().size()).toEqual(size+1);
        });

        xit("should decrease when an object is removed", function () {

        });
    });

    describe("at method", function () {
        it("should return the element at a given index", function () {
            obj.friends().add("john");
            expect(obj.friends().at(0)).toEqual("john");
            obj.friends().add("semmy");
            expect(obj.friends().at(0)).toEqual("john");
            expect(obj.friends().at(1)).toEqual("semmy");
            obj.friends().add("mark");
            expect(obj.friends().at(0)).toEqual("john");
            expect(obj.friends().at(1)).toEqual("semmy");
            expect(obj.friends().at(2)).toEqual("mark");
        });

        it("should throw an exception if the parameter is out of bounds", function () {
            obj.friends().add("john");
            obj.friends().add("semmy");

            expect(function() {
                obj.friends().at(-1);
            }).toThrow(new Error("AttrList: Index out of bounds"));

            expect(function() {
                obj.friends().at(1);
            }).not.toThrow(new Error("AttrList: Index out of bounds"));
  
            expect(function() {
                obj.friends().at(2);
            }).toThrow(new Error("AttrList: Index out of bounds"));
        });
    });



    describe("add method", function () {
        it("should add an element to the end of the list", function () {
            obj.friends().add("john");
            expect(obj.friends().at(obj.friends().size()-1)).toEqual("john");
            obj.friends().add("semmy");
            expect(obj.friends().at(obj.friends().size()-2)).toEqual("john");
            expect(obj.friends().at(obj.friends().size()-1)).toEqual("semmy");
        });

        it("should call the validator function", function () {
            var v = jasmine.createSpy();
            var t = function (friend) {
                v();
                return true;
            };

            al.validatesWith(t);
            al.addTo(obj);
            obj.friends().add("john");
            expect(v).toHaveBeenCalled();

        });

        it("should throw an error when the object does not pass validation", function () {
            expect(function () {
                al.validatesWith(function (friend) {
                    this.message = "Invalid";
                    return typeof(friend) === 'string';
                });
                al.addTo(obj);
                obj.friends().add(1);
            }).toThrow(new Error("Invalid"));
        });
    });

    describe("on method", function () {
        var addSpy,
            addSpy2,
            al2,
            obj2;

        beforeEach(function () {
            addSpy = jasmine.createSpy();
            al = new AttrList("friends");
        });

        it("should throw an error if the event parameter is not 'add'", function () {
            expect(function () {
                al.on("set", function () {});
            }).toThrow(new Error("AttrList: 'on' only responds to 'add' event"));

            expect(function () {
                al.on("add", function () {});
            }).not.toThrow(new Error("AttrList: 'on' only responds to 'add' event"));
        });

        it("should throw an error if the listener parameter is not a function", function () {
            expect(function () {
                al.on("add", 5);
            }).toThrow(new Error("AttrList: 'on' requires a listener function as the second parameter"));

            expect(function () {
                al.on("add", function () {});           
            }).not.toThrow();
        });

        it("should call the add listener when an element is added to the list", function () {
            al.on("add", addSpy);
            al.addTo(obj);

            obj.friends().add("john");

            expect(addSpy).toHaveBeenCalled();
            expect(addSpy.callCount).toBe(1);
        });

        it("should call the add listener with the new element that was added along with the new size", function () {
            al.on("add", addSpy);
            al.addTo(obj);

            obj.friends().add("mark");
            expect(addSpy.callCount).toBe(1);
            expect(addSpy).toHaveBeenCalledWith("mark", 1);
        });

        it("should work for multiple attr_list objects", function () {
            al2 = new AttrList("colleagues");
            obj2 = {};
            addSpy2 = jasmine.createSpy();
            al.on("add", addSpy);
            al2.on("add", addSpy2);

            al.addTo(obj);
            al2.addTo(obj2);

            obj.friends().add("semmy");
            obj2.colleagues().add("dean");

            expect(addSpy).toHaveBeenCalled();
            expect(addSpy2).toHaveBeenCalled();
            expect(addSpy.callCount).toBe(1);
            expect(addSpy2.callCount).toBe(1);
            expect(addSpy).toHaveBeenCalledWith("semmy", 1);
            expect(addSpy2).toHaveBeenCalledWith("dean", 1);

            obj2.colleagues().add("rebecca");
            expect(addSpy.callCount).toBe(1);
            expect(addSpy2.callCount).toBe(2);
            expect(addSpy2).toHaveBeenCalledWith("dean", 1);
            expect(addSpy2).toHaveBeenCalledWith("rebecca", 2);
        });

        it("should work when the attr_list is added to multiple object", function () {
            al.on("add", function (newValue, newSize) {
                addSpy(newValue, newSize, this);
            });

            obj2 = {};

            al.addTo(obj);
            al.addTo(obj2);

            obj.friends().add("mark");
            obj2.friends().add("semmy");

            expect(obj.friends().size()).toBe(1);
            expect(obj2.friends().size()).toBe(1);
            expect(addSpy.callCount).toBe(2);
            expect(addSpy).toHaveBeenCalledWith("mark", 1, obj);
            expect(addSpy).toHaveBeenCalledWith("semmy", 1, obj2);
        });
    });


    describe("addTo method", function () {
        var Person = {};

        it("should add the AttrList to the specified object", function () {
            al.addTo(Person);
            expect(Person.friends).not.toBeUndefined();
            expect(Person.friends().add).not.toBeUndefined();
            expect(Person.friends().at).not.toBeUndefined();
            expect(Person.friends().size).not.toBeUndefined();
        });

        it("should not add any additional AttrList functions to the specified object", function () {
            al.addTo(Person);
            expect(Person.friends().validatesWith).toBeUndefined();
        });


        it("should accept the creation of two lists on the same object", function() {
            var al2 = new AttrList("cats");
            al.addTo(Person);
            al2.addTo(Person);
            expect(Person.friends).not.toBeUndefined();
            expect(Person.cats).not.toBeUndefined();
        });

        //test for the inheritance bug
        it("should allow for multiple attr_lists to be created", function () {
            var al2 = new AttrList("suit");
            
            al.validatesWith(function (suit) {
                return (suit === "diamonds");
            });

            expect(al.validator() !== al2.validator()).toBe(true);
        });

        it("should throw an error if the parameter is not an object", function () {
            expect(function () {
                al.addTo(5);
            }).toThrow(new Error("AttrList: addTo method requires an object parameter"));
        });

    });

    describe("replace method", function () {
        it("should replace the element at the specified index", function () {
            obj.friends().add("john");
            obj.friends().add("semmy");
            expect(obj.friends().at(0)).toEqual("john");
            expect(obj.friends().at(1)).toEqual("semmy");
            expect(obj.friends().size()).toEqual(2);
            obj.friends().replace(0, "mark");
            expect(obj.friends().at(0)).toEqual("mark");
            expect(obj.friends().at(1)).toEqual("semmy");
            expect(obj.friends().size()).toEqual(2);

            obj.friends().add("larry");
            expect(obj.friends().at(0)).toEqual("mark");
            expect(obj.friends().at(1)).toEqual("semmy");
            expect(obj.friends().at(2)).toEqual("larry");
            expect(obj.friends().size()).toEqual(3);
            obj.friends().replace(2, "curly");
            expect(obj.friends().at(0)).toEqual("mark");
            expect(obj.friends().at(1)).toEqual("semmy");
            expect(obj.friends().at(2)).toEqual("curly");
            expect(obj.friends().size()).toEqual(3);
        });

        it("should throw an error when the index is not an integer", function () {
            al.validatesWith(function (friend) {
                this.message = "Invalid";
                return typeof(friend) === 'string';
            });
            al.addTo(obj);
            obj.friends().add("larry");
            obj.friends().add("curly");
            obj.friends().add("moe");

            expect(function () {
                obj.friends().replace("john", "semmy");
            }).toThrow(new Error("AttrList: replace method requires index parameter to be an integer"));

            expect(function () {
                obj.friends().replace(1.5, "mark");
            }).toThrow(new Error("AttrList: replace method requires index parameter to be an integer"));
        });

        it("should throw an error when the index is out of bounds", function () {
            al.validatesWith(function (friend) {
                this.message = "Invalid";
                return typeof(friend) === 'string';
            });
            al.addTo(obj);
            obj.friends().add("larry");
            obj.friends().add("curly");
            obj.friends().add("moe");

            expect(function () {
                obj.friends().replace(4, "semmy");
            }).toThrow(new Error("AttrList: replace method index parameter out of bounds"));

            expect(function () {
                obj.friends().replace(-1, "mark");
            }).toThrow(new Error("AttrList: replace method index parameter out of bounds"));
        });

        it("should throw an error when the object does not pass validation", function () {
            al.validatesWith(function (friend) {
                this.message = "Invalid";
                return typeof(friend) === 'string';
            });
            al.addTo(obj);
            obj.friends().add("larry");
            obj.friends().add("curly");
            obj.friends().add("moe");

            expect(function () {
                obj.friends().replace(1, 12);                
            }).toThrow(new Error("Invalid"));

            expect(function () {
                obj.friends().replace(2, ["john", "mark", "semmy"]);                
            }).toThrow(new Error("Invalid"));
        });
    });

    describe("toJSON method", function () {
        it("should return a JSON representation of the elements in the list", function () {
            var testObj = ["john", "semmy", "mark", "jim"];

            obj.friends().add("john");
            obj.friends().add("semmy");
            obj.friends().add("mark");
            obj.friends().add("jim");
            expect(obj.friends()).toBeDefined();

            expect(function () {
                obj.friends().toJSON();
            }).not.toThrow();

            expect(obj.friends().toJSON()).toEqual(testObj);

            
        });
    });

    describe("pop method", function () {
        it("should return the object which was popped", function () {
            var lastObj = "mark",
            poppedObj;
            obj.friends().add("john");
            obj.friends().add("semmy");
            obj.friends().add(lastObj);
            poppedObj = obj.friends().pop();
            expect(poppedObj).toEqual(lastObj);
        });

        it("should decrease the size of the attr_list", function () {
            var size;
            obj.friends().add("john");
            obj.friends().add("semmy");
            obj.friends().add("mark");
            size = obj.friends().size();
            obj.friends().pop();
            expect(obj.friends().size()).toEqual(size-1);
        });
    });
});

},{"../../src/core/attr.js":8,"../../src/core/attr_list.js":9}],3:[function(require,module,exports){
/*global describe, it, beforeEach, expect, xit, jasmine */

describe("Method", function () {
    "use strict";
    var Method = require('../../src/core/method.js'),
        Person,
        m;

    beforeEach(function () {
        m = new Method("runsForOffice", function() { return true; });
        Person = {};
    });

    it("should throw an error on an empty or no string parameter", function () {
        expect(function () {
            m = new Method();
        }).toThrow(new Error("Method: constructor requires a name parameter which must be a string"));

        expect(function () {
            m = new Method(5);
        }).toThrow(new Error("Method: constructor requires a name parameter which must be a string"));
    });

    it("should throw an error if the second parameter is not a function", function () {
        expect(function () {
            m = new Method("function", 5);
        }).toThrow(new Error("Method: second parameter must be a function"));
    });

    describe("addTo method", function () {
        it("should throw an error if the argument is not an object", function () {
            expect(function () {
                m.addTo();
            }).toThrow(new Error("Method: addTo method requires an object parameter"));

            expect(function () {
                m.addTo(5);
            }).toThrow(new Error("Method: addTo method requires an object parameter"));
        });

        it("should add the method to the specified object", function () {
            m.addTo(Person);
            expect(Person.runsForOffice).not.toBeUndefined();
        });
        
        it("should allow the method to be called from the specified object", function () {
            m.addTo(Person);
            expect(Person.runsForOffice()).toBe(true);
        });
    });
});

},{"../../src/core/method.js":10}],4:[function(require,module,exports){
/*global describe, it, beforeEach, expect, xit, jasmine, spyOn */

describe("Model", function () {
    "use strict";
    var Model = require('../../src/core/model.js'),
        Attr = require('../../src/core/attr.js'),
        AttrList = require('../../src/core/attr_list.js'),
        Method = require('../../src/core/method.js'),
        EventEmitter = require('../../src/util/event_emitter.js'),
        getModel = Model.getModel,
        getModels = Model.getModels,
        Person;


    beforeEach(function () {
        // this creates an anonymous model
        Person = new Model();
    });

    describe("#getModel", function () {
        it ("should return the specified model", function () {
            var Test = new Model("Test1"),
                Test2 = new Model("Test2");

            expect(getModel("Test1")).toEqual(Test);
            expect(getModel("Test2")).not.toEqual(Test);
            expect(getModel("Test2")).toEqual(Test2);
        });

        it ("should throw an error if the arg is not a string", function () {
            expect(function () {
                getModel(5);
            }).toThrow();
        });

        it ("should throw an error if the model is not found", function () {
            expect(function () {
                getModel("notAModel");
            }).toThrow(); 
        });
    });

    describe("#getModels", function () {
        it ("should return an array of the model names", function () {
            var Test = new Model("Test1"),
                Test2 = new Model("Test2"),
                Test3;

            expect(getModels().indexOf("Test1")).toBeGreaterThan(-1);
            expect(getModels().indexOf("Test2")).toBeGreaterThan(-1);
            expect(getModels().indexOf("Test3")).toBe(-1);
            Test3 = new Model("Test3");
            expect(getModels().indexOf("Test3")).toBeGreaterThan(-1);
        });
    });

    describe("#constructor", function () {
        describe("model name features", function () {
            it ("should allow for a string to be sent as a first arg",
                 function () {
                     expect(function () {
                         Person = new Model("Person");
                     }).not.toThrow();
                 }
            );

            it ("should allow a spec function to be sent in as a second arg",
                 function () {
                     var p;
                     expect(function () {
                         Person = new Model("Person", function () {
                             this.hasA("name").which.isA("string");
                             this.hasAn("age").which.isAn("integer");
                         });
                     }).not.toThrow();

                     p = new Person();
                     expect(p.age).not.toBeUndefined();
                     expect(p.name).not.toBeUndefined();
                 }
            );

            it ("should allow for multiple models to be created and stored",
                // this is for a bugfix
                function () {
                    var Dog;

                    Dog = new Model("Dog", function () {
                        this.hasA("name");
                    });

                    Person = new Model("Person", function () {
                        this.hasA("name");
                    });

                    expect(getModel("Person")).not.toBeUndefined();
                    expect(getModel("Dog")).not.toBeUndefined();
                }
            );

            it ("should store the model by its name if the name is specified",
                 function () {
                     var PersonAlias;

                     Person = new Model("Person");
                     PersonAlias = getModel("Person");
                     expect(Person).toEqual(PersonAlias);
                 }
            );

            it ("should overwrite the old model if the model constructor is " +
                 " called again", function () {
                     var Person2 = new Model("Person");
                     Person = new Model("Person");
                     expect(Person2).not.toEqual(getModel("Person"));
                 }
            );

            it ("should throw an error if the model name is not a string",
                 function () {
                     expect(function () {
                         Person = new Model(5);
                     }).toThrow();
                 }
            );


            it ("should throw an error if the spec function is not a function",
                 function () {
                     expect(function () {
                         Person = new Model("Person", 5);
                     }).toThrow();
                 }
            );
        });
    });

    describe("hasA method", function () {
        it("should create a new Attr with the specified name", function () {
            var a = Person.hasA("friend");
            expect(a instanceof Attr).toBe(true);
            expect(Person.attribute("friend")).not.toBeUndefined();
        });

        it("should add the attribute to the spec object", function () {
            Person.hasA("friend");
            expect(Person.attribute("friend")).not.toBeUndefined();
        });

        it("should return the Attr object so it can be cascaded with other functions", function () {
            var a = Person.hasA("friend");
            expect(a instanceof Attr).toBe(true);
            expect(Person.attribute("friend")).not.toBeUndefined();
            expect(a.validatesWith).not.toBeUndefined();
        });

        it("should throw an error if the parameter is not a string", function () {
            expect(function () {
                Person.hasA(5);
            }).toThrow(new Error("Model: hasA parameter must be a string"));
        });
    });

    describe("hasAn method", function () {
        it("should be an alias for the hasA method", function () {
            expect(this.hasAn).toEqual(this.hasA);
        });
    });

    describe("hasSome method", function () {
        it("should be an alias for the hasA method", function () {
            expect(this.hasSome).toEqual(this.hasA);
        });
    });

    describe("hasMany method", function () {
        it("should create a new AttrList object with the specified name", function () {
            var al = Person.hasMany("friends");
            expect(al instanceof AttrList).toBe(true);
        });

        it("should add the AttrList to the Model object", function () {
            Person.hasMany("friends");
            expect(Person.attribute("friends")).not.toBeUndefined();
            expect(Person.attribute("friends") instanceof AttrList).toBe(true);
        });

        it("should return the AttrList so it can be cascaded", function () {
            var al = Person.hasMany("friends");
            expect(al instanceof AttrList).toBe(true);
        });

        it("should be callable twice on the same spec", function() {
            var al = Person.hasMany("friends"),
            al2 = Person.hasMany("cats");

            expect(Person.attribute("friends")).not.toBeUndefined();
            expect(Person.attribute("cats")).not.toBeUndefined();
            expect(al instanceof AttrList).toBe(true);
            expect(al2 instanceof AttrList).toBe(true);
        });

        it("should be callable twice on 2 different specs", function() {
            var m2 = new Model(),
            al = Person.hasMany("friends"),
            al2 = m2.hasMany("cats");

            expect(Person.attribute("friends")).not.toBeUndefined();
            expect(m2.attribute("cats")).not.toBeUndefined();
            expect(al instanceof AttrList).toBe(true);
            expect(al2 instanceof AttrList).toBe(true);
        });

        it("should throw an error if the parameter is not a string", function () {
            expect(function () {
                Person.hasMany(5);
            }).toThrow(new Error("Model: hasMany parameter must be a string"));
        });
    });

    describe("attribute method", function () {
        it("should return the attribute object associated with the attribute name", function () {
            var a,
            al;

            Person.hasA("name");
            a = Person.attribute("name");
            expect(a instanceof Attr).toBe(true);
            expect(a instanceof AttrList).toBe(false);

            Person.hasMany("friends");
            al = Person.attribute("friends");
            expect(al instanceof Attr).toBe(true);
            expect(al instanceof AttrList).toBe(true);
        });

        it("should throw an error if the attribute doesn't exist", function () {
            var a;
            expect(function () {
                a = Person.attribute("name");
            }).toThrow(new Error("Model: attribute name does not exist!"));
        });

        it("should throw an error if the argument is not a string", function () {
            expect(function () {
                Person.attribute(5);
            }).toThrow(new Error("Model: expected string argument to attribute method, but recieved 5"));
        });
    });

    describe("attributes method", function () {
        it("should return an empty array if the model has no attributes", function () {
            expect(Person.attributes()).toEqual([]);
        });

        it("should return an array of Model attribute names", function () {
            Person.hasA("firstName");
            Person.hasA("lastName");
            Person.hasAn("id");
            expect(Person.attributes().length === 3).toBe(true);
            expect(Person.attributes().indexOf("firstName") > -1).toBe(true);
            expect(Person.attributes().indexOf("lastName") > -1).toBe(true);
            expect(Person.attributes().indexOf("id") > -1).toBe(true);
        });


        it("should work when the model is created using a specification function", function () {
            var Person = new Model(function () {
                this.hasA("firstName");
                this.hasA("lastName");
                this.hasAn("id");
            });

            expect(Person.attributes().length === 3);
            expect(Person.attributes().indexOf("firstName") > -1).toBe(true);
            expect(Person.attributes().indexOf("lastName") > -1).toBe(true);
            expect(Person.attributes().indexOf("id") > -1).toBe(true);
        });

        it("should return an array of Model attribute names even if created via a model specification", function () {
            var Person = new Model(function () {
                this.hasA("firstName");
                this.hasA("lastName");
                this.hasA("job");
            });

            var Employee = new Model(function () {
                this.isA(Person);
                this.hasA("salary");
            });

            Person.hasA("thing");

            expect(Person.attributes().length === 4).toBe(true);
            expect(Person.attributes().indexOf("firstName") > -1).toBe(true);
            expect(Person.attributes().indexOf("thing") > -1).toBe(true);
            expect(Person.attributes().indexOf("job") > -1).toBe(true);
        });
    });

    describe("methods method", function () {
        it("should return an empty array if the model has no methods", function () {
            expect(Person.methods()).toEqual([]);
        });

        it("should return an array of Model method names", function () {
            Person.respondsTo("runsForOffice", function () {});
            Person.respondsTo("somethingElse", function () {});
            expect(Person.methods().length === 2);
            expect(Person.methods().indexOf("runsForOffice") > -1).toBe(true);
            expect(Person.methods().indexOf("somethingElse") > -1).toBe(true);
        });
    });

    describe("method method", function () {
        it("should return the method object associated with the method name", function () {
            var m;
            Person.respondsTo("isAwesome", function () {
                return true;
            });

            m = Person.method("isAwesome");

            expect(m instanceof Method).toBe(true);
        });

        it("should throw an error if the method doesn't exist", function () {
            var m;
            expect(function () {
                m = Person.method("isAwesome");
            }).toThrow(new Error("Model: method isAwesome does not exist!"));
        });

        it("should throw an error if the argument is not a string", function () {
            expect(function () {
                Person.method(5);
            }).toThrow(new Error("Model: expected string argument to method method, but recieved 5"));
        });
    });

    describe("isA method", function () {
        var Person, 
            Employee,
            e,
            p;

        beforeEach(function () {
            Person = new Model(function () {
                this.hasA("firstName");
                this.hasA("lastName");
                this.hasMany("friends");

                this.respondsTo("sayHello", function () {
                    return "hello from " + this.firstName();
                });
            });
           
            Employee = new Model(function () {
                this.isA(Person);
                this.hasA("salary").which.validatesWith(function (salary) {
                    return typeof(salary) === "number";
                });

                this.respondsTo("sayHello", function () {
                    return "hello from employee " + this.firstName() + " who has salary " + this.salary();
                });
            });
        });

        it("should throw an error if the argument is not a Model", function () {
            expect(function () {
                Person = new Model(function () {
                    this.isA(5);
                });
            }).toThrow(new Error("Model: parameter sent to isA function must be a Model"));

            expect(function () {
                Person = new Model(function () {
                    this.isA(function () { });
                });
            }).toThrow(new Error("Model: parameter sent to isA function must be a Model"));

            expect(function () {
                Person = new Model(function () {
                    this.hasA("name");
                });

                Employee = new Model(function () {
                    this.isA(Person);
                    this.hasA("salary");
                });
            }).not.toThrow(new Error("Model: parameter sent to isA function must be a Model"));
        });

        it("should throw an error if multiple inheritance is attempted", function () {
            var Car = new Model(),
                Pickup = new Model(),
                ElCamino;
            
            expect(function () {
                ElCamino = new Model(function () {
                    this.isA(Car);
                    this.isA(Pickup);
                });
            }).toThrow("Model: Model only supports single inheritance at this time");
        });

        it("should give all properties of argument model to this model", function () {
            var e2;
            e = new Employee();
            p = new Person();

            expect(e.firstName).not.toBeUndefined();
            expect(e.lastName).not.toBeUndefined();
            expect(e.friends).not.toBeUndefined();
            expect(e.salary).not.toBeUndefined();
            expect(p.salary).toBeUndefined();


            e.firstName("Semmy").lastName("Purewal").salary(5000);
            p.firstName("John").lastName("Frimmell");
            expect(e.firstName()).toBe("Semmy");
            expect(e.lastName()).toBe("Purewal");
            expect(e.salary()).toBe(5000);
            expect(p.firstName()).toBe("John");
            expect(p.lastName()).toBe("Frimmell");

            e2 = new Employee();
            e2.firstName("Mark").lastName("Phillips").salary(5001);

            expect(e2.firstName()).toBe("Mark");
            expect(e2.lastName()).toBe("Phillips");
            expect(e2.salary()).toBe(5001);
            expect(e.firstName()).toBe("Semmy");
            expect(e.lastName()).toBe("Purewal");
            expect(e.salary()).toBe(5000);
        });

        it("methods in current model should override any methods in previous model", function () {
            e = new Employee();
            p = new Person();
            
            e.firstName("John").salary(5000);
            p.firstName("Semmy");

            expect(e.sayHello()).toEqual("hello from employee John who has salary 5000");
            expect(p.sayHello()).toEqual("hello from Semmy");
        });

        it("should not be immutable if the parent model is not immutable", function () {
            Person = new Model(function () {
                this.hasA("firstName");
                this.hasA("lastName");
                this.isImmutable();
                this.isBuiltWith("firstName", "lastName");
            });

            p = new Person("hello","world");
            expect(p.firstName()).toBe("hello");
            expect(p.lastName()).toBe("world");

            Employee = new Model(function () {
                this.isA(Person);
                this.hasA("salary");
                this.isBuiltWith("lastName");
            });

            expect(function () {
                p = new Person("semmy");
            }).toThrow("Constructor requires firstName, lastName to be specified");

            expect(function () {
                e = new Employee();
                e.lastName("hello");
                e.lastName("world");
            }).not.toThrow();

            expect(e.lastName()).toBe("world");

            expect(function () {
                p = new Person("john", "resig");
                p.lastName("smith");
            }).toThrow("cannot set the immutable property lastName after it has been set");

        });

        it("objects of the resulting model should be an instanceof argument model", function () {
            e = new Employee();
            p = new Person();
            expect(e instanceof Employee).toBe(true);
            expect(e instanceof Person).toBe(true);
            expect(p instanceof Person).toBe(true);
            expect(p instanceof Employee).toBe(false);
        });

        it("should allow for deeper inheritance hierarchies", function () {
            var A, B, C, D, E, a, b, c, d, e;

            A = new Model();
            B = new Model(function () {
                this.isAn(A);
            });
            C = new Model(function () {
                this.isA(B);
            });
            D = new Model(function () {
                this.isA(B);
            });
            E = new Model(function () {
                this.isA(D);
            });

            a = new A();
            b = new B();
            c = new C();
            d = new D();
            e = new E();
            
            expect(a instanceof A).toBe(true);
            expect(a instanceof B).toBe(false);
            expect(a instanceof C).toBe(false);
            expect(a instanceof D).toBe(false);
            expect(a instanceof E).toBe(false);
            expect(b instanceof B).toBe(true);
            expect(b instanceof A).toBe(true);
            expect(b instanceof C).toBe(false);
            expect(b instanceof D).toBe(false);
            expect(b instanceof E).toBe(false);
            expect(c instanceof C).toBe(true);
            expect(c instanceof B).toBe(true);
            expect(c instanceof D).toBe(false);
            expect(c instanceof E).toBe(false);
            expect(d instanceof A).toBe(true);
            expect(d instanceof B).toBe(true);
            expect(d instanceof C).toBe(false);
            expect(d instanceof D).toBe(true);
            expect(d instanceof E).toBe(false);
            expect(e instanceof A).toBe(true);
            expect(e instanceof B).toBe(true);
            expect(e instanceof C).toBe(false);
            expect(e instanceof D).toBe(true);
            expect(e instanceof E).toBe(true);

        });

        it("should create different attrs for each instance of the submodel", function () {
            var A,
                a1,
                a2,
                B,
                b1,
                b2;

            A = new Model(function () {
                this.hasA("thing");
            });

            B = new Model(function () {
                this.isAn(A);
            });

            a1 = new A();
            a2 = new A();

            expect(a1.thing()).toBeUndefined();
            expect(a2.thing()).toBeUndefined();
            a1.thing(5);
            expect(a1.thing()).toBeDefined();
            expect(a2.thing()).toBeUndefined();

            b1 = new B();
            b2 = new B();

            expect(b1.thing()).toBeUndefined();
            expect(b2.thing()).toBeUndefined();
            b1.thing(5);
            expect(b1.thing()).toBeDefined();
            expect(b2.thing()).toBeUndefined();
        });

        it("should create different attr lists for each instance of the submodel", function () {
            var A,
                a,
                B,
                b1,
                b2;

            A = new Model(function () {
                this.hasMany("things");
            });

            B = new Model(function () {
                this.isAn(A);
            });

            a = new A();
            expect(a.things).toBeDefined();
            expect(a.things().size()).toBe(0);

            a.things().add(5);
            a.things().add(6);
            expect(a.things().size()).toBe(2);

            b1 = new B();
            expect(b1.things).toBeDefined();
            expect(b1.things()).toBeDefined();
            expect(b1.things().size()).toBe(0);
            b1.things().add(7);
            expect(b1.things().size()).toBe(1);

            b2 = new B();
            expect(b2.things).toBeDefined();
            expect(b2.things().size()).toBe(0);
        });

        it("should offer access to the super classes initializer function", function () {
            var initializer,
                A,
                a,
                B,
                B2,
                b,
                b2,
                spy = jasmine.createSpy();
            
            initializer = function () {
                var i;
                for (i = 0; i < 10; ++i) {
                    this.things().add(i);
                }
                spy();
            };
            
            A = new Model(function () {
                this.hasMany("things").eachOfWhich.isA("number");
                this.isBuiltWith(initializer);
            });

            a = new A();
            expect(a.things()).toBeDefined();
            expect(spy).toHaveBeenCalled();
            expect(spy.calls.length).toEqual(1);
            expect(a.things().at(0)).toBe(0);
            expect(a.things().size()).toBe(10);

            B = new Model(function () {
                this.isAn(A);
                this.isBuiltWith(this.parent);
            });

            b = new B();
            expect(b.things()).toBeDefined();


            //this is 3 because it creates a prototype object, too
            expect(spy.calls.length).toEqual(3);
            expect(b.things().at(0)).toBe(0);
            expect(b.things().size()).toBe(10);

            B2 = new Model(function () {
                var that = this;

                this.isAn(A);
                this.isBuiltWith(function () {
                    that.parent.apply(this,arguments);
                });
            });

            b2 = new B2();

            //this is 5 because it creates a prototype object, too
            expect(spy.calls.length).toEqual(5);
            expect(b2.things().at(0)).toBe(0);
            expect(b2.things().size()).toBe(10);

            var c = new B();
            expect(c.things).toBeDefined();
            expect(c.things().at(0)).toBe(0);
            expect(c.things().size()).toBe(10);
            
            c.things().add(20);
            expect(c.things().size()).toBe(11);
            expect(a.things().size()).toBe(10);
            expect(b.things().size()).toBe(10);

            expect(c instanceof B).toBe(true);
            expect(b instanceof A).toBe(true);
            expect(b2 instanceof B2).toBe(true);
            expect(b instanceof B2).toBe(false);
            expect(b2 instanceof B).toBe(false);
        });

        ///hmmmmm
        xit("should not clobber constructor variables when parent initializer is called", function () {
            var Person, Employee, e;

            Person = new Model(function () {
                this.hasA("name");
                this.hasAn("age");
                this.isBuiltWith("name", function () {
                    this.age(18);
                });
            });

            Employee = new Model(function () {
                var that = this;

                this.isA(Person);

                this.isBuiltWith("name", function () {
                    that.parent.apply(this, [this.name()]);
                });
            });

            e = new Employee("Mark");

            expect(e.age()).toBe(18);
            expect(e.name()).toBe("Mark");
        });

        it("should not throw an error if isBuiltWith is specified in the super-model", function () {
            Person = new Model(function () {
                this.hasA("name");
                this.hasAn("id");
                this.isBuiltWith("name", "id");
            });

            Employee = new Model(function () {
                this.isA(Person);
                this.hasA("salary");
            });

            expect(function () {
                e = new Employee();
            }).not.toThrow(new Error("Constructor requires name to be specified"));

            expect(function () {
                p = new Person("semmy");
            }).toThrow(new Error("Constructor requires name, id to be specified"));
        });

        /* this feature has been deprecated until we can find a better way to 
         * allow for non primitive 'isA' types
         */
        xit("should allow circular isA references", function () {
            var Human, Ferret;

            Ferret = new Model();

            Human = new Model(function () {
                this.hasA("ferret").which.isA(Ferret);
                this.hasA("name").which.isA("string");
                this.isBuiltWith("name");
            });

            var Person = new Model(function () {
                this.hasA("ferret").which.validatesWith(function (ferret) {
                    return ferret instanceof Ferret;
                });
                this.hasA("name").which.isA("string");
                this.isBuiltWith("name");
            });

            Ferret = new Model(function () {
                this.hasA("owner").which.isA(Human);
                this.hasA("name").which.isA("string");
                this.isBuiltWith("name");
            });

            var ferret = new Ferret("moe");
            var human = new Human("curly");
            var person = new Person("larry");

            expect(function () {
                person.ferret(ferret);
            }).not.toThrow();
            human.ferret(ferret);
            ferret.owner(human);
        });
    });
        
    describe("isImmutable method", function ()  {
        it("should be defined", function () {
            expect(Person.isImmutable).toBeDefined();
        });

        it("should make all attributes immutable when the constructor is called", function () {
            var p,
                Person = new Model(function () {
                    this.isImmutable();
                    this.hasA("firstName");
                    this.hasA("lastName");
                    this.isBuiltWith("firstName", "lastName");
                });

            p = new Person("hello", "world");
            expect(p.firstName()).toBe("hello");
            expect(function () {
                p.firstName("newname");
            }).toThrow(new Error("cannot set the immutable property firstName after it has been set"));

            expect(p.lastName()).toBe("world");
            expect(function () {
                p.lastName("newlastname");
            }).toThrow(new Error("cannot set the immutable property lastName after it has been set"));
        });
    });


    describe("instance resulting from model", function () {
        describe("toJSON method", function () {
            var Dog;

            beforeEach(function () {
                Dog = new Model(function () {
                    this.hasA("name").which.isA("string");
                    this.hasAn("owner").which.validatesWith(function (owner) {
                        return owner instanceof Person;
                    });
                });

                Person.hasA("name").which.isA("string");
                Person.hasAn("id").which.isAn("integer");

                Person.hasA("dog").which.validatesWith(function (dog) {
                    return dog instanceof Dog;
                });
            });

            it("should exist", function () {
                var p = new Person();
                expect(p.toJSON).not.toBeUndefined();
            });

            it("should return a JSON object that includes all attributes of the model", function () {
                var p,
                    p2,
                    d = new Dog(),
                    pJSON,
                    dJSON;

                Person.hasA("friend").which.validatesWith(function (friend) {
                    return friend instanceof Person;
                });

                p = new Person();
                p2 = new Person();

                p2.name("Mark").id(5555);
                p.name("Semmy").id(1234).friend(p2);
                p2.friend(p);
                d.name("Gracie").owner(p);
                p.dog(d);
                p2.dog(d);

                pJSON = p.toJSON();
                dJSON = d.toJSON();
                expect(pJSON.name).not.toBe(undefined);

                expect(pJSON.name).toBe("Semmy");
                expect(pJSON.id).toBe(1234);
                expect(pJSON.dog).not.toBeUndefined();
                expect(pJSON.dog.name).toBe("Gracie");
                expect(pJSON.dog.owner).not.toBe(undefined);
                expect(pJSON.dog.owner.name).toBe("Semmy");
                expect(pJSON.dog.owner.dog).not.toBeUndefined();
                expect(pJSON.dog.owner.dog.name).toBe("Gracie");

                expect(dJSON.name).not.toBe(undefined);
                expect(dJSON.name).toBe("Gracie");
                expect(dJSON.owner).not.toBe(undefined);
                expect(dJSON.owner.name).toBe("Semmy");
            });


            it("should also work when the model instance has an attr_list", function () {
                var p,
                    p2,
                    pJSON;
                
                Person.hasMany("friends").eachOfWhich.validatesWith(function (friend) {
                    return friend instanceof Person;
                });

                Person.isBuiltWith("name", "id", "%dog", "%friends");
                Dog.isBuiltWith("name", "%owner");

                p = new Person("Semmy", 12345, new Dog("Gracie"), [new Person("Mark", 5555)]);

                pJSON = p.toJSON();
                expect(pJSON.name).toBe("Semmy");
                expect(pJSON.id).toBe(12345);
                expect(pJSON.dog.name).toBe("Gracie");
                expect(pJSON.friends).toBeDefined();
                expect(pJSON.friends.length).toBeDefined();
                expect(pJSON.friends.length).toBe(1);

                p2 = new Person("John", 7777, new Dog("Spot"));
                p2.friends().add(p);
                p.friends().add(p2);

                expect(p2.toJSON().friends).toBeDefined();
                expect(p2.toJSON().friends.length).toBeDefined();
                expect(p2.toJSON().friends.length).toBe(1);
                expect(p2.toJSON().friends[0].name).toBe("Semmy");

                expect(p.toJSON().friends.length).toBe(2);
                expect(p.toJSON().friends[1].name).toBe("John");
                expect(p.toJSON().friends[1].dog.name).toBe("Spot");
            });

            it("should not throw an error when called on a null value", function () {
                var p, pJSON;

                Person.hasA("nullValue");

                p = new Person();
                p.nullValue(null);

                expect(function () {
                    pJSON = p.toJSON();
                }).not.toThrow();

                expect(pJSON).not.toBeUndefined();
                expect(pJSON.nullValue).toBeNull();
            });
        });
    });

    describe("EventEmitter functionality", function () {
        var p,
            spy1,
            spy2;

        beforeEach(function () {
            Person.hasA("name");
            Person.hasAn("id");
            Person.hasA("friend");
            spy1 = jasmine.createSpy();
            spy2 = jasmine.createSpy();
        });


        // this is temporary until we get all the bugs
        // worked out with attr change listeners
        // right now, attr lists should not have change event listeners
        xit("should not add change listeners to attr list", function () {
            Person.hasMany("things");
            spyOn(Person.attribute("things"), "on");
            expect(Person.attribute("things").on).not.toHaveBeenCalled();
            var p = new Person();
            expect(Person.attribute("things").on).not.toHaveBeenCalled();            
        });

        // this was a bug, but I had to add to the public API
        xit("should not increment the listeners associated with the last object created", function () {
            var Dog = new Model(function () {
                this.hasA("breed").which.isA("string");
                this.isBuiltWith("breed");
            });

            var Person = new Model(function () {
                this.hasA("name").which.isA("string");
                this.hasA("dog").which.validatesWith(function (dog) {
                    return dog instanceof Dog;
                });
                this.isBuiltWith("name");
            });

            var s = new Person("Semmy");
            var m = new Person("Mark");
            var d1 = new Dog("chow");
            var d2 = new Dog("shepherd");

            s.dog(d1);

            expect(s.attrChangeListeners().dog).not.toBeUndefined();
            expect(m.attrChangeListeners().dog).toBeUndefined();
        });

        it("should create an object that has an 'on' method and an 'emitter' method", function () {
            p = new Person();
            expect(p.on).toBeDefined();
            expect(typeof(p.on)).toBe("function");
            expect(p.emitter).toBeDefined();
            expect(typeof(p.emitter)).toBe("function");
            expect(p.emitter() instanceof EventEmitter);
        });

        it("should create an object that emits a 'change' event when an attribute is changed", function () {
            p = new Person();
            p.on("change", spy1);
            p.name("semmy");
            p.id(1234);
            expect(spy1).toHaveBeenCalled();
            expect(spy1.callCount).toBe(2);
            expect(spy1).toHaveBeenCalledWith([{key:"name", value:"semmy", origin:p}]);
            expect(spy1).toHaveBeenCalledWith([{key:"id", value:1234, origin:p}]);
        });

        it("should emit appropriate events when it contains a submodel (hasA) that changes", function () {
            var Dog,
                d;

            Dog = new Model(function () {
                this.hasA("name");
                this.hasA("breed");
            });

            d = new Dog();
            d.name("Star").breed("Chow/Sheperd mix");

            Person.hasA("dog").which.validatesWith(function (dog) {
                return d instanceof Dog;
            });

            p = new Person();

            p.name("semmy").id(1234).dog(d);

            p.on("change", spy1);

            p.dog().name("Grace");
            expect(spy1).toHaveBeenCalled();
            expect(spy1).toHaveBeenCalledWith([{key:"name", value:"Grace", origin:d}, {key:"dog", origin:p}]);
        });

        it("should call an event emitter only when the instance of the model changes, not when an instance of another" +
           " model changes", function () {
            var p1, p2;
            p1 = new Person();
            p2 = new Person();

            p1.name("semmy");
            p2.name("mark");
            expect(spy1.callCount).toBe(0);
            expect(spy2.callCount).toBe(0);

            p1.on("change", spy1);
            p2.on("change", spy2);

            p1.name("bill");

            expect(spy1.callCount).toBe(1);
            expect(spy2.callCount).toBe(0);
        });

        it("should not emit infinite events on circular attributes", function () {
            var p1, p2;
            p1 = new Person();
            p2 = new Person();

            p1.name("semmy");
            p2.name("mark");

            expect(p1.emitter().listeners("change").length).toBe(0);
            expect(p2.emitter().listeners("change").length).toBe(0);

            expect(spy1.callCount).toBe(0);
            expect(spy2.callCount).toBe(0);

            p1.emitter().on("change", function (data) {
                spy1(data);
            });
            expect(p1.emitter().listeners("change").length).toBe(1);

            p2.emitter().on("change", spy2);

            expect(p2.emitter().listeners("change").length).toBe(1);

            p1.friend(p2);
            expect(spy1).toHaveBeenCalledWith([{key:"friend", value:p2, origin:p1}]);
            expect(p2.emitter().listeners("change").length).toBe(2);

            expect(spy1.callCount).toBe(1);
            expect(spy2.callCount).toBe(0);

            p2.name("mark");


            expect(spy2.callCount).toBe(1);
            expect(spy2).toHaveBeenCalledWith([{key:"name", value:"mark", origin:p2}]);

            expect(spy1.callCount).toBe(2);
            expect(spy1).toHaveBeenCalledWith([{key:"name", value:"mark", origin:p2}, {key:"friend", origin: p1}]);


            //should not cause an infinite loop
            p2.friend(p1);

            expect(spy2.callCount).toBe(2);
            expect(spy2).toHaveBeenCalledWith([{key:"friend", value:p1, origin:p2}]);
            expect(spy1.callCount).toBe(3);
            expect(spy1).toHaveBeenCalledWith([{key:"friend", value:p1, origin:p2}, {key:"friend", origin:p1}]);
        });

        it("should pass this second circular attribute test", function () {
            var Dog,
                Person,
                p1, p2,
                d1, d2, 
                spyp1 = jasmine.createSpy(),
                spyp2 = jasmine.createSpy(),
                spyd1 = jasmine.createSpy(),
                spyd2 = jasmine.createSpy();
            

            Dog = new Model(function () {
                this.hasAn("owner").which.validatesWith(function (owner) {
                    return owner instanceof Person;
                });
            });

            Person = new Model(function () {
                this.hasA("dog").which.validatesWith(function (dog) {
                    return dog instanceof Dog;
                });

                this.hasA("friend").which.validatesWith(function (friend) {
                    return friend instanceof Person;
                });
                
                this.respondsTo("hasADog", function (dog) {
                    this.dog(dog);
                    dog.owner(this);
                });

                this.respondsTo("isFriendsWith", function (friend) {
                    this.friend(friend);
                    friend.friend(this);
                });
            });

            p1 = new Person();
            p2 = new Person();
            d1 = new Dog();
            d2 = new Dog();

            p1.on("change", spyp1);
            d1.on("change", spyd1);
            p2.on("change", spyp2);
            d2.on("change", spyd2);

            p1.isFriendsWith(p2);
            expect(spyp1.callCount).toBe(2); //p1's friend changes, then p2 (a subobject of p1)'s friend changes
            expect(spyp1).toHaveBeenCalledWith([{key:"friend", value:p2, origin:p1}]);
            expect(spyp1).toHaveBeenCalledWith([{key:"friend", value:p1, origin:p2}, {key:"friend", origin:p1}]);
            expect(spyp2.callCount).toBe(1); //p2's friend changes
            expect(spyp2).toHaveBeenCalledWith([{key:"friend", value:p1, origin:p2}]);
            expect(spyd1.callCount).toBe(0);
            expect(spyd2.callCount).toBe(0);

            p1.hasADog(d1);
            expect(spyp1.callCount).toBe(4); //p1's dog changes, then d1 (a subobject of d1)'s dog changes
            expect(spyp1).toHaveBeenCalledWith([{key:"dog", value:d1, origin:p1}]);
            expect(spyp1).toHaveBeenCalledWith([{key:"owner", value:p1, origin:d1}, {key:"dog", origin:p1}]);

            expect(spyp2.callCount).toBe(3);
            expect(spyp2).toHaveBeenCalledWith([{key:"dog", value:d1, origin:p1}, {key:"friend", origin:p2}]);
            expect(spyp2).toHaveBeenCalledWith([{key:"owner", value:p1, origin:d1}, {key:"dog", origin:p1}, {key:"friend", origin:p2}]);


            expect(spyd1.callCount).toBe(1);
            expect(spyd1).toHaveBeenCalledWith([{key:"owner", value:p1, origin:d1}]);
            expect(spyd2.callCount).toBe(0); //no change spyd2

            p2.hasADog(d2);
            expect(spyp2.callCount).toBe(5);

            //as a result of p2's dog changing
            expect(spyp2).toHaveBeenCalledWith([{key:"dog", value:d2, origin:p2}]);
            expect(spyp1).toHaveBeenCalledWith([{key:"dog", value:d2, origin:p2}, {key:"friend", origin:p1}]);
            expect(spyd1).toHaveBeenCalledWith([{key:"dog", value:d2, origin:p2}, {key:"friend", origin:p1},
                                                {key:"owner", origin:d1}]);

            //as a result of d2's owner changing
            expect(spyd2.callCount).toBe(1);
            expect(spyd2).toHaveBeenCalledWith([{key:"owner", value:p2, origin:d2}]);
            expect(spyp2).toHaveBeenCalledWith([{key:"owner", value:p2, origin:d2}, {key:"dog", origin:p2}]);
           

            expect(spyp1.callCount).toBe(6);
            expect(spyp1).toHaveBeenCalledWith([{key:"owner", value:p2, origin:d2},{key:"dog", origin:p2},
                                                {key:"friend", origin:p1}]);
            expect(spyp1).toHaveBeenCalledWith([{key:"dog", value:d2, origin:p2}, {key:"friend", origin:p1}]);
        });

        it("should cascade 'change' events emitted from composed objects", function () {
            var Person,
                Dog,
                p,
                dog1,
                dog2,
                spy = jasmine.createSpy();

            Person = new Model(function () {
                this.hasA("name").which.isA("string");
                this.hasA("dog").which.validatesWith(function (dog) {
                    return dog instanceof Dog;
                });
                this.isBuiltWith("name");
            });

            Dog = new Model(function () {
                this.hasA("name").which.isA("string");
                this.isBuiltWith("name");
            });

            p = new Person("semmy");
            dog1 = new Dog("gracie");
            dog2 = new Dog("chico");

            p.on("change", spy);
            expect(p.emitter().listeners("change").length).toBe(1);

            expect(p.dog).toBeDefined();
            p.dog(dog1);
            expect(dog1.emitter().listeners("change").length).toBe(1);
            expect(p.dog()).toBe(dog1);
            expect(spy).toHaveBeenCalled();
            expect(spy.callCount).toBe(1);
            expect(spy).toHaveBeenCalledWith([{key:"dog", value:dog1, origin:p}]);

            dog1.name("ally");

            expect(spy.callCount).toBe(2);
            expect(spy).toHaveBeenCalledWith([{key:"name", value:"ally", origin:dog1}, {key:"dog", origin:p}]);

            expect(dog1.emitter().listeners("change").length).toBe(1);
            expect(dog2.emitter().listeners("change").length).toBe(0);
            p.dog(dog2);
            expect(dog1.emitter().listeners("change").length).toBe(0);
            expect(dog2.emitter().listeners("change").length).toBe(1);

            expect(spy.callCount).toBe(3);
            expect(spy).toHaveBeenCalledWith([{key:"dog", value:dog2, origin:p}]);

            //should not call the p's spy since dog1 is no longer attached to p1
            dog1.name("loki");
            expect(spy.callCount).toBe(3);

            dog2.name("layla");
            expect(spy.callCount).toBe(4);
            expect(spy).toHaveBeenCalledWith([{key:"name", value:"layla", origin:dog2}, {key:"dog", origin:p}]);

            p.dog(dog1);
            expect(spy.callCount).toBe(5);
            
            dog2.name("beau");
            expect(spy.callCount).toBe(5);

            dog1.name("howie");
            expect(spy.callCount).toBe(6);
        });


        it("should allow changes to and from null value without causing an error", function () {
            var p,
                Dog,
                d1, d2;

            Dog = new Model(function () {
                this.hasA("name").which.isA("string");
                this.isBuiltWith("name");
            });

            Person = new Model(function () {
                this.hasA("name").which.isA("string");
                this.hasA("dog").which.validatesWith(function (dog) {
                    return (dog instanceof Dog || dog === null);
                });
                this.isBuiltWith("name");
            });


            d1 = new Dog("Gracie");
            d2 = new Dog("Loki");

            expect(d1.emitter().listeners("change").length).toBe(0);
            expect(d2.emitter().listeners("change").length).toBe(0);

            p = new Person("Semmy");
            expect(p.dog()).toBeUndefined();
            p.dog(null);
           
            expect(p.dog()).toBeNull();

            expect(d1.emitter().listeners("change").length).toBe(0);
            expect(d2.emitter().listeners("change").length).toBe(0);

            expect(function () {
                p.dog(d1);
            }).not.toThrow();

            expect(p.dog().name()).toBe("Gracie");
            expect(d1.emitter().listeners("change").length).toBe(1);
            expect(d2.emitter().listeners("change").length).toBe(0);

            expect(function () {
                p.dog(null);
            }).not.toThrow();

            expect(d1.emitter().listeners("change").length).toBe(0);
            expect(d2.emitter().listeners("change").length).toBe(0);
            
            expect(p.dog()).toBe(null);

            p.dog(d2);

            expect(p.dog().name()).toBe("Loki");
            expect(d1.emitter().listeners("change").length).toBe(0);
            expect(d2.emitter().listeners("change").length).toBe(1);
        });


        it("should emit a change event when adding an element to a list", function () {
            var p,
                addSpy = jasmine.createSpy();

            Person = new Model(function () {
                this.hasA("name").which.isA("string");
                this.hasMany("aliases").eachOfWhich.isA("string");
            });

            p = new Person();

            p.on("change", addSpy);
            p.name("Semmy");

            expect(addSpy).toHaveBeenCalled();
            expect(addSpy.callCount).toBe(1);
            p.aliases().add("name1");
            expect(addSpy.callCount).toBe(2);
            expect(addSpy).toHaveBeenCalledWith([{key:"name", value:"Semmy", origin:p}]);
            expect(addSpy).toHaveBeenCalledWith([{action:"add", key:"aliases", value:"name1", origin:p}]);
        });

        it("should cascade change events when an object is added to a submodel's list", function () {
            var p,
                Dog,
                d,
                changeSpy = jasmine.createSpy();

            Dog = new Model(function () {
                this.hasA("name");
                this.hasMany("aliases").eachOfWhich.isA("string");
                this.isBuiltWith("name");
            });

            Person = new Model(function () {
                this.hasA("name").which.isA("string");
                this.hasA("dog").which.validatesWith(function (dog) {
                    return (dog instanceof Dog || dog === null);
                });
                this.isBuiltWith("name");
            });

            p = new Person("Semmy");
            p.on("change", changeSpy);
            
            d = new Dog("Loki");

            p.dog(d);
            expect(changeSpy).toHaveBeenCalled();
            expect(changeSpy.callCount).toBe(1);
            expect(changeSpy).toHaveBeenCalledWith([{key:"dog", value:d, origin:p}]);
            
            d.name("Gracie");
            expect(changeSpy.callCount).toBe(2);
            expect(changeSpy).toHaveBeenCalledWith([{key:"name", value:"Gracie", origin:d}, {key:"dog", origin:p}]);

            p.dog().aliases().add("Sugar Pie");
            expect(changeSpy.callCount).toBe(3);
            expect(changeSpy).toHaveBeenCalledWith([{action:"add", key:"aliases", value:"Sugar Pie", origin:d}, {key:"dog", origin:p}]);

            p.dog().aliases().add("Sweetie");
            expect(changeSpy.callCount).toBe(4);
            expect(changeSpy).toHaveBeenCalledWith([{action:"add", key:"aliases", value:"Sweetie", origin:d}, {key:"dog", origin:p}]);
        });


        describe("on method", function () {
            //this functionality is temporarily deprecated unless it is needed.
            //if it is, the current function can be replaced with this:
            /*var that = this;
              this.on = function (event, listener) {
                  that.emitter().on(event, function (data) {
                      listener.call(that, data);
                  });
              };*/
            it("should reference 'this' as the current object, and not the underlying event emitter", function () {
                var p = new Person();
                p.on("change", function () {
                    expect(this instanceof Person).toBe(true);
                });
                p.name("semmy");                
            });
        });


    });

    describe("isBuiltWith method", function () {
        it("should take any number of string parameters", function () {
            expect(function () {
                Person.isBuiltWith("larry", "moe", 3.4);
            }).toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional " +
                                 "final parameter"));
            expect(function () {
                Person.isBuiltWith("larry", 3.4, "moe", "curly");
            }).toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional " +
                                 "final parameter"));
            expect(function () {
                Person.isBuiltWith("larry", "moe", "curly", "semmy", "john");
            }).not.toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the " +
                                     "optional final parameter"));
            //s = new Model();
            expect(function () {
                Person.isBuiltWith("larry", "curly", "moe", "semmy", "john", "mark", "anotherMark");
            }).not.toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the " +
                                     "optional final parameter"));
        });


        it("should accept a function as an optional final argument", function () {
            var f = function () {
                return true;
            },  g = function () {
                return false;
            };
            expect(function () {
                Person.isBuiltWith("larry", "moe", f, g);
            }).toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional " +
                                 "final parameter"));
            expect(function () {
                Person.isBuiltWith("larry", "moe", g, "curly", "semmy", "john");
            }).toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional " + 
                                 "final parameter"));
            expect(function () {
                Person.isBuiltWith("larry", f);
            }).not.toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the " + 
                                     "optional final parameter"));
        });

        it("should accept strings preceded with a % as the final parameters before the optional function", function () {
            expect(function () {
                Person.isBuiltWith("larry", "%moe", "curly");
            }).toThrow(new Error("Model: isBuiltWith requires parameters preceded with a % to be the final " + 
                                 "parameters before the optional function"));
            expect(function () {
                Person.isBuiltWith("larry", "moe", "curly", "%semmy");
            }).not.toThrow(new Error("Model: isBuiltWith requires parameters preceded with a % to be the final " +
                                     "parameters before the optional function"));
            expect(function () {
                Person.isBuiltWith("larry", "moe", "curly", "%semmy", "%john", function () { return false; });
            }).not.toThrow(new Error("Model: isBuiltWith requires parameters preceded with a % to be the final " + 
                                     "parameters before the optional function"));
        });


    });


    describe("looksLike method", function () {
        xit("should be way more interesting than it currently is", function () {

        });
    });

    describe("validate method", function () {
        var Person,
        m;

        beforeEach(function () {
            Person = new Model();
        });

        it("should throw an error if the object is immutable and any of the attributes aren't required in isBuiltWith",
           function () {
            var p;
            Person.hasA("firstName");
            Person.hasA("lastName");
            Person.isImmutable();
            expect(function () {
                p = new Person();
            }).toThrow(new Error("immutable objects must have all attributes required in a call to isBuiltWith"));

            Person.isBuiltWith("firstName", "lastName");

            expect(function () {
                p = new Person("hello", "world");
            }).not.toThrow(new Error("immutable objects must have all attributes required in a call to isBuiltWith"));

            expect(function () {
                p = new Person("hello");
            }).toThrow("Constructor requires firstName, lastName to be specified");

            p = new Person("hello", "world");
            
            expect(function () {
                p.firstName("newName");
            }).toThrow("cannot set the immutable property firstName after it has been set");
        });

        it("should throw an error if any of the strings are not defined as attributes but are specified in " +
           "isBuiltWith", function () {
            Person.hasA("firstName");
            Person.hasA("lastName");
            Person.hasAn("id");
            Person.isBuiltWith("firstName","lastName","ied");
            expect(function () {
                Person.validate();
            }).toThrow(new Error("ied, specified in the isBuiltWith method, is not an attribute"));

            Person.isBuiltWith("firstName","lastName","id");
            expect(function () {
                Person.validate();
            }).not.toThrow(new Error("ied, specified in the isBuiltWith method, is not an attribute"));

            Person.isBuiltWith("firstName","lastName","%ied");
            expect(function () {
                Person = Person.validate();
            }).toThrow(new Error("ied, specified in the isBuiltWith method, is not an attribute"));

            Person.isBuiltWith("firstName","lastName","%id");
            expect(function () {
                Person = Person.validate();
            }).not.toThrow(new Error("ied, specified in the isBuiltWith method, is not an attribute"));
        });

        it("should throw an error on method/attribute name collisions", function () {
            Person.hasA("firstName");
            Person.respondsTo("firstName", function () {});
            expect(function () {
                Person.validate();
            }).toThrow(new Error("Model: invalid model specification to firstName being both an attribute and method"));
        });
    });

    describe("resulting constructor function", function () {
        var s,
        Person,
        p;

        beforeEach(function () {
            Person = new Model();
            Person.hasA("name").which.validatesWith(function (name) {
                this.message = "name must be at least 3 characters";
                return name.length > 3;
            });
            
            Person.hasAn("id").which.validatesWith(function (id) {
                this.message = "id must be 9 digits";
                return 100000000 <= id && id <= 999999999;
            });

            Person.hasMany("friends").which.validateWith(function (friend) {
                this.message = "friend must be a person";
                return friend instanceof Person;
            });

            Person.respondsTo("runsForOffice", function () {
                return this.name() + " is running for office!";
            });

            Person.respondsTo("returnsNull", function () {
                return null;
            });

            Person.respondsTo("addsTwoNumbers", function (numA, numB) {
                return numA+numB;
            });
            
            p = new Person();
            p.name("Mark");

        });

        it("should return a constructor function that creates an object with all attributes", function () {
            expect(p.name).not.toBeUndefined();
            expect(p.id).not.toBeUndefined();
            expect(p.friends).not.toBeUndefined();
            expect(p.friends().add).not.toBeUndefined();
        });

        it("should not add any additional Attr methods", function () {
            expect(Person.validator).toBeUndefined();
            expect(p.validator).toBeUndefined();
            expect(p.validatesWith).toBeUndefined();
            expect(p.which).toBeUndefined();
            expect(p.and).toBeUndefined();
        });

        it("should add all specified methods to the object", function () {
            expect(p.runsForOffice).not.toBeUndefined();
            expect(p.runsForOffice()).toEqual("Mark is running for office!");
            expect(p.returnsNull).not.toBeUndefined();
            expect(p.returnsNull()).toBe(null);
            expect(p.addsTwoNumbers(3,2)).toEqual(5);
        });

        it("should allow for an empty constructor", function () {
            expect(function () {
                var p = new Person();
            }).not.toThrow();
        });

        it("should require the constructor to be called with the non-% parameters", function () {
            var Person,
            p;

            Person = new Model();
            Person.hasA("firstName");
            Person.hasA("lastName");
            Person.hasAn("id");

            Person.isBuiltWith("firstName", "lastName", "%id");

            expect(function () {
                p = new Person("semmy");
            }).toThrow(new Error("Constructor requires firstName, lastName to be specified"));

            expect(function () {
                p = new Person("semmy","purewal");
            }).not.toThrow(new Error("Constructor requires firstName, lastName to be specified"));

            expect(function () {
                p = new Person("semmy","purewal", 100);
            }).not.toThrow(new Error("Constructor requires firstName, lastName to be specified"));
        });

        it("should throw an error if the constructor is called with more arguments than isBuiltWith specifies", 
           function () {
            var Person,
                p;
            Person = new Model(function () {
                this.hasA("name").which.isA("string");
                this.hasMany("friends").eachOfWhich.validateWith(function (friend) {
                    return friend instanceof Person;
                });
            });

            expect(function () {
                p = new Person("Semmy");
            }).toThrow("Too many arguments to constructor. Expected 0 required arguments and 0 optional arguments");

    });

        it("should set the attributes associated with the attributes to the appropriate values", function () {
            var Card,
            Thing,
            t1,
            t2,
            t3,
            c;

            s = new Model();
            s.hasA("rank");
            s.hasA("suit");
            s.isBuiltWith("rank","suit");

            Card = new Model();

            Card.hasA("rank");
            Card.hasA("suit");
            Card.isBuiltWith("rank","suit");

            c = new Card("ace", "diamonds");
            
            expect(c.rank()).toBe("ace");
            expect(c.suit()).toBe("diamonds");
            expect(c.hasA).toBe(undefined);
            expect(Card.hasA).not.toBe(undefined);

            Thing = new Model();
            Thing.hasA("thing1");
            Thing.hasA("thing2");
            Thing.hasA("thing3");
            Thing.isBuiltWith("thing1", "%thing2", "%thing3");

            t1 = new Thing(5);
            t2 = new Thing(10, 20);
            t3 = new Thing(20, 30, 40);

            expect(t1.thing1()).toBe(5);
            expect(t1.thing2()).toBe(undefined);
            expect(t1.thing3()).toBe(undefined);            
            expect(t2.thing1()).toBe(10);
            expect(t2.thing2()).toBe(20);
            expect(t2.thing3()).toBe(undefined);            
            expect(t3.thing1()).toBe(20);
            expect(t3.thing2()).toBe(30);
            expect(t3.thing3()).toBe(40);
        });

        it("should require that the resulting constructor's parameters pass the appropriate validators", function () {
            var thing1Validator = jasmine.createSpy(),
            thing2Validator = jasmine.createSpy(),
            thing3Validator = jasmine.createSpy(),
            Thing,
            t1,
            t2,
            t3;

            Thing = new Model();

            Thing.hasA("thing1").which.validatesWith(function () { thing1Validator(); return true; });
            Thing.hasA("thing2").which.validatesWith(function () { thing2Validator(); return true; });
            Thing.hasA("thing3").which.validatesWith(function () { thing3Validator(); return true; });
            Thing.isBuiltWith("thing1", "%thing2", "%thing3");

            //Thing = s.create();
            t1 = new Thing(10);
            expect(thing1Validator).toHaveBeenCalled();
            expect(thing2Validator).not.toHaveBeenCalled();
            expect(thing3Validator).not.toHaveBeenCalled();

            t2 = new Thing(10, 20);
            expect(thing1Validator).toHaveBeenCalled();
            expect(thing2Validator).toHaveBeenCalled();
            expect(thing3Validator).not.toHaveBeenCalled();

            t1 = new Thing(10, 20, 30);
            expect(thing1Validator).toHaveBeenCalled();
            expect(thing2Validator).toHaveBeenCalled();
            expect(thing3Validator).toHaveBeenCalled();
        });

        //think of the optional function as an initializer that is run after the attributes are set
        //for example, consider the Deck model. In addition to setting up the hasMany("cards") attribute,
        //we'll want to create a nested for loop that creates a card of each suit/rank combination
        //that would be the 'initializer' function
        it("should call the optional function after the attributes are set in the constructor", function () {
            var initializer = jasmine.createSpy(),
            Thing,
            t1, 
            t2,
            t3;

            Thing = new Model();
            Thing.hasA("thing1");
            Thing.hasA("thing2");
            Thing.hasA("thing3");
            Thing.isBuiltWith("thing1", "%thing2", "%thing3", initializer);

            //Thing = s.create();
            t1 = new Thing(5);
            expect(initializer).toHaveBeenCalled();

            t2 = new Thing(10, 20);
            expect(initializer).toHaveBeenCalled();

            t3 = new Thing(20, 30, 40);
            expect(initializer).toHaveBeenCalled();
        });

        it("should allow for AttrList attributes to be specified by isBuiltWith and initialized with a raw array",
           function () {
            var Devil,
                satan,
                p1, p2, p3;
            
            Devil = new Model(function () {
                this.hasA("number").which.isA("integer");
                this.hasMany("names").eachOfWhich.isA("string");
                this.isBuiltWith("number", "names");
            });

            expect(function () {
                satan = new Devil(666);
            }).toThrow("Constructor requires number, names to be specified");
            
            expect(satan).toBe(undefined);
            
            expect(function () {
                satan = new Devil(666, 667);
            }).toThrow("Model: Constructor requires 'names' attribute to be set with an Array");
            
            expect(function () {
                satan = new Devil(666, ["lucifer", "beelzebub", 3]);
            }).toThrow();

            expect(satan).toBe(undefined);

            expect(function () {
                satan = new Devil(666, ["beelzebub", "lucifer", "prince of darkness"]);
            }).not.toThrow();
            
            expect(satan).not.toBe(undefined);
            
            expect(satan.names().size()).toBe(3);
            
            Person.isBuiltWith("name", "id", "%friends");

            p1 = new Person("Mark", 123456789);
            p2 = new Person("John", 223456789);

            expect(function () {
                p3 = new Person("Semmy", 323456789, [p1, p2]);
            }).not.toThrow();

            expect(p3.friends().size()).toBe(2);
        });
    });



    it("should allow for a specification function to be sent in that bootstraps the model", function () {
        var Person,
            p;

        Person = new Model(function () {
            this.hasA("firstName");
            this.hasA("lastName");
            this.hasAn("id");
            this.hasMany("friends");
            this.isBuiltWith("firstName", "lastName", "%id");
        });

        p = new Person("Mark", "Phillips");

        expect(p instanceof Person).toBe(true);
        expect(p.firstName()).toBe("Mark");
        expect(p.lastName()).toBe("Phillips");
        expect(p.id()).toBe(undefined);
        expect(Person.hasA).not.toBe(undefined);
    });

    it("should throw an error if the specification parameter is not a function", function () {
        var s;
        expect(function () {
            s = new Model(5);
        }).toThrow("Model: specification parameter must be a function");
    });


    // change the API as per Effective JavaScript
    xit("should throw an error if the constructor is not called with the new operator", function () {
        var p;

        expect(function () {
            /*jshint newcap:false */
            p = Person();
        }).toThrow("Model: instances must be created using the new operator");
    });

    it("should have a constructor that is new agnostic", function () {
        var p;
        /*jshint newcap:false */
        p = Person();
        expect(p instanceof Person).toBe(true);
    });

    it("should not throw an error when a model has a submodel defined in defaultsTo that changes", function () {
        var Dog, p;

        Dog = new Model(function () {
            this.hasA("name").which.isA("string");
            this.isBuiltWith("name");
        });

        Person.hasA("dog").which.defaultsTo(function () {
            return new Dog("Loki");
        });

        p = new Person();
        expect(p.dog().name()).toBe("Loki");

        expect(function () {
            p.dog(new Dog("Gracie"));
        }).not.toThrow();
    });



    it("should work with this example", function () {
        var Card,
        Deck,
        d,
        i,
        j,
        suits = ["clubs", "diamonds", "hearts", "spades"],
        ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];


        Card = new Model();
        Card.hasA("suit").which.isA("string").and.isOneOf(suits);
        Card.isBuiltWith('rank','suit');
        Card.hasA("rank").which.isA("string").and.isOneOf(ranks);

        Card.looksLike(function () {
            return this.rank() + " of " + this.suit();
        });

        var c = new Card("5", "diamonds");
        expect(c.toString()).toBe("5 of diamonds");
        
        expect(function () {
            c.rank(10);
        }).toThrow();

        expect(function () {
            c.rank("10");
        }).not.toThrow();

        Deck = new Model(function () {
            //this.hasMany("cards").which.isA(Card);
            this.hasMany("cards").eachOfWhich.validateWith(function (card) {
                this.message = "a card must be a valid Card object.";
                return card instanceof Card;
            });

            this.isBuiltWith(function () {
                for (i = 0; i < suits.length; ++i) {
                    for (j = 0; j < ranks.length; ++j) {
                        this.cards().add(new Card(ranks[j], suits[i]));
                    }
                }
            });
        });

        d = new Deck();

        expect(d.cards().at(0).toString()).toEqual("2 of clubs");
        expect(d.cards().at(51).toString()).toEqual("A of spades");

        expect(function () {
            d.cards().add(5);
        }).toThrow("a card must be a valid Card object.");

        expect(d.cards().at(0).toJSON()).toEqual({rank:"2", suit:"clubs"});
        expect(d.toJSON().cards.length).toBe(52);
    });

    it("should also work with this example", function () {
        var Card,
            Deck,
            suits = ["clubs", "diamonds", "hearts", "spades"],
            ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
        
        Card = new Model(function () {
            this.isImmutable();
            this.hasA("suit").which.isOneOf(suits);
            this.hasA("rank").which.isOneOf(ranks);
            this.isBuiltWith("rank","suit");
            this.looksLike(function () {
                return this.rank() + " of " + this.suit();
            });

        });

        Deck = new Model(function () {
            var rank,
            suit;

            //this.hasMany("cards").eachOfWhich.isA(Card);
            this.hasMany("cards").eachOfWhich.validateWith(function (card) {
                return card instanceof Card;
            });

            this.isBuiltWith(function () {
                for (suit = 0; suit < suits.length; suit++) {
                    for (rank = 0; rank < ranks.length; rank++) {
                        this.cards().add(new Card(ranks[rank], suits[suit]));
                    }
                }
            });

            this.looksLike(function () {
                var card,
                result = "";

                for(card = 0; card < this.cards().size(); ++card) {
                    result += this.cards().at(card).toString() + "\n";
                }

                return result;
            });
        });

        var d = new Deck();

        expect(function () {
            d.cards().add(5);
        }).toThrow("validator failed with parameter 5");

        expect(function () {
            d.cards().at(5).suit("diamonds");
        }).toThrow("cannot set the immutable property suit after it has been set");
    });


    /* deprecated until we find a good solution */
    describe("Mark's isA/validator bug", function () {
        xit("should not throw an error", function () {
            var Dog = new Model(function() {
                this.hasA("name"); //bizarre
            });
            
            var Person = new Model(function() {
                this.hasA("dog").which.isA(Dog);
            });
            
            var d = new Dog();
            var p = new Person();
            p.dog(d);
        });
    });
});

},{"../../src/core/attr.js":8,"../../src/core/attr_list.js":9,"../../src/core/method.js":10,"../../src/core/model.js":11,"../../src/util/event_emitter.js":13}],5:[function(require,module,exports){
/*global describe, it, beforeEach, expect, xit, jasmine */


describe("Validator", function () {
    "use strict";
    var Validator = require('../../src/core/validator.js'),
        Model = require('../../src/core/model.js');

    xit("should throw an error on an empty parameter", function () {

    });

    xit("should throw an error on a non-function parameter", function () {

    });

    xit("should return a function object that has the specified message as" +
        " an attributes", function () {

    });


    describe("static addValidator method", function () {
        var trivialValidator = function () {
            return true;
        };

        it("should throw an error if the first parameter is absent or not a " +
           "string", function () {
            expect(function () {
                Validator.addValidator();
            }).toThrow(new Error("addValidator requires a name to be " + 
                                 "specified as the first parameter"));

            expect(function () {
                Validator.addValidator(5);
            }).toThrow(new Error("addValidator requires a name to be " + 
                                 "specified as the first parameter"));
        });

        it("should throw an error if the second parameter is absent or not a " +
           "function", function () {
            expect(function () {
                Validator.addValidator("isGreaterThan");
            }).toThrow("addValidator requires a function as the second " +
                       "parameter");

            expect(function () {
                Validator.addValidator("isGreaterThan", 5);
            }).toThrow("addValidator requires a function as the second " + 
                       "parameter");
        });

        it("should add the validator object to the static validators list", 
           function () {
               expect(function () {
                   Validator.addValidator("isGreaterThan5", function (expected){
                       this.message = "Expected " + this.actual + " to be " +
                                      "greater than 5";
                       return this.actual > 5;
                   });
               }).not.toThrow();
           }
        );

        it("should throw an error if a validator is added that already exists", 
           function () {
               expect(function () {
                   Validator.addValidator("isGreaterThan5", function (thing) {
                       return false;
                   });
               }).toThrow("Validator 'isGreaterThan5' already defined");
           }
        );


        it("should accept a third arg that must be a function" , function () {
            expect(function () {
                Validator.addValidator("isLessThan5", function () {}, 5);
            }).toThrow();

            expect(function () {
                Validator.addValidator("isLessThan10", function () {}, 
                                       function () {});
            }).not.toThrow();
        });

        it("should call the argValidator on the expected val once added",
           function () {
               var argValidatorSpy = jasmine.createSpy(),
                   argValidator = function () {
                       argValidatorSpy.apply(argValidatorSpy,arguments);
                       return true;
                   };
               

               Validator.addValidator("exampleValidator", trivialValidator,
                                      argValidator);
               Validator.getValidator("exampleValidator")("example");
               expect(argValidatorSpy).toHaveBeenCalledWith("example");
           }
        );

        it("should throw an error if the argValidator fails",
           function () {
               var argValidator= function (arg) {
                   //only valid input to this validator
                   return arg === "test";
               };
           
               Validator.addValidator("exampleValidator2", trivialValidator,
                                      argValidator);
               
               expect(function () {
                   Validator.getValidator("exampleValidator2")("example");
               }).toThrow();

               expect(function () {
                   Validator.getValidator("exampleValidator2")("example");
               }).toThrow();
           }
        );
    });

    describe("static getValidator method", function () {
        it("should throw an error if there is no parameter specified",
           function () {
               expect(function () {
                   Validator.getValidator();
               }).toThrow("Validator: getValidator method requires a string " +
                          "parameter");
           }
        );

        it("should throw an error if the parameter is not a string",
           function () {
               expect(function () {
                   Validator.getValidator(5);
               }).toThrow("Validator: parameter to getValidator method must be" +
                          " a string");
           }
        );

        it("should throw an error if validator does not exist", function () {
            expect(function () {
                Validator.getValidator("nonExistentValidator");
            }).toThrow("Validator: 'nonExistentValidator' does not exist");
        });

        it("should return the specified validator function", function () {
            var v = Validator.getValidator("isGreaterThan5");
            expect(v).not.toBeUndefined();
            expect(v()(6)).toBe(true);
            expect(function () {
                v()(4);
            }).toThrow();
        });
    });

    describe("validators method", function () {
        xit("should return a list of validator names", function () {

        });
    });

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////// BUILT-IN VALIDATOR TESTS //////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    describe("built-in validators", function () {
        describe("#isGreaterThan", function () {
            it("it should throw if the arg is not greater than the parameter",
               function () {
                   var isGreaterThan = Validator.getValidator("isGreaterThan"),
                       isGreaterThan5 = isGreaterThan(5);
                   expect(function () {
                       isGreaterThan5(4);
                   }).toThrow("4 should be greater than 5");
                   
                   expect(function () {
                       isGreaterThan5(6);
                   }).not.toThrow();
               }
            );
        });

        describe("#isLessThan", function () {
            it("it should throw if the arg is not less than the parameter",
               function () {
                   var isLessThan5 = Validator.getValidator("isLessThan")(5),
                       isLessThan10 = Validator.getValidator("isLessThan")(10);
                   
                   expect(function () {
                       isLessThan5(6);
                   }).toThrow("6 should be less than 5");
                   
                   expect(function () {
                       isLessThan10(12);
                   }).toThrow("12 should be less than 10");
                   
                   expect(function () {
                       isLessThan10(8);
                   }).not.toThrow();
                   
                   expect(function () {
                       isLessThan5(4);
                   }).not.toThrow();
                   
               }
            );
        });

        describe("#isOneOf", function () {
            it("should throw if param does not come from the set", function () {
                var isOneOf = Validator.getValidator("isOneOf"),
                    isOneOfTester = isOneOf(["A","B","C"]);

                expect(function () {
                    isOneOfTester("D");
                }).toThrow("D should be one of the set: A,B,C");

                expect(function () {
                    isOneOfTester("A");
                }).not.toThrow();
            });
        });

        describe("#isA", function () {
            var isA;

            beforeEach(function () {
                isA = Validator.getValidator("isA");
            });

            it("it should throw an error if the param is not the correct type",
               function () {
                   expect(function () {
                       isA("number")(4);
                   }).not.toThrow();
                   
                   expect(function () {
                       isA("string")("hello");
                   }).not.toThrow("");
                   
                   expect(function () {
                       isA("number")("hello");
                   }).toThrow("hello should be a number");
               }
            );

            it ("should allow for model types to be sent in", function () {
                var a,
                    t,
                    Thing;

                Thing = Model("Thing", function () { });

                t = new Thing();

                expect(function () {
                    isA("Thing")(5);
                }).toThrow();
                
                expect(function () {
                    isA("Thing")(t);
                }).not.toThrow();
            });


            it("should throw an error if the parameter is a string and not" + 
               "one of the JS predefined types", function () {
                   expect(function () {
                       isA("nmbr");
                   }).toThrow();
               }
            );

            describe("integer validation", function() {
                it("should not throw an error when an integer is assigned",
                   function() {
                       expect(function () {
                           isA("integer")(-1);
                       }).not.toThrow();
                   }
                );

                it("should throw an error on a non-integer", function() {
                    expect(function () {
                        isA("integer")(-1.2);
                    }).toThrow(new Error("-1.2 should be an integer"));
                    expect(function () {
                        isA("integer")("fred");
                    }).toThrow(new Error("fred should be an integer"));
                });
            });
        });

        describe("#isAn", function () {
            it ("should be an alias for isA", function () {
                var isA = Validator.getValidator("isA"),
                    isAn = Validator.getValidator("isAn");

                expect(isA).toEqual(isAn);
            });
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////// END BUILT-IN VALIDATOR TESTS //////////////////////
    ///////////////////////////////////////////////////////////////////////////
});

},{"../../src/core/model.js":11,"../../src/core/validator.js":12}],6:[function(require,module,exports){
/*global describe, it, beforeEach, expect, xit, jasmine */

describe("event emitter", function () {
    "use strict";
    
    var EventEmitter = require('../../src/util/event_emitter.js'),
        e,
        listener1, listener2, listener3;

    beforeEach(function () {
        e = new EventEmitter();

        listener1 = function () { };
        
        listener2 = function () { };
        
        listener3 = function () { };
    });

    describe("constructor", function () {
        
    });

    describe("on method", function () {
        it("should register a callback on an event", function () {
            e.on("event", function () {});
            expect(e.listeners("event").length).toBe(1);
        });
        
        it("should register multiple callbacks for a single event", function () {
            e.on("event", function () { });
            e.on("event", function () { });
            expect(e.listeners("event").length).toBe(2);
        });
        
        it("should register callbacks for multiple events", function () {
            e.on("event1", function () { });
            e.on("event2", function () { });
            expect(e.listeners("event1").length).toBe(1);
            expect(e.listeners("event2").length).toBe(1);
        });

        it("should return an instance of EventEmitter so the call can be chained", function () {
            expect(e.on("event", function () {}) instanceof EventEmitter).toBeTruthy();
        });

        it("should register callbacks to be registered in a chain", function () {
            e.on("event1", function () { })
                .on("event2", function () { });
            expect(e.listeners("event1").length).toBe(1);
            expect(e.listeners("event2").length).toBe(1);           
        });

        it("should register multiple callbacks for a single event in a chain", function () {
            e.on("event", function () { })
                .on("event", function () { });
            expect(e.listeners("event").length).toBe(2);
        });

        it("should throw an error if the event is not a string", function () {
            expect(function () {
                e.on(1, function () { });
            }).toThrow(new Error("EventEmitter: first argument to 'on' should be a string"));
        });
        
        it("should throw an error if the listener is not a function", function () {
            expect(function () {
                e.on("event", 1);
            }).toThrow(new Error("EventEmitter: second argument to 'on' should be a function"));
        });
    });

    describe("addListener method", function () {
        it("should be an alias for the 'on' method", function () {
            expect(e.addListener).toBe(e.on);
        });
    });

    describe("once method", function () {

    });

    describe("removeListener method", function () {
        it("should throw an error if the first parameter is not a string", function () {
            expect(function () {
                e.removeListener(5);
            }).toThrow("EventEmitter: first parameter to removeListener method must be a string representing an event");
        });

        it("should throw an error if the second parameter is not a function", function () {
            expect(function () {
                e.removeListener("event1", 5);
            }).toThrow("EventEmitter: second parameter must be a function to remove as an event listener");
        });

        it("should throw an error if there are no listeners for that particular event", function () {
            expect(function () {
                e.removeListener("whatever", function () {});
            }).toThrow("EventEmitter: there are no listeners registered for the 'whatever' event");
        });

        it("should remove the listener from the event", function () {
            e.on("event", listener1);
            e.on("event", listener2);
            e.on("event", listener3);
            expect(e.listeners("event").length).toBe(3);
            e.removeListener("event", listener2);
            expect(e.listeners("event").length).toBe(2);
            expect(e.listeners("event").indexOf(listener2)).toBe(-1);
            e.removeListener("event", listener1);
            expect(e.listeners("event").length).toBe(1);
            expect(e.listeners("event").indexOf(listener1)).toBe(-1);
            e.removeListener("event", listener3);
            expect(e.listeners("event").length).toBe(0);
            expect(e.listeners("event").indexOf(listener3)).toBe(-1);
        });
    });
    
    describe("removeAllListeners method", function () {
        it("should throw an error if the parameter is not a string", function () {
            expect(function () {
                e.removeAllListeners(5);
            }).toThrow("EventEmitter: parameter to removeAllListeners should be a string representing an event");
        });

        it("should remove all listeners for the object", function () {
            e.on("event", listener1);
            e.on("event", listener2);
            e.on("event", listener3);
            e.removeAllListeners("event");
            expect(e.listeners("event").length).toBe(0);
        });
    });

    describe("setMaxListeners method", function () {

    });

    describe("listeners method", function () {
        it("should return the listeners for a given event", function () {
            var listener1 = function () {
            };
            
            var listener2 = function () {
            };
            
            e.on("event", listener1).on("event", listener2);
            expect(e.listeners("event").length).toBe(2);
            expect(e.listeners("event")).toEqual([listener1, listener2]);
        });

        it("should throw an error if the method is called without a string", function () {
            expect(function () { e.listeners(); }).toThrow(new Error("EventEmitter: listeners method must be called with the name of an event"));
        });
    });

    describe("once method", function () {
        var stubA;

        beforeEach(function () {
            stubA = jasmine.createSpy("stubA");
        });

        it("should call the listener when the event is emitted", function () {
            e.on("event1", stubA);
            e.emit("event1");
            expect(stubA).toHaveBeenCalled();
        });

        it("should remove the listener after the event is called", function () {
            e.once("event1", stubA);
            e.emit("event1");
            expect(stubA).toHaveBeenCalled();
            expect(e.listeners("event1").length).toBe(0);
        });

    });

    describe("emit method", function () {
        var stubA;
        var stubB;
        beforeEach(function () {
            stubA = jasmine.createSpy("stubA");
            stubB = jasmine.createSpy("stubB");
        });

        it("should respond with a correct listener and data when an event is emitted", function () {
            e.on("event1", stubA);
            e.emit("event1");
            expect(stubA).toHaveBeenCalled();
            e.emit("event1",5);
            expect(stubA).toHaveBeenCalledWith(5);
        });

        it("should not respond with incorrect listener when an event is emitted", function () {
            e.on("event1", stubA);
            e.on("event2", stubB);
            e.emit("event1");
            expect(stubA).toHaveBeenCalled();
            expect(stubB).not.toHaveBeenCalled();
        });

        it("should respond with all listeners when an event is emitted", function () {
            e.on("event1", stubA);
            e.on("event1", stubB);
            e.emit("event1", 5);
            expect(stubA).toHaveBeenCalledWith(5);
            expect(stubB).toHaveBeenCalledWith(5);
        });

        it("should be able to call listeners with multiple parameters", function () {
            e.on("event1", stubA);
            e.emit("event1", 5, "hello", 10);
            expect(stubA).toHaveBeenCalledWith(5, "hello", 10);
        });

        xit("should throw an error if the first parameter is not a string", function () {

        });

    });
});

},{"../../src/util/event_emitter.js":13}],7:[function(require,module,exports){
/*global describe, it, beforeEach, expect, xit, jasmine */

if (typeof(window) === "undefined") {
    // create mock window object for running tests outside of a browser
    window = {};
}

describe("namespace utility", function () {
    "use strict";

    var namespace = require('../../src/util/namespace.js');

    it("should throw an error on a malformed namespace string", function () {
        expect(function () {
            namespace("not;a;namespace", function () {});
        }).toThrow("namespace: not;a;namespace is a malformed namespace string");

        expect(function () {
            namespace("window.this.is.a.namespace", function () { });
        }).not.toThrow();

        expect(function () {
            namespace("aliases.testOne", function () {});
        }).not.toThrow();

        expect(function () {
            namespace("window", function () {});
        }).toThrow("namespace: window is a malformed namespace string");
    });

    it("should throw an error if the last parameter exists and is not a function", function () {
        expect(function () {
            namespace("this.is.a.test", "namespace");
        }).toThrow("namespace: second argument must be an object of aliased local namespaces");

        expect(function () {
            namespace("this.is.a.test", {}, function () {});
        }).not.toThrow();
    });

    it("should throw an error if the second argument exists, and a third function argument does not exist", function () {
        expect(function () {
            namespace("this.is.a.test", {});
        }).toThrow("namespace: if second argument exists, final function argument must exist");
    });

    it("should throw an error if the second parameter exists and is not an object when the last parameter is a function", function () {
        expect(function () {
            namespace("this.is.a.test", "string", function () {});
        }).toThrow("namespace: second argument must be an object of aliased local namespaces");
    });

    it("should create the appropriate namespace", function () {
        var ns = namespace("window.test", function (exports) {
            exports.message = "this is a message in the namespace";
        });

        expect(window.test).not.toBeUndefined();
        expect(window.test.message).not.toBeUndefined();
        expect(window.test.message).toBe("this is a message in the namespace");
    });

    it("should not throw an error on a single argument", function () {
        var ns = namespace("this.is.a.test");
    });

    it("should add the namespace to the window if it is not explicitly the first part of the namespace string", function () {
        var ns = namespace("newNameSpace", function (exports) {
            exports.message = "another test namespace";
        });

        expect(window.newNameSpace).not.toBeUndefined();
        expect(window.newNameSpace.message).toBe("another test namespace");
        expect(ns).toBe(window.newNameSpace);
        expect(ns.message).toBe("another test namespace");
    });

    it("should not overwrite an existing namespace on multiple calls", function () {
        var ns1, ns2;
        ns1 = namespace("test", function (exports) {
            exports.Test1 = function () {};
            exports.message1 = "hello world!";
        });

        ns2 = namespace("test", function (exports) {
            exports.Test2 = function () {};
            exports.message2 = "greetings planet!";
        });

        expect(window.test.Test1).not.toBeUndefined();
        expect(window.test.Test2).not.toBeUndefined();
        expect(window.test.message1).not.toBeUndefined();
        expect(window.test.message2).not.toBeUndefined();
    });

    it("should make the aliases accessible in the namespace function", function () {
        var ns1, ns2, ns3, nsFunction;
        nsFunction = function (ns) {
            var t = new this.Thing();

            expect(this.ns1).toBe(namespace("aliases.testOne"));
            expect(this.ns2).toBe(namespace("aliases.testTwo"));
            expect(this.ns2.Thing).not.toBeUndefined();
            expect(this.Thing).not.toBeUndefined();
            expect(t).not.toBeUndefined();
            ns.thing = this.ns2.Thing;
            ns.whatever = "hello world";
        };

        ns1 = namespace("aliases.testOne");
        ns2 = namespace("aliases.testTwo", function (exports) {
            exports.Thing = function () {};
        });

        ns3 = namespace("aliases.testThree",
                        { ns1: "aliases.testOne",
                          ns2: "aliases.testTwo",
                          Thing: "aliases.testTwo.Thing"
                        },
                        nsFunction);

        expect(ns3.whatever).not.toBeUndefined();
        expect(ns3.thing).not.toBeUndefined();
        expect(ns3.thing).toBe(ns2.Thing);
    });
});

},{"../../src/util/namespace.js":15}],8:[function(require,module,exports){
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

},{"./attr_list.js":9,"./validator.js":12}],9:[function(require,module,exports){
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

},{"./attr.js":8}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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



},{"../util/event_emitter.js":13,"../util/index_of.js":14,"./attr.js":8,"./attr_list.js":9,"./method.js":10}],12:[function(require,module,exports){
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

},{"../util/index_of.js":14,"./model.js":11}],13:[function(require,module,exports){
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

},{"./index_of.js":14}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}]},{},[1,2,3,4,5,6,7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNwZWMvY29yZS9hdHRyLXNwZWMuanMiLCJzcGVjL2NvcmUvYXR0cl9saXN0LXNwZWMuanMiLCJzcGVjL2NvcmUvbWV0aG9kLXNwZWMuanMiLCJzcGVjL2NvcmUvbW9kZWwtc3BlYy5qcyIsInNwZWMvY29yZS92YWxpZGF0b3Itc3BlYy5qcyIsInNwZWMvdXRpbC9ldmVudF9lbWl0dGVyLXNwZWMuanMiLCJzcGVjL3V0aWwvbmFtZXNwYWNlLXNwZWMuanMiLCJzcmMvY29yZS9hdHRyLmpzIiwic3JjL2NvcmUvYXR0cl9saXN0LmpzIiwic3JjL2NvcmUvbWV0aG9kLmpzIiwic3JjL2NvcmUvbW9kZWwuanMiLCJzcmMvY29yZS92YWxpZGF0b3IuanMiLCJzcmMvdXRpbC9ldmVudF9lbWl0dGVyLmpzIiwic3JjL3V0aWwvaW5kZXhfb2YuanMiLCJzcmMvdXRpbC9uYW1lc3BhY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6OURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6bkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qZ2xvYmFsIGRlc2NyaWJlLCBpdCwgYmVmb3JlRWFjaCwgZXhwZWN0LCB4aXQsIGphc21pbmUgKi9cblxudmFyIEF0dHIgPSByZXF1aXJlKCcuLi8uLi9zcmMvY29yZS9hdHRyLmpzJyk7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi4vLi4vc3JjL3V0aWwvZXZlbnRfZW1pdHRlci5qcycpO1xuXG5kZXNjcmliZShcIkF0dHJcIiwgZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBzdWl0cyA9IFsnY2x1YnMnLCAnZGlhbW9uZHMnLCAnaGVhcnRzJywgJ3NwYWRlcyddLFxuICAgICAgICBzdWl0LFxuICAgICAgICByYW5rcyA9IFsnMicsJzMnLCc0JywnNScsJzYnLCc3JywnOCcsJzknLCcxMCcsJ0onLCdRJywnSyddLFxuICAgICAgICByYW5rLFxuICAgICAgICBudW0sXG4gICAgICAgIG9iaixcbiAgICAgICAgYWdlLFxuICAgICAgICBDYXJkO1xuXG4gICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN1aXQgPSBuZXcgQXR0cihcInN1aXRcIik7XG4gICAgICAgIHJhbmsgPSBuZXcgQXR0cihcInJhbmtcIik7XG4gICAgICAgIG51bSA9IG5ldyBBdHRyKFwibnVtXCIpO1xuICAgICAgICBhZ2UgPSBuZXcgQXR0cihcImFnZVwiKTtcbiAgICAgICAgQ2FyZCA9IHt9O1xuICAgICAgICBvYmogPSB7fTtcbiAgICB9KTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIENPTlNUUlVDVE9SIFRFU1RTICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgZGVzY3JpYmUoXCJDb25zdHJ1Y3RvciBUZXN0c1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIG9uIGFuIGVtcHR5IG9yIG5vIHN0cmluZyBwYXJhbWV0ZXJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICBzdWl0ID0gbmV3IEF0dHIoKTtcbiAgICAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiQXR0cjogY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lIHBhcmFtZXRlciB3aGljaCBtdXN0IGJlIGEgc3RyaW5nXCIpKTtcbiAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICBzdWl0ID0gbmV3IEF0dHIoNSk7XG4gICAgICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIkF0dHI6IGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZSBwYXJhbWV0ZXIgd2hpY2ggbXVzdCBiZSBhIHN0cmluZ1wiKSk7XG4gICAgICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gRU5EIENPTlNUUlVDVE9SIFRFU1RTICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gTU9ESUZJRVIgVEVTVFMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgZGVzY3JpYmUoXCJNb2RpZmllciBUZXN0c1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlc2NyaWJlKFwidmFsaWRhdGVzV2l0aCBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaXQoXCJzaG91bGQgYWRkIGEgbmV3IHZhbGlkYXRpb24gY3JpdGVyaWFcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGluZyA9PT0gXCJoZWxsb1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc3VpdC52YWxpZGF0ZXNXaXRoKHYpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzdWl0LnZhbGlkYXRvcigpKFwiaGVsbG9cIikpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgc3VpdC52YWxpZGF0b3IoKShcImdvb2RieWVcIik7XG4gICAgICAgICAgICAgICAgfSkudG9UaHJvdygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIGFsbG93IGZvciBhIG5ldyBlcnJvciBtZXNzYWdlIHRvIGJlIHNldCB1c2luZyB0aGlzLm1lc3NhZ2UgaW4gdGhlIHNwZWNpZmllZCBmdW5jdGlvblwiLFxuICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gZnVuY3Rpb24gKG51bSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcIkV4cGVjdGVkIFwiICsgbnVtICsgXCIgdG8gYmUgYmlnZ2VyIHRoYW4gNVwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVtID4gNTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHN1aXQudmFsaWRhdGVzV2l0aCh2KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzdWl0LnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKG51bSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcIkV4cGVjdGVkIFwiICsgbnVtICsgXCIgdG8gYmUgbGVzcyB0aGFuIDEwXCI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudW0gPCAxMDtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHN1aXQudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IFwiRXhwZWN0ZWQgXCIgKyBudW0gKyBcIiB0byBiZSBkaXZpc2libGUgYnkgNFwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVtJTQgPT09IDA7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBzdWl0LmFkZFRvKG9iaik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLnN1aXQoMyk7XG4gICAgICAgICAgICAgICAgfSkudG9UaHJvdyhcIkV4cGVjdGVkIDMgdG8gYmUgYmlnZ2VyIHRoYW4gNVwiKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouc3VpdCgxMik7XG4gICAgICAgICAgICAgICAgfSkudG9UaHJvdyhcIkV4cGVjdGVkIDEyIHRvIGJlIGxlc3MgdGhhbiAxMFwiKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouc3VpdCg3KTtcbiAgICAgICAgICAgICAgICB9KS50b1Rocm93KFwiRXhwZWN0ZWQgNyB0byBiZSBkaXZpc2libGUgYnkgNFwiKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouc3VpdCg4KTtcbiAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIGFsbG93IGZvciBtdWx0aXBsZSBhdHRycyB0byBiZSBjcmVhdGVkIHdpdGggZGlmZmVyZW50IHZhbGlkYXRvcnNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHN1aXQudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAoc3VpdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VpdHMuaW5kZXhPZihzdWl0KSA+PSAwO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGV4cGVjdChyYW5rLnZhbGlkYXRvcigpICE9PSBzdWl0LnZhbGlkYXRvcigpKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgaXQoXCJzaG91bGQgcmV0dXJuIHRoZSBBdHRyIG9iamVjdCBmb3IgY2FzY2FkaW5nXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qoc3VpdC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pKS50b0VxdWFsKHN1aXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBmdW5jdGlvblwiLFxuICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHN1aXQudmFsaWRhdGVzV2l0aCg1KTtcbiAgICAgICAgICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIkF0dHI6IHZhbGlkYXRvciBtdXN0IGJlIGEgZnVuY3Rpb25cIikpO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlc2NyaWJlKFwiZGVmYXVsdHNUbyBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaXQoXCJzaG91bGQgdmFsaWRhdGUgdGhlIGRlZmF1bHQgdmFsdWUgd2hlbiBpdCBpcyBhZGRlZCB0byBhbiBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgpLFxuICAgICAgICAgICAgICAgIHYgPSBmdW5jdGlvbiAoYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNweSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVvZihhZ2UpID09PSBcIm51bWJlclwiICYmIGFnZSA+PSAwKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGFnZS52YWxpZGF0ZXNXaXRoKHYpLmFuZC5kZWZhdWx0c1RvKDApO1xuICAgICAgICAgICAgICAgIGFnZS5hZGRUbyhvYmopO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBhZ2UuZGVmYXVsdHNUbygtNSk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgYWdlLmFkZFRvKG9iaik7XG4gICAgICAgICAgICAgICAgfSkudG9UaHJvdygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHNldCB0aGUgYXR0cmlidXRlIHRvIHRoZSBwYXJhbWV0ZXIgZm9yIGFsbCBuZXcgb2JqZWN0c1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYWdlLmRlZmF1bHRzVG8oMCk7XG4gICAgICAgICAgICAgICAgYWdlLmFkZFRvKG9iaik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KG9iai5hZ2UoKSkudG9CZSgwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdChcInNob3VsZCBjYWxsIHRoZSBmdW5jdGlvbiBlYWNoIHRpbWUgYSBkZWZhdWx0IGlzIGFzc2lnbmVkLCB3aGVuIHRoZSB2YWxpZGF0b3IgaXMgYSBmdW5jdGlvblwiLFxuICAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIERvZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBkb2cgPSBuZXcgQXR0cihcImRvZ1wiKS53aGljaC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChkb2cpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvZyBpbnN0YW5jZW9mIERvZztcbiAgICAgICAgICAgICAgICB9KS5hbmQuZGVmYXVsdHNUbyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICsrY291bnQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRG9nKFwic3BvdFwiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2YXIgZnJlZCA9IHt9O1xuICAgICAgICAgICAgICAgIGRvZy5hZGRUbyhmcmVkKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoZnJlZC5kb2coKS5uYW1lKS50b0JlKFwic3BvdFwiKTtcbiAgICAgICAgICAgICAgICBmcmVkLmRvZygpLm5hbWUgPSAncm92ZXInO1xuICAgICAgICAgICAgICAgIGV4cGVjdChmcmVkLmRvZygpLm5hbWUpLnRvQmUoXCJyb3ZlclwiKTtcbiAgICAgICAgICAgICAgICB2YXIgamFuZSA9IHt9O1xuICAgICAgICAgICAgICAgIGRvZy5hZGRUbyhqYW5lKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoamFuZS5kb2coKS5uYW1lKS50b0JlKFwic3BvdFwiKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoZnJlZC5kb2coKS5uYW1lKS50b0JlKFwicm92ZXJcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGNvdW50KS50b0JlKDIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHJldHVybiB0aGUgQXR0ciBvYmplY3QgZm9yIGNhc2NhZGluZ1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGFnZS5kZWZhdWx0c1RvKDApO1xuICAgICAgICAgICAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGRlc2NyaWJlKFwiaXNXcml0YWJsZSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc3VpdC5pc0ltbXV0YWJsZSgpLmFuZC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChzdWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWl0cy5pbmRleE9mKHN1aXQpID4gLTE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXQoXCJzaG91bGQgbWFrZSBhIGZvcm1lcmx5IGltbXV0YWJsZSBhdHRyaWJ1dGUgbXV0YWJsZSBhZ2FpblwiLFxuICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgIHN1aXQuaXNXcml0YWJsZSgpO1xuICAgICAgICAgICAgICAgICAgIHN1aXQuYWRkVG8oQ2FyZCk7XG4gICAgICAgICAgICAgICAgICAgQ2FyZC5zdWl0KFwiY2x1YnNcIik7XG4gICAgICAgICAgICAgICAgICAgZXhwZWN0KENhcmQuc3VpdCgpKS50b0JlKFwiY2x1YnNcIik7XG4gICAgICAgICAgICAgICAgICAgQ2FyZC5zdWl0KFwiaGVhcnRzXCIpO1xuICAgICAgICAgICAgICAgICAgIGV4cGVjdChDYXJkLnN1aXQoKSkudG9CZShcImhlYXJ0c1wiKTtcbiAgICAgICAgICAgICAgICAgICBDYXJkLnN1aXQoXCJkaWFtb25kc1wiKTtcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoQ2FyZC5zdWl0KCkpLnRvQmUoXCJkaWFtb25kc1wiKTtcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdChcInNob3VsZCByZXR1cm4gdGhlIGF0dHJpYnV0ZSBmb3IgY2hhaW5pbmdcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGV4cGVjdChzdWl0LmlzV3JpdGFibGUoKSkudG9CZShzdWl0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGRlc2NyaWJlKFwiaXNSZWFkT25seSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc3VpdC5pc1JlYWRPbmx5KCkuYW5kLnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKHN1aXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1aXRzLmluZGV4T2Yoc3VpdCkgPiAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzdWl0LmFkZFRvKENhcmQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGl0KFwic2hvdWxkIGFsbG93IGZvciB0aGUgc2V0dGVyIHRvIGJlIGNhbGxlZCBvbmNlIGFmdGVyIGl0IGlzIGFkZGVkIHRvIGFuIG9iamVjdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQ2FyZC5zdWl0KFwiZGlhbW9uZHNcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KENhcmQuc3VpdCgpKS50b0JlKFwiZGlhbW9uZHNcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXQoXCJzaG91bGQgc3RpbGwgdmFsaWRhdGUgaXQgdGhlIGZpcnN0IHRpbWUgaXQgaXMgc2V0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBDYXJkLnN1aXQoXCJub3RBUmVhbFJhbmtcIik7XG4gICAgICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJ2YWxpZGF0b3IgZmFpbGVkIHdpdGggcGFyYW1ldGVyIG5vdEFSZWFsUmFua1wiKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHNldHRlciBpcyBjYWxsZWQgb25jZSB0aGUgYXR0cmlidXRlIGlzIHNldFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQ2FyZC5zdWl0KFwiZGlhbW9uZHNcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgQ2FyZC5zdWl0KFwiaGVhcnRzXCIpO1xuICAgICAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiY2Fubm90IHNldCB0aGUgaW1tdXRhYmxlIHByb3BlcnR5IHN1aXQgYWZ0ZXIgaXQgaGFzIGJlZW4gc2V0XCIpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdChcInNob3VsZCByZXR1cm4gdGhlIEF0dHIgb2JqZWN0IGZvciBjaGFpbmluZ1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHN1aXQuaXNSZWFkT25seSgpKS50b0JlKHN1aXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlc2NyaWJlKFwib24gbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBuYW1lLCBcbiAgICAgICAgICAgICAgICBvYmosXG4gICAgICAgICAgICAgICAgb2JqMixcbiAgICAgICAgICAgICAgICBnZXRTcHksXG4gICAgICAgICAgICAgICAgc2V0U3B5O1xuXG4gICAgICAgICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gbmV3IEF0dHIoXCJuYW1lXCIpLndoaWNoLmlzQShcInN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICBvYmogPSB7fTtcbiAgICAgICAgICAgICAgICBvYmoyID0ge307XG4gICAgICAgICAgICAgICAgc2V0U3B5ID0gamFzbWluZS5jcmVhdGVTcHkoKTtcbiAgICAgICAgICAgICAgICBnZXRTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIGJlIGRlZmluZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGV4cGVjdChuYW1lLm9uKS5ub3QudG9CZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBldmVudCBwYXJhbWV0ZXIgaXMgbm90ICdzZXQnIG9yIFwiICsgXG4gICAgICAgICAgICAgICBcIidnZXQnXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBuYW1lLm9uKFwic2V0c1wiLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgICAgICAgICAgICAgfSkudG9UaHJvdyhcIkF0dHI6IGZpcnN0IGFyZ3VtZW50IHRvIHRoZSAnb24nIG1ldGhvZCBzaG91bGQgXCIgKyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYmUgJ3NldCcgb3IgJ2dldCdcIik7XG4gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgbmFtZS5vbihcInNldFwiLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBuYW1lLm9uKFwiZ2V0XCIsIGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBsaXN0ZW5lciBwYXJhbWV0ZXIgaXMgbm90IGEgXCIgKyBcbiAgICAgICAgICAgICAgIFwiZnVuY3Rpb25cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIG5hbWUub24oXCJzZXRcIiwgNik7XG4gICAgICAgICAgICAgICAgICAgfSkudG9UaHJvdyhcIkF0dHI6IHNlY29uZCBhcmd1bWVudCB0byB0aGUgJ29uJyBtZXRob2Qgc2hvdWxkIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBuYW1lLm9uKFwic2V0XCIsIGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIGNhbGwgdGhlIHNldCBsaXN0ZW5lciB3aGVuIHRoZSBhdHRyaWJ1dGUgaXMgc2V0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuYW1lLm9uKFwic2V0XCIsIHNldFNweSk7XG4gICAgICAgICAgICAgICAgbmFtZS5vbihcImdldFwiLCBnZXRTcHkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5hbWUuYWRkVG8ob2JqKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBvYmoubmFtZShcInNlbW15XCIpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgICAgICBleHBlY3Qoc2V0U3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcInNlbW15XCIsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGdldFNweSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdChcInNob3VsZCBjYWxsIHRoZSBnZXQgbGlzdGVuZXIgd2hlbiB0aGUgYXR0cmlidXRlIGlzIHNldFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmFtZS5vbihcInNldFwiLCBzZXRTcHkpO1xuICAgICAgICAgICAgICAgIG5hbWUub24oXCJnZXRcIiwgZ2V0U3B5KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lLmFkZFRvKG9iaik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgb2JqLm5hbWUoXCJzZW1teVwiKTtcbiAgICAgICAgICAgICAgICBleHBlY3Qoc2V0U3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGdldFNweSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgICAgICBleHBlY3Qoc2V0U3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcInNlbW15XCIsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgb2JqLm5hbWUoKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoZ2V0U3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGdldFNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJzZW1teVwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdChcInNob3VsZCB3b3JrIG9uIG11bHRpcGxlIGF0dHJpYnV0ZXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhZ2UgPSBuZXcgQXR0cihcImFnZVwiKS53aGljaC5pc0FuKFwiaW50ZWdlclwiKSxcbiAgICAgICAgICAgICAgICAgICAgYWdlU3B5ID0gamFzbWluZS5jcmVhdGVTcHkoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lLm9uKFwic2V0XCIsIHNldFNweSk7XG4gICAgICAgICAgICAgICAgbmFtZS5vbihcImdldFwiLCBnZXRTcHkpO1xuICAgICAgICAgICAgICAgIGFnZS5vbihcInNldFwiLCBhZ2VTcHkpO1xuICAgICAgICAgICAgICAgIGFnZS5vbihcImdldFwiLCBhZ2VTcHkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5hbWUuYWRkVG8ob2JqKTtcbiAgICAgICAgICAgICAgICBhZ2UuYWRkVG8ob2JqKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBvYmouYWdlKDUwKTtcbiAgICAgICAgICAgICAgICBleHBlY3Qoc2V0U3B5KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChnZXRTcHkpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGFnZVNweSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChhZ2VTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDUwLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG9iai5uYW1lKFwic2VtbXlcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHNldFNweSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChnZXRTcHkpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHNldFNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJzZW1teVwiLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIG9iai5uYW1lKCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGdldFNweSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChnZXRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwic2VtbXlcIik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgb2JqLmFnZSgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkuY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChnZXRTcHkuY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChhZ2VTcHkuY2FsbENvdW50KS50b0JlKDIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHdvcmsgd2hlbiB0aGUgYXR0cmlidXRlIGlzIGFkZGVkIHRvIG11bHRpcGxlIG9iamVjdHMsIFwiICsgXG4gICAgICAgICAgICAgICBcInRoZSAndGhpcycgcmVmZXJlbmNlIHNob3VsZCBwb2ludCB0byB0aGUgY2FsbGluZyBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgIG5hbWUub24oXCJzZXRcIiwgZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHNldFNweShuZXdWYWx1ZSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgbmFtZS5hZGRUbyhvYmopO1xuICAgICAgICAgICAgICAgICAgIG5hbWUuYWRkVG8ob2JqMik7XG4gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgb2JqLm5hbWUoXCJoZWxsb1wiKTtcbiAgICAgICAgICAgICAgICAgICBleHBlY3Qoc2V0U3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICAgICAgICAgZXhwZWN0KHNldFNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJoZWxsb1wiLCBvYmopO1xuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgIG9iajIubmFtZShcIndvcmxkXCIpO1xuICAgICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkuY2FsbENvdW50KS50b0JlKDIpO1xuICAgICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwid29ybGRcIiwgb2JqMik7XG4gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgZXhwZWN0KHNldFNweSkubm90LnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwiaGVsbG9cIiwgb2JqMik7XG4gICAgICAgICAgICAgICAgICAgZXhwZWN0KHNldFNweSkubm90LnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwid29ybGRcIiwgb2JqKTtcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdChcInNob3VsZCBjYWxsIHRoZSBsaXN0ZW5lciB3aXRoIHRoZSBuZXdseSBzZXQgdmFsdWUgQU5EIHRoZSBvbGQgdmFsdWVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5hbWUub24oXCJzZXRcIiwgc2V0U3B5KTtcbiAgICAgICAgICAgICAgICBuYW1lLmFkZFRvKG9iaik7XG4gICAgICAgICAgICAgICAgbmFtZS5hZGRUbyhvYmoyKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBvYmoubmFtZShcInNlbW15XCIpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkuY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwic2VtbXlcIiwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICBvYmoubmFtZShcIm1hcmtcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHNldFNweS5jYWxsQ291bnQpLnRvQmUoMik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHNldFNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJtYXJrXCIsIFwic2VtbXlcIik7XG4gICAgICAgICAgICAgICAgb2JqLm5hbWUoXCJqb2huXCIpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkuY2FsbENvdW50KS50b0JlKDMpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwiam9oblwiLCBcIm1hcmtcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXQoXCJzaG91bGQgY2FsbCB0aGUgYXBwcm9wcmlhdGUgbGlzdGVuZXIgd2hlbiBzZXR0aW5nIHVwIGEgZGVmYXVsdCB2YWx1ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmFtZS5kZWZhdWx0c1RvKFwiaGVsbG8gd29ybGQhXCIpO1xuICAgICAgICAgICAgICAgIG5hbWUub24oXCJzZXRcIiwgc2V0U3B5KTtcbiAgICAgICAgICAgICAgICBuYW1lLmFkZFRvKG9iaik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZXhwZWN0KHNldFNweSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChzZXRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwiaGVsbG8gd29ybGQhXCIsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIEVORCBNT0RJRklFUiBURVNUUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBHRVRURVIgVEVTVFMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBkZXNjcmliZShcIkdldHRlciBUZXN0c1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlc2NyaWJlKFwibmFtZSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaXQoXCJzaG91bGQgcmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGV4cGVjdChzdWl0Lm5hbWUoKSkudG9CZShcInN1aXRcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVzY3JpYmUoXCJ2YWxpZGF0b3IgbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHJldHVybiB0aGUgdmFsaWRhdG9yIGZ1bmN0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QodHlwZW9mKHN1aXQudmFsaWRhdG9yKCkpKS50b0JlKCdmdW5jdGlvbicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBFTkQgR0VUVEVSIFRFU1RTIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBTWU5UQUNUSUMgU1VHQVIgVEVTVFMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBkZXNjcmliZShcIlN5bnRhY3RpYyBTdWdhciBUZXN0c1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlc2NyaWJlKFwiYW5kIHN5bnRhY3RpYyBzdWdhclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpdChcInNob3VsZCByZXR1cm4gdGhlIG9iamVjdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHN1aXQuYW5kKS50b0VxdWFsKHN1aXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlc2NyaWJlKFwid2hpY2ggc3ludGFjdGljIHN1Z2FyXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHJldHVybiB0aGUgb2JqZWN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qoc3VpdC53aGljaCkudG9FcXVhbChzdWl0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZXNjcmliZShcImlzSW1tdXRhYmxlIHN5bnRhY3RpYyBzdWdhclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpdChcInNob3VsZCBiZSBlcXVhbCB0byBpc1JlYWRPbmx5XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qoc3VpdC5pc0ltbXV0YWJsZSkudG9CZShzdWl0LmlzUmVhZE9ubHkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlc2NyaWJlKFwiaXNNdXRhYmxlIHN5bnRhY3RpYyBzdWdhclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpdChcInNob3VsZCBiZSBlcXVhbCB0byBpc1dyaXRhYmxlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qoc3VpdC5pc011dGFibGUpLnRvQmUoc3VpdC5pc1dyaXRhYmxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gRU5EIFNZTlRBQ1RJQyBTVUdBUiBURVNUUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gVVRJTElUWSBURVNUUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgZGVzY3JpYmUoXCJVdGlsaXR5IFRlc3RzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZGVzY3JpYmUoXCJjbG9uZSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaXQoXCJzaG91bGQgY2xvbmUgYWxsIGFzcGVjdHMgb2YgdGhlIGF0dHJpYnV0ZSBhbmQgcmV0dXJuIGEgbmV3IG9uZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZSA9IG5ldyBBdHRyKFwidGVzdFwiKSxcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gXCI1IG11c3QgYmUgZ3JlYXRlciB0aGFuIDNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA1ID4gMztcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVmID0gNSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVkQXR0cixcbiAgICAgICAgICAgICAgICAgICAgb2JqQSA9IHt9LFxuICAgICAgICAgICAgICAgICAgICBvYmpCID0ge307XG5cbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGUudmFsaWRhdGVzV2l0aCh2YWxpZGF0b3IpLmFuZC5kZWZhdWx0c1RvKGRlZik7XG4gICAgICAgICAgICAgICAgY2xvbmVkQXR0ciA9IGF0dHJpYnV0ZS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGV4cGVjdChjbG9uZWRBdHRyLnZhbGlkYXRvcigpKCkpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlLmFkZFRvKG9iakEpO1xuICAgICAgICAgICAgICAgIGNsb25lZEF0dHIuYWRkVG8ob2JqQik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZXhwZWN0KG9iakEudGVzdCgpKS50b0JlKGRlZik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KG9iakIudGVzdCgpKS50b0JlKGRlZik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KG9iakEudGVzdCgpKS50b0VxdWFsKG9iakIudGVzdCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTsgICAgICAgIFxuXG4gICAgICAgIGRlc2NyaWJlKFwiYWRkVG8gbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYW4gb2JqZWN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBzdWl0LmFkZFRvKCk7XG4gICAgICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJBdHRyOiBhZGRBdHRyIG1ldGhvZCByZXF1aXJlcyBhbiBvYmplY3QgcGFyYW1ldGVyXCIpKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBzdWl0LmFkZFRvKDUpO1xuICAgICAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiQXR0cjogYWRkQXR0ciBtZXRob2QgcmVxdWlyZXMgYW4gb2JqZWN0IHBhcmFtZXRlclwiKSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaXQoXCJzaG91bGQgYWRkIHRoZSBhdHRyaWJ1dGUgdG8gdGhlIHNwZWNpZmllZCBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHN1aXQuYWRkVG8oQ2FyZCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KENhcmQuc3VpdCkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpdChcInNob3VsZCBkZWZhdWx0IHRoZSB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlIHRvIHVuZGVmaW5lZCwgdW5sZXNzIHNwZWNpZmllZCBcIiArXG4gICAgICAgICAgICAgICBcIiBvdGhlcndpc2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHN1aXQuYWRkVG8oQ2FyZCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KENhcmQuc3VpdCgpKS50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIEVORCBVVElMSVRZIFRFU1RTIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIFBPU1QgQUREVE8gVEVTVFMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgZGVzY3JpYmUoXCJQb3N0LWFkZFRvIFRlc3RzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoXCJzaG91bGQgY29ycmVjdGx5IHNldCB0aGUgYXR0cmlidXRlLCBldmVuIGlmIGl0IGlzIGZhbHN5XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gbmV3IEF0dHIoXCJ4XCIpLFxuICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgYXR0ci5hZGRUbyhvYmopO1xuICAgICAgICAgICAgb2JqLngoMCk7XG4gICAgICAgICAgICBleHBlY3Qob2JqLngoKSkudG9CZSgwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgYWxsb3cgdGhlIHJlc3VsdGluZyB2YWx1ZSB0byBiZSBzZXQgdG8gbnVsbCwgYXNzdW1pbmcgaXQgcGFzc2VzIHZhbGlkYXRvclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IG5ldyBBdHRyKFwibmFtZVwiKTtcbiAgICAgICAgICAgIGF0dHIuYWRkVG8ob2JqKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmoubmFtZSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgb2JqLmVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBvYmoub24gPSBvYmouZW1pdHRlcigpLm9uO1xuICAgICAgICAgICAgICAgIG9iai5uYW1lKG51bGwpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHNldCB2YWx1ZSBkb2Vzbid0IHBhc3MgdGhlIHZhbGlkYXRvclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdWl0LnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKHN1aXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VpdHMuaW5kZXhPZihzdWl0KSA+IDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHN1aXQuYWRkVG8oQ2FyZCk7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIENhcmQuc3VpdCg0KTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBFTkQgUE9TVCBBRERUTyBURVNUUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gRVhBTVBMRSBURVNUUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBkZXNjcmliZShcIkV4YW1wbGUgVGVzdHNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBkZXNjcmliZShcIkV4YW1wbGUgT25lXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHdvcmsgd2l0aCB0aGlzIGV4YW1wbGVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJhbmsgPSBuZXcgQXR0cihcInJhbmtcIikud2hpY2guaXNBKCdzdHJpbmcnKS5hbmQuaXNPbmVPZihyYW5rcyk7XG4gICAgICAgICAgICAgICAgc3VpdCA9IG5ldyBBdHRyKFwic3VpdFwiKS53aGljaC5pc0EoJ3N0cmluZycpLmFuZC5pc09uZU9mKHN1aXRzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByYW5rLmFkZFRvKENhcmQpO1xuICAgICAgICAgICAgICAgIHN1aXQuYWRkVG8oQ2FyZCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQ2FyZC5yYW5rKFwiNVwiKS5zdWl0KFwiY2x1YnNcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KENhcmQuc3VpdCgpKS50b0VxdWFsKFwiY2x1YnNcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KENhcmQucmFuaygpKS50b0VxdWFsKFwiNVwiKTtcblxuICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIENhcmQucmFuayg1KTtcbiAgICAgICAgICAgICAgICB9KS50b1Rocm93KCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgQ2FyZC5yYW5rKFwiNVwiKTtcbiAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBFTkQgRVhBTVBMRSBURVNUUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbn0pO1xuIiwiLypnbG9iYWwgZGVzY3JpYmUsIGl0LCBiZWZvcmVFYWNoLCBleHBlY3QsIHhpdCwgamFzbWluZSAqL1xuXG52YXIgQXR0ckxpc3QgPSByZXF1aXJlKCcuLi8uLi9zcmMvY29yZS9hdHRyX2xpc3QuanMnKTtcbnZhciBBdHRyID0gcmVxdWlyZSgnLi4vLi4vc3JjL2NvcmUvYXR0ci5qcycpO1xuXG5kZXNjcmliZShcIkF0dHJMaXN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgYWwsXG4gICAgICAgIG9iajtcblxuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBhbCA9IG5ldyBBdHRyTGlzdChcImZyaWVuZHNcIik7XG4gICAgICAgIG9iaiA9IHt9O1xuICAgICAgICBhbC5hZGRUbyhvYmopO1xuICAgIH0pO1xuXG4gICAgaXQoXCJzaG91bGQgYmUgYW4gQXR0ciBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3QoYWwgaW5zdGFuY2VvZiBBdHRyKS50b0JlKHRydWUpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJzaG91bGQgaGF2ZSBhIHBvcCBmdW5jdGlvblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLnBvcCkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KFwic2hvdWxkIGhhdmUgYSB2YWxpZGF0ZVdpdGggZnVuY3Rpb24gd2hpY2ggaXMgYW4gYWxpYXMgZm9yIHZhbGlkYXRlc1dpdGhcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3QoYWwudmFsaWRhdGVXaXRoKS50b0JlKGFsLnZhbGlkYXRlc1dpdGgpO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJlYWNoT2ZXaGljaCBzeW50YWN0aWMgc3VnYXJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCByZXR1cm4gdGhlIG9iamVjdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QoYWwuZWFjaE9mV2hpY2gpLnRvRXF1YWwoYWwpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwic2l6ZSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCBiZSBpbml0aWFsaXplZCB0byAwXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLnNpemUoKSkudG9FcXVhbCgwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgaW5jcmVhc2Ugd2hlbiBhbiBvYmplY3QgaXMgYWRkZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNpemUgPSBvYmouZnJpZW5kcygpLnNpemUoKTtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwiam9oblwiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLnNpemUoKSkudG9FcXVhbChzaXplKzEpO1xuICAgICAgICB9KTtcblxuICAgICAgICB4aXQoXCJzaG91bGQgZGVjcmVhc2Ugd2hlbiBhbiBvYmplY3QgaXMgcmVtb3ZlZFwiLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcImF0IG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KFwic2hvdWxkIHJldHVybiB0aGUgZWxlbWVudCBhdCBhIGdpdmVuIGluZGV4XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwiam9oblwiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLmF0KDApKS50b0VxdWFsKFwiam9oblwiKTtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwic2VtbXlcIik7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5hdCgwKSkudG9FcXVhbChcImpvaG5cIik7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5hdCgxKSkudG9FcXVhbChcInNlbW15XCIpO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJtYXJrXCIpO1xuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkuYXQoMCkpLnRvRXF1YWwoXCJqb2huXCIpO1xuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkuYXQoMSkpLnRvRXF1YWwoXCJzZW1teVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLmF0KDIpKS50b0VxdWFsKFwibWFya1wiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIHRoZSBwYXJhbWV0ZXIgaXMgb3V0IG9mIGJvdW5kc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcImpvaG5cIik7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcInNlbW15XCIpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hdCgtMSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIkF0dHJMaXN0OiBJbmRleCBvdXQgb2YgYm91bmRzXCIpKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYXQoMSk7XG4gICAgICAgICAgICB9KS5ub3QudG9UaHJvdyhuZXcgRXJyb3IoXCJBdHRyTGlzdDogSW5kZXggb3V0IG9mIGJvdW5kc1wiKSk7XG4gIFxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYXQoMik7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIkF0dHJMaXN0OiBJbmRleCBvdXQgb2YgYm91bmRzXCIpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cblxuXG4gICAgZGVzY3JpYmUoXCJhZGQgbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoXCJzaG91bGQgYWRkIGFuIGVsZW1lbnQgdG8gdGhlIGVuZCBvZiB0aGUgbGlzdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcImpvaG5cIik7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5hdChvYmouZnJpZW5kcygpLnNpemUoKS0xKSkudG9FcXVhbChcImpvaG5cIik7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcInNlbW15XCIpO1xuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkuYXQob2JqLmZyaWVuZHMoKS5zaXplKCktMikpLnRvRXF1YWwoXCJqb2huXCIpO1xuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkuYXQob2JqLmZyaWVuZHMoKS5zaXplKCktMSkpLnRvRXF1YWwoXCJzZW1teVwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgY2FsbCB0aGUgdmFsaWRhdG9yIGZ1bmN0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB2ID0gamFzbWluZS5jcmVhdGVTcHkoKTtcbiAgICAgICAgICAgIHZhciB0ID0gZnVuY3Rpb24gKGZyaWVuZCkge1xuICAgICAgICAgICAgICAgIHYoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGFsLnZhbGlkYXRlc1dpdGgodCk7XG4gICAgICAgICAgICBhbC5hZGRUbyhvYmopO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJqb2huXCIpO1xuICAgICAgICAgICAgZXhwZWN0KHYpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcblxuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciB3aGVuIHRoZSBvYmplY3QgZG9lcyBub3QgcGFzcyB2YWxpZGF0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYWwudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAoZnJpZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IFwiSW52YWxpZFwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mKGZyaWVuZCkgPT09ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFsLmFkZFRvKG9iaik7XG4gICAgICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoMSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIkludmFsaWRcIikpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwib24gbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFkZFNweSxcbiAgICAgICAgICAgIGFkZFNweTIsXG4gICAgICAgICAgICBhbDIsXG4gICAgICAgICAgICBvYmoyO1xuXG4gICAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYWRkU3B5ID0gamFzbWluZS5jcmVhdGVTcHkoKTtcbiAgICAgICAgICAgIGFsID0gbmV3IEF0dHJMaXN0KFwiZnJpZW5kc1wiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGV2ZW50IHBhcmFtZXRlciBpcyBub3QgJ2FkZCdcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbC5vbihcInNldFwiLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIkF0dHJMaXN0OiAnb24nIG9ubHkgcmVzcG9uZHMgdG8gJ2FkZCcgZXZlbnRcIikpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGFsLm9uKFwiYWRkXCIsIGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KG5ldyBFcnJvcihcIkF0dHJMaXN0OiAnb24nIG9ubHkgcmVzcG9uZHMgdG8gJ2FkZCcgZXZlbnRcIikpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgbGlzdGVuZXIgcGFyYW1ldGVyIGlzIG5vdCBhIGZ1bmN0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYWwub24oXCJhZGRcIiwgNSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIkF0dHJMaXN0OiAnb24nIHJlcXVpcmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXJcIikpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGFsLm9uKFwiYWRkXCIsIGZ1bmN0aW9uICgpIHt9KTsgICAgICAgICAgIFxuICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgY2FsbCB0aGUgYWRkIGxpc3RlbmVyIHdoZW4gYW4gZWxlbWVudCBpcyBhZGRlZCB0byB0aGUgbGlzdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhbC5vbihcImFkZFwiLCBhZGRTcHkpO1xuICAgICAgICAgICAgYWwuYWRkVG8ob2JqKTtcblxuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJqb2huXCIpO1xuXG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5LmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgY2FsbCB0aGUgYWRkIGxpc3RlbmVyIHdpdGggdGhlIG5ldyBlbGVtZW50IHRoYXQgd2FzIGFkZGVkIGFsb25nIHdpdGggdGhlIG5ldyBzaXplXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFsLm9uKFwiYWRkXCIsIGFkZFNweSk7XG4gICAgICAgICAgICBhbC5hZGRUbyhvYmopO1xuXG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcIm1hcmtcIik7XG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5LmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwibWFya1wiLCAxKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgd29yayBmb3IgbXVsdGlwbGUgYXR0cl9saXN0IG9iamVjdHNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYWwyID0gbmV3IEF0dHJMaXN0KFwiY29sbGVhZ3Vlc1wiKTtcbiAgICAgICAgICAgIG9iajIgPSB7fTtcbiAgICAgICAgICAgIGFkZFNweTIgPSBqYXNtaW5lLmNyZWF0ZVNweSgpO1xuICAgICAgICAgICAgYWwub24oXCJhZGRcIiwgYWRkU3B5KTtcbiAgICAgICAgICAgIGFsMi5vbihcImFkZFwiLCBhZGRTcHkyKTtcblxuICAgICAgICAgICAgYWwuYWRkVG8ob2JqKTtcbiAgICAgICAgICAgIGFsMi5hZGRUbyhvYmoyKTtcblxuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJzZW1teVwiKTtcbiAgICAgICAgICAgIG9iajIuY29sbGVhZ3VlcygpLmFkZChcImRlYW5cIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkyKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5LmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkyLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwic2VtbXlcIiwgMSk7XG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5MikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJkZWFuXCIsIDEpO1xuXG4gICAgICAgICAgICBvYmoyLmNvbGxlYWd1ZXMoKS5hZGQoXCJyZWJlY2NhXCIpO1xuICAgICAgICAgICAgZXhwZWN0KGFkZFNweS5jYWxsQ291bnQpLnRvQmUoMSk7XG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5Mi5jYWxsQ291bnQpLnRvQmUoMik7XG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5MikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJkZWFuXCIsIDEpO1xuICAgICAgICAgICAgZXhwZWN0KGFkZFNweTIpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwicmViZWNjYVwiLCAyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgd29yayB3aGVuIHRoZSBhdHRyX2xpc3QgaXMgYWRkZWQgdG8gbXVsdGlwbGUgb2JqZWN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFsLm9uKFwiYWRkXCIsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgbmV3U2l6ZSkge1xuICAgICAgICAgICAgICAgIGFkZFNweShuZXdWYWx1ZSwgbmV3U2l6ZSwgdGhpcyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgb2JqMiA9IHt9O1xuXG4gICAgICAgICAgICBhbC5hZGRUbyhvYmopO1xuICAgICAgICAgICAgYWwuYWRkVG8ob2JqMik7XG5cbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwibWFya1wiKTtcbiAgICAgICAgICAgIG9iajIuZnJpZW5kcygpLmFkZChcInNlbW15XCIpO1xuXG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5zaXplKCkpLnRvQmUoMSk7XG4gICAgICAgICAgICBleHBlY3Qob2JqMi5mcmllbmRzKCkuc2l6ZSgpKS50b0JlKDEpO1xuICAgICAgICAgICAgZXhwZWN0KGFkZFNweS5jYWxsQ291bnQpLnRvQmUoMik7XG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcIm1hcmtcIiwgMSwgb2JqKTtcbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwic2VtbXlcIiwgMSwgb2JqMik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG5cbiAgICBkZXNjcmliZShcImFkZFRvIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBQZXJzb24gPSB7fTtcblxuICAgICAgICBpdChcInNob3VsZCBhZGQgdGhlIEF0dHJMaXN0IHRvIHRoZSBzcGVjaWZpZWQgb2JqZWN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFsLmFkZFRvKFBlcnNvbik7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmZyaWVuZHMpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmZyaWVuZHMoKS5hZGQpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmZyaWVuZHMoKS5hdCkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uZnJpZW5kcygpLnNpemUpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIG5vdCBhZGQgYW55IGFkZGl0aW9uYWwgQXR0ckxpc3QgZnVuY3Rpb25zIHRvIHRoZSBzcGVjaWZpZWQgb2JqZWN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFsLmFkZFRvKFBlcnNvbik7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmZyaWVuZHMoKS52YWxpZGF0ZXNXaXRoKS50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgaXQoXCJzaG91bGQgYWNjZXB0IHRoZSBjcmVhdGlvbiBvZiB0d28gbGlzdHMgb24gdGhlIHNhbWUgb2JqZWN0XCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGFsMiA9IG5ldyBBdHRyTGlzdChcImNhdHNcIik7XG4gICAgICAgICAgICBhbC5hZGRUbyhQZXJzb24pO1xuICAgICAgICAgICAgYWwyLmFkZFRvKFBlcnNvbik7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmZyaWVuZHMpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmNhdHMpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vdGVzdCBmb3IgdGhlIGluaGVyaXRhbmNlIGJ1Z1xuICAgICAgICBpdChcInNob3VsZCBhbGxvdyBmb3IgbXVsdGlwbGUgYXR0cl9saXN0cyB0byBiZSBjcmVhdGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhbDIgPSBuZXcgQXR0ckxpc3QoXCJzdWl0XCIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBhbC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChzdWl0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWl0ID09PSBcImRpYW1vbmRzXCIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGV4cGVjdChhbC52YWxpZGF0b3IoKSAhPT0gYWwyLnZhbGlkYXRvcigpKS50b0JlKHRydWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgcGFyYW1ldGVyIGlzIG5vdCBhbiBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbC5hZGRUbyg1KTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiQXR0ckxpc3Q6IGFkZFRvIG1ldGhvZCByZXF1aXJlcyBhbiBvYmplY3QgcGFyYW1ldGVyXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwicmVwbGFjZSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCByZXBsYWNlIHRoZSBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXhcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJqb2huXCIpO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJzZW1teVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLmF0KDApKS50b0VxdWFsKFwiam9oblwiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLmF0KDEpKS50b0VxdWFsKFwic2VtbXlcIik7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5zaXplKCkpLnRvRXF1YWwoMik7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLnJlcGxhY2UoMCwgXCJtYXJrXCIpO1xuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkuYXQoMCkpLnRvRXF1YWwoXCJtYXJrXCIpO1xuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkuYXQoMSkpLnRvRXF1YWwoXCJzZW1teVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLnNpemUoKSkudG9FcXVhbCgyKTtcblxuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJsYXJyeVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLmF0KDApKS50b0VxdWFsKFwibWFya1wiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLmF0KDEpKS50b0VxdWFsKFwic2VtbXlcIik7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5hdCgyKSkudG9FcXVhbChcImxhcnJ5XCIpO1xuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkuc2l6ZSgpKS50b0VxdWFsKDMpO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5yZXBsYWNlKDIsIFwiY3VybHlcIik7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5hdCgwKSkudG9FcXVhbChcIm1hcmtcIik7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5hdCgxKSkudG9FcXVhbChcInNlbW15XCIpO1xuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkuYXQoMikpLnRvRXF1YWwoXCJjdXJseVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChvYmouZnJpZW5kcygpLnNpemUoKSkudG9FcXVhbCgzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3Igd2hlbiB0aGUgaW5kZXggaXMgbm90IGFuIGludGVnZXJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYWwudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAoZnJpZW5kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gXCJJbnZhbGlkXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZihmcmllbmQpID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYWwuYWRkVG8ob2JqKTtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwibGFycnlcIik7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcImN1cmx5XCIpO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJtb2VcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5yZXBsYWNlKFwiam9oblwiLCBcInNlbW15XCIpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJBdHRyTGlzdDogcmVwbGFjZSBtZXRob2QgcmVxdWlyZXMgaW5kZXggcGFyYW1ldGVyIHRvIGJlIGFuIGludGVnZXJcIikpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG9iai5mcmllbmRzKCkucmVwbGFjZSgxLjUsIFwibWFya1wiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiQXR0ckxpc3Q6IHJlcGxhY2UgbWV0aG9kIHJlcXVpcmVzIGluZGV4IHBhcmFtZXRlciB0byBiZSBhbiBpbnRlZ2VyXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3Igd2hlbiB0aGUgaW5kZXggaXMgb3V0IG9mIGJvdW5kc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhbC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChmcmllbmQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcIkludmFsaWRcIjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mKGZyaWVuZCkgPT09ICdzdHJpbmcnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhbC5hZGRUbyhvYmopO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJsYXJyeVwiKTtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwiY3VybHlcIik7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcIm1vZVwiKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBvYmouZnJpZW5kcygpLnJlcGxhY2UoNCwgXCJzZW1teVwiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiQXR0ckxpc3Q6IHJlcGxhY2UgbWV0aG9kIGluZGV4IHBhcmFtZXRlciBvdXQgb2YgYm91bmRzXCIpKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBvYmouZnJpZW5kcygpLnJlcGxhY2UoLTEsIFwibWFya1wiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiQXR0ckxpc3Q6IHJlcGxhY2UgbWV0aG9kIGluZGV4IHBhcmFtZXRlciBvdXQgb2YgYm91bmRzXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3Igd2hlbiB0aGUgb2JqZWN0IGRvZXMgbm90IHBhc3MgdmFsaWRhdGlvblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhbC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChmcmllbmQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcIkludmFsaWRcIjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mKGZyaWVuZCkgPT09ICdzdHJpbmcnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhbC5hZGRUbyhvYmopO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJsYXJyeVwiKTtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwiY3VybHlcIik7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcIm1vZVwiKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBvYmouZnJpZW5kcygpLnJlcGxhY2UoMSwgMTIpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiSW52YWxpZFwiKSk7XG5cbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5yZXBsYWNlKDIsIFtcImpvaG5cIiwgXCJtYXJrXCIsIFwic2VtbXlcIl0pOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiSW52YWxpZFwiKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJ0b0pTT04gbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoXCJzaG91bGQgcmV0dXJuIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgZWxlbWVudHMgaW4gdGhlIGxpc3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRlc3RPYmogPSBbXCJqb2huXCIsIFwic2VtbXlcIiwgXCJtYXJrXCIsIFwiamltXCJdO1xuXG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcImpvaG5cIik7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChcInNlbW15XCIpO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJtYXJrXCIpO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJqaW1cIik7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKSkudG9CZURlZmluZWQoKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBvYmouZnJpZW5kcygpLnRvSlNPTigpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcblxuICAgICAgICAgICAgZXhwZWN0KG9iai5mcmllbmRzKCkudG9KU09OKCkpLnRvRXF1YWwodGVzdE9iaik7XG5cbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwicG9wIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KFwic2hvdWxkIHJldHVybiB0aGUgb2JqZWN0IHdoaWNoIHdhcyBwb3BwZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxhc3RPYmogPSBcIm1hcmtcIixcbiAgICAgICAgICAgIHBvcHBlZE9iajtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwiam9oblwiKTtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwic2VtbXlcIik7XG4gICAgICAgICAgICBvYmouZnJpZW5kcygpLmFkZChsYXN0T2JqKTtcbiAgICAgICAgICAgIHBvcHBlZE9iaiA9IG9iai5mcmllbmRzKCkucG9wKCk7XG4gICAgICAgICAgICBleHBlY3QocG9wcGVkT2JqKS50b0VxdWFsKGxhc3RPYmopO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBkZWNyZWFzZSB0aGUgc2l6ZSBvZiB0aGUgYXR0cl9saXN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzaXplO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJqb2huXCIpO1xuICAgICAgICAgICAgb2JqLmZyaWVuZHMoKS5hZGQoXCJzZW1teVwiKTtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkuYWRkKFwibWFya1wiKTtcbiAgICAgICAgICAgIHNpemUgPSBvYmouZnJpZW5kcygpLnNpemUoKTtcbiAgICAgICAgICAgIG9iai5mcmllbmRzKCkucG9wKCk7XG4gICAgICAgICAgICBleHBlY3Qob2JqLmZyaWVuZHMoKS5zaXplKCkpLnRvRXF1YWwoc2l6ZS0xKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcbiIsIi8qZ2xvYmFsIGRlc2NyaWJlLCBpdCwgYmVmb3JlRWFjaCwgZXhwZWN0LCB4aXQsIGphc21pbmUgKi9cblxuZGVzY3JpYmUoXCJNZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBNZXRob2QgPSByZXF1aXJlKCcuLi8uLi9zcmMvY29yZS9tZXRob2QuanMnKSxcbiAgICAgICAgUGVyc29uLFxuICAgICAgICBtO1xuXG4gICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG0gPSBuZXcgTWV0aG9kKFwicnVuc0Zvck9mZmljZVwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH0pO1xuICAgICAgICBQZXJzb24gPSB7fTtcbiAgICB9KTtcblxuICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIG9uIGFuIGVtcHR5IG9yIG5vIHN0cmluZyBwYXJhbWV0ZXJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbSA9IG5ldyBNZXRob2QoKTtcbiAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJNZXRob2Q6IGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZSBwYXJhbWV0ZXIgd2hpY2ggbXVzdCBiZSBhIHN0cmluZ1wiKSk7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG0gPSBuZXcgTWV0aG9kKDUpO1xuICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIk1ldGhvZDogY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lIHBhcmFtZXRlciB3aGljaCBtdXN0IGJlIGEgc3RyaW5nXCIpKTtcbiAgICB9KTtcblxuICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBzZWNvbmQgcGFyYW1ldGVyIGlzIG5vdCBhIGZ1bmN0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG0gPSBuZXcgTWV0aG9kKFwiZnVuY3Rpb25cIiwgNSk7XG4gICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiTWV0aG9kOiBzZWNvbmQgcGFyYW1ldGVyIG11c3QgYmUgYSBmdW5jdGlvblwiKSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcImFkZFRvIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYW4gb2JqZWN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbS5hZGRUbygpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJNZXRob2Q6IGFkZFRvIG1ldGhvZCByZXF1aXJlcyBhbiBvYmplY3QgcGFyYW1ldGVyXCIpKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBtLmFkZFRvKDUpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJNZXRob2Q6IGFkZFRvIG1ldGhvZCByZXF1aXJlcyBhbiBvYmplY3QgcGFyYW1ldGVyXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgYWRkIHRoZSBtZXRob2QgdG8gdGhlIHNwZWNpZmllZCBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbS5hZGRUbyhQZXJzb24pO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5ydW5zRm9yT2ZmaWNlKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGl0KFwic2hvdWxkIGFsbG93IHRoZSBtZXRob2QgdG8gYmUgY2FsbGVkIGZyb20gdGhlIHNwZWNpZmllZCBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbS5hZGRUbyhQZXJzb24pO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5ydW5zRm9yT2ZmaWNlKCkpLnRvQmUodHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG4iLCIvKmdsb2JhbCBkZXNjcmliZSwgaXQsIGJlZm9yZUVhY2gsIGV4cGVjdCwgeGl0LCBqYXNtaW5lLCBzcHlPbiAqL1xuXG5kZXNjcmliZShcIk1vZGVsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgTW9kZWwgPSByZXF1aXJlKCcuLi8uLi9zcmMvY29yZS9tb2RlbC5qcycpLFxuICAgICAgICBBdHRyID0gcmVxdWlyZSgnLi4vLi4vc3JjL2NvcmUvYXR0ci5qcycpLFxuICAgICAgICBBdHRyTGlzdCA9IHJlcXVpcmUoJy4uLy4uL3NyYy9jb3JlL2F0dHJfbGlzdC5qcycpLFxuICAgICAgICBNZXRob2QgPSByZXF1aXJlKCcuLi8uLi9zcmMvY29yZS9tZXRob2QuanMnKSxcbiAgICAgICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi4vLi4vc3JjL3V0aWwvZXZlbnRfZW1pdHRlci5qcycpLFxuICAgICAgICBnZXRNb2RlbCA9IE1vZGVsLmdldE1vZGVsLFxuICAgICAgICBnZXRNb2RlbHMgPSBNb2RlbC5nZXRNb2RlbHMsXG4gICAgICAgIFBlcnNvbjtcblxuXG4gICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHRoaXMgY3JlYXRlcyBhbiBhbm9ueW1vdXMgbW9kZWxcbiAgICAgICAgUGVyc29uID0gbmV3IE1vZGVsKCk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcIiNnZXRNb2RlbFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0IChcInNob3VsZCByZXR1cm4gdGhlIHNwZWNpZmllZCBtb2RlbFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgVGVzdCA9IG5ldyBNb2RlbChcIlRlc3QxXCIpLFxuICAgICAgICAgICAgICAgIFRlc3QyID0gbmV3IE1vZGVsKFwiVGVzdDJcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChnZXRNb2RlbChcIlRlc3QxXCIpKS50b0VxdWFsKFRlc3QpO1xuICAgICAgICAgICAgZXhwZWN0KGdldE1vZGVsKFwiVGVzdDJcIikpLm5vdC50b0VxdWFsKFRlc3QpO1xuICAgICAgICAgICAgZXhwZWN0KGdldE1vZGVsKFwiVGVzdDJcIikpLnRvRXF1YWwoVGVzdDIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCAoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGFyZyBpcyBub3QgYSBzdHJpbmdcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBnZXRNb2RlbCg1KTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQgKFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBtb2RlbCBpcyBub3QgZm91bmRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBnZXRNb2RlbChcIm5vdEFNb2RlbFwiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coKTsgXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCIjZ2V0TW9kZWxzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQgKFwic2hvdWxkIHJldHVybiBhbiBhcnJheSBvZiB0aGUgbW9kZWwgbmFtZXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIFRlc3QgPSBuZXcgTW9kZWwoXCJUZXN0MVwiKSxcbiAgICAgICAgICAgICAgICBUZXN0MiA9IG5ldyBNb2RlbChcIlRlc3QyXCIpLFxuICAgICAgICAgICAgICAgIFRlc3QzO1xuXG4gICAgICAgICAgICBleHBlY3QoZ2V0TW9kZWxzKCkuaW5kZXhPZihcIlRlc3QxXCIpKS50b0JlR3JlYXRlclRoYW4oLTEpO1xuICAgICAgICAgICAgZXhwZWN0KGdldE1vZGVscygpLmluZGV4T2YoXCJUZXN0MlwiKSkudG9CZUdyZWF0ZXJUaGFuKC0xKTtcbiAgICAgICAgICAgIGV4cGVjdChnZXRNb2RlbHMoKS5pbmRleE9mKFwiVGVzdDNcIikpLnRvQmUoLTEpO1xuICAgICAgICAgICAgVGVzdDMgPSBuZXcgTW9kZWwoXCJUZXN0M1wiKTtcbiAgICAgICAgICAgIGV4cGVjdChnZXRNb2RlbHMoKS5pbmRleE9mKFwiVGVzdDNcIikpLnRvQmVHcmVhdGVyVGhhbigtMSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCIjY29uc3RydWN0b3JcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBkZXNjcmliZShcIm1vZGVsIG5hbWUgZmVhdHVyZXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaXQgKFwic2hvdWxkIGFsbG93IGZvciBhIHN0cmluZyB0byBiZSBzZW50IGFzIGEgZmlyc3QgYXJnXCIsXG4gICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgUGVyc29uID0gbmV3IE1vZGVsKFwiUGVyc29uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaXQgKFwic2hvdWxkIGFsbG93IGEgc3BlYyBmdW5jdGlvbiB0byBiZSBzZW50IGluIGFzIGEgc2Vjb25kIGFyZ1wiLFxuICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICB2YXIgcDtcbiAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgUGVyc29uID0gbmV3IE1vZGVsKFwiUGVyc29uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibmFtZVwiKS53aGljaC5pc0EoXCJzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzQW4oXCJhZ2VcIikud2hpY2guaXNBbihcImludGVnZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuXG4gICAgICAgICAgICAgICAgICAgICBwID0gbmV3IFBlcnNvbigpO1xuICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHAuYWdlKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHAubmFtZSkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaXQgKFwic2hvdWxkIGFsbG93IGZvciBtdWx0aXBsZSBtb2RlbHMgdG8gYmUgY3JlYXRlZCBhbmQgc3RvcmVkXCIsXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBmb3IgYSBidWdmaXhcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBEb2c7XG5cbiAgICAgICAgICAgICAgICAgICAgRG9nID0gbmV3IE1vZGVsKFwiRG9nXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcIm5hbWVcIik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbChcIlBlcnNvblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoZ2V0TW9kZWwoXCJQZXJzb25cIikpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChnZXRNb2RlbChcIkRvZ1wiKSkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpdCAoXCJzaG91bGQgc3RvcmUgdGhlIG1vZGVsIGJ5IGl0cyBuYW1lIGlmIHRoZSBuYW1lIGlzIHNwZWNpZmllZFwiLFxuICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICB2YXIgUGVyc29uQWxpYXM7XG5cbiAgICAgICAgICAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbChcIlBlcnNvblwiKTtcbiAgICAgICAgICAgICAgICAgICAgIFBlcnNvbkFsaWFzID0gZ2V0TW9kZWwoXCJQZXJzb25cIik7XG4gICAgICAgICAgICAgICAgICAgICBleHBlY3QoUGVyc29uKS50b0VxdWFsKFBlcnNvbkFsaWFzKTtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaXQgKFwic2hvdWxkIG92ZXJ3cml0ZSB0aGUgb2xkIG1vZGVsIGlmIHRoZSBtb2RlbCBjb25zdHJ1Y3RvciBpcyBcIiArXG4gICAgICAgICAgICAgICAgIFwiIGNhbGxlZCBhZ2FpblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICB2YXIgUGVyc29uMiA9IG5ldyBNb2RlbChcIlBlcnNvblwiKTtcbiAgICAgICAgICAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbChcIlBlcnNvblwiKTtcbiAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChQZXJzb24yKS5ub3QudG9FcXVhbChnZXRNb2RlbChcIlBlcnNvblwiKSk7XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGl0IChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgbW9kZWwgbmFtZSBpcyBub3QgYSBzdHJpbmdcIixcbiAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoNSk7XG4gICAgICAgICAgICAgICAgICAgICB9KS50b1Rocm93KCk7XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cblxuICAgICAgICAgICAgaXQgKFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBzcGVjIGZ1bmN0aW9uIGlzIG5vdCBhIGZ1bmN0aW9uXCIsXG4gICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgUGVyc29uID0gbmV3IE1vZGVsKFwiUGVyc29uXCIsIDUpO1xuICAgICAgICAgICAgICAgICAgICAgfSkudG9UaHJvdygpO1xuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwiaGFzQSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCBjcmVhdGUgYSBuZXcgQXR0ciB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYSA9IFBlcnNvbi5oYXNBKFwiZnJpZW5kXCIpO1xuICAgICAgICAgICAgZXhwZWN0KGEgaW5zdGFuY2VvZiBBdHRyKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGUoXCJmcmllbmRcIikpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIGFkZCB0aGUgYXR0cmlidXRlIHRvIHRoZSBzcGVjIG9iamVjdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQZXJzb24uaGFzQShcImZyaWVuZFwiKTtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uYXR0cmlidXRlKFwiZnJpZW5kXCIpKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCByZXR1cm4gdGhlIEF0dHIgb2JqZWN0IHNvIGl0IGNhbiBiZSBjYXNjYWRlZCB3aXRoIG90aGVyIGZ1bmN0aW9uc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYSA9IFBlcnNvbi5oYXNBKFwiZnJpZW5kXCIpO1xuICAgICAgICAgICAgZXhwZWN0KGEgaW5zdGFuY2VvZiBBdHRyKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGUoXCJmcmllbmRcIikpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoYS52YWxpZGF0ZXNXaXRoKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgcGFyYW1ldGVyIGlzIG5vdCBhIHN0cmluZ1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFBlcnNvbi5oYXNBKDUpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJNb2RlbDogaGFzQSBwYXJhbWV0ZXIgbXVzdCBiZSBhIHN0cmluZ1wiKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJoYXNBbiBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCBiZSBhbiBhbGlhcyBmb3IgdGhlIGhhc0EgbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdCh0aGlzLmhhc0FuKS50b0VxdWFsKHRoaXMuaGFzQSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJoYXNTb21lIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KFwic2hvdWxkIGJlIGFuIGFsaWFzIGZvciB0aGUgaGFzQSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KHRoaXMuaGFzU29tZSkudG9FcXVhbCh0aGlzLmhhc0EpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwiaGFzTWFueSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCBjcmVhdGUgYSBuZXcgQXR0ckxpc3Qgb2JqZWN0IHdpdGggdGhlIHNwZWNpZmllZCBuYW1lXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhbCA9IFBlcnNvbi5oYXNNYW55KFwiZnJpZW5kc1wiKTtcbiAgICAgICAgICAgIGV4cGVjdChhbCBpbnN0YW5jZW9mIEF0dHJMaXN0KS50b0JlKHRydWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBhZGQgdGhlIEF0dHJMaXN0IHRvIHRoZSBNb2RlbCBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgUGVyc29uLmhhc01hbnkoXCJmcmllbmRzXCIpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGUoXCJmcmllbmRzXCIpKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGUoXCJmcmllbmRzXCIpIGluc3RhbmNlb2YgQXR0ckxpc3QpLnRvQmUodHJ1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHJldHVybiB0aGUgQXR0ckxpc3Qgc28gaXQgY2FuIGJlIGNhc2NhZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhbCA9IFBlcnNvbi5oYXNNYW55KFwiZnJpZW5kc1wiKTtcbiAgICAgICAgICAgIGV4cGVjdChhbCBpbnN0YW5jZW9mIEF0dHJMaXN0KS50b0JlKHRydWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBiZSBjYWxsYWJsZSB0d2ljZSBvbiB0aGUgc2FtZSBzcGVjXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGFsID0gUGVyc29uLmhhc01hbnkoXCJmcmllbmRzXCIpLFxuICAgICAgICAgICAgYWwyID0gUGVyc29uLmhhc01hbnkoXCJjYXRzXCIpO1xuXG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmF0dHJpYnV0ZShcImZyaWVuZHNcIikpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmF0dHJpYnV0ZShcImNhdHNcIikpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoYWwgaW5zdGFuY2VvZiBBdHRyTGlzdCkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChhbDIgaW5zdGFuY2VvZiBBdHRyTGlzdCkudG9CZSh0cnVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgYmUgY2FsbGFibGUgdHdpY2Ugb24gMiBkaWZmZXJlbnQgc3BlY3NcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbTIgPSBuZXcgTW9kZWwoKSxcbiAgICAgICAgICAgIGFsID0gUGVyc29uLmhhc01hbnkoXCJmcmllbmRzXCIpLFxuICAgICAgICAgICAgYWwyID0gbTIuaGFzTWFueShcImNhdHNcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uYXR0cmlidXRlKFwiZnJpZW5kc1wiKSkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChtMi5hdHRyaWJ1dGUoXCJjYXRzXCIpKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KGFsIGluc3RhbmNlb2YgQXR0ckxpc3QpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICBleHBlY3QoYWwyIGluc3RhbmNlb2YgQXR0ckxpc3QpLnRvQmUodHJ1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBwYXJhbWV0ZXIgaXMgbm90IGEgc3RyaW5nXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgUGVyc29uLmhhc01hbnkoNSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIk1vZGVsOiBoYXNNYW55IHBhcmFtZXRlciBtdXN0IGJlIGEgc3RyaW5nXCIpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcImF0dHJpYnV0ZSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCByZXR1cm4gdGhlIGF0dHJpYnV0ZSBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBhdHRyaWJ1dGUgbmFtZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYSxcbiAgICAgICAgICAgIGFsO1xuXG4gICAgICAgICAgICBQZXJzb24uaGFzQShcIm5hbWVcIik7XG4gICAgICAgICAgICBhID0gUGVyc29uLmF0dHJpYnV0ZShcIm5hbWVcIik7XG4gICAgICAgICAgICBleHBlY3QoYSBpbnN0YW5jZW9mIEF0dHIpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICBleHBlY3QoYSBpbnN0YW5jZW9mIEF0dHJMaXN0KS50b0JlKGZhbHNlKTtcblxuICAgICAgICAgICAgUGVyc29uLmhhc01hbnkoXCJmcmllbmRzXCIpO1xuICAgICAgICAgICAgYWwgPSBQZXJzb24uYXR0cmlidXRlKFwiZnJpZW5kc1wiKTtcbiAgICAgICAgICAgIGV4cGVjdChhbCBpbnN0YW5jZW9mIEF0dHIpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICBleHBlY3QoYWwgaW5zdGFuY2VvZiBBdHRyTGlzdCkudG9CZSh0cnVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGF0dHJpYnV0ZSBkb2Vzbid0IGV4aXN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhO1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhID0gUGVyc29uLmF0dHJpYnV0ZShcIm5hbWVcIik7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIk1vZGVsOiBhdHRyaWJ1dGUgbmFtZSBkb2VzIG5vdCBleGlzdCFcIikpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGEgc3RyaW5nXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgUGVyc29uLmF0dHJpYnV0ZSg1KTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiTW9kZWw6IGV4cGVjdGVkIHN0cmluZyBhcmd1bWVudCB0byBhdHRyaWJ1dGUgbWV0aG9kLCBidXQgcmVjaWV2ZWQgNVwiKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJhdHRyaWJ1dGVzIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KFwic2hvdWxkIHJldHVybiBhbiBlbXB0eSBhcnJheSBpZiB0aGUgbW9kZWwgaGFzIG5vIGF0dHJpYnV0ZXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGVzKCkpLnRvRXF1YWwoW10pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCByZXR1cm4gYW4gYXJyYXkgb2YgTW9kZWwgYXR0cmlidXRlIG5hbWVzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFBlcnNvbi5oYXNBKFwiZmlyc3ROYW1lXCIpO1xuICAgICAgICAgICAgUGVyc29uLmhhc0EoXCJsYXN0TmFtZVwiKTtcbiAgICAgICAgICAgIFBlcnNvbi5oYXNBbihcImlkXCIpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGVzKCkubGVuZ3RoID09PSAzKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGVzKCkuaW5kZXhPZihcImZpcnN0TmFtZVwiKSA+IC0xKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGVzKCkuaW5kZXhPZihcImxhc3ROYW1lXCIpID4gLTEpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmF0dHJpYnV0ZXMoKS5pbmRleE9mKFwiaWRcIikgPiAtMSkudG9CZSh0cnVlKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBpdChcInNob3VsZCB3b3JrIHdoZW4gdGhlIG1vZGVsIGlzIGNyZWF0ZWQgdXNpbmcgYSBzcGVjaWZpY2F0aW9uIGZ1bmN0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBQZXJzb24gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcImZpcnN0TmFtZVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJsYXN0TmFtZVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0FuKFwiaWRcIik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGVzKCkubGVuZ3RoID09PSAzKTtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uYXR0cmlidXRlcygpLmluZGV4T2YoXCJmaXJzdE5hbWVcIikgPiAtMSkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uYXR0cmlidXRlcygpLmluZGV4T2YoXCJsYXN0TmFtZVwiKSA+IC0xKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGVzKCkuaW5kZXhPZihcImlkXCIpID4gLTEpLnRvQmUodHJ1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHJldHVybiBhbiBhcnJheSBvZiBNb2RlbCBhdHRyaWJ1dGUgbmFtZXMgZXZlbiBpZiBjcmVhdGVkIHZpYSBhIG1vZGVsIHNwZWNpZmljYXRpb25cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIFBlcnNvbiA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwiZmlyc3ROYW1lXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcImxhc3ROYW1lXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcImpvYlwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgRW1wbG95ZWUgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBKFBlcnNvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwic2FsYXJ5XCIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIFBlcnNvbi5oYXNBKFwidGhpbmdcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uYXR0cmlidXRlcygpLmxlbmd0aCA9PT0gNCkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uYXR0cmlidXRlcygpLmluZGV4T2YoXCJmaXJzdE5hbWVcIikgPiAtMSkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uYXR0cmlidXRlcygpLmluZGV4T2YoXCJ0aGluZ1wiKSA+IC0xKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5hdHRyaWJ1dGVzKCkuaW5kZXhPZihcImpvYlwiKSA+IC0xKS50b0JlKHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwibWV0aG9kcyBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCByZXR1cm4gYW4gZW1wdHkgYXJyYXkgaWYgdGhlIG1vZGVsIGhhcyBubyBtZXRob2RzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24ubWV0aG9kcygpKS50b0VxdWFsKFtdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmV0dXJuIGFuIGFycmF5IG9mIE1vZGVsIG1ldGhvZCBuYW1lc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQZXJzb24ucmVzcG9uZHNUbyhcInJ1bnNGb3JPZmZpY2VcIiwgZnVuY3Rpb24gKCkge30pO1xuICAgICAgICAgICAgUGVyc29uLnJlc3BvbmRzVG8oXCJzb21ldGhpbmdFbHNlXCIsIGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24ubWV0aG9kcygpLmxlbmd0aCA9PT0gMik7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLm1ldGhvZHMoKS5pbmRleE9mKFwicnVuc0Zvck9mZmljZVwiKSA+IC0xKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi5tZXRob2RzKCkuaW5kZXhPZihcInNvbWV0aGluZ0Vsc2VcIikgPiAtMSkudG9CZSh0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcIm1ldGhvZCBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCByZXR1cm4gdGhlIG1ldGhvZCBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBtZXRob2QgbmFtZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbTtcbiAgICAgICAgICAgIFBlcnNvbi5yZXNwb25kc1RvKFwiaXNBd2Vzb21lXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtID0gUGVyc29uLm1ldGhvZChcImlzQXdlc29tZVwiKTtcblxuICAgICAgICAgICAgZXhwZWN0KG0gaW5zdGFuY2VvZiBNZXRob2QpLnRvQmUodHJ1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBtZXRob2QgZG9lc24ndCBleGlzdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbTtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbSA9IFBlcnNvbi5tZXRob2QoXCJpc0F3ZXNvbWVcIik7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIk1vZGVsOiBtZXRob2QgaXNBd2Vzb21lIGRvZXMgbm90IGV4aXN0IVwiKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBzdHJpbmdcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24ubWV0aG9kKDUpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJNb2RlbDogZXhwZWN0ZWQgc3RyaW5nIGFyZ3VtZW50IHRvIG1ldGhvZCBtZXRob2QsIGJ1dCByZWNpZXZlZCA1XCIpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcImlzQSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgUGVyc29uLCBcbiAgICAgICAgICAgIEVtcGxveWVlLFxuICAgICAgICAgICAgZSxcbiAgICAgICAgICAgIHA7XG5cbiAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcImZpcnN0TmFtZVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJsYXN0TmFtZVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc01hbnkoXCJmcmllbmRzXCIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25kc1RvKFwic2F5SGVsbG9cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJoZWxsbyBmcm9tIFwiICsgdGhpcy5maXJzdE5hbWUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICBcbiAgICAgICAgICAgIEVtcGxveWVlID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQShQZXJzb24pO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcInNhbGFyeVwiKS53aGljaC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChzYWxhcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZihzYWxhcnkpID09PSBcIm51bWJlclwiO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25kc1RvKFwic2F5SGVsbG9cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJoZWxsbyBmcm9tIGVtcGxveWVlIFwiICsgdGhpcy5maXJzdE5hbWUoKSArIFwiIHdobyBoYXMgc2FsYXJ5IFwiICsgdGhpcy5zYWxhcnkoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGEgTW9kZWxcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQSg1KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiTW9kZWw6IHBhcmFtZXRlciBzZW50IHRvIGlzQSBmdW5jdGlvbiBtdXN0IGJlIGEgTW9kZWxcIikpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNBKGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIk1vZGVsOiBwYXJhbWV0ZXIgc2VudCB0byBpc0EgZnVuY3Rpb24gbXVzdCBiZSBhIE1vZGVsXCIpKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgRW1wbG95ZWUgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQShQZXJzb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJzYWxhcnlcIik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5ub3QudG9UaHJvdyhuZXcgRXJyb3IoXCJNb2RlbDogcGFyYW1ldGVyIHNlbnQgdG8gaXNBIGZ1bmN0aW9uIG11c3QgYmUgYSBNb2RlbFwiKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIG11bHRpcGxlIGluaGVyaXRhbmNlIGlzIGF0dGVtcHRlZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgQ2FyID0gbmV3IE1vZGVsKCksXG4gICAgICAgICAgICAgICAgUGlja3VwID0gbmV3IE1vZGVsKCksXG4gICAgICAgICAgICAgICAgRWxDYW1pbm87XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRWxDYW1pbm8gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQShDYXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQShQaWNrdXApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhcIk1vZGVsOiBNb2RlbCBvbmx5IHN1cHBvcnRzIHNpbmdsZSBpbmhlcml0YW5jZSBhdCB0aGlzIHRpbWVcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIGdpdmUgYWxsIHByb3BlcnRpZXMgb2YgYXJndW1lbnQgbW9kZWwgdG8gdGhpcyBtb2RlbFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZTI7XG4gICAgICAgICAgICBlID0gbmV3IEVtcGxveWVlKCk7XG4gICAgICAgICAgICBwID0gbmV3IFBlcnNvbigpO1xuXG4gICAgICAgICAgICBleHBlY3QoZS5maXJzdE5hbWUpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoZS5sYXN0TmFtZSkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmZyaWVuZHMpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoZS5zYWxhcnkpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QocC5zYWxhcnkpLnRvQmVVbmRlZmluZWQoKTtcblxuXG4gICAgICAgICAgICBlLmZpcnN0TmFtZShcIlNlbW15XCIpLmxhc3ROYW1lKFwiUHVyZXdhbFwiKS5zYWxhcnkoNTAwMCk7XG4gICAgICAgICAgICBwLmZpcnN0TmFtZShcIkpvaG5cIikubGFzdE5hbWUoXCJGcmltbWVsbFwiKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmZpcnN0TmFtZSgpKS50b0JlKFwiU2VtbXlcIik7XG4gICAgICAgICAgICBleHBlY3QoZS5sYXN0TmFtZSgpKS50b0JlKFwiUHVyZXdhbFwiKTtcbiAgICAgICAgICAgIGV4cGVjdChlLnNhbGFyeSgpKS50b0JlKDUwMDApO1xuICAgICAgICAgICAgZXhwZWN0KHAuZmlyc3ROYW1lKCkpLnRvQmUoXCJKb2huXCIpO1xuICAgICAgICAgICAgZXhwZWN0KHAubGFzdE5hbWUoKSkudG9CZShcIkZyaW1tZWxsXCIpO1xuXG4gICAgICAgICAgICBlMiA9IG5ldyBFbXBsb3llZSgpO1xuICAgICAgICAgICAgZTIuZmlyc3ROYW1lKFwiTWFya1wiKS5sYXN0TmFtZShcIlBoaWxsaXBzXCIpLnNhbGFyeSg1MDAxKTtcblxuICAgICAgICAgICAgZXhwZWN0KGUyLmZpcnN0TmFtZSgpKS50b0JlKFwiTWFya1wiKTtcbiAgICAgICAgICAgIGV4cGVjdChlMi5sYXN0TmFtZSgpKS50b0JlKFwiUGhpbGxpcHNcIik7XG4gICAgICAgICAgICBleHBlY3QoZTIuc2FsYXJ5KCkpLnRvQmUoNTAwMSk7XG4gICAgICAgICAgICBleHBlY3QoZS5maXJzdE5hbWUoKSkudG9CZShcIlNlbW15XCIpO1xuICAgICAgICAgICAgZXhwZWN0KGUubGFzdE5hbWUoKSkudG9CZShcIlB1cmV3YWxcIik7XG4gICAgICAgICAgICBleHBlY3QoZS5zYWxhcnkoKSkudG9CZSg1MDAwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJtZXRob2RzIGluIGN1cnJlbnQgbW9kZWwgc2hvdWxkIG92ZXJyaWRlIGFueSBtZXRob2RzIGluIHByZXZpb3VzIG1vZGVsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGUgPSBuZXcgRW1wbG95ZWUoKTtcbiAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGUuZmlyc3ROYW1lKFwiSm9oblwiKS5zYWxhcnkoNTAwMCk7XG4gICAgICAgICAgICBwLmZpcnN0TmFtZShcIlNlbW15XCIpO1xuXG4gICAgICAgICAgICBleHBlY3QoZS5zYXlIZWxsbygpKS50b0VxdWFsKFwiaGVsbG8gZnJvbSBlbXBsb3llZSBKb2huIHdobyBoYXMgc2FsYXJ5IDUwMDBcIik7XG4gICAgICAgICAgICBleHBlY3QocC5zYXlIZWxsbygpKS50b0VxdWFsKFwiaGVsbG8gZnJvbSBTZW1teVwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgbm90IGJlIGltbXV0YWJsZSBpZiB0aGUgcGFyZW50IG1vZGVsIGlzIG5vdCBpbW11dGFibGVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgUGVyc29uID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJmaXJzdE5hbWVcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibGFzdE5hbWVcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0ltbXV0YWJsZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJmaXJzdE5hbWVcIiwgXCJsYXN0TmFtZVwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwID0gbmV3IFBlcnNvbihcImhlbGxvXCIsXCJ3b3JsZFwiKTtcbiAgICAgICAgICAgIGV4cGVjdChwLmZpcnN0TmFtZSgpKS50b0JlKFwiaGVsbG9cIik7XG4gICAgICAgICAgICBleHBlY3QocC5sYXN0TmFtZSgpKS50b0JlKFwid29ybGRcIik7XG5cbiAgICAgICAgICAgIEVtcGxveWVlID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQShQZXJzb24pO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcInNhbGFyeVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKFwibGFzdE5hbWVcIik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwID0gbmV3IFBlcnNvbihcInNlbW15XCIpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhcIkNvbnN0cnVjdG9yIHJlcXVpcmVzIGZpcnN0TmFtZSwgbGFzdE5hbWUgdG8gYmUgc3BlY2lmaWVkXCIpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGUgPSBuZXcgRW1wbG95ZWUoKTtcbiAgICAgICAgICAgICAgICBlLmxhc3ROYW1lKFwiaGVsbG9cIik7XG4gICAgICAgICAgICAgICAgZS5sYXN0TmFtZShcIndvcmxkXCIpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcblxuICAgICAgICAgICAgZXhwZWN0KGUubGFzdE5hbWUoKSkudG9CZShcIndvcmxkXCIpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKFwiam9oblwiLCBcInJlc2lnXCIpO1xuICAgICAgICAgICAgICAgIHAubGFzdE5hbWUoXCJzbWl0aFwiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coXCJjYW5ub3Qgc2V0IHRoZSBpbW11dGFibGUgcHJvcGVydHkgbGFzdE5hbWUgYWZ0ZXIgaXQgaGFzIGJlZW4gc2V0XCIpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwib2JqZWN0cyBvZiB0aGUgcmVzdWx0aW5nIG1vZGVsIHNob3VsZCBiZSBhbiBpbnN0YW5jZW9mIGFyZ3VtZW50IG1vZGVsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGUgPSBuZXcgRW1wbG95ZWUoKTtcbiAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICBleHBlY3QoZSBpbnN0YW5jZW9mIEVtcGxveWVlKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KGUgaW5zdGFuY2VvZiBQZXJzb24pLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICBleHBlY3QocCBpbnN0YW5jZW9mIFBlcnNvbikudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChwIGluc3RhbmNlb2YgRW1wbG95ZWUpLnRvQmUoZmFsc2UpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBhbGxvdyBmb3IgZGVlcGVyIGluaGVyaXRhbmNlIGhpZXJhcmNoaWVzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBBLCBCLCBDLCBELCBFLCBhLCBiLCBjLCBkLCBlO1xuXG4gICAgICAgICAgICBBID0gbmV3IE1vZGVsKCk7XG4gICAgICAgICAgICBCID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQW4oQSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIEMgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBKEIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBEID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQShCKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgRSA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0EoRCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYSA9IG5ldyBBKCk7XG4gICAgICAgICAgICBiID0gbmV3IEIoKTtcbiAgICAgICAgICAgIGMgPSBuZXcgQygpO1xuICAgICAgICAgICAgZCA9IG5ldyBEKCk7XG4gICAgICAgICAgICBlID0gbmV3IEUoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZXhwZWN0KGEgaW5zdGFuY2VvZiBBKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KGEgaW5zdGFuY2VvZiBCKS50b0JlKGZhbHNlKTtcbiAgICAgICAgICAgIGV4cGVjdChhIGluc3RhbmNlb2YgQykudG9CZShmYWxzZSk7XG4gICAgICAgICAgICBleHBlY3QoYSBpbnN0YW5jZW9mIEQpLnRvQmUoZmFsc2UpO1xuICAgICAgICAgICAgZXhwZWN0KGEgaW5zdGFuY2VvZiBFKS50b0JlKGZhbHNlKTtcbiAgICAgICAgICAgIGV4cGVjdChiIGluc3RhbmNlb2YgQikudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChiIGluc3RhbmNlb2YgQSkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChiIGluc3RhbmNlb2YgQykudG9CZShmYWxzZSk7XG4gICAgICAgICAgICBleHBlY3QoYiBpbnN0YW5jZW9mIEQpLnRvQmUoZmFsc2UpO1xuICAgICAgICAgICAgZXhwZWN0KGIgaW5zdGFuY2VvZiBFKS50b0JlKGZhbHNlKTtcbiAgICAgICAgICAgIGV4cGVjdChjIGluc3RhbmNlb2YgQykudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChjIGluc3RhbmNlb2YgQikudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChjIGluc3RhbmNlb2YgRCkudG9CZShmYWxzZSk7XG4gICAgICAgICAgICBleHBlY3QoYyBpbnN0YW5jZW9mIEUpLnRvQmUoZmFsc2UpO1xuICAgICAgICAgICAgZXhwZWN0KGQgaW5zdGFuY2VvZiBBKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KGQgaW5zdGFuY2VvZiBCKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KGQgaW5zdGFuY2VvZiBDKS50b0JlKGZhbHNlKTtcbiAgICAgICAgICAgIGV4cGVjdChkIGluc3RhbmNlb2YgRCkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChkIGluc3RhbmNlb2YgRSkudG9CZShmYWxzZSk7XG4gICAgICAgICAgICBleHBlY3QoZSBpbnN0YW5jZW9mIEEpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICBleHBlY3QoZSBpbnN0YW5jZW9mIEIpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICBleHBlY3QoZSBpbnN0YW5jZW9mIEMpLnRvQmUoZmFsc2UpO1xuICAgICAgICAgICAgZXhwZWN0KGUgaW5zdGFuY2VvZiBEKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KGUgaW5zdGFuY2VvZiBFKS50b0JlKHRydWUpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIGNyZWF0ZSBkaWZmZXJlbnQgYXR0cnMgZm9yIGVhY2ggaW5zdGFuY2Ugb2YgdGhlIHN1Ym1vZGVsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBBLFxuICAgICAgICAgICAgICAgIGExLFxuICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgIEIsXG4gICAgICAgICAgICAgICAgYjEsXG4gICAgICAgICAgICAgICAgYjI7XG5cbiAgICAgICAgICAgIEEgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcInRoaW5nXCIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIEIgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBbihBKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBhMSA9IG5ldyBBKCk7XG4gICAgICAgICAgICBhMiA9IG5ldyBBKCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChhMS50aGluZygpKS50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoYTIudGhpbmcoKSkudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgYTEudGhpbmcoNSk7XG4gICAgICAgICAgICBleHBlY3QoYTEudGhpbmcoKSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChhMi50aGluZygpKS50b0JlVW5kZWZpbmVkKCk7XG5cbiAgICAgICAgICAgIGIxID0gbmV3IEIoKTtcbiAgICAgICAgICAgIGIyID0gbmV3IEIoKTtcblxuICAgICAgICAgICAgZXhwZWN0KGIxLnRoaW5nKCkpLnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChiMi50aGluZygpKS50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBiMS50aGluZyg1KTtcbiAgICAgICAgICAgIGV4cGVjdChiMS50aGluZygpKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KGIyLnRoaW5nKCkpLnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgY3JlYXRlIGRpZmZlcmVudCBhdHRyIGxpc3RzIGZvciBlYWNoIGluc3RhbmNlIG9mIHRoZSBzdWJtb2RlbFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgQSxcbiAgICAgICAgICAgICAgICBhLFxuICAgICAgICAgICAgICAgIEIsXG4gICAgICAgICAgICAgICAgYjEsXG4gICAgICAgICAgICAgICAgYjI7XG5cbiAgICAgICAgICAgIEEgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzTWFueShcInRoaW5nc1wiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBCID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQW4oQSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYSA9IG5ldyBBKCk7XG4gICAgICAgICAgICBleHBlY3QoYS50aGluZ3MpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoYS50aGluZ3MoKS5zaXplKCkpLnRvQmUoMCk7XG5cbiAgICAgICAgICAgIGEudGhpbmdzKCkuYWRkKDUpO1xuICAgICAgICAgICAgYS50aGluZ3MoKS5hZGQoNik7XG4gICAgICAgICAgICBleHBlY3QoYS50aGluZ3MoKS5zaXplKCkpLnRvQmUoMik7XG5cbiAgICAgICAgICAgIGIxID0gbmV3IEIoKTtcbiAgICAgICAgICAgIGV4cGVjdChiMS50aGluZ3MpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoYjEudGhpbmdzKCkpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QoYjEudGhpbmdzKCkuc2l6ZSgpKS50b0JlKDApO1xuICAgICAgICAgICAgYjEudGhpbmdzKCkuYWRkKDcpO1xuICAgICAgICAgICAgZXhwZWN0KGIxLnRoaW5ncygpLnNpemUoKSkudG9CZSgxKTtcblxuICAgICAgICAgICAgYjIgPSBuZXcgQigpO1xuICAgICAgICAgICAgZXhwZWN0KGIyLnRoaW5ncykudG9CZURlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChiMi50aGluZ3MoKS5zaXplKCkpLnRvQmUoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIG9mZmVyIGFjY2VzcyB0byB0aGUgc3VwZXIgY2xhc3NlcyBpbml0aWFsaXplciBmdW5jdGlvblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5pdGlhbGl6ZXIsXG4gICAgICAgICAgICAgICAgQSxcbiAgICAgICAgICAgICAgICBhLFxuICAgICAgICAgICAgICAgIEIsXG4gICAgICAgICAgICAgICAgQjIsXG4gICAgICAgICAgICAgICAgYixcbiAgICAgICAgICAgICAgICBiMixcbiAgICAgICAgICAgICAgICBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpbml0aWFsaXplciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTA7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoaW5ncygpLmFkZChpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3B5KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBBID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc01hbnkoXCJ0aGluZ3NcIikuZWFjaE9mV2hpY2guaXNBKFwibnVtYmVyXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoaW5pdGlhbGl6ZXIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGEgPSBuZXcgQSgpO1xuICAgICAgICAgICAgZXhwZWN0KGEudGhpbmdzKCkpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5LmNhbGxzLmxlbmd0aCkudG9FcXVhbCgxKTtcbiAgICAgICAgICAgIGV4cGVjdChhLnRoaW5ncygpLmF0KDApKS50b0JlKDApO1xuICAgICAgICAgICAgZXhwZWN0KGEudGhpbmdzKCkuc2l6ZSgpKS50b0JlKDEwKTtcblxuICAgICAgICAgICAgQiA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0FuKEEpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgodGhpcy5wYXJlbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGIgPSBuZXcgQigpO1xuICAgICAgICAgICAgZXhwZWN0KGIudGhpbmdzKCkpLnRvQmVEZWZpbmVkKCk7XG5cblxuICAgICAgICAgICAgLy90aGlzIGlzIDMgYmVjYXVzZSBpdCBjcmVhdGVzIGEgcHJvdG90eXBlIG9iamVjdCwgdG9vXG4gICAgICAgICAgICBleHBlY3Qoc3B5LmNhbGxzLmxlbmd0aCkudG9FcXVhbCgzKTtcbiAgICAgICAgICAgIGV4cGVjdChiLnRoaW5ncygpLmF0KDApKS50b0JlKDApO1xuICAgICAgICAgICAgZXhwZWN0KGIudGhpbmdzKCkuc2l6ZSgpKS50b0JlKDEwKTtcblxuICAgICAgICAgICAgQjIgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICAgICAgICAgIHRoaXMuaXNBbihBKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5wYXJlbnQuYXBwbHkodGhpcyxhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGIyID0gbmV3IEIyKCk7XG5cbiAgICAgICAgICAgIC8vdGhpcyBpcyA1IGJlY2F1c2UgaXQgY3JlYXRlcyBhIHByb3RvdHlwZSBvYmplY3QsIHRvb1xuICAgICAgICAgICAgZXhwZWN0KHNweS5jYWxscy5sZW5ndGgpLnRvRXF1YWwoNSk7XG4gICAgICAgICAgICBleHBlY3QoYjIudGhpbmdzKCkuYXQoMCkpLnRvQmUoMCk7XG4gICAgICAgICAgICBleHBlY3QoYjIudGhpbmdzKCkuc2l6ZSgpKS50b0JlKDEwKTtcblxuICAgICAgICAgICAgdmFyIGMgPSBuZXcgQigpO1xuICAgICAgICAgICAgZXhwZWN0KGMudGhpbmdzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KGMudGhpbmdzKCkuYXQoMCkpLnRvQmUoMCk7XG4gICAgICAgICAgICBleHBlY3QoYy50aGluZ3MoKS5zaXplKCkpLnRvQmUoMTApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjLnRoaW5ncygpLmFkZCgyMCk7XG4gICAgICAgICAgICBleHBlY3QoYy50aGluZ3MoKS5zaXplKCkpLnRvQmUoMTEpO1xuICAgICAgICAgICAgZXhwZWN0KGEudGhpbmdzKCkuc2l6ZSgpKS50b0JlKDEwKTtcbiAgICAgICAgICAgIGV4cGVjdChiLnRoaW5ncygpLnNpemUoKSkudG9CZSgxMCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChjIGluc3RhbmNlb2YgQikudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChiIGluc3RhbmNlb2YgQSkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChiMiBpbnN0YW5jZW9mIEIyKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KGIgaW5zdGFuY2VvZiBCMikudG9CZShmYWxzZSk7XG4gICAgICAgICAgICBleHBlY3QoYjIgaW5zdGFuY2VvZiBCKS50b0JlKGZhbHNlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8vaG1tbW1tXG4gICAgICAgIHhpdChcInNob3VsZCBub3QgY2xvYmJlciBjb25zdHJ1Y3RvciB2YXJpYWJsZXMgd2hlbiBwYXJlbnQgaW5pdGlhbGl6ZXIgaXMgY2FsbGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBQZXJzb24sIEVtcGxveWVlLCBlO1xuXG4gICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcIm5hbWVcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBbihcImFnZVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKFwibmFtZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWdlKDE4KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBFbXBsb3llZSA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5pc0EoUGVyc29uKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJuYW1lXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5wYXJlbnQuYXBwbHkodGhpcywgW3RoaXMubmFtZSgpXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZSA9IG5ldyBFbXBsb3llZShcIk1hcmtcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChlLmFnZSgpKS50b0JlKDE4KTtcbiAgICAgICAgICAgIGV4cGVjdChlLm5hbWUoKSkudG9CZShcIk1hcmtcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIG5vdCB0aHJvdyBhbiBlcnJvciBpZiBpc0J1aWx0V2l0aCBpcyBzcGVjaWZpZWQgaW4gdGhlIHN1cGVyLW1vZGVsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibmFtZVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0FuKFwiaWRcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0J1aWx0V2l0aChcIm5hbWVcIiwgXCJpZFwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBFbXBsb3llZSA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0EoUGVyc29uKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJzYWxhcnlcIik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlID0gbmV3IEVtcGxveWVlKCk7XG4gICAgICAgICAgICB9KS5ub3QudG9UaHJvdyhuZXcgRXJyb3IoXCJDb25zdHJ1Y3RvciByZXF1aXJlcyBuYW1lIHRvIGJlIHNwZWNpZmllZFwiKSk7XG5cbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcCA9IG5ldyBQZXJzb24oXCJzZW1teVwiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiQ29uc3RydWN0b3IgcmVxdWlyZXMgbmFtZSwgaWQgdG8gYmUgc3BlY2lmaWVkXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLyogdGhpcyBmZWF0dXJlIGhhcyBiZWVuIGRlcHJlY2F0ZWQgdW50aWwgd2UgY2FuIGZpbmQgYSBiZXR0ZXIgd2F5IHRvIFxuICAgICAgICAgKiBhbGxvdyBmb3Igbm9uIHByaW1pdGl2ZSAnaXNBJyB0eXBlc1xuICAgICAgICAgKi9cbiAgICAgICAgeGl0KFwic2hvdWxkIGFsbG93IGNpcmN1bGFyIGlzQSByZWZlcmVuY2VzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBIdW1hbiwgRmVycmV0O1xuXG4gICAgICAgICAgICBGZXJyZXQgPSBuZXcgTW9kZWwoKTtcblxuICAgICAgICAgICAgSHVtYW4gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcImZlcnJldFwiKS53aGljaC5pc0EoRmVycmV0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpLndoaWNoLmlzQShcInN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKFwibmFtZVwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgUGVyc29uID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJmZXJyZXRcIikud2hpY2gudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAoZmVycmV0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmZXJyZXQgaW5zdGFuY2VvZiBGZXJyZXQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibmFtZVwiKS53aGljaC5pc0EoXCJzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0J1aWx0V2l0aChcIm5hbWVcIik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgRmVycmV0ID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJvd25lclwiKS53aGljaC5pc0EoSHVtYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcIm5hbWVcIikud2hpY2guaXNBKFwic3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJuYW1lXCIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBmZXJyZXQgPSBuZXcgRmVycmV0KFwibW9lXCIpO1xuICAgICAgICAgICAgdmFyIGh1bWFuID0gbmV3IEh1bWFuKFwiY3VybHlcIik7XG4gICAgICAgICAgICB2YXIgcGVyc29uID0gbmV3IFBlcnNvbihcImxhcnJ5XCIpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBlcnNvbi5mZXJyZXQoZmVycmV0KTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgICAgICAgICBodW1hbi5mZXJyZXQoZmVycmV0KTtcbiAgICAgICAgICAgIGZlcnJldC5vd25lcihodW1hbik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgICAgICBcbiAgICBkZXNjcmliZShcImlzSW1tdXRhYmxlIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSAge1xuICAgICAgICBpdChcInNob3VsZCBiZSBkZWZpbmVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uaXNJbW11dGFibGUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIG1ha2UgYWxsIGF0dHJpYnV0ZXMgaW1tdXRhYmxlIHdoZW4gdGhlIGNvbnN0cnVjdG9yIGlzIGNhbGxlZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcCxcbiAgICAgICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzSW1tdXRhYmxlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcImZpcnN0TmFtZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibGFzdE5hbWVcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJmaXJzdE5hbWVcIiwgXCJsYXN0TmFtZVwiKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcCA9IG5ldyBQZXJzb24oXCJoZWxsb1wiLCBcIndvcmxkXCIpO1xuICAgICAgICAgICAgZXhwZWN0KHAuZmlyc3ROYW1lKCkpLnRvQmUoXCJoZWxsb1wiKTtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcC5maXJzdE5hbWUoXCJuZXduYW1lXCIpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJjYW5ub3Qgc2V0IHRoZSBpbW11dGFibGUgcHJvcGVydHkgZmlyc3ROYW1lIGFmdGVyIGl0IGhhcyBiZWVuIHNldFwiKSk7XG5cbiAgICAgICAgICAgIGV4cGVjdChwLmxhc3ROYW1lKCkpLnRvQmUoXCJ3b3JsZFwiKTtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcC5sYXN0TmFtZShcIm5ld2xhc3RuYW1lXCIpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJjYW5ub3Qgc2V0IHRoZSBpbW11dGFibGUgcHJvcGVydHkgbGFzdE5hbWUgYWZ0ZXIgaXQgaGFzIGJlZW4gc2V0XCIpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cblxuICAgIGRlc2NyaWJlKFwiaW5zdGFuY2UgcmVzdWx0aW5nIGZyb20gbW9kZWxcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBkZXNjcmliZShcInRvSlNPTiBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIERvZztcblxuICAgICAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRG9nID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibmFtZVwiKS53aGljaC5pc0EoXCJzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzQW4oXCJvd25lclwiKS53aGljaC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChvd25lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG93bmVyIGluc3RhbmNlb2YgUGVyc29uO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIFBlcnNvbi5oYXNBKFwibmFtZVwiKS53aGljaC5pc0EoXCJzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgUGVyc29uLmhhc0FuKFwiaWRcIikud2hpY2guaXNBbihcImludGVnZXJcIik7XG5cbiAgICAgICAgICAgICAgICBQZXJzb24uaGFzQShcImRvZ1wiKS53aGljaC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChkb2cpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvZyBpbnN0YW5jZW9mIERvZztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpdChcInNob3VsZCBleGlzdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHAudG9KU09OKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHJldHVybiBhIEpTT04gb2JqZWN0IHRoYXQgaW5jbHVkZXMgYWxsIGF0dHJpYnV0ZXMgb2YgdGhlIG1vZGVsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCxcbiAgICAgICAgICAgICAgICAgICAgcDIsXG4gICAgICAgICAgICAgICAgICAgIGQgPSBuZXcgRG9nKCksXG4gICAgICAgICAgICAgICAgICAgIHBKU09OLFxuICAgICAgICAgICAgICAgICAgICBkSlNPTjtcblxuICAgICAgICAgICAgICAgIFBlcnNvbi5oYXNBKFwiZnJpZW5kXCIpLndoaWNoLnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKGZyaWVuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnJpZW5kIGluc3RhbmNlb2YgUGVyc29uO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcCA9IG5ldyBQZXJzb24oKTtcbiAgICAgICAgICAgICAgICBwMiA9IG5ldyBQZXJzb24oKTtcblxuICAgICAgICAgICAgICAgIHAyLm5hbWUoXCJNYXJrXCIpLmlkKDU1NTUpO1xuICAgICAgICAgICAgICAgIHAubmFtZShcIlNlbW15XCIpLmlkKDEyMzQpLmZyaWVuZChwMik7XG4gICAgICAgICAgICAgICAgcDIuZnJpZW5kKHApO1xuICAgICAgICAgICAgICAgIGQubmFtZShcIkdyYWNpZVwiKS5vd25lcihwKTtcbiAgICAgICAgICAgICAgICBwLmRvZyhkKTtcbiAgICAgICAgICAgICAgICBwMi5kb2coZCk7XG5cbiAgICAgICAgICAgICAgICBwSlNPTiA9IHAudG9KU09OKCk7XG4gICAgICAgICAgICAgICAgZEpTT04gPSBkLnRvSlNPTigpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChwSlNPTi5uYW1lKS5ub3QudG9CZSh1bmRlZmluZWQpO1xuXG4gICAgICAgICAgICAgICAgZXhwZWN0KHBKU09OLm5hbWUpLnRvQmUoXCJTZW1teVwiKTtcbiAgICAgICAgICAgICAgICBleHBlY3QocEpTT04uaWQpLnRvQmUoMTIzNCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHBKU09OLmRvZykubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgICAgICBleHBlY3QocEpTT04uZG9nLm5hbWUpLnRvQmUoXCJHcmFjaWVcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHBKU09OLmRvZy5vd25lcikubm90LnRvQmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICBleHBlY3QocEpTT04uZG9nLm93bmVyLm5hbWUpLnRvQmUoXCJTZW1teVwiKTtcbiAgICAgICAgICAgICAgICBleHBlY3QocEpTT04uZG9nLm93bmVyLmRvZykubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgICAgICBleHBlY3QocEpTT04uZG9nLm93bmVyLmRvZy5uYW1lKS50b0JlKFwiR3JhY2llXCIpO1xuXG4gICAgICAgICAgICAgICAgZXhwZWN0KGRKU09OLm5hbWUpLm5vdC50b0JlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGRKU09OLm5hbWUpLnRvQmUoXCJHcmFjaWVcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGRKU09OLm93bmVyKS5ub3QudG9CZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChkSlNPTi5vd25lci5uYW1lKS50b0JlKFwiU2VtbXlcIik7XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICBpdChcInNob3VsZCBhbHNvIHdvcmsgd2hlbiB0aGUgbW9kZWwgaW5zdGFuY2UgaGFzIGFuIGF0dHJfbGlzdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHAsXG4gICAgICAgICAgICAgICAgICAgIHAyLFxuICAgICAgICAgICAgICAgICAgICBwSlNPTjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBQZXJzb24uaGFzTWFueShcImZyaWVuZHNcIikuZWFjaE9mV2hpY2gudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAoZnJpZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmcmllbmQgaW5zdGFuY2VvZiBQZXJzb247XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBQZXJzb24uaXNCdWlsdFdpdGgoXCJuYW1lXCIsIFwiaWRcIiwgXCIlZG9nXCIsIFwiJWZyaWVuZHNcIik7XG4gICAgICAgICAgICAgICAgRG9nLmlzQnVpbHRXaXRoKFwibmFtZVwiLCBcIiVvd25lclwiKTtcblxuICAgICAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKFwiU2VtbXlcIiwgMTIzNDUsIG5ldyBEb2coXCJHcmFjaWVcIiksIFtuZXcgUGVyc29uKFwiTWFya1wiLCA1NTU1KV0pO1xuXG4gICAgICAgICAgICAgICAgcEpTT04gPSBwLnRvSlNPTigpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChwSlNPTi5uYW1lKS50b0JlKFwiU2VtbXlcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHBKU09OLmlkKS50b0JlKDEyMzQ1KTtcbiAgICAgICAgICAgICAgICBleHBlY3QocEpTT04uZG9nLm5hbWUpLnRvQmUoXCJHcmFjaWVcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHBKU09OLmZyaWVuZHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHBKU09OLmZyaWVuZHMubGVuZ3RoKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChwSlNPTi5mcmllbmRzLmxlbmd0aCkudG9CZSgxKTtcblxuICAgICAgICAgICAgICAgIHAyID0gbmV3IFBlcnNvbihcIkpvaG5cIiwgNzc3NywgbmV3IERvZyhcIlNwb3RcIikpO1xuICAgICAgICAgICAgICAgIHAyLmZyaWVuZHMoKS5hZGQocCk7XG4gICAgICAgICAgICAgICAgcC5mcmllbmRzKCkuYWRkKHAyKTtcblxuICAgICAgICAgICAgICAgIGV4cGVjdChwMi50b0pTT04oKS5mcmllbmRzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdChwMi50b0pTT04oKS5mcmllbmRzLmxlbmd0aCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgICAgICAgICBleHBlY3QocDIudG9KU09OKCkuZnJpZW5kcy5sZW5ndGgpLnRvQmUoMSk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHAyLnRvSlNPTigpLmZyaWVuZHNbMF0ubmFtZSkudG9CZShcIlNlbW15XCIpO1xuXG4gICAgICAgICAgICAgICAgZXhwZWN0KHAudG9KU09OKCkuZnJpZW5kcy5sZW5ndGgpLnRvQmUoMik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHAudG9KU09OKCkuZnJpZW5kc1sxXS5uYW1lKS50b0JlKFwiSm9oblwiKTtcbiAgICAgICAgICAgICAgICBleHBlY3QocC50b0pTT04oKS5mcmllbmRzWzFdLmRvZy5uYW1lKS50b0JlKFwiU3BvdFwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpdChcInNob3VsZCBub3QgdGhyb3cgYW4gZXJyb3Igd2hlbiBjYWxsZWQgb24gYSBudWxsIHZhbHVlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCwgcEpTT047XG5cbiAgICAgICAgICAgICAgICBQZXJzb24uaGFzQShcIm51bGxWYWx1ZVwiKTtcblxuICAgICAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICAgICAgcC5udWxsVmFsdWUobnVsbCk7XG5cbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBwSlNPTiA9IHAudG9KU09OKCk7XG4gICAgICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcblxuICAgICAgICAgICAgICAgIGV4cGVjdChwSlNPTikubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgICAgICBleHBlY3QocEpTT04ubnVsbFZhbHVlKS50b0JlTnVsbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJFdmVudEVtaXR0ZXIgZnVuY3Rpb25hbGl0eVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwLFxuICAgICAgICAgICAgc3B5MSxcbiAgICAgICAgICAgIHNweTI7XG5cbiAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQZXJzb24uaGFzQShcIm5hbWVcIik7XG4gICAgICAgICAgICBQZXJzb24uaGFzQW4oXCJpZFwiKTtcbiAgICAgICAgICAgIFBlcnNvbi5oYXNBKFwiZnJpZW5kXCIpO1xuICAgICAgICAgICAgc3B5MSA9IGphc21pbmUuY3JlYXRlU3B5KCk7XG4gICAgICAgICAgICBzcHkyID0gamFzbWluZS5jcmVhdGVTcHkoKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvLyB0aGlzIGlzIHRlbXBvcmFyeSB1bnRpbCB3ZSBnZXQgYWxsIHRoZSBidWdzXG4gICAgICAgIC8vIHdvcmtlZCBvdXQgd2l0aCBhdHRyIGNoYW5nZSBsaXN0ZW5lcnNcbiAgICAgICAgLy8gcmlnaHQgbm93LCBhdHRyIGxpc3RzIHNob3VsZCBub3QgaGF2ZSBjaGFuZ2UgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgIHhpdChcInNob3VsZCBub3QgYWRkIGNoYW5nZSBsaXN0ZW5lcnMgdG8gYXR0ciBsaXN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFBlcnNvbi5oYXNNYW55KFwidGhpbmdzXCIpO1xuICAgICAgICAgICAgc3B5T24oUGVyc29uLmF0dHJpYnV0ZShcInRoaW5nc1wiKSwgXCJvblwiKTtcbiAgICAgICAgICAgIGV4cGVjdChQZXJzb24uYXR0cmlidXRlKFwidGhpbmdzXCIpLm9uKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgdmFyIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICBleHBlY3QoUGVyc29uLmF0dHJpYnV0ZShcInRoaW5nc1wiKS5vbikubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsgICAgICAgICAgICBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGhpcyB3YXMgYSBidWcsIGJ1dCBJIGhhZCB0byBhZGQgdG8gdGhlIHB1YmxpYyBBUElcbiAgICAgICAgeGl0KFwic2hvdWxkIG5vdCBpbmNyZW1lbnQgdGhlIGxpc3RlbmVycyBhc3NvY2lhdGVkIHdpdGggdGhlIGxhc3Qgb2JqZWN0IGNyZWF0ZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIERvZyA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwiYnJlZWRcIikud2hpY2guaXNBKFwic3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJicmVlZFwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgUGVyc29uID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpLndoaWNoLmlzQShcInN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJkb2dcIikud2hpY2gudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAoZG9nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2cgaW5zdGFuY2VvZiBEb2c7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0J1aWx0V2l0aChcIm5hbWVcIik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIHMgPSBuZXcgUGVyc29uKFwiU2VtbXlcIik7XG4gICAgICAgICAgICB2YXIgbSA9IG5ldyBQZXJzb24oXCJNYXJrXCIpO1xuICAgICAgICAgICAgdmFyIGQxID0gbmV3IERvZyhcImNob3dcIik7XG4gICAgICAgICAgICB2YXIgZDIgPSBuZXcgRG9nKFwic2hlcGhlcmRcIik7XG5cbiAgICAgICAgICAgIHMuZG9nKGQxKTtcblxuICAgICAgICAgICAgZXhwZWN0KHMuYXR0ckNoYW5nZUxpc3RlbmVycygpLmRvZykubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChtLmF0dHJDaGFuZ2VMaXN0ZW5lcnMoKS5kb2cpLnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgY3JlYXRlIGFuIG9iamVjdCB0aGF0IGhhcyBhbiAnb24nIG1ldGhvZCBhbmQgYW4gJ2VtaXR0ZXInIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwID0gbmV3IFBlcnNvbigpO1xuICAgICAgICAgICAgZXhwZWN0KHAub24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QodHlwZW9mKHAub24pKS50b0JlKFwiZnVuY3Rpb25cIik7XG4gICAgICAgICAgICBleHBlY3QocC5lbWl0dGVyKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHR5cGVvZihwLmVtaXR0ZXIpKS50b0JlKFwiZnVuY3Rpb25cIik7XG4gICAgICAgICAgICBleHBlY3QocC5lbWl0dGVyKCkgaW5zdGFuY2VvZiBFdmVudEVtaXR0ZXIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBjcmVhdGUgYW4gb2JqZWN0IHRoYXQgZW1pdHMgYSAnY2hhbmdlJyBldmVudCB3aGVuIGFuIGF0dHJpYnV0ZSBpcyBjaGFuZ2VkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICBwLm9uKFwiY2hhbmdlXCIsIHNweTEpO1xuICAgICAgICAgICAgcC5uYW1lKFwic2VtbXlcIik7XG4gICAgICAgICAgICBwLmlkKDEyMzQpO1xuICAgICAgICAgICAgZXhwZWN0KHNweTEpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHkxLmNhbGxDb3VudCkudG9CZSgyKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHkxKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChbe2tleTpcIm5hbWVcIiwgdmFsdWU6XCJzZW1teVwiLCBvcmlnaW46cH1dKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHkxKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChbe2tleTpcImlkXCIsIHZhbHVlOjEyMzQsIG9yaWdpbjpwfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBlbWl0IGFwcHJvcHJpYXRlIGV2ZW50cyB3aGVuIGl0IGNvbnRhaW5zIGEgc3VibW9kZWwgKGhhc0EpIHRoYXQgY2hhbmdlc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgRG9nLFxuICAgICAgICAgICAgICAgIGQ7XG5cbiAgICAgICAgICAgIERvZyA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibmFtZVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJicmVlZFwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBkID0gbmV3IERvZygpO1xuICAgICAgICAgICAgZC5uYW1lKFwiU3RhclwiKS5icmVlZChcIkNob3cvU2hlcGVyZCBtaXhcIik7XG5cbiAgICAgICAgICAgIFBlcnNvbi5oYXNBKFwiZG9nXCIpLndoaWNoLnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKGRvZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkIGluc3RhbmNlb2YgRG9nO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKCk7XG5cbiAgICAgICAgICAgIHAubmFtZShcInNlbW15XCIpLmlkKDEyMzQpLmRvZyhkKTtcblxuICAgICAgICAgICAgcC5vbihcImNoYW5nZVwiLCBzcHkxKTtcblxuICAgICAgICAgICAgcC5kb2coKS5uYW1lKFwiR3JhY2VcIik7XG4gICAgICAgICAgICBleHBlY3Qoc3B5MSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHNweTEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwibmFtZVwiLCB2YWx1ZTpcIkdyYWNlXCIsIG9yaWdpbjpkfSwge2tleTpcImRvZ1wiLCBvcmlnaW46cH1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgY2FsbCBhbiBldmVudCBlbWl0dGVyIG9ubHkgd2hlbiB0aGUgaW5zdGFuY2Ugb2YgdGhlIG1vZGVsIGNoYW5nZXMsIG5vdCB3aGVuIGFuIGluc3RhbmNlIG9mIGFub3RoZXJcIiArXG4gICAgICAgICAgIFwiIG1vZGVsIGNoYW5nZXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHAxLCBwMjtcbiAgICAgICAgICAgIHAxID0gbmV3IFBlcnNvbigpO1xuICAgICAgICAgICAgcDIgPSBuZXcgUGVyc29uKCk7XG5cbiAgICAgICAgICAgIHAxLm5hbWUoXCJzZW1teVwiKTtcbiAgICAgICAgICAgIHAyLm5hbWUoXCJtYXJrXCIpO1xuICAgICAgICAgICAgZXhwZWN0KHNweTEuY2FsbENvdW50KS50b0JlKDApO1xuICAgICAgICAgICAgZXhwZWN0KHNweTIuY2FsbENvdW50KS50b0JlKDApO1xuXG4gICAgICAgICAgICBwMS5vbihcImNoYW5nZVwiLCBzcHkxKTtcbiAgICAgICAgICAgIHAyLm9uKFwiY2hhbmdlXCIsIHNweTIpO1xuXG4gICAgICAgICAgICBwMS5uYW1lKFwiYmlsbFwiKTtcblxuICAgICAgICAgICAgZXhwZWN0KHNweTEuY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgICAgICAgZXhwZWN0KHNweTIuY2FsbENvdW50KS50b0JlKDApO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBub3QgZW1pdCBpbmZpbml0ZSBldmVudHMgb24gY2lyY3VsYXIgYXR0cmlidXRlc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcDEsIHAyO1xuICAgICAgICAgICAgcDEgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICBwMiA9IG5ldyBQZXJzb24oKTtcblxuICAgICAgICAgICAgcDEubmFtZShcInNlbW15XCIpO1xuICAgICAgICAgICAgcDIubmFtZShcIm1hcmtcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChwMS5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcbiAgICAgICAgICAgIGV4cGVjdChwMi5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcblxuICAgICAgICAgICAgZXhwZWN0KHNweTEuY2FsbENvdW50KS50b0JlKDApO1xuICAgICAgICAgICAgZXhwZWN0KHNweTIuY2FsbENvdW50KS50b0JlKDApO1xuXG4gICAgICAgICAgICBwMS5lbWl0dGVyKCkub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBzcHkxKGRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBleHBlY3QocDEuZW1pdHRlcigpLmxpc3RlbmVycyhcImNoYW5nZVwiKS5sZW5ndGgpLnRvQmUoMSk7XG5cbiAgICAgICAgICAgIHAyLmVtaXR0ZXIoKS5vbihcImNoYW5nZVwiLCBzcHkyKTtcblxuICAgICAgICAgICAgZXhwZWN0KHAyLmVtaXR0ZXIoKS5saXN0ZW5lcnMoXCJjaGFuZ2VcIikubGVuZ3RoKS50b0JlKDEpO1xuXG4gICAgICAgICAgICBwMS5mcmllbmQocDIpO1xuICAgICAgICAgICAgZXhwZWN0KHNweTEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwiZnJpZW5kXCIsIHZhbHVlOnAyLCBvcmlnaW46cDF9XSk7XG4gICAgICAgICAgICBleHBlY3QocDIuZW1pdHRlcigpLmxpc3RlbmVycyhcImNoYW5nZVwiKS5sZW5ndGgpLnRvQmUoMik7XG5cbiAgICAgICAgICAgIGV4cGVjdChzcHkxLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHkyLmNhbGxDb3VudCkudG9CZSgwKTtcblxuICAgICAgICAgICAgcDIubmFtZShcIm1hcmtcIik7XG5cblxuICAgICAgICAgICAgZXhwZWN0KHNweTIuY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgICAgICAgZXhwZWN0KHNweTIpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwibmFtZVwiLCB2YWx1ZTpcIm1hcmtcIiwgb3JpZ2luOnAyfV0pO1xuXG4gICAgICAgICAgICBleHBlY3Qoc3B5MS5jYWxsQ291bnQpLnRvQmUoMik7XG4gICAgICAgICAgICBleHBlY3Qoc3B5MSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoW3trZXk6XCJuYW1lXCIsIHZhbHVlOlwibWFya1wiLCBvcmlnaW46cDJ9LCB7a2V5OlwiZnJpZW5kXCIsIG9yaWdpbjogcDF9XSk7XG5cblxuICAgICAgICAgICAgLy9zaG91bGQgbm90IGNhdXNlIGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgICAgIHAyLmZyaWVuZChwMSk7XG5cbiAgICAgICAgICAgIGV4cGVjdChzcHkyLmNhbGxDb3VudCkudG9CZSgyKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHkyKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChbe2tleTpcImZyaWVuZFwiLCB2YWx1ZTpwMSwgb3JpZ2luOnAyfV0pO1xuICAgICAgICAgICAgZXhwZWN0KHNweTEuY2FsbENvdW50KS50b0JlKDMpO1xuICAgICAgICAgICAgZXhwZWN0KHNweTEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwiZnJpZW5kXCIsIHZhbHVlOnAxLCBvcmlnaW46cDJ9LCB7a2V5OlwiZnJpZW5kXCIsIG9yaWdpbjpwMX1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcGFzcyB0aGlzIHNlY29uZCBjaXJjdWxhciBhdHRyaWJ1dGUgdGVzdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgRG9nLFxuICAgICAgICAgICAgICAgIFBlcnNvbixcbiAgICAgICAgICAgICAgICBwMSwgcDIsXG4gICAgICAgICAgICAgICAgZDEsIGQyLCBcbiAgICAgICAgICAgICAgICBzcHlwMSA9IGphc21pbmUuY3JlYXRlU3B5KCksXG4gICAgICAgICAgICAgICAgc3B5cDIgPSBqYXNtaW5lLmNyZWF0ZVNweSgpLFxuICAgICAgICAgICAgICAgIHNweWQxID0gamFzbWluZS5jcmVhdGVTcHkoKSxcbiAgICAgICAgICAgICAgICBzcHlkMiA9IGphc21pbmUuY3JlYXRlU3B5KCk7XG4gICAgICAgICAgICBcblxuICAgICAgICAgICAgRG9nID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0FuKFwib3duZXJcIikud2hpY2gudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAob3duZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG93bmVyIGluc3RhbmNlb2YgUGVyc29uO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwiZG9nXCIpLndoaWNoLnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKGRvZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9nIGluc3RhbmNlb2YgRG9nO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwiZnJpZW5kXCIpLndoaWNoLnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKGZyaWVuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnJpZW5kIGluc3RhbmNlb2YgUGVyc29uO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uZHNUbyhcImhhc0FEb2dcIiwgZnVuY3Rpb24gKGRvZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvZyhkb2cpO1xuICAgICAgICAgICAgICAgICAgICBkb2cub3duZXIodGhpcyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbmRzVG8oXCJpc0ZyaWVuZHNXaXRoXCIsIGZ1bmN0aW9uIChmcmllbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcmllbmQoZnJpZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgZnJpZW5kLmZyaWVuZCh0aGlzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwMSA9IG5ldyBQZXJzb24oKTtcbiAgICAgICAgICAgIHAyID0gbmV3IFBlcnNvbigpO1xuICAgICAgICAgICAgZDEgPSBuZXcgRG9nKCk7XG4gICAgICAgICAgICBkMiA9IG5ldyBEb2coKTtcblxuICAgICAgICAgICAgcDEub24oXCJjaGFuZ2VcIiwgc3B5cDEpO1xuICAgICAgICAgICAgZDEub24oXCJjaGFuZ2VcIiwgc3B5ZDEpO1xuICAgICAgICAgICAgcDIub24oXCJjaGFuZ2VcIiwgc3B5cDIpO1xuICAgICAgICAgICAgZDIub24oXCJjaGFuZ2VcIiwgc3B5ZDIpO1xuXG4gICAgICAgICAgICBwMS5pc0ZyaWVuZHNXaXRoKHAyKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHlwMS5jYWxsQ291bnQpLnRvQmUoMik7IC8vcDEncyBmcmllbmQgY2hhbmdlcywgdGhlbiBwMiAoYSBzdWJvYmplY3Qgb2YgcDEpJ3MgZnJpZW5kIGNoYW5nZXNcbiAgICAgICAgICAgIGV4cGVjdChzcHlwMSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoW3trZXk6XCJmcmllbmRcIiwgdmFsdWU6cDIsIG9yaWdpbjpwMX1dKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHlwMSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoW3trZXk6XCJmcmllbmRcIiwgdmFsdWU6cDEsIG9yaWdpbjpwMn0sIHtrZXk6XCJmcmllbmRcIiwgb3JpZ2luOnAxfV0pO1xuICAgICAgICAgICAgZXhwZWN0KHNweXAyLmNhbGxDb3VudCkudG9CZSgxKTsgLy9wMidzIGZyaWVuZCBjaGFuZ2VzXG4gICAgICAgICAgICBleHBlY3Qoc3B5cDIpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwiZnJpZW5kXCIsIHZhbHVlOnAxLCBvcmlnaW46cDJ9XSk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5ZDEuY2FsbENvdW50KS50b0JlKDApO1xuICAgICAgICAgICAgZXhwZWN0KHNweWQyLmNhbGxDb3VudCkudG9CZSgwKTtcblxuICAgICAgICAgICAgcDEuaGFzQURvZyhkMSk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5cDEuY2FsbENvdW50KS50b0JlKDQpOyAvL3AxJ3MgZG9nIGNoYW5nZXMsIHRoZW4gZDEgKGEgc3Vib2JqZWN0IG9mIGQxKSdzIGRvZyBjaGFuZ2VzXG4gICAgICAgICAgICBleHBlY3Qoc3B5cDEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwiZG9nXCIsIHZhbHVlOmQxLCBvcmlnaW46cDF9XSk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5cDEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5Olwib3duZXJcIiwgdmFsdWU6cDEsIG9yaWdpbjpkMX0sIHtrZXk6XCJkb2dcIiwgb3JpZ2luOnAxfV0pO1xuXG4gICAgICAgICAgICBleHBlY3Qoc3B5cDIuY2FsbENvdW50KS50b0JlKDMpO1xuICAgICAgICAgICAgZXhwZWN0KHNweXAyKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChbe2tleTpcImRvZ1wiLCB2YWx1ZTpkMSwgb3JpZ2luOnAxfSwge2tleTpcImZyaWVuZFwiLCBvcmlnaW46cDJ9XSk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5cDIpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5Olwib3duZXJcIiwgdmFsdWU6cDEsIG9yaWdpbjpkMX0sIHtrZXk6XCJkb2dcIiwgb3JpZ2luOnAxfSwge2tleTpcImZyaWVuZFwiLCBvcmlnaW46cDJ9XSk7XG5cblxuICAgICAgICAgICAgZXhwZWN0KHNweWQxLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHlkMSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoW3trZXk6XCJvd25lclwiLCB2YWx1ZTpwMSwgb3JpZ2luOmQxfV0pO1xuICAgICAgICAgICAgZXhwZWN0KHNweWQyLmNhbGxDb3VudCkudG9CZSgwKTsgLy9ubyBjaGFuZ2Ugc3B5ZDJcblxuICAgICAgICAgICAgcDIuaGFzQURvZyhkMik7XG4gICAgICAgICAgICBleHBlY3Qoc3B5cDIuY2FsbENvdW50KS50b0JlKDUpO1xuXG4gICAgICAgICAgICAvL2FzIGEgcmVzdWx0IG9mIHAyJ3MgZG9nIGNoYW5naW5nXG4gICAgICAgICAgICBleHBlY3Qoc3B5cDIpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwiZG9nXCIsIHZhbHVlOmQyLCBvcmlnaW46cDJ9XSk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5cDEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwiZG9nXCIsIHZhbHVlOmQyLCBvcmlnaW46cDJ9LCB7a2V5OlwiZnJpZW5kXCIsIG9yaWdpbjpwMX1dKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHlkMSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoW3trZXk6XCJkb2dcIiwgdmFsdWU6ZDIsIG9yaWdpbjpwMn0sIHtrZXk6XCJmcmllbmRcIiwgb3JpZ2luOnAxfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtrZXk6XCJvd25lclwiLCBvcmlnaW46ZDF9XSk7XG5cbiAgICAgICAgICAgIC8vYXMgYSByZXN1bHQgb2YgZDIncyBvd25lciBjaGFuZ2luZ1xuICAgICAgICAgICAgZXhwZWN0KHNweWQyLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHlkMikudG9IYXZlQmVlbkNhbGxlZFdpdGgoW3trZXk6XCJvd25lclwiLCB2YWx1ZTpwMiwgb3JpZ2luOmQyfV0pO1xuICAgICAgICAgICAgZXhwZWN0KHNweXAyKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChbe2tleTpcIm93bmVyXCIsIHZhbHVlOnAyLCBvcmlnaW46ZDJ9LCB7a2V5OlwiZG9nXCIsIG9yaWdpbjpwMn1dKTtcbiAgICAgICAgICAgXG5cbiAgICAgICAgICAgIGV4cGVjdChzcHlwMS5jYWxsQ291bnQpLnRvQmUoNik7XG4gICAgICAgICAgICBleHBlY3Qoc3B5cDEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5Olwib3duZXJcIiwgdmFsdWU6cDIsIG9yaWdpbjpkMn0se2tleTpcImRvZ1wiLCBvcmlnaW46cDJ9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2tleTpcImZyaWVuZFwiLCBvcmlnaW46cDF9XSk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5cDEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwiZG9nXCIsIHZhbHVlOmQyLCBvcmlnaW46cDJ9LCB7a2V5OlwiZnJpZW5kXCIsIG9yaWdpbjpwMX1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgY2FzY2FkZSAnY2hhbmdlJyBldmVudHMgZW1pdHRlZCBmcm9tIGNvbXBvc2VkIG9iamVjdHNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIFBlcnNvbixcbiAgICAgICAgICAgICAgICBEb2csXG4gICAgICAgICAgICAgICAgcCxcbiAgICAgICAgICAgICAgICBkb2cxLFxuICAgICAgICAgICAgICAgIGRvZzIsXG4gICAgICAgICAgICAgICAgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoKTtcblxuICAgICAgICAgICAgUGVyc29uID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpLndoaWNoLmlzQShcInN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJkb2dcIikud2hpY2gudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAoZG9nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2cgaW5zdGFuY2VvZiBEb2c7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0J1aWx0V2l0aChcIm5hbWVcIik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgRG9nID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpLndoaWNoLmlzQShcInN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKFwibmFtZVwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwID0gbmV3IFBlcnNvbihcInNlbW15XCIpO1xuICAgICAgICAgICAgZG9nMSA9IG5ldyBEb2coXCJncmFjaWVcIik7XG4gICAgICAgICAgICBkb2cyID0gbmV3IERvZyhcImNoaWNvXCIpO1xuXG4gICAgICAgICAgICBwLm9uKFwiY2hhbmdlXCIsIHNweSk7XG4gICAgICAgICAgICBleHBlY3QocC5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgxKTtcblxuICAgICAgICAgICAgZXhwZWN0KHAuZG9nKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgICAgcC5kb2coZG9nMSk7XG4gICAgICAgICAgICBleHBlY3QoZG9nMS5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChwLmRvZygpKS50b0JlKGRvZzEpO1xuICAgICAgICAgICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHNweS5jYWxsQ291bnQpLnRvQmUoMSk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChbe2tleTpcImRvZ1wiLCB2YWx1ZTpkb2cxLCBvcmlnaW46cH1dKTtcblxuICAgICAgICAgICAgZG9nMS5uYW1lKFwiYWxseVwiKTtcblxuICAgICAgICAgICAgZXhwZWN0KHNweS5jYWxsQ291bnQpLnRvQmUoMik7XG4gICAgICAgICAgICBleHBlY3Qoc3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChbe2tleTpcIm5hbWVcIiwgdmFsdWU6XCJhbGx5XCIsIG9yaWdpbjpkb2cxfSwge2tleTpcImRvZ1wiLCBvcmlnaW46cH1dKTtcblxuICAgICAgICAgICAgZXhwZWN0KGRvZzEuZW1pdHRlcigpLmxpc3RlbmVycyhcImNoYW5nZVwiKS5sZW5ndGgpLnRvQmUoMSk7XG4gICAgICAgICAgICBleHBlY3QoZG9nMi5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcbiAgICAgICAgICAgIHAuZG9nKGRvZzIpO1xuICAgICAgICAgICAgZXhwZWN0KGRvZzEuZW1pdHRlcigpLmxpc3RlbmVycyhcImNoYW5nZVwiKS5sZW5ndGgpLnRvQmUoMCk7XG4gICAgICAgICAgICBleHBlY3QoZG9nMi5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgxKTtcblxuICAgICAgICAgICAgZXhwZWN0KHNweS5jYWxsQ291bnQpLnRvQmUoMyk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChbe2tleTpcImRvZ1wiLCB2YWx1ZTpkb2cyLCBvcmlnaW46cH1dKTtcblxuICAgICAgICAgICAgLy9zaG91bGQgbm90IGNhbGwgdGhlIHAncyBzcHkgc2luY2UgZG9nMSBpcyBubyBsb25nZXIgYXR0YWNoZWQgdG8gcDFcbiAgICAgICAgICAgIGRvZzEubmFtZShcImxva2lcIik7XG4gICAgICAgICAgICBleHBlY3Qoc3B5LmNhbGxDb3VudCkudG9CZSgzKTtcblxuICAgICAgICAgICAgZG9nMi5uYW1lKFwibGF5bGFcIik7XG4gICAgICAgICAgICBleHBlY3Qoc3B5LmNhbGxDb3VudCkudG9CZSg0KTtcbiAgICAgICAgICAgIGV4cGVjdChzcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwibmFtZVwiLCB2YWx1ZTpcImxheWxhXCIsIG9yaWdpbjpkb2cyfSwge2tleTpcImRvZ1wiLCBvcmlnaW46cH1dKTtcblxuICAgICAgICAgICAgcC5kb2coZG9nMSk7XG4gICAgICAgICAgICBleHBlY3Qoc3B5LmNhbGxDb3VudCkudG9CZSg1KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9nMi5uYW1lKFwiYmVhdVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHkuY2FsbENvdW50KS50b0JlKDUpO1xuXG4gICAgICAgICAgICBkb2cxLm5hbWUoXCJob3dpZVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChzcHkuY2FsbENvdW50KS50b0JlKDYpO1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIGl0KFwic2hvdWxkIGFsbG93IGNoYW5nZXMgdG8gYW5kIGZyb20gbnVsbCB2YWx1ZSB3aXRob3V0IGNhdXNpbmcgYW4gZXJyb3JcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHAsXG4gICAgICAgICAgICAgICAgRG9nLFxuICAgICAgICAgICAgICAgIGQxLCBkMjtcblxuICAgICAgICAgICAgRG9nID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpLndoaWNoLmlzQShcInN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKFwibmFtZVwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcIm5hbWVcIikud2hpY2guaXNBKFwic3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcImRvZ1wiKS53aGljaC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChkb2cpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChkb2cgaW5zdGFuY2VvZiBEb2cgfHwgZG9nID09PSBudWxsKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKFwibmFtZVwiKTtcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIGQxID0gbmV3IERvZyhcIkdyYWNpZVwiKTtcbiAgICAgICAgICAgIGQyID0gbmV3IERvZyhcIkxva2lcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChkMS5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcbiAgICAgICAgICAgIGV4cGVjdChkMi5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcblxuICAgICAgICAgICAgcCA9IG5ldyBQZXJzb24oXCJTZW1teVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChwLmRvZygpKS50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBwLmRvZyhudWxsKTtcbiAgICAgICAgICAgXG4gICAgICAgICAgICBleHBlY3QocC5kb2coKSkudG9CZU51bGwoKTtcblxuICAgICAgICAgICAgZXhwZWN0KGQxLmVtaXR0ZXIoKS5saXN0ZW5lcnMoXCJjaGFuZ2VcIikubGVuZ3RoKS50b0JlKDApO1xuICAgICAgICAgICAgZXhwZWN0KGQyLmVtaXR0ZXIoKS5saXN0ZW5lcnMoXCJjaGFuZ2VcIikubGVuZ3RoKS50b0JlKDApO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHAuZG9nKGQxKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChwLmRvZygpLm5hbWUoKSkudG9CZShcIkdyYWNpZVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChkMS5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChkMi5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwLmRvZyhudWxsKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChkMS5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcbiAgICAgICAgICAgIGV4cGVjdChkMi5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZXhwZWN0KHAuZG9nKCkpLnRvQmUobnVsbCk7XG5cbiAgICAgICAgICAgIHAuZG9nKGQyKTtcblxuICAgICAgICAgICAgZXhwZWN0KHAuZG9nKCkubmFtZSgpKS50b0JlKFwiTG9raVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChkMS5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgwKTtcbiAgICAgICAgICAgIGV4cGVjdChkMi5lbWl0dGVyKCkubGlzdGVuZXJzKFwiY2hhbmdlXCIpLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBpdChcInNob3VsZCBlbWl0IGEgY2hhbmdlIGV2ZW50IHdoZW4gYWRkaW5nIGFuIGVsZW1lbnQgdG8gYSBsaXN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwLFxuICAgICAgICAgICAgICAgIGFkZFNweSA9IGphc21pbmUuY3JlYXRlU3B5KCk7XG5cbiAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibmFtZVwiKS53aGljaC5pc0EoXCJzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNNYW55KFwiYWxpYXNlc1wiKS5lYWNoT2ZXaGljaC5pc0EoXCJzdHJpbmdcIik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcCA9IG5ldyBQZXJzb24oKTtcblxuICAgICAgICAgICAgcC5vbihcImNoYW5nZVwiLCBhZGRTcHkpO1xuICAgICAgICAgICAgcC5uYW1lKFwiU2VtbXlcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkuY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgICAgICAgcC5hbGlhc2VzKCkuYWRkKFwibmFtZTFcIik7XG4gICAgICAgICAgICBleHBlY3QoYWRkU3B5LmNhbGxDb3VudCkudG9CZSgyKTtcbiAgICAgICAgICAgIGV4cGVjdChhZGRTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwibmFtZVwiLCB2YWx1ZTpcIlNlbW15XCIsIG9yaWdpbjpwfV0pO1xuICAgICAgICAgICAgZXhwZWN0KGFkZFNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoW3thY3Rpb246XCJhZGRcIiwga2V5OlwiYWxpYXNlc1wiLCB2YWx1ZTpcIm5hbWUxXCIsIG9yaWdpbjpwfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBjYXNjYWRlIGNoYW5nZSBldmVudHMgd2hlbiBhbiBvYmplY3QgaXMgYWRkZWQgdG8gYSBzdWJtb2RlbCdzIGxpc3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHAsXG4gICAgICAgICAgICAgICAgRG9nLFxuICAgICAgICAgICAgICAgIGQsXG4gICAgICAgICAgICAgICAgY2hhbmdlU3B5ID0gamFzbWluZS5jcmVhdGVTcHkoKTtcblxuICAgICAgICAgICAgRG9nID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzTWFueShcImFsaWFzZXNcIikuZWFjaE9mV2hpY2guaXNBKFwic3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJuYW1lXCIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibmFtZVwiKS53aGljaC5pc0EoXCJzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwiZG9nXCIpLndoaWNoLnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKGRvZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGRvZyBpbnN0YW5jZW9mIERvZyB8fCBkb2cgPT09IG51bGwpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJuYW1lXCIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKFwiU2VtbXlcIik7XG4gICAgICAgICAgICBwLm9uKFwiY2hhbmdlXCIsIGNoYW5nZVNweSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGQgPSBuZXcgRG9nKFwiTG9raVwiKTtcblxuICAgICAgICAgICAgcC5kb2coZCk7XG4gICAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5LmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChjaGFuZ2VTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwiZG9nXCIsIHZhbHVlOmQsIG9yaWdpbjpwfV0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBkLm5hbWUoXCJHcmFjaWVcIik7XG4gICAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5LmNhbGxDb3VudCkudG9CZSgyKTtcbiAgICAgICAgICAgIGV4cGVjdChjaGFuZ2VTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7a2V5OlwibmFtZVwiLCB2YWx1ZTpcIkdyYWNpZVwiLCBvcmlnaW46ZH0sIHtrZXk6XCJkb2dcIiwgb3JpZ2luOnB9XSk7XG5cbiAgICAgICAgICAgIHAuZG9nKCkuYWxpYXNlcygpLmFkZChcIlN1Z2FyIFBpZVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChjaGFuZ2VTcHkuY2FsbENvdW50KS50b0JlKDMpO1xuICAgICAgICAgICAgZXhwZWN0KGNoYW5nZVNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoW3thY3Rpb246XCJhZGRcIiwga2V5OlwiYWxpYXNlc1wiLCB2YWx1ZTpcIlN1Z2FyIFBpZVwiLCBvcmlnaW46ZH0sIHtrZXk6XCJkb2dcIiwgb3JpZ2luOnB9XSk7XG5cbiAgICAgICAgICAgIHAuZG9nKCkuYWxpYXNlcygpLmFkZChcIlN3ZWV0aWVcIik7XG4gICAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5LmNhbGxDb3VudCkudG9CZSg0KTtcbiAgICAgICAgICAgIGV4cGVjdChjaGFuZ2VTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFt7YWN0aW9uOlwiYWRkXCIsIGtleTpcImFsaWFzZXNcIiwgdmFsdWU6XCJTd2VldGllXCIsIG9yaWdpbjpkfSwge2tleTpcImRvZ1wiLCBvcmlnaW46cH1dKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBkZXNjcmliZShcIm9uIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL3RoaXMgZnVuY3Rpb25hbGl0eSBpcyB0ZW1wb3JhcmlseSBkZXByZWNhdGVkIHVubGVzcyBpdCBpcyBuZWVkZWQuXG4gICAgICAgICAgICAvL2lmIGl0IGlzLCB0aGUgY3VycmVudCBmdW5jdGlvbiBjYW4gYmUgcmVwbGFjZWQgd2l0aCB0aGlzOlxuICAgICAgICAgICAgLyp2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgIHRoaXMub24gPSBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgICB0aGF0LmVtaXR0ZXIoKS5vbihldmVudCwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5jYWxsKHRoYXQsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH07Ki9cbiAgICAgICAgICAgIGl0KFwic2hvdWxkIHJlZmVyZW5jZSAndGhpcycgYXMgdGhlIGN1cnJlbnQgb2JqZWN0LCBhbmQgbm90IHRoZSB1bmRlcmx5aW5nIGV2ZW50IGVtaXR0ZXJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwID0gbmV3IFBlcnNvbigpO1xuICAgICAgICAgICAgICAgIHAub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3QodGhpcyBpbnN0YW5jZW9mIFBlcnNvbikudG9CZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBwLm5hbWUoXCJzZW1teVwiKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cblxuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJpc0J1aWx0V2l0aCBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdChcInNob3VsZCB0YWtlIGFueSBudW1iZXIgb2Ygc3RyaW5nIHBhcmFtZXRlcnNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24uaXNCdWlsdFdpdGgoXCJsYXJyeVwiLCBcIm1vZVwiLCAzLjQpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJNb2RlbDogaXNCdWlsdFdpdGggcGFyYW1ldGVycyBtdXN0IGJlIHN0cmluZ3MgZXhjZXB0IGZvciBhIGZ1bmN0aW9uIGFzIHRoZSBvcHRpb25hbCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZpbmFsIHBhcmFtZXRlclwiKSk7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFBlcnNvbi5pc0J1aWx0V2l0aChcImxhcnJ5XCIsIDMuNCwgXCJtb2VcIiwgXCJjdXJseVwiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiTW9kZWw6IGlzQnVpbHRXaXRoIHBhcmFtZXRlcnMgbXVzdCBiZSBzdHJpbmdzIGV4Y2VwdCBmb3IgYSBmdW5jdGlvbiBhcyB0aGUgb3B0aW9uYWwgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmaW5hbCBwYXJhbWV0ZXJcIikpO1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24uaXNCdWlsdFdpdGgoXCJsYXJyeVwiLCBcIm1vZVwiLCBcImN1cmx5XCIsIFwic2VtbXlcIiwgXCJqb2huXCIpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3cobmV3IEVycm9yKFwiTW9kZWw6IGlzQnVpbHRXaXRoIHBhcmFtZXRlcnMgbXVzdCBiZSBzdHJpbmdzIGV4Y2VwdCBmb3IgYSBmdW5jdGlvbiBhcyB0aGUgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3B0aW9uYWwgZmluYWwgcGFyYW1ldGVyXCIpKTtcbiAgICAgICAgICAgIC8vcyA9IG5ldyBNb2RlbCgpO1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24uaXNCdWlsdFdpdGgoXCJsYXJyeVwiLCBcImN1cmx5XCIsIFwibW9lXCIsIFwic2VtbXlcIiwgXCJqb2huXCIsIFwibWFya1wiLCBcImFub3RoZXJNYXJrXCIpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3cobmV3IEVycm9yKFwiTW9kZWw6IGlzQnVpbHRXaXRoIHBhcmFtZXRlcnMgbXVzdCBiZSBzdHJpbmdzIGV4Y2VwdCBmb3IgYSBmdW5jdGlvbiBhcyB0aGUgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3B0aW9uYWwgZmluYWwgcGFyYW1ldGVyXCIpKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBpdChcInNob3VsZCBhY2NlcHQgYSBmdW5jdGlvbiBhcyBhbiBvcHRpb25hbCBmaW5hbCBhcmd1bWVudFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sICBnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFBlcnNvbi5pc0J1aWx0V2l0aChcImxhcnJ5XCIsIFwibW9lXCIsIGYsIGcpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJNb2RlbDogaXNCdWlsdFdpdGggcGFyYW1ldGVycyBtdXN0IGJlIHN0cmluZ3MgZXhjZXB0IGZvciBhIGZ1bmN0aW9uIGFzIHRoZSBvcHRpb25hbCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZpbmFsIHBhcmFtZXRlclwiKSk7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFBlcnNvbi5pc0J1aWx0V2l0aChcImxhcnJ5XCIsIFwibW9lXCIsIGcsIFwiY3VybHlcIiwgXCJzZW1teVwiLCBcImpvaG5cIik7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIk1vZGVsOiBpc0J1aWx0V2l0aCBwYXJhbWV0ZXJzIG11c3QgYmUgc3RyaW5ncyBleGNlcHQgZm9yIGEgZnVuY3Rpb24gYXMgdGhlIG9wdGlvbmFsIFwiICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZpbmFsIHBhcmFtZXRlclwiKSk7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFBlcnNvbi5pc0J1aWx0V2l0aChcImxhcnJ5XCIsIGYpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3cobmV3IEVycm9yKFwiTW9kZWw6IGlzQnVpbHRXaXRoIHBhcmFtZXRlcnMgbXVzdCBiZSBzdHJpbmdzIGV4Y2VwdCBmb3IgYSBmdW5jdGlvbiBhcyB0aGUgXCIgKyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9wdGlvbmFsIGZpbmFsIHBhcmFtZXRlclwiKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIGFjY2VwdCBzdHJpbmdzIHByZWNlZGVkIHdpdGggYSAlIGFzIHRoZSBmaW5hbCBwYXJhbWV0ZXJzIGJlZm9yZSB0aGUgb3B0aW9uYWwgZnVuY3Rpb25cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24uaXNCdWlsdFdpdGgoXCJsYXJyeVwiLCBcIiVtb2VcIiwgXCJjdXJseVwiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiTW9kZWw6IGlzQnVpbHRXaXRoIHJlcXVpcmVzIHBhcmFtZXRlcnMgcHJlY2VkZWQgd2l0aCBhICUgdG8gYmUgdGhlIGZpbmFsIFwiICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBhcmFtZXRlcnMgYmVmb3JlIHRoZSBvcHRpb25hbCBmdW5jdGlvblwiKSk7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFBlcnNvbi5pc0J1aWx0V2l0aChcImxhcnJ5XCIsIFwibW9lXCIsIFwiY3VybHlcIiwgXCIlc2VtbXlcIik7XG4gICAgICAgICAgICB9KS5ub3QudG9UaHJvdyhuZXcgRXJyb3IoXCJNb2RlbDogaXNCdWlsdFdpdGggcmVxdWlyZXMgcGFyYW1ldGVycyBwcmVjZWRlZCB3aXRoIGEgJSB0byBiZSB0aGUgZmluYWwgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGFyYW1ldGVycyBiZWZvcmUgdGhlIG9wdGlvbmFsIGZ1bmN0aW9uXCIpKTtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgUGVyc29uLmlzQnVpbHRXaXRoKFwibGFycnlcIiwgXCJtb2VcIiwgXCJjdXJseVwiLCBcIiVzZW1teVwiLCBcIiVqb2huXCIsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KG5ldyBFcnJvcihcIk1vZGVsOiBpc0J1aWx0V2l0aCByZXF1aXJlcyBwYXJhbWV0ZXJzIHByZWNlZGVkIHdpdGggYSAlIHRvIGJlIHRoZSBmaW5hbCBcIiArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGFyYW1ldGVycyBiZWZvcmUgdGhlIG9wdGlvbmFsIGZ1bmN0aW9uXCIpKTtcbiAgICAgICAgfSk7XG5cblxuICAgIH0pO1xuXG5cbiAgICBkZXNjcmliZShcImxvb2tzTGlrZSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB4aXQoXCJzaG91bGQgYmUgd2F5IG1vcmUgaW50ZXJlc3RpbmcgdGhhbiBpdCBjdXJyZW50bHkgaXNcIiwgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJ2YWxpZGF0ZSBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgUGVyc29uLFxuICAgICAgICBtO1xuXG4gICAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgUGVyc29uID0gbmV3IE1vZGVsKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBvYmplY3QgaXMgaW1tdXRhYmxlIGFuZCBhbnkgb2YgdGhlIGF0dHJpYnV0ZXMgYXJlbid0IHJlcXVpcmVkIGluIGlzQnVpbHRXaXRoXCIsXG4gICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwO1xuICAgICAgICAgICAgUGVyc29uLmhhc0EoXCJmaXJzdE5hbWVcIik7XG4gICAgICAgICAgICBQZXJzb24uaGFzQShcImxhc3ROYW1lXCIpO1xuICAgICAgICAgICAgUGVyc29uLmlzSW1tdXRhYmxlKCk7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcImltbXV0YWJsZSBvYmplY3RzIG11c3QgaGF2ZSBhbGwgYXR0cmlidXRlcyByZXF1aXJlZCBpbiBhIGNhbGwgdG8gaXNCdWlsdFdpdGhcIikpO1xuXG4gICAgICAgICAgICBQZXJzb24uaXNCdWlsdFdpdGgoXCJmaXJzdE5hbWVcIiwgXCJsYXN0TmFtZVwiKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwID0gbmV3IFBlcnNvbihcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICAgICAgICB9KS5ub3QudG9UaHJvdyhuZXcgRXJyb3IoXCJpbW11dGFibGUgb2JqZWN0cyBtdXN0IGhhdmUgYWxsIGF0dHJpYnV0ZXMgcmVxdWlyZWQgaW4gYSBjYWxsIHRvIGlzQnVpbHRXaXRoXCIpKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwID0gbmV3IFBlcnNvbihcImhlbGxvXCIpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhcIkNvbnN0cnVjdG9yIHJlcXVpcmVzIGZpcnN0TmFtZSwgbGFzdE5hbWUgdG8gYmUgc3BlY2lmaWVkXCIpO1xuXG4gICAgICAgICAgICBwID0gbmV3IFBlcnNvbihcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcC5maXJzdE5hbWUoXCJuZXdOYW1lXCIpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhcImNhbm5vdCBzZXQgdGhlIGltbXV0YWJsZSBwcm9wZXJ0eSBmaXJzdE5hbWUgYWZ0ZXIgaXQgaGFzIGJlZW4gc2V0XCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiBhbnkgb2YgdGhlIHN0cmluZ3MgYXJlIG5vdCBkZWZpbmVkIGFzIGF0dHJpYnV0ZXMgYnV0IGFyZSBzcGVjaWZpZWQgaW4gXCIgK1xuICAgICAgICAgICBcImlzQnVpbHRXaXRoXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFBlcnNvbi5oYXNBKFwiZmlyc3ROYW1lXCIpO1xuICAgICAgICAgICAgUGVyc29uLmhhc0EoXCJsYXN0TmFtZVwiKTtcbiAgICAgICAgICAgIFBlcnNvbi5oYXNBbihcImlkXCIpO1xuICAgICAgICAgICAgUGVyc29uLmlzQnVpbHRXaXRoKFwiZmlyc3ROYW1lXCIsXCJsYXN0TmFtZVwiLFwiaWVkXCIpO1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24udmFsaWRhdGUoKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiaWVkLCBzcGVjaWZpZWQgaW4gdGhlIGlzQnVpbHRXaXRoIG1ldGhvZCwgaXMgbm90IGFuIGF0dHJpYnV0ZVwiKSk7XG5cbiAgICAgICAgICAgIFBlcnNvbi5pc0J1aWx0V2l0aChcImZpcnN0TmFtZVwiLFwibGFzdE5hbWVcIixcImlkXCIpO1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24udmFsaWRhdGUoKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KG5ldyBFcnJvcihcImllZCwgc3BlY2lmaWVkIGluIHRoZSBpc0J1aWx0V2l0aCBtZXRob2QsIGlzIG5vdCBhbiBhdHRyaWJ1dGVcIikpO1xuXG4gICAgICAgICAgICBQZXJzb24uaXNCdWlsdFdpdGgoXCJmaXJzdE5hbWVcIixcImxhc3ROYW1lXCIsXCIlaWVkXCIpO1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBQZXJzb24gPSBQZXJzb24udmFsaWRhdGUoKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiaWVkLCBzcGVjaWZpZWQgaW4gdGhlIGlzQnVpbHRXaXRoIG1ldGhvZCwgaXMgbm90IGFuIGF0dHJpYnV0ZVwiKSk7XG5cbiAgICAgICAgICAgIFBlcnNvbi5pc0J1aWx0V2l0aChcImZpcnN0TmFtZVwiLFwibGFzdE5hbWVcIixcIiVpZFwiKTtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgUGVyc29uID0gUGVyc29uLnZhbGlkYXRlKCk7XG4gICAgICAgICAgICB9KS5ub3QudG9UaHJvdyhuZXcgRXJyb3IoXCJpZWQsIHNwZWNpZmllZCBpbiB0aGUgaXNCdWlsdFdpdGggbWV0aG9kLCBpcyBub3QgYW4gYXR0cmlidXRlXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3Igb24gbWV0aG9kL2F0dHJpYnV0ZSBuYW1lIGNvbGxpc2lvbnNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgUGVyc29uLmhhc0EoXCJmaXJzdE5hbWVcIik7XG4gICAgICAgICAgICBQZXJzb24ucmVzcG9uZHNUbyhcImZpcnN0TmFtZVwiLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFBlcnNvbi52YWxpZGF0ZSgpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJNb2RlbDogaW52YWxpZCBtb2RlbCBzcGVjaWZpY2F0aW9uIHRvIGZpcnN0TmFtZSBiZWluZyBib3RoIGFuIGF0dHJpYnV0ZSBhbmQgbWV0aG9kXCIpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcInJlc3VsdGluZyBjb25zdHJ1Y3RvciBmdW5jdGlvblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzLFxuICAgICAgICBQZXJzb24sXG4gICAgICAgIHA7XG5cbiAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoKTtcbiAgICAgICAgICAgIFBlcnNvbi5oYXNBKFwibmFtZVwiKS53aGljaC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gXCJuYW1lIG11c3QgYmUgYXQgbGVhc3QgMyBjaGFyYWN0ZXJzXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5hbWUubGVuZ3RoID4gMztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBQZXJzb24uaGFzQW4oXCJpZFwiKS53aGljaC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IFwiaWQgbXVzdCBiZSA5IGRpZ2l0c1wiO1xuICAgICAgICAgICAgICAgIHJldHVybiAxMDAwMDAwMDAgPD0gaWQgJiYgaWQgPD0gOTk5OTk5OTk5O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIFBlcnNvbi5oYXNNYW55KFwiZnJpZW5kc1wiKS53aGljaC52YWxpZGF0ZVdpdGgoZnVuY3Rpb24gKGZyaWVuZCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IFwiZnJpZW5kIG11c3QgYmUgYSBwZXJzb25cIjtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnJpZW5kIGluc3RhbmNlb2YgUGVyc29uO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIFBlcnNvbi5yZXNwb25kc1RvKFwicnVuc0Zvck9mZmljZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubmFtZSgpICsgXCIgaXMgcnVubmluZyBmb3Igb2ZmaWNlIVwiO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIFBlcnNvbi5yZXNwb25kc1RvKFwicmV0dXJuc051bGxcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIFBlcnNvbi5yZXNwb25kc1RvKFwiYWRkc1R3b051bWJlcnNcIiwgZnVuY3Rpb24gKG51bUEsIG51bUIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVtQStudW1CO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgICAgICBwLm5hbWUoXCJNYXJrXCIpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHJldHVybiBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBhbiBvYmplY3Qgd2l0aCBhbGwgYXR0cmlidXRlc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QocC5uYW1lKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHAuaWQpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QocC5mcmllbmRzKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHAuZnJpZW5kcygpLmFkZCkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgbm90IGFkZCBhbnkgYWRkaXRpb25hbCBBdHRyIG1ldGhvZHNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KFBlcnNvbi52YWxpZGF0b3IpLnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChwLnZhbGlkYXRvcikudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHAudmFsaWRhdGVzV2l0aCkudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHAud2hpY2gpLnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChwLmFuZCkudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBhZGQgYWxsIHNwZWNpZmllZCBtZXRob2RzIHRvIHRoZSBvYmplY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KHAucnVuc0Zvck9mZmljZSkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChwLnJ1bnNGb3JPZmZpY2UoKSkudG9FcXVhbChcIk1hcmsgaXMgcnVubmluZyBmb3Igb2ZmaWNlIVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChwLnJldHVybnNOdWxsKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHAucmV0dXJuc051bGwoKSkudG9CZShudWxsKTtcbiAgICAgICAgICAgIGV4cGVjdChwLmFkZHNUd29OdW1iZXJzKDMsMikpLnRvRXF1YWwoNSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIGFsbG93IGZvciBhbiBlbXB0eSBjb25zdHJ1Y3RvclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwID0gbmV3IFBlcnNvbigpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmVxdWlyZSB0aGUgY29uc3RydWN0b3IgdG8gYmUgY2FsbGVkIHdpdGggdGhlIG5vbi0lIHBhcmFtZXRlcnNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIFBlcnNvbixcbiAgICAgICAgICAgIHA7XG5cbiAgICAgICAgICAgIFBlcnNvbiA9IG5ldyBNb2RlbCgpO1xuICAgICAgICAgICAgUGVyc29uLmhhc0EoXCJmaXJzdE5hbWVcIik7XG4gICAgICAgICAgICBQZXJzb24uaGFzQShcImxhc3ROYW1lXCIpO1xuICAgICAgICAgICAgUGVyc29uLmhhc0FuKFwiaWRcIik7XG5cbiAgICAgICAgICAgIFBlcnNvbi5pc0J1aWx0V2l0aChcImZpcnN0TmFtZVwiLCBcImxhc3ROYW1lXCIsIFwiJWlkXCIpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKFwic2VtbXlcIik7XG4gICAgICAgICAgICB9KS50b1Rocm93KG5ldyBFcnJvcihcIkNvbnN0cnVjdG9yIHJlcXVpcmVzIGZpcnN0TmFtZSwgbGFzdE5hbWUgdG8gYmUgc3BlY2lmaWVkXCIpKTtcblxuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwID0gbmV3IFBlcnNvbihcInNlbW15XCIsXCJwdXJld2FsXCIpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3cobmV3IEVycm9yKFwiQ29uc3RydWN0b3IgcmVxdWlyZXMgZmlyc3ROYW1lLCBsYXN0TmFtZSB0byBiZSBzcGVjaWZpZWRcIikpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKFwic2VtbXlcIixcInB1cmV3YWxcIiwgMTAwKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KG5ldyBFcnJvcihcIkNvbnN0cnVjdG9yIHJlcXVpcmVzIGZpcnN0TmFtZSwgbGFzdE5hbWUgdG8gYmUgc3BlY2lmaWVkXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGNvbnN0cnVjdG9yIGlzIGNhbGxlZCB3aXRoIG1vcmUgYXJndW1lbnRzIHRoYW4gaXNCdWlsdFdpdGggc3BlY2lmaWVzXCIsIFxuICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgUGVyc29uLFxuICAgICAgICAgICAgICAgIHA7XG4gICAgICAgICAgICBQZXJzb24gPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcIm5hbWVcIikud2hpY2guaXNBKFwic3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzTWFueShcImZyaWVuZHNcIikuZWFjaE9mV2hpY2gudmFsaWRhdGVXaXRoKGZ1bmN0aW9uIChmcmllbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZyaWVuZCBpbnN0YW5jZW9mIFBlcnNvbjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHAgPSBuZXcgUGVyc29uKFwiU2VtbXlcIik7XG4gICAgICAgICAgICB9KS50b1Rocm93KFwiVG9vIG1hbnkgYXJndW1lbnRzIHRvIGNvbnN0cnVjdG9yLiBFeHBlY3RlZCAwIHJlcXVpcmVkIGFyZ3VtZW50cyBhbmQgMCBvcHRpb25hbCBhcmd1bWVudHNcIik7XG5cbiAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBzZXQgdGhlIGF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBhdHRyaWJ1dGVzIHRvIHRoZSBhcHByb3ByaWF0ZSB2YWx1ZXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIENhcmQsXG4gICAgICAgICAgICBUaGluZyxcbiAgICAgICAgICAgIHQxLFxuICAgICAgICAgICAgdDIsXG4gICAgICAgICAgICB0MyxcbiAgICAgICAgICAgIGM7XG5cbiAgICAgICAgICAgIHMgPSBuZXcgTW9kZWwoKTtcbiAgICAgICAgICAgIHMuaGFzQShcInJhbmtcIik7XG4gICAgICAgICAgICBzLmhhc0EoXCJzdWl0XCIpO1xuICAgICAgICAgICAgcy5pc0J1aWx0V2l0aChcInJhbmtcIixcInN1aXRcIik7XG5cbiAgICAgICAgICAgIENhcmQgPSBuZXcgTW9kZWwoKTtcblxuICAgICAgICAgICAgQ2FyZC5oYXNBKFwicmFua1wiKTtcbiAgICAgICAgICAgIENhcmQuaGFzQShcInN1aXRcIik7XG4gICAgICAgICAgICBDYXJkLmlzQnVpbHRXaXRoKFwicmFua1wiLFwic3VpdFwiKTtcblxuICAgICAgICAgICAgYyA9IG5ldyBDYXJkKFwiYWNlXCIsIFwiZGlhbW9uZHNcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGV4cGVjdChjLnJhbmsoKSkudG9CZShcImFjZVwiKTtcbiAgICAgICAgICAgIGV4cGVjdChjLnN1aXQoKSkudG9CZShcImRpYW1vbmRzXCIpO1xuICAgICAgICAgICAgZXhwZWN0KGMuaGFzQSkudG9CZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgZXhwZWN0KENhcmQuaGFzQSkubm90LnRvQmUodW5kZWZpbmVkKTtcblxuICAgICAgICAgICAgVGhpbmcgPSBuZXcgTW9kZWwoKTtcbiAgICAgICAgICAgIFRoaW5nLmhhc0EoXCJ0aGluZzFcIik7XG4gICAgICAgICAgICBUaGluZy5oYXNBKFwidGhpbmcyXCIpO1xuICAgICAgICAgICAgVGhpbmcuaGFzQShcInRoaW5nM1wiKTtcbiAgICAgICAgICAgIFRoaW5nLmlzQnVpbHRXaXRoKFwidGhpbmcxXCIsIFwiJXRoaW5nMlwiLCBcIiV0aGluZzNcIik7XG5cbiAgICAgICAgICAgIHQxID0gbmV3IFRoaW5nKDUpO1xuICAgICAgICAgICAgdDIgPSBuZXcgVGhpbmcoMTAsIDIwKTtcbiAgICAgICAgICAgIHQzID0gbmV3IFRoaW5nKDIwLCAzMCwgNDApO1xuXG4gICAgICAgICAgICBleHBlY3QodDEudGhpbmcxKCkpLnRvQmUoNSk7XG4gICAgICAgICAgICBleHBlY3QodDEudGhpbmcyKCkpLnRvQmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgIGV4cGVjdCh0MS50aGluZzMoKSkudG9CZSh1bmRlZmluZWQpOyAgICAgICAgICAgIFxuICAgICAgICAgICAgZXhwZWN0KHQyLnRoaW5nMSgpKS50b0JlKDEwKTtcbiAgICAgICAgICAgIGV4cGVjdCh0Mi50aGluZzIoKSkudG9CZSgyMCk7XG4gICAgICAgICAgICBleHBlY3QodDIudGhpbmczKCkpLnRvQmUodW5kZWZpbmVkKTsgICAgICAgICAgICBcbiAgICAgICAgICAgIGV4cGVjdCh0My50aGluZzEoKSkudG9CZSgyMCk7XG4gICAgICAgICAgICBleHBlY3QodDMudGhpbmcyKCkpLnRvQmUoMzApO1xuICAgICAgICAgICAgZXhwZWN0KHQzLnRoaW5nMygpKS50b0JlKDQwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmVxdWlyZSB0aGF0IHRoZSByZXN1bHRpbmcgY29uc3RydWN0b3IncyBwYXJhbWV0ZXJzIHBhc3MgdGhlIGFwcHJvcHJpYXRlIHZhbGlkYXRvcnNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRoaW5nMVZhbGlkYXRvciA9IGphc21pbmUuY3JlYXRlU3B5KCksXG4gICAgICAgICAgICB0aGluZzJWYWxpZGF0b3IgPSBqYXNtaW5lLmNyZWF0ZVNweSgpLFxuICAgICAgICAgICAgdGhpbmczVmFsaWRhdG9yID0gamFzbWluZS5jcmVhdGVTcHkoKSxcbiAgICAgICAgICAgIFRoaW5nLFxuICAgICAgICAgICAgdDEsXG4gICAgICAgICAgICB0MixcbiAgICAgICAgICAgIHQzO1xuXG4gICAgICAgICAgICBUaGluZyA9IG5ldyBNb2RlbCgpO1xuXG4gICAgICAgICAgICBUaGluZy5oYXNBKFwidGhpbmcxXCIpLndoaWNoLnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKCkgeyB0aGluZzFWYWxpZGF0b3IoKTsgcmV0dXJuIHRydWU7IH0pO1xuICAgICAgICAgICAgVGhpbmcuaGFzQShcInRoaW5nMlwiKS53aGljaC52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uICgpIHsgdGhpbmcyVmFsaWRhdG9yKCk7IHJldHVybiB0cnVlOyB9KTtcbiAgICAgICAgICAgIFRoaW5nLmhhc0EoXCJ0aGluZzNcIikud2hpY2gudmFsaWRhdGVzV2l0aChmdW5jdGlvbiAoKSB7IHRoaW5nM1ZhbGlkYXRvcigpOyByZXR1cm4gdHJ1ZTsgfSk7XG4gICAgICAgICAgICBUaGluZy5pc0J1aWx0V2l0aChcInRoaW5nMVwiLCBcIiV0aGluZzJcIiwgXCIldGhpbmczXCIpO1xuXG4gICAgICAgICAgICAvL1RoaW5nID0gcy5jcmVhdGUoKTtcbiAgICAgICAgICAgIHQxID0gbmV3IFRoaW5nKDEwKTtcbiAgICAgICAgICAgIGV4cGVjdCh0aGluZzFWYWxpZGF0b3IpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdCh0aGluZzJWYWxpZGF0b3IpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICBleHBlY3QodGhpbmczVmFsaWRhdG9yKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuXG4gICAgICAgICAgICB0MiA9IG5ldyBUaGluZygxMCwgMjApO1xuICAgICAgICAgICAgZXhwZWN0KHRoaW5nMVZhbGlkYXRvcikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHRoaW5nMlZhbGlkYXRvcikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHRoaW5nM1ZhbGlkYXRvcikubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTtcblxuICAgICAgICAgICAgdDEgPSBuZXcgVGhpbmcoMTAsIDIwLCAzMCk7XG4gICAgICAgICAgICBleHBlY3QodGhpbmcxVmFsaWRhdG9yKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICBleHBlY3QodGhpbmcyVmFsaWRhdG9yKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICBleHBlY3QodGhpbmczVmFsaWRhdG9yKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vdGhpbmsgb2YgdGhlIG9wdGlvbmFsIGZ1bmN0aW9uIGFzIGFuIGluaXRpYWxpemVyIHRoYXQgaXMgcnVuIGFmdGVyIHRoZSBhdHRyaWJ1dGVzIGFyZSBzZXRcbiAgICAgICAgLy9mb3IgZXhhbXBsZSwgY29uc2lkZXIgdGhlIERlY2sgbW9kZWwuIEluIGFkZGl0aW9uIHRvIHNldHRpbmcgdXAgdGhlIGhhc01hbnkoXCJjYXJkc1wiKSBhdHRyaWJ1dGUsXG4gICAgICAgIC8vd2UnbGwgd2FudCB0byBjcmVhdGUgYSBuZXN0ZWQgZm9yIGxvb3AgdGhhdCBjcmVhdGVzIGEgY2FyZCBvZiBlYWNoIHN1aXQvcmFuayBjb21iaW5hdGlvblxuICAgICAgICAvL3RoYXQgd291bGQgYmUgdGhlICdpbml0aWFsaXplcicgZnVuY3Rpb25cbiAgICAgICAgaXQoXCJzaG91bGQgY2FsbCB0aGUgb3B0aW9uYWwgZnVuY3Rpb24gYWZ0ZXIgdGhlIGF0dHJpYnV0ZXMgYXJlIHNldCBpbiB0aGUgY29uc3RydWN0b3JcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGluaXRpYWxpemVyID0gamFzbWluZS5jcmVhdGVTcHkoKSxcbiAgICAgICAgICAgIFRoaW5nLFxuICAgICAgICAgICAgdDEsIFxuICAgICAgICAgICAgdDIsXG4gICAgICAgICAgICB0MztcblxuICAgICAgICAgICAgVGhpbmcgPSBuZXcgTW9kZWwoKTtcbiAgICAgICAgICAgIFRoaW5nLmhhc0EoXCJ0aGluZzFcIik7XG4gICAgICAgICAgICBUaGluZy5oYXNBKFwidGhpbmcyXCIpO1xuICAgICAgICAgICAgVGhpbmcuaGFzQShcInRoaW5nM1wiKTtcbiAgICAgICAgICAgIFRoaW5nLmlzQnVpbHRXaXRoKFwidGhpbmcxXCIsIFwiJXRoaW5nMlwiLCBcIiV0aGluZzNcIiwgaW5pdGlhbGl6ZXIpO1xuXG4gICAgICAgICAgICAvL1RoaW5nID0gcy5jcmVhdGUoKTtcbiAgICAgICAgICAgIHQxID0gbmV3IFRoaW5nKDUpO1xuICAgICAgICAgICAgZXhwZWN0KGluaXRpYWxpemVyKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG5cbiAgICAgICAgICAgIHQyID0gbmV3IFRoaW5nKDEwLCAyMCk7XG4gICAgICAgICAgICBleHBlY3QoaW5pdGlhbGl6ZXIpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcblxuICAgICAgICAgICAgdDMgPSBuZXcgVGhpbmcoMjAsIDMwLCA0MCk7XG4gICAgICAgICAgICBleHBlY3QoaW5pdGlhbGl6ZXIpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgYWxsb3cgZm9yIEF0dHJMaXN0IGF0dHJpYnV0ZXMgdG8gYmUgc3BlY2lmaWVkIGJ5IGlzQnVpbHRXaXRoIGFuZCBpbml0aWFsaXplZCB3aXRoIGEgcmF3IGFycmF5XCIsXG4gICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBEZXZpbCxcbiAgICAgICAgICAgICAgICBzYXRhbixcbiAgICAgICAgICAgICAgICBwMSwgcDIsIHAzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBEZXZpbCA9IG5ldyBNb2RlbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNBKFwibnVtYmVyXCIpLndoaWNoLmlzQShcImludGVnZXJcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNNYW55KFwibmFtZXNcIikuZWFjaE9mV2hpY2guaXNBKFwic3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJudW1iZXJcIiwgXCJuYW1lc1wiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNhdGFuID0gbmV3IERldmlsKDY2Nik7XG4gICAgICAgICAgICB9KS50b1Rocm93KFwiQ29uc3RydWN0b3IgcmVxdWlyZXMgbnVtYmVyLCBuYW1lcyB0byBiZSBzcGVjaWZpZWRcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGV4cGVjdChzYXRhbikudG9CZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNhdGFuID0gbmV3IERldmlsKDY2NiwgNjY3KTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coXCJNb2RlbDogQ29uc3RydWN0b3IgcmVxdWlyZXMgJ25hbWVzJyBhdHRyaWJ1dGUgdG8gYmUgc2V0IHdpdGggYW4gQXJyYXlcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2F0YW4gPSBuZXcgRGV2aWwoNjY2LCBbXCJsdWNpZmVyXCIsIFwiYmVlbHplYnViXCIsIDNdKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coKTtcblxuICAgICAgICAgICAgZXhwZWN0KHNhdGFuKS50b0JlKHVuZGVmaW5lZCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2F0YW4gPSBuZXcgRGV2aWwoNjY2LCBbXCJiZWVsemVidWJcIiwgXCJsdWNpZmVyXCIsIFwicHJpbmNlIG9mIGRhcmtuZXNzXCJdKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGV4cGVjdChzYXRhbikubm90LnRvQmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZXhwZWN0KHNhdGFuLm5hbWVzKCkuc2l6ZSgpKS50b0JlKDMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBQZXJzb24uaXNCdWlsdFdpdGgoXCJuYW1lXCIsIFwiaWRcIiwgXCIlZnJpZW5kc1wiKTtcblxuICAgICAgICAgICAgcDEgPSBuZXcgUGVyc29uKFwiTWFya1wiLCAxMjM0NTY3ODkpO1xuICAgICAgICAgICAgcDIgPSBuZXcgUGVyc29uKFwiSm9oblwiLCAyMjM0NTY3ODkpO1xuXG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHAzID0gbmV3IFBlcnNvbihcIlNlbW15XCIsIDMyMzQ1Njc4OSwgW3AxLCBwMl0pO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcblxuICAgICAgICAgICAgZXhwZWN0KHAzLmZyaWVuZHMoKS5zaXplKCkpLnRvQmUoMik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG5cblxuICAgIGl0KFwic2hvdWxkIGFsbG93IGZvciBhIHNwZWNpZmljYXRpb24gZnVuY3Rpb24gdG8gYmUgc2VudCBpbiB0aGF0IGJvb3RzdHJhcHMgdGhlIG1vZGVsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIFBlcnNvbixcbiAgICAgICAgICAgIHA7XG5cbiAgICAgICAgUGVyc29uID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaGFzQShcImZpcnN0TmFtZVwiKTtcbiAgICAgICAgICAgIHRoaXMuaGFzQShcImxhc3ROYW1lXCIpO1xuICAgICAgICAgICAgdGhpcy5oYXNBbihcImlkXCIpO1xuICAgICAgICAgICAgdGhpcy5oYXNNYW55KFwiZnJpZW5kc1wiKTtcbiAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoXCJmaXJzdE5hbWVcIiwgXCJsYXN0TmFtZVwiLCBcIiVpZFwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcCA9IG5ldyBQZXJzb24oXCJNYXJrXCIsIFwiUGhpbGxpcHNcIik7XG5cbiAgICAgICAgZXhwZWN0KHAgaW5zdGFuY2VvZiBQZXJzb24pLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChwLmZpcnN0TmFtZSgpKS50b0JlKFwiTWFya1wiKTtcbiAgICAgICAgZXhwZWN0KHAubGFzdE5hbWUoKSkudG9CZShcIlBoaWxsaXBzXCIpO1xuICAgICAgICBleHBlY3QocC5pZCgpKS50b0JlKHVuZGVmaW5lZCk7XG4gICAgICAgIGV4cGVjdChQZXJzb24uaGFzQSkubm90LnRvQmUodW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBzcGVjaWZpY2F0aW9uIHBhcmFtZXRlciBpcyBub3QgYSBmdW5jdGlvblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzO1xuICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcyA9IG5ldyBNb2RlbCg1KTtcbiAgICAgICAgfSkudG9UaHJvdyhcIk1vZGVsOiBzcGVjaWZpY2F0aW9uIHBhcmFtZXRlciBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgfSk7XG5cblxuICAgIC8vIGNoYW5nZSB0aGUgQVBJIGFzIHBlciBFZmZlY3RpdmUgSmF2YVNjcmlwdFxuICAgIHhpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgY29uc3RydWN0b3IgaXMgbm90IGNhbGxlZCB3aXRoIHRoZSBuZXcgb3BlcmF0b3JcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcDtcblxuICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLypqc2hpbnQgbmV3Y2FwOmZhbHNlICovXG4gICAgICAgICAgICBwID0gUGVyc29uKCk7XG4gICAgICAgIH0pLnRvVGhyb3coXCJNb2RlbDogaW5zdGFuY2VzIG11c3QgYmUgY3JlYXRlZCB1c2luZyB0aGUgbmV3IG9wZXJhdG9yXCIpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJzaG91bGQgaGF2ZSBhIGNvbnN0cnVjdG9yIHRoYXQgaXMgbmV3IGFnbm9zdGljXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHA7XG4gICAgICAgIC8qanNoaW50IG5ld2NhcDpmYWxzZSAqL1xuICAgICAgICBwID0gUGVyc29uKCk7XG4gICAgICAgIGV4cGVjdChwIGluc3RhbmNlb2YgUGVyc29uKS50b0JlKHRydWUpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJzaG91bGQgbm90IHRocm93IGFuIGVycm9yIHdoZW4gYSBtb2RlbCBoYXMgYSBzdWJtb2RlbCBkZWZpbmVkIGluIGRlZmF1bHRzVG8gdGhhdCBjaGFuZ2VzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIERvZywgcDtcblxuICAgICAgICBEb2cgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5oYXNBKFwibmFtZVwiKS53aGljaC5pc0EoXCJzdHJpbmdcIik7XG4gICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKFwibmFtZVwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgUGVyc29uLmhhc0EoXCJkb2dcIikud2hpY2guZGVmYXVsdHNUbyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERvZyhcIkxva2lcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHAgPSBuZXcgUGVyc29uKCk7XG4gICAgICAgIGV4cGVjdChwLmRvZygpLm5hbWUoKSkudG9CZShcIkxva2lcIik7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHAuZG9nKG5ldyBEb2coXCJHcmFjaWVcIikpO1xuICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgIH0pO1xuXG5cblxuICAgIGl0KFwic2hvdWxkIHdvcmsgd2l0aCB0aGlzIGV4YW1wbGVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ2FyZCxcbiAgICAgICAgRGVjayxcbiAgICAgICAgZCxcbiAgICAgICAgaSxcbiAgICAgICAgaixcbiAgICAgICAgc3VpdHMgPSBbXCJjbHVic1wiLCBcImRpYW1vbmRzXCIsIFwiaGVhcnRzXCIsIFwic3BhZGVzXCJdLFxuICAgICAgICByYW5rcyA9IFtcIjJcIiwgXCIzXCIsIFwiNFwiLCBcIjVcIiwgXCI2XCIsIFwiN1wiLCBcIjhcIiwgXCI5XCIsIFwiMTBcIiwgXCJKXCIsIFwiUVwiLCBcIktcIiwgXCJBXCJdO1xuXG5cbiAgICAgICAgQ2FyZCA9IG5ldyBNb2RlbCgpO1xuICAgICAgICBDYXJkLmhhc0EoXCJzdWl0XCIpLndoaWNoLmlzQShcInN0cmluZ1wiKS5hbmQuaXNPbmVPZihzdWl0cyk7XG4gICAgICAgIENhcmQuaXNCdWlsdFdpdGgoJ3JhbmsnLCdzdWl0Jyk7XG4gICAgICAgIENhcmQuaGFzQShcInJhbmtcIikud2hpY2guaXNBKFwic3RyaW5nXCIpLmFuZC5pc09uZU9mKHJhbmtzKTtcblxuICAgICAgICBDYXJkLmxvb2tzTGlrZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yYW5rKCkgKyBcIiBvZiBcIiArIHRoaXMuc3VpdCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgYyA9IG5ldyBDYXJkKFwiNVwiLCBcImRpYW1vbmRzXCIpO1xuICAgICAgICBleHBlY3QoYy50b1N0cmluZygpKS50b0JlKFwiNSBvZiBkaWFtb25kc1wiKTtcbiAgICAgICAgXG4gICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjLnJhbmsoMTApO1xuICAgICAgICB9KS50b1Rocm93KCk7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGMucmFuayhcIjEwXCIpO1xuICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuXG4gICAgICAgIERlY2sgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy90aGlzLmhhc01hbnkoXCJjYXJkc1wiKS53aGljaC5pc0EoQ2FyZCk7XG4gICAgICAgICAgICB0aGlzLmhhc01hbnkoXCJjYXJkc1wiKS5lYWNoT2ZXaGljaC52YWxpZGF0ZVdpdGgoZnVuY3Rpb24gKGNhcmQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcImEgY2FyZCBtdXN0IGJlIGEgdmFsaWQgQ2FyZCBvYmplY3QuXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhcmQgaW5zdGFuY2VvZiBDYXJkO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuaXNCdWlsdFdpdGgoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzdWl0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgcmFua3MubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZHMoKS5hZGQobmV3IENhcmQocmFua3Nbal0sIHN1aXRzW2ldKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZCA9IG5ldyBEZWNrKCk7XG5cbiAgICAgICAgZXhwZWN0KGQuY2FyZHMoKS5hdCgwKS50b1N0cmluZygpKS50b0VxdWFsKFwiMiBvZiBjbHVic1wiKTtcbiAgICAgICAgZXhwZWN0KGQuY2FyZHMoKS5hdCg1MSkudG9TdHJpbmcoKSkudG9FcXVhbChcIkEgb2Ygc3BhZGVzXCIpO1xuXG4gICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkLmNhcmRzKCkuYWRkKDUpO1xuICAgICAgICB9KS50b1Rocm93KFwiYSBjYXJkIG11c3QgYmUgYSB2YWxpZCBDYXJkIG9iamVjdC5cIik7XG5cbiAgICAgICAgZXhwZWN0KGQuY2FyZHMoKS5hdCgwKS50b0pTT04oKSkudG9FcXVhbCh7cmFuazpcIjJcIiwgc3VpdDpcImNsdWJzXCJ9KTtcbiAgICAgICAgZXhwZWN0KGQudG9KU09OKCkuY2FyZHMubGVuZ3RoKS50b0JlKDUyKTtcbiAgICB9KTtcblxuICAgIGl0KFwic2hvdWxkIGFsc28gd29yayB3aXRoIHRoaXMgZXhhbXBsZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDYXJkLFxuICAgICAgICAgICAgRGVjayxcbiAgICAgICAgICAgIHN1aXRzID0gW1wiY2x1YnNcIiwgXCJkaWFtb25kc1wiLCBcImhlYXJ0c1wiLCBcInNwYWRlc1wiXSxcbiAgICAgICAgICAgIHJhbmtzID0gW1wiMlwiLFwiM1wiLFwiNFwiLFwiNVwiLFwiNlwiLFwiN1wiLFwiOFwiLFwiOVwiLFwiMTBcIixcIkpcIixcIlFcIixcIktcIixcIkFcIl07XG4gICAgICAgIFxuICAgICAgICBDYXJkID0gbmV3IE1vZGVsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaXNJbW11dGFibGUoKTtcbiAgICAgICAgICAgIHRoaXMuaGFzQShcInN1aXRcIikud2hpY2guaXNPbmVPZihzdWl0cyk7XG4gICAgICAgICAgICB0aGlzLmhhc0EoXCJyYW5rXCIpLndoaWNoLmlzT25lT2YocmFua3MpO1xuICAgICAgICAgICAgdGhpcy5pc0J1aWx0V2l0aChcInJhbmtcIixcInN1aXRcIik7XG4gICAgICAgICAgICB0aGlzLmxvb2tzTGlrZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmFuaygpICsgXCIgb2YgXCIgKyB0aGlzLnN1aXQoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIERlY2sgPSBuZXcgTW9kZWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJhbmssXG4gICAgICAgICAgICBzdWl0O1xuXG4gICAgICAgICAgICAvL3RoaXMuaGFzTWFueShcImNhcmRzXCIpLmVhY2hPZldoaWNoLmlzQShDYXJkKTtcbiAgICAgICAgICAgIHRoaXMuaGFzTWFueShcImNhcmRzXCIpLmVhY2hPZldoaWNoLnZhbGlkYXRlV2l0aChmdW5jdGlvbiAoY2FyZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkIGluc3RhbmNlb2YgQ2FyZDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmlzQnVpbHRXaXRoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHN1aXQgPSAwOyBzdWl0IDwgc3VpdHMubGVuZ3RoOyBzdWl0KyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChyYW5rID0gMDsgcmFuayA8IHJhbmtzLmxlbmd0aDsgcmFuaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRzKCkuYWRkKG5ldyBDYXJkKHJhbmtzW3JhbmtdLCBzdWl0c1tzdWl0XSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMubG9va3NMaWtlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FyZCxcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBcIlwiO1xuXG4gICAgICAgICAgICAgICAgZm9yKGNhcmQgPSAwOyBjYXJkIDwgdGhpcy5jYXJkcygpLnNpemUoKTsgKytjYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSB0aGlzLmNhcmRzKCkuYXQoY2FyZCkudG9TdHJpbmcoKSArIFwiXFxuXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZCA9IG5ldyBEZWNrKCk7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGQuY2FyZHMoKS5hZGQoNSk7XG4gICAgICAgIH0pLnRvVGhyb3coXCJ2YWxpZGF0b3IgZmFpbGVkIHdpdGggcGFyYW1ldGVyIDVcIik7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGQuY2FyZHMoKS5hdCg1KS5zdWl0KFwiZGlhbW9uZHNcIik7XG4gICAgICAgIH0pLnRvVGhyb3coXCJjYW5ub3Qgc2V0IHRoZSBpbW11dGFibGUgcHJvcGVydHkgc3VpdCBhZnRlciBpdCBoYXMgYmVlbiBzZXRcIik7XG4gICAgfSk7XG5cblxuICAgIC8qIGRlcHJlY2F0ZWQgdW50aWwgd2UgZmluZCBhIGdvb2Qgc29sdXRpb24gKi9cbiAgICBkZXNjcmliZShcIk1hcmsncyBpc0EvdmFsaWRhdG9yIGJ1Z1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHhpdChcInNob3VsZCBub3QgdGhyb3cgYW4gZXJyb3JcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIERvZyA9IG5ldyBNb2RlbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0EoXCJuYW1lXCIpOyAvL2JpemFycmVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgUGVyc29uID0gbmV3IE1vZGVsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzQShcImRvZ1wiKS53aGljaC5pc0EoRG9nKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZCA9IG5ldyBEb2coKTtcbiAgICAgICAgICAgIHZhciBwID0gbmV3IFBlcnNvbigpO1xuICAgICAgICAgICAgcC5kb2coZCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG4iLCIvKmdsb2JhbCBkZXNjcmliZSwgaXQsIGJlZm9yZUVhY2gsIGV4cGVjdCwgeGl0LCBqYXNtaW5lICovXG5cblxuZGVzY3JpYmUoXCJWYWxpZGF0b3JcIiwgZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBWYWxpZGF0b3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvY29yZS92YWxpZGF0b3IuanMnKSxcbiAgICAgICAgTW9kZWwgPSByZXF1aXJlKCcuLi8uLi9zcmMvY29yZS9tb2RlbC5qcycpO1xuXG4gICAgeGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIG9uIGFuIGVtcHR5IHBhcmFtZXRlclwiLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB9KTtcblxuICAgIHhpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBvbiBhIG5vbi1mdW5jdGlvbiBwYXJhbWV0ZXJcIiwgZnVuY3Rpb24gKCkge1xuXG4gICAgfSk7XG5cbiAgICB4aXQoXCJzaG91bGQgcmV0dXJuIGEgZnVuY3Rpb24gb2JqZWN0IHRoYXQgaGFzIHRoZSBzcGVjaWZpZWQgbWVzc2FnZSBhc1wiICtcbiAgICAgICAgXCIgYW4gYXR0cmlidXRlc1wiLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB9KTtcblxuXG4gICAgZGVzY3JpYmUoXCJzdGF0aWMgYWRkVmFsaWRhdG9yIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0cml2aWFsVmFsaWRhdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGZpcnN0IHBhcmFtZXRlciBpcyBhYnNlbnQgb3Igbm90IGEgXCIgK1xuICAgICAgICAgICBcInN0cmluZ1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFZhbGlkYXRvci5hZGRWYWxpZGF0b3IoKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiYWRkVmFsaWRhdG9yIHJlcXVpcmVzIGEgbmFtZSB0byBiZSBcIiArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzcGVjaWZpZWQgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclwiKSk7XG5cbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgVmFsaWRhdG9yLmFkZFZhbGlkYXRvcig1KTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiYWRkVmFsaWRhdG9yIHJlcXVpcmVzIGEgbmFtZSB0byBiZSBcIiArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzcGVjaWZpZWQgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclwiKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBzZWNvbmQgcGFyYW1ldGVyIGlzIGFic2VudCBvciBub3QgYSBcIiArXG4gICAgICAgICAgIFwiZnVuY3Rpb25cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBWYWxpZGF0b3IuYWRkVmFsaWRhdG9yKFwiaXNHcmVhdGVyVGhhblwiKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coXCJhZGRWYWxpZGF0b3IgcmVxdWlyZXMgYSBmdW5jdGlvbiBhcyB0aGUgc2Vjb25kIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgXCJwYXJhbWV0ZXJcIik7XG5cbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgVmFsaWRhdG9yLmFkZFZhbGlkYXRvcihcImlzR3JlYXRlclRoYW5cIiwgNSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KFwiYWRkVmFsaWRhdG9yIHJlcXVpcmVzIGEgZnVuY3Rpb24gYXMgdGhlIHNlY29uZCBcIiArIFxuICAgICAgICAgICAgICAgICAgICAgICBcInBhcmFtZXRlclwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgYWRkIHRoZSB2YWxpZGF0b3Igb2JqZWN0IHRvIHRoZSBzdGF0aWMgdmFsaWRhdG9ycyBsaXN0XCIsIFxuICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgIFZhbGlkYXRvci5hZGRWYWxpZGF0b3IoXCJpc0dyZWF0ZXJUaGFuNVwiLCBmdW5jdGlvbiAoZXhwZWN0ZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcIkV4cGVjdGVkIFwiICsgdGhpcy5hY3R1YWwgKyBcIiB0byBiZSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZ3JlYXRlciB0aGFuIDVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0dWFsID4gNTtcbiAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiBhIHZhbGlkYXRvciBpcyBhZGRlZCB0aGF0IGFscmVhZHkgZXhpc3RzXCIsIFxuICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgIFZhbGlkYXRvci5hZGRWYWxpZGF0b3IoXCJpc0dyZWF0ZXJUaGFuNVwiLCBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgfSkudG9UaHJvdyhcIlZhbGlkYXRvciAnaXNHcmVhdGVyVGhhbjUnIGFscmVhZHkgZGVmaW5lZFwiKTtcbiAgICAgICAgICAgfVxuICAgICAgICApO1xuXG5cbiAgICAgICAgaXQoXCJzaG91bGQgYWNjZXB0IGEgdGhpcmQgYXJnIHRoYXQgbXVzdCBiZSBhIGZ1bmN0aW9uXCIgLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFZhbGlkYXRvci5hZGRWYWxpZGF0b3IoXCJpc0xlc3NUaGFuNVwiLCBmdW5jdGlvbiAoKSB7fSwgNSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgVmFsaWRhdG9yLmFkZFZhbGlkYXRvcihcImlzTGVzc1RoYW4xMFwiLCBmdW5jdGlvbiAoKSB7fSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBjYWxsIHRoZSBhcmdWYWxpZGF0b3Igb24gdGhlIGV4cGVjdGVkIHZhbCBvbmNlIGFkZGVkXCIsXG4gICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgIHZhciBhcmdWYWxpZGF0b3JTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgpLFxuICAgICAgICAgICAgICAgICAgIGFyZ1ZhbGlkYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgYXJnVmFsaWRhdG9yU3B5LmFwcGx5KGFyZ1ZhbGlkYXRvclNweSxhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgIFZhbGlkYXRvci5hZGRWYWxpZGF0b3IoXCJleGFtcGxlVmFsaWRhdG9yXCIsIHRyaXZpYWxWYWxpZGF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ1ZhbGlkYXRvcik7XG4gICAgICAgICAgICAgICBWYWxpZGF0b3IuZ2V0VmFsaWRhdG9yKFwiZXhhbXBsZVZhbGlkYXRvclwiKShcImV4YW1wbGVcIik7XG4gICAgICAgICAgICAgICBleHBlY3QoYXJnVmFsaWRhdG9yU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcImV4YW1wbGVcIik7XG4gICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgYXJnVmFsaWRhdG9yIGZhaWxzXCIsXG4gICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgIHZhciBhcmdWYWxpZGF0b3I9IGZ1bmN0aW9uIChhcmcpIHtcbiAgICAgICAgICAgICAgICAgICAvL29ubHkgdmFsaWQgaW5wdXQgdG8gdGhpcyB2YWxpZGF0b3JcbiAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJnID09PSBcInRlc3RcIjtcbiAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgIFxuICAgICAgICAgICAgICAgVmFsaWRhdG9yLmFkZFZhbGlkYXRvcihcImV4YW1wbGVWYWxpZGF0b3IyXCIsIHRyaXZpYWxWYWxpZGF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ1ZhbGlkYXRvcik7XG4gICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgVmFsaWRhdG9yLmdldFZhbGlkYXRvcihcImV4YW1wbGVWYWxpZGF0b3IyXCIpKFwiZXhhbXBsZVwiKTtcbiAgICAgICAgICAgICAgIH0pLnRvVGhyb3coKTtcblxuICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICBWYWxpZGF0b3IuZ2V0VmFsaWRhdG9yKFwiZXhhbXBsZVZhbGlkYXRvcjJcIikoXCJleGFtcGxlXCIpO1xuICAgICAgICAgICAgICAgfSkudG9UaHJvdygpO1xuICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcInN0YXRpYyBnZXRWYWxpZGF0b3IgbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlcmUgaXMgbm8gcGFyYW1ldGVyIHNwZWNpZmllZFwiLFxuICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgIFZhbGlkYXRvci5nZXRWYWxpZGF0b3IoKTtcbiAgICAgICAgICAgICAgIH0pLnRvVGhyb3coXCJWYWxpZGF0b3I6IGdldFZhbGlkYXRvciBtZXRob2QgcmVxdWlyZXMgYSBzdHJpbmcgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcInBhcmFtZXRlclwiKTtcbiAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBwYXJhbWV0ZXIgaXMgbm90IGEgc3RyaW5nXCIsXG4gICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgVmFsaWRhdG9yLmdldFZhbGlkYXRvcig1KTtcbiAgICAgICAgICAgICAgIH0pLnRvVGhyb3coXCJWYWxpZGF0b3I6IHBhcmFtZXRlciB0byBnZXRWYWxpZGF0b3IgbWV0aG9kIG11c3QgYmVcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGEgc3RyaW5nXCIpO1xuICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdmFsaWRhdG9yIGRvZXMgbm90IGV4aXN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgVmFsaWRhdG9yLmdldFZhbGlkYXRvcihcIm5vbkV4aXN0ZW50VmFsaWRhdG9yXCIpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhcIlZhbGlkYXRvcjogJ25vbkV4aXN0ZW50VmFsaWRhdG9yJyBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmV0dXJuIHRoZSBzcGVjaWZpZWQgdmFsaWRhdG9yIGZ1bmN0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB2ID0gVmFsaWRhdG9yLmdldFZhbGlkYXRvcihcImlzR3JlYXRlclRoYW41XCIpO1xuICAgICAgICAgICAgZXhwZWN0KHYpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QodigpKDYpKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2KCkoNCk7XG4gICAgICAgICAgICB9KS50b1Rocm93KCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJ2YWxpZGF0b3JzIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHhpdChcInNob3VsZCByZXR1cm4gYSBsaXN0IG9mIHZhbGlkYXRvciBuYW1lc1wiLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBCVUlMVC1JTiBWQUxJREFUT1IgVEVTVFMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGRlc2NyaWJlKFwiYnVpbHQtaW4gdmFsaWRhdG9yc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlc2NyaWJlKFwiI2lzR3JlYXRlclRoYW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaXQoXCJpdCBzaG91bGQgdGhyb3cgaWYgdGhlIGFyZyBpcyBub3QgZ3JlYXRlciB0aGFuIHRoZSBwYXJhbWV0ZXJcIixcbiAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICB2YXIgaXNHcmVhdGVyVGhhbiA9IFZhbGlkYXRvci5nZXRWYWxpZGF0b3IoXCJpc0dyZWF0ZXJUaGFuXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICBpc0dyZWF0ZXJUaGFuNSA9IGlzR3JlYXRlclRoYW4oNSk7XG4gICAgICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgaXNHcmVhdGVyVGhhbjUoNCk7XG4gICAgICAgICAgICAgICAgICAgfSkudG9UaHJvdyhcIjQgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiA1XCIpO1xuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIGlzR3JlYXRlclRoYW41KDYpO1xuICAgICAgICAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZXNjcmliZShcIiNpc0xlc3NUaGFuXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGl0KFwiaXQgc2hvdWxkIHRocm93IGlmIHRoZSBhcmcgaXMgbm90IGxlc3MgdGhhbiB0aGUgcGFyYW1ldGVyXCIsXG4gICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgdmFyIGlzTGVzc1RoYW41ID0gVmFsaWRhdG9yLmdldFZhbGlkYXRvcihcImlzTGVzc1RoYW5cIikoNSksXG4gICAgICAgICAgICAgICAgICAgICAgIGlzTGVzc1RoYW4xMCA9IFZhbGlkYXRvci5nZXRWYWxpZGF0b3IoXCJpc0xlc3NUaGFuXCIpKDEwKTtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBpc0xlc3NUaGFuNSg2KTtcbiAgICAgICAgICAgICAgICAgICB9KS50b1Rocm93KFwiNiBzaG91bGQgYmUgbGVzcyB0aGFuIDVcIik7XG4gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgaXNMZXNzVGhhbjEwKDEyKTtcbiAgICAgICAgICAgICAgICAgICB9KS50b1Rocm93KFwiMTIgc2hvdWxkIGJlIGxlc3MgdGhhbiAxMFwiKTtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBpc0xlc3NUaGFuMTAoOCk7XG4gICAgICAgICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBpc0xlc3NUaGFuNSg0KTtcbiAgICAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVzY3JpYmUoXCIjaXNPbmVPZlwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpdChcInNob3VsZCB0aHJvdyBpZiBwYXJhbSBkb2VzIG5vdCBjb21lIGZyb20gdGhlIHNldFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzT25lT2YgPSBWYWxpZGF0b3IuZ2V0VmFsaWRhdG9yKFwiaXNPbmVPZlwiKSxcbiAgICAgICAgICAgICAgICAgICAgaXNPbmVPZlRlc3RlciA9IGlzT25lT2YoW1wiQVwiLFwiQlwiLFwiQ1wiXSk7XG5cbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpc09uZU9mVGVzdGVyKFwiRFwiKTtcbiAgICAgICAgICAgICAgICB9KS50b1Rocm93KFwiRCBzaG91bGQgYmUgb25lIG9mIHRoZSBzZXQ6IEEsQixDXCIpO1xuXG4gICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNPbmVPZlRlc3RlcihcIkFcIik7XG4gICAgICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZXNjcmliZShcIiNpc0FcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGlzQTtcblxuICAgICAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaXNBID0gVmFsaWRhdG9yLmdldFZhbGlkYXRvcihcImlzQVwiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpdChcIml0IHNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgcGFyYW0gaXMgbm90IHRoZSBjb3JyZWN0IHR5cGVcIixcbiAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBpc0EoXCJudW1iZXJcIikoNCk7XG4gICAgICAgICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBpc0EoXCJzdHJpbmdcIikoXCJoZWxsb1wiKTtcbiAgICAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdyhcIlwiKTtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBpc0EoXCJudW1iZXJcIikoXCJoZWxsb1wiKTtcbiAgICAgICAgICAgICAgICAgICB9KS50b1Rocm93KFwiaGVsbG8gc2hvdWxkIGJlIGEgbnVtYmVyXCIpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaXQgKFwic2hvdWxkIGFsbG93IGZvciBtb2RlbCB0eXBlcyB0byBiZSBzZW50IGluXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSxcbiAgICAgICAgICAgICAgICAgICAgdCxcbiAgICAgICAgICAgICAgICAgICAgVGhpbmc7XG5cbiAgICAgICAgICAgICAgICBUaGluZyA9IE1vZGVsKFwiVGhpbmdcIiwgZnVuY3Rpb24gKCkgeyB9KTtcblxuICAgICAgICAgICAgICAgIHQgPSBuZXcgVGhpbmcoKTtcblxuICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzQShcIlRoaW5nXCIpKDUpO1xuICAgICAgICAgICAgICAgIH0pLnRvVGhyb3coKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpc0EoXCJUaGluZ1wiKSh0KTtcbiAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHBhcmFtZXRlciBpcyBhIHN0cmluZyBhbmQgbm90XCIgKyBcbiAgICAgICAgICAgICAgIFwib25lIG9mIHRoZSBKUyBwcmVkZWZpbmVkIHR5cGVzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBpc0EoXCJubWJyXCIpO1xuICAgICAgICAgICAgICAgICAgIH0pLnRvVGhyb3coKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGRlc2NyaWJlKFwiaW50ZWdlciB2YWxpZGF0aW9uXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGl0KFwic2hvdWxkIG5vdCB0aHJvdyBhbiBlcnJvciB3aGVuIGFuIGludGVnZXIgaXMgYXNzaWduZWRcIixcbiAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQShcImludGVnZXJcIikoLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3Igb24gYSBub24taW50ZWdlclwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQShcImludGVnZXJcIikoLTEuMik7XG4gICAgICAgICAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiLTEuMiBzaG91bGQgYmUgYW4gaW50ZWdlclwiKSk7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0EoXCJpbnRlZ2VyXCIpKFwiZnJlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJmcmVkIHNob3VsZCBiZSBhbiBpbnRlZ2VyXCIpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZXNjcmliZShcIiNpc0FuXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGl0IChcInNob3VsZCBiZSBhbiBhbGlhcyBmb3IgaXNBXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNBID0gVmFsaWRhdG9yLmdldFZhbGlkYXRvcihcImlzQVwiKSxcbiAgICAgICAgICAgICAgICAgICAgaXNBbiA9IFZhbGlkYXRvci5nZXRWYWxpZGF0b3IoXCJpc0FuXCIpO1xuXG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQSkudG9FcXVhbChpc0FuKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIEVORCBCVUlMVC1JTiBWQUxJREFUT1IgVEVTVFMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xufSk7XG4iLCIvKmdsb2JhbCBkZXNjcmliZSwgaXQsIGJlZm9yZUVhY2gsIGV4cGVjdCwgeGl0LCBqYXNtaW5lICovXG5cbmRlc2NyaWJlKFwiZXZlbnQgZW1pdHRlclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgXG4gICAgdmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJy4uLy4uL3NyYy91dGlsL2V2ZW50X2VtaXR0ZXIuanMnKSxcbiAgICAgICAgZSxcbiAgICAgICAgbGlzdGVuZXIxLCBsaXN0ZW5lcjIsIGxpc3RlbmVyMztcblxuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgICAgIGxpc3RlbmVyMSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgICAgXG4gICAgICAgIGxpc3RlbmVyMiA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgICAgXG4gICAgICAgIGxpc3RlbmVyMyA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwiY29uc3RydWN0b3JcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwib24gbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoXCJzaG91bGQgcmVnaXN0ZXIgYSBjYWxsYmFjayBvbiBhbiBldmVudFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlLm9uKFwiZXZlbnRcIiwgZnVuY3Rpb24gKCkge30pO1xuICAgICAgICAgICAgZXhwZWN0KGUubGlzdGVuZXJzKFwiZXZlbnRcIikubGVuZ3RoKS50b0JlKDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGl0KFwic2hvdWxkIHJlZ2lzdGVyIG11bHRpcGxlIGNhbGxiYWNrcyBmb3IgYSBzaW5nbGUgZXZlbnRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZS5vbihcImV2ZW50XCIsIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgICAgICBlLm9uKFwiZXZlbnRcIiwgZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50XCIpLmxlbmd0aCkudG9CZSgyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBpdChcInNob3VsZCByZWdpc3RlciBjYWxsYmFja3MgZm9yIG11bHRpcGxlIGV2ZW50c1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlLm9uKFwiZXZlbnQxXCIsIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgICAgICBlLm9uKFwiZXZlbnQyXCIsIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgICAgICBleHBlY3QoZS5saXN0ZW5lcnMoXCJldmVudDFcIikubGVuZ3RoKS50b0JlKDEpO1xuICAgICAgICAgICAgZXhwZWN0KGUubGlzdGVuZXJzKFwiZXZlbnQyXCIpLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmV0dXJuIGFuIGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBzbyB0aGUgY2FsbCBjYW4gYmUgY2hhaW5lZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QoZS5vbihcImV2ZW50XCIsIGZ1bmN0aW9uICgpIHt9KSBpbnN0YW5jZW9mIEV2ZW50RW1pdHRlcikudG9CZVRydXRoeSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCByZWdpc3RlciBjYWxsYmFja3MgdG8gYmUgcmVnaXN0ZXJlZCBpbiBhIGNoYWluXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGUub24oXCJldmVudDFcIiwgZnVuY3Rpb24gKCkgeyB9KVxuICAgICAgICAgICAgICAgIC5vbihcImV2ZW50MlwiLCBmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICAgICAgZXhwZWN0KGUubGlzdGVuZXJzKFwiZXZlbnQxXCIpLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50MlwiKS5sZW5ndGgpLnRvQmUoMSk7ICAgICAgICAgICBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmVnaXN0ZXIgbXVsdGlwbGUgY2FsbGJhY2tzIGZvciBhIHNpbmdsZSBldmVudCBpbiBhIGNoYWluXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGUub24oXCJldmVudFwiLCBmdW5jdGlvbiAoKSB7IH0pXG4gICAgICAgICAgICAgICAgLm9uKFwiZXZlbnRcIiwgZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50XCIpLmxlbmd0aCkudG9CZSgyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGUub24oMSwgZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3cobmV3IEVycm9yKFwiRXZlbnRFbWl0dGVyOiBmaXJzdCBhcmd1bWVudCB0byAnb24nIHNob3VsZCBiZSBhIHN0cmluZ1wiKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGxpc3RlbmVyIGlzIG5vdCBhIGZ1bmN0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZS5vbihcImV2ZW50XCIsIDEpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhuZXcgRXJyb3IoXCJFdmVudEVtaXR0ZXI6IHNlY29uZCBhcmd1bWVudCB0byAnb24nIHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcImFkZExpc3RlbmVyIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KFwic2hvdWxkIGJlIGFuIGFsaWFzIGZvciB0aGUgJ29uJyBtZXRob2RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGUuYWRkTGlzdGVuZXIpLnRvQmUoZS5vbik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJvbmNlIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwicmVtb3ZlTGlzdGVuZXIgbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGZpcnN0IHBhcmFtZXRlciBpcyBub3QgYSBzdHJpbmdcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlLnJlbW92ZUxpc3RlbmVyKDUpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhcIkV2ZW50RW1pdHRlcjogZmlyc3QgcGFyYW1ldGVyIHRvIHJlbW92ZUxpc3RlbmVyIG1ldGhvZCBtdXN0IGJlIGEgc3RyaW5nIHJlcHJlc2VudGluZyBhbiBldmVudFwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHNlY29uZCBwYXJhbWV0ZXIgaXMgbm90IGEgZnVuY3Rpb25cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlLnJlbW92ZUxpc3RlbmVyKFwiZXZlbnQxXCIsIDUpO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhcIkV2ZW50RW1pdHRlcjogc2Vjb25kIHBhcmFtZXRlciBtdXN0IGJlIGEgZnVuY3Rpb24gdG8gcmVtb3ZlIGFzIGFuIGV2ZW50IGxpc3RlbmVyXCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGVyZSBhcmUgbm8gbGlzdGVuZXJzIGZvciB0aGF0IHBhcnRpY3VsYXIgZXZlbnRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlLnJlbW92ZUxpc3RlbmVyKFwid2hhdGV2ZXJcIiwgZnVuY3Rpb24gKCkge30pO1xuICAgICAgICAgICAgfSkudG9UaHJvdyhcIkV2ZW50RW1pdHRlcjogdGhlcmUgYXJlIG5vIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciB0aGUgJ3doYXRldmVyJyBldmVudFwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZSBldmVudFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlLm9uKFwiZXZlbnRcIiwgbGlzdGVuZXIxKTtcbiAgICAgICAgICAgIGUub24oXCJldmVudFwiLCBsaXN0ZW5lcjIpO1xuICAgICAgICAgICAgZS5vbihcImV2ZW50XCIsIGxpc3RlbmVyMyk7XG4gICAgICAgICAgICBleHBlY3QoZS5saXN0ZW5lcnMoXCJldmVudFwiKS5sZW5ndGgpLnRvQmUoMyk7XG4gICAgICAgICAgICBlLnJlbW92ZUxpc3RlbmVyKFwiZXZlbnRcIiwgbGlzdGVuZXIyKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50XCIpLmxlbmd0aCkudG9CZSgyKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50XCIpLmluZGV4T2YobGlzdGVuZXIyKSkudG9CZSgtMSk7XG4gICAgICAgICAgICBlLnJlbW92ZUxpc3RlbmVyKFwiZXZlbnRcIiwgbGlzdGVuZXIxKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50XCIpLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50XCIpLmluZGV4T2YobGlzdGVuZXIxKSkudG9CZSgtMSk7XG4gICAgICAgICAgICBlLnJlbW92ZUxpc3RlbmVyKFwiZXZlbnRcIiwgbGlzdGVuZXIzKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50XCIpLmxlbmd0aCkudG9CZSgwKTtcbiAgICAgICAgICAgIGV4cGVjdChlLmxpc3RlbmVycyhcImV2ZW50XCIpLmluZGV4T2YobGlzdGVuZXIzKSkudG9CZSgtMSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIGRlc2NyaWJlKFwicmVtb3ZlQWxsTGlzdGVuZXJzIG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBwYXJhbWV0ZXIgaXMgbm90IGEgc3RyaW5nXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZS5yZW1vdmVBbGxMaXN0ZW5lcnMoNSk7XG4gICAgICAgICAgICB9KS50b1Rocm93KFwiRXZlbnRFbWl0dGVyOiBwYXJhbWV0ZXIgdG8gcmVtb3ZlQWxsTGlzdGVuZXJzIHNob3VsZCBiZSBhIHN0cmluZyByZXByZXNlbnRpbmcgYW4gZXZlbnRcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgb2JqZWN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGUub24oXCJldmVudFwiLCBsaXN0ZW5lcjEpO1xuICAgICAgICAgICAgZS5vbihcImV2ZW50XCIsIGxpc3RlbmVyMik7XG4gICAgICAgICAgICBlLm9uKFwiZXZlbnRcIiwgbGlzdGVuZXIzKTtcbiAgICAgICAgICAgIGUucmVtb3ZlQWxsTGlzdGVuZXJzKFwiZXZlbnRcIik7XG4gICAgICAgICAgICBleHBlY3QoZS5saXN0ZW5lcnMoXCJldmVudFwiKS5sZW5ndGgpLnRvQmUoMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJzZXRNYXhMaXN0ZW5lcnMgbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcblxuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJsaXN0ZW5lcnMgbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoXCJzaG91bGQgcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZm9yIGEgZ2l2ZW4gZXZlbnRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxpc3RlbmVyMSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lcjIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBlLm9uKFwiZXZlbnRcIiwgbGlzdGVuZXIxKS5vbihcImV2ZW50XCIsIGxpc3RlbmVyMik7XG4gICAgICAgICAgICBleHBlY3QoZS5saXN0ZW5lcnMoXCJldmVudFwiKS5sZW5ndGgpLnRvQmUoMik7XG4gICAgICAgICAgICBleHBlY3QoZS5saXN0ZW5lcnMoXCJldmVudFwiKSkudG9FcXVhbChbbGlzdGVuZXIxLCBsaXN0ZW5lcjJdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIG1ldGhvZCBpcyBjYWxsZWQgd2l0aG91dCBhIHN0cmluZ1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkgeyBlLmxpc3RlbmVycygpOyB9KS50b1Rocm93KG5ldyBFcnJvcihcIkV2ZW50RW1pdHRlcjogbGlzdGVuZXJzIG1ldGhvZCBtdXN0IGJlIGNhbGxlZCB3aXRoIHRoZSBuYW1lIG9mIGFuIGV2ZW50XCIpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcIm9uY2UgbWV0aG9kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0dWJBO1xuXG4gICAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3R1YkEgPSBqYXNtaW5lLmNyZWF0ZVNweShcInN0dWJBXCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcInNob3VsZCBjYWxsIHRoZSBsaXN0ZW5lciB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGUub24oXCJldmVudDFcIiwgc3R1YkEpO1xuICAgICAgICAgICAgZS5lbWl0KFwiZXZlbnQxXCIpO1xuICAgICAgICAgICAgZXhwZWN0KHN0dWJBKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwic2hvdWxkIHJlbW92ZSB0aGUgbGlzdGVuZXIgYWZ0ZXIgdGhlIGV2ZW50IGlzIGNhbGxlZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlLm9uY2UoXCJldmVudDFcIiwgc3R1YkEpO1xuICAgICAgICAgICAgZS5lbWl0KFwiZXZlbnQxXCIpO1xuICAgICAgICAgICAgZXhwZWN0KHN0dWJBKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICAgICAgICBleHBlY3QoZS5saXN0ZW5lcnMoXCJldmVudDFcIikubGVuZ3RoKS50b0JlKDApO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJlbWl0IG1ldGhvZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdHViQTtcbiAgICAgICAgdmFyIHN0dWJCO1xuICAgICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0dWJBID0gamFzbWluZS5jcmVhdGVTcHkoXCJzdHViQVwiKTtcbiAgICAgICAgICAgIHN0dWJCID0gamFzbWluZS5jcmVhdGVTcHkoXCJzdHViQlwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmVzcG9uZCB3aXRoIGEgY29ycmVjdCBsaXN0ZW5lciBhbmQgZGF0YSB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZS5vbihcImV2ZW50MVwiLCBzdHViQSk7XG4gICAgICAgICAgICBlLmVtaXQoXCJldmVudDFcIik7XG4gICAgICAgICAgICBleHBlY3Qoc3R1YkEpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgIGUuZW1pdChcImV2ZW50MVwiLDUpO1xuICAgICAgICAgICAgZXhwZWN0KHN0dWJBKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCg1KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgbm90IHJlc3BvbmQgd2l0aCBpbmNvcnJlY3QgbGlzdGVuZXIgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGUub24oXCJldmVudDFcIiwgc3R1YkEpO1xuICAgICAgICAgICAgZS5vbihcImV2ZW50MlwiLCBzdHViQik7XG4gICAgICAgICAgICBlLmVtaXQoXCJldmVudDFcIik7XG4gICAgICAgICAgICBleHBlY3Qoc3R1YkEpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChzdHViQikubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgcmVzcG9uZCB3aXRoIGFsbCBsaXN0ZW5lcnMgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGUub24oXCJldmVudDFcIiwgc3R1YkEpO1xuICAgICAgICAgICAgZS5vbihcImV2ZW50MVwiLCBzdHViQik7XG4gICAgICAgICAgICBlLmVtaXQoXCJldmVudDFcIiwgNSk7XG4gICAgICAgICAgICBleHBlY3Qoc3R1YkEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDUpO1xuICAgICAgICAgICAgZXhwZWN0KHN0dWJCKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCg1KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJzaG91bGQgYmUgYWJsZSB0byBjYWxsIGxpc3RlbmVycyB3aXRoIG11bHRpcGxlIHBhcmFtZXRlcnNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZS5vbihcImV2ZW50MVwiLCBzdHViQSk7XG4gICAgICAgICAgICBlLmVtaXQoXCJldmVudDFcIiwgNSwgXCJoZWxsb1wiLCAxMCk7XG4gICAgICAgICAgICBleHBlY3Qoc3R1YkEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDUsIFwiaGVsbG9cIiwgMTApO1xuICAgICAgICB9KTtcblxuICAgICAgICB4aXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGZpcnN0IHBhcmFtZXRlciBpcyBub3QgYSBzdHJpbmdcIiwgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59KTtcbiIsIi8qZ2xvYmFsIGRlc2NyaWJlLCBpdCwgYmVmb3JlRWFjaCwgZXhwZWN0LCB4aXQsIGphc21pbmUgKi9cblxuaWYgKHR5cGVvZih3aW5kb3cpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gY3JlYXRlIG1vY2sgd2luZG93IG9iamVjdCBmb3IgcnVubmluZyB0ZXN0cyBvdXRzaWRlIG9mIGEgYnJvd3NlclxuICAgIHdpbmRvdyA9IHt9O1xufVxuXG5kZXNjcmliZShcIm5hbWVzcGFjZSB1dGlsaXR5XCIsIGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBuYW1lc3BhY2UgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbC9uYW1lc3BhY2UuanMnKTtcblxuICAgIGl0KFwic2hvdWxkIHRocm93IGFuIGVycm9yIG9uIGEgbWFsZm9ybWVkIG5hbWVzcGFjZSBzdHJpbmdcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmFtZXNwYWNlKFwibm90O2E7bmFtZXNwYWNlXCIsIGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgfSkudG9UaHJvdyhcIm5hbWVzcGFjZTogbm90O2E7bmFtZXNwYWNlIGlzIGEgbWFsZm9ybWVkIG5hbWVzcGFjZSBzdHJpbmdcIik7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZShcIndpbmRvdy50aGlzLmlzLmEubmFtZXNwYWNlXCIsIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZShcImFsaWFzZXMudGVzdE9uZVwiLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZShcIndpbmRvd1wiLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgIH0pLnRvVGhyb3coXCJuYW1lc3BhY2U6IHdpbmRvdyBpcyBhIG1hbGZvcm1lZCBuYW1lc3BhY2Ugc3RyaW5nXCIpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGxhc3QgcGFyYW1ldGVyIGV4aXN0cyBhbmQgaXMgbm90IGEgZnVuY3Rpb25cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmFtZXNwYWNlKFwidGhpcy5pcy5hLnRlc3RcIiwgXCJuYW1lc3BhY2VcIik7XG4gICAgICAgIH0pLnRvVGhyb3coXCJuYW1lc3BhY2U6IHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGFuIG9iamVjdCBvZiBhbGlhc2VkIGxvY2FsIG5hbWVzcGFjZXNcIik7XG5cbiAgICAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZShcInRoaXMuaXMuYS50ZXN0XCIsIHt9LCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgfSk7XG5cbiAgICBpdChcInNob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgc2Vjb25kIGFyZ3VtZW50IGV4aXN0cywgYW5kIGEgdGhpcmQgZnVuY3Rpb24gYXJndW1lbnQgZG9lcyBub3QgZXhpc3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmFtZXNwYWNlKFwidGhpcy5pcy5hLnRlc3RcIiwge30pO1xuICAgICAgICB9KS50b1Rocm93KFwibmFtZXNwYWNlOiBpZiBzZWNvbmQgYXJndW1lbnQgZXhpc3RzLCBmaW5hbCBmdW5jdGlvbiBhcmd1bWVudCBtdXN0IGV4aXN0XCIpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHNlY29uZCBwYXJhbWV0ZXIgZXhpc3RzIGFuZCBpcyBub3QgYW4gb2JqZWN0IHdoZW4gdGhlIGxhc3QgcGFyYW1ldGVyIGlzIGEgZnVuY3Rpb25cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmFtZXNwYWNlKFwidGhpcy5pcy5hLnRlc3RcIiwgXCJzdHJpbmdcIiwgZnVuY3Rpb24gKCkge30pO1xuICAgICAgICB9KS50b1Rocm93KFwibmFtZXNwYWNlOiBzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3Qgb2YgYWxpYXNlZCBsb2NhbCBuYW1lc3BhY2VzXCIpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJzaG91bGQgY3JlYXRlIHRoZSBhcHByb3ByaWF0ZSBuYW1lc3BhY2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbnMgPSBuYW1lc3BhY2UoXCJ3aW5kb3cudGVzdFwiLCBmdW5jdGlvbiAoZXhwb3J0cykge1xuICAgICAgICAgICAgZXhwb3J0cy5tZXNzYWdlID0gXCJ0aGlzIGlzIGEgbWVzc2FnZSBpbiB0aGUgbmFtZXNwYWNlXCI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cGVjdCh3aW5kb3cudGVzdCkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHdpbmRvdy50ZXN0Lm1lc3NhZ2UpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdCh3aW5kb3cudGVzdC5tZXNzYWdlKS50b0JlKFwidGhpcyBpcyBhIG1lc3NhZ2UgaW4gdGhlIG5hbWVzcGFjZVwiKTtcbiAgICB9KTtcblxuICAgIGl0KFwic2hvdWxkIG5vdCB0aHJvdyBhbiBlcnJvciBvbiBhIHNpbmdsZSBhcmd1bWVudFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBucyA9IG5hbWVzcGFjZShcInRoaXMuaXMuYS50ZXN0XCIpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJzaG91bGQgYWRkIHRoZSBuYW1lc3BhY2UgdG8gdGhlIHdpbmRvdyBpZiBpdCBpcyBub3QgZXhwbGljaXRseSB0aGUgZmlyc3QgcGFydCBvZiB0aGUgbmFtZXNwYWNlIHN0cmluZ1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBucyA9IG5hbWVzcGFjZShcIm5ld05hbWVTcGFjZVwiLCBmdW5jdGlvbiAoZXhwb3J0cykge1xuICAgICAgICAgICAgZXhwb3J0cy5tZXNzYWdlID0gXCJhbm90aGVyIHRlc3QgbmFtZXNwYWNlXCI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cGVjdCh3aW5kb3cubmV3TmFtZVNwYWNlKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICBleHBlY3Qod2luZG93Lm5ld05hbWVTcGFjZS5tZXNzYWdlKS50b0JlKFwiYW5vdGhlciB0ZXN0IG5hbWVzcGFjZVwiKTtcbiAgICAgICAgZXhwZWN0KG5zKS50b0JlKHdpbmRvdy5uZXdOYW1lU3BhY2UpO1xuICAgICAgICBleHBlY3QobnMubWVzc2FnZSkudG9CZShcImFub3RoZXIgdGVzdCBuYW1lc3BhY2VcIik7XG4gICAgfSk7XG5cbiAgICBpdChcInNob3VsZCBub3Qgb3ZlcndyaXRlIGFuIGV4aXN0aW5nIG5hbWVzcGFjZSBvbiBtdWx0aXBsZSBjYWxsc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuczEsIG5zMjtcbiAgICAgICAgbnMxID0gbmFtZXNwYWNlKFwidGVzdFwiLCBmdW5jdGlvbiAoZXhwb3J0cykge1xuICAgICAgICAgICAgZXhwb3J0cy5UZXN0MSA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgZXhwb3J0cy5tZXNzYWdlMSA9IFwiaGVsbG8gd29ybGQhXCI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG5zMiA9IG5hbWVzcGFjZShcInRlc3RcIiwgZnVuY3Rpb24gKGV4cG9ydHMpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuVGVzdDIgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgIGV4cG9ydHMubWVzc2FnZTIgPSBcImdyZWV0aW5ncyBwbGFuZXQhXCI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cGVjdCh3aW5kb3cudGVzdC5UZXN0MSkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHdpbmRvdy50ZXN0LlRlc3QyKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICBleHBlY3Qod2luZG93LnRlc3QubWVzc2FnZTEpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdCh3aW5kb3cudGVzdC5tZXNzYWdlMikubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KFwic2hvdWxkIG1ha2UgdGhlIGFsaWFzZXMgYWNjZXNzaWJsZSBpbiB0aGUgbmFtZXNwYWNlIGZ1bmN0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5zMSwgbnMyLCBuczMsIG5zRnVuY3Rpb247XG4gICAgICAgIG5zRnVuY3Rpb24gPSBmdW5jdGlvbiAobnMpIHtcbiAgICAgICAgICAgIHZhciB0ID0gbmV3IHRoaXMuVGhpbmcoKTtcblxuICAgICAgICAgICAgZXhwZWN0KHRoaXMubnMxKS50b0JlKG5hbWVzcGFjZShcImFsaWFzZXMudGVzdE9uZVwiKSk7XG4gICAgICAgICAgICBleHBlY3QodGhpcy5uczIpLnRvQmUobmFtZXNwYWNlKFwiYWxpYXNlcy50ZXN0VHdvXCIpKTtcbiAgICAgICAgICAgIGV4cGVjdCh0aGlzLm5zMi5UaGluZykubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdCh0aGlzLlRoaW5nKS5ub3QudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHQpLm5vdC50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICBucy50aGluZyA9IHRoaXMubnMyLlRoaW5nO1xuICAgICAgICAgICAgbnMud2hhdGV2ZXIgPSBcImhlbGxvIHdvcmxkXCI7XG4gICAgICAgIH07XG5cbiAgICAgICAgbnMxID0gbmFtZXNwYWNlKFwiYWxpYXNlcy50ZXN0T25lXCIpO1xuICAgICAgICBuczIgPSBuYW1lc3BhY2UoXCJhbGlhc2VzLnRlc3RUd29cIiwgZnVuY3Rpb24gKGV4cG9ydHMpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuVGhpbmcgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbnMzID0gbmFtZXNwYWNlKFwiYWxpYXNlcy50ZXN0VGhyZWVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbnMxOiBcImFsaWFzZXMudGVzdE9uZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuczI6IFwiYWxpYXNlcy50ZXN0VHdvXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFRoaW5nOiBcImFsaWFzZXMudGVzdFR3by5UaGluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbnNGdW5jdGlvbik7XG5cbiAgICAgICAgZXhwZWN0KG5zMy53aGF0ZXZlcikubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KG5zMy50aGluZykubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KG5zMy50aGluZykudG9CZShuczIuVGhpbmcpO1xuICAgIH0pO1xufSk7XG4iLCIvKipcbiAqIEF0dHJcbiAqIFxuICogQ3JlYXRlcyBhbiBlbmNhcHN1bGF0ZWQsIGNoYWluYWJsZSBhdHRyaWJ1dGUgdGhhdCBhcmUgdmFsaWRhdGVkIGJ5IFxuICogdXNlci1zcGVjaWZpZWQgdmFsaWRhdGlvbiBmdW5jdGlvbnMgYW5kIGNhbiBiZSBhdHRhY2hlZCB0byBhbiBhcmJpdHJhcnlcbiAqIEphdmFTY3JpcHQgb2JqZWN0LiBUaGV5IGNhbiBhbHNvIGNhbGwgdXNlci1zcGVjaWZpZWQgbGlzdGVuZXJzIHVwb24gYmVpbmdcbiAqIGFjY2Vzc2VkIG9yIGNoYW5nZWQuXG4gKlxuICogSmVybWFpbmUgbW9kZWxzIGhvbGQgYW5kIG1hbmlwdWxhdGUgQXR0ciAoYW5kIEF0dHJMaXN0KSBvYmplY3RzIHVudGlsIHRoZXlcbiAqIGFyZSBhdHRhY2hlZCB0byBhbiBvYmplY3QuXG4gKi9cblxuLyohXG4gKlxuICogTm90ZXMgYW5kIFRvRG9zOlxuICogKyB3aGF0IGFib3V0IGlzTm90R3JlYXRlclRoYW4oKT8sIGlzTm90TGVzc1RoYW4oKT8gIE9yLCBiZXR0ZXIgc3RpbGw6IGFcbiAqICAgZ2VuZXJhbCAnbm90JyBvcGVyYXRvciwgYXMgaW4gamFzbWluZT9cbiAqXG4gKiArIEF0dHIgc2hvdWxkIGJlIGRlY291cGxlZCBmcm9tIEF0dHJMaXN0LCBzZWUgdGhlIGNsb25lKCkgbWV0aG9kXG4gKlxuICogKyBTZWUgaXNzdWUgMjQgb24gZ2l0aHViXG4gKi9cblwidXNlIHN0cmljdFwiO1xuIFxudmFyIEF0dHIgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBBdHRyTGlzdCA9IHJlcXVpcmUoJy4vYXR0cl9saXN0LmpzJyksXG4gICAgICAgIFZhbGlkYXRvciA9IHJlcXVpcmUoJy4vdmFsaWRhdG9yLmpzJyk7XG5cbiAgICB2YXIgdmFsaWRhdG9ycyA9IFtdLFxuICAgICAgICB0aGF0ID0gdGhpcyxcbiAgICAgICAgZXJyb3JNZXNzYWdlID0gXCJpbnZhbGlkIHNldHRlciBjYWxsIGZvciBcIiArIG5hbWUsXG4gICAgICAgIGRlZmF1bHRWYWx1ZU9yRnVuY3Rpb24sXG4gICAgICAgIGksXG4gICAgICAgIHByb3AsXG4gICAgICAgIGFkZFZhbGlkYXRvcixcbiAgICAgICAgaW1tdXRhYmxlID0gZmFsc2UsXG4gICAgICAgIHZhbGlkYXRvcixcbiAgICAgICAgbGlzdGVuZXJzID0ge307XG5cbiAgICAvLyBjaGVjayBmb3IgZXJyb3JzIHdpdGggY29uc3RydWN0b3IgcGFyYW1ldGVyc1xuICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQgfHwgdHlwZW9mKG5hbWUpICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyOiBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIG5hbWUgcGFyYW1ldGVyIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwid2hpY2ggbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICB9XG5cbiAgICAvLyBzZXQgdXAgdGhlIHZhbGlkYXRvciB0aGF0IGNvbWJpbmVzIGFsbCB2YWxpZGF0b3JzXG4gICAgdmFsaWRhdG9yID0gZnVuY3Rpb24gKHRoaW5nQmVpbmdWYWxpZGF0ZWQpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHZhbGlkYXRvcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhbGlkYXRvcnNbaV0odGhpbmdCZWluZ1ZhbGlkYXRlZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIE1PRElGSUVSUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZSB0aGlzIGF0dHJpYnV0ZSB3aXRoIHRoZSBnaXZlbiB2YWxpZGF0b3IuIFRoaXMgYWxzbyBhbGxvd3NcbiAgICAgKiB0aGlzLm1lc3NhZ2UgdG8gYmUgb3ZlcnJpZGRlbiB0byBzcGVjaWZ5IHRoZSBlcnJvciBtZXNzYWdlIG9uXG4gICAgICogdmFsaWRhdGlvbiBmYWlsdXJlLlxuICAgICAqXG4gICAgICogRXhhbXBsZXM6XG4gICAgICpcbiAgICAgKiAgICAgYWdlLnZhbGlkYXRlc1dpdGgoZnVuY3Rpb24gKGFnZSkge1xuICAgICAqICAgICAgICAgdGhpcy5tZXNzYWdlID0gXCJhZ2UgbXVzdCBiZSBiZXR3ZWVuIDE4IGFuZCA5OSwgXCIgKyBhZ2UgK1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgXCIgZmFpbHMuXCI7XG4gICAgICogICAgICAgICByZXR1cm4gYWdlID49IDE4ICYmIGFnZSA8PSA5OTtcbiAgICAgKiAgICAgfSk7XG4gICAgICpcbiAgICAgKiAgICAgbmFtZS52YWxpZGF0ZXNXaXRoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICogICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcIm5hbWUgbXVzdCBiZSBhIHN0cmluZyBhbmQgY29udGFpbiBhdCBsZWFzdFwiICtcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgIFwiIDMgbGV0dGVycywgXCIgKyBuYW1lICsgXCIgZmFpbHMuXCI7XG4gICAgICogICAgICAgICByZXR1cm4gdHlwZW9mKG5hbWUpID09PSBcInN0cmluZyAmJiBuYW1lLmxlbmd0aCA+PSAzO1xuICAgICAqICAgICB9KTtcbiAgICAgKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmV0dXJucyB0cnVlIGlmIHRoZSBhcmd1bWVudCBwYXNzZXMgdmFsaWRhdGlvbiBcbiAgICAgKi9cbiAgICB0aGlzLnZhbGlkYXRlc1dpdGggPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAodHlwZW9mKHYpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YWxpZGF0b3JzLnB1c2gobmV3IFZhbGlkYXRvcih2KSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dHI6IHZhbGlkYXRvciBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQXNzaWduIGEgZGVmYXVsdCB2YWx1ZSB0byBhbGwgYXR0cmlidXRlcyBvZiB0aGlzIHR5cGUuIFRoZSBkZWZhdWx0XG4gICAgICogdmFsdWUgbWF5IGJlIGFuIGV4cGxpY2l0IHZhbHVlIG9yIG9iamVjdCwgb3IgaXQgbWF5IGJlIGEgZnVuY3Rpb25cbiAgICAgKiB0aGF0IHJldHVybnMgYSBkZWZhdWx0IHZhbHVlLlxuICAgICAqXG4gICAgICogRXhhbXBsZXM6XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3ZhbHVlfSB0aGUgZXhwbGljaXQgZGVmYXVsdCB2YWx1ZSwgb3IgYSBmdW5jdGlvbiB0aGF0XG4gICAgICogICAgICAgICAgICAgICAgcmV0dXJucyB0aGUgZGVmYXVsdCB2YWx1ZVxuICAgICAqL1xuICAgIHRoaXMuZGVmYXVsdHNUbyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBkZWZhdWx0VmFsdWVPckZ1bmN0aW9uID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRoaXMgYXR0cmlidXRlIHJlYWQtb25seS4gSWYgYSBzZXR0ZXIgaXMgY2FsbGVkIG9uIHRoaXNcbiAgICAgKiBhdHRyaWJ1dGUsIGl0IHdpbGwgdGhyb3cgYW4gZXJyb3JcbiAgICAgKlxuICAgICAqIEV4YW1wbGVzOlxuICAgICAqL1xuICAgIHRoaXMuaXNSZWFkT25seSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaW1tdXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1ha2UgdGhpcyBhdHRyaWJ1dGUgd3JpdGFibGUuIE5vdGUgdGhhdCB0aGlzIGlzIHRoZSBkZWZhdWx0IGZvciBhbGwgXG4gICAgICogYXR0cmlidXRlcywgYnV0IHRoaXMgbWF5IGJlIGNhbGxlZCBpZiBhbiBhdHRyaWJ1dGUgaGFzIGJlZW4gc2V0IHRvXG4gICAgICogcmVhZCBvbmx5IGFuZCB0aGVuIG5lZWRzIHRvIGJlIGNoYW5nZWQgYmFja1xuICAgICAqXG4gICAgICogRXhhbXBsZXM6XG4gICAgICovXG4gICAgdGhpcy5pc1dyaXRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpbW11dGFibGUgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldHMgdXAgYSBsaXN0ZW5lciBmb3IgJ3NldHMnIG9yICdnZXRzJyB0byB0aGlzIGF0dHJpYnV0ZS4gSXQgdGhyb3dzXG4gICAgICogYW4gZXJyb3IgaWYgdGhlIGV2ZW50IGlzIG5vdCBcInNldFwiIG9yIFwiZ2V0XCIsIGFuZCBpZiBhIHNldHRlciBpc1xuICAgICAqIGFscmVhZHkgc2V0IHVwIGZvciB0aGUgZXZlbnQsIGl0IG92ZXJyaWRlcyBpdC5cbiAgICAgKlxuICAgICAqIEV4YW1wbGVzOlxuICAgICAqXG4gICAgICogQHBhcmFtIHtldmVudH0gU3RyaW5nIHRoYXQgY2FuIG9ubHkgYmUgXCJzZXRcIiBvciBcImdldFwiXG4gICAgICogQHBhcmFtIHtsaXN0ZW5lcn0gRnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgb2NjdXJzXG4gICAgICovXG4gICAgdGhpcy5vbiA9IGZ1bmN0aW9uIChldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKGV2ZW50ICE9PSBcInNldFwiICYmIGV2ZW50ICE9PSBcImdldFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyOiBmaXJzdCBhcmd1bWVudCB0byB0aGUgJ29uJyBtZXRob2QgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic2hvdWxkIGJlICdzZXQnIG9yICdnZXQnXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZihsaXN0ZW5lcikgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0cjogc2Vjb25kIGFyZ3VtZW50IHRvIHRoZSAnb24nIG1ldGhvZCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzaG91bGQgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpc3RlbmVyc1tldmVudF0gPSBsaXN0ZW5lcjtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gRU5EIE1PRElGSUVSUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBHRVRURVJTIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5hbWUgb2YgdGhpcyBhdHRyaWJ1dGVcbiAgICAgKi9cbiAgICB0aGlzLm5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBjb21iaW5lcyBhbGwgb2YgdGhlIHZhbGlkYXRvcnMgaW50b1xuICAgICAqIGEgc2luZ2xlIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0cnVlIG9yIGZhbHNlLlxuICAgICAqL1xuICAgIHRoaXMudmFsaWRhdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdmFsaWRhdG9yO1xuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBFTkQgR0VUVEVSUyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBTWU5UQUNUSUMgU1VHQVIgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIC8qKlxuICAgICAqIEFuIGFsaWFzIGZvciB0aGlzIG9iamVjdCwgZm9yIHJlYWRhYmlsaXR5IHdoZW4gY2FsbGluZyBtdWx0aXBsZVxuICAgICAqIG1vZGlmaWVyc1xuICAgICAqXG4gICAgICogRXhhbXBsZXM6XG4gICAgICovXG4gICAgdGhpcy5hbmQgPSB0aGlzO1xuXG4gICAgLyoqXG4gICAgICogQW4gYWxpYXMgZm9yIHRoaXMgb2JqZWN0LCBmb3IgcmVhZGFiaWxpdHkuXG4gICAgICpcbiAgICAgKiBFeGFtcGxlczpcbiAgICAgKi9cbiAgICB0aGlzLndoaWNoID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIEFuIGFsaWFzIGZvciBpc1JlYWRPbmx5XG4gICAgICovXG4gICAgdGhpcy5pc0ltbXV0YWJsZSA9IHRoaXMuaXNSZWFkT25seTtcblxuICAgIC8qKlxuICAgICAqIEFuIGFsaWFzIGZvciBpc1dyaXRhYmxlXG4gICAgICovXG4gICAgdGhpcy5pc011dGFibGUgPSB0aGlzLmlzV3JpdGFibGU7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBFTkQgU1lOVEFDVElDIFNVR0FSIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBVVElMSVRJRVMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXR0cmlidXRlIHdpdGggdGhlIHNhbWUgbW9kaWZpZXJzLCBkZWZhdWx0VmFsdWUsIGFuZFxuICAgICAqIHZhbGlkYXRvcnMuIFRoaXMgaXMgdXNlZCBpbiBKZXJtYWluZSdzIGFwcHJvYWNoIHRvIGluaGVyaXRhbmNlLlxuICAgICAqXG4gICAgICogRXhhbXBsZXM6XG4gICAgICovXG4gICAgdGhpcy5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJlc3VsdCxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgLy8gc2V0IHRoZSByZXN1bHQgdG8gdGhlIGRlZmF1bHQgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBsaXN0XG4gICAgICAgIC8vIFRPRE86IGZpZ3VyZSBvdXQgaG93IHRvIG1ha2UgdGhpcyB3b3JrIHdpdGhvdXQgZXhwbGljaXRseVxuICAgICAgICAvLyAgICAgICBrbm93aW5nIGFib3V0IEF0dHJMaXN0IHNvIGl0IGNhbiBiZSBkZWNvdXBsZWQgZnJvbSB0aGlzXG4gICAgICAgIC8vICAgICAgIGNvZGVcbiAgICAgICAgcmVzdWx0ID0gdGhpcyBpbnN0YW5jZW9mIEF0dHJMaXN0P25ldyBBdHRyTGlzdChuYW1lKTpuZXcgQXR0cihuYW1lKTtcblxuICAgICAgICAvLyBhZGQgdGhpcyBhdHRyaWJ1dGVzIHZhbGlkYXRvcnMgdG8gdGhlIG5ldyBhdHRyaWJ1dGVcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHZhbGlkYXRvcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHJlc3VsdC52YWxpZGF0ZXNXaXRoKHZhbGlkYXRvcnNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2V0IHVwIHRoZSBzYW1lIGRlZmF1bHQgZm9yIHRoZSBuZXcgYXR0cmlidXRlXG4gICAgICAgIHJlc3VsdC5kZWZhdWx0c1RvKGRlZmF1bHRWYWx1ZU9yRnVuY3Rpb24pO1xuXG4gICAgICAgIC8vIGlmIHRoZSB0aGlzIGF0dHIgaXMgaW1tdXRhYmxlLCB0aGUgY2xvbmVkIGF0dHIgc2hvdWxkIGFsc28gYmVcbiAgICAgICAgLy8gaW1tdXRhYmxlXG4gICAgICAgIGlmIChpbW11dGFibGUpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pc0ltbXV0YWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBhdHRhY2hlcyB0aGUgYXR0cmlidXRlIHRvIGEgY29uY3JldGUgb2JqZWN0LiBJdCBhZGRzIHRoZVxuICAgICAqIGdldHRlci9zZXR0ZXIgZnVuY3Rpb24gdG8gdGhlIG9iamVjdCwgYW5kIGNhcHR1cmVzIHRoZSBhY3R1YWxcbiAgICAgKiB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlIGluIGEgY2xvc3VyZS5cbiAgICAgKlxuICAgICAqIFRoZSByZXN1bHRpbmcgZ2V0dGVyL3NldHRlciBjYWxscyBhbGwgdmFsaWRhdG9ycyBvbiB0aGUgcGFyYW1ldGVyXG4gICAgICogYW5kIGNhbGxzIHRoZSBhcHByb3ByaWF0ZSBsaXN0ZW5lciBvbiB0aGlzIGF0dHJpYnV0ZS4gSXQgYWxzb1xuICAgICAqIHJldHVybnMgdGhlIG9iamVjdCBpdHNlbGYgc28gdGhhdCBhdHRyaWJ1dGUgc2V0dGVycyBjYW4gYmUgY2hhaW5lZC5cbiAgICAgKlxuICAgICAqIEV4YW1wbGVzOlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmp9IHRoZSBvYmplY3QgdG8gd2hpY2ggdGhpcyBhdHRyaWJ1dGUgd2lsbCBiZSBhdHRhY2hlZFxuICAgICAqL1xuICAgIHRoaXMuYWRkVG8gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBhdHRyaWJ1dGUsXG4gICAgICAgICAgICBsaXN0ZW5lcixcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTtcblxuICAgICAgICBpZiAoIW9iaiB8fCB0eXBlb2Yob2JqKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dHI6IGFkZEF0dHIgbWV0aG9kIHJlcXVpcmVzIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwYXJhbWV0ZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBhdHRyaWJ1dGUgZ2V0dGVyL3NldHRlciBtZXRob2QgdGhhdCBnZXRzIGFkZGRlZCB0b1xuICAgICAgICAvLyB0aGUgb2JqZWN0XG4gICAgICAgIG9ialtuYW1lXSA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdmFyIHByZVZhbHVlO1xuXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8vIHNldHRlclxuICAgICAgICAgICAgICAgIGlmIChpbW11dGFibGUgJiYgYXR0cmlidXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IHNldCB0aGUgaW1tdXRhYmxlIHByb3BlcnR5IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgKyBcIiBhZnRlciBpdCBoYXMgYmVlbiBzZXRcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdmFsaWRhdG9yKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIG9sZFZhbHVlXG4gICAgICAgICAgICAgICAgICAgIHByZVZhbHVlID0gYXR0cmlidXRlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpcnN0IHNldCB0aGUgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsbCB0aGUgc2V0IGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMuc2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zZXQuY2FsbChvYmosIG5ld1ZhbHVlLCBwcmVWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCB0aGUgZ2V0IGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5nZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuZ2V0LmNhbGwob2JqLCBhdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXR0cmlidXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG5cbiAgICAgICAgLy8gYXNzaWduIHRoZSBkZWZhdWx0IHZhbHVlLCBkZXBlbmRzIG9uIHdoZXRoZXIgaXQgaXMgYSBmdW5jdGlvblxuICAgICAgICAvLyBvciBhbiBleHBsaWNpdCB2YWx1ZVxuICAgICAgICBkZWZhdWx0VmFsdWUgPSB0eXBlb2YoZGVmYXVsdFZhbHVlT3JGdW5jdGlvbikgPT09ICdmdW5jdGlvbic/XG4gICAgICAgICAgICBkZWZhdWx0VmFsdWVPckZ1bmN0aW9uKCk6XG4gICAgICAgICAgICBkZWZhdWx0VmFsdWVPckZ1bmN0aW9uO1xuXG4gICAgICAgIC8vIGNhbGwgdGhlIHNldHRlciB3aXRoIHRoZSBkZWZhdWx0VmFsdWUgdXBvbiBhdHRhY2hpbmcgaXQgdG8gdGhlXG4gICAgICAgIC8vIG9iamVjdFxuICAgICAgICBpZiAoZGVmYXVsdFZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsaWRhdG9yKGRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgICAgICAgIG9ialtuYW1lXShkZWZhdWx0VmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGRlZmF1bHRWYWx1ZSAhPT0gdW5kZWZpbmVkICYmICF2YWxpZGF0b3IoZGVmYXVsdFZhbHVlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0cjogRGVmYXVsdCB2YWx1ZSBvZiBcIiArIGRlZmF1bHRWYWx1ZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgZG9lcyBub3QgcGFzcyB2YWxpZGF0aW9uIGZvciBcIiArIG5hbWUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIEVORCBVVElMSVRJRVMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIFZBTElEQVRPUiBSRUxBVEVEIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgLy8gYWRkIGEgc2luZ2xlIHZhbGlkYXRvciBvYmplY3QgdG8gdGhlIGF0dHJpYnV0ZVxuICAgIGFkZFZhbGlkYXRvciA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHRoYXRbbmFtZV0gPSBmdW5jdGlvbiAocGFyYW0pIHtcbiAgICAgICAgICAgIHZhbGlkYXRvcnMucHVzaChWYWxpZGF0b3IuZ2V0VmFsaWRhdG9yKG5hbWUpKHBhcmFtKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhhdDtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gdGhlIFZhbGlkYXRvciBvYmplY3QgY29udGFpbnMgc2V2ZXJhbCBkZWZhdWx0IHZhbGlkYXRvcnNcbiAgICAvLyB0aGF0IG5lZWQgdG8gYmUgYXR0YWNoZWQgdG8gYWxsIEF0dHJzXG4gICAgZm9yIChpID0gMDsgaSA8IFZhbGlkYXRvci52YWxpZGF0b3JzKCkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgYWRkVmFsaWRhdG9yKFZhbGlkYXRvci52YWxpZGF0b3JzKClbaV0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIEVORCBWQUxJREFUT1IgUkVMQVRFRCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdHRyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBBdHRyID0gcmVxdWlyZSgnLi9hdHRyLmpzJyk7XG5cbnZhciBBdHRyTGlzdCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXMsXG4gICAgICAgIGxpc3RlbmVycyA9IHt9O1xuXG5cbiAgICAvL3RoaXMgaXMgd2hlcmUgdGhlIGluaGVyaXRhbmNlIGhhcHBlbnMgbm93XG4gICAgQXR0ci5jYWxsKHRoaXMsIG5hbWUpO1xuXG4gICAgdmFyIGRlbGVnYXRlID0gZnVuY3Rpb24gKG9iaiwgZnVuYykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gb2JqW2Z1bmNdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTsgfTtcbiAgICB9O1xuXG4gICAgLy9zeW50YWN0aWMgc3VnYXIgdG8ga2VlcCB0aGluZ3MgZ3JhbW1hdGljYWxseSBjb3JyZWN0XG4gICAgdGhpcy52YWxpZGF0ZVdpdGggPSB0aGlzLnZhbGlkYXRlc1dpdGg7XG5cbiAgICAvL2Rpc2FibGUgZGVmYXVsdHNUbyBhbmQgaXNJbW11dGFibGUgdW50aWwgd2UgZmlndXJlIG91dCBob3cgdG8gbWFrZSBpdCBtYWtlIHNlbnNlXG4gICAgdGhpcy5kZWZhdWx0c1RvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvL25vIG9wXG4gICAgfTtcblxuICAgIHRoaXMuaXNJbW11dGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vbm8gb3BcbiAgICB9O1xuXG4gICAgdGhpcy5pc011dGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vbm8gb3BcbiAgICB9O1xuXG4gICAgdGhpcy5lYWNoT2ZXaGljaCA9IHRoaXM7XG5cbiAgICB0aGlzLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoZXZlbnQgIT09IFwiYWRkXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dHJMaXN0OiAnb24nIG9ubHkgcmVzcG9uZHMgdG8gJ2FkZCcgZXZlbnRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mKGxpc3RlbmVyKSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyTGlzdDogJ29uJyByZXF1aXJlcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGlzdGVuZXJzW2V2ZW50XSA9IGxpc3RlbmVyO1xuICAgIH07XG5cblxuICAgIHRoaXMuYWRkVG8gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBwcm9wLFxuICAgICAgICAgICAgYXJyID0gW10sXG4gICAgICAgICAgICBhY3R1YWxMaXN0ID0ge307XG4gICAgICAgIGlmKCFvYmogfHwgdHlwZW9mKG9iaikgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRyTGlzdDogYWRkVG8gbWV0aG9kIHJlcXVpcmVzIGFuIG9iamVjdCBwYXJhbWV0ZXJcIik7ICAgICAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWN0dWFsTGlzdC5wb3AgPSBkZWxlZ2F0ZShhcnIsIFwicG9wXCIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBhY3R1YWxMaXN0LmFkZCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKCh0aGF0LnZhbGlkYXRvcigpKShpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICBhcnIucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5hZGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9saXN0ZW5lcnMuYWRkLmNhbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5hZGQuY2FsbChvYmosIGl0ZW0sIGFjdHVhbExpc3Quc2l6ZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpczsgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhhdC5lcnJvck1lc3NhZ2UoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYWN0dWFsTGlzdC5yZXBsYWNlID0gZnVuY3Rpb24gKGluZGV4LCBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAoKHR5cGVvZihpbmRleCkgIT09ICdudW1iZXInKSB8fCAocGFyc2VJbnQoaW5kZXgsIDEwKSAhPT0gaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dHJMaXN0OiByZXBsYWNlIG1ldGhvZCByZXF1aXJlcyBpbmRleCBwYXJhbWV0ZXIgdG8gYmUgYW4gaW50ZWdlclwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuc2l6ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dHJMaXN0OiByZXBsYWNlIG1ldGhvZCBpbmRleCBwYXJhbWV0ZXIgb3V0IG9mIGJvdW5kc1wiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoISh0aGF0LnZhbGlkYXRvcigpKShvYmopKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih0aGF0LmVycm9yTWVzc2FnZSgpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhcnJbaW5kZXhdID0gb2JqO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYWN0dWFsTGlzdC5hdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5zaXplKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ckxpc3Q6IEluZGV4IG91dCBvZiBib3VuZHNcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhcnJbaW5kZXhdO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy90byBrZWVwIHRoaW5ncyBtb3JlIGphdmEteVxuICAgICAgICAgICAgYWN0dWFsTGlzdC5nZXQgPSBhY3R1YWxMaXN0LmF0O1xuXG4gICAgICAgICAgICBhY3R1YWxMaXN0LnNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5sZW5ndGg7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBhY3R1YWxMaXN0LnRvSlNPTiA9IGZ1bmN0aW9uIChKU09OcmVwcykge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgXG4gICAgICAgICAgICAgICAgICAgIGksIGo7XG5cbiAgICAgICAgICAgICAgICAvL2NoZWNrIHRvIG1ha2Ugc3VyZSB0aGUgY3VycmVudCBsaXN0IGlzIG5vdCBpbiBKU09OcmVwc1xuICAgICAgICAgICAgICAgIGlmIChKU09OcmVwcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7aSA8IEpTT05yZXBzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoSlNPTnJlcHNbaV0ub2JqZWN0ID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gSlNPTnJlcHNbaV0uSlNPTnJlcDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcnJbaV0udG9KU09OKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChhcnJbaV0udG9KU09OKEpTT05yZXBzKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChhcnJbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdHVhbExpc3Q7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8vIC8vdGhpcyBuZWVkcyB0byBzdGF5IGlmIHdlJ3JlIGdvaW5nIHRvIHVzZSBpbnN0YW5jZW9mXG4vLyAvL2J1dCBub3RlIHdlIG92ZXJyaWRlIGFsbCBvZiB0aGUgbWV0aG9kcyB2aWEgZGVsZWdhdGlvblxuLy8gLy9zbyBpdCdzIG5vdCBkb2luZyBhbnl0aGluZyBleGNlcHQgZm9yIG1ha2luZyBhbiBBdHRyTGlzdFxuLy8gLy9hbiBpbnN0YW5jZSBvZiBBdHRyXG4vL0F0dHJMaXN0LnByb3RvdHlwZSA9IG5ldyBBdHRyKG5hbWUpO1xuQXR0ckxpc3QucHJvdG90eXBlID0gbmV3IEF0dHIoXCI/Pz9cIik7XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0ckxpc3Q7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIE1ldGhvZCA9IGZ1bmN0aW9uIChuYW1lLCBtZXRob2QpIHtcbiAgICBpZiAoIW5hbWUgfHwgdHlwZW9mKG5hbWUpICE9PSBcInN0cmluZ1wiKSB7IFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Q6IGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZSBwYXJhbWV0ZXIgd2hpY2ggbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICB9IGVsc2UgaWYgKCFtZXRob2QgfHwgdHlwZW9mKG1ldGhvZCkgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Q6IHNlY29uZCBwYXJhbWV0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICBcbiAgICB0aGlzLmFkZFRvID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICBpZiAoIW9iaiB8fCB0eXBlb2Yob2JqKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZDogYWRkVG8gbWV0aG9kIHJlcXVpcmVzIGFuIG9iamVjdCBwYXJhbWV0ZXJcIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIG9ialtuYW1lXSA9IG1ldGhvZDtcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZXRob2Q7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxucmVxdWlyZSgnLi4vdXRpbC9pbmRleF9vZi5qcycpO1xuXG52YXIgbW9kZWxzID0ge307XG5cbi8qKlxuICogdGhpcyBmdW5jdGlvbiByZXR1cm4gYSBtb2RlbCBhc3NvY2lhdGVkIHdpdGggYSBuYW1lXG4gKi9cbnZhciBnZXRNb2RlbCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgaWYgKHR5cGVvZihuYW1lKSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJKZXJtYWluZTogYXJndW1lbnQgdG8gZ2V0TW9kZWwgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICB9XG5cbiAgICBpZiAobW9kZWxzW25hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbW9kZWwgYnkgdGhlIG5hbWUgb2YgXCIgKyBuYW1lICsgXCIgZm91bmRcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG1vZGVsc1tuYW1lXTtcbiAgICB9XG59O1xuXG4vKipcbiAqIHRoaXMgZnVuY3Rpb24gcmV0dXJucyBhbiBhcnJheSBvZiBhbGwgbW9kZWwgbmFtZXMgc3RvcmVkIGJ5XG4gKiBqZXJtYWluZVxuICovXG52YXIgZ2V0TW9kZWxzID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgbW9kZWwsXG4gICAgICAgIHJlc3VsdCA9IFtdO1xuICAgIFxuICAgIGZvciAobW9kZWwgaW4gbW9kZWxzKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKG1vZGVsKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogVGhpcyBpcyB0aGUgbW9kZWwgY29uc3RydWN0b3JcbiAqL1xuXG52YXIgTW9kZWwgPSBmdW5jdGlvbiAoc3BlY2lmaWNhdGlvbikge1xuICAgIHZhciBtZXRob2RzID0ge30sXG4gICAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICAgICAgcGF0dGVybixcbiAgICAgICAgbW9kZWxOYW1lLFxuICAgICAgICBtb2RpZmllZCA9IHRydWUsXG4gICAgICAgIHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzID0gW10sXG4gICAgICAgIG9wdGlvbmFsQ29uc3RydWN0b3JBcmdzID0gW10sXG4gICAgICAgIHBhcmVudHMgPSBbXSxcbiAgICAgICAgTWV0aG9kID0gcmVxdWlyZSgnLi9tZXRob2QuanMnKSxcbiAgICAgICAgQXR0ciA9IHJlcXVpcmUoJy4vYXR0ci5qcycpLFxuICAgICAgICBBdHRyTGlzdCA9IHJlcXVpcmUoJy4vYXR0cl9saXN0LmpzJyksXG4gICAgICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJy4uL3V0aWwvZXZlbnRfZW1pdHRlci5qcycpLFxuICAgICAgICBwcm9wZXJ0eSxcbiAgICAgICAgbGlzdFByb3BlcnRpZXMsXG4gICAgICAgIHVwZGF0ZUNvbnN0cnVjdG9yLFxuICAgICAgICBpc0ltbXV0YWJsZSxcbiAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgY29uc3RydWN0b3IgPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgbW9kZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAobW9kaWZpZWQpIHtcbiAgICAgICAgICAgICAgICAvL3ZhbGlkYXRlIHRoZSBtb2RlbCBpZiBpdCBoYXMgYmVlbiBtb2RpZmllZFxuICAgICAgICAgICAgICAgIG1vZGVsLnZhbGlkYXRlKCk7XG4gICAgICAgICAgICAgICAgdXBkYXRlQ29uc3RydWN0b3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKHR5cGVvZihzcGVjaWZpY2F0aW9uKSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgbW9kZWxOYW1lID0gc3BlY2lmaWNhdGlvbjtcbiAgICAgICAgICAgIHNwZWNpZmljYXRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgbW9kZWxOYW1lID0gc3BlY2lmaWNhdGlvbjtcbiAgICAgICAgc3BlY2lmaWNhdGlvbiA9IGFyZ3VtZW50c1thcmd1bWVudHMubGVuZ3RoLTFdO1xuICAgIH1cblxuICAgIC8vaGFuZGxlIHNwZWNpZmljYXRpb24gZnVuY3Rpb25cbiAgICBpZiAoc3BlY2lmaWNhdGlvbiAmJiB0eXBlb2Yoc3BlY2lmaWNhdGlvbikgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBtb2RlbCA9IG5ldyBNb2RlbChtb2RlbE5hbWUpO1xuICAgICAgICBzcGVjaWZpY2F0aW9uLmNhbGwobW9kZWwpO1xuICAgICAgICByZXR1cm4gbW9kZWw7XG4gICAgfSBlbHNlIGlmIChzcGVjaWZpY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1vZGVsOiBzcGVjaWZpY2F0aW9uIHBhcmFtZXRlciBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgfVxuXG4gICAgLy9oYW5kbGUgbW9kZWwgbmFtZVxuICAgIGlmIChtb2RlbE5hbWUgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YobW9kZWxOYW1lKSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBtb2RlbHNbbW9kZWxOYW1lXSA9IG1vZGVsO1xuICAgIH0gZWxzZSBpZiAobW9kZWxOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IG1vZGVsIG5hbWUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICB9XG5cbiAgICBcbiAgICAvKioqKioqKioqKiBCRUdJTiBQUklWQVRFIE1FVEhPRFMgKioqKioqKioqKioqKioqKi9cbiAgICAvKiBwcml2YXRlIG1ldGhvZCB0aGF0IGFic3RyYWN0cyBoYXNBL2hhc01hbnkgKi9cbiAgICB2YXIgaGFzQVByb3BlcnR5ID0gZnVuY3Rpb24gKHR5cGUsIG5hbWUpIHtcbiAgICAgICAgdmFyIFByb3BlcnR5LFxuICAgICAgICAgICAgbWV0aG9kTmFtZSxcbiAgICAgICAgICAgIGF0dHJpYnV0ZTtcblxuICAgICAgICAvL1Byb3BlcnR5IGlzIG9uZSBvZiBBdHRyIG9yIEF0dHJMaXN0XG4gICAgICAgIFByb3BlcnR5ID0gdHlwZT09PVwiQXR0clwiP0F0dHI6QXR0ckxpc3Q7XG5cbiAgICAgICAgLy9tZXRob2ROYW1lIGlzIGVpdGhlciBoYXNBIG9yIGhhc01hbnlcbiAgICAgICAgbWV0aG9kTmFtZSA9IHR5cGU9PT1cIkF0dHJcIj9cImhhc0FcIjpcImhhc01hbnlcIjtcblxuICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mKG5hbWUpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgYXR0cmlidXRlID0gbmV3IFByb3BlcnR5KG5hbWUpO1xuICAgICAgICAgICAgYXR0cmlidXRlc1tuYW1lXSA9IGF0dHJpYnV0ZTtcbiAgICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2RlbDogXCIgKyBtZXRob2ROYW1lICsgXCIgcGFyYW1ldGVyIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyogcHJpdmF0ZSBtZXRob2QgdGhhdCBhYnN0cmFjdHMgYXR0cmlidXRlL21ldGhvZCAqL1xuICAgIHByb3BlcnR5ID0gZnVuY3Rpb24gKHR5cGUsIG5hbWUpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICBpZiAodHlwZW9mKG5hbWUpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2RlbDogZXhwZWN0ZWQgc3RyaW5nIGFyZ3VtZW50IHRvIFwiICsgdHlwZSArIFwiIG1ldGhvZCwgYnV0IHJlY2lldmVkIFwiICsgbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHQgPSB0eXBlPT09XCJhdHRyaWJ1dGVcIiA/IGF0dHJpYnV0ZXNbbmFtZV0gOiBtZXRob2RzW25hbWVdO1xuXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IFwiICsgdHlwZSArIFwiIFwiICsgbmFtZSAgKyBcIiBkb2VzIG5vdCBleGlzdCFcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvKiBwcml2YXRlIG1ldGhvZCB0aGF0IGFic3RyYWN0cyBhdHRyaWJ1dGVzL21ldGhvZHMgKi9cbiAgICBsaXN0UHJvcGVydGllcyA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgbGlzdCA9IFtdLFxuICAgICAgICAgICAgcHJvcGVydGllcyA9IHR5cGU9PT1cImF0dHJpYnV0ZXNcIj9hdHRyaWJ1dGVzOm1ldGhvZHM7XG5cbiAgICAgICAgZm9yIChpIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgbGlzdC5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfTtcblxuICAgIC8qIHByaXZhdGUgZnVuY3Rpb24gdGhhdCB1cGRhdGVzIHRoZSBjb25zdHJ1Y3RvciAqL1xuICAgIHVwZGF0ZUNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpLCBqLFxuICAgICAgICAgICAgICAgIGVycixcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGUsXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlTGlzdCA9IG1vZGVsLmF0dHJpYnV0ZXMoKSwgXG4gICAgICAgICAgICAgICAgbWV0aG9kTGlzdCA9IG1vZGVsLm1ldGhvZHMoKSwgXG4gICAgICAgICAgICAgICAgZW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKSxcbiAgICAgICAgICAgICAgICBhdHRyLFxuICAgICAgICAgICAgICAgIGF0dHJDaGFuZ2VMaXN0ZW5lcnMgPSB7fSxcbiAgICAgICAgICAgICAgICBjaGFuZ2VIYW5kbGVyLFxuICAgICAgICAgICAgICAgIGFkZFByb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBtb2RlbCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy9iYWQgZm9ybSwgYnV0IGhvcGVmdWxseSB0ZW1wb3JhcnlcbiAgICAgICAgICAgICAgICAgICAgLypqc2hpbnQgbmV3Y2FwOmZhbHNlICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgbW9kZWwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvL2JhZCBmb3JtLCBidXQgaG9wZWZ1bGx5IHRlbXBvcmFyeVxuICAgICAgICAgICAgICAgICAgICAvKmpzaGludCBuZXdjYXA6ZmFsc2UgKi9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBtb2RlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL3Rocm93IG5ldyBFcnJvcihcIk1vZGVsOiBpbnN0YW5jZXMgbXVzdCBiZSBjcmVhdGVkIHVzaW5nIHRoZSBuZXcgb3BlcmF0b3JcIik7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8gUFVCTElDIEFQSSBGT1IgQUxMIElOU1RBTkNFUyAvLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICAgICAvLyB0aGlzIGlzIGEgbWV0aG9kIGFzc29jaWF0ZWQgd2l0aCB1bml0IHRlc3RcbiAgICAgICAgICAgIC8vIGl0KFwic2hvdWxkIG5vdCBpbmNyZW1lbnQgdGhlIGxpc3RlbmVycyBhc3NvY2lhdGVkIHdpdGggdGhlIGxhc3Qgb2JqZWN0IGNyZWF0ZWRcIlxuICAgICAgICAgICAgLy8gaXQgaGFzIGJlZW4gcmVtb3ZlZCBub3cgdGhhdCB0aGUgYnVnIGhhcyBiZWVuIGZpeGVkXG4gICAgICAgICAgICAvKnRoaXMuYXR0ckNoYW5nZUxpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICByZXR1cm4gYXR0ckNoYW5nZUxpc3RlbmVycztcbiAgICAgICAgICAgICB9OyovXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB0aGUgRXZlbnRFbWl0dGVyIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGluc3RhbmNlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5lbWl0dGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbWl0dGVyO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXcmFwcGVyIG1ldGhvZHMgYWRkZWQgdG8gdGhlIGludGVybmFsIEV2ZW50RW1pdHRlciBvYmplY3RcbiAgICAgICAgICAgICAqIFxuICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIHRoaXMuZW1pdHRlcigpLnJlbW92ZUplcm1haW5lQ2hhbmdlTGlzdGVuZXIgPSBmdW5jdGlvbiAoYXR0ck5hbWUsIG9iaikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YoYXR0ck5hbWUpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImF0dHJOYW1lIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Yob2JqKSAhPT0gXCJvYmplY3RcIiB8fCBvYmoudG9KU09OID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iai5lbWl0dGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqIG11c3QgYmUgYSBqZXJtYWluZSBvYmplY3RcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmVtaXR0ZXIoKS5yZW1vdmVMaXN0ZW5lcihcImNoYW5nZVwiLCBhdHRyQ2hhbmdlTGlzdGVuZXJzW2F0dHJOYW1lXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5lbWl0dGVyKCkuYWRkSmVybWFpbmVDaGFuZ2VMaXN0ZW5lciA9IGZ1bmN0aW9uIChhdHRyTmFtZSwgb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZihhdHRyTmFtZSkgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXR0ck5hbWUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZihvYmopICE9PSBcIm9iamVjdFwiIHx8IG9iai50b0pTT04gPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqLmVtaXR0ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvYmogbXVzdCBiZSBhIGplcm1haW5lIG9iamVjdFwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ckNoYW5nZUxpc3RlbmVyc1thdHRyTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXR0ckNoYW5nZUxpc3RlbmVyc1thdHRyTmFtZV0gPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdEYXRhID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtaXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhLmxlbmd0aCAmJiBlbWl0ID09PSB0cnVlOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGF0YS5wdXNoKGRhdGFbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YVtpXS5vcmlnaW4gPT09IHRoYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtaXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW1pdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRhLnB1c2goe2tleTphdHRyTmFtZSwgb3JpZ2luOnRoYXR9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5lbWl0KFwiY2hhbmdlXCIsIG5ld0RhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvYmouZW1pdHRlcigpLm9uKFwiY2hhbmdlXCIsIGF0dHJDaGFuZ2VMaXN0ZW5lcnNbYXR0ck5hbWVdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVnaXN0ZXJzIGEgbGlzdGVuZXIgZm9yIHRoaXMgaW5zdGFuY2UncyBjaGFuZ2VzLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5vbiA9IHRoaXMuZW1pdHRlcigpLm9uO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEVtaXRzIGFuIGV2ZW50XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuZW1pdCA9IHRoaXMuZW1pdHRlcigpLmVtaXQ7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyBhIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhpcyBpbnN0YW5jZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMudG9KU09OID0gZnVuY3Rpb24gKEpTT05yZXBzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBpLCBqLFxuICAgICAgICAgICAgICAgICAgICB0aGlzSlNPTnJlcCA9IHt9LFxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVKU09OcmVwO1xuXG4gICAgICAgICAgICAgICAgaWYgKEpTT05yZXBzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmlyc3QgY2FsbFxuICAgICAgICAgICAgICAgICAgICBKU09OcmVwcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBKU09OcmVwcy5wdXNoKHtvYmplY3Q6dGhpcywgSlNPTnJlcDp0aGlzSlNPTnJlcH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKEpTT05yZXBzKSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBlcnJvciBjb25kaXRpb24gXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkluc3RhbmNlOiB0b0pTT04gc2hvdWxkIG5vdCB0YWtlIGEgcGFyYW1ldGVyICh1bmxlc3MgY2FsbGVkIHJlY3Vyc2l2ZWx5KVwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBjdXJyZW50IEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhpcyBvYmplY3QsIGlmIGl0IGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgSlNPTnJlcHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChKU09OcmVwc1tpXS5vYmplY3QgPT09IHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzSlNPTnJlcCA9IEpTT05yZXBzW2ldLkpTT05yZXA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXR0cmlidXRlTGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVKU09OcmVwID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSB0aGlzW2F0dHJpYnV0ZUxpc3RbaV1dKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBjdXJyZW50IEpTT04gcmVwcmVzZW50YXRpb24gZm9yIHRoZSBhdHRyaWJ1dGUsIGlmIGl0IGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgSlNPTnJlcHMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChKU09OcmVwc1tqXS5vYmplY3QgPT09IGF0dHJpYnV0ZVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSlNPTnJlcCA9IEpTT05yZXBzW2pdLkpTT05yZXA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlVmFsdWUgIT09IHVuZGVmaW5lZCAmJiBhdHRyaWJ1dGVWYWx1ZSAhPT0gbnVsbCAmJiBhdHRyaWJ1dGVWYWx1ZS50b0pTT04gIT09IHVuZGVmaW5lZCAmJiBhdHRyaWJ1dGVKU09OcmVwID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYSBuZXcgZW50cnkgZm9yIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUpTT05yZXAgPSAoYXR0cmlidXRlc1thdHRyaWJ1dGVMaXN0W2ldXSBpbnN0YW5jZW9mIEF0dHJMaXN0KT9bXTp7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEpTT05yZXBzLnB1c2goe29iamVjdDphdHRyaWJ1dGVWYWx1ZSwgSlNPTnJlcDphdHRyaWJ1dGVKU09OcmVwfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBKU09OcmVwc1tKU09OcmVwcy5sZW5ndGgtMV0uSlNPTnJlcCA9IGF0dHJpYnV0ZVZhbHVlLnRvSlNPTihKU09OcmVwcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBmaWxsIG91dCB0aGUgSlNPTiByZXByZXNlbnRhdGlvbiBmb3IgdGhpcyBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYoYXR0cmlidXRlSlNPTnJlcCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc0pTT05yZXBbYXR0cmlidXRlTGlzdFtpXV0gPSBhdHRyaWJ1dGVWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNKU09OcmVwW2F0dHJpYnV0ZUxpc3RbaV1dID0gYXR0cmlidXRlSlNPTnJlcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc0pTT05yZXA7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgYSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBpbnN0YW5jZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy50b1N0cmluZyA9IChwYXR0ZXJuICE9PSB1bmRlZmluZWQpP3BhdHRlcm46ZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIkplcm1haW5lIE1vZGVsIEluc3RhbmNlXCI7XG4gICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vIEVORCBQVUJMSUMgQVBJIEZPUiBBTEwgSU5TVEFOQ0VTIC8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRoaXMgaXMgYSBwcml2YXRlIG1ldGhvZCB0aGF0IHNldHMgdXAgaGFuZGxpbmcgZm9yIHRoZSBzZXR0ZXJcbiAgICAgICAgICAgICAqIEl0IGF0dGFjaGVzIGEgY2hhbmdlIGxpc3RlbmVyIG9uIG5ldyBvYmplY3RzXG4gICAgICAgICAgICAgKiBhbmQgaXQgcmVtb3ZlcyB0aGUgY2hhbmdlIGxpc3RlbmVyIGZyb20gb2xkIG9iamVjdHNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2hhbmdlSGFuZGxlciA9IGZ1bmN0aW9uIChhdHRyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXR0ciBpbnN0YW5jZW9mIEF0dHJMaXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAvL3doZW4gc2V0IGhhbmRsZXIgaXMgY2FsbGVkLCB0aGlzIHNob3VsZCBiZSB0aGUgY3VycmVudCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgYXR0ci5vbihcInNldFwiLCBmdW5jdGlvbiAobmV3VmFsdWUsIHByZVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBwcmVWYWx1ZSBpcyBhIG1vZGVsIGluc3RhbmNlLCB3ZSBuZWVkIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZVZhbHVlICE9PSB1bmRlZmluZWQgJiYgcHJlVmFsdWUgIT09IG51bGwgJiYgcHJlVmFsdWUub24gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZVZhbHVlLnRvSlNPTiAhPT0gdW5kZWZpbmVkICYmIHByZVZhbHVlLmVtaXR0ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIG5vdyBhc3N1bWUgcHJlVmFsdWUgaXMgYSBtb2RlbCBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNhbml0eSBjaGVjayAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZVZhbHVlLmVtaXR0ZXIoKS5saXN0ZW5lcnMoXCJjaGFuZ2VcIikubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwcmVWYWx1ZSBzaG91bGQgYWx3YXlzIGhhdmUgYSBsaXN0ZW5lciBkZWZpbmVkIGlmIGl0IGlzIGEgbW9kZWxcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlcigpLnJlbW92ZUplcm1haW5lQ2hhbmdlTGlzdGVuZXIoYXR0ci5uYW1lKCksIHByZVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgbmV3VmFsdWUgaXMgYSBtb2RlbCBpbnN0YW5jZSwgd2UgbmVlZCB0byBhdHRhY2ggYSBsaXN0ZW5lciB0byBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB1bmRlZmluZWQgJiYgbmV3VmFsdWUgIT09IG51bGwgJiYgbmV3VmFsdWUub24gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlLnRvSlNPTiAhPT0gdW5kZWZpbmVkICYmIG5ld1ZhbHVlLmVtaXR0ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIG5vdyBhc3N1bWUgbmV3VmFsdWUgaXMgYSBtb2RlbCBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGF0dGFjaCBhIGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyKCkuYWRkSmVybWFpbmVDaGFuZ2VMaXN0ZW5lcihhdHRyLm5hbWUoKSwgbmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaW5hbGx5IGVtaXQgdGhhdCBhIGNoYW5nZSBoYXMgaGFwcGVuZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChcImNoYW5nZVwiLCBbe2tleTphdHRyLm5hbWUoKSwgdmFsdWU6bmV3VmFsdWUsIG9yaWdpbjp0aGlzfV0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhdHRyLm9uKFwiYWRkXCIsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgbmV3U2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwiY2hhbmdlXCIsIFt7YWN0aW9uOlwiYWRkXCIsIGtleTphdHRyLm5hbWUoKSwgdmFsdWU6bmV3VmFsdWUsIG9yaWdpbjp0aGlzfV0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL3NldCB1cCBldmVudCBoYW5kbGluZyBmb3Igc3ViIG9iamVjdHNcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBhdHRyaWJ1dGVMaXN0Lmxlbmd0aDsgICsraSkge1xuICAgICAgICAgICAgICAgIGF0dHIgPSBtb2RlbC5hdHRyaWJ1dGUoYXR0cmlidXRlTGlzdFtpXSk7XG5cbiAgICAgICAgICAgICAgICAvLyB0ZW1wb3JhcmlseSBub3QgYWRkaW5nIGhhbmRsZXJzIHRvIGF0dHIgbGlzdHNcbiAgICAgICAgICAgICAgICAvLyB1bnRpbCB3ZSBnZXQgdGhlIGJ1Z3Mgc29ydGVkIG91dFxuICAgICAgICAgICAgICAgIC8vIHNlZSBtb2RlbCB0ZXN0IFwic2hvdWxkIG5vdCBhZGQgY2hhbmdlIGxpc3RlbmVycyB0byBhdHRyIGxpc3RcIlxuICAgICAgICAgICAgICAgIC8vaWYgKCEoYXR0ciBpbnN0YW5jZW9mIEF0dHJMaXN0KSkge1xuICAgICAgICAgICAgICAgIGNoYW5nZUhhbmRsZXIuY2FsbCh0aGlzLCBhdHRyKTtcbiAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvLyBhZGQgYWxsIG9mIHRoZSBhdHRyaWJ1dGVzIGFuZCB0aGUgbWV0aG9kcyB0byB0aGUgb2JqZWN0XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXR0cmlidXRlTGlzdC5sZW5ndGggKyBtZXRob2RMaXN0Lmxlbmd0aDsgKytpKSAge1xuICAgICAgICAgICAgICAgIGlmIChpIDwgYXR0cmlidXRlTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9pZiB0aGUgb2JqZWN0IGlzIGltbXV0YWJsZSwgYWxsIGF0dHJpYnV0ZXMgc2hvdWxkIGJlIGltbXV0YWJsZVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNJbW11dGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmF0dHJpYnV0ZShhdHRyaWJ1dGVMaXN0W2ldKS5pc0ltbXV0YWJsZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLmF0dHJpYnV0ZShhdHRyaWJ1dGVMaXN0W2ldKS5hZGRUbyh0aGlzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tZXRob2QobWV0aG9kTGlzdFtpLWF0dHJpYnV0ZUxpc3QubGVuZ3RoXSkuYWRkVG8odGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBidWlsZCB0aGUgb2JqZWN0IHVzaW5nIHRoZSBjb25zdHJ1Y3RvciBhcmd1bWVudHNcbiAgICAgICAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCByZXF1aXJlZENvbnN0cnVjdG9yQXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zdHJ1Y3QgYW5kIHRocm93IGVycm9yXG4gICAgICAgICAgICAgICAgICAgIGVyciA9IFwiQ29uc3RydWN0b3IgcmVxdWlyZXMgXCI7XG4gICAgICAgICAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgKz0gcmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3NbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgKz0gaT09PXJlcXVpcmVkQ29uc3RydWN0b3JBcmdzLmxlbmd0aC0xP1wiXCI6XCIsIFwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVyciArPSBcIiB0byBiZSBzcGVjaWZpZWRcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgfSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzLmxlbmd0aCArIG9wdGlvbmFsQ29uc3RydWN0b3JBcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb28gbWFueSBhcmd1bWVudHMgdG8gY29uc3RydWN0b3IuIEV4cGVjdGVkIFwiICsgcmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3MubGVuZ3RoICsgXCIgcmVxdWlyZWQgYXJndW1lbnRzIGFuZCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25hbENvbnN0cnVjdG9yQXJncy5sZW5ndGggKyBcIiBvcHRpb25hbCBhcmd1bWVudHNcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGUgPSBpIDwgcmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3MubGVuZ3RoP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzW2ldOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsQ29uc3RydWN0b3JBcmdzW2ktcmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3MubGVuZ3RoXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vZGVsLmF0dHJpYnV0ZShhdHRyaWJ1dGUpIGluc3RhbmNlb2YgQXR0ckxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL21ha2Ugc3VyZSB0aGF0IGFyZ3VtZW50c1tpXSBpcyBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJndW1lbnRzW2ldKSAhPT0gXCJbb2JqZWN0IEFycmF5XVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1vZGVsOiBDb25zdHJ1Y3RvciByZXF1aXJlcyAnbmFtZXMnIGF0dHJpYnV0ZSB0byBiZSBzZXQgd2l0aCBhbiBBcnJheVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2l0ZXJhdGUgb3ZlciB0aGUgYXJyYXkgYWRkaW5nIHRoZSBlbGVtZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgYXJndW1lbnRzW2ldLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2F0dHJpYnV0ZV0oKS5hZGQoYXJndW1lbnRzW2ldW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9nbyBhaGVhZCBhbmQgc2V0IGl0IGxpa2Ugbm9ybWFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1thdHRyaWJ1dGVdKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZpbmFsbHksIGNhbGwgdGhlIGluaXRpYWxpemVyXG4gICAgICAgICAgICBpbml0aWFsaXplci5jYWxsKHRoaXMpO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgLyoqKioqKioqKioqIEVORCBQUklWQVRFIE1FVEhPRFMgKioqKioqKioqKioqKiovXG5cblxuICAgIC8qKioqKioqKioqKiBCRUdJTiBQVUJMSUMgQVBJICoqKioqKioqKioqKioqKioqL1xuICAgIG1vZGVsLmhhc0EgPSBmdW5jdGlvbiAoYXR0cikge1xuICAgICAgICByZXR1cm4gaGFzQVByb3BlcnR5KFwiQXR0clwiLCBhdHRyKTtcbiAgICB9O1xuICAgIFxuICAgIG1vZGVsLmhhc0FuID0gbW9kZWwuaGFzQTtcbiAgICBtb2RlbC5oYXNTb21lID0gbW9kZWwuaGFzQTtcbiAgICBcbiAgICBtb2RlbC5oYXNNYW55ID0gZnVuY3Rpb24gKGF0dHJzKSB7XG4gICAgICAgIHJldHVybiBoYXNBUHJvcGVydHkoXCJBdHRyTGlzdFwiLCBhdHRycyk7XG4gICAgfTtcblxuICAgIG1vZGVsLmlzQSA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBwYXJlbnRBdHRyaWJ1dGVzLFxuICAgICAgICAgICAgcGFyZW50TWV0aG9kcyxcbiAgICAgICAgICAgIGlzQU1vZGVsO1xuXG4gICAgICAgIG1vZGlmaWVkID0gdHJ1ZTtcblxuICAgICAgICAvL2NoZWNrcyB0byBtYWtlIHN1cmUgYSBwb3RlbnRpYWxNb2RlbCBoYXMgYWxsIGF0dHJpYnV0ZXMgb2YgYSBtb2RlbFxuICAgICAgICBpc0FNb2RlbCA9IGZ1bmN0aW9uIChwb3RlbnRpYWxNb2RlbCkge1xuICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgTSA9IG5ldyBNb2RlbCgpO1xuICAgICAgICAgICAgZm9yIChpIGluIE0pIHtcbiAgICAgICAgICAgICAgICBpZiAoTS5oYXNPd25Qcm9wZXJ0eShpKSAmJiB0eXBlb2YocG90ZW50aWFsTW9kZWxbaV0pICE9PSB0eXBlb2YoTVtpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vY29uZmlybSBwYXJlbnQgaXMgYSBtb2RlbCB2aWEgZHVjay10eXBpbmdcbiAgICAgICAgaWYgKHR5cGVvZiAocGFyZW50KSAhPT0gXCJmdW5jdGlvblwiIHx8ICFpc0FNb2RlbChwYXJlbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2RlbDogcGFyYW1ldGVyIHNlbnQgdG8gaXNBIGZ1bmN0aW9uIG11c3QgYmUgYSBNb2RlbFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vb25seSBhbGxvdyBzaW5nbGUgaW5oZXJpdGFuY2UgZm9yIG5vd1xuICAgICAgICBpZiAocGFyZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IE1vZGVsIG9ubHkgc3VwcG9ydHMgc2luZ2xlIGluaGVyaXRhbmNlIGF0IHRoaXMgdGltZVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vYWRkIGF0dHJpYnV0ZXMgYW5kIG1ldGhvZHMgdG8gY3VycmVudCBtb2RlbFxuICAgICAgICBwYXJlbnRBdHRyaWJ1dGVzID0gcGFyZW50c1swXS5hdHRyaWJ1dGVzKCk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwYXJlbnRBdHRyaWJ1dGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlc1twYXJlbnRBdHRyaWJ1dGVzW2ldXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1twYXJlbnRBdHRyaWJ1dGVzW2ldXSA9IHBhcmVudHNbMF0uYXR0cmlidXRlKHBhcmVudEF0dHJpYnV0ZXNbaV0pLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgLy9zdWJjbGFzcyBhdHRyaWJ1dGVzIGFyZSBtdXRhYmxlIGJ5IGRlZmF1bHRcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzW3BhcmVudEF0dHJpYnV0ZXNbaV1dLmlzTXV0YWJsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcGFyZW50TWV0aG9kcyA9IHBhcmVudHNbMF0ubWV0aG9kcygpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcGFyZW50TWV0aG9kcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKG1ldGhvZHNbcGFyZW50TWV0aG9kc1tpXV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG1ldGhvZHNbcGFyZW50TWV0aG9kc1tpXV0gPSBwYXJlbnRzWzBdLm1ldGhvZChwYXJlbnRNZXRob2RzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgICAgIFxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBtb2RlbC5wcm90b3R5cGUgPSBuZXcgcGFyZW50c1tpXSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG1vZGVsLmlzQW4gPSBtb2RlbC5pc0E7XG5cbiAgICBtb2RlbC5wYXJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRzWzBdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIG1vZGVsLmF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChhdHRyKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eShcImF0dHJpYnV0ZVwiLCBhdHRyKTtcbiAgICB9O1xuXG4gICAgbW9kZWwuYXR0cmlidXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RQcm9wZXJ0aWVzKFwiYXR0cmlidXRlc1wiKTtcbiAgICB9O1xuXG4gICAgbW9kZWwubWV0aG9kID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5KFwibWV0aG9kXCIsIG0pO1xuICAgIH07XG4gICAgXG4gICAgbW9kZWwubWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RQcm9wZXJ0aWVzKFwibWV0aG9kc1wiKTtcbiAgICB9O1xuXG4gICAgbW9kZWwuaXNCdWlsdFdpdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcHRpb25hbFBhcmFtRmxhZyA9IGZhbHNlLFxuICAgICAgICAgICAgaTtcblxuICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgIHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzID0gW107XG4gICAgICAgIG9wdGlvbmFsQ29uc3RydWN0b3JBcmdzID0gW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZihhcmd1bWVudHNbaV0pID09PSBcInN0cmluZ1wiICYmIGFyZ3VtZW50c1tpXS5jaGFyQXQoMCkgIT09ICclJykge1xuICAgICAgICAgICAgICAgIC8vaW4gcmVxdWlyZWQgcGFybXNcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9uYWxQYXJhbUZsYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy90aHJvdyBlcnJvclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2RlbDogaXNCdWlsdFdpdGggcmVxdWlyZXMgcGFyYW1ldGVycyBwcmVjZWRlZCB3aXRoIGEgJSB0byBiZSB0aGUgZmluYWwgcGFyYW1ldGVycyBiZWZvcmUgdGhlIG9wdGlvbmFsIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vaW5zZXJ0IGludG8gcmVxdWlyZWQgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZih0eXBlb2YoYXJndW1lbnRzW2ldKSA9PT0gXCJzdHJpbmdcIiAmJiBhcmd1bWVudHNbaV0uY2hhckF0KDApID09PSAnJScpIHtcbiAgICAgICAgICAgICAgICAvL2luIG9wdGlvbmFsIHBhcm1zXG4gICAgICAgICAgICAgICAgb3B0aW9uYWxQYXJhbUZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vaW5zZXJ0IGludG8gb3B0aW9uYWwgYXJyYXlcbiAgICAgICAgICAgICAgICBvcHRpb25hbENvbnN0cnVjdG9yQXJncy5wdXNoKGFyZ3VtZW50c1tpXS5zbGljZSgxKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodHlwZW9mKGFyZ3VtZW50c1tpXSkgPT09IFwiZnVuY3Rpb25cIiAmJiBpID09PSBhcmd1bWVudHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIC8vaW5pdCBmdW5jdGlvblxuICAgICAgICAgICAgICAgIGluaXRpYWxpemVyID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2RlbDogaXNCdWlsdFdpdGggcGFyYW1ldGVycyBtdXN0IGJlIHN0cmluZ3MgZXhjZXB0IGZvciBhIGZ1bmN0aW9uIGFzIHRoZSBvcHRpb25hbCBmaW5hbCBwYXJhbWV0ZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIG1vZGVsLmlzSW1tdXRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpc0ltbXV0YWJsZSA9IHRydWU7XG4gICAgfTtcblxuICAgIG1vZGVsLmxvb2tzTGlrZSA9IGZ1bmN0aW9uIChwKSB7XG4gICAgICAgIG1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgcGF0dGVybiA9IHA7XG4gICAgfTtcblxuICAgIG1vZGVsLnJlc3BvbmRzVG8gPSBmdW5jdGlvbiAobWV0aG9kTmFtZSwgbWV0aG9kQm9keSkge1xuICAgICAgICB2YXIgbSA9IG5ldyBNZXRob2QobWV0aG9kTmFtZSwgbWV0aG9kQm9keSk7XG4gICAgICAgIG1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgbWV0aG9kc1ttZXRob2ROYW1lXSA9IG07XG4gICAgfTtcbiAgICBcbiAgICBtb2RlbC52YWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBhdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzKCksXG4gICAgICAgICAgICBtZXRob2RzID0gdGhpcy5tZXRob2RzKCk7XG5cbiAgICAgICAgLy9jaGVjayB0byBtYWtlIHN1cmUgdGhhdCBpc0J1aWx0V2l0aCBoYXMgYWN0dWFsIGF0dHJpYnV0ZXNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlKHJlcXVpcmVkQ29uc3RydWN0b3JBcmdzW2ldKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IocmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3NbaV0gKyBcIiwgc3BlY2lmaWVkIGluIHRoZSBpc0J1aWx0V2l0aCBtZXRob2QsIGlzIG5vdCBhbiBhdHRyaWJ1dGVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb3B0aW9uYWxDb25zdHJ1Y3RvckFyZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGUob3B0aW9uYWxDb25zdHJ1Y3RvckFyZ3NbaV0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihvcHRpb25hbENvbnN0cnVjdG9yQXJnc1tpXSArIFwiLCBzcGVjaWZpZWQgaW4gdGhlIGlzQnVpbHRXaXRoIG1ldGhvZCwgaXMgbm90IGFuIGF0dHJpYnV0ZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2hlY2sgZm9yIG1ldGhvZC9hdHRyaWJ1dGUgY29sbGlzaW9uc1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG1ldGhvZHMuaW5kZXhPZihhdHRyaWJ1dGVzW2ldKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWw6IGludmFsaWQgbW9kZWwgc3BlY2lmaWNhdGlvbiB0byBcIiArIGF0dHJpYnV0ZXNbaV0gKyBcIiBiZWluZyBib3RoIGFuIGF0dHJpYnV0ZSBhbmQgbWV0aG9kXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9jaGVjayB0byBtYWtlIHN1cmUgdGhhdCBhbGwgYXR0cmlidXRlcyBhcmUgcmVxdWlyZWRDb25zdHJ1Y3RvckFyZ3MgaWYgdGhlIG9iamVjdCBpcyBpbW11dGFibGVcbiAgICAgICAgaWYgKGlzSW1tdXRhYmxlKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChyZXF1aXJlZENvbnN0cnVjdG9yQXJncy5pbmRleE9mKGF0dHJpYnV0ZXNbaV0pIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbW11dGFibGUgb2JqZWN0cyBtdXN0IGhhdmUgYWxsIGF0dHJpYnV0ZXMgcmVxdWlyZWQgaW4gYSBjYWxsIHRvIGlzQnVpbHRXaXRoXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2V0IG1vZGlmaWVkU2luY2VMYXN0VmFsaWRhdGlvbiB0byBmYWxzZVxuICAgICAgICBtb2RpZmllZCA9IGZhbHNlO1xuICAgIH07XG4gICAgLyoqKioqKioqKioqKioqIEVORCBQVUJMSUMgQVBJICoqKioqKioqKioqKioqKiovXG4gICAgXG4gICAgLy9oZXJlIHdlIGFyZSByZXR1cm5pbmcgb3VyIG1vZGVsIG9iamVjdFxuICAgIC8vd2hpY2ggaXMgYSBmdW5jdGlvbiB3aXRoIGEgYnVuY2ggb2YgbWV0aG9kcyB0aGF0XG4gICAgLy9tYW5pcHVsYXRlIGhvdyB0aGUgZnVuY3Rpb24gYmVoYXZlc1xuICAgIHJldHVybiBtb2RlbDtcbn07XG5cbi8vbnMuZ2V0TW9kZWwgPSBnZXRNb2RlbDtcbi8vbnMuZ2V0TW9kZWxzID0gZ2V0TW9kZWxzO1xuXG5Nb2RlbC5nZXRNb2RlbCA9IGdldE1vZGVsO1xuTW9kZWwuZ2V0TW9kZWxzID0gZ2V0TW9kZWxzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xuXG5cbiIsIi8qKlxuICogVmFsaWRhdG9yXG4gKiBcbiAqIENyZWF0ZXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IGNhbiBiZSBhdHRhY2hlZCB0byBhdHRyaWJ1dGUgZm9yIHZhbGlkYXRpb24uXG4gKiBUaGUgVmFsaWRhdG9yIGZ1bmN0aW9uIGFsbG93cyBmb3IgY3VzdG9taXphdGlvbiBvZiB0aGUgdGhyb3duIGVycm9yIG1lc3NhZ2UuXG4gKlxuICogVGhpcyBzb3VyY2UgZmlsZSBhbHNvIGhhbmRsZXMgYWxsIGRlZmF1bHQgdmFsaWRhdG9ycyB0aGF0IGNvbWUgcGFja2FnZWQgd2l0aFxuICogSmVybWFpbmUuIFRoaXMgaW5jbHVkZXMgaXNBLCBpc09uZU9mLCBpc0dyZWF0ZXJUaGFuLCBpc0xlc3NUaGFuLCBldGMuXG4gKlxuICogU2ltcGxlIGV4YW1wbGU6XG4gKlxuICogaXNHcmVhdGVyVGhhbiA9IG5ldyBWYWxpZGF0b3IoZnVuY3Rpb24gKG51bWJlcikge1xuICogICAgIC8vdGhpcy5tZXNzYWdlIHBvaW50cyB0byB0aGUgZXJyb3IgbWVzc2FnZVxuICogICAgIC8vdGhhdCB3aWxsIGJlIHRocm93blxuICogICAgIHRoaXMubWVzc2FnZSA9IFwiVmFsaWRhdGlvbiBFcnJvcjogXCIgKyBcbiAqICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmFtICsgXCIgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiBcIiArIG51bWJlcjtcbiAqXG4gKiAgICAgLy90aGlzLnBhcmFtIHBvaW50cyB0byB0aGUgYWN0dWFsIHBhcmFtZXRlciBzZW50IHRvIHRoZSB2YWxpZGF0b3JcbiAqICAgICAvL3JldHVybiB0cnVlIGlmIHRoZSB2YWxpZGF0aW9uIHBhc3NlcywgZmFsc2Ugb3RoZXJ3aXNlXG4gKiAgICAgcmV0dXJuIHRoaXMucGFyYW0gPiBudW1iZXI7XG4gKiB9KTtcbiAqXG4gKiBMYXRlciwgYSB2YWxpZGF0b3IgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBhdHRyaWJ1dGUgb2JqZWN0LlxuICpcbiAqIEF0dHIuaXNHcmVhdGVyVGhhbiA9IGlzR3JlYXRlclRoYW47XG4gKlxuICogYW5kIGNhbiBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYXR0cmlidXRlczpcbiAqXG4gKiB2YXIgYWdlID0gbmV3IEF0dHIoXCJhZ2VcIikud2hpY2guaXNHcmVhdGVyVGhhbigwKTtcbiAqXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnJlcXVpcmUoJy4uL3V0aWwvaW5kZXhfb2YuanMnKTtcblxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbC5qcycpO1xuXG52YXIgdmFsaWRhdG9ycyA9IHt9OyAgLy90aGUgc2V0IG9mIHN0YXRpYyB2YWxpZGF0b3JzXG5cbi8qKlxuICogVmFsaWRhdG9yICdDb25zdHJ1Y3RvcidcbiAqXG4gKiBUaGlzIHNpbXBseSByZXR1cm5zIGEgdmFsaWRhdGlvbiBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgdGhlIGN1c3RvbSBlcnJvclxuICogbWVzc2FnZSBhbmQgY2FuIGJlIGF0dGFjaGVkIHRvIGFuIGF0dHJpYnV0ZS4gU28gaXQncyBub3QgcmVhbGx5XG4gKiB0ZWNobmljYWxseSBhIGNvbnN0cnVjdG9yLiBUaGlzIGlzIG9ubHkgaW1wb3J0YW50IHRvIGtub3cgc28gdGhhdCB5b3VcbiAqIGRvbid0IHRyeSBzb21ldGhpbmcgbGlrZSB0aGlzOlxuICpcbiAqIHZhciB2ID0gbmV3IFZhbGlkYXRvciggLi4uICk7XG4gKiBcbiAqIC8vdGhpcyB3aWxsIGFsd2F5cyBmYWlsLCBiYyB2IGlzIG5vdCBhbiBvYmplY3RcbiAqIGlmICh2IGluc3RhbmNlb2YgVmFsaWRhdG9yKSB7IC4uLiB9XG4gKiBcbiAqIFRoZSBzcGVjIGZ1bmN0aW9uIGlzIGp1c3QgYSBzcGVjaWZpY2F0aW9uIGZvciB0aGUgdmFsaWRhdG9yLiBJdCBhbGxvd3NcbiAqIGZvciBhIGNvdXBsZSBvZiB0aGluZ3MgdG8gYmUgYXR0YWNoZWQgdG8gXCJ0aGlzXCIgdGhhdCB3aWxsIGJlIHVzZWRcbiAqIGluIHRoZSByZXR1cm4gZnVuY3Rpb24uIFRoaXMgaW5jbHVkZXMgXCJ0aGlzLm1lc3NhZ2VcIiBhbmQgXCJ0aGlzLnBhcmFtXCIuXG4gKiBUaGUgbWVzc2FnZSBpcyB0aGUgZXJyb3Igc3RyaW5nIHRoYXQgaXMgdGhyb3duIG9uIGZhaWx1cmUgYW5kXG4gKiB0aGlzLnBhcmFtIGlzIHRoZSBhY3R1YWwgcGFyYW1ldGVyIHRoYXQgZ2V0cyBzZW50IGluIHRvIGJlIHZhbGlkYXRlZC5cbiAqL1xudmFyIFZhbGlkYXRvciA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgLy8gdGhpcyBpcyB0aGUgYWN0dWFsIGZ1bmN0aW9uIHRoYXQgaXMgcmV0dXJuZWRcbiAgICB2YXIgdmFsaWRhdG9yRnVuY3Rpb24gPSBmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgIHZhciByZXN1bHQsIFxuICAgICAgICAgICAgcmVzdWx0T2JqZWN0ID0ge30sXG4gICAgICAgICAgICBlcnJvck1lc3NhZ2U7XG5cbiAgICAgICAgLy8gc3BlYyBpcyBjYWxsZWQgb24gdGhlIGFyZ3VtZW50IHdpdGggJ3RoaXMnIHBvaW50aW5nXG4gICAgICAgIC8vIHRvIGFuIGVtcHR5IG9iamVjdCAocmVzdWx0T2JqZWN0KSxcbiAgICAgICAgLy8gbm90ZSB0aGUgdmFsaWRhdG9yIHdpbGwgcmV0dXJuIGVpdGhlciB0cnVlIG9yIGZhbHNlXG4gICAgICAgIHJlc3VsdCA9IHNwZWMuY2FsbChyZXN1bHRPYmplY3QsIGFyZyk7XG5cbiAgICAgICAgLy8gaWYgaXQncyBmYWxzZSwgdGhlIHBhcmFtZXRlciBoYXMgZmFpbGVkIHZhbGlkYXRpb25cbiAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgIC8vIHRocm93IHRoZSBlcnJvclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gcmVzdWx0T2JqZWN0Lm1lc3NhZ2UgfHxcbiAgICAgICAgICAgICAgICBcInZhbGlkYXRvciBmYWlsZWQgd2l0aCBwYXJhbWV0ZXIgXCIgKyBhcmc7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvLyBzZWU/IGFsbCB0aGF0J3MgYmVpbmcgcmV0dXJuZWQgaXMgYSBmdW5jdGlvblxuICAgIC8vIGFsc28gbm90ZSB0aGF0IHNpbmNlICd0aGlzJyBpcyBuZXZlciB1c2VkLFxuICAgIC8vIHdlIGNhbiBjYWxsIHRoaXMgY29uc3RydWN0b3Igd2l0aCBvciB3aXRob3V0ICduZXcnXG4gICAgcmV0dXJuIHZhbGlkYXRvckZ1bmN0aW9uO1xufTtcblxuLyoqXG4gKiBUaGlzIHN0YXRpYyBmdW5jdGlvbiBhZGRzIGEgbmFtZWQgdmFsaWRhdG9yIHRvIHRoZSBsaXN0IG9mXG4gKiB2YWxpZGF0b3JzLiBUaGUgc2Vjb25kIGFyZ3VtZW50IGlzIGEgdmFsaWRhdGlvbiBmdW5jdGlvblxuICogdGhhdCBzaW1wbHkgcmV0dXJucyBhIFZhbGlkYXRvciBmdW5jdGlvbiBjcmVhdGVkIGFzIGFib3ZlLlxuICpcbiAqIFRoZSBuaWNlIHRoaW5nIGFib3V0IGFkZGluZyBhIFZhbGlkYXRvciB0aGlzIHdheSBpcyB0aGF0XG4gKiB5b3UgY2FuIGFjdHVhbGx5IHZhbGlkYXRlIHRoZSBwYXJhbWV0ZXIgc2VudCB0byB0aGUgdmFsaWRhdG9yIVxuICogV2h5IG1pZ2h0IHRoYXQgYmUgaW1wb3J0YW50PyBXZWxsLCBjb25zaWRlciB0aGUgZm9sbG93aW5nOlxuICpcbiAqIHZhciBpc0dyZWF0ZXJUaGFuSW50ZWdlciA9IG5ldyBWYWxpZGF0b3IoZnVuY3Rpb24gKHZhbCkge1xuICogICAgIHRoaXMubWVzc2FnZSA9IHRoaXMucGFyYW0gKyBcIiBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIFwiICsgdmFsO1xuICogICAgIHJldHVybiB0aGlzLnBhcmFtID4gdmFsO1xuICogfSk7XG4gKlxuICogTm93IHdlIGNhbiBjYWxsIGlzR3JlYXRlclRoYW5OdW1iZXIgbGlrZSB0aGlzOlxuICpcbiAqIGlzR3JlYXRlclRoYW5OdW1iZXIoNSkoNik7IC8vIHdpbGwgcGFzcyB2YWxpZGF0aW9uXG4gKiBpc0dyZWF0ZXJUaGFuTnVtYmVyKDUpKDMpOyAvLyB3aWxsIHRocm93XG4gKiBpc0dyZWF0ZXJUaGFuTnVtYmVyKFwiZG9nXCIpKDMpOyAvLyA/Pz9cbiAqXG4gKiBTbyB3ZSBuZWVkIHRvIGNvbmZpcm0gdGhhdCB0aGUgdXNlciBzZW5kcyBpbiBhbiBpbnRlZ2VyIGFzIGEgcGFyYW1ldGVyLlxuICogWW91IG1pZ2h0IHdhbnQgdG8gdHJ5IHNvbWV0aGluZyBsaWtlIHRoaXM6XG4gKlxuICogdmFyIGlzR3JlYXRlclRoYW5JbnRlZ2VyID0gbmV3IFZhbGlkYXRvcihmdW5jdGlvbiAodmFsKSB7XG4gKiAgICAgaWYgKHR5cGVvZih2YWwpICE9PSBcIm51bWJlclwiKSB0aHJvdyBFcnJvcihcIk5vdCBjb29sIVwiKTtcbiAqICAgICB0aGlzLm1lc3NhZ2UgPSB0aGlzLnBhcmFtICsgXCIgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiBcIiArIHZhbDtcbiAqICAgICByZXR1cm4gdGhpcy5wYXJhbSA+IHZhbDtcbiAqIH0pO1xuICpcbiAqIFRoaXMgd2lsbCBhY3R1YWxseSB3b3JrIG9uIHRoZSBleGFtcGxlIGFib3ZlOlxuICpcbiAqIGlzR3JlYXRlclRoYW5OdW1iZXIoXCJkb2dcIikoMyk7IC8vIHRocm93cyBlcnJvciBub3dcbiAqXG4gKiBUaGUgcHJvYmxlbSBpcyB0aGF0IHdpdGggSmVybWFpbmUsIHdlIGNyZWF0ZSB0aGUgdmFsaWRhdG9yXG4gKiBhbmQgdGhlbiBkb24ndCBhY3R1YWxseSBjYWxsIGl0IHVudGlsIGFuIGF0dHJpYnV0ZSBpcyBhYm91dCB0byBiZVxuICogc2V0LiBTbywgaW4gb3RoZXIgd29yZHM6XG4gKlxuICogdmFyIGEgPSBuZXcgQXR0cihcInRoaW5nXCIpLndoaWNoLmlzR3JlYXRlclRoYW5OdW1iZXIoXCJkb2dcIik7IC8vbm8gZXJyb3IgKHlldClcbiAqXG4gKiB3aWxsIG5vdCBjYXVzZSBhbiBlcnJvciB1bnRpbCBpdCdzIGF0dGFjaGVkIHRvIGFuIG9iamVjdCBhbmQgdGhpbmdcbiAqIGlzIGF0dGVtcHRlZCB0byBiZSBzZXQuXG4gKlxuICogU28gYSB0ZW1wb3Jhcnkgd29ya2Fyb3VuZCBpcyB0byB2YWxpZGF0ZSB0aGUgdmFsaWRhdG9yIGluIHRoZVxuICogYWRkVmFsaWRhdG9yIGZ1bmN0aW9uIGJlbG93LiBUaGF0J3MgaGFuZGxlZCBieSB0aGUgYXJnVmFsaWRhdG9yXG4gKiB2YWxpZGF0b3IuIChQaGV3LCB0aGlzIGlzIGdldHRpbmcgcmVhbGx5IG1ldGEpXG4gKlxuICogSSdtIG5vdCBzdXJlIHRoaXMgaXMgdGhlIGJlc3Qgc29sdXRpb24uIFNlZW1zIGxpa2UgdGhlcmUgc2hvdWxkIGJlXG4gKiBhIHdheSB0byB2YWxpZGF0ZSB0aGUgYXJndW1lbnQgaW4gdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLCBidXRcbiAqIHRoYXQgbWlnaHQgcmVxdWlyZSBzb21lIHJld2lyaW5nIHRoYXQgYnJlYWtzIG11bHRpZ3JhcGguIFRoaXMgaXNcbiAqIHRoZSBiZXN0IEkgY291bGQgY29tZSB1cCB3aXRoIGZvciBub3cuXG4gKlxuICogQG5hbWUgVGhlIG5hbWUgb2YgdGhlIHZhbGlkYXRvciBmb3IgdGhlIGF0dHJpYnV0ZSwgbXVzdCBiZSBhIHN0cmluZ1xuICogICAgICAgb3IgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd25cbiAqXG4gKiBAdiBUaGUgdmFsaWRhdG9yIHNwZWNpZmljYXRpb24gKHJldHVybnMgYSBib29sZWFuKVxuICogICAgbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duXG4gKlxuICogQGFyZ1ZhbGlkYXRvciBvcHRpb25hbCBmdW5jdGlvbiB0aGF0IGNoZWNrcyB0aGUgdHlwZXMgb2YgYXJncyBzZW50XG4gKiAgICAgICAgICAgdG8gdGhlIHZhbGlkYXRvciwgbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duXG4gKlxuICogU28gYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24gaW4gdGhlIGNhc2VzIHRoYXQgXCJuYW1lXCIgaXMgbm90IGEgc3RyaW5nLFxuICogdiBpcyBub3QgYSBmdW5jdGlvbiwgYXJnVmFsaWRhdG9yIGlzIG5vdCBhIGZ1bmN0aW9uLCBvciBpZiB0aGUgc3RhdGljXG4gKiB2YWxpZGF0b3IgaXMgYWxyZWFkeSBkZWZpbmVkLlxuICovXG5WYWxpZGF0b3IuYWRkVmFsaWRhdG9yID0gZnVuY3Rpb24gKG5hbWUsIHYsIGFyZ1ZhbGlkYXRvcikge1xuICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQgfHwgdHlwZW9mKG5hbWUpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImFkZFZhbGlkYXRvciByZXF1aXJlcyBhIG5hbWUgdG8gYmUgc3BlY2lmaWVkIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcIik7XG4gICAgfVxuXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YodikgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhZGRWYWxpZGF0b3IgcmVxdWlyZXMgYSBmdW5jdGlvbiBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlclwiKTtcbiAgICB9XG5cbiAgICAvLyBvcHRpb25hbCB0aGlyZCBhcmd1bWVudCB0byB2YWxpZGF0ZSB0aGUgXG4gICAgLy8gZXhwZWN0ZWQgdmFsdWUgdGhhdCBnZXRzIHNlbnQgdG8gdGhlIHZhbGlkYXRvclxuICAgIC8vIGZvciBleGFtcGxlLCBpc0EoXCJudW1iZXJcIikgd29ya3MgYnV0IGlzQShcIm5tYmVyXCIpXG4gICAgLy8gZG9lc24ndCB3b3JrXG4gICAgaWYgKGFyZ1ZhbGlkYXRvciAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZihhcmdWYWxpZGF0b3IpICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYWRkVmFsaWRhdG9yIHRoaXJkIG9wdGlvbmFsIGFyZ3VtZW50IG11c3QgYmUgYSBcIitcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25cIik7XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRvcnNbbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWxpZGF0b3JzW25hbWVdID0gZnVuY3Rpb24gKGV4cGVjdGVkKSB7XG4gICAgICAgICAgICBpZiAoYXJnVmFsaWRhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ1ZhbGlkYXRvcihleHBlY3RlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIChcIlZhbGlkYXRvcjogSW52YWxpZCBhcmd1bWVudCBmb3IgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgKyBcIiB2YWxpZGF0b3JcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBWYWxpZGF0b3IoZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHRPYmplY3QgPSB7XCJhY3R1YWxcIjp2YWwsIFwicGFyYW1cIjp2YWx9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB2LmNhbGwocmVzdWx0T2JqZWN0LCBleHBlY3RlZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gcmVzdWx0T2JqZWN0Lm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRvciAnXCIgKyBuYW1lICtcIicgYWxyZWFkeSBkZWZpbmVkXCIpO1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBHZXQgdGhlIGJ1aWx0LWluIHZhbGlkYXRvciBieSBpdHMgbmFtZS5cbiAqXG4gKiBAbmFtZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG5hbWUgb2YgdGhlIHZhbGlkYXRvciB0byByZXR1cm5cbiAqIFxuICogdGhyb3dzIGFuIGVycm9yIGlmIG5hbWUgaXMgbm90IGEgc3RyaW5nXG4gKi9cblZhbGlkYXRvci5nZXRWYWxpZGF0b3IgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciByZXN1bHQ7XG5cbiAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRvcjogZ2V0VmFsaWRhdG9yIG1ldGhvZCByZXF1aXJlcyBhIHN0cmluZyBwYXJhbWV0ZXJcIik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgKG5hbWUpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRvcjogcGFyYW1ldGVyIHRvIGdldFZhbGlkYXRvciBtZXRob2QgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICB9XG5cbiAgICByZXN1bHQgPSB2YWxpZGF0b3JzW25hbWVdO1xuXG4gICAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRvcjogJ1wiICsgbmFtZSArIFwiJyBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG5cbi8qKlxuICogcmV0dXJuIGFuIGFycmF5IG9mIG9mIHN0YXRpYyB2YWxpZGF0b3IgbmFtZXNcbiAqL1xuVmFsaWRhdG9yLnZhbGlkYXRvcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHByb3AsXG4gICAgICAgIHJlc3VsdCA9IFtdO1xuICAgIGZvciAocHJvcCBpbiB2YWxpZGF0b3JzKSB7XG4gICAgICAgIGlmICh2YWxpZGF0b3JzLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChwcm9wKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEJ1aWx0LUluIHZhbGlkYXRvcnMuIEhvcGVmdWxseSB0aGVzZSBhcmUgc2VsZi1leHBsYW5hdG9yeVxuICogV2lsbCBkb2N1bWVudCB0aGVtIG1vcmUgbGF0ZXIuXG4gKi9cblZhbGlkYXRvci5hZGRWYWxpZGF0b3IoXCJpc0dyZWF0ZXJUaGFuXCIsIGZ1bmN0aW9uICh2YWwpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSB0aGlzLnBhcmFtICsgXCIgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiBcIiArIHZhbDtcbiAgICByZXR1cm4gdGhpcy5wYXJhbSA+IHZhbDtcbn0pO1xuXG5WYWxpZGF0b3IuYWRkVmFsaWRhdG9yKFwiaXNMZXNzVGhhblwiLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gdGhpcy5wYXJhbSArIFwiIHNob3VsZCBiZSBsZXNzIHRoYW4gXCIgKyB2YWw7XG4gICAgcmV0dXJuIHRoaXMucGFyYW0gPCB2YWw7XG59KTtcblxuXG4vLyBUT0RPOiBhZGQgYXJyYXkgdmFsaWRhdGlvbiBmb3IgdmFsXG5WYWxpZGF0b3IuYWRkVmFsaWRhdG9yKFwiaXNPbmVPZlwiLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gdGhpcy5wYXJhbSArIFwiIHNob3VsZCBiZSBvbmUgb2YgdGhlIHNldDogXCIgKyB2YWw7XG4gICAgcmV0dXJuIHZhbC5pbmRleE9mKHRoaXMucGFyYW0pID4gLTE7XG59KTtcblxuLyoqXG4gKiBUaGlzIG9uZSBpcyB0aGUgb25seSBvbmUgdGhhdCB1c2VzIGFuIGFyZ3VtZW50IHZhbGlkYXRvci4gSXQgY29uZmlybXNcbiAqIHRoYXQgdGhlIGFyZ3VtZW50IGlzIGEgcHJpbWl0aXZlIGphdmFzY3JpcHQgdHlwZSBvciBhIG5hbWVkIEplcm1haW5lXG4gKiBtb2RlbC5cbiAqL1xuVmFsaWRhdG9yLmFkZFZhbGlkYXRvcihcImlzQVwiLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgdmFyIHR5cGVzID0gW1wic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiYm9vbGVhblwiLCBcImZ1bmN0aW9uXCIsIFwib2JqZWN0XCJdLFxuICAgICAgICBtb2RlbHMgPSBNb2RlbC5nZXRNb2RlbHMoKTtcbiAgICBpZiAodHlwZW9mKHZhbCkgPT09IFwic3RyaW5nXCIgJiYgdHlwZXMuaW5kZXhPZih2YWwpID4gLTEpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gdGhpcy5wYXJhbSArIFwiIHNob3VsZCBiZSBhIFwiICsgdmFsO1xuICAgICAgICByZXR1cm4gdHlwZW9mKHRoaXMucGFyYW0pID09PSB2YWw7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YodmFsKSA9PT0gXCJzdHJpbmdcIiAmJiBtb2RlbHMuaW5kZXhPZih2YWwpID4gLTEpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gXCJwYXJhbWV0ZXIgc2hvdWxkIGJlIGFuIGluc3RhbmNlIG9mIFwiICsgdmFsO1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbSBpbnN0YW5jZW9mIE1vZGVsLmdldE1vZGVsKHZhbCk7XG4gICAgfSBlbHNlIGlmICh2YWwgPT09ICdpbnRlZ2VyJykge1xuICAgICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yICdpbnRlZ2VyJzsgc2luY2UgamF2YXNjcmlwdCBoYXMgbm8gaW50ZWdlciB0eXBlLFxuICAgICAgICAvLyBqdXN0IGNoZWNrIGZvciBudW1iZXIgdHlwZSBhbmQgY2hlY2sgdGhhdCBpdCdzIG51bWVyaWNhbGx5IGFuIGludFxuICAgICAgICBpZiAodGhpcy5wYXJhbS50b1N0cmluZyAhPT0gdW5kZWZpbmVkKSAge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gdGhpcy5wYXJhbS50b1N0cmluZygpICsgXCIgc2hvdWxkIGJlIGFuIGludGVnZXJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IFwicGFyYW1ldGVyIHNob3VsZCBiZSBhbiBpbnRlZ2VyXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICh0eXBlb2YodGhpcy5wYXJhbSkgPT09ICdudW1iZXInKSAmJiAocGFyc2VJbnQodGhpcy5wYXJhbSwxMCkgPT09IHRoaXMucGFyYW0pO1xuICAgIH0gLyplbHNlIGlmICh0eXBlb2YodmFsKSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRvcjogaXNBIGFjY2VwdHMgYSBzdHJpbmcgd2hpY2ggaXMgb25lIG9mIFwiICsgdHlwZXMpO1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmFsaWRhdG9yOiBpc0Egb25seSBhY2NlcHRzIGEgc3RyaW5nIGZvciBhIHByaW1pdGl2ZSB0eXBlcyBmb3IgdGhlIHRpbWUgYmVpbmdcIik7XG4gICAgICAgfSovXG59LFxuICAgICAgICAgICAgICAgICAgICAgICAvL2FyZ3VtZW50IHZhbGlkYXRvclxuICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZXNBbmRNb2RlbHMgPSBbXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJib29sZWFuXCIsIFwiZnVuY3Rpb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9iamVjdFwiLCBcImludGVnZXJcIl0uY29uY2F0KE1vZGVsLmdldE1vZGVscygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlc0FuZE1vZGVscy5pbmRleE9mKHZhbCkgPj0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cblxuLy8gZ3JhbW1hdGljYWwgYWxpYXMgZm9yIGlzQVxudmFsaWRhdG9ycy5pc0FuID0gdmFsaWRhdG9ycy5pc0E7XG5cbm1vZHVsZS5leHBvcnRzID0gVmFsaWRhdG9yO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnJlcXVpcmUoJy4vaW5kZXhfb2YuanMnKTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXMsXG4gICAgICAgIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgLy9hbiByZWdpc3RlcnMgZXZlbnQgYW5kIGEgbGlzdGVuZXJcbiAgICB0aGlzLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAodHlwZW9mKGV2ZW50KSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXZlbnRFbWl0dGVyOiBmaXJzdCBhcmd1bWVudCB0byAnb24nIHNob3VsZCBiZSBhIHN0cmluZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mKGxpc3RlbmVyKSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFdmVudEVtaXR0ZXI6IHNlY29uZCBhcmd1bWVudCB0byAnb24nIHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbGlzdGVuZXJzW2V2ZW50XSkge1xuICAgICAgICAgICAgbGlzdGVuZXJzW2V2ZW50XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGxpc3RlbmVyc1tldmVudF0ucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiB0aGF0O1xuICAgIH07XG5cbiAgICAvL2FsaWFzIGFkZExpc3RlbmVyXG4gICAgdGhpcy5hZGRMaXN0ZW5lciA9IHRoaXMub247XG4gICAgXG4gICAgdGhpcy5vbmNlID0gZnVuY3Rpb24gKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxpc3RlbmVyKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB0aGF0LnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGF0Lm9uKGV2ZW50LCBmKTtcbiAgICAgICAgcmV0dXJuIHRoYXQ7XG4gICAgfTtcblxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBpbmRleDtcblxuICAgICAgICBpZiAodHlwZW9mKGV2ZW50KSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXZlbnRFbWl0dGVyOiBmaXJzdCBwYXJhbWV0ZXIgdG8gcmVtb3ZlTGlzdGVuZXIgbWV0aG9kIG11c3QgYmUgYSBzdHJpbmcgcmVwcmVzZW50aW5nIGFuIGV2ZW50XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YobGlzdGVuZXIpICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV2ZW50RW1pdHRlcjogc2Vjb25kIHBhcmFtZXRlciBtdXN0IGJlIGEgZnVuY3Rpb24gdG8gcmVtb3ZlIGFzIGFuIGV2ZW50IGxpc3RlbmVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaXN0ZW5lcnNbZXZlbnRdID09PSB1bmRlZmluZWQgfHwgbGlzdGVuZXJzW2V2ZW50XS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV2ZW50RW1pdHRlcjogdGhlcmUgYXJlIG5vIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciB0aGUgJ1wiICsgZXZlbnQgKyBcIicgZXZlbnRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpbmRleCA9IGxpc3RlbmVyc1tldmVudF0uaW5kZXhPZihsaXN0ZW5lcik7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgLy9yZW1vdmUgaXQgZnJvbSB0aGUgbGlzdFxuICAgICAgICAgICAgbGlzdGVuZXJzW2V2ZW50XS5zcGxpY2UoaW5kZXgsMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhhdDtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZihldmVudCkgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV2ZW50RW1pdHRlcjogcGFyYW1ldGVyIHRvIHJlbW92ZUFsbExpc3RlbmVycyBzaG91bGQgYmUgYSBzdHJpbmcgcmVwcmVzZW50aW5nIGFuIGV2ZW50XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxpc3RlbmVyc1tldmVudF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbGlzdGVuZXJzW2V2ZW50XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhhdDtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICByZXR1cm4gdGhhdDtcbiAgICB9O1xuXG4gICAgLy9nZXQgdGhlIGxpc3RlbmVycyBmb3IgYW4gZXZlbnRcbiAgICB0aGlzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAodHlwZW9mKGV2ZW50KSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV2ZW50RW1pdHRlcjogbGlzdGVuZXJzIG1ldGhvZCBtdXN0IGJlIGNhbGxlZCB3aXRoIHRoZSBuYW1lIG9mIGFuIGV2ZW50XCIpO1xuICAgICAgICB9IGVsc2UgaWYgKGxpc3RlbmVyc1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaXN0ZW5lcnNbZXZlbnRdO1xuICAgIH07XG5cbiAgICAvL2V4ZWN1dGUgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIGluIG9yZGVyIHdpdGggdGhlIHNwZWNpZmllZCBhcmd1bWVudHNcbiAgICB0aGlzLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBwYXJhbXM7XG5cblxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHBhcmFtcyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgcGFyYW1zLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsaXN0ZW5lcnNbZXZlbnRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnNbZXZlbnRdLmxlbmd0aDsgaT1pKzEpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbZXZlbnRdW2ldLmFwcGx5KHRoaXMsIHBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoYXQ7XG59OyAvL2VuZCBFdmVudEVtaXR0ZXJcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG4iLCJpZiAoIUFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCAvKiwgZnJvbUluZGV4ICovICkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgICAgaWYgKHRoaXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdCA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgdmFyIGxlbiA9IHQubGVuZ3RoID4+PiAwO1xuICAgICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG4gPSAwO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG4gPSBOdW1iZXIoYXJndW1lbnRzWzFdKTtcbiAgICAgICAgICAgIGlmIChuICE9PSBuKSB7IC8vIHNob3J0Y3V0IGZvciB2ZXJpZnlpbmcgaWYgaXQncyBOYU5cbiAgICAgICAgICAgICAgICBuID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobiAhPT0gMCAmJiBuICE9PSBJbmZpbml0eSAmJiBuICE9PSAtSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICBuID0gKG4gPiAwIHx8IC0xKSAqIE1hdGguZmxvb3IoTWF0aC5hYnMobikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuID49IGxlbikge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrID0gbiA+PSAwID8gbiA6IE1hdGgubWF4KGxlbiAtIE1hdGguYWJzKG4pLCAwKTtcbiAgICAgICAgZm9yICg7IGsgPCBsZW47IGsrKykge1xuICAgICAgICAgICAgaWYgKGsgaW4gdCAmJiB0W2tdID09PSBzZWFyY2hFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdW5kZWZpbmVkO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBuYW1lc3BhY2UgKG5zLCBhbGlhc2VzLCBmdW5jKSB7XG4gICAgdmFyIG5zUmVnRXhwID0gL14oW2EtekEtWl0rKShcXC5bYS16QS1aXSopKiQvLFxuICAgICAgICBuc0FycmF5LFxuICAgICAgICBjdXJyZW50TlMsXG4gICAgICAgIGk7XG5cbiAgICAvL2NoZWNrIHRvIGFzc3VyZSBucyBpcyBhIHByb3Blcmx5IGZvcm1hdHRlZCBuYW1lc3BhY2Ugc3RyaW5nXG4gICAgaWYgKG5zLm1hdGNoKG5zUmVnRXhwKSA9PT0gbnVsbCB8fCBucyA9PT0gXCJ3aW5kb3dcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYW1lc3BhY2U6IFwiICsgbnMgKyBcIiBpcyBhIG1hbGZvcm1lZCBuYW1lc3BhY2Ugc3RyaW5nXCIpO1xuICAgIH1cblxuICAgIC8vY2hlY2sgdG8gYXNzdXJlIHRoYXQgaWYgYWxpYXMgaXMgZGVmaW5lZCB0aGF0IGZ1bmMgaXMgZGVmaW5lZFxuICAgIGlmIChhbGlhc2VzICE9PSB1bmRlZmluZWQgJiYgZnVuYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgKGFsaWFzZXMpID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGZ1bmMgPSBhbGlhc2VzO1xuICAgICAgICAgICAgYWxpYXNlcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGFsaWFzZXMpID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYW1lc3BhY2U6IGlmIHNlY29uZCBhcmd1bWVudCBleGlzdHMsIGZpbmFsIGZ1bmN0aW9uIGFyZ3VtZW50IG11c3QgZXhpc3RcIik7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChhbGlhc2VzKSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibmFtZXNwYWNlOiBzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3Qgb2YgYWxpYXNlZCBsb2NhbCBuYW1lc3BhY2VzXCIpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgKGFsaWFzZXMpICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiAoZnVuYykgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYW1lc3BhY2U6IHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGFuIG9iamVjdCBvZiBhbGlhc2VkIGxvY2FsIG5hbWVzcGFjZXNcIik7XG4gICAgfVxuXG4gICAgLy9wYXJzZSBuYW1lc3BhY2Ugc3RyaW5nXG4gICAgbnNBcnJheSA9IG5zLnNwbGl0KFwiLlwiKTtcblxuICAgIC8vc2V0IHRoZSByb290IG5hbWVzcGFjZSB0byB3aW5kb3cgKGlmIGl0J3Mgbm90IGV4cGxpY3RseSBzdGF0ZWQpXG4gICAgaWYgKG5zQXJyYXlbMF0gPT09IFwid2luZG93XCIpIHtcbiAgICAgICAgY3VycmVudE5TID0gd2luZG93O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnROUyA9ICh3aW5kb3dbbnNBcnJheVswXV0gPT09IHVuZGVmaW5lZCkgPyB3aW5kb3dbbnNBcnJheVswXV0gPSB7fSA6IHdpbmRvd1tuc0FycmF5WzBdXTtcbiAgICB9XG5cbiAgICAvL2NvbmZpcm0gZnVuYyBpcyBhY3R1YWxseSBhIGZ1bmN0aW9uXG4gICAgaWYgKGZ1bmMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgKGZ1bmMpICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibmFtZXNwYWNlOiBsYXN0IHBhcmFtZXRlciBtdXN0IGJlIGEgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIGEgbmFtZXNwYWNlIHBhcmFtZXRlclwiKTtcbiAgICB9XG5cbiAgICAvL2J1aWxkIG5hbWVzcGFjZVxuICAgIGZvciAoaSA9IDE7IGkgPCBuc0FycmF5Lmxlbmd0aDsgaSA9IGkgKyAxKSB7XG4gICAgICAgIGlmIChjdXJyZW50TlNbbnNBcnJheVtpXV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY3VycmVudE5TW25zQXJyYXlbaV1dID0ge307XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudE5TID0gY3VycmVudE5TW25zQXJyYXlbaV1dO1xuICAgIH1cblxuICAgIC8vbmFtZXNwYWNlcy5wdXNoKGN1cnJlbnROUyk7XG4gICAgLy9uYW1lc3BhY2UgPSBjdXJyZW50TlM7XG5cbiAgICAvL2lmIHRoZSBmdW5jdGlvbiB3YXMgZGVmaW5lZCwgYnV0IG5vIGFsaWFzZXMgcnVuIGl0IG9uIHRoZSBjdXJyZW50IG5hbWVzcGFjZVxuICAgIGlmIChhbGlhc2VzID09PSB1bmRlZmluZWQgJiYgZnVuYykge1xuICAgICAgICBmdW5jKGN1cnJlbnROUyk7XG4gICAgfSBlbHNlIGlmIChmdW5jKSB7XG4gICAgICAgIGZvciAoaSBpbiBhbGlhc2VzKSB7XG4gICAgICAgICAgICBpZiAoYWxpYXNlcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGFsaWFzZXNbaV0gPSBuYW1lc3BhY2UoYWxpYXNlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuYy5jYWxsKGFsaWFzZXMsIGN1cnJlbnROUyk7XG4gICAgfVxuXG4gICAgLy9yZXR1cm4gbmFtZXNwYWNlXG4gICAgcmV0dXJuIGN1cnJlbnROUztcbn07XG4iXX0=

/*global describe, it, beforeEach, expect, xit, jasmine */

describe("Model", function () {
    "use strict";
    var Model = window.jermaine.Model,
    Attr = window.jermaine.Attr,
    AttrList = window.jermaine.AttrList,
    Method = window.jermaine.Method,
    Person;


    beforeEach(function () {
        Person = new Model();
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
                b,
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

            expect(spy.calls.length).toEqual(3);
            expect(b.things().at(0)).toBe(0);
            expect(b.things().size()).toBe(10);

            var c = new B();
            expect(c.things).toBeDefined();
            expect(c.things().at(0)).toBe(0);
            expect(c.things().size()).toBe(10);
            
            c.things().add(20);
            expect(c.things().size()).toBe(11);
            expect(a.things().size()).toBe(10);
            expect(b.things().size()).toBe(10);
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
                //console.log("at 1");
                this.hasA("ferret").which.isA(Ferret);
                this.hasA("name").which.isA("string");
                this.isBuiltWith("name");
            });

            //console.log("at 2");
            var Person = new Model(function () {
                console.log("at 3");
                this.hasA("ferret").which.validatesWith(function (ferret) {
                    console.log("at 4");
                    return ferret instanceof Ferret;
                });
                this.hasA("name").which.isA("string");
                this.isBuiltWith("name");
            });

            //console.log("at 5");
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
            //console.log(human.ferret().name());
            //console.log(ferret.owner().name());
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

    describe("isBuiltWith method", function () {
        it("should take any number of string parameters", function () {
            expect(function () {
                Person.isBuiltWith("larry", "moe", 3.4);
            }).toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter"));
            expect(function () {
                Person.isBuiltWith("larry", 3.4, "moe", "curly");
            }).toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter"));
            expect(function () {
                Person.isBuiltWith("larry", "moe", "curly", "semmy", "john");
            }).not.toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter"));
            //s = new Model();
            expect(function () {
                Person.isBuiltWith("larry", "curly", "moe", "semmy", "john", "mark", "anotherMark");
            }).not.toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter"));
        });


        it("should accept a function as an optional final argument", function () {
            var f = function () {
                return true;
            },  g = function () {
                return false;
            };
            expect(function () {
                Person.isBuiltWith("larry", "moe", f, g);
            }).toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter"));
            expect(function () {
                Person.isBuiltWith("larry", "moe", g, "curly", "semmy", "john");
            }).toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter"));
            expect(function () {
                Person.isBuiltWith("larry", f);
            }).not.toThrow(new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter"));
        });

        it("should accept strings preceded with a % as the final parameters before the optional function", function () {
            expect(function () {
                Person.isBuiltWith("larry", "%moe", "curly");
            }).toThrow(new Error("Model: isBuiltWith requires parameters preceded with a % to be the final parameters before the optional function"));
            expect(function () {
                Person.isBuiltWith("larry", "moe", "curly", "%semmy");
            }).not.toThrow(new Error("Model: isBuiltWith requires parameters preceded with a % to be the final parameters before the optional function"));
            expect(function () {
                Person.isBuiltWith("larry", "moe", "curly", "%semmy", "%john", function () { return false; });
            }).not.toThrow(new Error("Model: isBuiltWith requires parameters preceded with a % to be the final parameters before the optional function"));
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

        it("should throw an error if the object is immutable and any of the attributes aren't required in isBuiltWith", function () {
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

        it("should throw an error if any of the strings are not defined as attributes but are specified in isBuiltWith", function () {
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

        it("should throw an error if the constructor is called with more arguments than isBuiltWith specifies", function () {
            
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

        it("should allow for AttrList attributes to be specified by isBuiltWith and initialized with a raw array", function () {
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


    it("should throw an error if the constructor is not called with the new operator", function () {
        var p;

        expect(function () {
            /*jshint newcap:false */
            p = Person();
        }).toThrow("Model: instances must be created using the new operator");

        
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

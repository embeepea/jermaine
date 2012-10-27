if(!Array.prototype.indexOf){Array.prototype.indexOf=function(c){if(this==null){throw new TypeError()}var d=Object(this);var a=d.length>>>0;if(a===0){return -1}var e=0;if(arguments.length>0){e=Number(arguments[1]);if(e!=e){e=0}else{if(e!=0&&e!=Infinity&&e!=-Infinity){e=(e>0||-1)*Math.floor(Math.abs(e))}}}if(e>=a){return -1}var b=e>=0?e:Math.max(a-Math.abs(e),0);for(;b<a;b++){if(b in d&&d[b]===c){return b}}return -1}}(function(b){var a=function(f,c,h){var j=/^([a-zA-Z]+)(\.[a-zA-Z]*)*$/,g,e,d;if(f.match(j)===null||f==="window"){throw new Error("namespace: "+f+" is a malformed namespace string")}if(c!==undefined&&h===undefined){if(typeof(c)==="function"){h=c;c=undefined}else{if(typeof(c)==="object"){throw new Error("namespace: if second argument exists, final function argument must exist")}else{if(typeof(c)!=="object"){throw new Error("namespace: second argument must be an object of aliased local namespaces")}}}}else{if(typeof(c)!=="object"&&typeof(h)==="function"){throw new Error("namespace: second argument must be an object of aliased local namespaces")}}g=f.split(".");if(g[0]==="window"){e=window}else{e=(window[g[0]]===undefined)?window[g[0]]={}:window[g[0]]}if(h!==undefined&&typeof(h)!=="function"){throw new Error("namespace: last parameter must be a function that accepts a namespace parameter")}for(d=1;d<g.length;d=d+1){if(e[g[d]]===undefined){e[g[d]]={}}e=e[g[d]]}if(c===undefined&&h){h(e)}else{if(h){for(d in c){if(c.hasOwnProperty(d)){c[d]=a(c[d])}}h.call(c,e)}}return e};return a(b,function(c){c.namespace=a})}("window.jermaine.util"));window.jermaine.util.namespace("window.jermaine",function(c){var d=this,b,a={};b=function(e){var f=function(h){var g,j={},i;g=e.call(j,h);if(!g){i=j.message||"validator failed with parameter "+h;throw new Error(i)}return g};return f};b.addValidator=function(f,e){if(f===undefined||typeof(f)!=="string"){throw new Error("addValidator requires a name to be specified as the first parameter")}if(e===undefined||typeof(e)!=="function"){throw new Error("addValidator requires a function as the second parameter")}if(a[f]===undefined){a[f]=function(g){return new b(function(j){var i={actual:j,param:j},h=e.call(i,g);this.message=i.message;return h})}}else{throw new Error("Validator '"+f+"' already defined")}};b.getValidator=function(f){var e;if(f===undefined){throw new Error("Validator: getValidator method requires a string parameter")}else{if(typeof(f)!=="string"){throw new Error("Validator: parameter to getValidator method must be a string")}}e=a[f];if(e===undefined){throw new Error("Validator: '"+f+"' does not exist")}return e};b.validators=function(){var f,e=[];for(f in a){if(a.hasOwnProperty(f)){e.push(f)}}return e};b.addValidator("isGreaterThan",function(e){this.message=this.param+" should be greater than "+e;return this.param>e});b.addValidator("isLessThan",function(e){this.message=this.param+" should be less than "+e;return this.param<e});b.addValidator("isA",function(f){var e=["string","number","boolean","function","object"];if(typeof(f)==="string"&&e.indexOf(f)>-1){this.message=this.param+" should be a "+f;return typeof(this.param)===f}else{if(f==="integer"){if(this.param.toString!==undefined){this.message=this.param.toString()+" should be an integer"}else{this.message="parameter should be an integer"}return(typeof(this.param)==="number")&&(parseInt(this.param,10)===this.param)}else{if(typeof(f)==="string"){throw new Error("Validator: isA accepts a string which is one of "+e)}else{throw new Error("Validator: isA only accepts a string for a primitive types for the time being")}}}});a.isAn=a.isA;b.addValidator("isOneOf",function(e){this.message=this.param+" should be one of the set: "+e;return e.indexOf(this.param)>-1});c.Validator=b});window.jermaine.util.namespace("window.jermaine",function(b){var a={};var c=function(g){var j=[],n=this,o="invalid setter call for "+g,k,l,m,f,d,p=false,e,q=window.jermaine.AttrList,h=window.jermaine.Validator;e=function(i){for(m=0;m<j.length;++m){j[m](i)}return true};l=function(){return(typeof(k)==="function")?k():k};if(g===undefined||typeof(g)!=="string"){throw new Error("Attr: constructor requires a name parameter which must be a string")}this.validatesWith=function(i){if(typeof(i)==="function"){j.push(new h(i));return this}else{throw new Error("Attr: validator must be a function")}};this.defaultsTo=function(i){k=i;return this};this.isImmutable=function(){p=true;return this};this.isMutable=function(){p=false;return this};this.clone=function(){var r=(this instanceof q)?new q(g):new c(g),s;for(s=0;s<j.length;++s){r.validatesWith(j[s])}r.defaultsTo(k);if(p){r.isImmutable()}return r};this.and=this;this.which=this;this.eachOfWhich=this;this.validator=function(){return e};this.addTo=function(s){var r,i;if(!s||typeof(s)!=="object"){throw new Error("Attr: addAttr method requires an object parameter")}i=l();if(i!==undefined&&e(i)){r=i}else{if(i!==undefined&&!e(i)){throw new Error("Attr: Default value of "+i+" does not pass validation for "+g)}}s[g]=function(t){if(t!==undefined){if(p&&r!==undefined){throw new Error("cannot set the immutable property "+g+" after it has been set")}else{if(!e(t)){throw new Error(o)}else{r=t}}return s}else{return r}}};d=function(i){n[i]=function(r){j.push(h.getValidator(i)(r));return n}};for(m=0;m<h.validators().length;++m){d(h.validators()[m])}};b.Attr=c});window.jermaine.util.namespace("window.jermaine",function(a){function b(c){var e=this;a.Attr.call(this,c);var d=function(g,f){return function(){return g[f].apply(g,arguments)}};this.validateWith=this.validatesWith;this.defaultsTo=function(){};this.isImmutable=function(){};this.isMutable=function(){};this.addTo=function(h){var i,f=[],g={};if(!h||typeof(h)!=="object"){throw new Error("AttrList: addTo method requires an object parameter")}else{g.pop=d(f,"pop");g.add=function(j){if((e.validator())(j)){f.push(j);return this}else{throw new Error(e.errorMessage())}};g.replace=function(j,k){if((typeof(j)!=="number")||(parseInt(j,10)!==j)){throw new Error("AttrList: replace method requires index parameter to be an integer")}if(j<0||j>=this.size()){throw new Error("AttrList: replace method index parameter out of bounds")}if(!(e.validator())(k)){throw new Error(e.errorMessage())}f[j]=k;return this};g.at=function(j){if(j<0||j>=this.size()){throw new Error("AttrList: Index out of bounds")}return f[j]};g.get=g.at;g.size=function(){return f.length};h[c]=function(){return g}}}}b.prototype=new window.jermaine.Attr(name);a.AttrList=b});window.jermaine.util.namespace("window.jermaine",function(a){var b=function(c,d){if(!c||typeof(c)!=="string"){throw new Error("Method: constructor requires a name parameter which must be a string")}else{if(!d||typeof(d)!=="function"){throw new Error("Method: second parameter must be a function")}}this.addTo=function(e){if(!e||typeof(e)!=="object"){throw new Error("Method: addTo method requires an object parameter")}e[c]=d}};a.Method=b});window.jermaine.util.namespace("window.jermaine",function(a){function b(u){var h=this,q={},i={},p,f=true,d=[],n=[],r=[],c=a.Method,s=a.Attr,l=a.AttrList,g,v,k,j,t=function(){},o=function(){},e=function(){if(f){k()}return o.apply(this,arguments)};if(arguments.length>1){u=arguments[arguments.length-1]}if(u&&typeof(u)==="function"){e=new b();u.call(e);return e}else{if(u){throw new Error("Model: specification parameter must be a function")}}var m=function(y,x){var A=y==="Attr"?s:l,w=y==="Attr"?"hasA":"hasMany",z;f=true;if(typeof(x)==="string"){z=new A(x);i[x]=z;return z}else{throw new Error("Model: "+w+" parameter must be a string")}};g=function(y,x){var w;if(typeof(x)!=="string"){throw new Error("Model: expected string argument to "+y+" method, but recieved "+x)}w=y==="attribute"?i[x]:q[x];if(w===undefined){throw new Error("Model: "+y+" "+x+" does not exist!")}return w};v=function(y){var x,z=[],w=y==="attributes"?i:q;for(x in w){if(w.hasOwnProperty(x)){z.push(x)}}return z};k=function(w){var z=this,x,y;e.validate();o=function(){var B,A;if(!(this instanceof e)){throw new Error("Model: instances must be created using the new operator")}A=function(F,E){var D=E==="attributes"?i:q,C;for(C in D){if(D.hasOwnProperty(C)){if(D===i&&j){D[C].isImmutable()}D[C].addTo(F)}}};A(this,"attributes");A(this,"methods");this.toString=p;if(arguments.length>0){if(arguments.length<d.length){y="Constructor requires ";for(B=0;B<d.length;++B){y+=d[B];y+=B===d.length-1?"":", "}y+=" to be specified";throw new Error(y)}if(arguments.length>d.length+n.length){throw new Error("Too many arguments to constructor. Expected "+d.length+" required arguments and "+n.length+" optional arguments")}else{for(B=0;B<arguments.length;++B){if(B<d.length){this[d[B]](arguments[B])}else{this[n[B-d.length]](arguments[B])}}}}t.call(this)};return o};e.hasA=function(w){return m("Attr",w)};e.hasAn=e.hasA;e.hasSome=e.hasA;e.hasMany=function(w){return m("AttrList",w)};e.isA=function(y){var x,w,A,z;f=true;z=function(C){var B,D=new b();for(B in D){if(D.hasOwnProperty(B)&&typeof(C[B])!==typeof(D[B])){return false}}return true};if(typeof(y)!=="function"||!z(y)){throw new Error("Model: parameter sent to isA function must be a Model")}if(r.length===0){r.push(y)}else{throw new Error("Model: Model only supports single inheritance at this time")}w=r[0].attributes();for(x=0;x<w.length;++x){if(i[w[x]]===undefined){i[w[x]]=r[0].attribute(w[x]).clone();i[w[x]].isMutable()}}A=r[0].methods();for(x=0;x<A.length;++x){if(q[A[x]]===undefined){q[A[x]]=r[0].method(A[x])}}for(x=0;x<r.length;x++){e.prototype=new r[x]()}};e.isAn=e.isA;e.parent=function(){return r[0].apply(this,arguments)};e.attribute=function(w){return g("attribute",w)};e.attributes=function(){return v("attributes")};e.method=function(w){return g("method",w)};e.methods=function(){return v("methods")};e.isBuiltWith=function(){var w=false,x;f=true;d=[];n=[];for(x=0;x<arguments.length;++x){if(typeof(arguments[x])==="string"&&arguments[x].charAt(0)!=="%"){if(w){throw new Error("Model: isBuiltWith requires parameters preceded with a % to be the final parameters before the optional function")}else{d.push(arguments[x])}}else{if(typeof(arguments[x])==="string"&&arguments[x].charAt(0)==="%"){w=true;n.push(arguments[x].slice(1))}else{if(typeof(arguments[x])==="function"&&x===arguments.length-1){t=arguments[x]}else{throw new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter")}}}}};e.isImmutable=function(){j=true};e.looksLike=function(w){f=true;p=w};e.respondsTo=function(x,y){var w=new c(x,y);f=true;q[x]=w};e.validate=function(){var y,x=this.attributes(),w=this.methods();for(y=0;y<d.length;++y){try{this.attribute(d[y])}catch(z){throw new Error(d[y]+", specified in the isBuiltWith method, is not an attribute")}}for(y=0;y<n.length;++y){try{this.attribute(n[y])}catch(z){throw new Error(n[y]+", specified in the isBuiltWith method, is not an attribute")}}for(y=0;y<x.length;y++){if(w.indexOf(x[y])>-1){throw new Error("Model: invalid model specification to "+x[y]+" being both an attribute and method")}}if(j){for(y=0;y<x.length;y++){if(d.indexOf(x[y])<0){throw new Error("immutable objects must have all attributes required in a call to isBuiltWith")}}}f=false};return e}a.Model=b});
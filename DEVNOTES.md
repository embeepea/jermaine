Notes on Jermaine Code Development
==================================

To work on the jermaine code,  prepare your computer by
installing the following required dev tools:

* npm
* nodejs
* browserify (`sudo npm install -g browserify`)
* uglifyjs (`sudo npm install -g uglify-js`)
* jasmine-node (for running the unit tests; `sudo npm install -g jasmine-node`)

Then, to obtain and work with the code, do the following:

```bash
# 1. Clone the repo:
git clone git@github.com:nemac/jermaine

# 2. Cd into it:
cd jermaine

# 3. Install npm modules:
npm install

# 4. Build the bundled and minified files (this creates build/jermaine.js and build/jermaine-min.js):
npm run build

# 5. Run the unit tests from the command line:
npm test

# 6. Run the unit tests from a browser (this uses the bundled build/jermaine.js, so make sure
#    it is up to date by doing step 4 above):
npm run update-browser-unit-tests
#     ... then browse to 'spec/index.html'
```

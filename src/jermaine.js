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

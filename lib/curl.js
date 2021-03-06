'use strict';

var _ = require('lodash');

module.exports = {

  formatter: require('./json'),

  config: {
    HEADER_SEPARATOR: ': ',
    NEW_LINE: ' \\\n'
  },

  /**
   * Build a cURL string
   *
   * @param {String} uri
   * @param {String} [method=GET]
   * @param {Object} [headers]
   * @param {Object|Array} [data]
   * @param {String} [encType=undefined]
   * @returns {String}
   */
  generate: function(uri, method, headers, data, encType) {
    var config = this.config;
    var flags = [];
    var str;

    method = method || 'GET';

    if (data && method.toLowerCase() === 'get') {
      uri += this.buildQueryString(data);
    }

    str = ['curl', this.buildFlag('X', method.toUpperCase(), 0, ''), '"' + uri + '"'].join(' ');

    if (headers) {
      _.each(headers, function(val, header) {
        flags.push(this.buildFlag('H', header + config.HEADER_SEPARATOR + val, 5));
      }, this);
    }

    if (data && method.toLowerCase() !== 'get') {
      if (encType === undefined || encType.match(this.formatter.jsonMediaType)) {
        flags.push(this.buildFlag('-data', this.formatData(data), 5, '\''));
      } else if (encType === 'multipart/form-data') {
        flags.push.apply(flags, this.formatForms(data, 5, '\''));
      } else {
        // The non-JSON, non-multipart data is a raw string.  Do not format it.
        flags.push(this.buildFlag('-data', data));
      }
    }

    if (flags.length) {
      return str + config.NEW_LINE + flags.join(config.NEW_LINE);
    }
    return str;
  },

  /**
   * @param {mixed} data
   * @returns {String}
   */
  formatData: function(data) {
    return this.formatter.format(data, null, 0);
  },

  /**
   * @param {Object} data
   * @param {Number} indents
   * @param {String} [quoteType=\"]
   * @returns {Array}
   */
  formatForms: function(data, indents, quoteType) {
    var buildFlag = this.buildFlag;
    return Object.keys(data).map(function(key) {
      return buildFlag('-form', `${key}=${data[key]}`, indents, quoteType)
    })
  },

  /**
   * @param {String} type
   * @param {String} value
   * @param {Number} indents
   * @param {String} [quoteType=\"]
   * @returns {String}
   */
  buildFlag: function(type, value, indents, quoteType) {
    quoteType = !_.isUndefined(quoteType) ? quoteType : '"';
    return [_.repeat(' ', indents) + '-', type, ' ', quoteType, value, quoteType].join('');
  },

  /**
   *
   * @param data
   * @param {Boolean} [noQueryString=true]
   * @returns {String}
   */
  buildQueryString: function(data, noQueryString) {
    var firstJoin = noQueryString ? '&' : '?';
    return _.reduce(data, function (str, val, key) {
      var conn = (str === firstJoin) ? '' : '&';
      return str + conn + key + '=' + val;
    }, firstJoin);
  }
};

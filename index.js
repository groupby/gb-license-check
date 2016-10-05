var checker  = require('license-checker');
var correct  = require('spdx-correct');
var _        = require('lodash');
const semver = require('semver');

var LICENSES_WHITELIST = [
  'Apache 2',
  'Apache 2.0',
  'Apache',
  'Apache-2.0',
  'Apache2',
  'artistic-2.0',
  'BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-4-Clause',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'CC0-1.0',
  'FREEBSD',
  'GPL',
  'ISC',
  'LGPL',
  'MIT LICENSE',
  'MIT',
  'MIT*',
  'MIT/X11',
  'Public Domain',
  'Unlicense',
  'WTFPL',
  'MPLv2.0'
];

const CORRECTED_WHITELIST = _.uniq(_.reduce(LICENSES_WHITELIST, (result, license) => {
  const corrected = correct(license);

  if (corrected) {
    result.push(corrected);
  }

  return result;
}, []));

CORRECTED_WHITELIST.push('Public Domain');
CORRECTED_WHITELIST.push('Public domain');

const moduleIsWhitelisted = (moduleWhitelist, name, version) => moduleWhitelist[name] && _.some(moduleWhitelist[name], (range) => semver.satisfies(version, range));

const reduceLicenses = (moduleWhitelist) => (result, license, module) => {
  let targetLicenses = !_.isArray(license.licenses) ? [license.licenses] : license.licenses;

  const name    = module.split('@')[0];
  const version = module.split('@')[1];

  if (!moduleIsWhitelisted(moduleWhitelist, name, version) && !_.some(targetLicenses, (targetLicense) => _.includes(CORRECTED_WHITELIST, correct(targetLicense) || targetLicense))) {
    console.warn(`Package: ${module} has unapproved license: ${JSON.stringify(license)}`);
    result.push(license);
  }

  return result;
};

module.exports = {
  run: (whitelist, callback) => {
    checker.init({
      start: '.',
      guess: true
    }, (err, json) => {
      if (err) {
        //Handle error
      } else {
        const unknownLicenses = _.reduce(json, reduceLicenses(whitelist), []);

        callback(_.size(unknownLicenses) > 0 ? unknownLicenses : null);
      }
    });
  }
};
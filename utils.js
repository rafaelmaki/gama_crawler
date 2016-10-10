var request = require('sync-request');
var cheerio = require('cheerio');

exports.getCountry = function(page) {
    var res = request('GET', page + '/about');
    if (res.statusCode == 200) {
        nextPage = '';
        var $ = cheerio.load(res.getBody());
        var country = '';

        $('.country-inline').each(function() {
            country = $(this).text().trim();
        });

        return country;
    }
}

exports.replaceAll = function(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}
var express = require('express');
var router = express.Router();
var syncRequest = require('sync-request');
var cheerio = require('cheerio');

router.post('/api/crawler/youtube', function (req, res) {
    var urlPrefix = 'https://www.youtube.com';
    var urlSufix = '&sp=EgIQAg%253D%253D';
    var keyword = req.body.keyword;
    keyword = replaceAll(keyword, ' ', '+');
    var nextPage = urlPrefix + '/results?q=' + keyword + urlSufix;
    var MIN = req.body.minimo;
    var MAX = req.body.maximo;
    var country = req.body.country;
    var hasMorePages = true;
    var pages = [];

    while (hasMorePages){
        var result = syncRequest('GET', nextPage);
        if (result.statusCode == 200) {
            nextPage = '';
            hasMorePages = false;
            var $ = cheerio.load(result.getBody());

            $('.item-section li').each(function() {
            var title = $(this).find('.yt-lockup-title a').text().trim();
            var link = $(this).find('.yt-lockup-title a').attr("href");
            var likes = $(this).find('.yt-subscriber-count').text().trim().split('.').join('');

            if (title)
                if(likes) {
                    var subscribers = parseInt(likes);          
                    if (subscribers >= MIN && subscribers <= MAX) {
                        var pageCountry = getCountryYoutube(urlPrefix + link);
                        if(pageCountry) {
                            if(pageCountry.toLowerCase() == country.toLowerCase()) {
                                var line = keyword+';'+title+';'+urlPrefix+link+';'+likes+';'+pageCountry;
                                var page = {
                                    keyword: keyword,
                                    pagina: title,
                                    link: urlPrefix+link,
                                    inscritos: likes,
                                    pais: pageCountry
                                }
                                console.log(line);
                                pages.push(page);
                            }
                        } else {
                            var line = keyword+';'+title+';'+urlPrefix+link+';'+likes;
                            var page = {
                                    keyword: keyword,
                                    pagina: title,
                                    link: urlPrefix+link,
                                    inscritos: likes,
                                    pais: ''
                                }
                            console.log(line);
                            pages.push(page);
                        }
                    }
                }
            });

            $('.spf-link a').each(function() {
                var buttonText = $(this).find('.yt-uix-button-content').text().trim();
                if (buttonText == 'Próximo »') {
                    nextPage = urlPrefix + $(this).attr("href");
                    hasMorePages = true;
                    console.log('========   ' +nextPage+'   =======');
                }
            });
        } else {
            nextPage = '';
            console.log('ERROR:    ' + result.statusCode);
            hasMorePages = false;
        }
    }

    var myJsonString = JSON.stringify(pages);

    res.json(pages).end();
});
 
// Rota para index.html
router.get('/', function(req, res) {   
    var options = {
    root: __dirname + '/../public/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = 'index.html';
  res.sendFile(fileName, options, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', fileName);
    }
  });
});

function getCountryYoutube(page) {
    var res = syncRequest('GET', page + '/about');
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

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}
 
module.exports = router;
var express = require('express');
var router = express.Router();
var syncRequest = require('sync-request');
var cheerio = require('cheerio');
var config = require('../config/config.json');

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

router.post('/api/crawler/facebook', function (req, res) {
    var urlPrefix = 'https://graph.facebook.com/v2.8/search?access_token=';
    var urlMidle = '&debug=all&format=json&method=get&pretty=0&q=';
    var urlSufix = '&suppress_http_code=1&type=page';
    var keyword = req.body.keyword;
    keyword = replaceAll(keyword, ' ', '+');
    var nextPage = urlPrefix + config.facebookAccessToken + urlMidle + keyword + urlSufix;
    var MIN = req.body.minimo;
    var MAX = req.body.maximo;
    var hasMorePages = true;
    var pages = [];

    while (hasMorePages){
        var reqResult = syncRequest('GET', nextPage);
        if (reqResult.statusCode == 200) {
            nextPage = '';
            hasMorePages = false;

            var resultJson = JSON.parse(reqResult.getBody('utf8'));

            //Verifica se existe mais páginas para buscas
            if(resultJson.paging) {
                nextPage = resultJson.paging.next;
                if(nextPage) {
                    hasMorePages = true;
                }
            }

            if(resultJson.data) {
                resultJson.data.forEach(function(item, i) {
                    var pageId = item.id;
                    var pageInfo = getFacebookPageDetais(pageId, item.name, keyword);
                    var likesNum = parseInt(pageInfo.likes);          
                    if (likesNum >= MIN && likesNum <= MAX) {
                        console.log(JSON.stringify(pageInfo));
                        pages.push(pageInfo);
                    }
                    setTimeout(console.log(''), 2000);
                });
            }

        } else {
            nextPage = '';
            console.log('ERROR:    ' + res.statusCode);
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

function getFacebookPageDetais(id, title, keyword) {
  var prefix = 'https://graph.facebook.com/v2.8/';
  var midle = '?access_token=';
  var sufix = '&debug=all&fields=about%2Cfan_count%2Ccategory%2Cgeneral_info%2Chometown%2Clocation%2Cwebsite&format=json&method=get&pretty=0&suppress_http_code=1;'
  var pageUrl = prefix + id + midle + config.facebookAccessToken + sufix;

  var link = 'https://www.facebook.com/' + id;

  var reqResult = syncRequest('GET', pageUrl);
  var resultJson = JSON.parse(reqResult.getBody('utf8'));

  var pageInfo = {
    keyword: keyword,
    pagina: title,
    link: link,
    descricao: resultJson.about,
    likes: resultJson.fan_count,
    categoria: resultJson.category,
    site: resultJson.website
  }

  return pageInfo;
}
 
module.exports = router;
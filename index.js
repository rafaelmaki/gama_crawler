var request = require('sync-request');
var cheerio = require('cheerio');
var fs = require('fs');
var utils = require('./utils.js');

// var nextPage = 'https://www.youtube.com/results?q=KEYWORD&sp=EgIQAg%253D%253D';
var urlPrefix = 'https://www.youtube.com';
var keyword = 'Investimento';
var nextPage = 'https://www.youtube.com/results?q='+keyword+'&sp=EgIQAg%253D%253D';
var i = 0;
var filename = keyword + '_' + new Date().getTime() + '.csv';
var MIN = 75000;
var MAX = 200000;
var hasMorePages = true;

while (hasMorePages){
  var res = request('GET', nextPage);
  if (res.statusCode == 200) {
    nextPage = '';
    i++;
    hasMorePages = false;
    var $ = cheerio.load(res.getBody());

    $('.item-section li').each(function() {
      var title = $(this).find('.yt-lockup-title a').text().trim();
      var link = $(this).find('.yt-lockup-title a').attr("href");
      var likes = $(this).find('.yt-subscriber-count').text().trim().split('.').join('');

      if (title)
        if(likes) {
          var subscribers = parseInt(likes);          
          if (subscribers >= MIN && subscribers <= MAX) {
            if(utils.getCountry(urlPrefix + link) == 'Brasil') {
              // console.log('Titulo: ' + title + ' link: ' + link);
              var line = keyword+';'+title+';'+urlPrefix+link+';'+likes;
              console.log(line);
              fs.appendFile(filename,line + '\n');
            }
          }
          
        }
    });

    $('.spf-link a').each(function() {
      var buttonText = $(this).find('.yt-uix-button-content').text().trim();
      if (buttonText == 'Próximo »') {
        nextPage = urlPrefix + $(this).attr("href");
        hasMorePages = true;
      }
    });
  } else {
    nextPage = '';
    console.log('ERROR:    ' + res.statusCode);
    hasMorePages = false;
  }
}

console.log('==============END==========' + i);

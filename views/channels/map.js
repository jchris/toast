function(doc) {
  // !code helpers/md5.js
  // !code _attachments/html.js
  
  if (doc.channel && doc.message) {
    var mess = doc.message;
    var v = {
      author : {
        name : safeHTML(mess.author.name, 50),
        gravatar : hex_md5(mess.author.email),
        url: escapeHTML(mess.author.url)
      },
      body : safeHTML(mess.body, 250)
    };
    if (mess.date) {
      v.date = safeHTML(mess.date, 50)
    }
    emit([doc.channel, doc._local_seq], v);
  }
};

function(doc, req) {
  // !code helpers/template.js
  // !code _attachments/app.js
  // !code _attachments/script/md5.js

  // !json templates.toast

  var m = doc.message;
  return template(templates.toast, {
    name : escapeHTML(m.author.name),
    channel : escapeHTML(doc.channel),
    gravatar :  hex_md5(m.author.email || m.author.rand),
    body : escapeHTML(m.body),
    date : escapeHTML(m.date)
  });
};

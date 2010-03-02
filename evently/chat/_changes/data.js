function(row) {
  var v = row.value;
  var d = {
    avatar_url : v.author && v.author.gravatar_url || "",
    body : $.linkify($.mustache.escape(v.body)),
    name : v.author && v.author.nickname || "",
    url : v.author && v.author.url || "",
    created_at : $.prettyDate(v.created_at)
  };
  return d;
};
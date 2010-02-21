function(row) {
  var v = row.value;
  return {
    avatar_url : v.author && v.author.gravatar_url,
    body : $.linkify($.mustache.escape(v.body)),
    name : v.author && v.author.name,
    name_uri : v.author && encodeURIComponent(v.author.name),
    created_at : $.prettyDate(v.created_at)
  };
};
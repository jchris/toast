function(row) {
  var v = row.value;
  var d = {
    avatar_url : v.author && v.author.gravatar_url || "",
    body : $.linkify($.mustache.escape(v.body)),
    name : v.author && v.author.nickname || "",
    url : v.author && v.author.url || "",
    id : row.id,
    created_at : $.prettyDate(v.created_at)
  };
  var p = $$("#profile").profile;
  if (p && v.author && v.author.rand && (v.author.rand == p.rand)) {
    // todo _admin owns everything...
    d.owned = true;
  }
  return d;
};
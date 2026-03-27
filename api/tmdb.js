export default async function handler(req, res) {
  var apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ results: [] });
  }

  try {
    // Fetch now playing movies
    var url = "https://api.themoviedb.org/3/movie/now_playing?api_key=" + apiKey + "&language=en-US&region=US&page=1";
    var response = await fetch(url);
    var data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.status(200).json({ results: [] });
    }

    // For each movie, get the US certification
    var movies = [];
    var top = data.results.slice(0, 15);

    for (var i = 0; i < top.length; i++) {
      var movie = top[i];
      try {
        var certUrl = "https://api.themoviedb.org/3/movie/" + movie.id + "/release_dates?api_key=" + apiKey;
        var certRes = await fetch(certUrl);
        var certData = await certRes.json();

        var certification = "";
        if (certData.results) {
          for (var j = 0; j < certData.results.length; j++) {
            if (certData.results[j].iso_3166_1 === "US") {
              var releases = certData.results[j].release_dates || [];
              for (var k = 0; k < releases.length; k++) {
                if (releases[k].certification) {
                  certification = releases[k].certification;
                  break;
                }
              }
              break;
            }
          }
        }

        movies.push({
          id: movie.id,
          title: movie.title,
          overview: movie.overview ? movie.overview.substring(0, 120) + "..." : "",
          rating: Math.round(movie.vote_average * 10) / 10,
          certification: certification,
          genre_ids: movie.genre_ids || [],
        });
      } catch (e) {
        // Skip movie if cert lookup fails
        movies.push({
          id: movie.id,
          title: movie.title,
          overview: movie.overview ? movie.overview.substring(0, 120) + "..." : "",
          rating: Math.round(movie.vote_average * 10) / 10,
          certification: "",
          genre_ids: movie.genre_ids || [],
        });
      }
    }

    return res.status(200).json({ results: movies });
  } catch (error) {
    console.error("TMDb API error:", error);
    return res.status(200).json({ results: [] });
  }
}

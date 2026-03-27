export default async function handler(req, res) {
  var apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ results: [], error: "no_key" });
  }

  try {
    var url = "https://api.themoviedb.org/3/movie/now_playing?api_key=" + apiKey + "&language=en-US&region=US&page=1";
    var response = await fetch(url);
    if (!response.ok) {
      return res.status(200).json({ results: [], error: "tmdb_" + response.status });
    }
    var data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.status(200).json({ results: [], error: "no_movies" });
    }

    var top = data.results.slice(0, 8);
    var certPromises = top.map(function(movie) {
      return fetch("https://api.themoviedb.org/3/movie/" + movie.id + "/release_dates?api_key=" + apiKey)
        .then(function(r) { return r.json(); })
        .then(function(certData) {
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
          return {
            id: movie.id,
            title: movie.title,
            overview: movie.overview ? movie.overview.substring(0, 120) + "..." : "",
            rating: Math.round(movie.vote_average * 10) / 10,
            certification: certification,
          };
        })
        .catch(function() {
          return {
            id: movie.id,
            title: movie.title,
            overview: movie.overview ? movie.overview.substring(0, 120) + "..." : "",
            rating: Math.round(movie.vote_average * 10) / 10,
            certification: "",
          };
        });
    });

    var movies = await Promise.all(certPromises);
    return res.status(200).json({ results: movies });
  } catch (error) {
    return res.status(200).json({ results: [], error: "exception" });
  }
}

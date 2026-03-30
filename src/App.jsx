import { useState, useEffect, useRef } from "react";
import { DB, TEAMS, NEIGHBORHOOD_CLUSTERS, SEASONAL_CONFIG, BUDGET_GUIDE, VENUE_WHITELIST, THEATERS } from "./data";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
var TM_KEY = "zQK7Dpvk0bMN04vArfdEZnIxma0gBBJ6";
var SEA_LAT = 47.6062;
var SEA_LNG = -122.3321;

var LOAD_MSGS = [
  "Consulting the dad council...",
  "Checking the vibe forecast...",
  "Scanning live events...",
  "Checking the weather...",
  "Optimizing your evening...",
  "Making sure it is not just pizza again...",
  "Clustering neighborhoods...",
  "Calculating dad budget...",
];

// ─── COLORS ────────────────────────────────────────────────────────────────────
var COL = {
  bg: "#0B0B0F", card: "#16161D", cardS: "#1A1510",
  amber: "#E8A317", amberD: "#B87D12", amberG: "rgba(232,163,23,0.15)", amberB: "rgba(232,163,23,0.4)",
  text: "#F0EDE6", muted: "#8A8680", dim: "#5A5750",
  border: "rgba(255,255,255,0.06)",
  blue: "#4A9EE5", blueG: "rgba(74,158,229,0.15)", blueB: "rgba(74,158,229,0.4)",
  green: "#40C463",
};

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────
function pickRandom(arr, usedSet) {
  var available = arr.filter(function(item) { return !usedSet.has(item.name || item.park || item.hike); });
  if (available.length === 0) return arr[Math.floor(Math.random() * arr.length)];
  var chosen = available[Math.floor(Math.random() * available.length)];
  usedSet.add(chosen.name || chosen.park || chosen.hike);
  return chosen;
}

function formatTime(h) {
  // Wrap hours past midnight
  var wrapped = h % 24;
  var hour = Math.floor(wrapped);
  var min = (wrapped % 1) >= 0.5 ? "30" : "00";
  var ampm = hour >= 12 ? "PM" : "AM";
  var display = hour > 12 ? hour - 12 : hour;
  if (display === 0) display = 12;
  return display + ":" + min + " " + ampm;
}

function parseTimeToHours(timeStr) {
  if (!timeStr) return 19;
  var match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 19;
  var h = parseInt(match[1]);
  var m = parseInt(match[2]);
  var ampm = match[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + m / 60;
}

function getCurrentSeason() {
  var month = new Date().getMonth() + 1;
  return SEASONAL_CONFIG[month] || SEASONAL_CONFIG[6];
}

function getClusterForNeighborhood(hood) {
  var keys = Object.keys(NEIGHBORHOOD_CLUSTERS);
  for (var i = 0; i < keys.length; i++) {
    if (NEIGHBORHOOD_CLUSTERS[keys[i]].some(function(n) {
      return hood.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(hood.toLowerCase());
    })) {
      return keys[i];
    }
  }
  return null;
}

function getClusterNeighborhoods(clusterKey) {
  return NEIGHBORHOOD_CLUSTERS[clusterKey] || [];
}

function isInCluster(neighborhood, clusterKey) {
  if (!clusterKey) return true;
  var hoods = getClusterNeighborhoods(clusterKey);
  return hoods.some(function(h) {
    return neighborhood.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(neighborhood.toLowerCase());
  });
}

function estimateBudget(stops) {
  var low = 0;
  var high = 0;
  for (var i = 0; i < stops.length; i++) {
    var type = stops[i].type || "activity";
    var guide = BUDGET_GUIDE[type] || BUDGET_GUIDE.activity;
    low += guide.low;
    high += guide.high;
  }
  return { low: low, high: high };
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function App() {
  var [step, setStep] = useState("splash");
  var [who, setWho] = useState(null);
  var [planDate, setPlanDate] = useState("");
  var [timeOfDay, setTimeOfDay] = useState(null);
  var [moods, setMoods] = useState([]);
  var [plan, setPlan] = useState(null);
  var [loading, setLoading] = useState(false);
  var [loadMsg, setLoadMsg] = useState(LOAD_MSGS[0]);
  var [fadeIn, setFadeIn] = useState(true);
  var fadeRef = useRef(null);
  var [weather, setWeather] = useState(null);
  var [liveEvents, setLiveEvents] = useState([]);
  var [userSpots, setUserSpots] = useState([]);
  var [savedPlans, setSavedPlans] = useState([]);
  var [showSuggest, setShowSuggest] = useState(false);
  var [showMyDates, setShowMyDates] = useState(false);
  var [sugName, setSugName] = useState("");
  var [sugType, setSugType] = useState("restaurant");
  var [sugHood, setSugHood] = useState("");
  var [sugNotes, setSugNotes] = useState("");
  var [sugLoading, setSugLoading] = useState(false);
  var [sugDone, setSugDone] = useState(false);
  var [planSaved, setPlanSaved] = useState(false);
  var [showShareCard, setShowShareCard] = useState(false);
  var [nowPlaying, setNowPlaying] = useState([]);

  // Build Google Maps URL for a venue
  function mapsUrl(name, hood) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(name + " Seattle " + (hood || ""));
  }

  // Build Fandango URL for a movie at a theater
  function fandangoUrl(movieTitle, theaterName) {
    return "https://www.fandango.com/search?q=" + encodeURIComponent(movieTitle + " " + theaterName);
  }

  // Build Resy search URL
  function resyUrl(name) {
    return "https://resy.com/cities/sea?query=" + encodeURIComponent(name);
  }

  // Build OpenTable search URL
  function openTableUrl(name) {
    return "https://www.opentable.com/s?term=" + encodeURIComponent(name + " Seattle");
  }

  // Build Tock URL
  function tockUrl(name) {
    return "https://www.exploretock.com/search?query=" + encodeURIComponent(name + " Seattle");
  }

  // Build DoorDash URL
  function doordashUrl(name) {
    return "https://www.doordash.com/search/store/" + encodeURIComponent(name + " Seattle");
  }

  // Share plan via Web Share API or clipboard
  function sharePlan() {
    if (!plan) return;
    var text = "📅 MAN-DATE: " + plan.title + "\n";
    text += plan.tagline + "\n\n";
    if (weather) text += weather.icon + " " + weather.hi + "°F " + weather.label + "\n\n";
    for (var i = 0; i < plan.stops.length; i++) {
      var s = plan.stops[i];
      text += s.emoji + " " + s.time + " — " + s.name + "\n";
      text += "   " + s.neighborhood + "\n";
      text += "   " + s.description + "\n\n";
    }
    if (plan.budget) text += "💰 ~$" + (plan.budget.low * 2) + "-$" + (plan.budget.high * 2) + " for two\n";
    text += "\nPlanned with Man-Date 📅";

    if (navigator.share) {
      navigator.share({ title: "Man-Date: " + plan.title, text: text }).catch(function() {});
    } else {
      navigator.clipboard.writeText(text).then(function() {
        alert("Plan copied to clipboard!");
      }).catch(function() {
        alert("Could not copy. Try screenshotting the share card instead!");
      });
    }
  }

  // Text babysitter via iMessage
  function textBabysitter() {
    var dateStr = "this weekend";
    if (planDate) {
      var d = new Date(planDate + "T12:00:00");
      var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      var day = d.getDate();
      var suffix = "th";
      if (day === 1 || day === 21 || day === 31) suffix = "st";
      if (day === 2 || day === 22) suffix = "nd";
      if (day === 3 || day === 23) suffix = "rd";
      dateStr = days[d.getDay()] + ", " + months[d.getMonth()] + " " + day + suffix;
    }
    var firstStop = plan && plan.stops && plan.stops[0] ? plan.stops[0].time : "around 6";
    var msg = "Hey! We have a date night planned for " + dateStr + " and were wondering if you might be available to babysit? We would probably need you starting " + firstStop + ". Let us know if that works — no pressure at all! Thanks \uD83D\uDE0A";
    window.open("sms:&body=" + encodeURIComponent(msg));
  }

  // Load saved data from localStorage
  useEffect(function() {
    try {
      var spots = localStorage.getItem("mandate-spots");
      if (spots) setUserSpots(JSON.parse(spots));
      var plans = localStorage.getItem("mandate-saved-plans");
      if (plans) setSavedPlans(JSON.parse(plans));
    } catch(e) {}
  }, []);

  // Loading message rotation
  useEffect(function() {
    if (!loading) return;
    var i = 0;
    var iv = setInterval(function() {
      i = (i + 1) % LOAD_MSGS.length;
      setLoadMsg(LOAD_MSGS[i]);
    }, 1400);
    return function() { clearInterval(iv); };
  }, [loading]);

  function goStep(s) {
    if (fadeRef.current) clearTimeout(fadeRef.current);
    setFadeIn(false);
    fadeRef.current = setTimeout(function() {
      setStep(s);
      setFadeIn(true);
      fadeRef.current = null;
    }, 200);
  }

  function toggleMood(m) {
    setMoods(function(prev) {
      if (prev.includes(m)) return prev.filter(function(x) { return x !== m; });
      return prev.concat([m]);
    });
  }

  // ─── SAVE PLAN ──────────────────────────────────────────────────────────────
  function savePlan() {
    if (!plan) return;
    var saved = {
      id: Date.now(),
      date: planDate || "No date",
      who: who,
      timeOfDay: timeOfDay,
      moods: moods.slice(),
      plan: JSON.parse(JSON.stringify(plan)),
      weather: weather,
      savedAt: new Date().toLocaleDateString(),
    };
    var updated = [saved].concat(savedPlans);
    setSavedPlans(updated);
    try { localStorage.setItem("mandate-saved-plans", JSON.stringify(updated)); } catch(e) {}
    setPlanSaved(true);
    setTimeout(function() { setPlanSaved(false); }, 2000);
  }

  function deleteSavedPlan(id) {
    var updated = savedPlans.filter(function(p) { return p.id !== id; });
    setSavedPlans(updated);
    try { localStorage.setItem("mandate-saved-plans", JSON.stringify(updated)); } catch(e) {}
  }

  function loadSavedPlan(saved) {
    setWho(saved.who);
    setPlanDate(saved.date);
    setTimeOfDay(saved.timeOfDay);
    setMoods(saved.moods || []);
    setPlan(saved.plan);
    setWeather(saved.weather);
    setShowMyDates(false);
    setStep("results");
    setFadeIn(true);
  }

  // ─── YOLO MODE ──────────────────────────────────────────────────────────────
  async function yoloPlan() {
    var whoOptions = ["partner", "friends", "family"];
    var randomWho = whoOptions[Math.floor(Math.random() * whoOptions.length)];
    var todOptions = ["afternoon", "evening", "latenight"];
    var randomTod = todOptions[Math.floor(Math.random() * todOptions.length)];
    setWho(randomWho);
    setTimeOfDay(randomTod);
    setMoods(["dealers"]);
    setPlanDate("");

    setStep("loading");
    setFadeIn(true);
    setLoading(true);

    // Small delay for state to settle
    await new Promise(function(r) { setTimeout(r, 100); });

    var localPlan = buildLocalPlan(null, [], randomWho, randomTod, ["dealers"]);
    setPlan(localPlan);

    await new Promise(function(r) { setTimeout(r, 800); });
    setLoading(false);
    setStep("results");
    setFadeIn(true);
  }

  // ─── TICKETMASTER ───────────────────────────────────────────────────────────
  async function fetchEvents(dateStr) {
    if (!dateStr) return [];
    try {
      var ctrl = new AbortController();
      var tid = setTimeout(function() { ctrl.abort(); }, 5000);
      var url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" + TM_KEY + "&latlong=" + SEA_LAT + "," + SEA_LNG + "&radius=30&unit=miles&localStartDateTime=" + dateStr + "T00:00:00&localEndDateTime=" + dateStr + "T23:59:59&size=50&sort=date,asc";
      var res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      var data = await res.json();
      if (!data._embedded || !data._embedded.events) return [];
      return data._embedded.events.map(function(e) {
        var v = (e._embedded && e._embedded.venues && e._embedded.venues[0]) || {};
        var venueName = v.name || "";
        var cl = (e.classifications && e.classifications[0]) || {};
        var seg = (cl.segment && cl.segment.name) || "";
        var genre = (cl.genre && cl.genre.name) || "";
        var isSport = seg === "Sports";
        var isMusic = seg === "Music";
        var isArts = seg === "Arts & Theatre";
        var isFamily = seg === "Family";
        var isFam = isFamily || isSport || isArts;
        var lt = (e.dates && e.dates.start && e.dates.start.localTime) || "";
        var tm = lt ? new Date("2000-01-01T" + lt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
        var pr = (e.priceRanges && e.priceRanges[0]) ? e.priceRanges[0].min : null;
        var isTeam = TEAMS.some(function(t) { return (e.name || "").toLowerCase().includes(t.toLowerCase()); });

        // Filter by venue whitelist (now objects with name + neighborhood)
        var matchedSportsVenue = null;
        var matchedShowVenue = null;
        VENUE_WHITELIST.sports.forEach(function(wv) {
          if (venueName.toLowerCase().includes(wv.name.toLowerCase()) || wv.name.toLowerCase().includes(venueName.toLowerCase())) {
            matchedSportsVenue = wv;
          }
        });
        VENUE_WHITELIST.shows.forEach(function(wv) {
          if (venueName.toLowerCase().includes(wv.name.toLowerCase()) || wv.name.toLowerCase().includes(venueName.toLowerCase())) {
            matchedShowVenue = wv;
          }
        });
        var inSportsVenue = matchedSportsVenue !== null;
        var inShowVenue = matchedShowVenue !== null;
        var isApproved = inSportsVenue || inShowVenue;
        if (!isApproved) return null;

        // Use venue neighborhood from whitelist for clustering
        var venueHood = (matchedShowVenue && matchedShowVenue.neighborhood) || (matchedSportsVenue && matchedSportsVenue.neighborhood) || venueName;

        // Categorize: use Ticketmaster segment first, venue as fallback
        var category;
        if (isSport) {
          category = "sports";
        } else if (isMusic || isArts || isFamily) {
          category = "liveshow";
        } else if (inSportsVenue) {
          category = "sports";
        } else {
          category = "liveshow";
        }

        return {
          name: e.name, neighborhood: venueName || "Seattle",
          venueNeighborhood: venueHood,
          desc: (isSport ? "🏟️ " : isMusic ? "🎵 " : isArts ? "🎭 " : "🎤 ") + e.name + (venueName ? " at " + venueName : "") + ". " + (pr ? "From $" + Math.round(pr) : ""),
          kidFriendly: isFam, type: category,
          time: tm, emoji: isSport ? "🏟️" : isMusic ? "🎵" : isArts ? "🎭" : "🎤",
          isLive: true, isTeam: isTeam, url: e.url,
        };
      }).filter(function(e) { return e !== null; });
    } catch(e) { return []; }
  }

  // ─── WEATHER ────────────────────────────────────────────────────────────────
  async function fetchWeather(dateStr) {
    if (!dateStr) return null;
    try {
      var ctrl = new AbortController();
      var tid = setTimeout(function() { ctrl.abort(); }, 4000);
      var url = "https://api.open-meteo.com/v1/forecast?latitude=" + SEA_LAT + "&longitude=" + SEA_LNG + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=America/Los_Angeles&start_date=" + dateStr + "&end_date=" + dateStr;
      var res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      var data = await res.json();
      if (!data.daily) return null;
      var code = (data.daily.weather_code || data.daily.weathercode || [])[0];
      var hi = Math.round(data.daily.temperature_2m_max[0] * 9 / 5 + 32);
      var lo = Math.round(data.daily.temperature_2m_min[0] * 9 / 5 + 32);
      var rain = data.daily.precipitation_sum[0];
      var icons = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 51: "🌧️", 53: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️", 80: "🌦️", 95: "⛈️" };
      var labels = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 51: "Drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 80: "Showers", 95: "Thunderstorm" };
      return { icon: icons[code] || "🌤️", label: labels[code] || "Fair", hi: hi, lo: lo, isRainy: rain > 2 || code >= 61 };
    } catch(e) { return null; }
  }

  // ─── CLAUDE API ─────────────────────────────────────────────────────────────
  async function callClaude(body) {
    try {
      var ctrl = new AbortController();
      var tid = setTimeout(function() { ctrl.abort(); }, 12000);
      var res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: ctrl.signal, body: JSON.stringify(body),
      });
      clearTimeout(tid);
      return await res.json();
    } catch(e) { return null; }
  }

  // ─── TMDB (NOW PLAYING MOVIES) ─────────────────────────────────────────────
  async function fetchMovies() {
    try {
      var ctrl = new AbortController();
      var tid = setTimeout(function() { ctrl.abort(); }, 6000);
      var res = await fetch("/api/tmdb", { signal: ctrl.signal });
      clearTimeout(tid);
      var data = await res.json();
      return data.results || [];
    } catch(e) { return []; }
  }

  // ─── LOCAL PLAN BUILDER ─────────────────────────────────────────────────────
  function buildLocalPlan(wx, events, overrideWho, overrideTod, overrideMoods, movies) {
    var theWho = overrideWho || who;
    var theTod = overrideTod || timeOfDay;
    var theMoods = overrideMoods || moods;
    var isF = theWho === "family";
    var isP = theWho === "partner";
    var isLN = theTod === "latenight";
    var isAft = theTod === "afternoon";
    var used = new Set();
    var stops = [];
    var baseH = isAft ? 14 : isLN ? 20 : 17;
    var hr = baseH;

    // Seasonal intelligence
    var season = getCurrentSeason();
    var suppressed = season.suppress || [];

    // Merge user spots
    var bars = DB.bars.concat(userSpots.filter(function(s) { return s.category === "bar"; }));
    var restos = DB.restaurants.concat(userSpots.filter(function(s) { return s.category === "restaurant"; }));
    var acts = DB.activities.concat(userSpots.filter(function(s) { return s.category === "activity"; }));

    // Apply audience filters FIRST (before clustering)
    var filteredBars = isF ? bars.filter(function(b) { return b.kidFriendly; }) : isP ? bars.filter(function(b) { return ["upscale", "speakeasy", "craft"].includes(b.vibe); }) : bars;
    var filteredRestos = restos.filter(function(r) {
      if (isF && !r.kidFriendly) return false;
      if (isP && (r.price === "$" || r.vibe === "casual")) return false;
      return true;
    });
    var filteredActs = acts.filter(function(a) {
      if (isF && !a.kidFriendly) return false;
      if (a.dateOnly && !isP) return false;
      return true;
    });

    // Pick initial cluster — will be re-anchored if a live event is injected
    var eligibleSpots = filteredBars.concat(filteredRestos).concat(filteredActs);
    var randomAnchor = eligibleSpots[Math.floor(Math.random() * eligibleSpots.length)];
    var cluster = getClusterForNeighborhood(randomAnchor.neighborhood);

    // Cluster filter helper — strict: only returns cluster matches, no fallback to full DB
    function clusterFilter(arr, clusterKey) {
      if (!clusterKey) return arr;
      var filtered = arr.filter(function(item) { return isInCluster(item.neighborhood, clusterKey); });
      return filtered.length >= 1 ? filtered : arr;
    }

    // Apply initial clustering
    function applyClustering() {
      cBars = clusterFilter(filteredBars, cluster);
      cRestos = clusterFilter(filteredRestos, cluster);
      cActs = clusterFilter(filteredActs, cluster);
    }
    var cBars, cRestos, cActs;
    applyClustering();

    // Determine active moods
    var moodOrder = ["outdoor", "water", "picnic", "drinks", "food", "activity", "movie", "liveshow", "sports", "stayin"];
    var active;

    if (theMoods.includes("dealers")) {
      var options;
      if (isF) {
        options = isLN ? ["food", "stayin"] : isAft ? ["food", "activity", "outdoor", "picnic", "movie"] : ["food", "activity", "stayin", "liveshow", "movie"];
      } else if (isP) {
        options = isLN ? ["drinks", "food", "liveshow", "movie"] : isAft ? ["drinks", "food", "picnic", "water"] : ["drinks", "food", "activity", "liveshow", "movie"];
      } else {
        options = isLN ? ["drinks", "food", "activity", "liveshow", "movie"] : isAft ? ["drinks", "food", "activity", "outdoor", "water"] : ["drinks", "food", "activity", "liveshow", "sports", "movie"];
      }
      // Seasonal boost: add boosted categories
      var boosts = season.boost || [];
      for (var bi = 0; bi < boosts.length; bi++) {
        if (options.indexOf(boosts[bi]) === -1 && Math.random() > 0.5) {
          options.push(boosts[bi]);
        }
      }
      active = options.sort(function() { return Math.random() - 0.5; }).slice(0, 2 + Math.floor(Math.random() * 2));
    } else {
      active = moodOrder.filter(function(m) { return theMoods.includes(m); });
    }

    // Suppress based on season and conditions
    if (isLN || (wx && wx.isRainy)) {
      active = active.filter(function(m) { return m !== "outdoor" && m !== "water" && m !== "picnic"; });
    }
    // Only apply seasonal suppression for Dealer's Choice — respect explicit user picks
    if (theMoods.includes("dealers")) {
      active = active.filter(function(m) { return suppressed.indexOf(m) === -1; });
    }

    // Inject live events based on mood selection
    var sportsEvents = (events || []).filter(function(e) { return e.type === "sports"; });
    var showEvents = (events || []).filter(function(e) { return e.type === "liveshow"; });

    // Live Sports: only if user picked sports or Dealer's Choice randomly includes it
    if (sportsEvents.length > 0 && active.indexOf("sports") !== -1) {
      var teamGames = sportsEvents.filter(function(e) { return e.isTeam; });
      var sportsPick = teamGames[0] || sportsEvents[0];
      if (sportsPick) {
        stops.push({
          name: sportsPick.name, type: "sports", emoji: "🏟️",
          time: sportsPick.time || formatTime(hr), neighborhood: sportsPick.neighborhood,
          description: sportsPick.desc, isLive: true, url: sportsPick.url,
        });
        hr += 3;
        active = active.filter(function(m) { return m !== "sports" && m !== "activity"; });
        // Re-anchor cluster around the venue
        if (sportsPick.venueNeighborhood) {
          cluster = getClusterForNeighborhood(sportsPick.venueNeighborhood);
          applyClustering();
        }
      }
    }

    // Live Show: inject as one stop within a multi-stop evening
    if (showEvents.length > 0 && active.indexOf("liveshow") !== -1) {
      var famFiltered = showEvents.filter(function(e) { return !isF || e.kidFriendly; });
      var showPick = famFiltered.length > 0 ? famFiltered[Math.floor(Math.random() * famFiltered.length)] : null;
      if (showPick) {
        stops.push({
          name: showPick.name, type: "liveshow", emoji: showPick.emoji || "🎶",
          time: showPick.time || formatTime(hr), neighborhood: showPick.neighborhood,
          description: showPick.desc, isLive: true, url: showPick.url,
        });
        hr += 2.5;
        active = active.filter(function(m) { return m !== "liveshow"; });
        // Re-anchor cluster around the venue
        if (showPick.venueNeighborhood) {
          cluster = getClusterForNeighborhood(showPick.venueNeighborhood);
          applyClustering();
        }
      }
    }

    // Build stops for each active mood
    for (var idx = 0; idx < active.length; idx++) {
      var mood = active[idx];

      if (mood === "drinks") {
        if (cBars.length > 0) {
          var bar = pickRandom(cBars, used);
          stops.push({ name: bar.name, type: "drinks", emoji: "🍺", time: formatTime(hr), neighborhood: bar.neighborhood, description: bar.desc });
          hr += 1.5;
          // Re-anchor cluster around the bar
          var barCluster = getClusterForNeighborhood(bar.neighborhood);
          if (barCluster) { cluster = barCluster; applyClustering(); }
        }
      }

      if (mood === "food") {
        var foodPool = cRestos;
        // When Stay In is in the plan, only suggest takeout-friendly spots
        if (theMoods.includes("stayin") || active.indexOf("stayin") !== -1) {
          var takeoutPool = foodPool.filter(function(r) { return r.book === "walkin" || r.book === "doordash"; });
          if (takeoutPool.length > 0) foodPool = takeoutPool;
        }
        var resto = pickRandom(foodPool, used);
        var isTakeout = theMoods.includes("stayin") || active.indexOf("stayin") !== -1;
        var foodEmoji = isTakeout ? "🥡" : "🍽️";
        var foodDesc = isTakeout ? "Grab takeout from " + resto.name + ". " + resto.desc : resto.desc;
        stops.push({ name: resto.name, type: "food", emoji: foodEmoji, time: formatTime(Math.round(hr)), neighborhood: resto.neighborhood, description: foodDesc, book: resto.book || null, bookUrl: resto.bookUrl || null, isTakeout: isTakeout });
        hr += isTakeout ? 0.5 : 1.5;
        // Re-anchor cluster around the restaurant
        var foodCluster = getClusterForNeighborhood(resto.neighborhood);
        if (foodCluster) { cluster = foodCluster; applyClustering(); }
      }

      if (mood === "activity") {
        if (cActs.length > 0) {
          var act = pickRandom(cActs, used);
          stops.push({ name: act.name, type: act.type === "show" ? "liveshow" : "activity", emoji: act.type === "show" ? "🎶" : "🎯", time: formatTime(Math.round(hr)), neighborhood: act.neighborhood || "Seattle", description: act.desc });
          hr += 2;
          // Re-anchor cluster around the activity
          var actCluster = getClusterForNeighborhood(act.neighborhood);
          if (actCluster) { cluster = actCluster; applyClustering(); }
        }
      }

      if (mood === "liveshow") {
        // Fallback when Ticketmaster didn't have events — pick from database show venues
        var showPool = (DB.activities || []).filter(function(a) {
          if (a.type !== "show") return false;
          if (isF && a.kidFriendly === false) return false;
          return true;
        });
        if (showPool.length > 0) {
          var showPick = pickRandom(showPool, used);
          stops.push({ name: showPick.name, type: "liveshow", emoji: "🎶", time: formatTime(Math.round(hr)), neighborhood: showPick.neighborhood || "Seattle", description: showPick.desc + (showPick.cost ? " " + showPick.cost : "") });
          hr += 2;
        }
      }

      if (mood === "movie") {
        var availableMovies = (movies || []).filter(function(m) {
          if (!m.certification) return true;
          if (isF) return m.certification === "G" || m.certification === "PG";
          return m.certification === "PG-13" || m.certification === "R" || m.certification === "PG";
        });
        if (availableMovies.length > 0) {
          var moviePick = availableMovies[Math.floor(Math.random() * availableMovies.length)];
          var theaterPool = THEATERS.filter(function(t) {
            if (isF && !t.kidFriendly) return false;
            if (isP && t.vibe === "date") return true;
            return true;
          });
          if (isP) {
            var dateTheaters = theaterPool.filter(function(t) { return t.vibe === "date"; });
            if (dateTheaters.length > 0) theaterPool = dateTheaters;
          }
          var theater = theaterPool[Math.floor(Math.random() * theaterPool.length)];
          var cert = moviePick.certification ? " (" + moviePick.certification + ")" : "";
          var score = moviePick.rating ? " ⭐ " + moviePick.rating + "/10" : "";
          stops.push({
            name: moviePick.title + cert,
            type: "movie", emoji: "🎬",
            time: formatTime(Math.round(hr)),
            neighborhood: theater.name,
            description: moviePick.overview + score + " — " + theater.desc,
            fandangoUrl: fandangoUrl(moviePick.title, theater.name),
          });
          hr += 2.5;
        }
      }

      if (mood === "outdoor") {
        var oPool = DB.outdoor;
        // Try cluster filtering first
        var oFiltered = oPool.filter(function(s) { return isInCluster(s.neighborhood, cluster); });
        var oPick = oFiltered.length > 0 ? oFiltered : oPool;
        var spot = pickRandom(oPick, used);
        stops.push({ name: spot.name, type: "outdoor", emoji: "🌲", time: formatTime(Math.round(hr)), neighborhood: spot.neighborhood, description: spot.desc });
        hr += 2;
        // Re-anchor cluster around the outdoor spot
        var newCluster = getClusterForNeighborhood(spot.neighborhood);
        if (newCluster) { cluster = newCluster; applyClustering(); }
      }

      if (mood === "water" && DB.water) {
        var wPool = DB.water.filter(function(w) {
          var seasonMatch = !w.season || w.season === "year-round" || season.season === "summer" || season.season === "spring";
          return seasonMatch;
        });
        // Try cluster filtering
        var wFiltered = wPool.filter(function(w) { return isInCluster(w.neighborhood || "Seattle", cluster); });
        var wPick = wFiltered.length > 0 ? wFiltered : wPool;
        if (wPick.length > 0) {
          var wat = pickRandom(wPick, used);
          stops.push({ name: wat.name, type: "water", emoji: "🚣", time: formatTime(Math.round(hr)), neighborhood: wat.neighborhood || "Seattle", description: wat.desc + (wat.cost ? " " + wat.cost : "") });
          hr += 2;
          var newWCluster = getClusterForNeighborhood(wat.neighborhood || "Seattle");
          if (newWCluster) { cluster = newWCluster; applyClustering(); }
        }
      }

      if (mood === "picnic" && DB.picnicCombos) {
        var pPool = DB.picnicCombos.filter(function(p) { return !isF || p.kidFriendly; });
        // Try cluster filtering by park name matching neighborhood
        var pFiltered = pPool.filter(function(p) {
          // Check if any outdoor spot with this park name is in the cluster
          var parkSpot = DB.outdoor.filter(function(o) { return o.name === p.park; });
          if (parkSpot.length > 0) return isInCluster(parkSpot[0].neighborhood, cluster);
          return false;
        });
        var pPick = pFiltered.length > 0 ? pFiltered : pPool;
        if (pPick.length > 0) {
          var pic = pickRandom(pPick, used);
          stops.push({ name: "Picnic: " + pic.park, type: "picnic", emoji: "🧺", time: formatTime(Math.round(hr)), neighborhood: pic.park, description: pic.desc + " Grab: " + pic.takeout });
          hr += 2.5;
        }
      }

      if (mood === "stayin") {
        var idea = pickRandom(DB.stayIn, used);
        var sitems = idea.items.slice().sort(function() { return Math.random() - 0.5; });
        stops.push({ name: idea.name, type: "stayin", emoji: "🏡", time: formatTime(Math.round(hr)), neighborhood: "Home Base", description: idea.desc + " Try: " + sitems.slice(0, 3).join(", ") + "." });
        hr += 2;
      }
    }

    // Family mode: sometimes inject a family-specific activity
    if (isF && DB.familyActivities && stops.length < 3 && Math.random() > 0.4) {
      var famPool = DB.familyActivities;
      var famFiltered = famPool.filter(function(f) { return isInCluster(f.neighborhood || "Seattle", cluster); });
      var famPick = famFiltered.length > 0 ? famFiltered : famPool;
      var fam = pickRandom(famPick, used);
      stops.push({ name: fam.name, type: "activity", emoji: "👨‍👩‍👧‍👦", time: formatTime(Math.round(hr)), neighborhood: fam.neighborhood || "Seattle", description: fam.desc + (fam.cost ? " " + fam.cost : "") });
    }

    // Hike + brewery combo (outdoor + drinks in one)
    if ((theMoods.includes("outdoor") || theMoods.includes("dealers")) && theMoods.includes("drinks") && DB.hikeCombos && !isLN && !(wx && wx.isRainy) && stops.length < 2) {
      var hPool = DB.hikeCombos.filter(function(h) { return !isF || h.kidFriendly; });
      if (hPool.length > 0) {
        var hike = pickRandom(hPool, used);
        stops.push({ name: hike.hike + " + " + hike.brewery, type: "outdoor", emoji: "🥾🍺", time: formatTime(Math.round(baseH)), neighborhood: hike.hike, description: hike.desc });
        // Re-anchor cluster around the brewery destination for dinner pairing
        var breweryCluster = getClusterForNeighborhood(hike.brewery);
        if (breweryCluster) { cluster = breweryCluster; applyClustering(); }
      }
    }

    // Fallback if somehow empty
    if (stops.length === 0) {
      var fb = pickRandom(filteredBars.length > 0 ? filteredBars : bars, used);
      var fa = pickRandom(filteredActs.length > 0 ? filteredActs : acts, used);
      stops.push(
        { name: fb.name, type: "drinks", emoji: "🍺", time: formatTime(baseH), neighborhood: fb.neighborhood, description: fb.desc },
        { name: fa.name, type: "activity", emoji: "🎯", time: formatTime(baseH + 2), neighborhood: fa.neighborhood || "Seattle", description: fa.desc }
      );
    }

    // Generate title and tagline
    var titlesMap = {
      "friends-latenight": ["After Hours Protocol", "The Late Shift", "Night Owls Only"],
      "friends-evening": ["The Dad Special", "Full Send Friday", "No Excuses Night", "Boys Night Blueprint"],
      "friends-afternoon": ["Day Drinking Agenda", "Hooky Hours", "The Afternoon Off"],
      "partner-latenight": ["Late Night Romance", "The Night Cap", "After Bedtime"],
      "partner-evening": ["Date Night Done Right", "No Babysitter Wasted", "The Upgrade"],
      "partner-afternoon": ["Afternoon Escape", "The Matinee Date"],
      "family-evening": ["Family Fun Unlocked", "Friday Night Legends", "Kid Approved"],
      "family-afternoon": ["Sunshine Squad", "Explorer Mode ON", "The Afternoon Adventure"],
      "family-latenight": ["Movie Night Supreme", "Past Bedtime Club"],
    };
    var tagsMap = {
      partner: ["Effort looks good on you.", "She will not believe you planned this."],
      friends: ["Researched so you don't have to.", "Better than doom-scrolling.", "Your move, legend."],
      family: ["Your kids will think you are cool. Briefly.", "Memories over Wi-Fi."],
    };

    var ctx = (theWho || "friends") + "-" + (theTod || "evening");
    var titles = titlesMap[ctx] || titlesMap["friends-evening"];
    var tags = tagsMap[theWho] || tagsMap.friends;

    // ─── SMART SCHEDULING: reorder and retime stops ──────────────────────────
    if (stops.length > 1) {
      // Categorize all stops
      var outdoorStops = stops.filter(function(s) { return s.type === "outdoor" || s.type === "water"; });
      var picnicStops = stops.filter(function(s) { return s.type === "picnic"; });
      var dinnerStops = stops.filter(function(s) { return s.type === "food"; });
      var drinkStops = stops.filter(function(s) { return s.type === "drinks"; });
      var fixedStops = stops.filter(function(s) { return s.isLive || s.type === "movie" || s.type === "liveshow" || s.type === "sports"; });
      var activityStops = stops.filter(function(s) { return s.type === "activity"; });
      var stayInStops = stops.filter(function(s) { return s.type === "stayin"; });
      var hikeStops = stops.filter(function(s) { return (s.emoji || "").indexOf("🥾") !== -1; });

      // Find the fixed-time event
      var fixedEvent = fixedStops.length > 0 ? fixedStops[0] : null;
      var fixedTime = fixedEvent ? parseTimeToHours(fixedEvent.time) : null;

      var reordered = [];
      var hasOutdoor = outdoorStops.length > 0 || picnicStops.length > 0 || hikeStops.length > 0;
      var hasStayIn = stayInStops.length > 0;

      if (isAft) {
        // ── AFTERNOON: flexible, no strict rules ──
        // Outdoor/water first, then everything else in natural order
        var aftTime = 14;
        outdoorStops.forEach(function(s) { s.time = formatTime(aftTime); reordered.push(s); aftTime += 2; });
        picnicStops.forEach(function(s) { s.time = formatTime(aftTime); reordered.push(s); aftTime += 2; });
        drinkStops.forEach(function(s) { s.time = formatTime(aftTime); reordered.push(s); aftTime += 1; });
        dinnerStops.forEach(function(s) { s.time = formatTime(aftTime); reordered.push(s); aftTime += 1.5; });
        activityStops.forEach(function(s) { s.time = formatTime(Math.round(aftTime)); reordered.push(s); aftTime += 2; });
        fixedStops.forEach(function(s) { reordered.push(s); });
        stayInStops.forEach(function(s) { s.time = formatTime(Math.round(aftTime)); reordered.push(s); });

      } else if (isLN) {
        // ── LATE NIGHT: flexible order, dinner before 8 PM if possible ──
        var lnTime = 18;
        // Dinner first to keep it before 8 PM
        dinnerStops.forEach(function(s) { s.time = formatTime(lnTime); reordered.push(s); lnTime += 1.5; });
        drinkStops.forEach(function(s) { s.time = formatTime(lnTime); reordered.push(s); lnTime += 1; });
        outdoorStops.forEach(function(s) { s.time = formatTime(Math.round(lnTime)); reordered.push(s); lnTime += 2; });
        fixedStops.forEach(function(s) { reordered.push(s); lnTime = (fixedTime || lnTime) + 2.5; });
        activityStops.forEach(function(s) { s.time = formatTime(Math.round(lnTime)); reordered.push(s); lnTime += 2; });
        stayInStops.forEach(function(s) { s.time = formatTime(Math.round(lnTime)); reordered.push(s); });

      } else {
        // ── EVENING: smart scheduling ──

        if (hasOutdoor && !fixedEvent) {
          // Outdoor/water/picnic/hike goes FIRST, then dinner/drinks after
          var outTime = 16;
          outdoorStops.forEach(function(s) { s.time = formatTime(outTime); reordered.push(s); outTime += 2; });
          picnicStops.forEach(function(s) { s.time = formatTime(outTime); reordered.push(s); outTime += 2; });
          hikeStops.forEach(function(s) { if (reordered.indexOf(s) === -1) { s.time = formatTime(outTime); reordered.push(s); outTime += 2; } });
          var postOutTime = Math.max(outTime, 18);
          // After outdoor: dinner then drinks (or just whichever is present)
          dinnerStops.forEach(function(s) { s.time = formatTime(postOutTime); reordered.push(s); postOutTime += 1.5; });
          drinkStops.forEach(function(s) { s.time = formatTime(postOutTime); reordered.push(s); postOutTime += 1; });
          activityStops.forEach(function(s) { s.time = formatTime(Math.round(postOutTime)); reordered.push(s); postOutTime += 2; });
          stayInStops.forEach(function(s) { s.time = formatTime(Math.round(postOutTime)); reordered.push(s); });

        } else if (fixedEvent && fixedTime) {
          // ── Has a fixed-time event: work backwards ──

          if (fixedEvent.type === "sports") {
            // Dinner → Game → Drinks after
            if (hasOutdoor) {
              // Outdoor first, then dinner, then game, then drinks
              outdoorStops.forEach(function(s) { s.time = formatTime(Math.max(fixedTime - 4, 14)); reordered.push(s); });
              picnicStops.forEach(function(s) { s.time = formatTime(Math.max(fixedTime - 3.5, 14.5)); reordered.push(s); });
            }
            var sportsDinnerTime = Math.max(fixedTime - 1.5, 17.5);
            dinnerStops.forEach(function(s) { s.time = formatTime(sportsDinnerTime); reordered.push(s); });
            fixedStops.forEach(function(s) { reordered.push(s); });
            var postGameTime = fixedTime + 3;
            drinkStops.forEach(function(s) { s.time = formatTime(postGameTime); reordered.push(s); });
            activityStops.forEach(function(s) { s.time = formatTime(postGameTime + 1); reordered.push(s); });

          } else if (fixedEvent.type === "liveshow") {
            // Dinner → Pre-show drinks → Show
            if (hasOutdoor) {
              outdoorStops.forEach(function(s) { s.time = formatTime(Math.max(fixedTime - 4, 14)); reordered.push(s); });
              picnicStops.forEach(function(s) { s.time = formatTime(Math.max(fixedTime - 3.5, 14.5)); reordered.push(s); });
            }
            var showDinnerTime = Math.max(fixedTime - 2, 17.5);
            dinnerStops.forEach(function(s) { s.time = formatTime(showDinnerTime); reordered.push(s); });
            var preShowDrinks = fixedTime - 0.5;
            drinkStops.forEach(function(s) { s.time = formatTime(preShowDrinks); reordered.push(s); });
            fixedStops.forEach(function(s) { reordered.push(s); });
            activityStops.forEach(function(s) { s.time = formatTime(fixedTime + 2.5); reordered.push(s); });

          } else if (fixedEvent.type === "movie") {
            // Drinks → Dinner → Movie
            if (hasOutdoor) {
              outdoorStops.forEach(function(s) { s.time = formatTime(Math.max(fixedTime - 5, 14)); reordered.push(s); });
              picnicStops.forEach(function(s) { s.time = formatTime(Math.max(fixedTime - 4.5, 14.5)); reordered.push(s); });
            }
            var movieDrinksTime = Math.max(fixedTime - 2.5, 16.5);
            drinkStops.forEach(function(s) { s.time = formatTime(movieDrinksTime); reordered.push(s); });
            var movieDinnerTime = Math.max(fixedTime - 1.5, 17.5);
            dinnerStops.forEach(function(s) { s.time = formatTime(movieDinnerTime); reordered.push(s); });
            fixedStops.forEach(function(s) { reordered.push(s); });
            activityStops.forEach(function(s) { s.time = formatTime(fixedTime + 2.5); reordered.push(s); });
          }
          stayInStops.forEach(function(s) { s.time = "After"; reordered.push(s); });

        } else if (hasStayIn) {
          // ── Stay In: drinks out, grab takeout, head home ──
          var stayTime = 17;
          drinkStops.forEach(function(s) { s.time = formatTime(stayTime); reordered.push(s); stayTime += 1; });
          dinnerStops.forEach(function(s) { s.time = formatTime(stayTime); reordered.push(s); stayTime += 0.5; });
          stayInStops.forEach(function(s) { s.time = formatTime(Math.round(stayTime)); reordered.push(s); });

        } else {
          // ── No fixed event, no outdoor, no stay in: Drinks → Dinner → Activity ──
          var evTime = 17;
          drinkStops.forEach(function(s) { s.time = formatTime(evTime); reordered.push(s); evTime += 1; });
          dinnerStops.forEach(function(s) { s.time = formatTime(evTime); reordered.push(s); evTime += 1.5; });
          activityStops.forEach(function(s) { s.time = formatTime(Math.round(evTime)); reordered.push(s); evTime += 2; });
          fixedStops.forEach(function(s) { reordered.push(s); });
          stayInStops.forEach(function(s) { s.time = formatTime(Math.round(evTime)); reordered.push(s); });
        }
      }

      if (reordered.length > 0) stops = reordered;
    }

    var finalStops = stops.slice(0, 4);
    var budget = estimateBudget(finalStops);

    return {
      title: titles[Math.floor(Math.random() * titles.length)],
      tagline: tags[Math.floor(Math.random() * tags.length)],
      stops: finalStops,
      budget: budget,
      season: season,
      cluster: cluster,
    };
  }

  // ─── GENERATE PLAN ──────────────────────────────────────────────────────────
  async function generatePlan() {
    setStep("loading");
    setFadeIn(true);
    setLoading(true);
    setPlanSaved(false);

    var results = await Promise.all([fetchEvents(planDate), fetchWeather(planDate), fetchMovies()]);
    var events = results[0];
    var wx = results[1];
    var movies = results[2];
    setLiveEvents(events);
    setWeather(wx);
    setNowPlaying(movies);

    var localPlan = buildLocalPlan(wx, events, null, null, null, movies);
    var finalPlan = localPlan;

    // Try Claude API for better title and tagline (keep local plan's stops — they're already scheduled)
    try {
      var aud = who === "partner" ? "date night with wife" : who === "friends" ? "guys night with buddies" : "family night with kids";
      var stopsDesc = localPlan.stops.map(function(s) { return s.emoji + " " + s.name + " (" + s.type + ")"; }).join(", ");
      var prompt = "You are Man-Date, a fun Seattle dad planning app. Generate ONLY a witty title and tagline for this plan: " + moods.join("+") + " " + aud + " with stops: " + stopsDesc + ". Respond ONLY JSON: {\"title\":\"3-5 words\",\"tagline\":\"witty one-liner under 10 words\"}";
      var data = await callClaude({ model: "claude-sonnet-4-20250514", max_tokens: 150, messages: [{ role: "user", content: prompt }] });
      if (data && data.content) {
        var text = data.content.filter(function(i) { return i.type === "text"; }).map(function(i) { return i.text; }).join("\n");
        if (text) {
          var jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            var parsed = JSON.parse(jsonMatch[0]);
            if (parsed.title) finalPlan.title = parsed.title;
            if (parsed.tagline) finalPlan.tagline = parsed.tagline;
          }
        }
      }
    } catch(e) {}

    setPlan(finalPlan);
    await new Promise(function(r) { setTimeout(r, 300); });
    setLoading(false);
    setStep("results");
    setFadeIn(true);
  }

  async function quickShuffle() {
    setFadeIn(false);
    setPlanSaved(false);
    await new Promise(function(r) { setTimeout(r, 150); });
    setPlan(buildLocalPlan(weather, liveEvents, null, null, null, nowPlaying));
    setFadeIn(true);
  }

  function resetAll() {
    setWho(null); setPlanDate(""); setTimeOfDay(null); setMoods([]);
    setPlan(null); setLiveEvents([]); setWeather(null); setPlanSaved(false);
    goStep("splash");
  }

  // ─── SUGGEST A SPOT ─────────────────────────────────────────────────────────
  async function submitSpot() {
    setSugLoading(true);
    var enriched;
    try {
      var data = await callClaude({
        model: "claude-sonnet-4-20250514", max_tokens: 300,
        messages: [{ role: "user", content: "Clean up this venue for a Seattle dad app. Fix spelling, assign neighborhood, write fun description, determine kid-friendliness.\n\nName: " + sugName + ", Type: " + sugType + ", Neighborhood: " + sugHood + ", Notes: " + sugNotes + "\n\nRespond ONLY JSON: {\"name\":\"Name\",\"neighborhood\":\"Hood\",\"desc\":\"Fun desc\",\"kidFriendly\":true,\"vibe\":\"casual\",\"category\":\"" + sugType + "\",\"outdoor\":false}" }],
      });
      if (data && data.content) {
        var text = data.content.filter(function(i) { return i.type === "text"; }).map(function(i) { return i.text; }).join("");
        enriched = JSON.parse(text.replace(/```json|```/g, "").trim());
      }
    } catch(e) {}
    if (!enriched) enriched = { name: sugName, neighborhood: sugHood || "Seattle", desc: sugNotes || "Community submitted.", kidFriendly: false, vibe: "casual", category: sugType, outdoor: false };
    var updated = userSpots.concat([enriched]);
    setUserSpots(updated);
    try { localStorage.setItem("mandate-spots", JSON.stringify(updated)); } catch(e) {}
    setSugLoading(false); setSugDone(true); setSugName(""); setSugHood(""); setSugNotes("");
    setTimeout(function() { setSugDone(false); setShowSuggest(false); }, 1500);
  }

  // ─── STYLES ─────────────────────────────────────────────────────────────────
  var page = { minHeight: "100vh", background: COL.bg, color: COL.text, fontFamily: "'DM Sans', sans-serif", padding: 0, margin: 0, opacity: fadeIn ? 1 : 0, transition: "opacity 0.2s", overflowX: "hidden" };
  var cont = { maxWidth: "460px", margin: "0 auto", padding: "24px 20px", minHeight: "100vh", display: "flex", flexDirection: "column" };
  var hd = { fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", letterSpacing: "1px", color: COL.text, margin: "0 0 8px 0" };
  var sub = { fontSize: "15px", color: COL.muted, margin: "0 0 28px 0", lineHeight: "1.5" };
  var btnP = { width: "100%", padding: "16px 24px", background: "linear-gradient(135deg, " + COL.amber + ", " + COL.amberD + ")", color: "#0B0B0F", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.2s", marginTop: "auto" };
  var btnS = Object.assign({}, btnP, { background: "transparent", color: COL.muted, border: "1px solid " + COL.border, marginTop: "12px" });
  var crd = { background: COL.card, border: "1px solid " + COL.border, borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "all 0.2s" };
  var crdSel = Object.assign({}, crd, { background: COL.cardS, border: "1px solid " + COL.amberB, boxShadow: "0 0 20px " + COL.amberG });
  var bk = { background: "none", border: "none", color: COL.muted, cursor: "pointer", fontSize: "14px", padding: 0, marginBottom: "20px", textAlign: "left", fontFamily: "'DM Sans', sans-serif" };
  var inp = { width: "100%", padding: "12px 14px", background: COL.card, border: "1px solid " + COL.border, borderRadius: "12px", color: COL.text, fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
  var lbl = { fontSize: "12px", color: COL.muted, display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" };
  function logo(sz) { return { fontFamily: "'Bebas Neue', sans-serif", fontSize: sz, letterSpacing: "3px", background: "linear-gradient(135deg, " + COL.amber + ", #F0C850)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }; }
  function badge(clr, bg, bdr) { return { fontSize: "11px", color: clr, background: bg, border: "1px solid " + bdr, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap", display: "inline-block" }; }

  var whoLabel = who === "partner" ? "💑 Date Night" : who === "friends" ? "🍻 The Boys" : "👨‍👩‍👧‍👦 Family";
  var todLabel = timeOfDay === "afternoon" ? "☀️ Afternoon" : timeOfDay === "latenight" ? "🌙 Late Night" : "🌆 Evening";
  var moodLabels = { food: "🍽️ Food", drinks: "🍺 Drinks", activity: "🎯 Activity", movie: "🎬 Movie", liveshow: "🎶 Live Show", sports: "🏟️ Live Sports", stayin: "🏡 Stay In", outdoor: "🌲 Outdoor", water: "🚣 Water", picnic: "🧺 Picnic", dealers: "🎲 Dealer's Choice" };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={page}>
      <div style={cont}>

        {/* ── SPLASH ─────────────────────── */}
        {step === "splash" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", gap: "12px" }}>
            <div className="su d1" style={{ fontSize: "64px" }}>📅</div>
            <h1 className="logo-wrap" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "56px", letterSpacing: "5px", margin: 0, lineHeight: 1 }}>MAN-DATE</h1>
            <p className="su d3" style={{ color: COL.muted, fontSize: "17px", lineHeight: 1.5, maxWidth: "300px", margin: 0 }}>
              Stop Googling. Start doing.<br />
              <span style={{ fontSize: "14px", color: COL.dim }}>Built for dads who want better than pizza.</span>
            </p>
            <div className="su d4" style={{ width: "100%", maxWidth: "300px", marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <button style={btnP} onClick={function() { goStep("who"); }}>LET'S PLAN SOMETHING</button>
              <button style={Object.assign({}, btnP, { background: "linear-gradient(135deg, #FF6B35, #E84040)", fontSize: "15px", marginTop: 0 })} onClick={yoloPlan}>
                🎲 YOLO — SURPRISE ME
              </button>
              {savedPlans.length > 0 && (
                <button style={Object.assign({}, btnS, { marginTop: 0 })} onClick={function() { setShowMyDates(true); }}>
                  ⭐ MY DATES ({savedPlans.length})
                </button>
              )}
            </div>
            <p className="su d5" style={{ color: COL.dim, fontSize: "12px", margin: "4px 0 0" }}>
              Seattle · V2 · {getCurrentSeason().season} · {getCurrentSeason().note}
            </p>
          </div>
        )}

        {/* ── MY DATES MODAL ─────────────── */}
        {showMyDates && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 999, padding: "40px 20px", overflowY: "auto" }}>
            <div style={{ background: COL.bg, border: "1px solid " + COL.border, borderRadius: "20px", padding: "28px", maxWidth: "420px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={Object.assign({}, hd, { fontSize: "24px", margin: 0 })}>⭐ MY DATES</h3>
                <button onClick={function() { setShowMyDates(false); }} style={{ background: "none", border: "none", color: COL.muted, fontSize: "24px", cursor: "pointer" }}>✕</button>
              </div>
              {savedPlans.length === 0 && <p style={{ color: COL.muted, fontSize: "14px" }}>No saved dates yet. Generate a plan and tap the star to save it.</p>}
              {savedPlans.map(function(saved) {
                return (
                  <div key={saved.id} style={Object.assign({}, crd, { marginBottom: "12px", padding: "16px" })}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, cursor: "pointer" }} onClick={function() { loadSavedPlan(saved); }}>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: COL.amber }}>{saved.plan.title}</div>
                        <div style={{ fontSize: "12px", color: COL.muted, marginTop: "4px" }}>{saved.savedAt} · {saved.who === "partner" ? "Date Night" : saved.who === "friends" ? "Boys Night" : "Family"}</div>
                        <div style={{ fontSize: "12px", color: COL.dim, marginTop: "2px" }}>{saved.plan.stops.map(function(s) { return s.name; }).join(" → ")}</div>
                      </div>
                      <button onClick={function() { deleteSavedPlan(saved.id); }} style={{ background: "none", border: "none", color: COL.dim, fontSize: "16px", cursor: "pointer", padding: "4px 8px" }}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── WHO ─────────────────────────── */}
        {step === "who" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <button onClick={resetAll} style={bk}>← Back</button>
            <h2 className="su d1" style={hd}>WHO'S COMING?</h2>
            <p className="su d2" style={sub}>Pick your crew.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[{ k: "partner", e: "💑", l: "Date Night", s: "Wife / Partner" }, { k: "friends", e: "🍻", l: "The Boys", s: "Friends / Other Dads" }, { k: "family", e: "👨‍👩‍👧‍👦", l: "Family Night", s: "Kids Included" }].map(function(o, i) {
                return (
                  <div key={o.k} className={"su d" + (i + 3)} style={who === o.k ? crdSel : crd} onClick={function() { setWho(o.k); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontSize: "32px" }}>{o.e}</span>
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: 700 }}>{o.l}</div>
                        <div style={{ fontSize: "13px", color: COL.muted, marginTop: "2px" }}>{o.s}</div>
                      </div>
                      {who === o.k && <span style={{ marginLeft: "auto", color: COL.amber, fontSize: "20px" }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button style={Object.assign({}, btnP, { opacity: who ? 1 : 0.4, pointerEvents: who ? "auto" : "none" })} onClick={function() { goStep("when"); }}>NEXT</button>
          </div>
        )}

        {/* ── WHEN ────────────────────────── */}
        {step === "when" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <button onClick={function() { goStep("who"); }} style={bk}>← Back</button>
            <h2 className="su d1" style={hd}>WHEN'S IT GOING DOWN?</h2>
            <p className="su d2" style={sub}>Pick a date for live events + weather.</p>
            <div className="su d3" style={{ marginBottom: "24px" }}>
              <label style={lbl}>Date</label>
              <input type="date" value={planDate} onChange={function(e) { setPlanDate(e.target.value); }} style={inp} />
            </div>
            <div className="su d4">
              <label style={lbl}>Time of Day</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[{ k: "afternoon", e: "☀️", l: "Afternoon" }, { k: "evening", e: "🌆", l: "Evening" }, { k: "latenight", e: "🌙", l: "Late Night" }].map(function(t) {
                  return (
                    <div key={t.k} style={Object.assign({}, timeOfDay === t.k ? crdSel : crd, { textAlign: "center", padding: "16px 8px" })} onClick={function() { setTimeOfDay(t.k); }}>
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>{t.e}</div>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>{t.l}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button style={Object.assign({}, btnP, { opacity: timeOfDay ? 1 : 0.4, pointerEvents: timeOfDay ? "auto" : "none" })} onClick={function() { goStep("mood"); }}>NEXT</button>
          </div>
        )}

        {/* ── MOOD ────────────────────────── */}
        {step === "mood" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <button onClick={function() { goStep("when"); }} style={bk}>← Back</button>
            <h2 className="su d1" style={hd}>WHAT'S THE VIBE?</h2>
            <p className="su d2" style={sub}>Pick one or more.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              {[
                { k: "food", e: "🍽️", l: "Food" }, { k: "drinks", e: "🍺", l: "Drinks" },
                { k: "activity", e: "🎯", l: "Activity" }, { k: "movie", e: "🎬", l: "Movie" },
                { k: "liveshow", e: "🎶", l: "Live Show" }, { k: "sports", e: "🏟️", l: "Live Sports" },
                { k: "outdoor", e: "🌲", l: "Outdoor" }, { k: "water", e: "🚣", l: "On the Water" },
                { k: "picnic", e: "🧺", l: "Picnic" }, { k: "stayin", e: "🏡", l: "Stay In" },
              ].map(function(m, i) {
                return (
                  <div key={m.k} className={"su d" + Math.min(i + 3, 7)} style={Object.assign({}, moods.includes(m.k) ? crdSel : crd, { textAlign: "center", padding: "14px 8px" })} onClick={function() { toggleMood(m.k); }}>
                    <div style={{ fontSize: "24px", marginBottom: "4px" }}>{m.e}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{m.l}</div>
                    {moods.includes(m.k) && <div style={{ color: COL.amber, fontSize: "11px", marginTop: "4px", fontWeight: 700 }}>SELECTED</div>}
                  </div>
                );
              })}
            </div>
            <div className="su d7" style={Object.assign({}, moods.includes("dealers") ? crdSel : crd, { textAlign: "center", padding: "14px", marginBottom: "12px" })} onClick={function() { toggleMood("dealers"); }}>
              <span style={{ fontSize: "24px" }}>🎲</span>
              <span style={{ fontSize: "16px", fontWeight: 700, marginLeft: "10px" }}>DEALER'S CHOICE</span>
            </div>
            <button style={Object.assign({}, btnP, { opacity: moods.length > 0 ? 1 : 0.4, pointerEvents: moods.length > 0 ? "auto" : "none" })} onClick={generatePlan}>🔥 GENERATE MY MAN-DATE</button>
          </div>
        )}

        {/* ── LOADING ─────────────────────── */}
        {step === "loading" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "24px" }}>
            <div style={{ fontSize: "56px", animation: "pulse 1.5s infinite" }}>🧠</div>
            <h2 style={Object.assign({}, hd, { fontSize: "24px" })}>BUILDING YOUR PLAN</h2>
            <p style={{ color: COL.amber, fontSize: "15px", minHeight: "24px" }}>{loadMsg}</p>
          </div>
        )}

        {/* ── RESULTS ─────────────────────── */}
        {step === "results" && plan && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="su d1" style={{ textAlign: "center", marginBottom: "16px" }}>
              <p style={{ color: COL.amber, fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 6px" }}>YOUR MAN-DATE</p>
              <h2 style={Object.assign({}, logo("36px"), { lineHeight: 1.1 })}>{plan.title}</h2>
              <p style={{ color: COL.muted, fontSize: "14px", margin: "6px 0 0", fontStyle: "italic" }}>{plan.tagline}</p>

              {/* Context badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", justifyContent: "center", marginTop: "10px" }}>
                {who && <span style={badge(COL.muted, COL.card, COL.border)}>{whoLabel}</span>}
                {timeOfDay && <span style={badge(COL.muted, COL.card, COL.border)}>{todLabel}</span>}
                {moods.map(function(m) { return <span key={m} style={badge(COL.amber, COL.amberG, COL.amberB)}>{moodLabels[m] || m}</span>; })}
              </div>

              {/* Weather */}
              {weather && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "10px", padding: "6px 14px", background: weather.isRainy ? "rgba(232,64,64,0.1)" : "rgba(64,196,99,0.1)", border: "1px solid " + (weather.isRainy ? "rgba(232,64,64,0.3)" : "rgba(64,196,99,0.3)"), borderRadius: "10px" }}>
                  <span style={{ fontSize: "18px" }}>{weather.icon}</span>
                  <span style={{ fontSize: "13px", color: COL.text }}>{weather.hi}°F / {weather.lo}°F</span>
                  <span style={{ fontSize: "12px", color: COL.muted }}>{weather.label}</span>
                  {weather.isRainy && <span style={{ fontSize: "11px", color: "#E84040" }}>Indoor plan</span>}
                </div>
              )}
            </div>

            {/* Itinerary stops */}
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
              <div style={{ position: "absolute", left: "23px", top: "24px", bottom: "24px", width: "2px", background: "linear-gradient(to bottom, " + COL.amber + ", " + COL.amberD + ", transparent)", opacity: 0.3 }} />
              {plan.stops.map(function(s, i) {
                return (
                  <div key={i} className={"su d" + Math.min(i + 2, 7)} style={{ display: "flex", gap: "14px", padding: "10px 0", position: "relative" }}>
                    <div style={{ width: "46px", minWidth: "46px", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "2px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: s.isLive ? COL.blueG : COL.amberG, border: "2px solid " + (s.isLive ? COL.blueB : COL.amberB), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", position: "relative", zIndex: 1 }}>{s.emoji || "📍"}</div>
                    </div>
                    <div style={Object.assign({}, crd, { flex: 1, padding: "14px", cursor: s.url ? "pointer" : "default" })} onClick={function() { if (s.url) window.open(s.url, "_blank"); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 700 }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: COL.muted, marginTop: "2px" }}>{s.neighborhood}{s.time && <span style={{ color: COL.dim }}> · {s.time}</span>}</div>
                        </div>
                        <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                          {s.isLive && <span style={{ fontSize: "9px", fontWeight: 700, color: COL.blue, background: COL.blueG, padding: "2px 6px", borderRadius: "4px" }}>LIVE</span>}
                          <span style={{ fontSize: "9px", fontWeight: 700, color: COL.amber, background: COL.amberG, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{s.type}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", color: COL.muted, margin: 0, lineHeight: "1.4" }}>{s.description}</p>
                      {/* Action links */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                        {s.url && <a href={s.url} target="_blank" rel="noopener" onClick={function(e) { e.stopPropagation(); }} style={{ fontSize: "11px", color: COL.blue, textDecoration: "none" }}>🎟️ Tickets</a>}
                        {!s.isLive && s.type !== "stayin" && s.type !== "picnic" && (
                          <a href={mapsUrl(s.name, s.neighborhood)} target="_blank" rel="noopener" onClick={function(e) { e.stopPropagation(); }} style={{ fontSize: "11px", color: COL.muted, textDecoration: "none" }}>📍 Map · Hours</a>
                        )}
                        {s.book === "tock" && (
                          <a href={s.bookUrl || tockUrl(s.name)} target="_blank" rel="noopener" onClick={function(e) { e.stopPropagation(); }} style={{ fontSize: "11px", color: "#2D7FF9", textDecoration: "none", fontWeight: 600 }}>Book on Tock</a>
                        )}
                        {s.book === "resy" && (
                          <a href={s.bookUrl || resyUrl(s.name)} target="_blank" rel="noopener" onClick={function(e) { e.stopPropagation(); }} style={{ fontSize: "11px", color: "#E84040", textDecoration: "none", fontWeight: 600 }}>Reserve on Resy</a>
                        )}
                        {s.book === "opentable" && (
                          <a href={s.bookUrl || openTableUrl(s.name)} target="_blank" rel="noopener" onClick={function(e) { e.stopPropagation(); }} style={{ fontSize: "11px", color: "#DA3743", textDecoration: "none", fontWeight: 600 }}>OpenTable</a>
                        )}
                        {s.book === "doordash" && (
                          <a href={s.bookUrl || doordashUrl(s.name)} target="_blank" rel="noopener" onClick={function(e) { e.stopPropagation(); }} style={{ fontSize: "11px", color: "#FF3008", textDecoration: "none", fontWeight: 600 }}>Order DoorDash</a>
                        )}
                        {s.book === "walkin" && s.type === "food" && (
                          <span style={{ fontSize: "11px", color: COL.dim }}>Walk-in friendly</span>
                        )}
                        {s.type === "movie" && s.fandangoUrl && (
                          <a href={s.fandangoUrl} target="_blank" rel="noopener" onClick={function(e) { e.stopPropagation(); }} style={{ fontSize: "11px", color: "#FF6600", textDecoration: "none", fontWeight: 600 }}>🎟️ Get Tickets</a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Budget estimate */}
            {plan.budget && (
              <div className="su d6" style={{ textAlign: "center", padding: "12px", marginTop: "8px", background: COL.card, borderRadius: "12px", border: "1px solid " + COL.border }}>
                <span style={{ fontSize: "12px", color: COL.muted }}>💰 Estimated cost for two: </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: COL.amber }}>${plan.budget.low * 2} – ${plan.budget.high * 2}</span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ marginTop: "auto", paddingTop: "16px" }}>
              <button style={btnP} onClick={quickShuffle}>🔄 SHUFFLE — GIVE ME ANOTHER</button>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button style={Object.assign({}, btnS, { flex: 1, marginTop: 0, background: COL.card })} onClick={function() { setShowShareCard(true); }}>📤 SHARE</button>
                <button style={Object.assign({}, btnS, { flex: 1, marginTop: 0, background: planSaved ? "rgba(64,196,99,0.1)" : COL.card, borderColor: planSaved ? COL.green : COL.border, color: planSaved ? COL.green : COL.muted })} onClick={savePlan}>
                  {planSaved ? "⭐ SAVED" : "⭐ SAVE"}
                </button>
              </div>
              {who === "partner" && (
                <button style={Object.assign({}, btnS, { background: "rgba(52,199,89,0.08)", borderColor: "rgba(52,199,89,0.3)", color: "#34C759" })} onClick={textBabysitter}>
                  💬 TEXT MY BABYSITTER
                </button>
              )}
              <button style={Object.assign({}, btnS, { background: COL.card })} onClick={function() { setShowSuggest(true); }}>➕ SUGGEST A SPOT</button>
              <button style={btnS} onClick={resetAll}>← START OVER</button>
            </div>

            {/* Share card overlay */}
            {showShareCard && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "20px" }} onClick={function() { setShowShareCard(false); }}>
                <div style={{ background: COL.bg, borderRadius: "20px", padding: "32px 24px", maxWidth: "360px", width: "100%", textAlign: "center" }} onClick={function(e) { e.stopPropagation(); }}>
                  <p style={{ color: COL.amber, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 8px" }}>MAN-DATE</p>
                  <h3 style={Object.assign({}, logo("32px"), { lineHeight: 1.1 })}>{plan.title}</h3>
                  <p style={{ color: COL.muted, fontSize: "13px", margin: "6px 0 16px", fontStyle: "italic" }}>{plan.tagline}</p>
                  {plan.stops.map(function(s, i) {
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderTop: i > 0 ? ("1px solid " + COL.border) : "none" }}>
                        <span style={{ fontSize: "20px" }}>{s.emoji}</span>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: COL.text }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: COL.muted }}>{s.time} · {s.neighborhood}</div>
                        </div>
                      </div>
                    );
                  })}
                  {plan.budget && (
                    <p style={{ color: COL.amber, fontSize: "13px", fontWeight: 600, margin: "12px 0 0" }}>💰 ~${plan.budget.low * 2}–${plan.budget.high * 2} for two</p>
                  )}
                  <p style={{ color: COL.dim, fontSize: "10px", margin: "12px 0 0" }}>📅 man-date · Seattle</p>
                  <button style={Object.assign({}, btnP, { marginTop: "16px", fontSize: "14px", padding: "12px" })} onClick={sharePlan}>📤 SHARE VIA TEXT / COPY</button>
                  <button style={Object.assign({}, btnS, { fontSize: "13px", padding: "10px" })} onClick={function() { setShowShareCard(false); }}>Close</button>
                </div>
              </div>
            )}

            {/* Suggest modal */}
            {showSuggest && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "20px" }}>
                <div style={{ background: COL.bg, border: "1px solid " + COL.border, borderRadius: "20px", padding: "28px", maxWidth: "400px", width: "100%" }}>
                  {sugDone ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                      <p style={{ color: COL.text, fontSize: "16px", fontWeight: 600 }}>Spot added!</p>
                    </div>
                  ) : (
                    <div>
                      <h3 style={Object.assign({}, hd, { fontSize: "24px", marginBottom: "20px" })}>SUGGEST A SPOT</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div><label style={lbl}>Name</label><input style={inp} placeholder="e.g. West Seattle Bowl" value={sugName} onChange={function(e) { setSugName(e.target.value); }} /></div>
                        <div><label style={lbl}>Type</label><select style={inp} value={sugType} onChange={function(e) { setSugType(e.target.value); }}><option value="restaurant">Restaurant</option><option value="bar">Bar / Brewery</option><option value="activity">Activity</option><option value="outdoor">Outdoor</option></select></div>
                        <div><label style={lbl}>Neighborhood</label><input style={inp} placeholder="e.g. Ballard" value={sugHood} onChange={function(e) { setSugHood(e.target.value); }} /></div>
                        <div><label style={lbl}>Notes</label><input style={inp} placeholder="e.g. great for groups" value={sugNotes} onChange={function(e) { setSugNotes(e.target.value); }} /></div>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                        <button style={Object.assign({}, btnP, { flex: 1, opacity: sugName ? 1 : 0.4, pointerEvents: sugName ? "auto" : "none" })} onClick={submitSpot}>{sugLoading ? "Enriching..." : "ADD SPOT"}</button>
                        <button style={Object.assign({}, btnS, { flex: 0, minWidth: "80px", marginTop: 0 })} onClick={function() { setShowSuggest(false); }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

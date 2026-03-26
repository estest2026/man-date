import { useState, useEffect, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
var TM_KEY = "zQK7Dpvk0bMN04vArfdEZnIxma0gBBJ6";
var SEA_LAT = 47.6062;
var SEA_LNG = -122.3321;
var TEAMS = ["Mariners", "Seahawks", "Sounders", "Kraken", "Storm", "Huskies", "Ballard FC", "Reign"];

// ─── CURATED SEATTLE DATABASE ─────────────────────────────────────────────────
var DB = {
  bars: [
    { name: "Canon", neighborhood: "Capitol Hill", vibe: "upscale", desc: "Whiskey cathedral with 4,000+ bottles. Order an off-menu cocktail and feel like a gentleman.", kidFriendly: false },
    { name: "Navy Strength", neighborhood: "Belltown", vibe: "craft", desc: "Tiki-adjacent cocktail bar. The bartender remembers your order after one visit.", kidFriendly: false },
    { name: "Bathtub Gin & Co.", neighborhood: "Belltown", vibe: "speakeasy", desc: "Hidden speakeasy behind an unmarked door. You'll feel cool just finding the entrance.", kidFriendly: false },
    { name: "Optimism Brewing", neighborhood: "Capitol Hill", vibe: "casual", desc: "Giant indoor space, food trucks rotate, bring your own snacks. Dad paradise.", kidFriendly: true },
    { name: "Stoup Brewing", neighborhood: "Ballard", vibe: "casual", desc: "Ballard's chill brewery with a huge patio and rotating food trucks.", kidFriendly: true },
    { name: "Holy Mountain Brewing", neighborhood: "Interbay", vibe: "craft", desc: "Some of the best beer in Seattle. Grab a crowler and feel like a connoisseur.", kidFriendly: false },
    { name: "Flatstick Pub", neighborhood: "Pioneer Square", vibe: "active", desc: "Mini golf + craft beer + Duffin. Competitive dads, unite.", kidFriendly: false },
    { name: "Rhein Haus", neighborhood: "Capitol Hill", vibe: "active", desc: "Indoor bocce courts, giant pretzels, German beer. The activity bar that delivers.", kidFriendly: false },
    { name: "Fremont Brewing", neighborhood: "Fremont", vibe: "casual", desc: "Urban beer garden with great IPAs and a neighborhood block party vibe.", kidFriendly: true },
    { name: "Roquette", neighborhood: "Belltown", vibe: "upscale", desc: "French-inspired cocktails in an Art Deco gem. James Beard-nominated.", kidFriendly: false },
    { name: "Majnoon", neighborhood: "Queen Anne", vibe: "speakeasy", desc: "Persian-inspired cocktails. Sexy date night energy you won't find anywhere else.", kidFriendly: false },
    { name: "Rob Roy", neighborhood: "Capitol Hill", vibe: "upscale", desc: "Dark, lounge-y, legendary cocktails. Try the Gunpowder Punch.", kidFriendly: false },
    { name: "Triangle Spirits", neighborhood: "Fremont", vibe: "craft", desc: "Late-night cocktails plus some of the best fried chicken in Seattle.", kidFriendly: false },
    { name: "Percy's & Co.", neighborhood: "Ballard", vibe: "craft", desc: "Creative cocktails that make you linger for hours. Whiskey sour is elite.", kidFriendly: false },
    { name: "Death & Co", neighborhood: "Pioneer Square", vibe: "craft", desc: "NYC cocktail legends, now in Pioneer Square's RailSpur. 24+ original cocktails.", kidFriendly: false },
    { name: "Daphnes", neighborhood: "Edmonds", vibe: "craft", desc: "Tiny 15-seat bar with more energy than places twice its size.", kidFriendly: false },
    { name: "Dark Room", neighborhood: "Greenwood", vibe: "craft", desc: "Korean snacks meet booze-forward cocktails. Kimchi pimento cheese is elite.", kidFriendly: false },
    { name: "Left Bank", neighborhood: "South Park", vibe: "casual", desc: "Best natural wine in Seattle. Bring in a burger from Loretta's next door.", kidFriendly: false },
    { name: "Bottlehouse", neighborhood: "Madrona", vibe: "casual", desc: "Chill wine bar with a patio that makes you feel like a local.", kidFriendly: false },
  ],
  restaurants: [
    { name: "Canlis", neighborhood: "Queen Anne", vibe: "fine dining", desc: "The Seattle fine dining experience. Jacket encouraged, memories guaranteed.", kidFriendly: false, price: "$$$$" },
    { name: "Westward", neighborhood: "Lake Union", vibe: "upscale casual", desc: "Waterfront seafood with fire pits on the patio. The sunset date spot.", kidFriendly: false, price: "$$$" },
    { name: "Jeffry's", neighborhood: "Capitol Hill", vibe: "upscale casual", desc: "Bateau reborn. Dry-aged steaks with a Humble Cuts program for great beef without the $$$$ tag.", kidFriendly: false, price: "$$$" },
    { name: "Communion", neighborhood: "Central District", vibe: "upscale casual", desc: "Southern-meets-PNW comfort food. Mac and cheese is mandatory.", kidFriendly: true, price: "$$$" },
    { name: "Eden Hill", neighborhood: "Queen Anne", vibe: "intimate", desc: "12-seat counter. Chef's tasting. The ultimate date night flex.", kidFriendly: false, price: "$$$$" },
    { name: "Red Mill Burgers", neighborhood: "Phinney Ridge", vibe: "casual", desc: "Legendary Seattle burgers. Cash only. Worth every greasy napkin.", kidFriendly: true, price: "$" },
    { name: "Un Bien", neighborhood: "Ballard", vibe: "casual", desc: "Caribbean sandwiches that'll ruin all other sandwiches for you.", kidFriendly: true, price: "$" },
    { name: "Archipelago", neighborhood: "Hillman City", vibe: "trendy", desc: "Filipino fusion on every best-of list. Book ahead.", kidFriendly: true, price: "$$$" },
    { name: "Sawyer", neighborhood: "Ballard", vibe: "upscale casual", desc: "Seasonal PNW cooking in a gorgeous space. The Ballard date night spot.", kidFriendly: false, price: "$$$" },
    { name: "Mamnoon", neighborhood: "Capitol Hill", vibe: "upscale casual", desc: "Middle Eastern small plates that make sharing actually fun.", kidFriendly: true, price: "$$$" },
    { name: "Homer", neighborhood: "Beacon Hill", vibe: "upscale casual", desc: "Mediterranean flavors, wood-fired pitas, lamb ribs that haunt your dreams.", kidFriendly: true, price: "$$$" },
    { name: "Bar del Corso", neighborhood: "Beacon Hill", vibe: "casual", desc: "Neapolitan pizza institution. NYT top 25. Enough said.", kidFriendly: true, price: "$$" },
    { name: "Hamsa", neighborhood: "Wallingford", vibe: "casual", desc: "Palestinian counter with incredible sandwiches and falafel.", kidFriendly: true, price: "$" },
    { name: "Roma Roma", neighborhood: "Capitol Hill", vibe: "trendy", desc: "Roman-style pizza by weight. Seasonal toppings that rotate.", kidFriendly: true, price: "$$" },
    { name: "De La Soil", neighborhood: "Kenmore", vibe: "upscale casual", desc: "Farm-to-table inside Copperworks Distilling. Killer kids menu. Seattle Met 2025 ROTY.", kidFriendly: true, price: "$$$" },
    { name: "Mangosteen's Chicken Shop", neighborhood: "Rainier Valley", vibe: "casual", desc: "Fish sauce wings with calamansi. Garlic noodles that don't skimp.", kidFriendly: true, price: "$" },
    { name: "The Corson Building", neighborhood: "Georgetown", vibe: "fine dining", desc: "Lantern-lit garden dinners with hyper-seasonal PNW cooking. Pure romance.", kidFriendly: false, price: "$$$$" },
    { name: "Meesha", neighborhood: "Capitol Hill", vibe: "upscale", desc: "Creative Indian fine dining. Mutton kheema pao and ghee roast.", kidFriendly: false, price: "$$$" },
    { name: "Tacos Cometa", neighborhood: "Capitol Hill", vibe: "casual", desc: "The Cal Anderson taco stand got a real restaurant. Open til 2am weekends.", kidFriendly: true, price: "$" },
    { name: "Moto Pizza", neighborhood: "Pioneer Square", vibe: "casual", desc: "Detroit-style pizza with Filipino twists inside Smith Tower.", kidFriendly: true, price: "$$" },
    { name: "Blue Willow", neighborhood: "Capitol Hill", vibe: "trendy", desc: "Sichuan baby back ribs, honey walnut prawn buns, lanterns. Solid date night.", kidFriendly: false, price: "$$" },
    { name: "A.K. Pizza", neighborhood: "Othello", vibe: "casual", desc: "Best pizza in Seattle per everyone. Preorder slots drop at noon. Set an alarm.", kidFriendly: true, price: "$$" },
    { name: "Cafe Lolo", neighborhood: "Capitol Hill", vibe: "trendy", desc: "Grain-milling pasta in the Loveless building. Very I-know-things-about-food energy.", kidFriendly: false, price: "$$$" },
  ],
  activities: [
    { name: "Bad Axe Throwing", neighborhood: "SoDo", desc: "Throw sharp things at wood. Primal, satisfying, great for groups.", kidFriendly: false, type: "active" },
    { name: "The Garage", neighborhood: "Capitol Hill", desc: "Bowling + billiards + drinks. The triple threat of guys night.", kidFriendly: false, type: "active" },
    { name: "Escape Artist", neighborhood: "Ballard", desc: "Escape rooms that actually make you think.", kidFriendly: true, type: "puzzle" },
    { name: "TopGolf", neighborhood: "Renton", desc: "Driving range meets sports bar. You don't need to be good at golf.", kidFriendly: true, type: "active" },
    { name: "Comedy Underground", neighborhood: "Pioneer Square", desc: "Intimate comedy club in a literal underground space.", kidFriendly: false, type: "show" },
    { name: "SPIN Seattle", neighborhood: "Downtown", desc: "Ping pong bar. Unreasonably fun after two drinks.", kidFriendly: false, type: "active" },
    { name: "iFLY Indoor Skydiving", neighborhood: "Tukwila", desc: "Indoor skydiving. The kids and you will lose your minds.", kidFriendly: true, type: "active" },
    { name: "Mox Boarding House", neighborhood: "Ballard", desc: "Board game cafe with hundreds of games and food. Family nerd paradise.", kidFriendly: true, type: "games" },
    { name: "Seattle Bouldering Project", neighborhood: "Fremont", desc: "Indoor climbing gym. Great workout disguised as fun.", kidFriendly: true, type: "active" },
    { name: "West Seattle Bowl", neighborhood: "West Seattle", desc: "Old-school bowling with cosmic bowling nights.", kidFriendly: true, type: "active" },
    { name: "MoPOP", neighborhood: "Seattle Center", desc: "Museum of Pop Culture. Sci-fi, music, indie games.", kidFriendly: true, type: "explore" },
    { name: "Chihuly Garden and Glass", neighborhood: "Seattle Center", desc: "Mind-blowing glass art even your kids will love.", kidFriendly: true, type: "explore" },
    { name: "Dining in the Dark", neighborhood: "South Lake Union", desc: "Eat blindfolded. Weird? Yes. Unforgettable? Also yes.", kidFriendly: false, type: "explore" },
    { name: "Jet City Improv", neighborhood: "University District", desc: "Live improv comedy that is consistently hilarious.", kidFriendly: true, type: "show" },
    { name: "Archie McPhee", neighborhood: "Wallingford", desc: "The weirdest store in Seattle. Rubber chickens and pure kid joy.", kidFriendly: true, type: "explore" },
  ],
  outdoor: [
    { name: "Discovery Park", neighborhood: "Magnolia", desc: "534 acres ending at a lighthouse on the beach.", kidFriendly: true },
    { name: "Golden Gardens", neighborhood: "Ballard", desc: "Beach bonfires at sunset. Bring marshmallows.", kidFriendly: true },
    { name: "Gas Works Park", neighborhood: "Wallingford", desc: "Best skyline view + kite flying + picnic potential.", kidFriendly: true },
    { name: "Kerry Park", neighborhood: "Queen Anne", desc: "THE postcard view of Seattle.", kidFriendly: true },
    { name: "Alki Beach", neighborhood: "West Seattle", desc: "Beach walk, fish and chips, skyline views.", kidFriendly: true },
    { name: "Woodland Park Zoo", neighborhood: "Phinney Ridge", desc: "Classic family outing. Penguin exhibit is worth the trip.", kidFriendly: true },
    { name: "Green Lake Loop", neighborhood: "Green Lake", desc: "2.8 mile loop. Walk, bike, or rollerblade.", kidFriendly: true },
    { name: "Rattlesnake Ledge", neighborhood: "North Bend", desc: "Short hike, massive view payoff.", kidFriendly: true },
    { name: "Kubota Garden", neighborhood: "Rainier Beach", desc: "Hidden Japanese garden. Peaceful, beautiful, free.", kidFriendly: true },
    { name: "Seward Park", neighborhood: "Columbia City", desc: "Old-growth forest peninsula on Lake Washington.", kidFriendly: true },
    { name: "Snoqualmie Falls", neighborhood: "Snoqualmie", desc: "Giant waterfall, 45 min drive. Go on a weekday.", kidFriendly: true },
  ],
  stayIn: [
    { name: "Board Game Night", items: ["Ticket to Ride", "Raccoon Tycoon", "Dragomino", "Codenames", "Catan", "Azul", "Wingspan", "Sushi Go"], desc: "Pull out the good games. No screens allowed." },
    { name: "Puzzle Night", items: ["1000-piece landscape", "3D puzzle", "Mystery jigsaw"], desc: "Playlist on, drinks poured, 1000 pieces of zen." },
    { name: "Movie Marathon", items: ["80s action classics", "Studio Ghibli night", "Marvel chronological", "Dads pick finally"], desc: "Projector if you have one. Blanket fort if you don't." },
    { name: "Pizza Cook-Off", items: ["Homemade pizza night", "Taco bar", "Sushi rolling", "Breakfast for dinner"], desc: "Everyone gets a station. Chaos is the secret ingredient." },
    { name: "Science Experiments", items: ["Mentos and Coke", "Baking soda volcano", "Slime lab", "Crystal growing"], desc: "Be the cool parent. Secretly educational." },
    { name: "Video Game Tournament", items: ["Mario Kart bracket", "Smash Bros tournament", "Minecraft build battle"], desc: "Set up the bracket. Loser does dishes." },
    { name: "Backyard Campout", items: ["Tent setup", "S'mores station", "Ghost stories", "Stargazing app"], desc: "All the camping vibes, zero drive time." },
  ],
};

var LOAD_MSGS = ["Consulting the dad council...", "Checking the vibe forecast...", "Scanning live events...", "Checking the weather...", "Optimizing your evening...", "Making sure it is not just pizza again..."];

var COL = { bg: "#0B0B0F", card: "#16161D", cardS: "#1A1510", amber: "#E8A317", amberD: "#B87D12", amberG: "rgba(232,163,23,0.15)", amberB: "rgba(232,163,23,0.4)", text: "#F0EDE6", muted: "#8A8680", dim: "#5A5750", border: "rgba(255,255,255,0.06)", blue: "#4A9EE5", blueG: "rgba(74,158,229,0.15)", blueB: "rgba(74,158,229,0.4)" };

function pickRandom(arr, usedSet) {
  var available = arr.filter(function(item) { return !usedSet.has(item.name); });
  if (available.length === 0) return arr[Math.floor(Math.random() * arr.length)];
  var chosen = available[Math.floor(Math.random() * available.length)];
  usedSet.add(chosen.name);
  return chosen;
}

function formatTime(h) {
  var hour = Math.floor(h) > 12 ? Math.floor(h) - 12 : Math.floor(h);
  var min = (h % 1) >= 0.5 ? "30" : "00";
  var ampm = Math.floor(h) >= 12 ? "PM" : "AM";
  return hour + ":" + min + " " + ampm;
}

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
  var [showSuggest, setShowSuggest] = useState(false);
  var [sugName, setSugName] = useState("");
  var [sugType, setSugType] = useState("restaurant");
  var [sugHood, setSugHood] = useState("");
  var [sugNotes, setSugNotes] = useState("");
  var [sugLoading, setSugLoading] = useState(false);
  var [sugDone, setSugDone] = useState(false);

  // Load user spots from localStorage
  useEffect(function() {
    try {
      var saved = localStorage.getItem("mandate-spots");
      if (saved) { setUserSpots(JSON.parse(saved)); }
    } catch(e) { /* no spots yet */ }
  }, []);

  // Loading message animation
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
    if (fadeRef.current) { clearTimeout(fadeRef.current); }
    setFadeIn(false);
    fadeRef.current = setTimeout(function() {
      setStep(s);
      setFadeIn(true);
      fadeRef.current = null;
    }, 200);
  }

  function toggleMood(m) {
    setMoods(function(prev) {
      if (prev.includes(m)) { return prev.filter(function(x) { return x !== m; }); }
      return prev.concat([m]);
    });
  }

  // ─── TICKETMASTER (direct call — works outside artifact iframe) ────────────
  async function fetchEvents(dateStr) {
    if (!dateStr) return [];
    try {
      var ctrl = new AbortController();
      var tid = setTimeout(function() { ctrl.abort(); }, 5000);
      var url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" + TM_KEY + "&latlong=" + SEA_LAT + "," + SEA_LNG + "&radius=30&unit=miles&localStartDateTime=" + dateStr + "T00:00:00&localEndDateTime=" + dateStr + "T23:59:59&size=20&sort=date,asc";
      var res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      var data = await res.json();
      if (!data._embedded || !data._embedded.events) return [];
      return data._embedded.events.map(function(e) {
        var v = (e._embedded && e._embedded.venues && e._embedded.venues[0]) || {};
        var cl = (e.classifications && e.classifications[0]) || {};
        var seg = (cl.segment && cl.segment.name) || "";
        var genre = (cl.genre && cl.genre.name) || "";
        var isSport = seg === "Sports";
        var isMusic = seg === "Music";
        var isArts = seg === "Arts & Theatre";
        var isFam = seg === "Family" || genre === "Childrens" || genre === "Family" || isSport;
        var lt = (e.dates && e.dates.start && e.dates.start.localTime) || "";
        var tm = lt ? new Date("2000-01-01T" + lt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
        var pr = (e.priceRanges && e.priceRanges[0] && e.priceRanges[0].min) || null;
        var isTeam = TEAMS.some(function(t) { return (e.name || "").toLowerCase().includes(t.toLowerCase()); });
        return {
          name: e.name,
          neighborhood: (v.name) || "Seattle",
          desc: (isSport ? "🏟️ " : isMusic ? "🎵 " : isArts ? "🎭 " : "") + e.name + (v.name ? " at " + v.name : "") + ". " + (pr ? "From $" + Math.round(pr) : ""),
          kidFriendly: isFam,
          type: isSport ? "sports" : isMusic ? "concert" : isArts ? "show" : "event",
          time: tm,
          emoji: isSport ? "🏟️" : isMusic ? "🎵" : isArts ? "🎭" : "🎟️",
          isLive: true,
          isTeam: isTeam,
          url: e.url,
        };
      });
    } catch(e) { return []; }
  }

  // ─── WEATHER (direct call — works outside artifact iframe) ────────────────
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
      var labels = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 51: "Drizzle", 53: "Drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 80: "Showers", 95: "Thunderstorm" };
      return { icon: icons[code] || "🌤️", label: labels[code] || "Fair", hi: hi, lo: lo, rain: rain, isRainy: rain > 2 || code >= 61 };
    } catch(e) { return null; }
  }

  // ─── CLAUDE API (through Vercel serverless function) ──────────────────────
  async function callClaude(body) {
    try {
      var ctrl = new AbortController();
      var tid = setTimeout(function() { ctrl.abort(); }, 12000);
      var res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify(body),
      });
      clearTimeout(tid);
      return await res.json();
    } catch(e) {
      return null;
    }
  }

  function buildRelevantSpots() {
    var spots = {};
    var isFamily = who === "family";
    var allRestos = DB.restaurants.concat(userSpots.filter(function(s) { return s.category === "restaurant"; }));
    var allBars = DB.bars.concat(userSpots.filter(function(s) { return s.category === "bar"; }));
    var allActs = DB.activities.concat(userSpots.filter(function(s) { return s.category === "activity"; }));
    if (moods.includes("food") || moods.includes("dealers")) spots.restaurants = allRestos.filter(function(r) { return !isFamily || r.kidFriendly; });
    if (moods.includes("drinks") || moods.includes("dealers")) spots.bars = allBars.filter(function(b) { return !isFamily || b.kidFriendly; });
    if (moods.includes("activity") || moods.includes("event") || moods.includes("dealers")) spots.activities = allActs.filter(function(a) { return !isFamily || a.kidFriendly; });
    if (moods.includes("outdoor") || moods.includes("dealers")) spots.outdoor = DB.outdoor;
    if (moods.includes("stayin") || moods.includes("dealers")) spots.stayIn = DB.stayIn;
    if (Object.keys(spots).length === 0) { spots.restaurants = allRestos.slice(0, 5); spots.bars = allBars.slice(0, 5); spots.activities = allActs.slice(0, 5); }
    return spots;
  }

  function buildLocalPlan(wx, events) {
    var isF = who === "family", isP = who === "partner", isLN = timeOfDay === "latenight", isAft = timeOfDay === "afternoon";
    var used = new Set(); var stops = [];
    var baseH = isAft ? 14 : isLN ? 20 : 17; var hr = baseH;
    var bars = DB.bars.concat(userSpots.filter(function(s) { return s.category === "bar"; }));
    var restos = DB.restaurants.concat(userSpots.filter(function(s) { return s.category === "restaurant"; }));
    var acts = DB.activities.concat(userSpots.filter(function(s) { return s.category === "activity"; }));
    var moodOrder = ["outdoor", "drinks", "food", "activity", "event", "stayin"];
    var active;
    if (moods.includes("dealers")) {
      var options;
      if (isF) options = isLN ? ["food", "stayin"] : isAft ? ["food", "activity", "outdoor"] : ["food", "activity", "stayin"];
      else if (isP) options = isLN ? ["drinks", "food", "event"] : ["drinks", "food", "activity", "event"];
      else options = isLN ? ["drinks", "food", "activity", "event"] : isAft ? ["drinks", "food", "activity", "outdoor"] : ["drinks", "food", "activity", "event"];
      active = options.sort(function() { return Math.random() - 0.5; }).slice(0, 2 + Math.floor(Math.random() * 2));
    } else {
      active = moodOrder.filter(function(m) { return moods.includes(m); });
    }
    if (isLN || (wx && wx.isRainy)) active = active.filter(function(m) { return m !== "outdoor"; });

    // Inject live event if available
    if (events && events.length > 0 && (moods.includes("event") || moods.includes("activity") || moods.includes("dealers"))) {
      var sportsEv = events.filter(function(e) { return e.isTeam; });
      var relEv = events.filter(function(e) { return !isF || e.kidFriendly; });
      var injected = sportsEv[0] || (relEv.length > 0 ? relEv[0] : null);
      if (injected) {
        stops.push({ name: injected.name, type: injected.type, emoji: injected.emoji, time: injected.time || formatTime(hr), neighborhood: injected.neighborhood, description: injected.desc, isLive: true, url: injected.url });
        hr += 3;
        active = active.filter(function(m) { return m !== "event" && m !== "activity"; });
      }
    }

    for (var idx = 0; idx < active.length; idx++) {
      var mood = active[idx];
      if (mood === "drinks") {
        var bPool = isF ? bars.filter(function(b) { return b.kidFriendly; }) : isP ? bars.filter(function(b) { return ["upscale", "speakeasy", "craft"].includes(b.vibe); }) : bars;
        if (bPool.length > 0) { var bar = pickRandom(bPool, used); stops.push({ name: bar.name, type: "drinks", emoji: "🍺", time: formatTime(hr), neighborhood: bar.neighborhood, description: bar.desc }); hr += 1.5; }
      }
      if (mood === "food") {
        var fPool = restos.filter(function(r) { if (isF && !r.kidFriendly) return false; if (isP && (r.price === "$" || r.vibe === "casual")) return false; return true; });
        var resto = pickRandom(fPool.length > 0 ? fPool : restos, used);
        stops.push({ name: resto.name, type: "food", emoji: "🍽️", time: formatTime(Math.round(hr)), neighborhood: resto.neighborhood, description: resto.desc }); hr += 1.5;
      }
      if (mood === "activity" || mood === "event") {
        var aPool = acts.filter(function(a) { return !isF || a.kidFriendly; });
        if (aPool.length > 0) { var act = pickRandom(aPool, used); stops.push({ name: act.name, type: act.type === "show" ? "event" : "activity", emoji: act.type === "show" ? "🎶" : "🎯", time: formatTime(Math.round(hr)), neighborhood: act.neighborhood || "Seattle", description: act.desc }); hr += 2; }
      }
      if (mood === "outdoor") { var spot = pickRandom(DB.outdoor, used); stops.push({ name: spot.name, type: "outdoor", emoji: "🌲", time: formatTime(Math.round(hr)), neighborhood: spot.neighborhood, description: spot.desc }); hr += 2; }
      if (mood === "stayin") { var idea = pickRandom(DB.stayIn, used); var sitems = idea.items.slice().sort(function() { return Math.random() - 0.5; }); stops.push({ name: idea.name, type: "stayin", emoji: "🏡", time: formatTime(Math.round(hr)), neighborhood: "Home Base", description: idea.desc + " Try: " + sitems.slice(0, 3).join(", ") + "." }); hr += 2; }
    }
    if (stops.length === 0) { var fb = pickRandom(bars, used); var fa = pickRandom(acts, used); stops.push({ name: fb.name, type: "drinks", emoji: "🍺", time: formatTime(baseH), neighborhood: fb.neighborhood, description: fb.desc }, { name: fa.name, type: "activity", emoji: "🎯", time: formatTime(baseH + 2), neighborhood: fa.neighborhood || "Seattle", description: fa.desc }); }
    var titlesMap = { "friends-latenight": ["After Hours Protocol", "The Late Shift"], "friends-evening": ["The Dad Special", "Full Send Friday", "No Excuses Night", "Boys Night Blueprint"], "friends-afternoon": ["Day Drinking Agenda", "Hooky Hours"], "partner-latenight": ["Late Night Romance", "The Night Cap"], "partner-evening": ["Date Night Done Right", "No Babysitter Wasted"], "partner-afternoon": ["Afternoon Escape", "The Matinee Date"], "family-evening": ["Family Fun Unlocked", "Friday Night Legends", "Kid Approved"], "family-afternoon": ["Sunshine Squad", "Explorer Mode ON"], "family-latenight": ["Movie Night Supreme", "Past Bedtime Club"] };
    var tagsMap = { partner: ["Effort looks good on you.", "She will not believe you planned this."], friends: ["Researched so you don't have to.", "Better than doom-scrolling.", "Your move, legend."], family: ["Your kids will think you are cool. Briefly.", "Memories over Wi-Fi."] };
    var ctx = (who || "friends") + "-" + (timeOfDay || "evening");
    var titles = titlesMap[ctx] || titlesMap["friends-evening"];
    var tags = tagsMap[who] || tagsMap.friends;
    return { title: titles[Math.floor(Math.random() * titles.length)], tagline: tags[Math.floor(Math.random() * tags.length)], stops: stops.slice(0, 4) };
  }

  async function generatePlan() {
    setStep("loading"); setFadeIn(true); setLoading(true);
    // Fetch live data in parallel
    var results = await Promise.all([fetchEvents(planDate), fetchWeather(planDate)]);
    var events = results[0]; var wx = results[1];
    setLiveEvents(events); setWeather(wx);
    // Build local plan with live data
    var localPlan = buildLocalPlan(wx, events);
    var finalPlan = localPlan;
    // Try Claude API upgrade
    try {
      var aud = who === "partner" ? "date night with wife" : who === "friends" ? "guys night with buddies" : "family night with kids";
      var spots = buildRelevantSpots();
      var compact = {};
      Object.keys(spots).forEach(function(k) { compact[k] = spots[k].slice(0, 8).map(function(s) { return { name: s.name, neighborhood: s.neighborhood, desc: s.desc }; }); });
      var evStr = events.length > 0 ? "\nLIVE EVENTS TONIGHT: " + JSON.stringify(events.slice(0, 5).map(function(e) { return { name: e.name, venue: e.neighborhood, time: e.time, type: e.type }; })) : "";
      var wxStr = wx ? "\nWEATHER: " + wx.label + ", " + wx.hi + "F, " + (wx.isRainy ? "RAINY avoid outdoor" : "good for outdoor") : "";
      var prompt = "You are Man-Date, a fun planning app for Seattle dads. Build a " + moods.join("+") + " plan for " + aud + ". Time: " + (timeOfDay || "evening") + "." + wxStr + evStr + "\nVENUES: " + JSON.stringify(compact) + "\nPick 2-4 stops. " + (wx && wx.isRainy ? "No outdoor. " : "") + "Include a live event if relevant. Fun descriptions. ONLY JSON:\n{\"title\":\"3-5 words\",\"tagline\":\"witty one-liner\",\"stops\":[{\"name\":\"Venue\",\"type\":\"food|drinks|activity|event|sports|stayin|outdoor\",\"emoji\":\"emoji\",\"time\":\"7:00 PM\",\"neighborhood\":\"Area\",\"description\":\"1-2 sentences\",\"isLive\":false}]}";
      var data = await callClaude({ model: "claude-sonnet-4-20250514", max_tokens: 600, messages: [{ role: "user", content: prompt }] });
      if (data && data.content) {
        var text = data.content.filter(function(i) { return i.type === "text"; }).map(function(i) { return i.text; }).join("\n");
        if (text) {
          var jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) { var parsed = JSON.parse(jsonMatch[0]); if (parsed.stops && parsed.stops.length > 0) { finalPlan = parsed; } }
        }
      }
    } catch(e) { /* Claude unavailable, local plan is fine */ }
    setPlan(finalPlan);
    await new Promise(function(r) { setTimeout(r, 300); });
    setLoading(false); setStep("results"); setFadeIn(true);
  }

  async function quickShuffle() {
    setFadeIn(false);
    await new Promise(function(r) { setTimeout(r, 150); });
    setPlan(buildLocalPlan(weather, liveEvents));
    setFadeIn(true);
  }

  function resetAll() { setWho(null); setPlanDate(""); setTimeOfDay(null); setMoods([]); setPlan(null); setLiveEvents([]); setWeather(null); goStep("splash"); }

  async function submitSpot() {
    setSugLoading(true);
    var enriched;
    try {
      var data = await callClaude({
        model: "claude-sonnet-4-20250514", max_tokens: 300,
        messages: [{ role: "user", content: "Clean up this venue for a Seattle dad-planning app. Fix spelling, assign neighborhood, write fun 1-2 sentence description, determine kid-friendliness.\n\nName: " + sugName + ", Type: " + sugType + ", Neighborhood: " + sugHood + ", Notes: " + sugNotes + "\n\nRespond ONLY JSON: {\"name\":\"Name\",\"neighborhood\":\"Hood\",\"desc\":\"Fun desc\",\"kidFriendly\":true,\"vibe\":\"casual\",\"category\":\"" + sugType + "\",\"outdoor\":false}" }],
      });
      if (data && data.content) {
        var text = data.content.filter(function(i) { return i.type === "text"; }).map(function(i) { return i.text; }).join("");
        enriched = JSON.parse(text.replace(/```json|```/g, "").trim());
      }
    } catch(e) { /* fallback below */ }
    if (!enriched) { enriched = { name: sugName, neighborhood: sugHood || "Seattle", desc: sugNotes || "Community submitted spot.", kidFriendly: false, vibe: "casual", category: sugType, outdoor: false }; }
    var updated = userSpots.concat([enriched]);
    setUserSpots(updated);
    try { localStorage.setItem("mandate-spots", JSON.stringify(updated)); } catch(e) { /* */ }
    setSugLoading(false); setSugDone(true); setSugName(""); setSugHood(""); setSugNotes("");
    setTimeout(function() { setSugDone(false); setShowSuggest(false); }, 1500);
  }

  // ─── STYLES ────────────────────────────────────────────────────────────────
  var pageStyle = { minHeight: "100vh", background: COL.bg, color: COL.text, fontFamily: "'DM Sans', sans-serif", padding: 0, margin: 0, opacity: fadeIn ? 1 : 0, transition: "opacity 0.2s", overflowX: "hidden" };
  var contStyle = { maxWidth: "460px", margin: "0 auto", padding: "24px 20px", minHeight: "100vh", display: "flex", flexDirection: "column" };
  var hdStyle = { fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", letterSpacing: "1px", color: COL.text, margin: "0 0 8px 0" };
  var subStyle = { fontSize: "15px", color: COL.muted, margin: "0 0 28px 0", lineHeight: "1.5" };
  var btnPStyle = { width: "100%", padding: "16px 24px", background: "linear-gradient(135deg, " + COL.amber + ", " + COL.amberD + ")", color: "#0B0B0F", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.2s", marginTop: "auto" };
  var btnSStyle = Object.assign({}, btnPStyle, { background: "transparent", color: COL.muted, border: "1px solid " + COL.border, marginTop: "12px" });
  var cardStyle = { background: COL.card, border: "1px solid " + COL.border, borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "all 0.2s" };
  var cardSelStyle = Object.assign({}, cardStyle, { background: COL.cardS, border: "1px solid " + COL.amberB, boxShadow: "0 0 20px " + COL.amberG });
  var backStyle = { background: "none", border: "none", color: COL.muted, cursor: "pointer", fontSize: "14px", padding: 0, marginBottom: "20px", textAlign: "left", fontFamily: "'DM Sans', sans-serif" };
  var inputStyle = { width: "100%", padding: "12px 14px", background: COL.card, border: "1px solid " + COL.border, borderRadius: "12px", color: COL.text, fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
  var labelStyle = { fontSize: "12px", color: COL.muted, display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" };

  function logoStyle(sz) { return { fontFamily: "'Bebas Neue', sans-serif", fontSize: sz, letterSpacing: "3px", background: "linear-gradient(135deg, " + COL.amber + ", #F0C850)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }; }
  function badgeStyle(clr, bg, bdr) { return { fontSize: "11px", color: clr, background: bg, border: "1px solid " + bdr, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }; }

  var whoLabel = who === "partner" ? "💑 Date Night" : who === "friends" ? "🍻 The Boys" : "👨‍👩‍👧‍👦 Family";
  var todLabel = timeOfDay === "afternoon" ? "☀️ Afternoon" : timeOfDay === "latenight" ? "🌙 Late Night" : "🌆 Evening";
  var moodLabels = { food: "🍽️ Food", drinks: "🍺 Drinks", activity: "🎯 Activity", event: "🎶 Event", stayin: "🏡 Stay In", outdoor: "🌲 Outdoor", dealers: "🎲 Dealer's Choice" };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={contStyle}>

        {step === "splash" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", gap: "16px" }}>
            <div className="su d1" style={{ fontSize: "64px" }}>📅</div>
            <h1 className="su d2" style={logoStyle("56px")}>MAN-DATE</h1>
            <p className="su d3" style={{ color: COL.muted, fontSize: "17px", lineHeight: 1.5, maxWidth: "300px", margin: 0 }}>Stop Googling. Start doing.<br /><span style={{ fontSize: "14px", color: COL.dim }}>Built for dads who want better than pizza.</span></p>
            <div className="su d4" style={{ width: "100%", maxWidth: "300px", marginTop: "24px" }}>
              <button style={btnPStyle} onClick={function() { goStep("who"); }}>LET'S PLAN SOMETHING</button>
            </div>
            <p className="su d5" style={{ color: COL.dim, fontSize: "12px", margin: "8px 0 0" }}>Seattle · V2 · Live Events + Weather</p>
          </div>
        )}

        {step === "who" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <button onClick={resetAll} style={backStyle}>← Back</button>
            <h2 className="su d1" style={hdStyle}>WHO'S COMING?</h2>
            <p className="su d2" style={subStyle}>Pick your crew.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[{ k: "partner", e: "💑", l: "Date Night", s: "Wife / Partner" }, { k: "friends", e: "🍻", l: "The Boys", s: "Friends / Other Dads" }, { k: "family", e: "👨‍👩‍👧‍👦", l: "Family Night", s: "Kids Included" }].map(function(o, i) {
                return (<div key={o.k} className={"su d" + (i + 3)} style={who === o.k ? cardSelStyle : cardStyle} onClick={function() { setWho(o.k); }}><div style={{ display: "flex", alignItems: "center", gap: "16px" }}><span style={{ fontSize: "32px" }}>{o.e}</span><div><div style={{ fontSize: "18px", fontWeight: 700 }}>{o.l}</div><div style={{ fontSize: "13px", color: COL.muted, marginTop: "2px" }}>{o.s}</div></div>{who === o.k && <span style={{ marginLeft: "auto", color: COL.amber, fontSize: "20px" }}>✓</span>}</div></div>);
              })}
            </div>
            <button style={Object.assign({}, btnPStyle, { opacity: who ? 1 : 0.4, pointerEvents: who ? "auto" : "none" })} onClick={function() { goStep("when"); }}>NEXT</button>
          </div>
        )}

        {step === "when" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <button onClick={function() { goStep("who"); }} style={backStyle}>← Back</button>
            <h2 className="su d1" style={hdStyle}>WHEN'S IT GOING DOWN?</h2>
            <p className="su d2" style={subStyle}>Pick a date to unlock live events + weather.</p>
            <div className="su d3" style={{ marginBottom: "24px" }}><label style={labelStyle}>Date</label><input type="date" value={planDate} onChange={function(e) { setPlanDate(e.target.value); }} style={inputStyle} /></div>
            <div className="su d4"><label style={labelStyle}>Time of Day</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[{ k: "afternoon", e: "☀️", l: "Afternoon" }, { k: "evening", e: "🌆", l: "Evening" }, { k: "latenight", e: "🌙", l: "Late Night" }].map(function(t) {
                  return (<div key={t.k} style={Object.assign({}, timeOfDay === t.k ? cardSelStyle : cardStyle, { textAlign: "center", padding: "16px 8px" })} onClick={function() { setTimeOfDay(t.k); }}><div style={{ fontSize: "24px", marginBottom: "6px" }}>{t.e}</div><div style={{ fontSize: "13px", fontWeight: 600 }}>{t.l}</div></div>);
                })}
              </div>
            </div>
            <button style={Object.assign({}, btnPStyle, { opacity: timeOfDay ? 1 : 0.4, pointerEvents: timeOfDay ? "auto" : "none" })} onClick={function() { goStep("mood"); }}>NEXT</button>
          </div>
        )}

        {step === "mood" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <button onClick={function() { goStep("when"); }} style={backStyle}>← Back</button>
            <h2 className="su d1" style={hdStyle}>WHAT'S THE VIBE?</h2>
            <p className="su d2" style={subStyle}>Pick one or more. Or hit Dealer's Choice.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              {[{ k: "food", e: "🍽️", l: "Food", s: "Restaurant" }, { k: "drinks", e: "🍺", l: "Drinks", s: "Bar / Brewery" }, { k: "activity", e: "🎯", l: "Activity", s: "Do something" }, { k: "event", e: "🎶", l: "Live Event", s: "Show / Concert" }, { k: "stayin", e: "🏡", l: "Stay In", s: "Games / Movie" }, { k: "outdoor", e: "🌲", l: "Outdoor", s: "Hike / Park" }].map(function(m, i) {
                return (<div key={m.k} className={"su d" + (i + 3)} style={Object.assign({}, moods.includes(m.k) ? cardSelStyle : cardStyle, { textAlign: "center", padding: "18px 10px" })} onClick={function() { toggleMood(m.k); }}><div style={{ fontSize: "28px", marginBottom: "6px" }}>{m.e}</div><div style={{ fontSize: "15px", fontWeight: 700 }}>{m.l}</div><div style={{ fontSize: "11px", color: COL.muted, marginTop: "2px" }}>{m.s}</div>{moods.includes(m.k) && <div style={{ color: COL.amber, fontSize: "12px", marginTop: "6px", fontWeight: 700 }}>SELECTED</div>}</div>);
              })}
            </div>
            <div className="su d7" style={Object.assign({}, moods.includes("dealers") ? cardSelStyle : cardStyle, { textAlign: "center", padding: "18px", marginBottom: "16px" })} onClick={function() { toggleMood("dealers"); }}>
              <span style={{ fontSize: "28px" }}>🎲</span><span style={{ fontSize: "17px", fontWeight: 700, marginLeft: "12px" }}>DEALER'S CHOICE</span>
              <div style={{ fontSize: "12px", color: COL.muted, marginTop: "4px" }}>Surprise me with a combo</div>
            </div>
            <button style={Object.assign({}, btnPStyle, { opacity: moods.length > 0 ? 1 : 0.4, pointerEvents: moods.length > 0 ? "auto" : "none" })} onClick={generatePlan}>🔥 GENERATE MY MAN-DATE</button>
          </div>
        )}

        {step === "loading" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "24px" }}>
            <div style={{ fontSize: "56px", animation: "pulse 1.5s infinite" }}>🧠</div>
            <h2 style={Object.assign({}, hdStyle, { fontSize: "24px" })}>BUILDING YOUR PLAN</h2>
            <p style={{ color: COL.amber, fontSize: "15px", minHeight: "24px" }}>{loadMsg}</p>
          </div>
        )}

        {step === "results" && plan && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="su d1" style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ color: COL.amber, fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 8px" }}>YOUR MAN-DATE</p>
              <h2 style={Object.assign({}, logoStyle("40px"), { lineHeight: 1.1 })}>{plan.title}</h2>
              <p style={{ color: COL.muted, fontSize: "14px", margin: "8px 0 0", fontStyle: "italic" }}>{plan.tagline}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginTop: "12px" }}>
                {who && <span style={badgeStyle(COL.muted, COL.card, COL.border)}>{whoLabel}</span>}
                {timeOfDay && <span style={badgeStyle(COL.muted, COL.card, COL.border)}>{todLabel}</span>}
                {moods.map(function(m) { return <span key={m} style={badgeStyle(COL.amber, COL.amberG, COL.amberB)}>{moodLabels[m] || m}</span>; })}
              </div>
              {weather && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "8px 16px", background: weather.isRainy ? "rgba(232,64,64,0.1)" : "rgba(64,196,99,0.1)", border: "1px solid " + (weather.isRainy ? "rgba(232,64,64,0.3)" : "rgba(64,196,99,0.3)"), borderRadius: "12px" }}>
                  <span style={{ fontSize: "20px" }}>{weather.icon}</span>
                  <span style={{ fontSize: "13px", color: COL.text }}>{weather.hi}°F / {weather.lo}°F</span>
                  <span style={{ fontSize: "12px", color: COL.muted }}>{weather.label}</span>
                  {weather.isRainy && <span style={{ fontSize: "11px", color: "#E84040" }}>Indoor plan</span>}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
              <div style={{ position: "absolute", left: "23px", top: "24px", bottom: "24px", width: "2px", background: "linear-gradient(to bottom, " + COL.amber + ", " + COL.amberD + ", transparent)", opacity: 0.3 }} />
              {plan.stops.map(function(s, i) {
                return (
                  <div key={i} className={"su d" + (i + 2)} style={{ display: "flex", gap: "16px", padding: "12px 0", position: "relative" }}>
                    <div style={{ width: "48px", minWidth: "48px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "2px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: s.isLive ? COL.blueG : COL.cardS, border: "2px solid " + (s.isLive ? COL.blueB : COL.amberB), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", position: "relative", zIndex: 1 }}>{s.emoji || "📍"}</div>
                    </div>
                    <div style={Object.assign({}, cardStyle, { flex: 1, padding: "16px", cursor: s.url ? "pointer" : "default" })} onClick={function() { if (s.url) window.open(s.url, "_blank"); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div><div style={{ fontSize: "17px", fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: "12px", color: COL.muted, marginTop: "2px" }}>{s.neighborhood}{s.time && <span style={{ color: COL.dim }}> · {s.time}</span>}</div></div>
                        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                          {s.isLive && <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: COL.blue, background: COL.blueG, padding: "3px 8px", borderRadius: "6px" }}>LIVE</span>}
                          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: COL.amber, background: COL.amberG, padding: "3px 8px", borderRadius: "6px" }}>{s.type}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", color: COL.muted, margin: 0, lineHeight: "1.5" }}>{s.description}</p>
                      {s.url && <p style={{ fontSize: "11px", color: COL.blue, margin: "6px 0 0" }}>🎟️ Tap for tickets</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "auto", paddingTop: "24px" }}>
              <button style={btnPStyle} onClick={quickShuffle}>🔄 SHUFFLE — GIVE ME ANOTHER</button>
              <button style={Object.assign({}, btnSStyle, { background: COL.card })} onClick={function() { setShowSuggest(true); }}>➕ SUGGEST A SPOT</button>
              <button style={btnSStyle} onClick={resetAll}>← START OVER</button>
            </div>

            {showSuggest && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "20px" }}>
                <div style={{ background: COL.bg, border: "1px solid " + COL.border, borderRadius: "20px", padding: "28px", maxWidth: "400px", width: "100%" }}>
                  {sugDone ? (
                    <div style={{ textAlign: "center", padding: "20px" }}><div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div><p style={{ color: COL.text, fontSize: "16px", fontWeight: 600 }}>Spot added!</p><p style={{ color: COL.muted, fontSize: "13px" }}>Claude cleaned it up and added it to your database.</p></div>
                  ) : (
                    <div>
                      <h3 style={Object.assign({}, hdStyle, { fontSize: "24px", marginBottom: "20px" })}>SUGGEST A SPOT</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div><label style={labelStyle}>Name</label><input style={inputStyle} placeholder="e.g. West Seattle Bowl" value={sugName} onChange={function(e) { setSugName(e.target.value); }} /></div>
                        <div><label style={labelStyle}>Type</label><select style={inputStyle} value={sugType} onChange={function(e) { setSugType(e.target.value); }}><option value="restaurant">Restaurant</option><option value="bar">Bar / Brewery</option><option value="activity">Activity</option><option value="outdoor">Outdoor Spot</option></select></div>
                        <div><label style={labelStyle}>Neighborhood</label><input style={inputStyle} placeholder="e.g. Ballard" value={sugHood} onChange={function(e) { setSugHood(e.target.value); }} /></div>
                        <div><label style={labelStyle}>Notes</label><input style={inputStyle} placeholder="e.g. great for groups" value={sugNotes} onChange={function(e) { setSugNotes(e.target.value); }} /></div>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                        <button style={Object.assign({}, btnPStyle, { flex: 1, opacity: sugName ? 1 : 0.4, pointerEvents: sugName ? "auto" : "none" })} onClick={submitSpot}>{sugLoading ? "Claude is enriching..." : "ADD SPOT"}</button>
                        <button style={Object.assign({}, btnSStyle, { flex: 0, minWidth: "80px", marginTop: 0 })} onClick={function() { setShowSuggest(false); }}>Cancel</button>
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

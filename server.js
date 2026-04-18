const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;

loadEnvFile(path.join(ROOT_DIR, ".env"));

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const LOCAL_SUPPORT_LOCATIONS = [
  {
    name: "Harlem Fresh Market",
    address: "1400 5th Ave, New York, NY",
    zipCode: "10026",
    borough: "manhattan",
    acceptsCash: true,
    acceptsCard: true,
    acceptsBenefits: true,
  },
  {
    name: "Bronx Community Market",
    address: "560 Melrose Ave, Bronx, NY",
    zipCode: "10455",
    borough: "bronx",
    acceptsCash: true,
    acceptsCard: true,
    acceptsBenefits: true,
  },
  {
    name: "Brooklyn Family Foods",
    address: "188 Flatbush Ave, Brooklyn, NY",
    zipCode: "11217",
    borough: "brooklyn",
    acceptsCash: true,
    acceptsCard: true,
    acceptsBenefits: true,
  },
  {
    name: "Queens Neighborhood Grocer",
    address: "90-15 Queens Blvd, Queens, NY",
    zipCode: "11373",
    borough: "queens",
    acceptsCash: true,
    acceptsCard: true,
    acceptsBenefits: true,
  },
  {
    name: "Staten Island Healthy Basket",
    address: "154 Bay St, Staten Island, NY",
    zipCode: "10301",
    borough: "staten-island",
    acceptsCash: true,
    acceptsCard: true,
    acceptsBenefits: true,
  },
];

const NYC_BOROUGH_LOOKUP = [
  { borough: "manhattan", prefixes: ["100", "101", "102"] },
  { borough: "bronx", prefixes: ["104"] },
  { borough: "brooklyn", prefixes: ["112"] },
  { borough: "queens", prefixes: ["111", "113", "114", "116"] },
  { borough: "staten-island", prefixes: ["103"] },
];

const RESULTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "grocerySuggestions",
    "mealStrategy",
    "budgetOrBenefitSummary",
  ],
  properties: {
    grocerySuggestions: {
      type: "array",
      items: {
        type: "string",
      },
    },
    mealStrategy: {
      type: "string",
    },
    budgetOrBenefitSummary: {
      type: "string",
    },
  },
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "POST" && requestUrl.pathname === "/api/meal-plan") {
      const requestBody = await readJsonBody(request);
      const mealPlan = await buildMealPlan(requestBody);
      sendJson(response, 200, mealPlan);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await serveStaticFile(requestUrl.pathname, response, request.method);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, {
      error: error.message || "Something went wrong while building the meal plan.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Smart Meal Finder is running at http://localhost:${PORT}`);
});

async function buildMealPlan(userData) {
  validatePayload(userData);

  const { baseline, preferences } = userData;
  const recipeQuery = createRecipeQuery(baseline, preferences);
  let recipes = getFallbackRecipes();
  let nearbyStores = LOCAL_SUPPORT_LOCATIONS.slice(0, 3);

  try {
    recipes = await fetchRecipes(recipeQuery);
  } catch (error) {
    console.warn("Recipe lookup failed, using fallback recipes instead.");
    console.warn(error.message);
  }

  try {
    nearbyStores = await fetchNearbyStores(preferences.zipCode);
  } catch (error) {
    console.warn("Nearby store lookup failed, using local fallback locations.");
    console.warn(error.message);
  }

  const fallbackPlan = createFallbackPlan(userData, recipes, nearbyStores);

  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    return fallbackPlan;
  }

  try {
    const aiPlan = await generateAiMealPlan({
      userData,
      recipes,
      nearbyStores,
    });

    return {
      ...fallbackPlan,
      ...aiPlan,
      recipes: recipes.slice(0, 4),
      nearbyStores,
    };
  } catch (error) {
    console.warn("OpenAI request failed, using local fallback instead.");
    console.warn(error.message);
    return fallbackPlan;
  }
}

function validatePayload(payload) {
  const requiredBaselineFields = [
    "age",
    "height",
    "weight",
    "activityLevel",
    "healthyGoal",
    "healthConcern",
  ];
  const requiredPreferenceFields = ["zipCode", "path"];

  if (!payload || typeof payload !== "object") {
    throw new Error("Request body is missing.");
  }

  for (const key of requiredBaselineFields) {
    if (!payload.baseline?.[key]) {
      throw new Error(`Missing baseline field: ${key}`);
    }
  }

  for (const key of requiredPreferenceFields) {
    if (!payload.preferences?.[key]) {
      throw new Error(`Missing preferences field: ${key}`);
    }
  }
}

function createRecipeQuery(baseline, preferences) {
  const goalQueries = {
    "balanced-eating": "balanced healthy dinner",
    "weight-loss": "high fiber low calorie dinner",
    "energy-support": "high protein balanced meal",
    "muscle-support": "high protein meal prep",
    "family-friendly": "easy family dinner",
  };

  const healthQueries = {
    none: "",
    "blood-sugar-friendly": " low sugar whole grain",
    "low-sodium": " low sodium",
    "heart-conscious": " heart healthy",
    vegetarian: " vegetarian",
    "gluten-aware": " gluten free",
  };

  const budgetQuery =
    preferences.path === "budget" ? " affordable pantry staples" : "";

  return `${goalQueries[baseline.healthyGoal] || "healthy meal"}${
    healthQueries[baseline.healthConcern] || ""
  }${budgetQuery}`.trim();
}

async function fetchRecipes(query) {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!appId || !appKey) {
    return getFallbackRecipes();
  }

  const endpoint = new URL("https://api.edamam.com/api/recipes/v2");
  endpoint.searchParams.set("type", "public");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("app_id", appId);
  endpoint.searchParams.set("app_key", appKey);
  endpoint.searchParams.set("imageSize", "REGULAR");
  endpoint.searchParams.set("random", "true");
  ["label", "image", "url", "source", "ingredientLines"].forEach((field) => {
    endpoint.searchParams.append("field", field);
  });

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Edamam recipe request failed.");
  }

  const data = await response.json();

  if (!Array.isArray(data.hits) || data.hits.length === 0) {
    return getFallbackRecipes();
  }

  return data.hits.slice(0, 4).map((hit) => ({
    label: hit.recipe.label,
    image: hit.recipe.image,
    url: hit.recipe.url,
    source: hit.recipe.source,
    description: summarizeIngredients(hit.recipe.ingredientLines),
  }));
}

function summarizeIngredients(ingredients = []) {
  if (!ingredients.length) {
    return "A practical recipe built around simple ingredients.";
  }

  return ingredients.slice(0, 3).join(", ");
}

async function fetchNearbyStores(zipCode) {
  const isNycZip = getBoroughFromZip(zipCode);

  if (!isNycZip) {
    return LOCAL_SUPPORT_LOCATIONS.slice(0, 3);
  }

  const supportLocations = [];

  const endpoints = [
    "https://data.cityofnewyork.us/resource/tc6u-8rnp.json?$limit=10",
    "https://data.cityofnewyork.us/resource/9d9t-bmk7.json?$limit=10",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        continue;
      }

      const rows = await response.json();
      supportLocations.push(...normalizeLocations(rows, zipCode));
    } catch (error) {
      console.warn(`NYC Open Data request failed for ${endpoint}`);
    }
  }

  const localMatches = LOCAL_SUPPORT_LOCATIONS.filter(
    (location) => location.borough === getBoroughFromZip(zipCode)
  );

  const combinedLocations = dedupeLocations([...supportLocations, ...localMatches]);

  if (!combinedLocations.length) {
    return localMatches.length ? localMatches : LOCAL_SUPPORT_LOCATIONS.slice(0, 3);
  }

  return combinedLocations.slice(0, 5);
}

function normalizeLocations(rows, zipCode) {
  const borough = getBoroughFromZip(zipCode);

  return rows
    .map((row) => {
      const name =
        row.center_name ||
        row.center ||
        row.site_name ||
        row.name ||
        row.facility_name ||
        row.program_name;
      const address = [row.street_address, row.address, row.location]
        .find(Boolean);
      const rowZip = String(
        row.zip ||
          row.zip_code ||
          row.postcode ||
          row.postal_code ||
          row.zipcode ||
          ""
      ).slice(0, 5);

      if (!name || !address) {
        return null;
      }

      if (rowZip && rowZip !== zipCode && borough && getBoroughFromZip(rowZip) !== borough) {
        return null;
      }

      return {
        name,
        address,
        zipCode: rowZip || zipCode,
        acceptsCash: false,
        acceptsCard: false,
        acceptsBenefits: true,
      };
    })
    .filter(Boolean);
}

function dedupeLocations(locations) {
  const seen = new Set();

  return locations.filter((location) => {
    const key = `${location.name}|${location.address}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getBoroughFromZip(zipCode) {
  if (!/^\d{5}$/.test(zipCode || "")) {
    return null;
  }

  const match = NYC_BOROUGH_LOOKUP.find((entry) =>
    entry.prefixes.some((prefix) => zipCode.startsWith(prefix))
  );

  return match ? match.borough : null;
}

async function generateAiMealPlan({ userData, recipes, nearbyStores }) {
  const prompt = buildPrompt(userData, recipes, nearbyStores);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      reasoning: { effort: "low" },
      instructions:
        "You are a helpful nutrition planning assistant for a simple MVP web app. Return practical, supportive, beginner-friendly JSON only. Do not provide medical diagnosis or treatment advice. Keep recommendations realistic for grocery shopping and meal prep.",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "meal_plan",
          strict: true,
          schema: RESULTS_SCHEMA,
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI request failed.");
  }

  const directOutputText = data.output_text;

  if (directOutputText) {
    return JSON.parse(directOutputText);
  }

  const textResponse = data.output?.find((item) => item.type === "message");
  const content = textResponse?.content?.find(
    (item) => item.type === "output_text"
  );

  if (!content?.text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(content.text);
}

function buildPrompt(userData, recipes, nearbyStores) {
  const { baseline, preferences } = userData;

  return [
    "Create a beginner-friendly JSON response for Smart Meal Finder.",
    "User profile:",
    JSON.stringify(baseline, null, 2),
    "Food finder preferences:",
    JSON.stringify(preferences, null, 2),
    "Recipe candidates:",
    JSON.stringify(recipes, null, 2),
    "Nearby stores/support options:",
    JSON.stringify(nearbyStores, null, 2),
    "Requirements:",
    "- grocerySuggestions should be 6 to 8 short grocery items or ingredient ideas.",
    "- mealStrategy should be 2 to 3 short paragraphs in plain text and easy to understand.",
    "- budgetOrBenefitSummary should be 2 to 4 sentences focused on the selected path.",
    "- Support balanced, healthy meals and blood-sugar-friendly patterns when relevant.",
    "- Do not claim medical treatment or diagnosis.",
  ].join("\n");
}

function createFallbackPlan(userData, recipes, nearbyStores) {
  const { baseline, preferences } = userData;
  const groceries = buildFallbackGroceries(baseline, preferences);
  const strategy = buildFallbackStrategy(baseline, preferences, recipes);
  const summary = buildFallbackSummary(preferences, nearbyStores.length);

  return {
    grocerySuggestions: groceries,
    mealStrategy: strategy,
    budgetOrBenefitSummary: summary,
    recipes: recipes.slice(0, 4),
    nearbyStores,
  };
}

function buildFallbackGroceries(baseline, preferences) {
  const commonItems = ["brown rice", "rolled oats", "beans", "spinach", "eggs"];

  if (baseline.healthConcern === "blood-sugar-friendly") {
    commonItems.push("berries", "Greek yogurt");
  } else if (baseline.healthConcern === "low-sodium") {
    commonItems.push("no-salt beans", "fresh herbs");
  } else if (baseline.healthConcern === "vegetarian") {
    commonItems.push("tofu", "lentils");
  } else {
    commonItems.push("chicken breast", "frozen vegetables");
  }

  if (preferences.path === "budget") {
    commonItems.push("peanut butter");
  } else {
    commonItems.push("whole grain bread");
  }

  return commonItems.slice(0, 8);
}

function buildFallbackStrategy(baseline, preferences, recipes) {
  const recipeNames = recipes.slice(0, 2).map((recipe) => recipe.label).join(" and ");
  const pathText =
    preferences.path === "budget"
      ? `Use your ${formatBudgetRange(preferences.weeklyBudget)} weekly budget to center meals on affordable staples and one or two fresh items that stretch across several meals.`
      : `Use your ${formatBenefitType(preferences.benefitType)} benefits to build meals around filling basics, frozen produce, and recipes that use overlapping ingredients.`;

  const healthText =
    baseline.healthConcern === "blood-sugar-friendly"
      ? "Aim for meals that pair fiber, protein, and slower-digesting carbs so your plate feels steady and balanced."
      : "Try to keep each meal balanced with a protein, a vegetable, and a satisfying carbohydrate source.";

  return `${pathText}\n\n${healthText} A simple pattern is breakfast with oats or eggs, lunch built from leftovers or grain bowls, and dinner using recipes like ${recipeNames || "the recipe ideas below"}.`;
}

function buildFallbackSummary(preferences, nearbyStoreCount) {
  if (preferences.path === "budget") {
    return `Your budget path focuses on lower-cost ingredients that can be used in several meals during the week. We also found ${nearbyStoreCount} nearby food support or shopping options to help stretch your plan.`;
  }

  return `Your benefit path focuses on simple, realistic meals that work well with food assistance support. We also found ${nearbyStoreCount} nearby support locations that may help you access grocery or benefit services.`;
}

function formatBudgetRange(value) {
  return value ? `$${value.replace("-", " to $")}` : "your";
}

function formatBenefitType(value) {
  const labels = {
    snap: "SNAP / EBT",
    wic: "WIC",
    "pantry-support": "pantry support",
    "senior-benefits": "senior food benefits",
  };

  return labels[value] || "food";
}

function getFallbackRecipes() {
  return [
    {
      label: "Veggie Egg Bowl",
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
      url: "https://www.edamam.com/",
      source: "Sample recipe",
      description: "Eggs, spinach, peppers, and brown rice.",
    },
    {
      label: "Beans and Rice Skillet",
      image:
        "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
      url: "https://www.edamam.com/",
      source: "Sample recipe",
      description: "Black beans, brown rice, tomatoes, and spices.",
    },
    {
      label: "Oats and Berry Breakfast Jar",
      image:
        "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=900&q=80",
      url: "https://www.edamam.com/",
      source: "Sample recipe",
      description: "Rolled oats, berries, yogurt, and seeds.",
    },
    {
      label: "Sheet Pan Chicken and Veggies",
      image:
        "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
      url: "https://www.edamam.com/",
      source: "Sample recipe",
      description: "Chicken, carrots, broccoli, and potatoes.",
    },
  ];
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const rawEnv = fs.readFileSync(filePath, "utf8");

  rawEnv.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(rawBody || "{}"));
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

async function serveStaticFile(requestPath, response, method = "GET") {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = path.join(ROOT_DIR, safePath);

  if (!resolvedPath.startsWith(ROOT_DIR)) {
    sendJson(response, 403, { error: "Forbidden." });
    return;
  }

  try {
    const fileContents = await fs.promises.readFile(resolvedPath);
    const extension = path.extname(resolvedPath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    });
    response.end(method === "HEAD" ? undefined : fileContents);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: "File not found." });
      return;
    }

    throw error;
  }
}

function sendJson(response, statusCode, data) {
  const body = JSON.stringify(data ?? {});
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

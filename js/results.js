(function () {
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const errorMessage = document.getElementById("error-message");
  const resultsContent = document.getElementById("results-content");

  const summaryTitle = document.getElementById("summary-title");
  const summaryText = document.getElementById("summary-text");
  const groceryList = document.getElementById("grocery-list");
  const mealStrategy = document.getElementById("meal-strategy");
  const recipeGrid = document.getElementById("recipe-grid");
  const storesList = document.getElementById("stores-list");
  const restartButton = document.getElementById("restart-button");

  if (
    !loadingState ||
    !errorState ||
    !errorMessage ||
    !resultsContent ||
    !summaryTitle ||
    !summaryText ||
    !groceryList ||
    !mealStrategy ||
    !recipeGrid ||
    !storesList
  ) {
    console.error("Results page elements are missing.");
    return;
  }

  function showLoading() {
    loadingState.classList.remove("is-hidden");
    errorState.classList.add("is-hidden");
    resultsContent.classList.add("is-hidden");
  }

  function showError(message) {
    loadingState.classList.add("is-hidden");
    resultsContent.classList.add("is-hidden");
    errorState.classList.remove("is-hidden");
    errorMessage.textContent =
      message || "Something went wrong while building your meal plan.";
  }

  function showResults() {
    loadingState.classList.add("is-hidden");
    errorState.classList.add("is-hidden");
    resultsContent.classList.remove("is-hidden");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatPathLabel(path) {
    if (path === "budget") return "Budget";
    if (path === "benefit") return "Benefit";
    return "Meal";
  }

  function formatBudgetLabel(value) {
    const labels = {
      "under-50": "Under $50",
      "50-75": "$50 - $75",
      "75-100": "$75 - $100",
      "100-150": "$100 - $150",
      "150-plus": "$150+",
    };

    return labels[value] || value || "";
  }

  function formatBenefitTypeLabel(value) {
    const labels = {
      snap: "SNAP",
      wic: "WIC",
      "senior-benefits": "Senior benefits",
      "general-assistance": "General assistance",
      "not-sure": "Not sure yet",
      "pantry-support": "Pantry support",
    };

    return labels[value] || value || "";
  }

  function buildSummaryText(payload, result) {
    const baseline = payload.baseline || {};
    const preferences = payload.preferences || {};

    const parts = [
      `Based on your profile, this ${formatPathLabel(
        preferences.path
      ).toLowerCase()} path was built for a ${baseline.activityLevel || "general"} lifestyle and a goal of ${
        baseline.healthyGoal || "balanced eating"
      }.`,
    ];

    if (preferences.path === "budget" && preferences.weeklyBudget) {
      parts.push(
        `Your weekly budget range is ${formatBudgetLabel(preferences.weeklyBudget)}.`
      );
    }

    if (preferences.path === "benefit" && preferences.benefitType) {
      parts.push(
        `Your selected support type is ${formatBenefitTypeLabel(
          preferences.benefitType
        )}.`
      );
    }

    if (result && result.budgetOrBenefitSummary) {
      parts.push(result.budgetOrBenefitSummary);
    }

    return parts.join(" ");
  }

  function renderSummary(payload, result) {
    const pathLabel = formatPathLabel(payload.preferences?.path);
    summaryTitle.textContent = `${pathLabel} meal guidance`;
    summaryText.textContent = buildSummaryText(payload, result);
  }

  function renderGroceries(items) {
    groceryList.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
      groceryList.innerHTML = "<li>No grocery suggestions available yet.</li>";
      return;
    }

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      groceryList.appendChild(li);
    });
  }

  function renderMealStrategy(strategyText) {
    mealStrategy.innerHTML = "";

    if (!strategyText) {
      mealStrategy.innerHTML =
        "<p>No meal strategy is available right now.</p>";
      return;
    }

    const paragraphs = String(strategyText)
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (!paragraphs.length) {
      const p = document.createElement("p");
      p.textContent = strategyText;
      mealStrategy.appendChild(p);
      return;
    }

    paragraphs.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      mealStrategy.appendChild(p);
    });
  }

  function renderRecipes(recipes) {
    recipeGrid.innerHTML = "";

    if (!Array.isArray(recipes) || recipes.length === 0) {
      recipeGrid.innerHTML =
        '<p class="empty-copy">No recipe ideas are available right now.</p>';
      return;
    }

    recipes.forEach((recipe) => {
      const article = document.createElement("article");
      article.className = "recipe-card";

      const image = document.createElement("img");
      image.className = "recipe-image";
      image.src = recipe.image || "";
      image.alt = recipe.label || "Recipe image";
      image.loading = "lazy";

      const body = document.createElement("div");
      body.className = "recipe-body";

      const title = document.createElement("h4");
      title.textContent = recipe.label || "Recipe idea";

      const text = document.createElement("p");
      text.className = "recipe-text";
      text.textContent =
        recipe.description || "A simple recipe idea for your week.";

      const source = document.createElement("p");
      source.className = "recipe-text";
      source.textContent = recipe.source ? `Source: ${recipe.source}` : "";

      body.appendChild(title);
      body.appendChild(text);

      if (recipe.source) {
        body.appendChild(source);
      }

      if (recipe.url) {
        const link = document.createElement("a");
        link.className = "recipe-link";
        link.href = recipe.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "View recipe";
        body.appendChild(link);
      }

      article.appendChild(image);
      article.appendChild(body);
      recipeGrid.appendChild(article);
    });
  }

  function renderStores(stores) {
    storesList.innerHTML = "";

    if (!Array.isArray(stores) || stores.length === 0) {
      storesList.innerHTML =
        '<p class="empty-copy">No nearby support options are available right now.</p>';
      return;
    }

    stores.forEach((store) => {
      const card = document.createElement("article");
      card.className = "store-card";

      const title = document.createElement("h4");
      title.textContent = store.name || "Nearby support location";

      const address = document.createElement("p");
      address.className = "stores-meta";
      address.textContent = store.address || "Address not available";

      const zip = document.createElement("p");
      zip.className = "stores-meta";
      zip.textContent = store.zipCode ? `ZIP: ${store.zipCode}` : "";

      const badges = document.createElement("div");
      badges.className = "store-badges";

      const badgeData = [
        store.acceptsCash ? "Cash" : null,
        store.acceptsCard ? "Card" : null,
        store.acceptsBenefits ? "Benefits" : null,
      ].filter(Boolean);

      badgeData.forEach((label) => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = label;
        badges.appendChild(badge);
      });

      card.appendChild(title);
      card.appendChild(address);

      if (store.zipCode) {
        card.appendChild(zip);
      }

      if (badgeData.length) {
        card.appendChild(badges);
      }

      storesList.appendChild(card);
    });
  }

  function validatePayload(payload) {
    const baseline = payload && payload.baseline;
    const preferences = payload && payload.preferences;

    if (!baseline || !preferences) {
      return "We could not find your saved form data. Please start again.";
    }

    const requiredBaselineFields = [
      "age",
      "height",
      "weight",
      "activityLevel",
      "healthyGoal",
      "healthConcern",
    ];

    const requiredPreferenceFields = ["zipCode", "path"];

    for (const field of requiredBaselineFields) {
      if (!baseline[field]) {
        return `Missing baseline field: ${field}. Please go back and complete the form.`;
      }
    }

    for (const field of requiredPreferenceFields) {
      if (!preferences[field]) {
        return `Missing preferences field: ${field}. Please go back and complete the form.`;
      }
    }

    return "";
  }

  async function fetchMealPlan(payload) {
    const response = await fetch("/api/meal-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = null;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(
        data && data.error
          ? data.error
          : "The server could not build your meal plan."
      );
    }

    return data;
  }

  async function initResultsPage() {
    showLoading();

    const payload = window.getMealFinderData ? window.getMealFinderData() : null;
    const validationError = validatePayload(payload);

    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      const result = await fetchMealPlan(payload);

      renderSummary(payload, result);
      renderGroceries(result.grocerySuggestions);
      renderMealStrategy(result.mealStrategy);
      renderRecipes(result.recipes);
      renderStores(result.nearbyStores);

      showResults();
    } catch (error) {
      showError(error.message);
    }
  }

  if (restartButton) {
    restartButton.addEventListener("click", () => {
      if (window.clearMealFinderData) {
        window.clearMealFinderData();
      }

      window.location.href = "./baseline.html";
    });
  }

  initResultsPage();
})();
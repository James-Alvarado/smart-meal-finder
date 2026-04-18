(function () {
  const form = document.getElementById("preferences-form");
  const zipInput = document.getElementById("zipCode");
  const errorText = document.getElementById("preferences-error");
  const formActions = document.querySelector(".form-actions");

  const budgetSection = document.querySelector(".budget-only");
  const benefitSection = document.querySelector(".benefit-only");
  const questionCards = Array.from(document.querySelectorAll(".question-card"));
  const pathInputs = Array.from(document.querySelectorAll('input[name="path"]'));

  if (!form || !zipInput || !window.createCustomDropdown || !window.savePreferences) {
    console.error("Preferences page dependencies are missing.");
    return;
  }

  const existingData = window.getPreferences ? window.getPreferences() || {} : {};

  const weeklyBudgetDropdown = createCustomDropdown({
    hostId: "weeklyBudget-dropdown",
    name: "weeklyBudget",
    placeholder: "Select your weekly budget",
    value: existingData.weeklyBudget || "",
    options: [
      { value: "under-50", label: "Under $50" },
      { value: "50-75", label: "$50 - $75" },
      { value: "75-100", label: "$75 - $100" },
      { value: "100-150", label: "$100 - $150" },
      { value: "150-plus", label: "$150+" },
    ],
    onChange: handleProgressUpdate,
  });

  const benefitTypeDropdown = createCustomDropdown({
    hostId: "benefitType-dropdown",
    name: "benefitType",
    placeholder: "Select your benefit type",
    value: existingData.benefitType || "",
    options: [
      { value: "snap", label: "SNAP" },
      { value: "wic", label: "WIC" },
      { value: "senior-benefits", label: "Senior benefits" },
      { value: "general-assistance", label: "General assistance" },
      { value: "not-sure", label: "Not sure yet" },
    ],
    onChange: handleProgressUpdate,
  });

  if (existingData.zipCode) {
    zipInput.value = existingData.zipCode;
  }

  if (existingData.path) {
    const matchingPath = pathInputs.find((input) => input.value === existingData.path);
    if (matchingPath) {
      matchingPath.checked = true;
    }
  }

  function getSelectedPath() {
    const selected = pathInputs.find((input) => input.checked);
    return selected ? selected.value : "";
  }

  function getFormData() {
    const path = getSelectedPath();

    return {
      zipCode: zipInput.value.trim(),
      path,
      weeklyBudget: path === "budget" ? weeklyBudgetDropdown.getValue() : "",
      benefitType: path === "benefit" ? benefitTypeDropdown.getValue() : "",
    };
  }

  function isValidZip(zipCode) {
    return /^\d{5}$/.test(zipCode);
  }

  function toggleConditionalFields(path) {
    const showBudget = path === "budget";
    const showBenefit = path === "benefit";

    if (budgetSection) {
      budgetSection.classList.toggle("is-hidden", !showBudget);
    }

    if (benefitSection) {
      benefitSection.classList.toggle("is-hidden", !showBenefit);
    }
  }

  function isComplete(data) {
    if (!isValidZip(data.zipCode) || !data.path) {
      return false;
    }

    if (data.path === "budget" && !data.weeklyBudget) {
      return false;
    }

    if (data.path === "benefit" && !data.benefitType) {
      return false;
    }

    return true;
  }

  function updateActionVisibility(data) {
    if (formActions) {
      formActions.classList.toggle("is-ready", isComplete(data));
    }
  }

  function updateCardStates(data) {
    const values = [
      isValidZip(data.zipCode) ? data.zipCode : "",
      data.path,
      data.path === "budget" ? data.weeklyBudget : data.path === "benefit" ? data.benefitType : "",
    ];

    let firstIncompleteIndex = values.findIndex((value) => !value);
    if (firstIncompleteIndex === -1) {
      firstIncompleteIndex = values.length - 1;
    }

    questionCards.forEach((card, index) => {
      card.classList.remove("is-active", "is-complete");

      if (index < values.length && values[index]) {
        card.classList.add("is-complete");
      }

      if (index === firstIncompleteIndex) {
        card.classList.add("is-active");
      }
    });
  }

  function handleProgressUpdate() {
    const data = getFormData();
    toggleConditionalFields(data.path);
    updateActionVisibility(data);
    updateCardStates(data);
    errorText.textContent = "";
  }

  zipInput.addEventListener("input", () => {
    zipInput.value = zipInput.value.replace(/\D/g, "").slice(0, 5);
    handleProgressUpdate();
  });

  pathInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const path = getSelectedPath();

      if (path === "budget") {
        benefitTypeDropdown.clear();
      }

      if (path === "benefit") {
        weeklyBudgetDropdown.clear();
      }

      handleProgressUpdate();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = getFormData();

    if (!isValidZip(data.zipCode)) {
      errorText.textContent = "Please enter a valid 5-digit ZIP code.";
      handleProgressUpdate();
      return;
    }

    if (!data.path) {
      errorText.textContent = "Please choose either Budget or Benefit.";
      handleProgressUpdate();
      return;
    }

    if (data.path === "budget" && !data.weeklyBudget) {
      errorText.textContent = "Please select your weekly budget.";
      handleProgressUpdate();
      return;
    }

    if (data.path === "benefit" && !data.benefitType) {
      errorText.textContent = "Please select your benefit type.";
      handleProgressUpdate();
      return;
    }

    savePreferences(data);
    window.location.href = "./results.html";
  });

  handleProgressUpdate();
})();
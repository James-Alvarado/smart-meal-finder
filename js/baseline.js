(function () {
  const form = document.getElementById("baseline-form");
  const errorText = document.getElementById("baseline-error");
  const formActions = document.querySelector(".form-actions");
  const questionCards = Array.from(document.querySelectorAll(".question-card"));

  if (!form || !window.createCustomDropdown || !window.saveBaseline) {
    console.error("Baseline page dependencies are missing.");
    return;
  }

  const existingData = window.getBaseline ? window.getBaseline() || {} : {};

  const dropdowns = {
    age: createCustomDropdown({
      hostId: "age-dropdown",
      name: "age",
      placeholder: "Select your age",
      value: existingData.age || "",
      options: buildNumberOptions(18, 80),
      onChange: handleProgressUpdate,
    }),

    height: createCustomDropdown({
      hostId: "height-dropdown",
      name: "height",
      placeholder: "Select your height",
      value: existingData.height || "",
      options: [
        "5'0",
        "5'1",
        "5'2",
        "5'3",
        "5'4",
        "5'5",
        "5'6",
        "5'7",
        "5'8",
        "5'9",
        "5'10",
        "5'11",
        "6'0",
        "6'1",
        "6'2",
        "6'3",
        "6'4",
      ].map((item) => ({ value: item, label: item })),
      onChange: handleProgressUpdate,
    }),

    weight: createCustomDropdown({
      hostId: "weight-dropdown",
      name: "weight",
      placeholder: "Select your weight (lb)",
      value: existingData.weight || "",
      options: buildWeightOptions(90, 350, 5),
      onChange: handleProgressUpdate,
    }),

    activityLevel: createCustomDropdown({
      hostId: "activityLevel-dropdown",
      name: "activityLevel",
      placeholder: "Select your activity level",
      value: existingData.activityLevel || "",
      options: [
        { value: "low", label: "Low activity" },
        { value: "moderate", label: "Moderate activity" },
        { value: "active", label: "Active" },
        { value: "very-active", label: "Very active" },
      ],
      onChange: handleProgressUpdate,
    }),

    healthyGoal: createCustomDropdown({
      hostId: "healthyGoal-dropdown",
      name: "healthyGoal",
      placeholder: "Select your healthy goal",
      value: existingData.healthyGoal || "",
      options: [
        { value: "balanced-eating", label: "Balanced eating" },
        { value: "weight-loss", label: "Weight loss" },
        { value: "energy-support", label: "Energy support" },
        { value: "muscle-support", label: "Muscle support" },
        { value: "family-friendly", label: "Family-friendly meals" },
      ],
      onChange: handleProgressUpdate,
    }),

    healthConcern: createCustomDropdown({
      hostId: "healthConcern-dropdown",
      name: "healthConcern",
      placeholder: "Select a dietary concern",
      value: existingData.healthConcern || "",
      options: [
        { value: "none", label: "None" },
        { value: "blood-sugar-friendly", label: "Blood sugar friendly" },
        { value: "low-sodium", label: "Low sodium" },
        { value: "heart-conscious", label: "Heart conscious" },
        { value: "vegetarian", label: "Vegetarian" },
        { value: "gluten-aware", label: "Gluten aware" },
      ],
      onChange: handleProgressUpdate,
    }),
  };

  function buildNumberOptions(start, end) {
    const result = [];
    for (let number = start; number <= end; number += 1) {
      result.push({
        value: String(number),
        label: String(number),
      });
    }
    return result;
  }

  function buildWeightOptions(start, end, step) {
    const result = [];
    for (let number = start; number <= end; number += step) {
      result.push({
        value: String(number),
        label: `${number} lb`,
      });
    }
    return result;
  }

  function getFormData() {
    return {
      age: dropdowns.age.getValue(),
      height: dropdowns.height.getValue(),
      weight: dropdowns.weight.getValue(),
      activityLevel: dropdowns.activityLevel.getValue(),
      healthyGoal: dropdowns.healthyGoal.getValue(),
      healthConcern: dropdowns.healthConcern.getValue(),
    };
  }

  function isComplete(data) {
    return Object.values(data).every(Boolean);
  }

  function updateActionVisibility(data) {
    const ready = isComplete(data);
    if (formActions) {
      formActions.classList.toggle("is-ready", ready);
    }
  }

  function updateCardStates(data) {
    const values = [
      data.age,
      data.height,
      data.weight,
      data.activityLevel,
      data.healthyGoal,
      data.healthConcern,
    ];

    let firstIncompleteIndex = values.findIndex((value) => !value);
    if (firstIncompleteIndex === -1) {
      firstIncompleteIndex = values.length - 1;
    }

    questionCards.forEach((card, index) => {
      card.classList.remove("is-active", "is-complete");

      if (values[index]) {
        card.classList.add("is-complete");
      }

      if (index === firstIncompleteIndex) {
        card.classList.add("is-active");
      }
    });
  }

  function handleProgressUpdate() {
    const data = getFormData();
    updateActionVisibility(data);
    updateCardStates(data);
    errorText.textContent = "";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = getFormData();

    if (!isComplete(data)) {
      errorText.textContent = "Please complete all fields before continuing.";
      updateActionVisibility(data);
      updateCardStates(data);
      return;
    }

    saveBaseline(data);
    window.location.href = "./preferences.html";
  });

  handleProgressUpdate();
})();
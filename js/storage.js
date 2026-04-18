(function () {
  const BASELINE_KEY = "smartMealFinder_baseline";
  const PREFERENCES_KEY = "smartMealFinder_preferences";

  function saveBaseline(data) {
    try {
      localStorage.setItem(BASELINE_KEY, JSON.stringify(data || {}));
    } catch (error) {
      console.error("Failed to save baseline data:", error);
    }
  }

  function getBaseline() {
    try {
      const raw = localStorage.getItem(BASELINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Failed to read baseline data:", error);
      return null;
    }
  }

  function savePreferences(data) {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(data || {}));
    } catch (error) {
      console.error("Failed to save preferences data:", error);
    }
  }

  function getPreferences() {
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Failed to read preferences data:", error);
      return null;
    }
  }

  function getMealFinderData() {
    return {
      baseline: getBaseline(),
      preferences: getPreferences(),
    };
  }

  function clearMealFinderData() {
    try {
      localStorage.removeItem(BASELINE_KEY);
      localStorage.removeItem(PREFERENCES_KEY);
    } catch (error) {
      console.error("Failed to clear meal finder data:", error);
    }
  }

  window.saveBaseline = saveBaseline;
  window.getBaseline = getBaseline;
  window.savePreferences = savePreferences;
  window.getPreferences = getPreferences;
  window.getMealFinderData = getMealFinderData;
  window.clearMealFinderData = clearMealFinderData;
})();
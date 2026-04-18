(function () {
  function createCustomDropdown(config) {
    const {
      hostId,
      name,
      placeholder = "Select an option",
      options = [],
      value = "",
      onChange,
    } = config || {};

    const host = document.getElementById(hostId);

    if (!host) {
      console.error(`Dropdown host not found: ${hostId}`);
      return null;
    }

    const root = document.createElement("div");
    root.className = "custom-dropdown";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-dropdown-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const triggerLabel = document.createElement("span");
    triggerLabel.className = "custom-dropdown-trigger-label";
    triggerLabel.textContent = placeholder;

    const triggerIcon = document.createElement("span");
    triggerIcon.className = "custom-dropdown-trigger-icon";
    triggerIcon.setAttribute("aria-hidden", "true");
    triggerIcon.textContent = "⌄";

    trigger.appendChild(triggerLabel);
    trigger.appendChild(triggerIcon);

    const panel = document.createElement("div");
    panel.className = "custom-dropdown-panel";

    const optionsList = document.createElement("div");
    optionsList.className = "custom-dropdown-options";
    optionsList.setAttribute("role", "listbox");
    optionsList.setAttribute("aria-label", name || hostId);

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = name || "";
    hiddenInput.value = value || "";

    let selectedValue = value || "";
    let selectedLabel = placeholder;
    let isOpen = false;
    const optionButtons = [];

    function closeDropdown() {
      isOpen = false;
      root.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    function openDropdown() {
      isOpen = true;
      root.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");

      const selectedButton = optionButtons.find(
        (button) => button.dataset.value === selectedValue
      );

      if (selectedButton) {
        selectedButton.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }

    function updateTrigger() {
      triggerLabel.textContent = selectedLabel;

      if (selectedValue) {
        trigger.classList.add("has-value");
      } else {
        trigger.classList.remove("has-value");
      }
    }

    function selectOption(nextValue, nextLabel) {
      selectedValue = nextValue;
      selectedLabel = nextLabel;
      hiddenInput.value = nextValue;

      optionButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.value === nextValue);
        button.setAttribute(
          "aria-selected",
          button.dataset.value === nextValue ? "true" : "false"
        );
      });

      updateTrigger();
      closeDropdown();

      if (typeof onChange === "function") {
        onChange(nextValue, nextLabel);
      }
    }

    options.forEach((option) => {
      const optionValue = option.value;
      const optionLabel = option.label;

      if (optionValue === selectedValue) {
        selectedLabel = optionLabel;
      }

      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "custom-dropdown-option";
      optionButton.textContent = optionLabel;
      optionButton.dataset.value = optionValue;
      optionButton.setAttribute("role", "option");
      optionButton.setAttribute(
        "aria-selected",
        optionValue === selectedValue ? "true" : "false"
      );

      if (optionValue === selectedValue) {
        optionButton.classList.add("is-selected");
      }

      optionButton.addEventListener("click", () => {
        selectOption(optionValue, optionLabel);
      });

      optionButtons.push(optionButton);
      optionsList.appendChild(optionButton);
    });

    updateTrigger();

    trigger.addEventListener("click", () => {
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) {
        closeDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    });

    panel.appendChild(optionsList);
    root.appendChild(trigger);
    root.appendChild(panel);
    root.appendChild(hiddenInput);

    host.innerHTML = "";
    host.appendChild(root);

    return {
      getValue() {
        return selectedValue;
      },
      setValue(nextValue) {
        const found = options.find((option) => option.value === nextValue);
        if (!found) return;
        selectOption(found.value, found.label);
      },
      clear() {
        selectedValue = "";
        selectedLabel = placeholder;
        hiddenInput.value = "";
        optionButtons.forEach((button) => {
          button.classList.remove("is-selected");
          button.setAttribute("aria-selected", "false");
        });
        updateTrigger();
      },
    };
  }

  window.createCustomDropdown = createCustomDropdown;
})();
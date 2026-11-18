const choices = ["a", "b", "c", "d"];
const maximumQuestions = 1000;
const views = {
  setup: document.querySelector("#setup-view"),
  answers: document.querySelector("#answers-view"),
  key: document.querySelector("#key-view"),
  results: document.querySelector("#results-view"),
};
const setupForm = document.querySelector("#setup-form");
const questionCountInput = document.querySelector("#question-count");
const answerSheet = document.querySelector("#answer-sheet");
const keySheet = document.querySelector("#key-sheet");
const gradeButton = document.querySelector("#grade-button");
const resultList = document.querySelector("#result-list");
let questionCount = 0;

function createQuestion(number, groupName) {
  const card = document.createElement("section");
  card.className = "question-card";
  card.setAttribute("aria-labelledby", `${groupName}-title-${number}`);

  const heading = document.createElement("div");
  heading.className = "question-title";

  const numberLabel = document.createElement("span");
  numberLabel.className = "question-number";
  numberLabel.setAttribute("aria-hidden", "true");
  numberLabel.textContent = String(number).padStart(2, "0");

  const title = document.createElement("h3");
  title.className = "question-name";
  title.id = `${groupName}-title-${number}`;
  title.textContent = `Pregunta ${number}`;

  const isCorrectionQuestion = groupName === "key";
  const response = isCorrectionQuestion ? getSelectedValue(answerSheet, `answer-${number}`) : "";
  const responseNote = document.createElement("p");
  responseNote.className = "answer-review";
  responseNote.textContent = response
    ? `Marcaste: ${response.toUpperCase()}`
    : "No marcaste respuesta (en blanco).";

  const options = document.createElement("fieldset");
  options.className = "answer-options";
  options.setAttribute("aria-label", `Pregunta ${number}`);

  for (const choice of choices) {
    const label = document.createElement("label");
    label.className = "answer-option";
    if (isCorrectionQuestion && response === choice) {
      label.classList.add("is-user-answer");
    }

    const input = document.createElement("input");
    input.type = "radio";
    input.name = `${groupName}-${number}`;
    input.value = choice;
    input.setAttribute("aria-label", `Pregunta ${number}, opción ${choice.toUpperCase()}`);

    const face = document.createElement("span");
    face.className = "option-face";
    face.append(document.createTextNode(choice.toUpperCase()));

    const check = document.createElement("span");
    check.className = "option-check";
    check.setAttribute("aria-hidden", "true");
    check.innerHTML = '<svg viewBox="0 0 12 12"><path d="m2 6 2.5 2.5L10 3"></path></svg>';

    face.append(check);
    label.append(input, face);
    options.append(label);
  }

  heading.append(numberLabel, title);
  if (isCorrectionQuestion) {
    const feedback = document.createElement("p");
    feedback.className = "correction-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.hidden = true;
    card.append(heading, responseNote, options, feedback);
  } else {
    card.append(heading, options);
  }
  return card;
}

function createQuestions() {
  answerSheet.replaceChildren();
  keySheet.replaceChildren();

  for (let number = 1; number <= questionCount; number += 1) {
    answerSheet.append(createQuestion(number, "answer"));
    keySheet.append(createQuestion(number, "key"));
  }

  for (const id of ["answer-count-total", "key-count-total"]) {
    document.querySelector(`#${id}`).textContent = String(questionCount);
  }
  document.querySelector("#answer-total").textContent = `${questionCount} preguntas`;
  document.querySelector("#key-total").textContent = `${questionCount} preguntas`;
  document.querySelector("#answer-progress-track").setAttribute("aria-valuemax", String(questionCount));
  document.querySelector("#key-progress-track").setAttribute("aria-valuemax", String(questionCount));
  updateProgress(answerSheet, "answer-count", "answer-progress-track", "answer-progress-fill");
  updateProgress(keySheet, "key-count", "key-progress-track", "key-progress-fill");
}

function updateProgress(form, countId, trackId, fillId) {
  const answered = form.querySelectorAll("input:checked").length;
  document.querySelector(`#${countId}`).textContent = String(answered);
  document.querySelector(`#${trackId}`).setAttribute("aria-valuenow", String(answered));
  document.querySelector(`#${fillId}`).style.width = `${(answered / questionCount) * 100}%`;

  for (const card of form.querySelectorAll(".question-card")) {
    card.classList.toggle("is-answered", card.querySelector("input:checked") !== null);
  }

  if (form === keySheet) {
    gradeButton.disabled = answered !== questionCount;
  }
}

function showView(name) {
  for (const [viewName, view] of Object.entries(views)) {
    view.hidden = viewName !== name;
  }

  const currentStep = { setup: 1, answers: 2, key: 3, results: 4 }[name];
  for (const item of document.querySelectorAll(".step-item")) {
    const stepNumber = Number(item.dataset.step);
    item.classList.toggle("is-current", stepNumber === currentStep);
    item.classList.toggle("is-complete", stepNumber < currentStep);
    if (stepNumber === currentStep) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getSelectedValue(form, name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value ?? "";
}

function updateCorrection(number) {
  const response = getSelectedValue(answerSheet, `answer-${number}`);
  const key = getSelectedValue(keySheet, `key-${number}`);
  const card = keySheet.querySelectorAll(".question-card")[number - 1];
  const responseNote = card.querySelector(".answer-review");
  const feedback = card.querySelector(".correction-feedback");

  responseNote.textContent = response
    ? `Marcaste: ${response.toUpperCase()}`
    : "No marcaste respuesta (en blanco).";

  for (const option of card.querySelectorAll(".answer-option")) {
    const input = option.querySelector("input");
    option.classList.toggle("is-user-answer", input.value === response);
  }

  card.classList.remove("is-correct", "is-incorrect", "is-blank");
  if (!key) {
    feedback.hidden = true;
    feedback.textContent = "";
    return;
  }

  feedback.hidden = false;
  if (!response) {
    card.classList.add("is-blank");
    feedback.textContent = `En blanco. La opción correcta era ${key.toUpperCase()}.`;
  } else if (response === key) {
    card.classList.add("is-correct");
    feedback.textContent = `¡Correcta! Marcaste ${response.toUpperCase()} y la respuesta correcta es ${key.toUpperCase()}.`;
  } else {
    card.classList.add("is-incorrect");
    feedback.textContent = `Incorrecta. Marcaste ${response.toUpperCase()}; la respuesta correcta era ${key.toUpperCase()}.`;
  }
}

function renderResults() {
  let correct = 0;
  let incorrect = 0;
  let blank = 0;
  resultList.replaceChildren();

  for (let number = 1; number <= questionCount; number += 1) {
    const response = getSelectedValue(answerSheet, `answer-${number}`);
    const key = getSelectedValue(keySheet, `key-${number}`);
    const item = document.createElement("li");
    item.className = "result-card";

    const heading = document.createElement("div");
    heading.className = "result-heading";

    const title = document.createElement("h3");
    title.className = "question-name";
    title.textContent = `Pregunta ${number}`;

    const status = document.createElement("span");
    status.className = "result-status";

    const detail = document.createElement("p");
    detail.className = "result-detail";

    const optionSummary = document.createElement("div");
    optionSummary.className = "result-choices";
    optionSummary.setAttribute("aria-label", "Opciones, tu respuesta y respuesta correcta");

    for (const choice of choices) {
      const option = document.createElement("span");
      option.className = "result-choice";
      const labels = [];

      if (response === choice) {
        option.classList.add("is-selected");
        labels.push("Marcaste");
      }
      if (key === choice) {
        option.classList.add("is-correct");
        labels.push("Correcta");
      }

      const letter = document.createElement("span");
      letter.className = "result-choice-letter";
      letter.textContent = choice.toUpperCase();

      const label = document.createElement("span");
      label.className = "result-choice-label";
      label.textContent = labels.join(" · ");

      option.setAttribute(
        "aria-label",
        `Opción ${choice.toUpperCase()}${labels.length ? `, ${labels.join(" y ")}` : ""}`,
      );
      option.append(letter, label);
      optionSummary.append(option);
    }

    if (!response) {
      blank += 1;
      item.classList.add("result-blank");
      status.textContent = "En blanco";
      detail.textContent = `Sin responder. La opción correcta era ${key.toUpperCase()}.`;
    } else if (response === key) {
      correct += 1;
      item.classList.add("result-correct");
      status.textContent = "Correcta";
      detail.textContent = `Tu respuesta ${response.toUpperCase()} coincide con la correcta.`;
    } else {
      incorrect += 1;
      item.classList.add("result-incorrect");
      status.textContent = "Incorrecta";
      detail.textContent = `Marcaste ${response.toUpperCase()}. La opción correcta era ${key.toUpperCase()}.`;
    }

    heading.append(title, status);
    item.append(heading, optionSummary, detail);
    resultList.append(item);
  }

  const netCorrect = Math.max(0, correct - incorrect / 3);
  const unroundedScore = (netCorrect / questionCount) * 10;
  const score = Math.round((unroundedScore + Number.EPSILON) * 100) / 100;
  const scoreFormat = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  document.querySelector("#score-value").textContent = scoreFormat.format(score);
  document.querySelector("#correct-count").textContent = String(correct);
  document.querySelector("#incorrect-count").textContent = String(incorrect);
  document.querySelector("#blank-count").textContent = String(blank);
  document.querySelector("#results-total").textContent = `${questionCount} preguntas`;
  document.querySelector("#score-formula").textContent =
    `(${correct} − ${incorrect}/3 errores) ÷ ${questionCount} × 10; nota mínima: 0.`;
}

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const count = Number(questionCountInput.value);
  if (!Number.isSafeInteger(count) || count < 1 || count > maximumQuestions) {
    questionCountInput.setCustomValidity(`Indica un número entero entre 1 y ${maximumQuestions}.`);
    questionCountInput.reportValidity();
    return;
  }

  questionCountInput.setCustomValidity("");
  questionCount = count;
  createQuestions();
  showView("answers");
  answerSheet.querySelector("input")?.focus();
});

questionCountInput.addEventListener("input", () => {
  questionCountInput.setCustomValidity("");
});

answerSheet.addEventListener("change", (event) => {
  updateProgress(answerSheet, "answer-count", "answer-progress-track", "answer-progress-fill");
  const number = Number(event.target.name.slice("answer-".length));
  updateCorrection(number);
});

keySheet.addEventListener("change", (event) => {
  updateProgress(keySheet, "key-count", "key-progress-track", "key-progress-fill");
  const number = Number(event.target.name.slice("key-".length));
  updateCorrection(number);
});

document.querySelector("#change-count-button").addEventListener("click", () => {
  showView("setup");
  questionCountInput.focus();
});

document.querySelector("#to-key-button").addEventListener("click", () => {
  showView("key");
  keySheet.querySelector("input")?.focus();
});

document.querySelector("#back-to-answers-button").addEventListener("click", () => {
  showView("answers");
  answerSheet.querySelector("input")?.focus();
});

gradeButton.addEventListener("click", () => {
  if (keySheet.querySelectorAll("input:checked").length !== questionCount) {
    return;
  }

  renderResults();
  showView("results");
});

document.querySelector("#edit-test-button").addEventListener("click", () => {
  showView("key");
  keySheet.querySelector("input")?.focus();
});

document.querySelector("#new-test-button").addEventListener("click", () => {
  setupForm.reset();
  questionCount = 0;
  showView("setup");
  questionCountInput.focus();
});

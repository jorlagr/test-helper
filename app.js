const questionCount = 50;
const choices = ["a", "b", "c", "d"];
const answerSheet = document.querySelector("#answer-sheet");
const answeredCount = document.querySelector("#answered-count");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const resetButton = document.querySelector("#reset-button");

function createQuestion(number) {
  const card = document.createElement("section");
  card.className = "question-card";
  card.setAttribute("aria-labelledby", `question-title-${number}`);

  const heading = document.createElement("div");
  heading.className = "question-title";

  const numberLabel = document.createElement("span");
  numberLabel.className = "question-number";
  numberLabel.setAttribute("aria-hidden", "true");
  numberLabel.textContent = String(number).padStart(2, "0");

  const title = document.createElement("h3");
  title.className = "question-name";
  title.id = `question-title-${number}`;
  title.textContent = `Pregunta ${number}`;

  const options = document.createElement("div");
  options.className = "answer-options";

  for (const choice of choices) {
    const label = document.createElement("label");
    label.className = "answer-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = `question-${number}`;
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
  card.append(heading, options);
  return card;
}

for (let number = 1; number <= questionCount; number += 1) {
  answerSheet.append(createQuestion(number));
}

function updateProgress() {
  const answered = answerSheet.querySelectorAll("input:checked").length;
  answeredCount.textContent = String(answered);
  progressTrack.setAttribute("aria-valuenow", String(answered));
  progressFill.style.width = `${(answered / questionCount) * 100}%`;

  for (const card of answerSheet.querySelectorAll(".question-card")) {
    card.classList.toggle("is-answered", card.querySelector("input:checked") !== null);
  }
}

answerSheet.addEventListener("change", updateProgress);

resetButton.addEventListener("click", () => {
  answerSheet.reset();
  updateProgress();
  answerSheet.querySelector("input")?.focus();
});
